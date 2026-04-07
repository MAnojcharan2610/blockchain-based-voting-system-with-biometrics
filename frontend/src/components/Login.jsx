import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { verifyVoter } from "../utils/firebase";
import { registerVoterOnChain, getSignerAddress, isVoterRegistered } from "../utils/contract";
import { fingerprintAPI } from "../utils/biometric";
import "../styles/main.scss";

export default function Login() {
  const [aadhaar, setAadhaar] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loginStep, setLoginStep] = useState("aadhaar"); // "aadhaar", "fingerprint", "blockchain"
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const validateAadhaar = (v) => /^\d{12}$/.test(v);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!validateAadhaar(aadhaar)) {
      setError("Aadhaar must be 12 digits");
      return;
    }

    setLoading(true);
    try {
      // Step 1: Verify user exists in Firebase
      const user = await verifyVoter(aadhaar);
      if (!user) throw new Error("Voter not found. Please register first.");

      // Check if fingerprints are enrolled
      const enrollmentStatus = await fingerprintAPI.getEnrollmentStatus(aadhaar);
      if (!enrollmentStatus.enrollment_completed) {
        throw new Error("Fingerprint enrollment not completed. Please complete registration.");
      }

      setUserData(user);
      setLoginStep("fingerprint");
      toast.info("Please place your finger on the sensor");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Verification failed");
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const verifyFingerprint = async () => {
    setLoading(true);
    setError("");
    
    try {
      // Step 2: Verify fingerprint
      const result = await fingerprintAPI.verifyFingerprint(aadhaar);
      
      if (!result.matched) {
        throw new Error("Fingerprint does not match. Access denied.");
      }

      toast.success(`Fingerprint verified! (Confidence: ${result.confidence}%)`);
      setLoginStep("blockchain");

      // Step 3: Handle blockchain registration
      await getSignerAddress();

      const registeredOnChain = await isVoterRegistered(aadhaar);
      let txHash = null;
      if (!registeredOnChain) {
        txHash = await registerVoterOnChain(aadhaar, userData.age);
      }

      const voterData = {
        aadhaarNumber: aadhaar,
        name: userData.name,
        isLoggedIn: true,
        txHash: txHash || null
      };
      localStorage.setItem("voterData", JSON.stringify(voterData));

      toast.success("Login successful");
      navigate("/dashboard", { replace: true });
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Fingerprint verification failed");
      setError(err.message);
      // Allow retry
    } finally {
      setLoading(false);
    }
  };

  // Render fingerprint verification step
  if (loginStep === "fingerprint") {
    return (
      <div className="auth-page">
        <div className="auth-card card form">
          <header className="auth-header">
            <h2>Fingerprint Verification</h2>
            <p className="muted">Place your finger on the sensor to authenticate</p>
          </header>

          <div className="fingerprint-verification">
            <div className="fingerprint-icon-large">
              <div className="fingerprint-pulse">🖐️</div>
            </div>
            
            <div className="verification-info">
              <p><strong>Voter:</strong> {userData?.name}</p>
              <p><strong>Aadhaar:</strong> {aadhaar.substring(0, 4)}****{aadhaar.substring(8)}</p>
            </div>

            {error && <div className="error-text">{error}</div>}

            <div className="form-actions">
              <button 
                className="btn primary-btn" 
                onClick={verifyFingerprint} 
                disabled={loading}
              >
                {loading ? "Verifying..." : "Verify Fingerprint"}
              </button>
              <button 
                className="btn secondary-btn" 
                onClick={() => setLoginStep("aadhaar")}
                disabled={loading}
              >
                Back
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Render blockchain registration step
  if (loginStep === "blockchain") {
    return (
      <div className="auth-page">
        <div className="auth-card card form">
          <header className="auth-header">
            <h2>Completing Login...</h2>
            <p className="muted">Setting up blockchain authentication</p>
          </header>
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Please wait...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card card form">
        <header className="auth-header">
          <h2>Voter Login</h2>
          <p className="muted">Enter your 12‑digit Aadhaar number to continue</p>
        </header>

        <form onSubmit={onSubmit} className="candidate-form">
          <div className="form-group">
            <label htmlFor="aadhaar">Aadhaar Number</label>
            <input
              id="aadhaar"
              type="text"
              inputMode="numeric"
              value={aadhaar}
              onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, "").slice(0, 12))}
              placeholder="123412341234"
              required
            />
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="info-box">
            <p><strong>Note:</strong> You will be asked to verify your fingerprint after submitting your Aadhaar number.</p>
          </div>

          <div className="form-actions">
            <button className="btn primary-btn" type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Continue to Fingerprint"}
            </button>
            <Link to="/register" className="helper-link">Register new voter</Link>
          </div>
        </form>
      </div>
    </div>
  );
}