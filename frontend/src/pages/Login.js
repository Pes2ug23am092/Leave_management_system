import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./login.css";

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) return alert("Please enter both email and password");

    // Normalize inputs to avoid whitespace/case issues
    const emailClean = String(email).trim().toLowerCase();
    const passwordClean = String(password).trim();

    try {
      setLoading(true);
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailClean, password: passwordClean }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.role) {
        // Normalize role to lowercase for consistent checks
        const normalizedRole = String(data.role).toLowerCase();

        // ✅ UPDATED: Consistent LocalStorage Keys
        localStorage.setItem("token", data.token);
        localStorage.setItem("userRole", normalizedRole); // store normalized role
        localStorage.setItem("userName", data.userName || email); // Storing username

        // ✅ UPDATED: Navigation paths match new routes in App.js
        if (normalizedRole === "employee") navigate("/employee");
        else if (normalizedRole === "manager") navigate("/manager");
        else if (normalizedRole === "admin") navigate("/admin");
        else navigate("/employee"); // Default to employee dashboard
      } else {
        // Show more helpful message for 401
        const msg = data?.message || (response.status === 401 ? "Invalid email or password" : "Login failed");
        alert(msg);
      }
    } catch (err) {
      console.error(err);
      alert("Server error, try again later");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <h1>Leave Management</h1>
        <p>Welcome to LMS</p>
      </div>
      <div className="login-right">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <label>Email</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="submit" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Login;
