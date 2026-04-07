import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { registerFirebase } from "../utils/firebase";
import { sanitizeName, sanitizeAadhaar, sanitizeAge, validateAadhaar, validateAge } from "../utils/sanitize";
import { fingerprintAPI } from "../utils/biometric";
import "../styles/main.scss";

export default function Register() {
  const [name, setName] = useState("");
  const [aadhaar, setAadhaar] = useState("");
  const [age, setAge] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [enrollmentStep, setEnrollmentStep] = useState("form"); // "form", "fingerprints", "complete"
  const [currentFingerIndex, setCurrentFingerIndex] = useState(0);
  const [enrolledFingers, setEnrolledFingers] = useState([]);
  const navigate = useNavigate();

  const TOTAL_FINGERS = 10;
  const fingerNames = [
    "Right Thumb", "Right Index", "Right Middle", "Right Ring", "Right Pinky",
    "Left Thumb", "Left Index", "Left Middle", "Left Ring", "Left Pinky"
  ];

  useEffect(() => {
    const es = {};
    if (name && sanitizeName(name).length < 2) es.name = "Please enter your full name";
    if (aadhaar && !validateAadhaar(aadhaar)) es.aadhaar = "Aadhaar must be 12 digits";
    if (age && !validateAge(age, 18)) es.age = "You must be 18 or older";
    setErrors(es);
  }, [name, aadhaar, age]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    const cleanName = sanitizeName(name);
    const cleanAadhaar = sanitizeAadhaar(aadhaar);
    const cleanAge = sanitizeAge(age);

    if (!cleanName) {
      setErrors({ name: "Name is required" }); return;
    }
    if (!validateAadhaar(cleanAadhaar)) {
      setErrors({ aadhaar: "Enter a valid 12-digit Aadhaar number" }); return;
    }
    if (!validateAge(cleanAge, 18)) {
      setErrors({ age: "You must be 18 or older" }); return;
    }

    setLoading(true);
    try {
      // First register in Firebase
      await registerFirebase(cleanName, cleanAadhaar, Number(cleanAge));
      
      // Start fingerprint enrollment
      await fingerprintAPI.startEnrollment(cleanAadhaar);
      toast.info("Please proceed with fingerprint enrollment");
      
      // Move to fingerprint enrollment step
      setEnrollmentStep("fingerprints");
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const captureFingerprint = async () => {
    setLoading(true);
    try {
      const result = await fingerprintAPI.captureFingerprint(aadhaar, currentFingerIndex);
      
      if (result.success) {
        setEnrolledFingers([...enrolledFingers, currentFingerIndex]);
        toast.success(`${fingerNames[currentFingerIndex]} enrolled successfully`);
        
        if (currentFingerIndex + 1 >= TOTAL_FINGERS) {
          // All fingers enrolled
          await fingerprintAPI.completeEnrollment(aadhaar);
          setEnrollmentStep("complete");
          toast.success("All fingerprints enrolled!");
          
          // Redirect to login after 2 seconds
          setTimeout(() => {
            navigate("/login", { replace: true });
          }, 2000);
        } else {
          // Move to next finger
          setCurrentFingerIndex(currentFingerIndex + 1);
        }
      } else {
        toast.error("Failed to capture fingerprint. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Fingerprint capture failed");
    } finally {
      setLoading(false);
    }
  };

  // Render different views based on enrollment step
  if (enrollmentStep === "fingerprints") {
    return (
      <div className="auth-page">
        <div className="auth-card card form" role="main" aria-labelledby="fingerprint-title">
          <header className="auth-header">
            <h2 id="fingerprint-title">Fingerprint Enrollment</h2>
            <p className="muted">Please scan all 10 fingers for biometric authentication</p>
          </header>

          <div className="fingerprint-enrollment">
            <div className="enrollment-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${(enrolledFingers.length / TOTAL_FINGERS) * 100}%` }}
                ></div>
              </div>
              <p className="progress-text">
                {enrolledFingers.length} of {TOTAL_FINGERS} fingerprints enrolled
              </p>
            </div>

            <div className="current-finger">
              <div className="finger-icon">👆</div>
              <h3>Scan: {fingerNames[currentFingerIndex]}</h3>
              <p className="instruction">
                Place your {fingerNames[currentFingerIndex].toLowerCase()} on the sensor
              </p>
            </div>

            <div className="enrolled-fingers">
              <h4>Enrolled Fingers:</h4>
              <div className="finger-grid">
                {fingerNames.map((name, idx) => (
                  <div 
                    key={idx} 
                    className={`finger-item ${enrolledFingers.includes(idx) ? 'enrolled' : ''} ${currentFingerIndex === idx ? 'current' : ''}`}
                  >
                    <span className="finger-status">
                      {enrolledFingers.includes(idx) ? '✓' : idx < currentFingerIndex ? '✗' : '○'}
                    </span>
                    <span className="finger-name">{name}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="form-actions">
              <button 
                className="btn primary-btn" 
                onClick={captureFingerprint} 
                disabled={loading}
              >
                {loading ? "Capturing..." : "Capture Fingerprint"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (enrollmentStep === "complete") {
    return (
      <div className="auth-page">
        <div className="auth-card card form" role="main">
          <header className="auth-header">
            <h2>Enrollment Complete! ✓</h2>
            <p className="muted">All fingerprints have been successfully enrolled</p>
          </header>
          <div className="completion-message">
            <div className="success-icon">🎉</div>
            <p>You will be redirected to the login page...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card card form" role="main" aria-labelledby="register-title">
        <header className="auth-header">
          <h2 id="register-title">Voter Registration</h2>
          <p className="muted">Register with your Aadhaar to participate</p>
        </header>

        <form onSubmit={onSubmit} className="candidate-form" noValidate>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="name">Full name</label>
              <input
                id="name"
                name="name"
                value={name}
                onChange={(e) => setName(sanitizeName(e.target.value))}
                placeholder="John Doe"
                required
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && <div id="name-error" className="error-text">{errors.name}</div>}
            </div>

            <div className="form-group">
              <label htmlFor="age">Age</label>
              <input
                id="age"
                name="age"
                type="number"
                min="18"
                value={age}
                onChange={(e) => setAge(sanitizeAge(e.target.value))}
                placeholder="18"
                required
                aria-invalid={!!errors.age}
                aria-describedby={errors.age ? "age-error" : undefined}
              />
              {errors.age && <div id="age-error" className="error-text">{errors.age}</div>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="aadhaar">Aadhaar Number</label>
            <input
              id="aadhaar"
              name="aadhaar"
              inputMode="numeric"
              value={aadhaar}
              onChange={(e) => setAadhaar(sanitizeAadhaar(e.target.value))}
              placeholder="123412341234"
              maxLength={12}
              required
              aria-invalid={!!errors.aadhaar}
              aria-describedby={errors.aadhaar ? "aadhaar-error" : undefined}
            />
            {errors.aadhaar && <div id="aadhaar-error" className="error-text">{errors.aadhaar}</div>}
          </div>

          <div className="info-box">
            <p><strong>Note:</strong> After form submission, you will be asked to scan 10 fingerprints for biometric authentication.</p>
          </div>

          <div className="form-actions">
            <button className="btn primary-btn" type="submit" disabled={loading || Object.keys(errors).length > 0}>
              {loading ? "Registering..." : "Register & Enroll Fingerprints"}
            </button>
            <Link to="/login" className="helper-link">Already registered? Login</Link>
          </div>
        </form>
      </div>
    </div>
  );
}