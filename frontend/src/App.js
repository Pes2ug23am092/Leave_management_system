import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Login from "./pages/Login";
import EmployeeRoutes from "./routes/EmployeeRoutes";
import ManagerRoutes from "./routes/ManagerRoutes";
import AdminRoutes from "./routes/AdminRoutes";
import TopNavigation from "./components/TopNavigation";

// Component to conditionally render TopNavigation
function ConditionalTopNavigation({ toggleSidebar }) {
  const location = useLocation();
  const isLoginPage = location.pathname === '/login' || location.pathname === '/' || location.pathname === '';
  
  // Debug logging
  console.log('🔍 Current pathname:', location.pathname);
  console.log('🔍 Is login page:', isLoginPage);
  
  // Don't render TopNavigation on login page
  if (isLoginPage) {
    console.log('✅ Hiding TopNavigation for login page');
    return null;
  }
  
  console.log('📋 Showing TopNavigation for authenticated page');
  return <TopNavigation toggleSidebar={toggleSidebar} style={{ marginBottom: "2rem" }} />;
}

function App() {
  // Centralized state for sidebar visibility
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  return (
    // The outermost wrapper handles the global layout and sidebar state for CSS offsets.
    <div className={`app-container ${isSidebarOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
      <Router>
        {/*
          CRITICAL FIX: TopNavigation is now conditionally rendered 
          so it doesn't appear on the login page
        */}
        <ConditionalTopNavigation toggleSidebar={toggleSidebar} />

        {/* All other components that use routing (like Login, EmployeeRoutes, etc.) 
          must be children of <Router>. 
        */}
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Employee Layout Routes */}
          <Route 
            path="/employee/*" 
            element={<EmployeeRoutes isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />} 
          />

          {/* Manager Layout Routes */}
          <Route 
            path="/manager/*" 
            element={<ManagerRoutes isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />} 
          />

          {/* Admin Layout Routes */}
          <Route 
            path="/admin/*" 
            element={<AdminRoutes isSidebarOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />} 
          />

          {/* Default redirect to login */}
          <Route path="*" element={<Login />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;
