// ManualFeed.jsx
import { useState, useEffect } from "react";
import { auth, rtdb, db } from "../services/firebase";
import { ref, set, onValue } from "firebase/database";
import {
  doc,
  updateDoc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "../styles/ManualFeed.css";

export default function ManualFeed() {
  const [catAmount, setCatAmount] = useState(20);
  const [dogAmount, setDogAmount] = useState(50);

  const [loading, setLoading] = useState({ cat: false, dog: false });

  const [catStatus, setCatStatus] = useState("idle");
  const [dogStatus, setDogStatus] = useState("idle");
  const [catLastFed, setCatLastFed] = useState(null);
  const [dogLastFed, setDogLastFed] = useState(null);

  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [tempAdapt, setTempAdapt] = useState(false);

  const [catBowl, setCatBowl] = useState(0);
  const [dogBowl, setDogBowl] = useState(0);

  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const updateDailyIntake = async (pet, userAmount) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().split("T")[0];
      const dailyIntakeRef = doc(db, "dailyIntake", today);

      const dailySnap = await getDoc(dailyIntakeRef);

      if (dailySnap.exists()) {
        const currentData = dailySnap.data();
        const currentTotal = currentData[pet]?.totalDispensed || 0;

        await updateDoc(dailyIntakeRef, {
          [`${pet}.totalDispensed`]: currentTotal + Number(userAmount),
          lastUpdated: serverTimestamp(),
        });
      } else {
        const initialData = {
          date: today,
          cat: { totalDispensed: 0, currentBowlWeight: 0, calculatedIntake: 0 },
          dog: { totalDispensed: 0, currentBowlWeight: 0, calculatedIntake: 0 },
          lastUpdated: serverTimestamp(),
        };

        initialData[pet].totalDispensed = Number(userAmount);
        await setDoc(dailyIntakeRef, initialData);
      }
    } catch (error) {
      console.error("Error updating daily intake:", error);
    }
  };

  const bowlStatus = (weight, needed) => {
    if (weight >= needed) return "(FULL)";
    if (weight > 0) return "(Partial)";
    return "(Empty)";
  };

  const formatLastFed = (timestamp) => {
    if (!timestamp) return "Never";
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  useEffect(() => {
    const unsubCat = onValue(ref(rtdb, "dispenser/cat/status"), (snap) =>
      setCatStatus(snap.val() || "idle")
    );

    const unsubDog = onValue(ref(rtdb, "dispenser/dog/status"), (snap) =>
      setDogStatus(snap.val() || "idle")
    );

    const unsubCatLastFed = onValue(ref(rtdb, "dispenser/cat/lastFed"), (snap) => {
      const ts = snap.val();
      if (ts) setCatLastFed(ts);
    });

    const unsubDogLastFed = onValue(ref(rtdb, "dispenser/dog/lastFed"), (snap) => {
      const ts = snap.val();
      if (ts) setDogLastFed(ts);
    });

    const unsubTH = onValue(ref(rtdb, "temperature"), (snap) => {
      const data = snap.val();
      if (data) {
        setTemperature(data.temperature ?? null);
        setHumidity(data.humidity ?? null);
      }
    });

    const unsubAdapt = onValue(ref(rtdb, "settings/tempAdapt"), (snap) =>
      setTempAdapt(Boolean(snap.val()))
    );

    const unsubCatBowl = onValue(
      ref(rtdb, "petfeeder/cat/bowlWeight/weight"),
      (snap) => setCatBowl(Number(snap.val() || 0))
    );

    const unsubDogBowl = onValue(
      ref(rtdb, "petfeeder/dog/bowlWeight/weight"),
      (snap) => setDogBowl(Number(snap.val() || 0))
    );

    return () => {
      unsubCat();
      unsubDog();
      unsubCatLastFed();
      unsubDogLastFed();
      unsubTH();
      unsubAdapt();
      unsubCatBowl();
      unsubDogBowl();
    };
  }, []);

  const getDewPoint = (t, h) => {
    if (!t || !h) return null;
    return t - (100 - h) / 5;
  };

  const getTHI = (t, h) => {
    if (!t || !h) return null;
    const dew = getDewPoint(t, h);
    return t + 0.36 * dew + 41.2;
  };

  const formatTHI = () => {
    const thi = getTHI(temperature, humidity);
    return thi ? thi.toFixed(1) : "--";
  };

  const triggerFeed = async (pet, amount) => {

    if (!amount || Number(amount) < 1) {
      alert("Enter a valid amount between 1–100g");
      return;
    }

    if (Number(amount) > 100) {
      alert("Cannot feed more than 100g");
      return;
    }

    const bowlWeight = pet === "cat" ? catBowl : dogBowl;

    if (bowlWeight >= amount) {
      alert(`${pet.toUpperCase()} bowl already has ${bowlWeight}g`);
      return;
    }

    setLoading((prev) => ({ ...prev, [pet]: true }));

    try {
      const currentTime = Date.now();

      await set(ref(rtdb, `dispenser/${pet}/status`), "completed");
      await set(ref(rtdb, `dispenser/${pet}/lastFed`), currentTime);

      await set(ref(rtdb, `dispenser/${pet}/amount`), Number(amount));
      await set(ref(rtdb, `dispenser/${pet}/run`), true);

      await updateDailyIntake(pet, amount);

      alert(`${pet.toUpperCase()} feeding ${amount}g`);
    } catch (error) {
      alert("Error feeding");
    } finally {
      setLoading((prev) => ({ ...prev, [pet]: false }));
    }
  };

  return (
    <div className="manual-feed-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>SnackLoader</h2>
          <span>Automatic Pet Feeder</span>
        </div>

        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">
            Dashboard
          </Link>
          <Link to="/manualFeed" className="nav-link active">
            Feed Your Pet
          </Link>
          <Link to="/feederSetting" className="nav-link">
            Schedule Feeder
          </Link>
        </div>

        <div className="nav-user">
          <span className="user-email">{auth.currentUser?.email}</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </nav>

      <div className="feed-content">
        <div className="feed-header">
          <div className="header-content">
            <h1>Feed Your Pet 🍽️</h1>
            <p>Dispense food for your pets</p>
          </div>
        </div>

        <div className="feed-grid">
          
          {/* CAT */}
          <div className="feed-card cat-card">
            <div className="card-header">
              <div className="pet-avatar">🐱</div>
              <div className="pet-info">
                <h3>Feed Cat</h3>
                <p>Status: {catStatus}</p>
                <p>Bowl: {catBowl}g {bowlStatus(catBowl, catAmount || 20)}</p>
                <p>Last Fed: {formatLastFed(catLastFed)}</p>
              </div>
            </div>

            <div className="feed-controls">
              <div className="amount-control">
                <label className="amount-label">Amount (grams)</label>

                <input
                  type="number"
                  className="feed-input"
                  value={catAmount}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (val === "") {
                      setCatAmount("");
                      return;
                    }

                    const num = Number(val);

                    if (num > 100) {
                      alert("Maximum allowed is 100g");
                      return;
                    }

                    if (num >= 1 && num <= 100) {
                      setCatAmount(num);
                      return;
                    }

                    if (num === 0) setCatAmount("");
                  }}
                  onBlur={() => {
                    if (catAmount === "" || catAmount < 1) {
                      setCatAmount(20);
                    }
                  }}
                />

                <div className="amount-buttons">
                  <button onClick={() => setCatAmount(20)} className="amount-btn">
                    20g
                  </button>
                  <button onClick={() => setCatAmount(30)} className="amount-btn">
                    30g
                  </button>
                  <button onClick={() => setCatAmount(50)} className="amount-btn">
                    50g
                  </button>
                </div>
              </div>

              <button
                className={`feed-button cat ${loading.cat ? "loading" : ""}`}
                onClick={() => triggerFeed("cat", catAmount || 20)}
                disabled={loading.cat}
              >
                {loading.cat ? "Feeding..." : "🍖 Feed Cat"}
              </button>
            </div>
          </div>

          {/* DOG */}
          <div className="feed-card dog-card">
            <div className="card-header">
              <div className="pet-avatar">🐶</div>
              <div className="pet-info">
                <h3>Feed Dog</h3>
                <p>Status: {dogStatus}</p>
                <p>Bowl: {dogBowl}g {bowlStatus(dogBowl, dogAmount || 50)}</p>
                <p>Last Fed: {formatLastFed(dogLastFed)}</p>
              </div>
            </div>

            <div className="feed-controls">
              <div className="amount-control">
                <label className="amount-label">Amount (grams)</label>

                <input
                  type="number"
                  className="feed-input"
                  value={dogAmount}
                  onChange={(e) => {
                    const val = e.target.value;

                    if (val === "") {
                      setDogAmount("");
                      return;
                    }

                    const num = Number(val);

                    if (num > 100) {
                      alert("Maximum allowed is 100g");
                      return;
                    }

                    if (num >= 1 && num <= 100) {
                      setDogAmount(num);
                      return;
                    }

                    if (num === 0) setDogAmount("");
                  }}
                  onBlur={() => {
                    if (dogAmount === "" || dogAmount < 1) {
                      setDogAmount(50);
                    }
                  }}
                />

                <div className="amount-buttons">
                  <button onClick={() => setDogAmount(50)} className="amount-btn">
                    50g
                  </button>
                  <button onClick={() => setDogAmount(100)} className="amount-btn">
                    100g
                  </button>
                  <button onClick={() => setDogAmount(150)} className="amount-btn">
                    150g
                  </button>
                </div>
              </div>

              <button
                className={`feed-button dog ${loading.dog ? "loading" : ""}`}
                onClick={() => triggerFeed("dog", dogAmount || 50)}
                disabled={loading.dog}
              >
                {loading.dog ? "Feeding..." : "🍖 Feed Dog"}
              </button>
            </div>
          </div>

          {/* THI CARD */}
          <div className="thi-info-card">
            <div className="thi-header">
              <h3>Weather-Based Feeding (Sri Lanka)</h3>

              <div className="toggle-container">
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={tempAdapt}
                    onChange={(e) =>
                      set(ref(rtdb, "settings/tempAdapt"), e.target.checked)
                    }
                  />
                  <span className="slider"></span>
                </label>

                <div className="toggle-row2">
                  <span className="status">
                    <strong>{tempAdapt ? "ON" : "OFF"}</strong>
                  </span>
                </div>
              </div>
            </div>

            <div className="env-summary">
              🌡 Temp: {temperature ?? "--"}°C 💧 Humidity: {humidity ?? "--"}% 🔥
              THI: {formatTHI()}
            </div>

            <p className="thi-note">THI affects how much food your pets should eat.</p>

            <div className="thi-table">
              <div className="thi-row cool">
                <span>Comfortable (THI &lt; 70)</span>
                <span>➕ Increase feed</span>
              </div>

              <div className="thi-row normal">
                <span>Normal (THI 70–75)</span>
                <span>✔ Normal feeding</span>
              </div>

              <div className="thi-row warm">
                <span>Warm (THI 75–80)</span>
                <span>➖ Reduce feed</span>
              </div>

              <div className="thi-row hot">
                <span>Hot (THI 80–85)</span>
                <span>⚠ Reduce more</span>
              </div>

              <div className="thi-row danger">
                <span>Danger (THI &gt; 85)</span>
                <span>⛔ STOP feeding</span>
              </div>
            </div>
          </div>

        </div>

        <div className="quick-tips">
          <h3>💡 Quick Tips</h3>

          <div className="tips-grid">
            <div className="tip-card">
              <h4>Cat Portions</h4>
              <p>Typically 20–50g per meal.</p>
            </div>

            <div className="tip-card">
              <h4>Dog Portions</h4>
              <p>Typically 50–200g per meal.</p>
            </div>

            <div className="tip-card">
              <h4>Feeding Frequency</h4>
              <p>2 meals per day recommended.</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
