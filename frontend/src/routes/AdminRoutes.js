import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminSideNavigation from '../components/AdminSideNavigation';

import AdminDashboard from '../pages/AdminDashboard';
import Calendar from '../pages/Calendar';
import AdminLeaveTypeManagement from '../pages/AdminLeaveTypeManagement';
import AdminEmployeeManagement from '../pages/AdminEmployeeManagement';
import AdminSettings from '../pages/AdminSettings';
import Profile from '../pages/Profile';

function AdminRoutes({ isSidebarOpen: propIsSidebarOpen, toggleSidebar: propToggleSidebar }) {
  // fallback local state if parent doesn't provide sidebar control
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
  const isSidebarOpen = typeof propIsSidebarOpen === 'boolean' ? propIsSidebarOpen : localSidebarOpen;
  const toggleSidebar = typeof propToggleSidebar === 'function' ? propToggleSidebar : () => setLocalSidebarOpen(s => !s);

  return (
    <div className="admin-layout">
      <AdminSideNavigation isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="main-content">
        <Routes>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/employees" element={<AdminEmployeeManagement />} />
          <Route path="/leave-types" element={<AdminLeaveTypeManagement />} />
          <Route path="/settings" element={<AdminSettings />} />
          <Route path="/calendar" element={<Calendar />} />

          {/* Added Profile route */}
          <Route path="/profile" element={<Profile />} />

          {/* Default fallback */}
          <Route path="*" element={<AdminDashboard />} />
        </Routes>
      </main>
    </div>
  );
}

export default AdminRoutes;
