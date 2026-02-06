from fastapi import FastAPI, HTTPException
from contextlib import asynccontextmanager
from pydantic import BaseModel
import torch
import pandas as pd
from traffic_prediction.data_gen import generate_traffic_data
from traffic_prediction.model import TGCN
from traffic_prediction.engine import train_model, predict_inference

# Global state
app_state = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print("Generating Mock Data...")
    adj, flow, stats = generate_traffic_data(num_nodes=20, num_days=90)

    print("Initializing Model...")
    model = TGCN(num_nodes=20)

    print("Training Model (Prototype: 5 epochs)...")
    # Training
    model, adj_norm = train_model(model, adj, flow, epochs=5)

    app_state['model'] = model
    app_state['stats'] = stats
    app_state['adj_norm'] = adj_norm
    app_state['seq_len'] = 6

    yield

    # Shutdown
    app_state.clear()

app = FastAPI(lifespan=lifespan)

class PredictionRequest(BaseModel):
    node_id: str
    start_time: int # timestamp ms
    end_time: int

@app.post("/predict_flow")
async def predict_flow(req: PredictionRequest):
    try:
        # Parse node_id "site_001" -> 1
        # If bare number, use it.
        # Assuming format site_XXX where XXX is number.
        # But my gen uses 0-19.
        # If user passes site_001 -> 1.
        if "site_" in req.node_id:
             n_idx = int(req.node_id.split("_")[1])
        else:
             # try parse int
             try:
                 n_idx = int(req.node_id)
             except:
                 # Hash it? Or just error.
                 # Mock: site_001 -> 1.
                 raise HTTPException(status_code=400, detail="Invalid node_id format. Use 'site_ID' or integer.")

        if n_idx < 0 or n_idx >= 20:
            raise HTTPException(status_code=400, detail="Node ID out of range (0-19)")

        # Parse time
        target_ts = req.start_time

        model = app_state['model']
        stats = app_state['stats']
        adj_norm = app_state['adj_norm']
        seq_len = app_state['seq_len']

        # Inference
        # Returns (Nodes,)
        preds = predict_inference(model, target_ts, stats, adj_norm, seq_len)

        val = float(preds[n_idx])

        return {"predicted_flow": int(val)}

    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
