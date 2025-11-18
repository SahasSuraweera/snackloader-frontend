// ManualFeed.jsx
import React, { useState } from "react";
import { auth } from "../services/firebase";

export default function ManualFeed({ deviceId = "SNACK-01" }) {
  const [catAmount, setCatAmount] = useState(30);
  const [dogAmount, setDogAmount] = useState(50);

  const feed = async (pet, amount) => {
    const token = await auth.currentUser.getIdToken();
    const r = await fetch(`${process.env.REACT_APP_BACKEND_URL}/device/${deviceId}/feed-${pet}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ amount: Number(amount) })
    });
    const j = await r.json();
    alert(JSON.stringify(j));
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Manual Feed</h2>

      <div>
        <h3>Feed Cat</h3>
        <input type="number" value={catAmount} onChange={e => setCatAmount(e.target.value)} />
        <button onClick={() => feed("cat", catAmount)}>Feed Cat</button>
      </div>

      <div>
        <h3>Feed Dog</h3>
        <input type="number" value={dogAmount} onChange={e => setDogAmount(e.target.value)} />
        <button onClick={() => feed("dog", dogAmount)}>Feed Dog</button>
      </div>
    </div>
  );
}
