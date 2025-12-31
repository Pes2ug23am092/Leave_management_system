// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaChevronLeft, FaChevronRight, FaPlus, FaFilter, FaCalendarAlt, FaPencilAlt, FaTrashAlt } from 'react-icons/fa';
import Card from '../components/Card'; 
import './Dashboard.css';
// 1. Import API services
import { 
  fetchLeaveBalances, 
  fetchLeaveRequests, 
  submitLeaveApplication, 
  fetchUpcomingHolidays,
  fetchLeaveActivities,
  fetchTeamTimeOff 
} from '../services/apiService';

// Helper function to get colors for different leave types
const getLeaveTypeColors = (leaveType) => {
  const type = leaveType.toLowerCase();
  if (type.includes('annual') || type.includes('privilege')) {
    return {
      summaryColor: 'var(--color-summary-annual)',
      borderColor: 'var(--border-color-annual)'
    };
  } else if (type.includes('sick') || type.includes('medical')) {
    return {
      summaryColor: 'var(--color-summary-sick)',
      borderColor: 'var(--border-color-sick)'
    };
  } else if (type.includes('casual') || type.includes('personal')) {
    return {
      summaryColor: 'var(--color-summary-casual)',
      borderColor: 'var(--border-color-casual)'
    };
  }
  // Default colors
  return {
    summaryColor: 'var(--color-primary)',
    borderColor: 'var(--color-primary-dark)'
  };
};

