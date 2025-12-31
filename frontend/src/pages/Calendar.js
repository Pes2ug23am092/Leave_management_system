// src/pages/Calendar.js
import React, { useState, useEffect } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import Card from '../components/Card';
import './Calendar.css';
import { fetchUpcomingHolidays, fetchLeaveBalances, fetchLeaveRequests } from '../services/apiService';

function Calendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [holidays, setHolidays] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState([]);
  const [approvedLeaves, setApprovedLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activityFilter, setActivityFilter] = useState('This month');

  const daysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay(); // 0 for Sunday, 1 for Monday

  const getCalendarDays = () => {
    const totalDays = daysInMonth(currentMonth);
    const startDay = firstDayOfMonth(currentMonth); // 0 (Sun) - 6 (Sat)

    const days = [];
    
    // Fill preceding empty cells (from previous month)
    const prevMonthTotalDays = daysInMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    for (let i = 0; i < startDay; i++) {
        days.push({ day: prevMonthTotalDays - startDay + i + 1, currentMonth: false });
    }

    // Fill current month's days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ day: i, currentMonth: true });
    }

    // Fill trailing empty cells with next month's days
    const remainingCells = 42 - days.length; 
    for (let i = 1; i <= remainingCells; i++) {
      days.push({ day: i, currentMonth: false });
    }
    return days.slice(0, 42); 
  };

  const handlePrevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const formattedMonthYear = currentMonth.toLocaleString('en-US', { month: 'long', year: 'numeric' });

  // Load holidays, leave balances, and approved leaves
  useEffect(() => {
    const loadCalendarData = async () => {
      try {
        const [holidaysResponse, balancesResponse, leavesResponse] = await Promise.all([
          fetchUpcomingHolidays(),
          fetchLeaveBalances(),
          fetchLeaveRequests()
        ]);
        const holidayList = Array.isArray(holidaysResponse.data) ? holidaysResponse.data : [];
        setHolidays(holidayList.map(holiday => ({
          ...holiday,
          date: new Date(holiday.date)
        })));
        const balances = Array.isArray(balancesResponse.data) ? balancesResponse.data : [];
        setLeaveBalances(balances);
        
        // Filter only approved leaves and format the dates
        const leaves = Array.isArray(leavesResponse.data) ? leavesResponse.data : [];
        const approved = leaves
          .filter(leave => leave.status === 'Approved')
          .map(leave => ({
            ...leave,
            fromDate: new Date(leave.from_date),
            toDate: new Date(leave.to_date)
          }));
        setApprovedLeaves(approved);
        
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch calendar data:', err);
        setError('Failed to load calendar data. Please try again.');
        setLoading(false);
      }
    };

    loadCalendarData();
  }, []);

  const getHolidaysForDay = (date) => {
    return holidays.filter(holiday => 
      holiday.date.getDate() === date.getDate() &&
      holiday.date.getMonth() === date.getMonth() &&
      holiday.date.getFullYear() === date.getFullYear()
    );
  };

  const getApprovedLeavesForDay = (date) => {
    return approvedLeaves.filter(leave => {
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      
      const fromDate = new Date(leave.fromDate);
      fromDate.setHours(0, 0, 0, 0);
      
      const toDate = new Date(leave.toDate);
      toDate.setHours(23, 59, 59, 999);
      
      return checkDate >= fromDate && checkDate <= toDate;
    });
  };

  const getUpcomingActivities = () => {
    const today = new Date();
    
    // Helper function to filter activities based on selected time period
    const getDateRange = () => {
      const now = new Date();
      switch (activityFilter) {
        case 'This month':
          return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          };
        case 'Last month':
          return {
            start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
            end: new Date(now.getFullYear(), now.getMonth(), 0)
          };
        case 'This year':
          return {
            start: new Date(now.getFullYear(), 0, 1),
            end: new Date(now.getFullYear(), 11, 31)
          };
        default:
          return {
            start: new Date(now.getFullYear(), now.getMonth(), 1),
            end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
          };
      }
    };

    const { start, end } = getDateRange();
    
    // Get holidays within the selected period
    const filteredHolidays = holidays
      .filter(holiday => holiday.date >= start && holiday.date <= end)
      .sort((a, b) => a.date - b.date)
      .slice(0, 3)
      .map(holiday => ({
        date: holiday.date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        days: '1 day',
        status: 'Holiday',
        color: '#2196f3',
        name: holiday.name
      }));

    // Get leaves within the selected period
    const filteredLeaves = approvedLeaves
      .filter(leave => {
        // Check if leave overlaps with the selected period
        return (leave.fromDate <= end && leave.toDate >= start);
      })
      .sort((a, b) => a.fromDate - b.fromDate)
      .slice(0, 3)
      .map(leave => ({
        date: leave.fromDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }),
        days: `${leave.days || 1} day${(leave.days || 1) > 1 ? 's' : ''}`,
        status: 'Approved Leave',
        color: '#4caf50',
        name: leave.type
      }));

    // Combine and sort by date, limit to 5 total
    const combined = [...filteredHolidays, ...filteredLeaves]
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(0, 5);

    return combined;
  };

  if (loading) return <div className="calendar-loading">Loading calendar...</div>;
  if (error) return <div className="calendar-error">{error}</div>;

  return (
    <div className="calendar-page-wrapper">
      <div className="calendar-left-panel">
        <Card title="Leave Balances">
          <ul className="balance-legend">
            {leaveBalances.length > 0 ? (
              leaveBalances.map((balance, index) => (
                <li key={index}>
                  <span className={`legend-color legend-${balance.label.toLowerCase().replace(/\s+/g, '-')}`}></span>
                  {balance.label} <br/> {balance.current}/{balance.total} days
                </li>
              ))
            ) : (
              <li>No leave balances available</li>
            )}
          </ul>
        </Card>

        <Card title="Upcoming Activities" className="leave-activities-card">
          <select 
            className="search-input" 
            value={activityFilter}
            onChange={(e) => setActivityFilter(e.target.value)}
          >
            <option value="This month">This month</option>
            <option value="Last month">Last month</option>
            <option value="This year">This year</option>
          </select>
          {getUpcomingActivities().length > 0 ? (
            getUpcomingActivities().map((activity, index) => (
              <div className="leave-activity-item" key={index} style={{'--status-color': activity.color}}>
                <div className="activity-details">
                    <div className="leave-activity-date">{activity.date}</div>
                    <div className="leave-activity-days">{activity.days}</div>
                </div>
                <div className="leave-activity-status-text">
                    {activity.status}
                </div>
              </div>
            ))
          ) : (
            <div className="no-activities">No activities found for {activityFilter.toLowerCase()}</div>
          )}
        </Card>
      </div>

      <div className="calendar-right-panel">
        <Card className="absence-calendar-card">
          <div className="calendar-header">
            <div className="calendar-nav-controls">
                <FaChevronLeft className="arrow-icon" onClick={handlePrevMonth}/>
            </div>
            <h2 className="current-month-year">{formattedMonthYear}</h2>
            <div className="calendar-nav-controls">
                <FaChevronRight className="arrow-icon" onClick={handleNextMonth}/>
            </div>
          </div>
          <div className="calendar-grid">
            <div className="calendar-day-name">Sun</div>
            <div className="calendar-day-name">Mon</div>
            <div className="calendar-day-name">Tue</div>
            <div className="calendar-day-name">Wed</div>
            <div className="calendar-day-name">Thu</div>
            <div className="calendar-day-name">Fri</div>
            <div className="calendar-day-name">Sat</div>

            {getCalendarDays().map((dayObj, index) => {
              // Calculate the correct date based on whether it's current month or not
              const date = dayObj.currentMonth 
                ? new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayObj.day)
                : index < 7 // If it's in the first row, it's previous month
                  ? new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, dayObj.day)
                  : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, dayObj.day);
                  
              const isToday = date.toDateString() === new Date().toDateString();
              const dayHolidays = dayObj.currentMonth ? getHolidaysForDay(date) : [];
              const dayLeaves = dayObj.currentMonth ? getApprovedLeavesForDay(date) : [];

              return (
                <div
                  key={index}
                  className={`calendar-day ${dayObj.currentMonth ? 'current-month' : 'other-month'} ${isToday ? 'today' : ''} ${dayLeaves.length > 0 ? 'has-leave' : ''}`}
                >
                  <div className="day-number">{dayObj.day}</div>
                  <div className="day-content">
                    {dayObj.currentMonth && dayHolidays.map((holiday, holidayIndex) => (
                      <div key={holidayIndex} className="holiday-event" title={holiday.name}>
                        {holiday.name}
                      </div>
                    ))}
                    {dayObj.currentMonth && dayLeaves.map((leave, leaveIndex) => (
                      <div key={leaveIndex} className="leave-event" title={`${leave.type || 'Leave'}: ${leave.reason}`}>
                        {leave.type || 'Leave'}
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}

export default Calendar;