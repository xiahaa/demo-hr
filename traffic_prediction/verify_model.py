import torch
import numpy as np
from traffic_prediction.model import TGCN, normalize_adjacency

def verify():
    B = 2
    Seq = 4
    N = 20
    F = 1

    # Mock Input
    x = torch.randn(B, Seq, N, F)
    # Mock Adjacency
    adj = np.random.randint(0, 2, (N, N))
    adj_norm = normalize_adjacency(adj)
    # Mock Time Feat
    time_feat = torch.tensor([[0, 10], [6, 20]], dtype=torch.float) # (B, 2)

    model = TGCN(num_nodes=N)

    out = model(x, adj_norm, time_feat)

    print(f"Input X: {x.shape}")
    print(f"Adj Norm: {adj_norm.shape}")
    print(f"Time Feat: {time_feat.shape}")
    print(f"Output: {out.shape}")

    assert out.shape == (B, N, 1)
    print("Verification Passed!")

if __name__ == "__main__":
    verify()
