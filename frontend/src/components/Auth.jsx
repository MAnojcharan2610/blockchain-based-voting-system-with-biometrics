import React from "react";
import { useNavigate } from "react-router-dom";
import "../styles/main.scss";

export default function Auth() {
  const navigate = useNavigate();

  return (
    <div className="card auth-card">
      <h2>Welcome</h2>
      <div className="auth-buttons">
        <button 
          className="btn primary-btn"
          onClick={() => navigate("/register")}
        >
          Register as New Voter
        </button>
        <button 
          className="btn secondary-btn"
          onClick={() => navigate("/login")}
        >
          Login as Existing Voter
        </button>
      </div>
    </div>
  );
}