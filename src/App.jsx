import React from "react";
import { useState } from "react";
import { useAuth } from "./context/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";

export default function App() {
  const { isAuthenticated } = useAuth();
  const [authPage, setAuthPage] = useState("login");

  if (!isAuthenticated) {
    return authPage === "login" ? (
      <Login onSignup={() => setAuthPage("signup")} />
    ) : (
      <Signup
        onLogin={() => setAuthPage("login")}
        onSignupSuccess={() => setAuthPage("login")}
      />
    );
  }

  return <Dashboard />;
}
