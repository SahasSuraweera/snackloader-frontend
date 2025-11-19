import React, { useEffect, useState, useCallback } from "react";
import { auth } from "../services/firebase";
import "../styles/FeederSettings.css";

export default function FeederSettings({ deviceId = "SNACK-01" }) {
  const [catSchedule, setCatSchedule] = useState([]);
  const [dogSchedule, setDogSchedule] = useState([]);
  const [newCatTime, setNewCatTime] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [newDogTime, setNewDogTime] = useState("");
  const [newDogAmount, setNewDogAmount] = useState("");
  const [autoFeedEnabled, setAutoFeedEnabled] = useState(true);

  const load = useCallback(async () => {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    setCatSchedule(data.cat?.schedule || []);
    setDogSchedule(data.dog?.schedule || []);
    setAutoFeedEnabled(data.autoFeedEnabled ?? true);
  }, [deviceId]);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    const token = await auth.currentUser.getIdToken();
    await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/settings`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        cat: { schedule: catSchedule },
        dog: { schedule: dogSchedule },
        autoFeedEnabled
      })
    });
    alert("Saved");
  }

  return (
    <div className="feeder-settings-container">
      <div className="settings-card">
        <h2>Feeder Settings</h2>

        <div className="pet-schedule">
          <h3>🐱 Cat Schedule</h3>
          <div className="schedule-list">
            {catSchedule.map((s, i) => (
              <div key={i} className="schedule-item">
                <span className="schedule-time">{s.time}</span>
                <span className="schedule-amount">{s.amount}g</span>
              </div>
            ))}
          </div>
          <div className="schedule-inputs">
            <input 
              type="time" 
              className="schedule-input"
              value={newCatTime} 
              onChange={e => setNewCatTime(e.target.value)} 
            />
            <input 
              type="number" 
              className="schedule-input"
              placeholder="grams" 
              value={newCatAmount} 
              onChange={e => setNewCatAmount(e.target.value)} 
            />
            <button 
              className="add-schedule-btn"
              onClick={() => { 
                setCatSchedule([...catSchedule, { time: newCatTime, amount: Number(newCatAmount) }]); 
                setNewCatTime(""); 
                setNewCatAmount(""); 
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div className="pet-schedule">
          <h3>🐶 Dog Schedule</h3>
          <div className="schedule-list">
            {dogSchedule.map((s, i) => (
              <div key={i} className="schedule-item">
                <span className="schedule-time">{s.time}</span>
                <span className="schedule-amount">{s.amount}g</span>
              </div>
            ))}
          </div>
          <div className="schedule-inputs">
            <input 
              type="time" 
              className="schedule-input"
              value={newDogTime} 
              onChange={e => setNewDogTime(e.target.value)} 
            />
            <input 
              type="number" 
              className="schedule-input"
              placeholder="grams" 
              value={newDogAmount} 
              onChange={e => setNewDogAmount(e.target.value)} 
            />
            <button 
              className="add-schedule-btn"
              onClick={() => { 
                setDogSchedule([...dogSchedule, { time: newDogTime, amount: Number(newDogAmount) }]); 
                setNewDogTime(""); 
                setNewDogAmount(""); 
              }}
            >
              Add
            </button>
          </div>
        </div>

        <div className="auto-feed-toggle">
          <input 
            type="checkbox" 
            className="toggle-checkbox"
            checked={autoFeedEnabled} 
            onChange={() => setAutoFeedEnabled(!autoFeedEnabled)} 
          />
          <span className="toggle-label">Enable Auto Feed</span>
        </div>

        <button className="save-settings-btn" onClick={save}>
          Save Settings
        </button>
      </div>
    </div>
  );
}