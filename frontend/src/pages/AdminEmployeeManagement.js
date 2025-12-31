// src/pages/AdminEmployeeManagement.js
import React, { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaPlus, FaEye, FaSync } from 'react-icons/fa';
import { fetchAllEmployees, createEmployee, updateEmployee, deleteEmployee } from '../services/apiService';
import './AdminDashboard.css'; // Import shared styles
import Card from '../components/Card'; // Assuming you have a Card component

function AdminEmployeeManagement() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create', 'edit', 'view'
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    designation: '',
    role: 'Employee',
    gender: '',
    dob: '',
    managerId: ''
  });

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployeeData();
  }, []);

  const fetchEmployeeData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 Fetching employees...');
      const response = await fetchAllEmployees();
      console.log('✅ Employees fetched:', response.data);
      
      setEmployees(response.data);
    } catch (error) {
      console.error('❌ Error fetching employees:', error);
      if (error.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
      } else {
        setError('Failed to load employees data.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setModalMode('create');
    setSelectedEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      designation: '',
      role: 'Employee',
      gender: '',
      dob: '',
      managerId: ''
    });
    setShowModal(true);
  };

  const handleEdit = (employee) => {
    setModalMode('edit');
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.FirstName || '',
      lastName: employee.LastName || '',
      email: employee.Email || '',
      password: '', // Don't pre-fill password
      designation: employee.Designation || '',
      role: employee.Role || 'Employee',
      gender: employee.Gender || '',
      dob: employee.DOB ? employee.DOB.split('T')[0] : '', // Format date for input
      managerId: employee.ManagerID || ''
    });
    setShowModal(true);
  };

  const handleView = (employee) => {
    setModalMode('view');
    setSelectedEmployee(employee);
    setFormData({
      firstName: employee.FirstName || '',
      lastName: employee.LastName || '',
      email: employee.Email || '',
      password: '',
      designation: employee.Designation || '',
      role: employee.Role || 'Employee',
      gender: employee.Gender || '',
      dob: employee.DOB ? employee.DOB.split('T')[0] : '',
      managerId: employee.ManagerID || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (employee) => {
    if (window.confirm(`Are you sure you want to delete ${employee.FirstName} ${employee.LastName}?`)) {
      try {
        console.log('🗑️ Deleting employee:', employee.EmpID);
        await deleteEmployee(employee.EmpID);
        console.log('✅ Employee deleted successfully');
        
        // Refresh the list
        await fetchEmployeeData();
        alert('Employee deleted successfully');
      } catch (error) {
        console.error('❌ Error deleting employee:', error);
        alert('Failed to delete employee: ' + (error.response?.data?.error || error.message));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (modalMode === 'create') {
        console.log('➕ Creating employee:', formData);
        await createEmployee(formData);
        console.log('✅ Employee created successfully');
        alert('Employee created successfully');
      } else if (modalMode === 'edit') {
        console.log('✏️ Updating employee:', selectedEmployee.EmpID, formData);
        await updateEmployee(selectedEmployee.EmpID, formData);
        console.log('✅ Employee updated successfully');
        alert('Employee updated successfully');
      }
      
      // Close modal and refresh list
      setShowModal(false);
      await fetchEmployeeData();
      
    } catch (error) {
      console.error('❌ Error saving employee:', error);
      alert('Failed to save employee: ' + (error.response?.data?.error || error.message));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const getStatusBadge = (role) => {
    const className = role === 'Admin' ? 'badge-admin' : 
                    role === 'Manager' ? 'badge-manager' : 'badge-employee';
    return <span className={`badge ${className}`}>{role}</span>;
  };

  // Get available managers for dropdown
  const availableManagers = employees.filter(emp => emp.Role === 'Manager' || emp.Role === 'Admin');

  if (loading && employees.length === 0) {
    return (
      <div className="admin-page-content">
        <div className="loading-state">
          <p>Loading employees...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page-content">
        <div className="error-state">
          <h3>Error Loading Employees</h3>
          <p>{error}</p>
          <button className="btn btn-primary" onClick={fetchEmployeeData}>
            <FaSync /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page-content">
      <div className="admin-header">
        <h1 className="page-title">Employee Management</h1>
        <div className="header-actions">
          <button 
            className="btn btn-secondary" 
            onClick={fetchEmployeeData}
            disabled={loading}
          >
            <FaSync className={loading ? 'spinning' : ''} /> Refresh
          </button>
          <button 
            className="btn btn-primary" 
            onClick={handleCreate}
            style={{ color: "white" }}
          >
            <FaPlus /> Add New Employee
          </button>
        </div>
      </div>

      <Card title={`All Employee Records (${employees.length})`}>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Employee ID</th>
                <th>Name</th>
                <th>Email</th>
                <th>Designation</th>
                <th>Role</th>
                <th>Manager</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map(employee => (
                <tr key={employee.EmpID}>
                  <td>{employee.EmpID}</td>
                  <td>{`${employee.FirstName} ${employee.LastName}`}</td>
                  <td>{employee.Email}</td>
                  <td>{employee.Designation}</td>
                  <td>{getStatusBadge(employee.Role)}</td>
                  <td>{employee.ManagerName || 'N/A'}</td>
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-icon btn-sm btn-info" 
                        onClick={() => handleView(employee)}
                        title="View Details"
                      >
                        <FaEye />
                      </button>
                      <button 
                        className="btn btn-icon btn-sm btn-secondary" 
                        onClick={() => handleEdit(employee)}
                        title="Edit Employee"
                      >
                        <FaEdit />
                      </button>
                      <button 
                        className="btn btn-icon btn-sm btn-danger" 
                        onClick={() => handleDelete(employee)}
                        title="Delete Employee"
                        disabled={employee.Role === 'Admin'}
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {employees.length === 0 && (
            <div className="no-data">
              <p>No employees found</p>
            </div>
          )}
        </div>
      </Card>

      {/* Employee Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {modalMode === 'create' ? 'Add New Employee' : 
                 modalMode === 'edit' ? 'Edit Employee' : 'Employee Details'}
              </h3>
              <button 
                className="modal-close" 
                onClick={() => setShowModal(false)}
              >
                ×
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="firstName">First Name *</label>
                  <input
                    type="text"
                    id="firstName"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="lastName">Last Name *</label>
                  <input
                    type="text"
                    id="lastName"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    required
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="email">Email *</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    required
                    className="form-control"
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="designation">Designation</label>
                  <input
                    type="text"
                    id="designation"
                    name="designation"
                    value={formData.designation}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    className="form-control"
                  />
                </div>
              </div>

              {modalMode !== 'view' && (
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="password">
                      Password {modalMode === 'create' ? '*' : '(leave blank to keep current)'}
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      required={modalMode === 'create'}
                      className="form-control"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="role">Role</label>
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleInputChange}
                      className="form-control"
                    >
                      <option value="Employee">Employee</option>
                      <option value="Manager">Manager</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="gender">Gender</label>
                  <select
                    id="gender"
                    name="gender"
                    value={formData.gender}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    className="form-control"
                  >
                    <option value="">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label htmlFor="dob">Date of Birth</label>
                  <input
                    type="date"
                    id="dob"
                    name="dob"
                    value={formData.dob}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    className="form-control"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="managerId">Manager</label>
                  <select
                    id="managerId"
                    name="managerId"
                    value={formData.managerId}
                    onChange={handleInputChange}
                    disabled={modalMode === 'view'}
                    className="form-control"
                  >
                    <option value="">Select Manager</option>
                    {availableManagers.map(manager => (
                      <option key={manager.EmpID} value={manager.EmpID}>
                        {`${manager.FirstName} ${manager.LastName} (${manager.Role})`}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {modalMode !== 'view' && (
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
                    {modalMode === 'create' ? 'Create Employee' : 'Update Employee'}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminEmployeeManagement;