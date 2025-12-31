// src/components/LeaveCancellationModal.js
import React, { useState } from 'react';
import { FaTimes, FaExclamationTriangle } from 'react-icons/fa';
import './Modal.css';

function LeaveCancellationModal({ isOpen, onClose, onSubmit, leaveDetails }) {
  const [cancellationReason, setCancellationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!cancellationReason.trim()) {
      alert('Please provide a reason for cancellation');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(leaveDetails.id || leaveDetails.LeaveAppID, cancellationReason);
      setCancellationReason('');
      onClose();
    } catch (error) {
      console.error('Error submitting cancellation:', error);
      alert('Failed to submit cancellation request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCancellationReason('');
    onClose();
  };

  if (!isOpen) return null;

  const isApprovedLeave = (leaveDetails?.status || leaveDetails?.Status) === 'Approved';

  return (
    <div className="modal-overlay">
      <div className="modal-container">
        <div className="modal-header">
          <h2>
            <FaExclamationTriangle className="text-warning" />
            Cancel Leave Request
          </h2>
          <button className="modal-close-button" onClick={handleClose}>
            <FaTimes />
          </button>
        </div>

        <div className="modal-body">
          {/* Leave Details Summary */}
          <div className="leave-summary">
            <h3>Leave Details</h3>
            <div className="leave-info">
              <p><strong>Type:</strong> {leaveDetails?.type || leaveDetails?.LeaveName || '—'}</p>
              <p><strong>Duration:</strong> {(leaveDetails?.from || leaveDetails?.FromDate) || '—'} to {(leaveDetails?.to || leaveDetails?.ToDate) || '—'} {typeof leaveDetails?.days !== 'undefined' ? `(${leaveDetails.days} day${leaveDetails.days === 1 ? '' : 's'})` : ''}</p>
              <p><strong>Status:</strong> <span className={`status-badge status-${(leaveDetails?.status || leaveDetails?.Status || '').toLowerCase()}`}>
                {leaveDetails?.status || leaveDetails?.Status || '—'}
              </span></p>
              {(leaveDetails?.reason || leaveDetails?.Reason) && (
                <p><strong>Reason:</strong> {leaveDetails?.reason || leaveDetails?.Reason}</p>
              )}
            </div>
          </div>

          {/* Cancellation Warning */}
          <div className={`cancellation-notice ${isApprovedLeave ? 'warning' : 'info'}`}>
            {isApprovedLeave ? (
              <>
                <p><strong>⚠️ Notice:</strong> This is an approved leave request. Cancelling will require manager approval.</p>
                <p>Your manager will be notified and must approve the cancellation before your leave balance is restored.</p>
              </>
            ) : (
              <>
                <p><strong>ℹ️ Notice:</strong> This leave request is still pending approval.</p>
                <p>Cancelling will immediately remove the request and restore your leave balance.</p>
              </>
            )}
          </div>

          {/* Cancellation Form */}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="cancellationReason">
                <strong>Reason for Cancellation *</strong>
              </label>
              <textarea
                id="cancellationReason"
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Please explain why you want to cancel this leave..."
                rows="4"
                className="form-control"
                required
                disabled={isSubmitting}
              />
            </div>

            <div className="modal-actions">
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Keep Leave
              </button>
              <button 
                type="submit" 
                className="btn btn-danger"
                disabled={isSubmitting || !cancellationReason.trim()}
              >
                {isSubmitting ? 'Submitting...' : 'Cancel Leave'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default LeaveCancellationModal;