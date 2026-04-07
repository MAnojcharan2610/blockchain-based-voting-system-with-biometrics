import React from "react";
import Navbar from "./Navbar";
import "../styles/layout.scss";

export default function Layout({ user, children }) {
  return (
    <div className="layout">
      <Navbar user={user} />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}