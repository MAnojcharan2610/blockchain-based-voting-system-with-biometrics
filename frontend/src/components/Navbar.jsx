import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import "../styles/navbar.scss";
import { logoutFirebase } from "../utils/firebase";

export default function Navbar({ user }) {
  const navigate = useNavigate();
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const handleSignOut = async () => {
    await logoutFirebase();
    localStorage.clear();
    navigate("/login");
  };

  return (
    <>
      {/* Profile Section at Top Right */}
      <div className="profile-section">
        {user && (
          <div className="profile-menu">
            <button 
              className="profile-button"
              onClick={() => setShowProfileMenu(!showProfileMenu)}
            >
              <span className="profile-initial">
                {user.email?.[0]?.toUpperCase() || 'U'}
              </span>
              <span className="profile-email">{user.email}</span>
            </button>
            {showProfileMenu && (
              <div className="profile-dropdown">
                <div className="profile-info">
                  <strong>{user.email}</strong>
                  <span>Voter</span>
                </div>
                <button onClick={handleSignOut}>Sign Out</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Sidebar Navigation */}
      <nav className="sidebar">
        <div className="nav-logo">
          <h2>E-Voting</h2>
        </div>
        
        <div className="nav-links">
          <NavLink 
            to="/dashboard" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <i className="fas fa-home"></i>
            Dashboard
          </NavLink>
          
          <NavLink 
            to="/vote" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <i className="fas fa-vote-yea"></i>
            Vote
          </NavLink>
          
          <NavLink 
            to="/results" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <i className="fas fa-poll"></i>
            Results
          </NavLink>
          
          <NavLink 
            to="/add-candidate" 
            className={({ isActive }) => isActive ? 'active' : ''}
          >
            <i className="fas fa-user-plus"></i>
            Add Candidate
          </NavLink>
        </div>
      </nav>
    </>
  );
}