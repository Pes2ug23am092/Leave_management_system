// src/components/AdminSideNavigation.js
import React from 'react';
import { FaTh, FaUsersCog, FaCog, FaListAlt, FaTimes } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import './SideNavigation.css'; 

function AdminSideNavigation({ isOpen, toggleSidebar }) {
  const navItems = [
    // FIX: ADDED 'end: true' HERE to ensure it only matches the exact path '/admin'
    { to: "/admin", icon: FaTh, text: "Admin Dashboard", end: true }, 
    
    // Employee Management - Maps to /admin/employees
    { to: "/admin/employees", icon: FaUsersCog, text: "Employee Management" },
    
    // Leave Type Management - Maps to /admin/leave-types
    { to: "/admin/leave-types", icon: FaListAlt, text: "Leave Type Config" },
    
    // Settings - Maps to /admin/settings
    { to: "/admin/settings", icon: FaCog, text: "System Settings" },
  ];

  return (
    <div className={`sidebar-wrapper ${isOpen ? 'open' : ''}`}>
      <div className="logo-section">
        <button className="sidebar-close-button" onClick={toggleSidebar}>
          <FaTimes />
        </button>
      </div>

      <ul className="nav-list">
        {navItems.map((item, index) => (
          <li className="nav-item" key={index}>
            <NavLink
              // CRUCIAL CHANGE: Passes the 'end: true' prop to the NavLink component
              end={item.end || false} 
              to={item.to}
              className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}
              onClick={toggleSidebar}
            >
              <span className="nav-icon"><item.icon /></span>
              <span className="nav-text">{item.text}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default AdminSideNavigation;