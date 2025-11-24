// FeederSetting.jsx
import React, { useEffect, useState, useCallback } from "react";
import { auth, db } from "../services/firebase";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import "../styles/FeederSettings.css";

export default function FeederSettings() {
  const [catSchedule, setCatSchedule] = useState([]);
  const [dogSchedule, setDogSchedule] = useState([]);
  const [newCatTime, setNewCatTime] = useState("");
  const [newCatAmount, setNewCatAmount] = useState("");
  const [newDogTime, setNewDogTime] = useState("");
  const [newDogAmount, setNewDogAmount] = useState("");
  const [autoFeedEnabled, setAutoFeedEnabled] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const load = useCallback(async () => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const settingsRef = doc(db, "feederSettings", user.uid);
      const settingsSnap = await getDoc(settingsRef);

      if (settingsSnap.exists()) {
        const data = settingsSnap.data();
        setCatSchedule(data.cat?.schedule || []);
        setDogSchedule(data.dog?.schedule || []);
        setAutoFeedEnabled(data.autoFeedEnabled ?? true);
      } else {
        setCatSchedule([]);
        setDogSchedule([]);
        setAutoFeedEnabled(true);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
      alert("Error loading settings");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save() {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        alert("You must be logged in to save settings");
        return;
      }

      const settingsRef = doc(db, "feederSettings", user.uid);
      
      const settingsData = {
        cat: {
          schedule: catSchedule
        },
        dog: {
          schedule: dogSchedule
        },
        autoFeedEnabled,
        lastUpdated: serverTimestamp(),
        userId: user.uid
      };

      console.log("💾 Saving settings to Firestore:", settingsData);
      await setDoc(settingsRef, settingsData, { merge: true });
      alert("Settings saved successfully to Firestore!");
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setLoading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const removeScheduleItem = (pet, index) => {
    if (pet === 'cat') {
      setCatSchedule(catSchedule.filter((_, i) => i !== index));
    } else {
      setDogSchedule(dogSchedule.filter((_, i) => i !== index));
    }
  };

  const addScheduleItem = (pet, time, amount) => {
    if (!time || !amount) return;

    const newScheduleItem = { 
      time, 
      amount: Number(amount),
      id: Date.now()
    };

    if (pet === 'cat') {
      setCatSchedule(prev => [...prev, newScheduleItem]);
      setNewCatTime("");
      setNewCatAmount("");
    } else {
      setDogSchedule(prev => [...prev, newScheduleItem]);
      setNewDogTime("");
      setNewDogAmount("");
    }
  };

  return (
    <div className="feeder-settings-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <h2>SnackLoader</h2>
          <span>Automatic Pet Feeder</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/manualFeed" className="nav-link">Manual Feed</Link>
          <Link to="/feederSetting" className="nav-link active">Feeder Settings</Link>
        </div>
        <div className="nav-user">
          <span className="user-email">{auth.currentUser?.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="settings-content">
        <div className="settings-header">
          <div className="header-content">
            <h1>Feeder Settings</h1>
            <p>Configure automatic feeding schedules for your pets</p>
          </div>
          <div className="header-actions">
            <button 
              onClick={save} 
              className="save-settings-btn"
              disabled={loading}
            >
              {loading ? "💾 Saving..." : "💾 Save Settings"}
            </button>
          </div>
        </div>

        <div className="settings-grid">
          {/* Cat Schedule */}
          <div className="settings-card">
            <div className="card-header">
              <div className="pet-icon">🐱</div>
              <h3>Cat Feeding Schedule</h3>
            </div>
            <div className="schedule-list">
              {catSchedule.length === 0 ? (
                <div className="empty-schedule">
                  <p>No feeding times scheduled</p>
                  <small>Add feeding times below</small>
                </div>
              ) : (
                catSchedule.map((s, i) => (
                  <div key={s.id || i} className="schedule-item">
                    <div className="schedule-info">
                      <span className="schedule-time">{s.time}</span>
                      <span className="schedule-amount">{s.amount}g</span>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeScheduleItem('cat', i)}
                      title="Remove schedule"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
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
                placeholder="Grams" 
                value={newCatAmount} 
                onChange={e => setNewCatAmount(e.target.value)} 
                min="1"
                max="200"
              />
              <button 
                className="add-schedule-btn"
                onClick={() => addScheduleItem('cat', newCatTime, newCatAmount)}
                disabled={!newCatTime || !newCatAmount}
              >
                Add Time
              </button>
            </div>
          </div>

          {/* Dog Schedule */}
          <div className="settings-card">
            <div className="card-header">
              <div className="pet-icon">🐶</div>
              <h3>Dog Feeding Schedule</h3>
            </div>
            <div className="schedule-list">
              {dogSchedule.length === 0 ? (
                <div className="empty-schedule">
                  <p>No feeding times scheduled</p>
                  <small>Add feeding times below</small>
                </div>
              ) : (
                dogSchedule.map((s, i) => (
                  <div key={s.id || i} className="schedule-item">
                    <div className="schedule-info">
                      <span className="schedule-time">{s.time}</span>
                      <span className="schedule-amount">{s.amount}g</span>
                    </div>
                    <button 
                      className="remove-btn"
                      onClick={() => removeScheduleItem('dog', i)}
                      title="Remove schedule"
                    >
                      ×
                    </button>
                  </div>
                ))
              )}
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
                placeholder="Grams" 
                value={newDogAmount} 
                onChange={e => setNewDogAmount(e.target.value)} 
                min="1"
                max="500"
              />
              <button 
                className="add-schedule-btn"
                onClick={() => addScheduleItem('dog', newDogTime, newDogAmount)}
                disabled={!newDogTime || !newDogAmount}
              >
                Add Time
              </button>
            </div>
          </div>

          {/* Auto Feed Toggle */}
          <div className="settings-card toggle-card">
            <div className="card-header">
              <div className="pet-icon">⚡</div>
              <h3>Auto Feed Settings</h3>
            </div>
            <div className="toggle-section">
              <label className="toggle-label">
                <input 
                  type="checkbox" 
                  className="toggle-checkbox"
                  checked={autoFeedEnabled} 
                  onChange={() => setAutoFeedEnabled(!autoFeedEnabled)} 
                />
                <span className="toggle-slider"></span>
              </label>
              <div className="toggle-info">
                <h4>Automatic Feeding</h4>
                <p>Enable scheduled feeding times for your pets</p>
                <small className="toggle-hint">
                  {autoFeedEnabled ? 
                    "Scheduled feeding is active" : 
                    "Scheduled feeding is disabled"
                  }
                </small>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="info-section">
          <h3>💡 How it works</h3>
          <div className="info-grid">
            <div className="info-card">
              <h4>Schedule Format</h4>
              <p>Times are in 24-hour format. The feeder will automatically dispense food at scheduled times.</p>
            </div>
            <div className="info-card">
              <h4>Multiple Schedules</h4>
              <p>You can add multiple feeding times per day for each pet. Empty schedules are fine.</p>
            </div>
            <div className="info-card">
              <h4>Auto Feed Toggle</h4>
              <p>When disabled, scheduled feeding will be paused but manual feeding still works.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}