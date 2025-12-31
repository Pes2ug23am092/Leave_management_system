// src/pages/AdminSettings.js
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSync, FaCalendarAlt, FaEnvelope, FaCog } from 'react-icons/fa';
import { fetchAllHolidays, createHoliday, updateHoliday, deleteHoliday } from '../services/apiService';
import './AdminDashboard.css'; 
import Card from '../components/Card';

function AdminSettings() {
  const [holidays, setHolidays] = useState([]);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [loading, setLoading] = useState(false);
  const [showHolidayModal, setShowHolidayModal] = useState(false);
  const [holidayModalMode, setHolidayModalMode] = useState('create');
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [holidayFormData, setHolidayFormData] = useState({
    holidayName: '',
    holidayDate: '',
    year: new Date().getFullYear()
  });

  // System settings state
  const [systemSettings, setSystemSettings] = useState({
    annualQuota: 20,
    carryForward: 5,
    multiLevelApproval: false
  });

  useEffect(() => {
    fetchHolidayData();
  }, [selectedYear]);

  const fetchHolidayData = async () => {
    try {
      setLoading(true);
      console.log('🔍 Fetching holidays for year:', selectedYear);
      const response = await fetchAllHolidays(selectedYear);
      console.log('✅ Holidays fetched:', response.data);
      setHolidays(response.data.holidays || []);
    } catch (error) {
      console.error('❌ Error fetching holidays:', error);
      alert('Failed to load holidays: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateHoliday = () => {
    setHolidayModalMode('create');
    setSelectedHoliday(null);
    setHolidayFormData({
      holidayName: '',
      holidayDate: '',
      year: selectedYear
    });
    setShowHolidayModal(true);
  };

  const handleEditHoliday = (holiday) => {
    setHolidayModalMode('edit');
    setSelectedHoliday(holiday);
    setHolidayFormData({
      holidayName: holiday.HolidayName || '',
      holidayDate: holiday.HolidayDate ? holiday.HolidayDate.split('T')[0] : '',
      year: holiday.Year || selectedYear
    });
    setShowHolidayModal(true);
  };

  const handleDeleteHoliday = async (holiday) => {
    if (window.confirm(`Are you sure you want to delete "${holiday.HolidayName}"?`)) {
      try {
        console.log('🗑️ Deleting holiday:', holiday.HolidayID);
        await deleteHoliday(holiday.HolidayID);
        console.log('✅ Holiday deleted successfully');
        await fetchHolidayData();
        alert('Holiday deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting holiday:', error);
        alert('Failed to delete holiday: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleHolidaySubmit = async (e) => {
    e.preventDefault();
    
    if (!holidayFormData.holidayName.trim() || !holidayFormData.holidayDate) {
      alert('Holiday name and date are required');
      return;
    }
    
    try {
      if (holidayModalMode === 'create') {
        console.log('➕ Creating holiday:', holidayFormData);
        await createHoliday(holidayFormData);
        console.log('✅ Holiday created successfully');
        alert('Holiday created successfully');
      } else if (holidayModalMode === 'edit') {
        console.log('✏️ Updating holiday:', selectedHoliday.HolidayID, holidayFormData);
        await updateHoliday(selectedHoliday.HolidayID, holidayFormData);
        console.log('✅ Holiday updated successfully');
        alert('Holiday updated successfully');
      }
      
      setShowHolidayModal(false);
      await fetchHolidayData();
      
    } catch (error) {
      console.error('❌ Error saving holiday:', error);
      alert('Failed to save holiday: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleHolidayInputChange = (e) => {
    const { name, value } = e.target;
    setHolidayFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSystemSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSaveSettings = async () => {
    try {
      console.log('💾 Saving system settings:', systemSettings);
      // TODO: Implement API call to save system settings
      alert('System settings saved successfully');
    } catch (error) {
      console.error('❌ Error saving settings:', error);
      alert('Failed to save settings');
    }
  };
  return (
    <div className="admin-page-content">
      <h1 className="page-title">System Settings</h1>

      {/* Policy Settings Section */}
      <div className="settings-section">
        <h2><FaCog /> Policy & Quota Settings</h2>
        
        <div className="settings-group">
          <label htmlFor="annualQuota">Default Annual Leave Quota (Days):</label>
          <input 
            id="annualQuota"
            name="annualQuota"
            type="number" 
            value={systemSettings.annualQuota}
            onChange={handleSystemSettingsChange}
            className="form-control" 
            min="0"
            max="365"
          />
          <small className="text-muted">Set the default number of days granted at the start of the cycle.</small>
        </div>

        <div className="settings-group">
          <label htmlFor="carryForward">Max Carry-Forward (Days):</label>
          <input 
            id="carryForward"
            name="carryForward"
            type="number" 
            value={systemSettings.carryForward}
            onChange={handleSystemSettingsChange}
            className="form-control" 
            min="0"
            max="50"
          />
          <small className="text-muted">Maximum number of unused days employees can carry into the next year.</small>
        </div>
      </div>

      {/* Workflow Settings Section */}
      <div className="settings-section">
        <h2><FaEnvelope /> Workflow & Approval Settings</h2>
        
        <div className="settings-group">
          <label>
            <input 
              type="checkbox"
              name="multiLevelApproval"
              checked={systemSettings.multiLevelApproval}
              onChange={handleSystemSettingsChange}
              style={{ marginRight: '8px' }}
            />
            Enable Multi-Level Approval (Manager → HR)
          </label>
          <small className="text-muted">When enabled, leave requests require approval from both manager and HR.</small>
        </div>
        
        <div className="settings-group">
          <label>Email Notification Templates:</label>
          <button className="btn btn-secondary d-block mt-1">
            <FaEnvelope /> Edit Email Templates
          </button>
          <small className="text-muted">Customize emails for request submission, approval, and rejection.</small>
        </div>
      </div>

      {/* Holiday Management Section */}
      <div className="settings-section">
        <h2><FaCalendarAlt /> Company Holiday Calendar</h2>
        
        <div className="holiday-management-header">
          <div className="year-selector">
            <label htmlFor="yearSelect">Year:</label>
            <select 
              id="yearSelect"
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-control"
              style={{ width: 'auto', display: 'inline-block', marginLeft: '8px' }}
            >
              {Array.from({ length: 10 }, (_, i) => {
                const year = new Date().getFullYear() + i - 2;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          
          <div className="holiday-actions">
            <button 
              className="btn btn-secondary" 
              onClick={fetchHolidayData}
              disabled={loading}
            >
              <FaSync className={loading ? 'spinning' : ''} /> Refresh
            </button>
            <button 
              className="btn btn-primary" 
              onClick={handleCreateHoliday}
              style={{ color: "white" }}
            >
              <FaPlus /> Add Holiday
            </button>
          </div>
        </div>

        <Card title={`Holidays for ${selectedYear} (${holidays.length})`}>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Holiday Name</th>
                  <th>Day of Week</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {holidays.map(holiday => (
                  <tr key={holiday.HolidayID}>
                    <td>
                      {new Date(holiday.HolidayDate).toLocaleDateString('en-US', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td><strong>{holiday.HolidayName}</strong></td>
                    <td>{holiday.DayOfWeek}</td>
                    <td>
                      <div className="action-buttons">
                        <button 
                          className="btn btn-icon btn-sm btn-secondary" 
                          onClick={() => handleEditHoliday(holiday)}
                          title="Edit Holiday"
                        >
                          <FaEdit />
                        </button>
                        <button 
                          className="btn btn-icon btn-sm btn-danger" 
                          onClick={() => handleDeleteHoliday(holiday)}
                          title="Delete Holiday"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {holidays.length === 0 && !loading && (
              <div className="no-data">
                <p>No holidays defined for {selectedYear}</p>
                <button 
                  className="btn btn-primary" 
                  onClick={handleCreateHoliday}
                  style={{ color: "white", marginTop: "var(--spacing-md)" }}
                >
                  <FaPlus /> Add First Holiday
                </button>
              </div>
            )}
          </div>
        </Card>
      </div>
      
      <button 
        className="btn btn-primary" 
        onClick={handleSaveSettings}
        style={{ color: "white", fontSize: "1.1rem", padding: "12px 24px" }}
      >
        💾 Save All Settings
      </button>

      {/* Holiday Modal */}
      {showHolidayModal && (
        <div className="modal-overlay" onClick={() => setShowHolidayModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {holidayModalMode === 'create' ? 'Add New Holiday' : 'Edit Holiday'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowHolidayModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleHolidaySubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="holidayName">Holiday Name *</label>
                <input
                  type="text"
                  id="holidayName"
                  name="holidayName"
                  value={holidayFormData.holidayName}
                  onChange={handleHolidayInputChange}
                  required
                  className="form-control"
                  placeholder="e.g., New Year's Day, Christmas"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="holidayDate">Date *</label>
                  <input
                    type="date"
                    id="holidayDate"
                    name="holidayDate"
                    value={holidayFormData.holidayDate}
                    onChange={handleHolidayInputChange}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="year">Year</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={holidayFormData.year}
                    onChange={handleHolidayInputChange}
                    required
                    min="2020"
                    max="2030"
                    className="form-control"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowHolidayModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ color: "white" }}
                >
                  {holidayModalMode === 'create' ? 'Add Holiday' : 'Update Holiday'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminSettings;