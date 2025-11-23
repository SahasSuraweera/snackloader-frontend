import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { auth, rtdb } from "../services/firebase";
import { signOut } from "firebase/auth";
import { ref, onValue, off } from "firebase/database";
import "../styles/Dashboard.css";

export default function Dashboard() {
  const [realTimeData, setRealTimeData] = useState({
    temperature: null,
    humidity: null,
    timestamp: null
  });

  const [petDetection, setPetDetection] = useState({
    cat: {
      detected: null,
      confidence: null,
      timestamp: null
    },
    dog: {
      detected: null,
      confidence: null,
      timestamp: null
    }
  });

  const [bowlWeight, setBowlWeight] = useState({
    cat: {
      weight: null,
      unit: null,
      timestamp: null
    },
    dog: {
      weight: null,
      unit: null,
      timestamp: null
    }
  });

  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    // Set up real-time listener for temperature and humidity
    const tempRef = ref(rtdb, 'temperature/temperature');
    const humidityRef = ref(rtdb, 'temperature/humidity');
    const timestampRef = ref(rtdb, 'temperature/timestamp');

    // Pet detection listeners
    const catDetectedRef = ref(rtdb, 'detectionStatus/cat/detected');
    const catConfidenceRef = ref(rtdb, 'detectionStatus/cat/confidence');
    const catDetectionTimestampRef = ref(rtdb, 'detectionStatus/cat/timestamp');

    const dogDetectedRef = ref(rtdb, 'detectionStatus/dog/detected');
    const dogConfidenceRef = ref(rtdb, 'detectionStatus/dog/confidence');
    const dogDetectionTimestampRef = ref(rtdb, 'detectionStatus/dog/timestamp');

    // Bowl weight listeners
    const catWeightRef = ref(rtdb, 'petfeeder/cat/bowlWeight/weight');
    const catUnitRef = ref(rtdb, 'petfeeder/cat/bowlWeight/unit');
    const catWeightTimestampRef = ref(rtdb, 'petfeeder/cat/bowlWeight/timestamp');

    const dogWeightRef = ref(rtdb, 'petfeeder/dog/bowlWeight/weight');
    const dogUnitRef = ref(rtdb, 'petfeeder/dog/bowlWeight/unit');
    const dogWeightTimestampRef = ref(rtdb, 'petfeeder/dog/bowlWeight/timestamp');

    const tempListener = onValue(tempRef, (snapshot) => {
      const temp = snapshot.val();
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
      setRealTimeData(prev => ({
        ...prev,
        humidity: humidity
      }));
    }, (error) => {
      console.error("Error reading humidity:", error);
    });

    const timestampListener = onValue(timestampRef, (snapshot) => {
      const timestamp = snapshot.val();
      setRealTimeData(prev => ({
        ...prev,
        timestamp: timestamp
      }));
    }, (error) => {
      console.error("Error reading timestamp:", error);
    });

    // Pet detection listeners
    const catDetectedListener = onValue(catDetectedRef, (snapshot) => {
      const detected = snapshot.val();
      setPetDetection(prev => ({
        ...prev,
        cat: { ...prev.cat, detected }
      }));
    });

    const catConfidenceListener = onValue(catConfidenceRef, (snapshot) => {
      const confidence = snapshot.val();
      setPetDetection(prev => ({
        ...prev,
        cat: { ...prev.cat, confidence }
      }));
    });

    const catDetectionTimestampListener = onValue(catDetectionTimestampRef, (snapshot) => {
      const timestamp = snapshot.val();
      setPetDetection(prev => ({
        ...prev,
        cat: { ...prev.cat, timestamp }
      }));
    });

    const dogDetectedListener = onValue(dogDetectedRef, (snapshot) => {
      const detected = snapshot.val();
      setPetDetection(prev => ({
        ...prev,
        dog: { ...prev.dog, detected }
      }));
    });

    const dogConfidenceListener = onValue(dogConfidenceRef, (snapshot) => {
      const confidence = snapshot.val();
      setPetDetection(prev => ({
        ...prev,
        dog: { ...prev.dog, confidence }
      }));
    });

    const dogDetectionTimestampListener = onValue(dogDetectionTimestampRef, (snapshot) => {
      const timestamp = snapshot.val();
      setPetDetection(prev => ({
        ...prev,
        dog: { ...prev.dog, timestamp }
      }));
    });

    // Bowl weight listeners
    const catWeightListener = onValue(catWeightRef, (snapshot) => {
      const weight = snapshot.val();
      setBowlWeight(prev => ({
        ...prev,
        cat: { ...prev.cat, weight }
      }));
    });

    const catUnitListener = onValue(catUnitRef, (snapshot) => {
      const unit = snapshot.val();
      setBowlWeight(prev => ({
        ...prev,
        cat: { ...prev.cat, unit }
      }));
    });

    const catWeightTimestampListener = onValue(catWeightTimestampRef, (snapshot) => {
      const timestamp = snapshot.val();
      setBowlWeight(prev => ({
        ...prev,
        cat: { ...prev.cat, timestamp }
      }));
    });

    const dogWeightListener = onValue(dogWeightRef, (snapshot) => {
      const weight = snapshot.val();
      setBowlWeight(prev => ({
        ...prev,
        dog: { ...prev.dog, weight }
      }));
    });

    const dogUnitListener = onValue(dogUnitRef, (snapshot) => {
      const unit = snapshot.val();
      setBowlWeight(prev => ({
        ...prev,
        dog: { ...prev.dog, unit }
      }));
    });

    const dogWeightTimestampListener = onValue(dogWeightTimestampRef, (snapshot) => {
      const timestamp = snapshot.val();
      setBowlWeight(prev => ({
        ...prev,
        dog: { ...prev.dog, timestamp }
      }));
    });

    // Cleanup listeners on unmount
    return () => {
      off(tempRef, 'value', tempListener);
      off(humidityRef, 'value', humidityListener);
      off(timestampRef, 'value', timestampListener);

      off(catDetectedRef, 'value', catDetectedListener);
      off(catConfidenceRef, 'value', catConfidenceListener);
      off(catDetectionTimestampRef, 'value', catDetectionTimestampListener);
      off(dogDetectedRef, 'value', dogDetectedListener);
      off(dogConfidenceRef, 'value', dogConfidenceListener);
      off(dogDetectionTimestampRef, 'value', dogDetectionTimestampListener);

      off(catWeightRef, 'value', catWeightListener);
      off(catUnitRef, 'value', catUnitListener);
      off(catWeightTimestampRef, 'value', catWeightTimestampListener);
      off(dogWeightRef, 'value', dogWeightListener);
      off(dogUnitRef, 'value', dogUnitListener);
      off(dogWeightTimestampRef, 'value', dogWeightTimestampListener);
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
      const date = typeof timestamp === 'number'
        ? new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp)
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

  const getDetectionStatus = (detected) => {
    if (detected === null) return "No data";
    return detected ? "🟢 Detected" : "🔴 Not detected";
  };

  const getConfidenceDisplay = (confidence) => {
    if (confidence === null) return "N/A";
    return `${confidence}%`;
  };

  const getWeightDisplay = (weight, unit) => {
    if (weight === null || unit === null) return "No data";
    return `${weight} ${unit || 'g'}`;
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

        {/* Pet Detection Section */}
        <div className="environment-section">
          <h2>Pet Detection</h2>
          <div className="environment-cards">
            <div className="env-card cat-detection-card">
              <div className="env-icon">🐱</div>
              <div className="env-info">
                <h3>Cat Detection</h3>
                <p className="env-value">
                  {getDetectionStatus(petDetection.cat.detected)}
                </p>
                <span className="env-label">
                  Confidence: {getConfidenceDisplay(petDetection.cat.confidence)}
                </span>
                <span className="env-label">
                  Last detected: {formatTimestamp(petDetection.cat.timestamp)}
                </span>
              </div>
            </div>

            <div className="env-card dog-detection-card">
              <div className="env-icon">🐶</div>
              <div className="env-info">
                <h3>Dog Detection</h3>
                <p className="env-value">
                  {getDetectionStatus(petDetection.dog.detected)}
                </p>
                <span className="env-label">
                  Confidence: {getConfidenceDisplay(petDetection.dog.confidence)}
                </span>
                <span className="env-label">
                  Last detected: {formatTimestamp(petDetection.dog.timestamp)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Food Bowl Status */}
        <div className="environment-section">
          <h2>Food Bowl Status</h2>
          <div className="environment-cards">
            <div className="env-card cat-bowl-card">
              <div className="env-icon">🍽️</div>
              <div className="env-info">
                <h3>Cat Bowl</h3>
                <p className="env-value">
                  {getWeightDisplay(bowlWeight.cat.weight, bowlWeight.cat.unit)}
                </p>
                <span className="env-label">Current food weight</span>
                <span className="env-label">
                  Last measured: {formatTimestamp(bowlWeight.cat.timestamp)}
                </span>
              </div>
            </div>

            <div className="env-card dog-bowl-card">
              <div className="env-icon">🍽️</div>
              <div className="env-info">
                <h3>Dog Bowl</h3>
                <p className="env-value">
                  {getWeightDisplay(bowlWeight.dog.weight, bowlWeight.dog.unit)}
                </p>
                <span className="env-label">Current food weight</span>
                <span className="env-label">
                  Last measured: {formatTimestamp(bowlWeight.dog.timestamp)}
                </span>
              </div>
            </div>
          </div>
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