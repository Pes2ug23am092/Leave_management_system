// src/components/ManagerSideNavigation.js
import React from 'react';
import { FaTh, FaUsers, FaTimes, FaCalendarAlt } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';
import './SideNavigation.css';
import TrendIcon from '@rsuite/icons/Trend';

function ManagerSideNavigation({ isOpen, toggleSidebar }) {
  const navItems = [
    // Use absolute paths under /manager to avoid accidental redirects
    { to: "/manager", icon: FaTh, text: "Dashboard", end: true },
    { to: "/manager/calendar", icon: FaCalendarAlt, text: "Calendar" },
    { to: "/manager/requests", icon: FaUsers, text: "Requests" },
    { to: "/manager/reports", icon: TrendIcon, text: "Reports" },
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
              to={item.to}
              end={item.end} // Ensures dashboard is only active when exactly on the base path
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

export default ManagerSideNavigation;
