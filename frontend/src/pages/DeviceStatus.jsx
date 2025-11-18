// DeviceStatus.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../services/firebase";

export default function DeviceStatus({ deviceId = "SNACK-01" }) {
  const [device, setDevice] = useState(null);

  useEffect(() => { load(); }, []);

  async function load() {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setDevice(await r.json());
  }

  if (!device) return <div>Loading...</div>;

  return (
    <div style={{ padding: 20 }}>
      <h2>Device Status: {deviceId}</h2>
      <div>Online: {device.online ? "Yes" : "No"}</div>
      <div>Last seen: {device.lastSeen ? new Date(device.lastSeen.seconds * 1000).toLocaleString() : "N/A"}</div>
      <h3>Cat</h3>
      <div>Lid: {device.cat?.lidState}</div>
      <div>FeedingActive: {String(device.cat?.feedingActive)}</div>
      <div>Last Feeding: {device.cat?.lastFeeding ? new Date(device.cat.lastFeeding.seconds * 1000).toLocaleString() : "N/A"}</div>
      <h3>Dog</h3>
      <div>Lid: {device.dog?.lidState}</div>
      <div>FeedingActive: {String(device.dog?.feedingActive)}</div>
      <div>Last Feeding: {device.dog?.lastFeeding ? new Date(device.dog.lastFeeding.seconds * 1000).toLocaleString() : "N/A"}</div>
    </div>
  );
}
