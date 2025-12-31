// src/pages/AdminLeaveTypeManagement.js
import React, { useState, useEffect } from 'react';
import { FaPlus, FaEdit, FaTrash, FaSync } from 'react-icons/fa';
import { fetchAllLeaveTypes, createLeaveType, updateLeaveType, deleteLeaveType } from '../services/apiService';
import './AdminDashboard.css'; 
import Card from '../components/Card'; 

function AdminLeaveTypeManagement() {
  const [leaveTypes, setLeaveTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit'
  const [selectedLeaveType, setSelectedLeaveType] = useState(null);
  const [formData, setFormData] = useState({
    leaveName: '',
    maxDays: '',
    year: new Date().getFullYear()
  });

  // Fetch leave types on component mount
  useEffect(() => {
    fetchLeaveTypeData();
  }, []);

  const fetchLeaveTypeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching leave types...');
      const response = await fetchAllLeaveTypes();
      console.log('✅ Leave types fetched:', response.data);
      
      setLeaveTypes(response.data);
    } catch (error) {
      console.error('❌ Error fetching leave types:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load leave types data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedLeaveType(null);
    setFormData({
      leaveName: '',
      maxDays: '',
      year: new Date().getFullYear()
    });
    setShowModal(true);
  };

  const handleEdit = (leaveType) => {
    setModalMode('edit');
    setSelectedLeaveType(leaveType);
    setFormData({
      leaveName: leaveType.LeaveName || '',
      maxDays: leaveType.MaxDays || '',
      year: leaveType.Year || new Date().getFullYear()
    });
    setShowModal(true);
  };

  const handleDelete = async (leaveType) => {
    if (window.confirm(`Are you sure you want to delete "${leaveType.LeaveName}" leave type? This action cannot be undone.`)) {
      try {
        console.log('🗑️ Deleting leave type:', leaveType.LeaveTypeID);
        await deleteLeaveType(leaveType.LeaveTypeID);
        console.log('✅ Leave type deleted successfully');
        
        // Refresh the list
        await fetchLeaveTypeData();
        alert('Leave type deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting leave type:', error);
        alert('Failed to delete leave type: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.leaveName.trim()) {
      alert('Leave name is required');
      return;
    }
    
    if (!formData.maxDays || formData.maxDays <= 0) {
      alert('Maximum days must be a positive number');
      return;
    }
    
    try {
      if (modalMode === 'create') {
        console.log('➕ Creating leave type:', formData);
        await createLeaveType(formData);
        console.log('✅ Leave type created successfully');
        alert('Leave type created successfully');
      } else if (modalMode === 'edit') {
        console.log('✏️ Updating leave type:', selectedLeaveType.LeaveTypeID, formData);
        await updateLeaveType(selectedLeaveType.LeaveTypeID, formData);
        console.log('✅ Leave type updated successfully');
        alert('Leave type updated successfully');
      }
      
      // Close modal and refresh list
      setShowModal(false);
      await fetchLeaveTypeData();
      
    } catch (error) {
      console.error('❌ Error saving leave type:', error);
      alert('Failed to save leave type: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  if (loading && leaveTypes.length === 0) {
    return (
      <div className="admin-page-content">
        <div className="loading-state">
          <p>Loading leave types...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-content">
        <div className="error-state">
          <h3>Error Loading Leave Types</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchLeaveTypeData}>
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }
  return (
    <div className="admin-page-content">
      <div className="admin-header">
        <h1 className="page-title">Leave Type Configuration</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={fetchLeaveTypeData}
            disabled={loading}
          >
            <FaSync className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            style={{ color: "white" }}
          >
            <FaPlus /> Define New Leave Type
          </button>
        </div>
      </div>

      <Card title={`Defined Leave Types (${leaveTypes.length})`}>
        <p className="text-muted mb-4">
          Use this panel to define system-wide leave types, quotas, and rules. 
          Changes will apply to all employees for the specified year.
        </p>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Leave Type ID</th>
                <th>Name</th>
                <th>Maximum Days</th>
                <th>Year</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leaveTypes.map(type => (
                <tr key={type.LeaveTypeID}>
                  <td>{type.LeaveTypeID}</td>
                  <td>
                    <strong>{type.LeaveName}</strong>
                  </td>
                  <td>
                    <span className="quota-badge">{type.MaxDays} days</span>
                  </td>
                  <td>{type.Year}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-icon btn-sm btn-secondary" 
                        onClick={() => handleEdit(type)}
                        title="Edit Leave Type"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-icon btn-sm btn-danger" 
                        onClick={() => handleDelete(type)}
                        title="Delete Leave Type"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {leaveTypes.length === 0 && (
            <div className="no-data">
              <p>No leave types defined for the current year</p>
              <button 
                className="btn btn-primary" 
                onClick={handleCreate}
                style={{ color: "white", marginTop: "var(--spacing-md)" }}
              >
                <FaPlus /> Create First Leave Type
              </button>
            </div>
          )}
        </div>
      </Card>

      {/* Leave Type Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'create' ? 'Define New Leave Type' : 'Edit Leave Type'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-group">
                <label htmlFor="leaveName">Leave Type Name *</label>
                <input
                  type="text"
                  id="leaveName"
                  name="leaveName"
                  value={formData.leaveName}
                  onChange={handleInputChange}
                  required
                  className="form-control"
                  placeholder="e.g., Annual Leave, Sick Leave, Maternity Leave"
                />
                <small className="form-text">
                  This name will be displayed to employees when applying for leave.
                </small>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="maxDays">Maximum Days *</label>
                  <input
                    type="number"
                    id="maxDays"
                    name="maxDays"
                    value={formData.maxDays}
                    onChange={handleInputChange}
                    required
                    min="1"
                    max="365"
                    className="form-control"
                    placeholder="e.g., 20"
                  />
                  <small className="form-text">
                    Default allocation for new employees (1-365 days).
                  </small>
                </div>
                <div className="form-group">
                  <label htmlFor="year">Year</label>
                  <input
                    type="number"
                    id="year"
                    name="year"
                    value={formData.year}
                    onChange={handleInputChange}
                    required
                    min="2020"
                    max="2030"
                    className="form-control"
                  />
                  <small className="form-text">
                    The year this leave type applies to.
                  </small>
                </div>
              </div>

              <div className="policy-info">
                <h4>Important Notes:</h4>
                <ul>
                  <li>Creating a new leave type will automatically allocate the specified days to all existing employees.</li>
                  <li>Editing maximum days will update allocations for employees who haven't used any of this leave type.</li>
                  <li>Deleting a leave type is only possible if no employee has leave records for it.</li>
                </ul>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  style={{ color: "white" }}
                >
                  {modalMode === 'create' ? 'Create Leave Type' : 'Update Leave Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminLeaveTypeManagement;