import torch
import torch.nn as nn

class DualStreamIntersectionNet(nn.Module):
    def __init__(self):
        super().__init__()

        # Branch A: Horizontal View (XYT)
        # Input: (B, 2, 32, 32, 32)
        self.branch_h = nn.Sequential(
            nn.Conv3d(2, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2), # 32 -> 16
            nn.Conv3d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2), # 16 -> 8
            nn.Flatten()
        )

        # Branch B: Vertical View (ZT)
        # Input: (B, 2, 32, 32, 32)
        self.branch_v = nn.Sequential(
            nn.Conv3d(2, 16, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2), # 32 -> 16
            nn.Conv3d(16, 32, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.MaxPool3d(2), # 16 -> 8
            nn.Flatten()
        )

        # Calculate flattened size
        # 32 channels * 8 * 8 * 8 spatial = 16384
        self.flat_size = 32 * 8 * 8 * 8

        # Dense layers for each branch to produce vectors
        self.fc_h = nn.Sequential(
            nn.Linear(self.flat_size, 128),
            nn.ReLU()
        )

        self.fc_v = nn.Sequential(
            nn.Linear(self.flat_size, 128),
            nn.ReLU()
        )

        # Fusion Head
        # Concatenates 128 + 128 = 256 features
        self.fusion = nn.Sequential(
            nn.Linear(256, 64),
            nn.ReLU(),
            nn.Linear(64, 1),
            nn.Sigmoid()
        )

    def forward(self, x_h, x_v):
        """
        Args:
            x_h: Horizontal view tensor (Batch, 2, 32, 32, 32)
            x_v: Vertical view tensor (Batch, 2, 32, 32, 32)
        Returns:
            prob: Collision probability (Batch, 1)
        """
        # Extract features
        feat_h = self.branch_h(x_h)
        vec_h = self.fc_h(feat_h)

        feat_v = self.branch_v(x_v)
        vec_v = self.fc_v(feat_v)

        # Fusion
        combined = torch.cat([vec_h, vec_v], dim=1)
        prob = self.fusion(combined)

        return prob
