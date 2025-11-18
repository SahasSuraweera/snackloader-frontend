import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { auth } from "../services/firebase";

export default function Dashboard() {
  const deviceId = "SNACK-01"; // change if dynamic later
  const [data, setData] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  async function loadStatus() {
    try {
      const token = await auth.currentUser.getIdToken();

      const res = await fetch(
        `${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/status`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const json = await res.json();
      setData(json);
    } catch (error) {
      console.error("Error loading status:", error);
    }
  }

  return (
    <div style={{ padding: "30px" }}>
      <h1>Dashboard</h1>
      <p>Welcome, <b>{auth.currentUser?.email}</b></p>

      {/* === Quick Navigation Buttons === */}
      <div style={{ marginTop: "20px", display: "flex", gap: "20px", flexWrap: "wrap" }}>
        <Link to="/deviceRegister">
          <button className="dash-btn">Register Device</button>
        </Link>

        <Link to="/deviceStatus">
          <button className="dash-btn">Device Status</button>
        </Link>

        <Link to="/manualFeed">
          <button className="dash-btn">Manual Feed</button>
        </Link>

        <Link to="/feederSetting">
          <button className="dash-btn">Feeder Settings</button>
        </Link>
      </div>

      {/* === Device Info Section === */}
      <div style={{ marginTop: "30px" }}>
        <h2>Device Overview</h2>

        {!data ? (
          <p>Loading device data...</p>
        ) : (
          <div className="device-grid">
            <div className="device-card">
              <h3>Device Status</h3>
              <p>{data.online ? "🟢 Online" : "🔴 Offline"}</p>
            </div>

            <div className="device-card">
              <h3>Last Cat Feeding</h3>
              <p>
                {data.cat?.lastFeeding
                  ? new Date(data.cat.lastFeeding.seconds * 1000).toLocaleString()
                  : "No data"}
              </p>
            </div>

            <div className="device-card">
              <h3>Last Dog Feeding</h3>
              <p>
                {data.dog?.lastFeeding
                  ? new Date(data.dog.lastFeeding.seconds * 1000).toLocaleString()
                  : "No data"}
              </p>
            </div>

            <div className="device-card">
              <h3>Bowl Weight</h3>
              <p>{data.currentWeight ? `${data.currentWeight} g` : "N/A"}</p>
            </div>

            <div className="device-card">
              <h3>Temperature</h3>
              <p>{data.temperature ? `${data.temperature}°C` : "N/A"}</p>
            </div>

            <div className="device-card">
              <h3>Humidity</h3>
              <p>{data.humidity ? `${data.humidity}%` : "N/A"}</p>
            </div>
          </div>
        )}
      </div>

      {/* === Refresh Button === */}
      <button onClick={loadStatus} className="refresh-btn">
        Refresh Data
      </button>
    </div>
  );
}