function Dashboard({ openApplyLeaveModal }) {
  const navigate = useNavigate();
  // 2. Replace hardcoded data with state
  const [leaveSummary, setLeaveSummary] = useState([]);
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [holidays, setHolidays] = useState([]);
  const [leaveActivities, setLeaveActivities] = useState([]);
  const [teamTimeOff, setTeamTimeOff] = useState([]);

  // Function to fetch data on component mount
  useEffect(() => {
    async function loadDashboardData() {
      try {
        const [balancesResponse, requestsResponse, holidaysResponse, activitiesResponse, teamResponse] = await Promise.all([
          fetchLeaveBalances(),
          fetchLeaveRequests(),
          fetchUpcomingHolidays(),
          fetchLeaveActivities(),
          fetchTeamTimeOff()
        ]);
        
        // Map balances to the expected frontend format
        // Note: The backend query in leaveController is structured to match the frontend keys (label, total, current)
  setLeaveSummary(balancesResponse.data);
  // DEBUG: Log fetched balances so we can inspect why only some types appear
  console.debug('Fetched leave balances from API:', balancesResponse.data);
        
        // Use the formatted requests from the backend
        setLeaveRequests(requestsResponse.data); 
        
        // Set holidays data
        setHolidays(holidaysResponse.data);
        setLeaveActivities(activitiesResponse.data);
        setTeamTimeOff(teamResponse.data);

        setLoading(false);

      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
        setError('Failed to load dashboard data. Please try again.');
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []); // Empty dependency array ensures it runs only once on mount

  // Function to handle navigation to the Calendar page
  const handleViewCalendarClick = () => {
    navigate('/employee/calendar'); // Updated to use the full employee route path
  };

  // Function to get the next upcoming holiday
  const getNextHoliday = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set to start of day for accurate comparison
    
    const upcomingHolidays = holidays
      .filter(holiday => {
        const holidayDate = new Date(holiday.date);
        holidayDate.setHours(0, 0, 0, 0);
        return holidayDate >= today;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
    
    return upcomingHolidays.length > 0 ? upcomingHolidays[0] : null;
  };

  // Function to calculate days until holiday
  const getDaysUntilHoliday = (holidayDate) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const holiday = new Date(holidayDate);
    holiday.setHours(0, 0, 0, 0);
    
    const diffTime = holiday - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Tomorrow";
    return `${diffDays} days`;
  };
  
  // NOTE: The rest of the hardcoded data (leaveActivities, teamOffMembers, etc.) remains for now.
  // We are only focusing on the dynamic summary and requests table.

  if (loading) return <div className="dashboard-wrapper loading">Loading Dashboard...</div>;
  if (error) return <div className="dashboard-wrapper error">{error}</div>;

  // Removed hardcoded data - now using state

  return (
    <div className="dashboard-wrapper">
      {/* ... Left Panel (unchanged except for data) ... */}
      <div className="left-panel">
        <Card title="Leave Activities" className="leave-activities-card">
          <div className="leave-activities-list">
            {leaveActivities.map((activity) => (
              <div key={activity.id} className="leave-activity-item">
                <div className="activity-details">
                  <span className="leave-activity-date">{activity.fromDate}</span>
                  <span className="leave-activity-days">{activity.days} day{activity.days !== 1 ? 's' : ''} {activity.type}</span>
                </div>
                <span className={`leave-activity-status-text status-${activity.status.toLowerCase()}`}>
                  {activity.status}
                </span>
              </div>
            ))}
          </div>
          {leaveActivities.length === 0 && (
            <p className="no-data">No recent leave activities</p>
          )}
        </Card>

        <Card title="Next Holiday" className="next-holiday-card">
          {(() => {
            const nextHoliday = getNextHoliday();
            return nextHoliday ? (
              <div className="holiday-display">
                <div className="holiday-main-info">
                  <div className="holiday-name">{nextHoliday.name}</div>
                  <div className="holiday-date">
                    {new Date(nextHoliday.date).toLocaleDateString('en-US', { 
                      weekday: 'long',
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </div>
                </div>
                <div className="holiday-countdown">
                  <div className="countdown-text">
                    {getDaysUntilHoliday(nextHoliday.date)}
                  </div>
                  <div className="countdown-label">away</div>
                </div>
              </div>
            ) : (
              <div className="no-holiday">
                <p>No upcoming holidays</p>
                <small>All holidays for this year have passed</small>
              </div>
            );
          })()}
        </Card>

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
      </div>

      {/* --- Right Panel: Now using fetched data --- */}
      <div className="right-panel">
        <Card title="Leave Summary" className="leave-summary-card">
          {/* Show a small note when backend returns unexpectedly few types */}
          {leaveSummary.length > 0 && leaveSummary.length < 2 && (
            <p className="note" style={{ color: '#b04', fontWeight: 600 }}>
              Note: Server returned only {leaveSummary.length} leave type(s). If you expected more, check your account's leave records or the API response in the browser network tab.
            </p>
          )}
          <div className="leave-summary-grid">
            {/* 3. Render fetched leaveSummary */}
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

          <div className="leave-action-buttons">
            <button className="btn btn-secondary" onClick={handleViewCalendarClick}><FaCalendarAlt /> View Calendar</button>
            {/* The openApplyLeaveModal prop (used for the Apply Leave POST logic) should handle the submission via submitLeaveApplication in its parent component */}
            <button className="btn btn-primary" onClick={openApplyLeaveModal}><FaPlus /> Apply Leave</button>
            <button className="btn btn-icon"><FaFilter /></button>
          </div>

          <div className="table-wrapper">
            <table className="leave-table">
              <thead>
                <tr>
                  <th>Leave Type</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Days</th>
                  <th>Status</th>
                  <th>Reason</th>
                  <th>Approver</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {/* 4. Render fetched leaveRequests */}
                {leaveRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.type}</td>
                    <td>{request.from}</td>
                    <td>{request.to}</td>
                    <td>{request.days}</td>
                    <td><span className={`status-badge status-${request.status.toLowerCase()}`}>{request.status}</span></td>
                    <td>{request.reason}</td>
                    <td>{request.approver}</td>
                    <td>
                      {/* Actions: Edit only if Pending, Delete/Cancel based on Status */}
                      {request.status === 'Pending' && <button className="table-action-button edit"><FaPencilAlt /></button>}
                      <button className="table-action-button delete"><FaTrashAlt /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Dashboard;