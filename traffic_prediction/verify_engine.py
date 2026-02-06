import torch
import pandas as pd
from traffic_prediction.data_gen import generate_traffic_data
from traffic_prediction.model import TGCN
from traffic_prediction.engine import train_model, predict_inference

def verify():
    # 1. Gen Data
    adj, flow, stats = generate_traffic_data(num_nodes=5, num_days=2) # Small

    # 2. Init Model
    model = TGCN(num_nodes=5)

    # 3. Train
    model, adj_norm = train_model(model, adj, flow, seq_len=3, epochs=2)

    # 4. Predict
    target = pd.Timestamp('2025-06-01 10:00')
    pred = predict_inference(model, target, stats, adj_norm, seq_len=3)

    print("Predicted flow shape:", pred.shape)
    print("Prediction:", pred)
    assert pred.shape == (5,)
    print("Engine Verification Passed!")

if __name__ == "__main__":
    verify()
