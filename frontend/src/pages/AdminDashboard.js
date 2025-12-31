import React, { useState, useEffect } from 'react';
import { FaUsers, FaChartLine, FaCheckCircle, FaClipboardList, FaUsersCog, FaTools, FaDatabase, FaSync } from 'react-icons/fa';
import Card from '../components/Card';
import { useNavigate } from 'react-router-dom';
import { fetchAdminMetrics, fetchSystemStats } from '../services/apiService';
import './AdminDashboard.css';

function AdminDashboard() {
  const navigate = useNavigate();
  
  // State management
  const [metrics, setMetrics] = useState({
    totalEmployees: 0,
    totalLeaveDaysTaken: 0,
    pendingRequests: 0,
    approvedToday: 0
  });
  const [systemStats, setSystemStats] = useState({
    departmentStats: [],
    leaveUtilization: [],
    monthlyTrends: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch admin data
  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('🔍 Fetching admin dashboard data...');
        
        // Fetch metrics and stats in parallel
        const [metricsResponse, statsResponse] = await Promise.all([
          fetchAdminMetrics(),
          fetchSystemStats()
        ]);
        
        console.log('✅ Admin metrics:', metricsResponse.data);
        console.log('✅ System stats:', statsResponse.data);
        
        setMetrics(metricsResponse.data);
        setSystemStats(statsResponse.data);
        
      } catch (error) {
        console.error('❌ Error fetching admin data:', error);
        if (error.response) {
          console.error('📊 Response status:', error.response.status);
          console.error('📊 Response data:', error.response.data);
          
          if (error.response.status === 403) {
            setError('Access denied. Admin privileges required.');
          } else {
            setError('Failed to load admin dashboard data.');
          }
        } else {
          setError('Network error. Please check your connection.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  // Refresh data function
  const handleRefresh = async () => {
    setLoading(true);
    try {
      const [metricsResponse, statsResponse] = await Promise.all([
        fetchAdminMetrics(),
        fetchSystemStats()
      ]);
      
      setMetrics(metricsResponse.data);
      setSystemStats(statsResponse.data);
      console.log('✅ Admin dashboard data refreshed');
    } catch (error) {
      console.error('❌ Error refreshing admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Dynamic metrics based on real data
  const adminMetrics = [
    { 
      id: 1, 
      label: 'Total Employees', 
      value: metrics.totalEmployees || 0, 
      icon: FaUsers, 
      color: 'var(--color-primary)' 
    },
    { 
      id: 2, 
      label: 'Total Leave Days Taken (YTD)', 
      value: metrics.totalLeaveDaysTaken || 0, 
      icon: FaChartLine, 
      color: 'var(--color-success)' 
    },
    { 
      id: 3, 
      label: 'System Pending Requests', 
      value: metrics.pendingRequests || 0, 
      icon: FaClipboardList, 
      color: 'var(--color-warning)' 
    },
    { 
      id: 4, 
      label: 'Approved Requests (Today)', 
      value: metrics.approvedToday || 0, 
      icon: FaCheckCircle, 
      color: 'var(--color-secondary)' 
    },
  ];

  const quickActions = [
    { 
      id: 1, 
      label: 'User Management', 
      description: 'Add, edit, or remove employee accounts.', 
      icon: FaUsersCog, 
      path: '/admin/employees' 
    },
    { 
      id: 2, 
      label: 'Leave Type Configuration', 
      description: 'Manage leave types and quotas.', 
      icon: FaTools, 
      path: '/admin/leave-types' 
    },
    { 
      id: 3, 
      label: 'System Settings', 
      description: 'Adjust global leave policies and settings.', 
      icon: FaDatabase, 
      path: '/admin/settings' 
    },
  ];

  // Loading state
  if (loading && !metrics.totalEmployees) {
    return (
      <div className="admin-dashboard-wrapper">
        <div className="loading-state">
          <p>Loading admin dashboard...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="admin-dashboard-wrapper">
        <div className="error-state">
          <h3>Error Loading Dashboard</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={handleRefresh}>
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-wrapper">
      <div className="admin-header">
        <h1 className="page-title">Admin Console Overview</h1>
        <button 
          className="btn btn-secondary refresh-btn" 
          onClick={handleRefresh}
          disabled={loading}
        >
          <FaSync className={loading ? 'spinning' : ''} /> Refresh
        </button>
      </div>

      {/* --- Key Metrics Grid --- */}
      <div className="admin-metrics-grid">
        {adminMetrics.map(metric => (
          <div className="metric-card" key={metric.id}>
            <metric.icon className="metric-icon" style={{ color: metric.color }} />
            <div className="metric-content">
              <div className="metric-value">{metric.value}</div>
              <div className="metric-label">{metric.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* --- Quick Actions and System Health --- */}
      <div className="admin-overview-grid">
        
        {/* Quick Actions Card */}
        <Card title="Quick Actions" className="quick-actions-card">
          <div className="quick-actions-list">
            {quickActions.map(action => (
              <button 
                key={action.id}
                className="action-button btn btn-secondary"
                onClick={() => navigate(action.path)}
              >
                <action.icon className="action-icon" />
                <div className="action-text">
                  <div className="action-label">{action.label}</div>
                  <small className="action-description">{action.description}</small>
                </div>
              </button>
            ))}
          </div>
        </Card>

        {/* Department Statistics Card */}
        <Card title="Department Overview" className="department-stats-card">
          <div className="department-stats">
            {systemStats.departmentStats && systemStats.departmentStats.length > 0 ? (
              systemStats.departmentStats.slice(0, 5).map((dept, index) => (
                <div key={index} className="dept-stat-item">
                  <span className="dept-name">{dept.department || 'Unknown'}</span>
                  <span className="dept-count">{dept.count} employees</span>
                </div>
              ))
            ) : (
              <p className="no-data">No department data available</p>
            )}
          </div>
        </Card>
      </div>

      {/* --- System Analytics --- */}
      <div className="admin-analytics-grid">
        
        {/* Leave Utilization Card */}
        <Card title="Leave Type Utilization" className="leave-utilization-card">
          <div className="utilization-list">
            {systemStats.leaveUtilization && systemStats.leaveUtilization.length > 0 ? (
              systemStats.leaveUtilization.map((leave, index) => (
                <div key={index} className="utilization-item">
                  <div className="leave-type-name">{leave.LeaveName}</div>
                  <div className="utilization-stats">
                    <span className="taken">{leave.totalTaken || 0} taken</span>
                    <span className="allocated">/ {leave.totalAllocated || 0} allocated</span>
                  </div>
                  <div className="utilization-bar">
                    <div 
                      className="utilization-fill" 
                      style={{ 
                        width: `${Math.min(100, ((leave.totalTaken || 0) / (leave.totalAllocated || 1)) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              ))
            ) : (
              <p className="no-data">No leave utilization data available</p>
            )}
          </div>
        </Card>

        {/* Monthly Trends Card */}
        <Card title="Monthly Leave Trends" className="monthly-trends-card">
          <div className="trends-list">
            {systemStats.monthlyTrends && systemStats.monthlyTrends.length > 0 ? (
              systemStats.monthlyTrends.map((month, index) => (
                <div key={index} className="trend-item">
                  <span className="month-name">
                    {new Date(2024, month.month - 1).toLocaleDateString('en-US', { month: 'short' })}
                  </span>
                  <span className="trend-stats">
                    {month.applications} applications, {month.approved} approved
                  </span>
                </div>
              ))
            ) : (
              <p className="no-data">No monthly trend data available</p>
            )}
          </div>
        </Card>
      </div>

    </div>
  );
}

export default AdminDashboard;
