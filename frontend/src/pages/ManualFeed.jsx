// ManualFeed.jsx
import { useState, useEffect } from "react";
import { auth, rtdb, db } from "../services/firebase";
import { ref, set, onValue } from "firebase/database";
import { doc, updateDoc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { Link, useNavigate } from "react-router-dom";
import { signOut } from "firebase/auth";
import "../styles/ManualFeed.css";

export default function ManualFeed() {
  const [catAmount, setCatAmount] = useState(30);
  const [dogAmount, setDogAmount] = useState(50);
  const [loading, setLoading] = useState({ cat: false, dog: false });

  const [catStatus, setCatStatus] = useState("idle");
  const [dogStatus, setDogStatus] = useState("idle");
  const [catLastFed, setCatLastFed] = useState(null);
  const [dogLastFed, setDogLastFed] = useState(null);

  const [temperature, setTemperature] = useState(null);
  const [humidity, setHumidity] = useState(null);
  const [tempAdapt, setTempAdapt] = useState(false);

  // Bowl weights
  const [catBowl, setCatBowl] = useState(0);
  const [dogBowl, setDogBowl] = useState(0);

  const navigate = useNavigate();

  // ---------------------------------------------------
  // DAILY INTAKE TRACKING
  // ---------------------------------------------------
  const updateDailyIntake = async (pet, userAmount) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
      const dailyIntakeRef = doc(db, "dailyIntake", today);

      // Get current document or create new one
      const dailySnap = await getDoc(dailyIntakeRef);

      if (dailySnap.exists()) {
        // Update existing document
        const currentData = dailySnap.data();
        const currentTotal = currentData[pet]?.totalDispensed || 0;

        await updateDoc(dailyIntakeRef, {
          [`${pet}.totalDispensed`]: currentTotal + Number(userAmount),
          lastUpdated: serverTimestamp()
        });
      } else {
        // Create new document
        const initialData = {
          date: today,
          cat: { totalDispensed: 0, currentBowlWeight: 0, calculatedIntake: 0 },
          dog: { totalDispensed: 0, currentBowlWeight: 0, calculatedIntake: 0 },
          lastUpdated: serverTimestamp()
        };

        initialData[pet].totalDispensed = Number(userAmount);
        await setDoc(dailyIntakeRef, initialData);
      }

      console.log(`📊 Daily intake updated: ${pet} +${userAmount}g`);
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
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // ---------------------------------------------------
  // SUBSCRIPTIONS
  // ---------------------------------------------------
  useEffect(() => {
    const unsubCat = onValue(ref(rtdb, "dispenser/cat/status"), snap =>
      setCatStatus(snap.val() || "idle")
    );

    const unsubDog = onValue(ref(rtdb, "dispenser/dog/status"), snap =>
      setDogStatus(snap.val() || "idle")
    );

    // Subscribe to lastFed timestamps
    const unsubCatLastFed = onValue(ref(rtdb, "dispenser/cat/lastFed"), snap => {
      const timestamp = snap.val();
      if (timestamp) setCatLastFed(timestamp);
    });

    const unsubDogLastFed = onValue(ref(rtdb, "dispenser/dog/lastFed"), snap => {
      const timestamp = snap.val();
      if (timestamp) setDogLastFed(timestamp);
    });

    const unsubTH = onValue(ref(rtdb, "temperature"), snap => {
      const data = snap.val();
      if (data) {
        setTemperature(data.temperature ?? null);
        setHumidity(data.humidity ?? null);
      }
    });

    const unsubAdapt = onValue(ref(rtdb, "settings/tempAdapt"), snap =>
      setTempAdapt(Boolean(snap.val()))
    );

    const unsubCatBowl = onValue(
      ref(rtdb, "petfeeder/cat/bowlWeight/weight"),
      snap => setCatBowl(Number(snap.val() || 0))
    );

    const unsubDogBowl = onValue(
      ref(rtdb, "petfeeder/dog/bowlWeight/weight"),
      snap => setDogBowl(Number(snap.val() || 0))
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

  // ---------------------------------------------------
  // WEATHER / THI FUNCTIONS
  // ---------------------------------------------------
  const getDewPoint = (t, h) => {
    if (!t || !h) return null;
    return t - (100 - h) / 5;
  };

  const getTHI = (t, h) => {
    if (!t || !h) return null;
    const dew = getDewPoint(t, h);
    return t + 0.36 * dew + 41.2;
  };

  const getAdaptedAmount = (base) => {
    const num = Number(base);
    if (!tempAdapt) return num;

    if (temperature === null || humidity === null) return num;

    const thi = getTHI(temperature, humidity);
    if (!thi || isNaN(thi)) return num;

    let adapted = num;

    if (thi < 70) adapted = Math.round(num * 1.10);
    else if (thi <= 75) adapted = num;
    else if (thi <= 80) adapted = Math.round(num * 0.90);
    else if (thi <= 85) adapted = Math.round(num * 0.80);
    else adapted = 0;

    if (Math.abs(adapted - num) < 5) {
      return num;
    }

    return adapted;
  };

  const formatTHI = () => {
    const thi = getTHI(temperature, humidity);
    return thi ? thi.toFixed(1) : "--";
  };

  // ---------------------------------------------------
  // FEED LOGIC
  // ---------------------------------------------------
  const triggerFeed = async (pet, amount) => {
    const adjusted = getAdaptedAmount(amount);
    const bowlWeight = pet === "cat" ? catBowl : dogBowl;

    // THI danger
    if (adjusted === 0 && tempAdapt) {
      alert("⚠️ Feeding blocked due to dangerous heat (THI).");
      return;
    }

    // If bowl has enough or more → stop
    if (bowlWeight >= adjusted) {
      alert(`${pet.toUpperCase()} bowl already has ${bowlWeight}g. Feeding stopped.`);
      return;
    }

    const finalAmount = adjusted;

    setLoading(prev => ({ ...prev, [pet]: true }));

    try {
      // Set status to "completed" and lastFed timestamp immediately
      const currentTime = Date.now();
      await set(ref(rtdb, `dispenser/${pet}/status`), "completed");
      await set(ref(rtdb, `dispenser/${pet}/lastFed`), currentTime);

      // Set amount and trigger feeding
      await set(ref(rtdb, `dispenser/${pet}/amount`), Number(finalAmount));
      await set(ref(rtdb, `dispenser/${pet}/run`), true);

      // Track daily intake with USER-SET amount (not THI-adjusted)
      await updateDailyIntake(pet, amount);

      alert(
        tempAdapt
          ? `${pet.toUpperCase()} feeding ${finalAmount}g (THI adjustment applied).`
          : `${pet.toUpperCase()} feeding ${finalAmount}g.`
      );

    } catch (error) {
      alert("Feeding failed.");
    } finally {
      setLoading(prev => ({ ...prev, [pet]: false }));
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  // ---------------------------------------------------
  // UI
  // ---------------------------------------------------
  return (
    <div className="manual-feed-container">
      <nav className="navbar">
        <div className="nav-brand">
          <h2>SnackLoader</h2>
          <span>Automatic Pet Feeder</span>
        </div>

        <div className="nav-links">
          <Link to="/dashboard" className="nav-link">Dashboard</Link>
          <Link to="/manualFeed" className="nav-link active">Feed Your Pet</Link>
          <Link to="/feederSetting" className="nav-link">Schedule Feeder</Link>
        </div>

        <div className="nav-user">
          <span className="user-email">{auth.currentUser?.email}</span>
          <button onClick={handleLogout} className="logout-btn">Logout</button>
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

          {/* CAT CARD */}
          <div className="feed-card cat-card">
            <div className="card-header">
              <div className="pet-avatar">🐱</div>
              <div className="pet-info">
                <h3>Feed Cat</h3>
                <p>Status: {catStatus}</p>
                <p>Bowl: {catBowl}g {bowlStatus(catBowl, getAdaptedAmount(catAmount))}</p>
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
                  onChange={(e) => setCatAmount(e.target.value)}
                  min="1"
                  max="200"
                />

                <div className="amount-buttons">
                  <button onClick={() => setCatAmount(20)} className="amount-btn">20g</button>
                  <button onClick={() => setCatAmount(30)} className="amount-btn">30g</button>
                  <button onClick={() => setCatAmount(50)} className="amount-btn">50g</button>
                </div>
              </div>

              <button
                className={`feed-button cat ${loading.cat ? "loading" : ""}`}
                onClick={() => triggerFeed("cat", catAmount)}
                disabled={loading.cat}
              >
                {loading.cat ? "Feeding..." : "🍖 Feed Cat"}
              </button>
            </div>
          </div>

          {/* DOG CARD */}
          <div className="feed-card dog-card">
            <div className="card-header">
              <div className="pet-avatar">🐶</div>
              <div className="pet-info">
                <h3>Feed Dog</h3>
                <p>Status: {dogStatus}</p>
                <p>Bowl: {dogBowl}g {bowlStatus(dogBowl, getAdaptedAmount(dogAmount))}</p>
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
                  onChange={(e) => setDogAmount(e.target.value)}
                  min="1"
                  max="500"
                />

                <div className="amount-buttons">
                  <button onClick={() => setDogAmount(50)} className="amount-btn">50g</button>
                  <button onClick={() => setDogAmount(100)} className="amount-btn">100g</button>
                  <button onClick={() => setDogAmount(150)} className="amount-btn">150g</button>
                </div>
              </div>

              <button
                className={`feed-button dog ${loading.dog ? "loading" : ""}`}
                onClick={() => triggerFeed("dog", dogAmount)}
                disabled={loading.dog}
              >
                {loading.dog ? "Feeding..." : "🍖 Feed Dog"}
              </button>
            </div>
          </div>

         {/* THI INFO CARD */}
         <div className="thi-info-card">

            {/* Header + Toggle */}
            <div className="thi-header">

              <h3>
                Weather-Based Feeding (Sri Lanka)
              </h3>

              {/* Right block: toggle + label under it */}
              <div className="toggle-container">

              {/* ROW 1 → toggle button */}
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

              {/* ROW 2 → Enable + Status */}
              <div className="toggle-row2">
                <span className="status"><strong>{tempAdapt ? "ON" : "OFF"}</strong></span>
              </div>

            </div>

            </div>

            {/* Environment Summary */}
            <div className="env-summary">
              🌡 Temp: {temperature ?? "--"}°C 
              💧 Humidity: {humidity ?? "--"}%
              🔥 THI: {formatTHI()}
            </div>

            <p className="thi-note">
              These guidelines explain how temperature & humidity affect pet appetite.
              Your automatic adaptation toggle uses these conditions.
            </p>

            {/* Table */}
            <div className="thi-table">

              <div className="thi-row cool">
                <span>Comfortable (THI &lt; 70)</span>
                <span>➕ Increase feed by 10%</span>
              </div>

              <div className="thi-row normal">
                <span>Normal (THI 70–75)</span>
                <span>✔ Normal feeding</span>
              </div>

              <div className="thi-row warm">
                <span>Warm (THI 75–80)</span>
                <span>➖ Reduce feed by 10%</span>
              </div>

              <div className="thi-row hot">
                <span>Hot (THI 80–85)</span>
                <span>⚠ Reduce feed by 20%</span>
              </div>

              <div className="thi-row danger">
                <span>Danger (THI &gt; 85)</span>
                <span>⛔ STOP feeding</span>
              </div>

            </div>
          </div>


        </div>

        {/* QUICK TIPS */}
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
              <p>Most pets eat 2 times per day.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}