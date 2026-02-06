import torch
import numpy as np
from collision_detection.data_gen import generate_trajectory_pair
from collision_detection.preprocessing import traj_to_multiview
from collision_detection.model import DualStreamIntersectionNet

def test_pipeline():
    print("=== Starting Pipeline Test ===")

    # 1. Generate Data
    print("Generating mock data...")
    batch_size = 4
    traj_a, traj_b, labels, scenarios = generate_trajectory_pair(batch_size=batch_size, steps=32)
    print(f"Generated {batch_size} pairs.")
    print(f"Scenarios: {scenarios}")

    # 2. Preprocess
    print("\nPreprocessing (Voxelization)...")
    view_xyt, view_zt = traj_to_multiview(traj_a, traj_b)
    print(f"View XYT Shape: {view_xyt.shape}")
    print(f"View ZT Shape:  {view_zt.shape}")

    assert view_xyt.shape == (batch_size, 2, 32, 32, 32)
    assert view_zt.shape == (batch_size, 2, 32, 32, 32)

    # 3. Model Inference
    print("\nInitializing Model...")
    model = DualStreamIntersectionNet()
    model.eval()

    print("Running Inference...")
    with torch.no_grad():
        probs = model(view_xyt, view_zt)

    print("\nResults:")
    for i in range(batch_size):
        p = probs[i, 0].item()
        print(f"Sample {i} [{scenarios[i]}]: Label={labels[i]}, Pred={p:.4f}")

    print("\n=== Test Complete ===")

if __name__ == "__main__":
    test_pipeline()
