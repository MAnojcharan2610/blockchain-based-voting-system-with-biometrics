import React from "react";
import { Link } from "react-router-dom";
import "../styles/main.scss";

export default function GetStarted() {
  const features = [
    {
      title: "Secure Registration",
      desc: "Aadhaar-verified onboarding with hashed PII and server-side validation.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M12 1v4" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <rect x="3" y="8" width="18" height="13" rx="2" stroke="#93c5fd" strokeWidth="1.5"/>
          <path d="M8 13l2.5 2.5L16 10" stroke="#60a5fa" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: "Blockchain Integrity",
      desc: "Every vote immutably recorded on-chain for auditability and trust.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M4 7h16M4 12h16M4 17h16" stroke="#7c3aed" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: "Real-time Results",
      desc: "Live tallies and modern visualizations for transparent monitoring.",
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path d="M3 18h18M7 14v4M12 8v10M17 11v7" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    }
  ];

  return (
    <main className="getstarted-page container">
      <section className="getstarted-hero card">
        <div className="hero-left">
          <div className="eyebrow">E‑Voting</div>
          <h1 className="hero-title">Secure, Transparent & Accessible Voting</h1>
          <p className="hero-sub">
            Build trust with Aadhaar-backed voter registration and blockchain-based vote recording.
            Designed for ease of use, auditability and privacy-preserving workflows.
          </p>

          <div className="hero-cta">
            <Link to="/register" className="btn primary-btn">Get Started — Register</Link>
            <Link to="/login" className="btn secondary-btn">Login</Link>
          </div>

          <ul className="quick-list">
            <li>Privacy-first: only hashed identifiers stored</li>
            <li>Sepolia testnet for safe testing</li>
            <li>Realtime tallies & exportable audit logs</li>
          </ul>
        </div>

        <div className="hero-right" aria-hidden>
          <div className="illustration-card">
            {/* polished SVG illustration */}
            <svg viewBox="0 0 720 480" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
              <defs>
                <linearGradient id="gA" x1="0" x2="1">
                  <stop offset="0" stopColor="#2563eb"/>
                  <stop offset="1" stopColor="#7c3aed"/>
                </linearGradient>
                <filter id="f1" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="8" stdDeviation="24" floodColor="#000" floodOpacity="0.35"/>
                </filter>
              </defs>

              <rect x="40" y="40" rx="20" width="640" height="400" fill="url(#gA)" opacity="0.08" />
              <g transform="translate(90,90)" filter="url(#f1)">
                <rect x="0" y="0" rx="14" width="220" height="140" fill="#0f172a" opacity="0.98"/>
                <rect x="240" y="0" rx="14" width="220" height="140" fill="#0f172a" opacity="0.95"/>
                <rect x="120" y="160" rx="14" width="300" height="180" fill="#0f172a" opacity="0.97"/>
                <g transform="translate(20,20)" fill="none" stroke="#60a5fa" strokeWidth="2">
                  <circle cx="60" cy="30" r="6" fill="#60a5fa"/>
                  <path d="M10 110h60" stroke="#93c5fd" strokeWidth="3" />
                </g>
              </g>
            </svg>
          </div>
        </div>
      </section>

      <section className="features card">
        <h2 className="form-title">Why E‑Voting</h2>
        <div className="features-grid">
          {features.map((f, i) => (
            <article className="feature-card" key={i}>
              <div className="feature-icon">{f.icon}</div>
              <div>
                <h3>{f.title}</h3>
                <p>{f.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}