import torch
import torch.nn as nn
import numpy as np
import pandas as pd
from traffic_prediction.model import normalize_adjacency

def train_model(model, adj, flow_data, seq_len=6, epochs=5):
    """
    Train the model using generated flow data.
    """
    # 1. Prepare Data
    adj_norm = normalize_adjacency(adj)

    start_date = pd.Timestamp('2025-01-01')
    total_hours = len(flow_data)

    X_list = []
    Y_list = []
    T_list = []

    # Create sliding window samples
    # Input: [t, t+1, ..., t+seq-1] -> Predict: [t+seq]
    for i in range(total_hours - seq_len):
        x_seq = flow_data[i : i+seq_len] # (Seq, Nodes)
        y_target = flow_data[i+seq_len]  # (Nodes,)

        # Target time features
        target_time = start_date + pd.Timedelta(hours=i+seq_len)
        day = target_time.dayofweek
        hour = target_time.hour

        X_list.append(x_seq)
        Y_list.append(y_target)
        T_list.append([day, hour])

    X = torch.tensor(np.array(X_list), dtype=torch.float32).unsqueeze(-1) # (B, Seq, N, 1)
    Y = torch.tensor(np.array(Y_list), dtype=torch.float32).unsqueeze(-1) # (B, N, 1)
    T = torch.tensor(np.array(T_list), dtype=torch.float32) # (B, 2)

    # 2. Training Loop
    optimizer = torch.optim.Adam(model.parameters(), lr=0.005)
    criterion = nn.MSELoss()

    model.train()
    print("Starting training...")
    for epoch in range(epochs):
        optimizer.zero_grad()
        out = model(X, adj_norm, T)
        loss = criterion(out, Y)
        loss.backward()
        optimizer.step()
        print(f"Epoch {epoch+1}/{epochs}, Loss: {loss.item():.4f}")

    return model, adj_norm

def predict_inference(model, target_ts, historical_stats, adj_norm, seq_len=6):
    """
    Inference for a future time point using Historical Statistics + Time Features.

    Args:
        model: Trained TGCN model.
        target_ts: Timestamp (pd.Timestamp) or int (ms).
        historical_stats: (7, 24, Nodes) numpy array.
        adj_norm: Normalized Adjacency Tensor.
        seq_len: Sequence length used by model.

    Returns:
        predicted_flows: (Nodes,) numpy array.
    """
    if isinstance(target_ts, (int, float)):
         target_ts = pd.Timestamp(target_ts, unit='ms')

    # Logic: To predict flow at T, we need input sequence [T-seq, ..., T-1]
    # We populate this sequence using Historical Averages.

    input_seq = []
    for i in range(seq_len, 0, -1):
        past_ts = target_ts - pd.Timedelta(hours=i)
        d = past_ts.dayofweek
        h = past_ts.hour

        vals = historical_stats[d, h, :] # (Nodes,)
        input_seq.append(vals)

    # (Seq, Nodes) -> (1, Seq, Nodes, 1)
    x_in = torch.tensor(np.array(input_seq), dtype=torch.float32).unsqueeze(0).unsqueeze(-1)

    # Target Time Features
    t_feat = torch.tensor([[target_ts.dayofweek, target_ts.hour]], dtype=torch.float32) # (1, 2)

    model.eval()
    with torch.no_grad():
        out = model(x_in, adj_norm, t_feat) # (1, Nodes, 1)

    return out.squeeze(0).squeeze(-1).numpy()
