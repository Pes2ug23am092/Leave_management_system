// src/components/RejectionFormModal.js
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';

// This component captures the rejection reason.
function RejectionFormModal({ request, onSubmitRejection, onCancel }) {
  const [reason, setReason] = useState('');
  const maxReasonLength = 200;

  const handleReasonChange = (e) => {
    if (e.target.value.length <= maxReasonLength) {
      setReason(e.target.value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (reason.trim()) {
      onSubmitRejection(request.id, reason);
    } else {
      console.error("Rejection reason is required.");
    }
  };

  return (
    // Added width and maxWidth to make the modal wider
    <div className="review-modal rejection-form-modal" style={{ width: '650px', maxWidth: '90%' }}>
      <div className="modal-form-header">
        <h2>Reject Leave: {request.employee}</h2>
        <button className="modal-close-button" onClick={onCancel}><FaTimes /></button>
      </div>
      
      <form onSubmit={handleSubmit} className="modal-content-area rejection-form">
        <div className="form-group">
          <label className="form-label">Rejection Reason (Required):</label>
          <textarea
            className="form-textarea"
            value={reason}
            onChange={handleReasonChange}
            placeholder="Please specify why this leave request is being rejected..."
            maxLength={maxReasonLength}
            required
          ></textarea>
          <div className="char-count">{reason.length}/{maxReasonLength}</div>
        </div>

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
          <button type="submit" className="btn btn-primary btn-reject">Submit Rejection</button>
        </div>
      </form>
    </div>
  );
}

export default RejectionFormModal;
