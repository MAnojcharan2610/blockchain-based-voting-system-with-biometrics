import React, { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import Layout from "./components/Layout";
import GetStarted from "./components/GetStarted";
import Auth from "./components/Auth";
import Register from "./components/Register";
import Login from "./components/Login";
import Dashboard from "./components/Dashboard";
import Vote from "./components/Vote";
import AddCandidate from "./components/AddCandidate";
import Results from "./components/Results";
import VoterList from "./components/VoterList";

function useVoterSession() {
  const [voterData, setVoterData] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("voterData"));
    } catch {
      return null;
    }
  });

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === "voterData") {
        try {
          setVoterData(JSON.parse(e.newValue));
        } catch {
          setVoterData(null);
        }
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return [voterData, setVoterData];
}

function ProtectedRoute({ children }) {
  // read session directly from localStorage on every render (works in same tab)
  const raw = localStorage.getItem("voterData");
  if (!raw) {
    return <Navigate to="/login" replace />;
  }
  try {
    const data = JSON.parse(raw);
    if (!data?.isLoggedIn) return <Navigate to="/login" replace />;
  } catch {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function App() {
  const [voterData] = useVoterSession();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<GetStarted />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />

        {/* Protected routes using voterData (Aadhaar login) */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout user={voterData}>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/vote"
          element={
            <ProtectedRoute>
              <Layout user={voterData}>
                <Vote />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-candidate"
          element={
            <ProtectedRoute>
              <Layout user={voterData}>
                <AddCandidate />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/results"
          element={
            <ProtectedRoute>
              <Layout user={voterData}>
                <Results />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/voters"
          element={
            <ProtectedRoute>
              <Layout user={voterData}>
                <VoterList />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
      <ToastContainer position="top-right" />
    </BrowserRouter>
  );
}
