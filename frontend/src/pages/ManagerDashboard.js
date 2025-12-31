import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import { FaChevronLeft, FaChevronRight, FaPlus, FaFilter, FaCalendarAlt, FaListAlt, FaPencilAlt, FaTrashAlt, FaCheckCircle, FaSync } from 'react-icons/fa';
import Card from '../components/Card';
import './Dashboard.css'; // Reusing the main layout and card styles
import './ManagerDashboard.css'; // Importing new styles for unique cards
import { 
  fetchLeaveBalances, 
  fetchTeamTimeOff, 
  fetchTeamLeaveRequests,
  fetchUpcomingHolidays,
  fetchTeamLeaveHistory,
  getPendingCancellationRequests,
  handleCancellationRequest
} from '../services/apiService';

function ManagerDashboard({ openApplyLeaveModal }) {
  const navigate = useNavigate();
  
  // --- STATE MANAGEMENT ---
  const [leaveSummary, setLeaveSummary] = useState([]);
  const [teamTimeOff, setTeamTimeOff] = useState([]);
  const [pendingRequestsCount, setPendingRequestsCount] = useState(0);
  const [pendingCancellations, setPendingCancellations] = useState([]);
  const [upcomingHolidays, setUpcomingHolidays] = useState([]);
  const [currentHolidayIndex, setCurrentHolidayIndex] = useState(0);
  const [teamLeaveHistory, setTeamLeaveHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // --- DATA FETCHING ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        
        // Fetch all dashboard data in parallel
        const [balancesResponse, teamResponse, requestsResponse, holidaysResponse, historyResponse, cancellationResponse] = await Promise.all([
          fetchLeaveBalances(),
          fetchTeamTimeOff(),
          fetchTeamLeaveRequests(),
          fetchUpcomingHolidays(),
          fetchTeamLeaveHistory(),
          getPendingCancellationRequests()
        ]);
        
        // Set leave balances for manager's own summary
        setLeaveSummary(balancesResponse.data);
        
        // Set team time off data
        setTeamTimeOff(teamResponse.data);
        
        // Count pending requests for the manager
        const pendingCount = requestsResponse.data.filter(req => req.status === 'Pending').length;
        setPendingRequestsCount(pendingCount);
        
        // Set pending cancellation requests
        setPendingCancellations(cancellationResponse.data);
        
        // Set upcoming holidays
        setUpcomingHolidays(holidaysResponse.data);
        setCurrentHolidayIndex(0);
        
        // Set team leave history
        console.log('🔍 Team leave history response:', historyResponse.data);
        setTeamLeaveHistory(historyResponse.data);
        
        console.log('✅ Manager dashboard data loaded successfully');
        
      } catch (error) {
        console.error('❌ Error fetching manager dashboard data:', error);
        if (error.response) {
          console.error('📊 Response data:', error.response.data);
          console.error('📊 Response status:', error.response.status);
          console.error('📊 Response headers:', error.response.headers);
          
          // Log specific backend error details
          if (error.response.data?.details) {
            console.error('🔍 Backend error details:', error.response.data.details);
            console.error('🔍 Backend error code:', error.response.data.code);
          }
        } else if (error.request) {
          console.error('📡 No response received:', error.request);
        } else {
          console.error('⚙️ Error setting up request:', error.message);
        }
        console.error('🔧 Full error config:', error.config);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Function to refresh dashboard data
  const refreshDashboardData = async () => {
    try {
      console.log('🔄 Refreshing dashboard data...');
      setLoading(true);
      
      const [balancesResponse, teamResponse, requestsResponse, holidaysResponse, historyResponse, cancellationResponse] = await Promise.all([
        fetchLeaveBalances(),
        fetchTeamTimeOff(),
        fetchTeamLeaveRequests(),
        fetchUpcomingHolidays(),
        fetchTeamLeaveHistory(),
        getPendingCancellationRequests()
      ]);
      
      setLeaveSummary(balancesResponse.data);
      setTeamTimeOff(teamResponse.data);
      
      const pendingCount = requestsResponse.data.filter(req => req.status === 'Pending').length;
      setPendingRequestsCount(pendingCount);
      
      // Set pending cancellation requests
      setPendingCancellations(cancellationResponse.data);
      
      setUpcomingHolidays(holidaysResponse.data);
      setCurrentHolidayIndex(0);
      
      console.log('🔍 Refreshed team leave history:', historyResponse.data);
      setTeamLeaveHistory(historyResponse.data);
      
      console.log('✅ Dashboard data refreshed successfully');
    } catch (error) {
      console.error('❌ Error refreshing dashboard data:', error);
      if (error.response) {
        console.error('📊 Refresh Response data:', error.response.data);
        console.error('📊 Refresh Response status:', error.response.status);
        
        // Log specific backend error details
        if (error.response.data?.details) {
          console.error('🔍 Refresh Backend error details:', error.response.data.details);
          console.error('🔍 Refresh Backend error code:', error.response.data.code);
        }
      }
    } finally {
      setLoading(false);
    }
  };
  
  // --- HELPER FUNCTIONS ---
  
  // Color mapping for different leave types
  const getLeaveTypeColors = (leaveType) => {
    const type = leaveType.toLowerCase();
    if (type.includes('earned') || type.includes('annual') || type.includes('privilege')) {
      return {
        '--summary-color': 'var(--color-summary-annual)',
        '--border-left-color': 'var(--border-color-annual)'
      };
    } else if (type.includes('sick') || type.includes('medical')) {
      return {
        '--summary-color': 'var(--color-summary-sick)',
        '--border-left-color': 'var(--border-color-sick)'
      };
    } else if (type.includes('casual') || type.includes('personal')) {
      return {
        '--summary-color': 'var(--color-summary-casual)',
        '--border-left-color': 'var(--border-color-casual)'
      };
    } else if (type.includes('bereavement') || type.includes('unpaid') || type.includes('loss of pay')) {
      return {
        '--summary-color': 'var(--color-summary-unpaid)',
        '--border-left-color': 'var(--border-color-unpaid)'
      };
    } else if (type.includes('maternity') || type.includes('paternity') || type.includes('compensatory')) {
      return {
        '--summary-color': 'var(--color-summary-compensatory)',
        '--border-left-color': 'var(--border-color-compensatory)'
      };
    }
    // Default fallback
    return {
      '--summary-color': '#f0f0f0',
      '--border-left-color': '#ccc'
    };
  };

  // --- HANDLERS ---
  
  // Handle cancellation request approval/rejection
  const handleCancellationAction = async (cancellationId, action) => {
    try {
      console.log(`🔄 ${action === 'approved' ? 'Approving' : 'Rejecting'} cancellation request:`, cancellationId);
      
      const managerComments = action === 'rejected' ? 'Request rejected by manager' : 'Cancellation approved';
      
      await handleCancellationRequest(cancellationId, action, managerComments);
      
      console.log(`✅ Cancellation request ${action} successfully`);
      
      // Remove the processed request from the list
      setPendingCancellations(prev => 
        prev.filter(request => request.id !== cancellationId)
      );
      
      // Refresh dashboard data to reflect changes
      await refreshDashboardData();
      
      alert(`Cancellation request ${action} successfully!`);
      
    } catch (error) {
      console.error(`❌ Error ${action} cancellation request:`, error);
      alert(`Error ${action} cancellation request. Please try again.`);
    }
  };
  
  const handleViewCalendarClick = () => {
    // Navigate to the manager calendar path (relative to /manager)
    navigate('calendar');
  };
  
  const handleApproveRequestsClick = () => {
    // Navigate to the manager requests page (relative to /manager)
    navigate('requests');
  };

  const handlePrevHoliday = () => {
    if (upcomingHolidays.length > 0) {
      setCurrentHolidayIndex(prev => 
        prev === 0 ? upcomingHolidays.length - 1 : prev - 1
      );
    }
  };

  const handleNextHoliday = () => {
    if (upcomingHolidays.length > 0) {
      setCurrentHolidayIndex(prev => 
        prev === upcomingHolidays.length - 1 ? 0 : prev + 1
      );
    }
  };

  const getCurrentHoliday = () => {
    if (upcomingHolidays.length === 0) {
      return {
        name: 'No holidays found',
        date: new Date().toLocaleDateString(),
        dayOfWeek: ''
      };
    }
    
    const holiday = upcomingHolidays[currentHolidayIndex];
    const holidayDate = new Date(holiday.date);
    
    return {
      name: holiday.name,
      date: holidayDate.toLocaleDateString('en-US', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      }),
      dayOfWeek: holidayDate.toLocaleDateString('en-US', { weekday: 'short' })
    };
  };

  // Show loading state
  if (loading) {
    return (
      <div className="dashboard-wrapper manager-dashboard-wrapper">
        <div className="loading-state">
          <p>Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-wrapper manager-dashboard-wrapper">
      <div className="left-panel">
        
        {/* PENDING APPROVALS CARD (NEW) */}
        <Card className="pending-approvals-card">
          <div className="card-header">Pending Requests</div>
          <div className="pending-content">
              <FaCheckCircle className="pending-icon" />
              <div className="pending-count">{pendingRequestsCount}</div>
              <div className="pending-text">Leave requests need your approval.</div>
          </div>
          <button 
            className="btn btn-secondary" // Changed to secondary for contrast with dark card background
            style={{ width: '100%', marginTop: 'var(--spacing-md)', backgroundColor: 'white', color: 'var(--color-primary)' }} 
            onClick={handleApproveRequestsClick}
          >
            Review Requests
          </button>
        </Card>

        {/* TEAM TIME OFF CARD */}
        <Card title="Team Time Off" className="team-off-card">
          <div className="holiday-controls">
            <div className="off-period">Next 7 Days</div>
          </div>
          <div className="off-list">
            {teamTimeOff.map((item, index) => (
              <div className="off-item" key={index}>
                <div className="off-date">
                  {new Date(item.date).toLocaleDateString('en-US', {
                    weekday: 'short',
                    month: 'short',
                    day: 'numeric'
                  })}
                </div>
                <div className="avatar-group">
                  {item.members.map((member, idx) => (
                    <div 
                      className="avatar" 
                      key={idx}
                      title={item.memberDetails?.[idx]?.fullName || member}
                    >
                      {member}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {teamTimeOff.length === 0 && (
            <p className="no-data">No team members on leave in the next 7 days</p>
          )}
        </Card>
        
        {/* NEXT HOLIDAY CARD */}
        <Card title="Next Holidays" className="next-holiday-card">
          <div className="holiday-controls">
            <button className="icon-button" onClick={handlePrevHoliday}>
              <FaChevronLeft />
            </button>
            <div className="holiday-info">
                <div className="holiday-name">{getCurrentHoliday().name}</div>
                <div className="holiday-date">{getCurrentHoliday().date} - {getCurrentHoliday().dayOfWeek}</div>
            </div>
            <button className="icon-button" onClick={handleNextHoliday}>
              <FaChevronRight />
            </button>
          </div>
          {upcomingHolidays.length > 1 && (
            <div className="holiday-indicator">
              {currentHolidayIndex + 1} of {upcomingHolidays.length}
            </div>
          )}
        </Card>
      </div>

      <div className="right-panel">
        
        {/* MANAGER'S OWN LEAVE SUMMARY */}
        <Card title="Your Leave Balances" className="leave-summary-card">
          <div className="leave-summary-grid">
            {leaveSummary.map((item, index) => (
              <div
                className="summary-card"
                key={index}
                style={getLeaveTypeColors(item.label)}
              >
                <div className="summary-label">{item.label}</div>
                <div className="summary-value">{item.current}<span className="summary-total">/{item.total}</span></div>
              </div>
            ))}
          </div>
          {leaveSummary.length === 0 && (
            <p className="no-data">No leave balance data available</p>
          )}

          <div className="leave-action-buttons" style={{ justifyContent: 'flex-start', gap: 'var(--spacing-md)' }}>
            <button className="btn btn-secondary" onClick={handleViewCalendarClick}><FaCalendarAlt /> View Calendar</button>
            <button className="btn btn-primary" onClick={openApplyLeaveModal}><FaPlus /> Apply Leave</button>
          </div>
          
          <p className="manager-info">
            *This section shows **your** personal leave balances as a manager.
          </p>
        </Card>
        
        {/* TEAM APPROVED LEAVES CARD */}
        <Card title="Team Approved Leaves" className="team-leave-history">
          <div className="history-header">
            <p className="history-subtitle">All approved leaves (past, ongoing & upcoming)</p>
            <button 
              className="btn btn-small btn-secondary" 
              onClick={refreshDashboardData}
              disabled={loading}
              style={{ marginTop: 'var(--spacing-xs)' }}
            >
              <FaSync className={loading ? 'spinning' : ''} /> Refresh
            </button>
          </div>
          
          {teamLeaveHistory.length > 0 ? (
            <div className="leave-history-list">
              {teamLeaveHistory.map((leave, index) => (
                <div key={index} className={`history-item ${leave.leaveStatus?.toLowerCase()}`}>
                  <div className="history-main">
                    <div className="employee-info">
                      <span className="employee-name">{leave.employeeName}</span>
                      <span className="department-tag">{leave.department}</span>
                    </div>
                    <div className="leave-details">
                      <span className="leave-type">{leave.leaveType}</span>
                      <span className="leave-duration">{leave.days} day{leave.days > 1 ? 's' : ''}</span>
                      {leave.leaveStatus && (
                        <span className={`leave-status-badge ${leave.leaveStatus.toLowerCase()}`}>
                          {leave.leaveStatus}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="history-dates">
                    <span className="date-range">
                      {new Date(leave.fromDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {' '}
                      {new Date(leave.toDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="approved-date">
                      Approved: {new Date(leave.approvedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {leave.reason && (
                    <div className="leave-reason">
                      <em>"{leave.reason}"</em>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="no-history">
              <p>No approved leaves found for your team.</p>
            </div>
          )}
          
          <button className="btn btn-secondary" onClick={handleApproveRequestsClick}>
            <FaListAlt /> Manage Team Requests
          </button>
        </Card>

        {/* PENDING CANCELLATION REQUESTS CARD */}
        <Card title="Pending Cancellation Requests" className="cancellation-requests-card">
          <div className="history-header">
            <p className="history-subtitle">Employee requests to cancel approved leaves</p>
          </div>
          
          {pendingCancellations.length > 0 ? (
            <div className="cancellation-requests-list">
              {pendingCancellations.map((request, index) => (
                <div key={index} className="cancellation-request-item">
                  <div className="request-main">
                    <div className="employee-info">
                      <span className="employee-name">{request.employee_name}</span>
                      <span className="department-tag">{request.department}</span>
                    </div>
                    <div className="leave-details">
                      <span className="leave-type">{request.leave_type}</span>
                      <span className="leave-duration">{request.days} day{request.days > 1 ? 's' : ''}</span>
                    </div>
                  </div>
                  <div className="request-dates">
                    <span className="date-range">
                      {new Date(request.from_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - {' '}
                      {new Date(request.to_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="request-date">
                      Requested: {new Date(request.requested_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                  {request.reason && (
                    <div className="cancellation-reason">
                      <strong>Cancellation Reason:</strong> <em>"{request.reason}"</em>
                    </div>
                  )}
                  <div className="cancellation-actions">
                    <button 
                      className="btn btn-small btn-success"
                      onClick={() => handleCancellationAction(request.id, 'approved')}
                    >
                      <FaCheckCircle /> Approve Cancellation
                    </button>
                    <button 
                      className="btn btn-small btn-danger"
                      onClick={() => handleCancellationAction(request.id, 'rejected')}
                    >
                      <FaTrashAlt /> Reject Request
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="no-cancellation-requests">
              <p>No pending cancellation requests.</p>
            </div>
          )}
        </Card>
        
      </div>
    </div>
  );
}

export default ManagerDashboard;
