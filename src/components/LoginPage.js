// src/components/LoginPage.jsx (Updated with better styling and fixed OAuth)
import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faEye, faEyeSlash } from "@fortawesome/free-solid-svg-icons";
import { faGoogle, faGithub, faFacebookF } from "@fortawesome/free-brands-svg-icons";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  OAuthProvider,
} from "firebase/auth";
import { auth, googleProvider, githubProvider, facebookProvider } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./LoginPage.css";

export default function LoginPage() {
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const mapAuthError = (code, message) => {
    switch (code) {
      case "auth/invalid-email": return "Please enter a valid email.";
      case "auth/user-not-found": return "No account found for this email.";
      case "auth/wrong-password": return "Incorrect password.";
      case "auth/email-already-in-use": return "Email already in use.";
      case "auth/popup-blocked": return "Popup blocked. Please allow popups.";
      case "auth/popup-closed-by-user": return "Popup closed before completing.";
      case "auth/account-exists-with-different-credential": return "Account exists with different sign-in method.";
      case "auth/cancelled-popup-request": return "Only one popup request at a time.";
      default: return message || "Authentication failed.";
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email)) return setError("Please enter a valid email.");
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    if (isRegister && password !== confirm) return setError("Passwords do not match.");

    setError(""); 
    setLoading(true);
    try {
      if (isRegister) await createUserWithEmailAndPassword(auth, email.trim(), password);
      else await signInWithEmailAndPassword(auth, email.trim(), password);
      navigate("/");
    } catch (err) {
      setError(mapAuthError(err.code, err.message));
    }
    setLoading(false);
  };

  const withPopup = async (provider) => {
    setError(""); 
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      navigate("/");
    } catch (err) {
      console.error("OAuth Error:", err);
      setError(mapAuthError(err.code, err.message));
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout">
      <aside className="auth-panel" role="dialog" aria-label="Authentication">
        <header className="auth-head">
          <h2 className="auth-title">{isRegister ? "Create Account" : "Welcome Back"}</h2>
          <p className="auth-subtitle">
            {isRegister ? "Sign up to start improving your typing" : "Sign in to continue your journey"}
          </p>
          <button className="auth-switch" onClick={() => setIsRegister(s => !s)}>
            {isRegister ? "Already have an account? Sign in" : "New here? Create account"}
          </button>
        </header>

        <form onSubmit={submit} className="auth-form" noValidate>
          <div className="form-group">
            <label className="label" htmlFor="email">Email Address</label>
            <input
              id="email" 
              className="input" 
              type="email"
              placeholder="you@example.com"
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="label" htmlFor="password">Password</label>
            <div className="pw-wrap">
              <input
                id="password" 
                className="input" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6} 
                required
              />
              <button
                type="button" 
                className="pw-toggle"
                onClick={() => setShowPassword(s => !s)}
                aria-label="Toggle password visibility"
              >
                <FontAwesomeIcon icon={showPassword ? faEyeSlash : faEye} />
              </button>
            </div>
          </div>

          {isRegister && (
            <div className="form-group">
              <label className="label" htmlFor="confirm">Confirm Password</label>
              <input
                id="confirm" 
                className="input" 
                type="password"
                placeholder="Repeat password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)} 
                required
              />
            </div>
          )}

          {error && <div className="error">{error}</div>}

          <button className="primary" type="submit" disabled={loading}>
            {loading ? "Processing..." : isRegister ? "Create Account" : "Sign In"}
          </button>
        </form>

        <div className="divider"><span>or continue with</span></div>

        <div className="providers">
          <button 
            className="prov google" 
            type="button"
            onClick={() => withPopup(googleProvider)} 
            aria-label="Google"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faGoogle} />
          </button>
          <button 
            className="prov github" 
            type="button"
            onClick={() => withPopup(githubProvider)} 
            aria-label="GitHub"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faGithub} />
          </button>
          <button 
            className="prov facebook" 
            type="button"
            onClick={() => withPopup(facebookProvider)} 
            aria-label="Facebook"
            disabled={loading}
          >
            <FontAwesomeIcon icon={faFacebookF} />
          </button>
        </div>
      </aside>

      <main className="auth-content" aria-hidden />
    </div>
  );
}