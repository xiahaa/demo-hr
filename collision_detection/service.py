import numpy as np
import torch
from fastapi import FastAPI
from ray import serve
from pydantic import BaseModel
from typing import List

# Assumes the package is in PYTHONPATH or running from root
from collision_detection.preprocessing import traj_to_multiview
from collision_detection.model import DualStreamIntersectionNet

app = FastAPI()

class Point(BaseModel):
    x: float
    y: float
    z: float
    t: float

class DetectionRequest(BaseModel):
    traj_a: List[Point]
    traj_b: List[Point]

@serve.deployment(num_replicas=1, ray_actor_options={"num_cpus": 1, "num_gpus": 0})
@serve.ingress(app)
class IntersectionDetector:
    def __init__(self):
        self.model = DualStreamIntersectionNet()
        # In a real scenario, load weights:
        # self.model.load_state_dict(torch.load("model_weights.pth"))
        self.model.eval()
        print("IntersectionDetector initialized.")

    @app.post("/detect_4d_intersection")
    def detect(self, request: DetectionRequest):
        """
        Endpoint to detect intersection probability between two 4D trajectories.
        Traj points must have x, y, z, t in [0, 1].
        """
        # Convert input to numpy (Batch=1, Steps, 4)
        def to_array(traj_points):
            return np.array([[p.x, p.y, p.z, p.t] for p in traj_points], dtype=np.float32)

        arr_a = to_array(request.traj_a)
        arr_b = to_array(request.traj_b)

        # Add batch dimension: (1, Steps, 4)
        arr_a = arr_a[np.newaxis, ...]
        arr_b = arr_b[np.newaxis, ...]

        # Preprocess -> Multi-View Voxels
        # Returns tensors: (1, 2, 32, 32, 32)
        view_xyt, view_zt = traj_to_multiview(arr_a, arr_b)

        # Inference
        with torch.no_grad():
            prob_tensor = self.model(view_xyt, view_zt)
            prob = float(prob_tensor[0, 0])

        risk_level = "LOW"
        if prob > 0.8:
            risk_level = "CRITICAL"
        elif prob > 0.5:
            risk_level = "WARNING"

        return {
            "probability": prob,
            "risk_level": risk_level
        }

# Entry point for Ray Serve
intersection_app = IntersectionDetector.bind()
