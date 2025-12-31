// src/pages/ManagerRequests.js
import React, { useState, useEffect } from 'react';
import { FaCheckCircle, FaTimesCircle, FaFilter, FaSearch, FaInfoCircle } from 'react-icons/fa';
import Card from '../components/Card';
import GenericModal from '../components/GenericModal'; // <-- Import Generic Modal component
import LeaveDetailsModal from '../components/LeaveDetailsModal'; // <-- Import Detail Modal
import RejectionFormModal from '../components/RejectionFormModal'; // <-- Import Rejection Form
import { fetchTeamLeaveRequests, updateLeaveStatus } from '../services/apiService';
import './ManagerRequests.css';

function ManagerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('Pending');
  
  // State for the modal flow
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isRejectionModalOpen, setIsRejectionModalOpen] = useState(false);

  // Fetch team leave requests on component mount
  useEffect(() => {
    fetchTeamRequests();
  }, []);

  const fetchTeamRequests = async () => {
    try {
      setLoading(true);
      const response = await fetchTeamLeaveRequests();
      
      // Transform backend data to match frontend expectations
      const formattedRequests = response.data.map(req => ({
        id: req.id,
        employee: req.employee, // Backend now sends 'employee' field
        type: req.type,
        from: req.from,
        to: req.to,
        days: req.days,
        reason: req.reason,
        status: req.status,
        approver: req.approver || 'You (Manager)',
        remarks: req.remarks
      }));
      
      setRequests(formattedRequests);
      setError(null);
    } catch (err) {
      console.error('Error fetching team leave requests:', err);
      setError('Failed to load leave requests. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // --- HANDLERS FOR MODAL FLOW ---

  const openDetailsModal = (request) => {
    console.log('🔍 Opening details modal for request:', request);
    setSelectedRequest(request);
    setIsDetailsModalOpen(true);
    console.log('✅ Modal state set to open');
  };

  const closeDetailsModal = () => {
    setSelectedRequest(null);
    setIsDetailsModalOpen(false);
    setIsRejectionModalOpen(false); // Ensure rejection modal closes too if needed
  };

  const openRejectionModal = () => {
    // Keep the current request selected
    setIsDetailsModalOpen(false); // Close details modal first
    setIsRejectionModalOpen(true); // Open rejection modal
  };

  const closeRejectionModal = () => {
    // Reset state after canceling rejection
    setSelectedRequest(null);
    setIsRejectionModalOpen(false);
  };
  
  // --- CORE ACTION HANDLERS ---

  // Handles both approval (from detail modal) and rejection (from rejection modal)
  const handleFinalAction = async (id, action, reason = null) => {
    try {
      const status = action === 'Approve' ? 'Approved' : 'Rejected';
      
      // Call backend API to update leave status
      await updateLeaveStatus(id, status, reason);

      // Update local state
      setRequests(prevRequests => 
        prevRequests.map(req => 
          req.id === id 
            ? { 
                ...req, 
                status: status,
                remarks: reason
              } 
            : req
        )
      );
      
      console.log(`Request ${id} ${action}d. Reason: ${reason || 'N/A'}`);
      
      // Close all modals after action
      closeDetailsModal();
      
      // Optionally refetch to ensure sync with backend
      // await fetchTeamRequests();
    } catch (err) {
      const backendMsg = err?.response?.data?.message || err?.response?.data?.error;
      console.error(`Error ${action}ing leave request:`, err);
      alert(`Failed to ${action.toLowerCase()} leave request.${backendMsg ? `\nReason: ${backendMsg}` : ''}`);
      // Refresh list to avoid stale UI if the item was already processed or missing
      try { await fetchTeamRequests(); } catch {}
    }
  };
  
  // This is called when 'Approve' is clicked in the LeaveDetailsModal
  const handleApprove = () => {
      if (selectedRequest) {
          handleFinalAction(selectedRequest.id, 'Approve');
      }
  };

  // This is called when the rejection form is submitted
  const onSubmitRejection = (id, reason) => {
      handleFinalAction(id, 'Reject', reason);
  };


  // Filter and search logic (No change here, just included for completeness)
  const filteredRequests = requests.filter(request => {
    const matchesFilter = filterType === 'All' || request.status === filterType;
    const matchesSearch = request.employee.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          request.reason.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="manager-requests-wrapper">
      <Card title="Leave Request Management" className="request-card">
        
        {error && (
          <div style={{ 
            color: 'var(--color-error)', 
            padding: '10px', 
            marginBottom: '15px',
            backgroundColor: '#ffe6e6',
            borderRadius: '4px'
          }}>
            {error}
          </div>
        )}

        <div className="controls-bar">
          <FaSearch style={{ color: 'var(--color-light-text)' }} />
          <input
            type="text"
            className="search-input-manager"
            placeholder="Search by Employee or Reason..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          <FaFilter style={{ color: 'var(--color-light-text)' }} />
          <select 
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="Pending">Pending Requests</option>
            <option value="Approved">Approved Requests</option>
            <option value="Rejected">Rejected Requests</option>
            <option value="All">All Requests</option>
          </select>
        </div>

        <div className="manager-table-wrapper">
          <table className="manager-table">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From - To</th>
                <th>Days</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length > 0 ? (
                filteredRequests.map((request) => (
                  <tr key={request.id}>
                    <td>{request.employee}</td>
                    <td>{request.type}</td>
                    <td>{request.from} - {request.to}</td>
                    <td>{request.days}</td>
                    <td>{request.reason}</td>
                    <td>
                        <span className={`status-badge status-${request.status.toLowerCase()}`}>
                            {request.status}
                        </span>
                    </td>
                    <td>
                      <div className="action-buttons">
                        {/* CRITICAL CHANGE: Use a single button to open the details modal */}
                        {request.status === 'Pending' ? (
                          <button 
                            className="action-btn action-btn-approve" 
                            onClick={() => openDetailsModal(request)} // Open details modal on click
                            style={{ 
                              backgroundColor: '#2563eb',
                              color: 'white',
                              border: 'none',
                              borderRadius: '8px',
                              transition: 'all 0.2s ease'
                            }}
                            onMouseEnter={(e) => e.target.style.backgroundColor = '#1d4ed8'}
                            onMouseLeave={(e) => e.target.style.backgroundColor = '#2563eb'}
                          >
                            <FaInfoCircle /> Review
                          </button>
                        ) : (
                          <span className={`status-badge status-${request.status.toLowerCase()}`} style={{minWidth: '100px'}}>
                            {request.status}
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '20px' }}>
                    <FaInfoCircle style={{ marginRight: '8px', color: 'var(--color-secondary)' }} />
                    No {filterType.toLowerCase()} requests found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
      
      {/* --- MODAL RENDERING --- */}

      {/* 1. Leave Details Modal (shows details, Approve/Reject options) */}
      {isDetailsModalOpen && selectedRequest && (
        <GenericModal onClose={closeDetailsModal}>
          <LeaveDetailsModal
            request={selectedRequest}
            onApprove={handleApprove} // Approve action
            onReject={openRejectionModal} // Open rejection form
            onClose={closeDetailsModal}
          />
        </GenericModal>
      )}

      {/* 2. Rejection Form Modal (captures rejection reason) */}
      {isRejectionModalOpen && selectedRequest && (
        <GenericModal onClose={closeRejectionModal}>
          <RejectionFormModal
            request={selectedRequest}
            onSubmitRejection={onSubmitRejection} // Final submission action
            onCancel={closeRejectionModal}
          />
        </GenericModal>
      )}
    </div>
  );
}

export default ManagerRequests;