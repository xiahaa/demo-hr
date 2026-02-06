import numpy as np
import torch

def traj_to_multiview(traj_a, traj_b, grid_size=32):
    """
    Converts trajectory pairs to dual-view voxel grids.

    Args:
        traj_a: (Batch, Steps, 4) array/tensor [x, y, z, t]
        traj_b: (Batch, Steps, 4) array/tensor [x, y, z, t]
        grid_size: int, dimension of the voxel grid (default 32)

    Returns:
        view_xyt: (Batch, 2, grid_size, grid_size, grid_size) Tensor
                  Dimensions: [Channels, Time, Height(Y), Width(X)]
        view_zt:  (Batch, 2, grid_size, grid_size, grid_size) Tensor
                  Dimensions: [Channels, Time, Height(Z), Width(XY_proj)]
    """
    # Ensure inputs are numpy
    if isinstance(traj_a, torch.Tensor):
        traj_a = traj_a.detach().cpu().numpy()
    if isinstance(traj_b, torch.Tensor):
        traj_b = traj_b.detach().cpu().numpy()

    batch_size = traj_a.shape[0]
    steps = traj_a.shape[1]

    # Initialize grids
    # view_xyt: (Batch, C=2, Time, Y, X)
    view_xyt = np.zeros((batch_size, 2, grid_size, grid_size, grid_size), dtype=np.float32)
    # view_zt: (Batch, C=2, Time, Z, XY_proj)
    view_zt = np.zeros((batch_size, 2, grid_size, grid_size, grid_size), dtype=np.float32)

    def get_idx(val):
        """Maps continuous 0-1 value to 0-(grid_size-1). Returns -1 if out of bounds."""
        if val < 0 or val > 1.0:
            return -1
        idx = int(val * grid_size)
        return min(grid_size - 1, idx)

    for b in range(batch_size):
        for t_step in range(steps):
            # Process Trajectory A
            xa, ya, za, ta = traj_a[b, t_step]

            idx_ta = get_idx(ta)
            idx_xa = get_idx(xa)
            idx_ya = get_idx(ya)
            idx_za = get_idx(za)
            idx_xya = get_idx((xa + ya) / 2.0)

            # Only fill if Time is within bounds
            if idx_ta != -1:
                # View 1: XYT (Time, Y, X)
                if idx_xa != -1 and idx_ya != -1:
                    view_xyt[b, 0, idx_ta, idx_ya, idx_xa] = 1.0

                # View 2: ZT (Time, Z, XY_proj)
                if idx_za != -1 and idx_xya != -1:
                    view_zt[b, 0, idx_ta, idx_za, idx_xya] = 1.0

            # Process Trajectory B
            xb, yb, zb, tb = traj_b[b, t_step]

            idx_tb = get_idx(tb)
            idx_xb = get_idx(xb)
            idx_yb = get_idx(yb)
            idx_zb = get_idx(zb)
            idx_xyb = get_idx((xb + yb) / 2.0)

            if idx_tb != -1:
                # View 1
                if idx_xb != -1 and idx_yb != -1:
                    view_xyt[b, 1, idx_tb, idx_yb, idx_xb] = 1.0

                # View 2
                if idx_zb != -1 and idx_xyb != -1:
                    view_zt[b, 1, idx_tb, idx_zb, idx_xyb] = 1.0

    return torch.tensor(view_xyt), torch.tensor(view_zt)
