// src/components/LeaveDetailsModal.js
import React from 'react';
import { FaTimes, FaUserCircle, FaCalendarAlt, FaClock } from 'react-icons/fa';

function LeaveDetailsModal({ request, onApprove, onReject, onClose }) {
  if (!request) return null;

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="review-modal" style={{ width: '700px', maxWidth: '90%' }}>
      <div className="modal-form-header">
        <h2>Review Leave Request</h2>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
      </div>

      <div className="modal-content-area">
        <div className="request-header">
            <FaUserCircle className="user-avatar-icon" />
            <div className="user-info">
                <h3>{request.employee}</h3>
                <p>{request.type} - <strong>{request.days} Days</strong></p>
            </div>
        </div>
        
        <div className="detail-section">
            <div className="detail-item">
                <FaCalendarAlt className="detail-icon" />
                <span className="detail-label">From:</span>
                <span className="detail-value">{formatDate(request.from)}</span>
            </div>
            <div className="detail-item">
                <FaCalendarAlt className="detail-icon" />
                <span className="detail-label">To:</span>
                <span className="detail-value">{formatDate(request.to)}</span>
            </div>
            <div className="detail-item">
                <FaClock className="detail-icon" />
                <span className="detail-label">Approver:</span>
                <span className="detail-value">{request.approver || 'N/A'}</span> 
            </div>
        </div>

        <div className="reason-box">
            <h4>Reason:</h4>
            <p className="reason-text">{request.reason}</p>
        </div>
      </div>

      <div className="modal-form-actions">
        <button type="button" className="btn btn-primary" onClick={onApprove}>Approve</button>
        <button type="button" className="btn btn-secondary reject-btn" onClick={onReject}>Reject</button>
      </div>
    </div>
  );
}

export default LeaveDetailsModal;
