import React, { useState } from "react";
import { auth } from "../services/firebase";
import "../styles/DeviceRegister.css";

export default function DeviceRegister() {
  const [deviceId, setDeviceId] = useState("");

  const register = async () => {
    const token = await auth.currentUser.getIdToken();
    const res = await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({
        deviceId,
        ownerId: auth.currentUser.uid,
        ownerEmail: auth.currentUser.email
      })
    });
    const data = await res.json();
    alert(JSON.stringify(data));
  };

  return (
    <div className="device-register-container">
      <div className="register-card">
        <h2>Register Device</h2>
        <input 
          className="register-input"
          placeholder="Device ID (e.g. SNACK-01)" 
          value={deviceId} 
          onChange={e => setDeviceId(e.target.value)} 
        />
        <button className="register-button" onClick={register}>
          Register Device
        </button>
      </div>
    </div>
  );
}