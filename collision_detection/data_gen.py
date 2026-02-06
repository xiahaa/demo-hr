import numpy as np
import random

def generate_trajectory_pair(batch_size=32, steps=32):
    """
    Generates a batch of trajectory pairs (4D: x, y, z, t).
    Normalized coordinates assumed [0, 1] for x, y, z, t.

    Returns:
        traj_a: (Batch, Steps, 4)  [x, y, z, t]
        traj_b: (Batch, Steps, 4)  [x, y, z, t]
        labels: (Batch,)           1 for collision, 0 for safe
        scenarios: list of strings describing the scenario
    """
    traj_a_list = []
    traj_b_list = []
    labels = []
    scenarios = []

    for _ in range(batch_size):
        # Weighted choice to ensure we have enough hard cases
        case = random.choices(
            ['collision', 'vertical_miss', 'temporal_miss', 'random_safe'],
            weights=[0.3, 0.3, 0.2, 0.2],
            k=1
        )[0]

        # Base trajectory A (linear + curve)
        t = np.linspace(0, 1, steps)

        # Start and end points for A (x, y, z)
        start_a = np.random.rand(3)
        end_a = np.random.rand(3)

        traj_a = np.zeros((steps, 4))
        traj_a[:, 3] = t # time is strictly increasing 0 to 1

        # Linear interpolation for position
        for i in range(3): # x, y, z
            traj_a[:, i] = np.linspace(start_a[i], end_a[i], steps)

        # Add climbing/descending curve (Sine wave modulation for Z)
        # This simulates non-linear altitude changes
        traj_a[:, 2] += 0.1 * np.sin(t * np.pi * 2)

        # Trajectory B setup
        traj_b = np.zeros((steps, 4))

        if case == 'collision':
            # Case 1: True Collision
            # B is very close to A in all dimensions
            traj_b = traj_a.copy()
            # Small noise
            noise = np.random.normal(0, 0.02, (steps, 4))
            traj_b += noise
            label = 1

        elif case == 'vertical_miss':
            # Case 2: Vertical Miss (Critical Constraint)
            # Match X, Y and T approximately
            traj_b = traj_a.copy()
            # Add noise to X, Y
            traj_b[:, 0:2] += np.random.normal(0, 0.02, (steps, 2))

            # Shift Z significantly (e.g., +/- 0.3)
            # If z goes out of 0-1 bounds, we clamp or wrap, but for voxelization
            # usually we want it to stay in "view".
            # Let's shift and clamp.
            z_shift = 0.3 if np.random.rand() > 0.5 else -0.3
            traj_b[:, 2] += z_shift
            label = 0

        elif case == 'temporal_miss':
            # Case 3: Temporal Miss
            # Match spatial path (X, Y, Z), but differ in Time.
            # Since our storage is (Steps, 4), "Time" is the 4th column.
            # If we just shift the T column values, it means "at step i, obj B is at time T_shifted".
            # But physically, it means B is at location (x,y,z) at a DIFFERENT time.

            # Copy spatial path
            traj_b[:, :3] = traj_a[:, :3]

            # Shift time values.
            # e.g. A is at loc L at t=0.5. B is at loc L at t=0.8.
            time_shift = 0.3
            traj_b[:, 3] = t + time_shift if np.random.rand() > 0.5 else t - time_shift

            # Add small spatial noise
            traj_b[:, :3] += np.random.normal(0, 0.01, (steps, 3))
            label = 0

        else: # random_safe
            # Completely different path
            start_b = np.random.rand(3)
            end_b = np.random.rand(3)

            # Random time span (still roughly 0-1)
            traj_b[:, 3] = t

            for i in range(3):
                traj_b[:, i] = np.linspace(start_b[i], end_b[i], steps)

            label = 0

        traj_a_list.append(traj_a)
        traj_b_list.append(traj_b)
        labels.append(label)
        scenarios.append(case)

    return np.array(traj_a_list, dtype=np.float32), np.array(traj_b_list, dtype=np.float32), np.array(labels, dtype=np.float32), scenarios

if __name__ == "__main__":
    ta, tb, l, s = generate_trajectory_pair(5)
    print("Generated shapes:", ta.shape, tb.shape)
    print("Labels:", l)
    print("Scenarios:", s)
