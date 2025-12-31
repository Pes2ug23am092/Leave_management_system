// src/components/EmployeeSideNavigation.js
import React from 'react';
import { FaTh, FaCalendarAlt, FaHistory, FaListAlt, FaTimes } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import './SideNavigation.css';

function EmployeeSideNavigation({ isOpen, toggleSidebar }) {
  const navItems = [
    // FIX: Changed path from "/employee/associate" to "/employee" to match the base route defined in App.js and EmployeeRoutes.js
    { to: "/employee", icon: FaTh, text: "Dashboard" },
    // Ensuring other links use the correct prefix
    { to: "/employee/leave-balances", icon: FaListAlt, text: "Leave Balance" },
    { to: "/employee/history", icon: FaHistory, text: "History" },
    { to: "/employee/calendar", icon: FaCalendarAlt, text: "Calendar" },
  ];

  return (
    <div className={`sidebar-wrapper ${isOpen ? 'open' : 'closed'}`}>
      <div className="logo-section">
        <button className="sidebar-close-button" onClick={toggleSidebar}>
          <FaTimes />
        </button>
      </div>

      <ul className="nav-list">
        {navItems.map((item, index) => (
          <li className="nav-item" key={index}>
            <NavLink
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

export default EmployeeSideNavigation;
