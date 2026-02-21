# Traffic Prediction Service (T-GCN)

This service implements a Spatial-Temporal Graph Convolutional Network (T-GCN) for traffic flow prediction.

## Features
- **Mock Data Generation**: Generates synthetic traffic flow data with daily/weekly patterns.
- **T-GCN Model**: Spatio-Temporal Graph Convolutional Network using native PyTorch implementation.
- **Long-term Prediction**: Uses historical average statistics for long-term forecasting.
- **FastAPI Interface**: Provides REST API for prediction requests.

## Setup

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Run the server:
   ```bash
   uvicorn app:app --reload
   ```

3. Make a prediction request:
   ```bash
   curl -X POST http://localhost:8000/predict_flow \
     -H "Content-Type: application/json" \
     -d '{"node_id": "site_001", "start_time": 1748772000000, "end_time": 1748775600000}'
   ```

## Structure
- `data_gen.py`: Mock data generator.
- `model.py`: T-GCN model definition.
- `engine.py`: Training and inference logic.
- `app.py`: FastAPI application.
