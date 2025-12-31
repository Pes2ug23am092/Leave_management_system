import React, { useState, useEffect } from 'react';
import { Bar, Line, Doughnut, PolarArea } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale } from 'chart.js';
import { fetchManagerReports } from '../services/apiService';
import './ManagerReports.css';

ChartJS.register(CategoryScale, LinearScale, BarElement, LineElement, PointElement, Title, Tooltip, Legend, ArcElement, RadialLinearScale);

function ManagerReports() {
  const [reportsData, setReportsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [filters, setFilters] = useState({
    department: 'All',
    leaveType: 'All',
    chartType: 'department', // 'department', 'trends', 'patterns', 'distribution'
    dateRange: '12months' // '3months', '6months', '12months'
  });

  // Fetch reports data
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        const response = await fetchManagerReports();
        setReportsData(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching manager reports:', err);
        setError('Failed to load reports data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // Handle filter change
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Get unique departments and leave types from data
  const getUniqueOptions = () => {
    if (!reportsData) return { departments: [], leaveTypes: [] };
    
    const departments = [...new Set(reportsData.leaveStatistics.map(item => item.Department))];
    const leaveTypes = [...new Set(reportsData.leaveStatistics.map(item => item.leaveType))];
    
    return { departments, leaveTypes };
  };

  // Filter data based on current filters
  const getFilteredData = () => {
    if (!reportsData) return [];
    
    let filtered = reportsData.leaveStatistics;
    
    if (filters.department !== 'All') {
      filtered = filtered.filter(item => item.Department === filters.department);
    }
    
    if (filters.leaveType !== 'All') {
      filtered = filtered.filter(item => item.leaveType === filters.leaveType);
    }
    
    return filtered;
  };

  // Prepare chart data based on selected chart type
  const getChartData = () => {
    const filteredData = getFilteredData();
    
    if (filters.chartType === 'department') {
      // Group by department
      const departments = [...new Set(filteredData.map(item => item.Department))];
      const leaveTypes = [...new Set(filteredData.map(item => item.leaveType))];
      
      const datasets = leaveTypes.map((type, index) => {
        const colors = [
          'rgba(33, 150, 243, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 193, 7, 0.8)',
          'rgba(156, 39, 176, 0.8)',
          'rgba(255, 87, 34, 0.8)'
        ];
        
        return {
          label: type,
          data: departments.map(dept => {
            const item = filteredData.find(d => d.Department === dept && d.leaveType === type);
            return item ? item.approvedCount : 0;
          }),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.8', '1'),
          borderWidth: 1
        };
      });
      
      return {
        labels: departments,
        datasets: datasets
      };
    } else if (filters.chartType === 'trends') {
      // Monthly trends
      if (!reportsData.monthlyTrends.length) return { labels: [], datasets: [] };
      
      const months = [...new Set(reportsData.monthlyTrends.map(item => item.month))].sort();
      const leaveTypes = [...new Set(reportsData.monthlyTrends.map(item => item.leaveType))];
      
      const datasets = leaveTypes.map((type, index) => {
        const colors = [
          'rgba(33, 150, 243, 0.8)',
          'rgba(244, 67, 54, 0.8)',
          'rgba(76, 175, 80, 0.8)',
          'rgba(255, 193, 7, 0.8)'
        ];
        
        return {
          label: type,
          data: months.map(month => {
            const item = reportsData.monthlyTrends.find(d => d.month === month && d.leaveType === type);
            return item ? item.approved : 0;
          }),
          backgroundColor: colors[index % colors.length],
          borderColor: colors[index % colors.length].replace('0.8', '1'),
          borderWidth: 2,
          fill: false
        };
      });
      
      return {
        labels: months.map(month => {
          const [year, monthNum] = month.split('-');
          return new Date(year, monthNum - 1).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
        }),
        datasets: datasets
      };
    } else if (filters.chartType === 'patterns') {
      // Day patterns
      if (!reportsData.dayPatterns?.length) return { labels: [], datasets: [] };
      
      return {
        labels: reportsData.dayPatterns.map(item => item.dayOfWeek),
        datasets: [{
          label: 'Leave Applications by Day',
          data: reportsData.dayPatterns.map(item => item.applicationCount),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)',
            'rgba(199, 199, 199, 0.8)'
          ],
          borderWidth: 1
        }]
      };
    } else if (filters.chartType === 'distribution') {
      // Leave type distribution
      const leaveTypeData = {};
      filteredData.forEach(item => {
        leaveTypeData[item.leaveType] = (leaveTypeData[item.leaveType] || 0) + item.approvedCount;
      });
      
      return {
        labels: Object.keys(leaveTypeData),
        datasets: [{
          data: Object.values(leaveTypeData),
          backgroundColor: [
            'rgba(255, 99, 132, 0.8)',
            'rgba(54, 162, 235, 0.8)',
            'rgba(255, 205, 86, 0.8)',
            'rgba(75, 192, 192, 0.8)',
            'rgba(153, 102, 255, 0.8)',
            'rgba(255, 159, 64, 0.8)'
          ],
          borderWidth: 1
        }]
      };
    }
  };

  // --- Export Handler ---
  const printReport = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="manager-reports-wrapper">
        <div className="loading-state">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="manager-reports-wrapper">
        <div className="error-state">{error}</div>
      </div>
    );
  }

  if (!reportsData) {
    return (
      <div className="manager-reports-wrapper">
        <div className="no-data-state">No reports data available</div>
      </div>
    );
  }

  const { departments, leaveTypes } = getUniqueOptions();
  const chartData = getChartData();

  return (
    <div className="manager-reports-wrapper">
      <h2>Manager Reports</h2>
      <p className="reports-period">Data for: {reportsData.period}</p>

      <div className="filters-bar">
        <label>
          Chart Type:
          <select name="chartType" value={filters.chartType} onChange={handleFilterChange}>
            <option value="department">By Department</option>
            <option value="trends">Monthly Trends</option>
            <option value="patterns">Day Patterns</option>
            <option value="distribution">Leave Distribution</option>
          </select>
        </label>

        <label>
          Department:
          <select name="department" value={filters.department} onChange={handleFilterChange}>
            <option value="All">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>
        </label>

        <label>
          Leave Type:
          <select name="leaveType" value={filters.leaveType} onChange={handleFilterChange}>
            <option value="All">All Types</option>
            {leaveTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>

        <label>
          Time Range:
          <select name="dateRange" value={filters.dateRange} onChange={handleFilterChange}>
            <option value="3months">Last 3 Months</option>
            <option value="6months">Last 6 Months</option>
            <option value="12months">Last 12 Months</option>
          </select>
        </label>
      </div>

      <div className="charts-container">
        <div className="chart-container">
          <h3>
            {filters.chartType === 'department' && 'Leave Applications by Department'}
            {filters.chartType === 'trends' && 'Monthly Leave Trends'}
            {filters.chartType === 'patterns' && 'Leave Patterns by Day of Week'}
            {filters.chartType === 'distribution' && 'Leave Type Distribution'}
          </h3>
          {filters.chartType === 'department' && (
            <Bar 
              data={chartData} 
              options={{ 
                responsive: true, 
                plugins: { 
                  legend: { position: 'top' },
                  title: { display: true, text: 'Approved Leaves by Department and Type' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} 
            />
          )}
          {filters.chartType === 'trends' && (
            <Line 
              data={chartData} 
              options={{ 
                responsive: true, 
                plugins: { 
                  legend: { position: 'top' },
                  title: { display: true, text: 'Monthly Leave Approval Trends' }
                },
                scales: {
                  y: { beginAtZero: true }
                }
              }} 
            />
          )}
          {filters.chartType === 'patterns' && (
            <PolarArea 
              data={chartData} 
              options={{ 
                responsive: true, 
                plugins: { 
                  legend: { position: 'top' },
                  title: { display: true, text: 'Leave Applications by Day of Week' }
                }
              }} 
            />
          )}
          {filters.chartType === 'distribution' && (
            <Doughnut 
              data={chartData} 
              options={{ 
                responsive: true, 
                plugins: { 
                  legend: { position: 'right' },
                  title: { display: true, text: 'Leave Type Distribution' }
                }
              }} 
            />
          )}
        </div>

        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <h4>Total Applications</h4>
            <div className="summary-number">
              {getFilteredData().reduce((sum, item) => sum + parseInt(item.totalApplications || 0), 0)}
            </div>
          </div>
          <div className="summary-card">
            <h4>Approved</h4>
            <div className="summary-number approved">
              {getFilteredData().reduce((sum, item) => sum + parseInt(item.approvedCount || 0), 0)}
            </div>
          </div>
          <div className="summary-card">
            <h4>Pending</h4>
            <div className="summary-number pending">
              {getFilteredData().reduce((sum, item) => sum + parseInt(item.pendingCount || 0), 0)}
            </div>
          </div>
          <div className="summary-card">
            <h4>Rejected</h4>
            <div className="summary-number rejected">
              {getFilteredData().reduce((sum, item) => sum + parseInt(item.rejectedCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Analytics Insights */}
        {reportsData.analytics && (
          <div className="analytics-section">
            <h3>📊 Team Analytics</h3>
            <div className="analytics-grid">
              <div className="analytics-card">
                <h4>👥 Team Size</h4>
                <div className="analytics-value">{parseInt(reportsData.analytics.totalTeamMembers || 0)}</div>
                <p>Total team members</p>
              </div>
              <div className="analytics-card">
                <h4>📅 Avg Leave Length</h4>
                <div className="analytics-value">{Math.round(parseFloat(reportsData.analytics.avgLeaveLength || 0))} days</div>
                <p>Average leave duration</p>
              </div>
              <div className="analytics-card">
                <h4>📈 Recent Activity</h4>
                <div className="analytics-value">{parseInt(reportsData.analytics.recentApprovals || 0)}</div>
                <p>Approvals last 30 days</p>
              </div>
              <div className="analytics-card">
                <h4>⏰ Pending Reviews</h4>
                <div className="analytics-value pending">{parseInt(reportsData.analytics.pendingCount || 0)}</div>
                <p>Awaiting your decision</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Team Summary Table */}
      {reportsData.teamSummary.length > 0 && (
        <div className="team-summary-section">
          <h3>👨‍💼 Team Leave Summary</h3>
          <div className="table-wrapper">
            <table className="reports-table">
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Total Leaves</th>
                  <th>Days Taken</th>
                  <th>Pending Requests</th>
                  <th>Leave Utilization</th>
                </tr>
              </thead>
              <tbody>
                {reportsData.teamSummary.map((member, index) => {
                  const daysTaken = parseFloat(member.daysTaken || 0);
                  const utilizationRate = daysTaken > 0 ? Math.round((daysTaken / 20) * 100) : 0; // Assuming 20 days annual leave
                  return (
                    <tr key={index}>
                      <td>
                        <div className="employee-info">
                          <strong>{member.employeeName}</strong>
                        </div>
                      </td>
                      <td>{member.Department}</td>
                      <td>
                        <span className="leave-count">{parseInt(member.totalLeaves || 0)}</span>
                      </td>
                      <td>
                        <span className="days-taken">{parseFloat(member.daysTaken || 0)} days</span>
                      </td>
                      <td>
                        <span className={`status-badge ${parseInt(member.pendingRequests || 0) > 0 ? 'pending' : 'normal'}`}>
                          {parseInt(member.pendingRequests || 0)}
                        </span>
                      </td>
                      <td>
                        <div className="utilization-bar">
                          <div 
                            className="utilization-fill" 
                            style={{ 
                              width: `${Math.min(utilizationRate, 100)}%`,
                              backgroundColor: utilizationRate > 80 ? '#f44336' : utilizationRate > 60 ? '#ff9800' : '#4caf50'
                            }}
                          ></div>
                          <span className="utilization-text">{utilizationRate}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="export-buttons">
        <button className="btn btn-primary" onClick={printReport}>🖨️ Print Report</button>
      </div>
    </div>
  );
}

export default ManagerReports;
