import torch
import numpy as np
import pandas as pd

def generate_traffic_data(num_nodes=20, num_days=90):
    """
    Generates mock traffic data for a transportation network.

    Args:
        num_nodes: Number of nodes (sites).
        num_days: Number of days of history.

    Returns:
        adj_matrix: (num_nodes, num_nodes) Adjacency matrix (numpy).
        flow_data: (total_hours, num_nodes) Flow data (numpy).
        historical_stats: Dictionary mapping (day_of_week, hour) -> mean_flow_vector.
    """
    total_hours = num_days * 24

    # 1. Generate Graph (Adjacency Matrix)
    # Sparse random graph
    np.random.seed(42)
    adj = np.random.rand(num_nodes, num_nodes)
    adj = (adj > 0.8).astype(float) # 20% density
    np.fill_diagonal(adj, 0.0) # No self-loops (added by normalization later)
    # Symmetrize (optional, but good for spatial stability)
    adj = np.maximum(adj, adj.T)

    # 2. Generate Flow Data
    # Pattern: Daily (24h), Weekly (168h), Noise
    hours = np.arange(total_hours)

    # Base pattern for each node
    flow_data = np.zeros((total_hours, num_nodes))

    for n in range(num_nodes):
        # Node specific offset and amplitude
        phase_day = np.random.rand() * 2 * np.pi
        phase_week = np.random.rand() * 2 * np.pi
        amp_day = 10 + np.random.rand() * 10
        amp_week = 5 + np.random.rand() * 5
        base = 50 + np.random.rand() * 20

        daily = amp_day * np.sin((hours / 24) * 2 * np.pi + phase_day)
        weekly = amp_week * np.sin((hours / 168) * 2 * np.pi + phase_week)
        noise = np.random.normal(0, 2, size=total_hours)

        flow = base + daily + weekly + noise
        flow_data[:, n] = np.maximum(0, flow).astype(int)

    # 3. Calculate Historical Statistics
    # Create DataFrame for easy grouping
    df = pd.DataFrame(flow_data, columns=[f'node_{i}' for i in range(num_nodes)])
    df['hour_index'] = hours
    # Use pandas to extract day of week and hour
    # We can assume start_time is arbitrary, e.g., '2025-01-01'
    start_date = pd.Timestamp('2025-01-01')
    timestamps = [start_date + pd.Timedelta(hours=h) for h in hours]
    df['timestamp'] = timestamps
    df['day_of_week'] = df['timestamp'].dt.dayofweek # 0=Monday, 6=Sunday
    df['hour_of_day'] = df['timestamp'].dt.hour

    # Group by (day_of_week, hour_of_day) and calculate mean
    stats_df = df.groupby(['day_of_week', 'hour_of_day']).mean()
    # Drop auxiliary columns
    stats_df = stats_df.drop(columns=['hour_index'])

    # Convert to a lookup dictionary or tensor
    # Shape: (7, 24, num_nodes)
    historical_stats = np.zeros((7, 24, num_nodes))
    for d in range(7):
        for h in range(24):
            if (d, h) in stats_df.index:
                # stats_df.loc[(d,h)] returns a Series with node_0...node_19 (and timestamp if strictly grouped? no, groupby drops nuisance)
                # Ensure we only get node columns
                vals = stats_df.loc[(d, h)][[f'node_{i}' for i in range(num_nodes)]].values
                historical_stats[d, h, :] = vals

    return adj, flow_data, historical_stats

if __name__ == "__main__":
    adj, flow, stats = generate_traffic_data()
    print(f"Adjacency shape: {adj.shape}")
    print(f"Flow shape: {flow.shape}")
    print(f"Stats shape: {stats.shape}")
    print("Sample Flow (Node 0, first 5 hours):", flow[:5, 0])
    print("Sample Stats (Monday, 10:00, Node 0):", stats[0, 10, 0])
