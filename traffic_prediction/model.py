import torch
import torch.nn as nn
import torch.nn.functional as F
import numpy as np

class NativeGCNLayer(nn.Module):
    def __init__(self, in_features, out_features):
        super(NativeGCNLayer, self).__init__()
        self.linear = nn.Linear(in_features, out_features)

    def forward(self, x, adj):
        """
        x: (Batch, Nodes, InFeatures)
        adj: (Nodes, Nodes) or (Batch, Nodes, Nodes)
        """
        # XW
        out = self.linear(x) # (Batch, Nodes, OutFeatures)

        # AXW (assuming adj is dense)
        # If adj is (Nodes, Nodes), we broadcast.
        # out is (Batch, Nodes, OutFeatures).
        # We want (Batch, Nodes, OutFeatures) where each node is sum of neighbors.
        # matmul(adj, out) works if adj is (Nodes, Nodes) -> (Nodes, Out) ??? No.
        # We need (Batch, Nodes, Nodes) @ (Batch, Nodes, Out) -> (Batch, Nodes, Out)

        if adj.dim() == 2:
            adj = adj.unsqueeze(0) # (1, Nodes, Nodes)

        # adj is (1, N, N) or (B, N, N)
        # out is (B, N, F)
        # We broadcast adj if needed.

        # Matrix multiplication: (B, N, N) x (B, N, F) -> (B, N, F)
        out = torch.matmul(adj, out)

        return F.relu(out)

class TGCN(nn.Module):
    def __init__(self, num_nodes, in_feat=1, hidden_dim=64, out_feat=1, dropout=0.2):
        super(TGCN, self).__init__()
        self.num_nodes = num_nodes
        self.hidden_dim = hidden_dim

        # Spatial: GCN
        self.gcn = NativeGCNLayer(in_feat, hidden_dim)

        # Temporal: GRU
        # Input to GRU will be (Seq, Batch*Nodes, Hidden) or (Batch*Nodes, Seq, Hidden)
        # We use batch_first=True -> (Batch*Nodes, Seq, Hidden)
        self.gru = nn.GRU(hidden_dim, hidden_dim, batch_first=True)

        # Feature Fusion
        # Time Embeddings
        self.emb_day = nn.Embedding(7, 4)  # 7 days, dim 4
        self.emb_hour = nn.Embedding(24, 4) # 24 hours, dim 4
        # Total time dim = 8

        # Output Layer
        # Input: Hidden + TimeDim
        self.fc = nn.Sequential(
            nn.Linear(hidden_dim + 8, 32),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(32, out_feat),
            nn.ReLU() # Ensure non-negative flow
        )

    def forward(self, x, adj, time_feat):
        """
        x: (Batch, Seq, Nodes, InFeat)
        adj: (Nodes, Nodes) - Normalized Adjacency
        time_feat: (Batch, 2) -> [day_of_week, hour_of_day] for the TARGET time (or sequence? prompt implies target time for correction)

        Note: The prompt says "Feature Fusion: ... with GRU output".
        If x is a sequence leading up to T, GRU output is state at T.
        TimeFeat should be at T.
        """
        batch_size, seq_len, num_nodes, in_feat = x.shape

        # 1. GCN Step (Spatial)
        # We process each time step.
        # Flatten Batch and Seq: (Batch*Seq, Nodes, InFeat)
        x_flat = x.view(-1, num_nodes, in_feat)
        gcn_out = self.gcn(x_flat, adj) # (Batch*Seq, Nodes, Hidden)

        # 2. GRU Step (Temporal)
        # Reshape to (Batch, Seq, Nodes, Hidden)
        gcn_out = gcn_out.view(batch_size, seq_len, num_nodes, self.hidden_dim)

        # We want to process time sequence for each node independently (sharing weights).
        # Transpose to (Batch, Nodes, Seq, Hidden)
        gcn_out = gcn_out.permute(0, 2, 1, 3)
        # Flatten Batch and Nodes: (Batch*Nodes, Seq, Hidden)
        gru_in = gcn_out.reshape(batch_size * num_nodes, seq_len, self.hidden_dim)

        gru_out, _ = self.gru(gru_in) # (Batch*Nodes, Seq, Hidden)

        # Take last time step
        last_h = gru_out[:, -1, :] # (Batch*Nodes, Hidden)

        # Reshape back to (Batch, Nodes, Hidden)
        last_h = last_h.view(batch_size, num_nodes, self.hidden_dim)

        # 3. Feature Fusion
        # time_feat: (Batch, 2)
        days = time_feat[:, 0].long()
        hours = time_feat[:, 1].long()

        d_emb = self.emb_day(days) # (Batch, 4)
        h_emb = self.emb_hour(hours) # (Batch, 4)
        t_emb = torch.cat([d_emb, h_emb], dim=1) # (Batch, 8)

        # Expand time embeddings to all nodes
        # (Batch, 1, 8) -> (Batch, NumNodes, 8)
        t_emb = t_emb.unsqueeze(1).repeat(1, num_nodes, 1)

        # Concatenate
        combined = torch.cat([last_h, t_emb], dim=2) # (Batch, Nodes, Hidden+8)

        # 4. Final Prediction
        out = self.fc(combined) # (Batch, Nodes, 1)

        return out

def normalize_adjacency(adj):
    """
    Computes D^-1/2 * (A+I) * D^-1/2
    adj: (N, N) numpy or tensor
    """
    if isinstance(adj, np.ndarray):
        adj = torch.from_numpy(adj).float()

    # Add self-loop if not present (assuming A+I is standard)
    # But if input adj already has self-loops (from gen), we add again?
    # Usually GCN adds self loops.
    # Let's check diag.
    # For safety, I'll assume adj might be raw.
    # A_tilde = A + I
    I = torch.eye(adj.shape[0])
    A_tilde = adj + I

    # Degree
    D_tilde_diag = torch.sum(A_tilde, dim=1)
    D_tilde_inv_sqrt = torch.pow(D_tilde_diag, -0.5)
    D_tilde_inv_sqrt[torch.isinf(D_tilde_inv_sqrt)] = 0
    D_tilde_inv_sqrt_mat = torch.diag(D_tilde_inv_sqrt)

    # D^-1/2 A D^-1/2
    A_norm = torch.mm(torch.mm(D_tilde_inv_sqrt_mat, A_tilde), D_tilde_inv_sqrt_mat)
    return A_norm
