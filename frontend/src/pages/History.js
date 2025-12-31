// src/pages/History.js
import React, { useState, useEffect } from 'react';
import { FaFilter, FaSearch, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';
import Card from '../components/Card';
import LeaveCancellationModal from '../components/LeaveCancellationModal';
import './History.css';
import '../pages/Dashboard.css';
import { fetchLeaveRequests, requestLeaveCancellation } from '../services/apiService';

function History() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allLeaveRequests, setAllLeaveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const itemsPerPage = 8;

  // Fetch leave requests from backend
  useEffect(() => {
    const loadLeaveRequests = async () => {
      try {
        setIsLoading(true);
        const response = await fetchLeaveRequests();
        setAllLeaveRequests(response.data);
        setError(null);
      } catch (err) {
        console.error('Failed to fetch leave requests:', err);
        setError('Failed to load leave history. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    loadLeaveRequests();
  }, []);

  // Filter data based on search term
  const filteredRequests = allLeaveRequests.filter(request =>
    request.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.approver?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    request.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination values
  const pageCount = Math.ceil(filteredRequests.length / itemsPerPage);
  const offset = currentPage * itemsPerPage;
  const currentPageData = filteredRequests.slice(offset, offset + itemsPerPage);

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
    setCurrentPage(0); // Reset to first page on new search
  };

  const handleCancelLeave = (leave) => {
    setSelectedLeave(leave);
    setShowCancelModal(true);
  };

  const handleConfirmCancellation = async (leaveAppId, cancellationReason) => {
    try {
      const response = await requestLeaveCancellation(leaveAppId, cancellationReason);
      
      // Update the leave status in the local state
      setAllLeaveRequests(prevRequests =>
        prevRequests.map(request =>
          (request.id === leaveAppId || request.LeaveAppID === leaveAppId)
            ? { ...request, status: response.data?.status || 'Cancellation Requested' }
            : request
        )
      );

      alert(response.data.message || 'Cancellation request submitted successfully');
      
      // Refresh the data
      const updatedResponse = await fetchLeaveRequests();
      setAllLeaveRequests(updatedResponse.data);
      
    } catch (error) {
      console.error('Error cancelling leave:', error);
      throw error; // Re-throw so modal can handle it
    }
  };

  const canCancelLeave = (leave) => {
    return ['Pending', 'Approved'].includes(leave.status) && 
           !['Cancelled', 'Rejected', 'Cancellation Requested'].includes(leave.status);
  };
  
  const handlePreviousPage = () => {
    setCurrentPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(pageCount - 1, prev + 1));
  };

  if (error) {
    return (
      <div className="history-wrapper">
        <Card title="Leave History">
          <div className="error-message">{error}</div>
        </Card>
      </div>
    );
  }

  return (
    <div className="history-wrapper">
      <Card title="Leave History">
        <div className="table-controls">
          <div className="search-input-container"> 
            <FaSearch className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by Leave Type, Status, Reason..."
              className="search-input history-search-input"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
          <div className="table-actions">
            <button className="btn btn-icon"><FaFilter /></button>
          </div>
        </div>

        <div className="table-wrapper">
          {isLoading ? (
            <div className="loading-message">Loading leave history...</div>
          ) : (
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
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentPageData.length > 0 ? (
                  currentPageData.map((request, index) => (
                    <tr key={request.id || index}>
                      <td>{request.type}</td>
                      <td>{request.from}</td>
                      <td>{request.to}</td>
                      <td>{request.days}</td>
                      <td>
                        <span className={`status-badge status-${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="reason-cell">{request.reason}</td>
                      <td>{request.approver || 'N/A'}</td>
                      <td className="actions-cell">
                        {canCancelLeave(request) ? (
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleCancelLeave(request)}
                            title="Cancel Leave"
                          >
                            <FaTimes />
                          </button>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="8" className="no-results-message">
                      {searchTerm ? 'No matching leave requests found.' : 'No leave requests found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        
        {/* Pagination Controls */}
        {!isLoading && filteredRequests.length > itemsPerPage && (
          <div className="pagination-container">
            <button 
              className="pagination-button"
              onClick={handlePreviousPage}
              disabled={currentPage === 0}
            >
              <FaChevronLeft />
            </button>
            <div className="page-info">
              Page {currentPage + 1} of {pageCount}
            </div>
            <button 
              className="pagination-button"
              onClick={handleNextPage}
              disabled={currentPage === pageCount - 1}
            >
              <FaChevronRight />
            </button>
          </div>
        )}
      </Card>

      {/* Leave Cancellation Modal */}
      <LeaveCancellationModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        onSubmit={handleConfirmCancellation}
        leaveDetails={selectedLeave}
      />
    </div>
  );
}

export default History;