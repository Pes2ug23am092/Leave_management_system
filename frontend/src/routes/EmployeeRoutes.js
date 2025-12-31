// frontend/src/routes/EmployeeRoutes.js

import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";
import EmployeeSideNavigation from "../components/SideNavigation";
import Profile from "../pages/Profile";
import EmployeeDashboard from "../pages/Dashboard";
import Calendar from "../pages/Calendar";
import LeaveBalances from "../pages/LeaveBalances";
import History from "../pages/History";
import Modal from "../components/Modal";
import { submitLeaveApplication } from '../services/apiService'; 

function EmployeeRoutes({ isSidebarOpen: propIsSidebarOpen, toggleSidebar: propToggleSidebar }) {
  // fallback local state if parent doesn't provide sidebar control
  const [localSidebarOpen, setLocalSidebarOpen] = useState(false);
  const isSidebarOpen = typeof propIsSidebarOpen === 'boolean' ? propIsSidebarOpen : localSidebarOpen;
  const toggleSidebar = typeof propToggleSidebar === 'function' ? propToggleSidebar : () => setLocalSidebarOpen(s => !s);

  // 🛑 STATE FOR MODAL 🛑
  const [isModalOpen, setIsModalOpen] = useState(false); 

  const openApplyLeaveModal = () => setIsModalOpen(true);
  const closeApplyLeaveModal = () => setIsModalOpen(false);

  // FUNCTION TO SUBMIT LEAVE
  const handleLeaveSubmit = async (leaveData) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('Your session has expired. Please log in again.');
        window.location.assign('/login?returnTo=/employee');
        return;
      }
      await submitLeaveApplication(leaveData);
      closeApplyLeaveModal(); 
      alert("Leave application submitted successfully!");
      
    } catch (error) {
      console.error('❌ Leave submission failed:', error.response ? error.response.data : error.message);
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'An unknown error occurred during submission.';
      alert(`Submission failed: ${errorMessage}`);
    }
  };

  return (
    <div className="employee-layout">
      <TopNavigation toggleSidebar={toggleSidebar} style={{ marginBottom: "2rem" }} />
      <EmployeeSideNavigation isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={<EmployeeDashboard openApplyLeaveModal={openApplyLeaveModal} />} 
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/calendar" element={<Calendar />} />
          <Route path="/leave-balances" element={<LeaveBalances />} />
          <Route path="/history" element={<History />} />
        </Routes>
      </main>

      {/* RENDER THE MODAL */}
      {isModalOpen && (
        <Modal // 🛑 Using the correct component name: Modal 🛑
          isOpen={isModalOpen} 
          onClose={closeApplyLeaveModal} 
          onSubmit={handleLeaveSubmit}
        />
      )}
    </div>
  );
}

export default EmployeeRoutes;