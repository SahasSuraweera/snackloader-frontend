import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, rtdb } from "../services/firebase"; // Import rtdb instead of db
import { signOut } from "firebase/auth";
import { ref, onValue, off } from "firebase/database";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [realTimeData, setRealTimeData] = useState({
    temperature: null,
    humidity: null,
    timestamp: null
  });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up real-time listener for temperature and humidity
    const tempRef = ref(rtdb, 'temperature/temperature');
    const humidityRef = ref(rtdb, 'temperature/humidity');
    const timestampRef = ref(rtdb, 'temperature/timestamp');

    const tempListener = onValue(tempRef, (snapshot) => {
      const temp = snapshot.val();
      console.log("Temperature update:", temp);
      setRealTimeData(prev => ({
        ...prev,
        temperature: temp
      }));
      setLoading(false);
    }, (error) => {
      console.error("Error reading temperature:", error);
      setLoading(false);
    });

    const humidityListener = onValue(humidityRef, (snapshot) => {
      const humidity = snapshot.val();
      console.log("Humidity update:", humidity);
      setRealTimeData(prev => ({
        ...prev,
        humidity: humidity
      }));
    }, (error) => {
      console.error("Error reading humidity:", error);
    });

    const timestampListener = onValue(timestampRef, (snapshot) => {
      const timestamp = snapshot.val();
      console.log("Timestamp update:", timestamp);
      setRealTimeData(prev => ({
        ...prev,
        timestamp: timestamp
      }));
    }, (error) => {
      console.error("Error reading timestamp:", error);
    });

    // Cleanup listeners on unmount
    return () => {
      off(tempRef, 'value', tempListener);
      off(humidityRef, 'value', humidityListener);
      off(timestampRef, 'value', timestampListener);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const formatTimestamp = (timestamp) => {
    if (!timestamp) return "N/A";
    try {
      // Handle both string timestamps and numeric timestamps
      const date = typeof timestamp === 'number' 
        ? new Date(timestamp) 
        : new Date(timestamp);
      
      if (isNaN(date.getTime())) {
        return "Invalid timestamp";
      }
      
      return date.toLocaleString();
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "Invalid timestamp";
    }
  };

  return (
    <div className="dashboard-container">
      {/* Navigation Bar */}
      <nav className="navbar">
        <div className="nav-brand">
          <h2>SnackLoader</h2>
          <span>Automatic Pet Feeder</span>
        </div>
        <div className="nav-links">
          <Link to="/dashboard" className="nav-link active">Dashboard</Link>
          <Link to="/manualFeed" className="nav-link">Manual Feed</Link>
          <Link to="/feederSetting" className="nav-link">Feeder Settings</Link>
        </div>
        <div className="nav-user">
          <span className="user-email">{auth.currentUser?.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
        </div>
      </nav>

      {/* Main Content */}
      <div className="dashboard-content">
        <div className="dashboard-header">
          <div className="header-content">
            <h1>Dashboard</h1>
            <p>Welcome back! Monitor your pet feeder in real-time.</p>
          </div>
          <div className="header-status">
            <div className={`connection-status ${realTimeData.timestamp ? 'online' : 'offline'}`}>
              <span className="status-dot"></span>
              {realTimeData.timestamp ? 'Live Data' : 'No Data'}
            </div>
          </div>
        </div>

        {/* Real-time Environmental Data */}
        <div className="environment-section">
          <h2>Environment Monitoring</h2>
          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner"></div>
              <p>Connecting to sensors...</p>
            </div>
          ) : (
            <div className="environment-cards">
              <div className="env-card temperature-card">
                <div className="env-icon">🌡️</div>
                <div className="env-info">
                  <h3>Temperature</h3>
                  <p className="env-value">
                    {realTimeData.temperature !== null ? (
                      `${realTimeData.temperature}°C`
                    ) : (
                      <span className="no-data">No data</span>
                    )}
                  </p>
                  <span className="env-label">Current Room Temperature</span>
                </div>
              </div>
              
              <div className="env-card humidity-card">
                <div className="env-icon">💧</div>
                <div className="env-info">
                  <h3>Humidity</h3>
                  <p className="env-value">
                    {realTimeData.humidity !== null ? (
                      `${realTimeData.humidity}%`
                    ) : (
                      <span className="no-data">No data</span>
                    )}
                  </p>
                  <span className="env-label">Current Humidity Level</span>
                </div>
              </div>

              <div className="env-card timestamp-card">
                <div className="env-icon">🕒</div>
                <div className="env-info">
                  <h3>Last Update</h3>
                  <p className="env-value">
                    {realTimeData.timestamp ? (
                      formatTimestamp(realTimeData.timestamp)
                    ) : (
                      <span className="no-data">No data</span>
                    )}
                  </p>
                  <span className="env-label">Data timestamp</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <Link to="/manualFeed" className="action-btn primary">
              🍖 Manual Feed
            </Link>
            <Link to="/feederSetting" className="action-btn secondary">
              ⚙️ Feeder Settings
            </Link>
            <div className="action-btn secondary coming-soon">
              📷 Live Camera
              <span className="coming-soon-badge">Soon</span>
            </div>
          </div>
        </div>

        {/* System Status */}
        <div className="system-status">
          <h2>System Status</h2>
          <div className="status-grid">
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div className="status-info">
                <h3>Feeder System</h3>
                <p>Operational</p>
              </div>
            </div>
            <div className="status-item">
              <div className={`status-indicator ${realTimeData.timestamp ? 'online' : 'offline'}`}></div>
              <div className="status-info">
                <h3>Sensor Network</h3>
                <p>{realTimeData.timestamp ? 'Connected' : 'Disconnected'}</p>
              </div>
            </div>
            <div className="status-item">
              <div className="status-indicator online"></div>
              <div className="status-info">
                <h3>Web Interface</h3>
                <p>Online</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}