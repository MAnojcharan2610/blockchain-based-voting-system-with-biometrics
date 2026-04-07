import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "../styles/dashboard.scss";

export default function Dashboard() {
  const [voterData, setVoterData] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const data = localStorage.getItem("voterData");
    if (!data) {
      toast.error("Please login first");
      navigate("/login");
      return;
    }
    setVoterData(JSON.parse(data));
  }, [navigate]);

  if (!voterData) return null;

  return (
    <div className="dashboard">
      <div className="welcome-section">
        <h2>Welcome, {voterData.name}</h2>
        <p>You are logged in with Aadhaar: {voterData.aadhaarNumber}</p>
      </div>

      <div className="actions-grid">
        <Link to="/vote" className="action-card">
          <h3>Cast Vote</h3>
          <p>Vote for your preferred candidate</p>
        </Link>

        <Link to="/results" className="action-card">
          <h3>Results</h3>
          <p>View current election results</p>
        </Link>

        <div className="action-card">
          <h3>Transaction</h3>
          <p>Your registration tx: {voterData.txHash?.slice(0, 10)}...</p>
        </div>
      </div>
    </div>
  );
}