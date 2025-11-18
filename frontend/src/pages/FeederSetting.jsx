// FeederSettings.jsx
import React, { useEffect, useState } from "react";
import { auth } from "../services/firebase";

export default function FeederSettings({ deviceId = "SNACK-01" }) {
  const [catSchedule, setCatSchedule] = useState([]);
  const [dogSchedule, setDogSchedule] = useState([]);
  const [newCatTime, setNewCatTime] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [newDogTime, setNewDogTime] = useState("");
  const [newDogAmount, setNewDogAmount] = useState("");
  const [autoFeedEnabled, setAutoFeedEnabled] = useState(true);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/status`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = await r.json();
    setCatSchedule(data.cat?.schedule || []);
    setDogSchedule(data.dog?.schedule || []);
    setAutoFeedEnabled(data.autoFeedEnabled ?? true);
  }

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
    <div style={{ padding: 20 }}>
      <h2>Feeder Settings</h2>

      <div>
        <h3>Cat Schedule</h3>
        {catSchedule.map((s, i) => (<div key={i}>{s.time} → {s.amount}g</div>))}
        <input type="time" value={newCatTime} onChange={e => setNewCatTime(e.target.value)} />
        <input type="number" placeholder="grams" value={newCatAmount} onChange={e => setNewCatAmount(e.target.value)} />
        <button onClick={() => { setCatSchedule([...catSchedule, { time: newCatTime, amount: Number(newCatAmount) }]); setNewCatTime(""); setNewCatAmount(""); }}>Add</button>
      </div>

      <div>
        <h3>Dog Schedule</h3>
        {dogSchedule.map((s, i) => (<div key={i}>{s.time} → {s.amount}g</div>))}
        <input type="time" value={newDogTime} onChange={e => setNewDogTime(e.target.value)} />
        <input type="number" placeholder="grams" value={newDogAmount} onChange={e => setNewDogAmount(e.target.value)} />
        <button onClick={() => { setDogSchedule([...dogSchedule, { time: newDogTime, amount: Number(newDogAmount) }]); setNewDogTime(""); setNewDogAmount(""); }}>Add</button>
      </div>

      <div>
        <label>
          <input type="checkbox" checked={autoFeedEnabled} onChange={() => setAutoFeedEnabled(!autoFeedEnabled)} /> Auto Feed
        </label>
      </div>

      <button onClick={save}>Save Settings</button>
    </div>
  );
}
