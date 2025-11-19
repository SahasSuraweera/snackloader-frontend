import React, { useEffect, useState, useCallback } from "react";
import { auth } from "../services/firebase";
import "../styles/DeviceStatus.css";

export default function DeviceStatus({ deviceId = "SNACK-01" }) {
  const [device, setDevice] = useState(null);

  const load = useCallback(async () => {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDevice(await r.json());
  }, [deviceId]);

  useEffect(() => { 
    load();
  }, [load]);

  if (!device) return <div className="loading">Loading...</div>;

  return (
    <div className="device-status-container">
      <div className="status-card">
        <h2>Device Status: {deviceId}</h2>
        
        <div className="status-overview">
          <div className="status-item">
            <span className="status-label">Online Status:</span>
            <span className={`status-value ${device.online ? 'online' : 'offline'}`}>
              {device.online ? "🟢 Online" : "🔴 Offline"}
            </span>
          </div>
          <div className="status-item">
            <span className="status-label">Last Seen:</span>
            <span className="status-value">
              {device.lastSeen ? new Date(device.lastSeen.seconds * 1000).toLocaleString() : "N/A"}
            </span>
          </div>
        </div>

        <div className="pet-section">
          <h3>🐱 Cat</h3>
          <div className="pet-details">
            <div className="pet-detail-item">
              <div className="pet-detail-label">Lid State</div>
              <div className="pet-detail-value">{device.cat?.lidState || "N/A"}</div>
            </div>
            <div className="pet-detail-item">
              <div className="pet-detail-label">Feeding Active</div>
              <div className="pet-detail-value">{String(device.cat?.feedingActive || false)}</div>
            </div>
            <div className="pet-detail-item">
              <div className="pet-detail-label">Last Feeding</div>
              <div className="pet-detail-value">
                {device.cat?.lastFeeding ? new Date(device.cat.lastFeeding.seconds * 1000).toLocaleString() : "N/A"}
              </div>
            </div>
          </div>
        </div>

        <div className="pet-section">
          <h3>🐶 Dog</h3>
          <div className="pet-details">
            <div className="pet-detail-item">
              <div className="pet-detail-label">Lid State</div>
              <div className="pet-detail-value">{device.dog?.lidState || "N/A"}</div>
            </div>
            <div className="pet-detail-item">
              <div className="pet-detail-label">Feeding Active</div>
              <div className="pet-detail-value">{String(device.dog?.feedingActive || false)}</div>
            </div>
            <div className="pet-detail-item">
              <div className="pet-detail-label">Last Feeding</div>
              <div className="pet-detail-value">
                {device.dog?.lastFeeding ? new Date(device.dog.lastFeeding.seconds * 1000).toLocaleString() : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}