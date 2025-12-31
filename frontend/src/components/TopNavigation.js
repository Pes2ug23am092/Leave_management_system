import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./TopNavigation.css";

const TopNavigation = ({ toggleSidebar }) => {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userName = localStorage.getItem("userName") || "User";
  const userRole = localStorage.getItem("userRole") || "employee";

  // Toggle the dropdown visibility
  const toggleDropdown = () => setShowDropdown(!showDropdown);

  // ✅ Handle logout properly
  const handleLogout = () => {
    // Clear all user-related data
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userRole");

    // Close dropdown
    setShowDropdown(false);

    // ✅ Redirect to login page
    navigate("/login");
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="top-nav-wrapper">
      <div className="top-nav-left">
        <button className="hamburger-icon" onClick={toggleSidebar}>
          ☰
        </button>
        <div className="logo-container">
          <img 
            src="/LMS_logo.png" 
            alt="LMS Logo" 
            className="logo-icon" 
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = "https://placehold.co/32x32/1e3a8a/ffffff?text=LMS"; 
            }} 
          />
          <img 
            src="/WORDMARK.png" 
            alt="LMS Wordmark" 
            className="logo-text-image" 
            onError={(e) => { 
              e.target.onerror = null; 
              e.target.src = "https://placehold.co/120x32/1e3a8a/ffffff?text=LeaveItToUs"; 
            }} 
          />
        </div>
      </div>

      <div className="top-nav-right" ref={dropdownRef}>
        <div className="user-avatar" onClick={toggleDropdown}>
          <img 
            src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHZpZXdCb3g9IjAgMCA0MCA0MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMjAiIGN5PSIyMCIgcj0iMjAiIGZpbGw9IiNGNUY1RjUiLz4KPGNpcmNsZSBjeD0iMjAiIGN5PSIxNiIgcj0iNiIgZmlsbD0iIzlDQTNBRiIvPgo8cGF0aCBkPSJNOCAzMkM4IDI2LjQ3NzIgMTIuNDc3MiAyMiAxOCAyMkMyMy41MjI4IDIyIDI4IDI2LjQ3NzIgMjggMzJWNDBIOFYzMloiIGZpbGw9IiM5Q0EzQUYiLz4KPC9zdmc+" 
            alt="User Avatar" 
            className="generic-avatar"
          />
        </div>

        {showDropdown && (
          <div className="dropdown-menu">
             <div className="dropdown-header">
              <p className="user-name-display">{userName}</p>
              <p className="user-role-display">({userRole})</p>
            </div>

            <button
              className="dropdown-item"
              onClick={() => {
                setShowDropdown(false);
                const userRole = localStorage.getItem("userRole");
                // FIX: Navigate using the new, correct base paths
                if (userRole === "manager") {
                  navigate("/manager/profile");
                } else {
                  navigate("/employee/profile");
                }
              }}
            >
              Profile
            </button>

            <button className="dropdown-item" onClick={handleLogout}>
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopNavigation;
