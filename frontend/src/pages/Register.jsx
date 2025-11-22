import React, { useState } from "react";
import "../styles/Register.css";
import { auth, db } from "../services/firebase";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

const Register = () => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await createUserWithEmailAndPassword(
        auth,
        form.email,
        form.password
      );

      const uid = res.user.uid;

      await setDoc(doc(db, "users", uid), {
        firebaseUid: uid,
        name: form.name,
        email: form.email,
        phone: form.phone,
        role: "owner",
        devices: [],
        createdAt: serverTimestamp(),
      });

      alert("Registration Successful!");
      window.location.href = "/dashboard";

    } catch (err) {
      if (err.code === "auth/email-already-in-use") {
        setError("An account with this email already exists.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else if (err.code === "auth/invalid-email") {
        setError("Invalid email address.");
      } else {
        setError(err.message);
      }
    }

    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-content">
        {/* Form Side */}
        <div className="register-form-section">
          <div className="register-card">
            <div className="logo-section">
              <div className="logo">
                <span className="logo-icon">🐾</span>
                <h1 className="brand-title">SnackLoader</h1>
              </div>
              <p className="welcome-text">Create your account</p>
            </div>

            {error && (
              <div className="error-message">
                <span className="error-icon">⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleRegister} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder="Enter your full name"
                    value={form.name}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
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
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="phone" className="form-label">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    placeholder="Enter your phone number"
                    value={form.phone}
                    onChange={handleChange}
                    className="form-input"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="Create a password"
                    value={form.password}
                    onChange={handleChange}
                    className="form-input"
                    required
                    minLength="6"
                  />
                  <div className="password-hint">
                    Must be at least 6 characters
                  </div>
                </div>
              </div>

              <div className="form-row">
                <button 
                  type="submit" 
                  className="register-button" 
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <div className="button-spinner"></div>
                      Creating Account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </form>

            <div className="register-footer">
              <p>
                Already have an account?{" "}
                <a href="/" className="auth-link">
                  Login here
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Info Side */}
        <div className="register-info-section">
          <div className="info-content">
            <h2>Join Our Pet Loving Community</h2>
            <div className="benefits-list">
              <div className="benefit">
                <span className="benefit-icon">✅</span>
                <div className="benefit-text">
                  <h4>Easy Setup</h4>
                  <p>Get started in minutes with simple setup</p>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🐱🐶</span>
                <div className="benefit-text">
                  <h4>Multi-Pet Support</h4>
                  <p>Manage multiple pets with individual schedules</p>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">📊</span>
                <div className="benefit-text">
                  <h4>Smart Analytics</h4>
                  <p>Track feeding patterns and pet health</p>
                </div>
              </div>
              <div className="benefit">
                <span className="benefit-icon">🔒</span>
                <div className="benefit-text">
                  <h4>Secure & Reliable</h4>
                  <p>Your data and pets are safe with us</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;