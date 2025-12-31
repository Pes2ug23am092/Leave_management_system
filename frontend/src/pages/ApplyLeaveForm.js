// src/pages/ApplyLeaveForm.js
import React, { useState } from 'react';
import { FaTimes } from 'react-icons/fa';
// Styling is mainly in Modal.css

function ApplyLeaveForm({ onSubmit, onClose }) {
  // REMOVED: const [isSubmitted, setIsSubmitted] = useState(false); 
  const [reason, setReason] = useState('I am travelling to HomeTown, please approve my leave request');
  const maxReasonLength = 100;

  const handleReasonChange = (e) => {
    if (e.target.value.length <= maxReasonLength) {
      setReason(e.target.value);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // CRITICAL FIX: Only call the parent's onSubmit.
    // App.js will handle setting showRequestSaved(true) and handling the close/timeout.
    onSubmit(); 
    
    // REMOVED: setIsSubmitted(true);
    // REMOVED: setTimeout logic
  };

  // REMOVED: if (isSubmitted) { return (<success message JSX>) }

  // --- Form Content (Default) ---
  return (
    <div className="apply-leave-form">
      <div className="modal-form-header">
        <h2>Apply Leave</h2>
        <button className="modal-close-button" onClick={onClose}><FaTimes /></button>
      </div>
      
      <div className="form-body">
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Leave type:</label>
              <div className="radio-group">
                <label className="radio-option">
                  <input type="radio" name="leaveType" value="casual" defaultChecked />
                  Casual
                </label>
                <label className="radio-option">
                  <input type="radio" name="leaveType" value="compensatory" />
                  Compensatory
                </label>
                <label className="radio-option">
                  <input type="radio" name="leaveType" value="lossOfPay" />
                  Loss of Pay
                </label>
                <label className="radio-option">
                  <input type="radio" name="leaveType" value="paternityMaternity" />
                  Paternity / Maternity
                </label>
              </div>
            </div>

            <div className="form-group">
              <label className="checkbox-option">
                <input type="checkbox" name="halfDay" defaultChecked />
                Half day:
              </label>
            </div>

            <div className="form-group">
              <label className="form-label">Select Date:</label>
              <div className="date-input-group">
                <input type="date" defaultValue="2025-03-12" />
                <span>To</span>
                <input type="date" placeholder="DD-MM-YYYY" defaultValue="2025-03-12" />
                <input type="text" className="days-input" placeholder="01" defaultValue="01" /> {/* For days */}
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Reason:</label>
              <textarea
                className="form-textarea"
                value={reason}
                onChange={handleReasonChange}
                placeholder="I am travelling to HomeTown, please approve my leave request"
                maxLength={maxReasonLength}
              ></textarea>
              <div className="char-count">{reason.length}/{maxReasonLength}</div>
            </div>

            <div className="form-actions">
              <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="btn btn-primary">Apply</button>
            </div>
          </form>
      </div>
    </div>
  );
}

export default ApplyLeaveForm;