import React, { useState } from "react";
import "../styles/Login.css";
import { auth, db } from "../services/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { collection, query, where, getDocs } from "firebase/firestore";

const Login = () => {
  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signInWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const firebaseUid = res.user.uid;
      const usersRef = collection(db, "users");
      const q = query(usersRef, where("firebaseUid", "==", firebaseUid));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        setError("User not found in database.");
        setLoading(false);
        return;
      }

      const userData = snapshot.docs[0].data();
      localStorage.setItem("user", JSON.stringify(userData));

      window.location.href = "/dashboard";

    } catch (err) {
      if (err.code === "auth/wrong-password") {
        setError("Incorrect password.");
      } else if (err.code === "auth/user-not-found") {
        setError("No user found with this email.");
      } else {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Form Side */}
        <div className="login-form-section">
          <div className="login-card">
            <div className="logo-section">
              <div className="logo">
                <span className="logo-icon">🐾</span>
                <h1 className="brand-title">SnackLoader</h1>
              </div>
              <p className="welcome-text">Welcome back to your pet feeder</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="login-form">
              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  placeholder="Enter your email"
                  value={form.email}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  value={form.password}
                  onChange={handleChange}
                  className="form-input"
                  required
                />
              </div>

              <button 
                type="submit" 
                className="login-button" 
                disabled={loading}
              >
                {loading ? (
                  <>
                    <div className="button-spinner"></div>
                    Signing In...
                  </>
                ) : (
                  "Sign In to Dashboard"
                )}
              </button>
            </form>

            <div className="login-footer">
              <p>
                Don't have an account?{" "}
                <a href="/register" className="auth-link">
                  Create one here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Info Side */}
        <div className="login-info-section">
          <div className="info-content">
            <h2>Smart Pet Feeding Made Simple</h2>
            <div className="features-list">
              <div className="feature">
                <span className="feature-icon">⏰</span>
                <div className="feature-text">
                  <h4>Automated Scheduling</h4>
                  <p>Set perfect feeding times for your pets</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📱</span>
                <div className="feature-text">
                  <h4>Remote Control</h4>
                  <p>Feed your pets from anywhere</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">🌡️</span>
                <div className="feature-text">
                  <h4>Environment Monitoring</h4>
                  <p>Track temperature and humidity</p>
                </div>
              </div>
              <div className="feature">
                <span className="feature-icon">📊</span>
                <div className="feature-text">
                  <h4>Smart Analytics</h4>
                  <p>Monitor your pet's feeding patterns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;