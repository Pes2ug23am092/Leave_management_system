import React, { useState } from "react";
import { Routes, Route } from "react-router-dom";
import TopNavigation from "../components/TopNavigation";
import ManagerSideNavigation from "../components/ManagerSidenavigation";
import ManagerDashboard from "../pages/ManagerDashboard"; // your dashboard page
import ManagerRequests from "../pages/ManagerRequests";
import ManagerReports from "../pages/ManagerReports";
import Calendar from "../pages/Calendar";
import Profile from "../pages/Profile";
import Modal from "../components/Modal";
import { submitLeaveApplication } from '../services/apiService'; 
//import "./ManagerRoutes.css";

function ManagerRoutes({ isSidebarOpen: propIsSidebarOpen, toggleSidebar: propToggleSidebar }) {
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
    <div className={`manager-layout ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <TopNavigation toggleSidebar={toggleSidebar} />
      <ManagerSideNavigation isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={<ManagerDashboard openApplyLeaveModal={openApplyLeaveModal} />} 
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/requests" element={<ManagerRequests />} />
          <Route path="/reports" element={<ManagerReports />} />
          <Route path="/calendar" element={<Calendar />} />
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

export default ManagerRoutes;
