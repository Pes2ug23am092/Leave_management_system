// frontend/src/components/Modal.js

import React, { useState, useEffect } from 'react';
// import './Modal.css'; // Assuming you'll create a Modal.css or ApplyLeaveModal.css

function Modal({ isOpen, onClose, onSubmit }) {
    const [leaveTypes, setLeaveTypes] = useState([]);
    
    // Fetch leave types when modal opens
    useEffect(() => {
        const fetchLeaveTypes = async () => {
            try {
                const response = await fetch('http://localhost:5000/api/employees/leave/types', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                console.debug('Leave types response:', data); // Debug log
                
                if (!Array.isArray(data)) {
                    console.error('Leave types data is not an array:', data);
                    throw new Error('Invalid data format received');
                }
                
                setLeaveTypes(data);
            } catch (err) {
                console.error('Failed to fetch leave types:', err);
                // Use some default types as fallback
                setLeaveTypes([
                    { LeaveTypeID: 1, LeaveName: 'Annual Leave' },
                    { LeaveTypeID: 2, LeaveName: 'Sick Leave' },
                    { LeaveTypeID: 3, LeaveName: 'Casual Leave' }
                ]);
            }
        };

        if (isOpen) {
            fetchLeaveTypes();
        }
    }, [isOpen]);
    
    const [formData, setFormData] = useState({
        leaveTypeId: '', 
        fromDate: '',
        fromSession: '1', 
        toDate: '',
        toSession: '2', 
        reason: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    // 🛑 Conditional return check comes AFTER hook calls 🛑
    if (!isOpen) return null; 

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.leaveTypeId || !formData.fromDate || !formData.toDate || !formData.reason) {
            alert('Please fill in all required fields.');
            return;
        }

        // Basic date validation
        const fromDate = new Date(formData.fromDate);
        const toDate = new Date(formData.toDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        if (fromDate < today) {
            alert('From date cannot be in the past.');
            return;
        }

        if (toDate < fromDate) {
            alert('To date must be after or equal to From date.');
            return;
        }

        // Session validation for same-day leaves
        if (fromDate.getTime() === toDate.getTime() && 
            parseInt(formData.fromSession) > parseInt(formData.toSession)) {
            alert('For same-day leaves, From session cannot be after To session.');
            return;
        }

        setIsSubmitting(true);
        try {
            const submitData = {
                ...formData,
                leaveTypeId: parseInt(formData.leaveTypeId),
                fromSession: parseInt(formData.fromSession),
                toSession: parseInt(formData.toSession),
            };

            await onSubmit(submitData);
        } catch (error) {
            console.error("Submission error caught in modal:", error);
            if (error.response?.data?.message) {
                alert(error.response.data.message);
            } else {
                alert('An error occurred while submitting your leave application. Please try again.');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    // Minimal inline styles for functionality
    const styles = {
        overlay: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', 
            display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000
        },
        content: {
            backgroundColor: '#fff', padding: '30px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)', 
            width: '90%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto'
        },
        h2: { marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' },
        formGroup: { marginBottom: '15px' },
        label: { display: 'block', marginBottom: '5px', fontWeight: 'bold', fontSize: '14px' },
        input: { width: '100%', padding: '10px', border: '1px solid #ddd', borderRadius: '4px', boxSizing: 'border-box' },
        dateGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' },
        actions: { marginTop: '20px', display: 'flex', justifyContent: 'flex-end', gap: '10px' },
        button: { padding: '10px 15px', border: 'none', borderRadius: '4px', color: '#fff', cursor: 'pointer', transition: 'background-color 0.2s' }
    };

    return (
        <div className="modal-overlay" style={styles.overlay} onClick={onClose}>
            <div className="modal-content" style={styles.content} onClick={e => e.stopPropagation()}>
                <h2 style={styles.h2}>Apply for Leave</h2>
                <form onSubmit={handleFormSubmit}>
                    
                    {/* Leave Type Dropdown */}
                    <div style={styles.formGroup}>
                        <label htmlFor="leaveTypeId" style={styles.label}>Leave Type</label>
                        <select id="leaveTypeId" name="leaveTypeId" value={formData.leaveTypeId} onChange={handleChange} required style={styles.input}>
                            <option value="">Select Leave Type</option>
                            {Array.isArray(leaveTypes) && leaveTypes.map(type => (
                                <option key={type.LeaveTypeID} value={type.LeaveTypeID}>{type.LeaveName}</option>
                            ))}
                        </select>
                    </div>

                    {/* Date/Session Grid */}
                    <div style={styles.dateGrid}>
                        <div style={styles.formGroup}>
                            <label htmlFor="fromDate" style={styles.label}>From Date</label>
                            <input type="date" id="fromDate" name="fromDate" value={formData.fromDate} onChange={handleChange} required style={styles.input} />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="fromSession" style={styles.label}>From Session</label>
                            <select id="fromSession" name="fromSession" value={formData.fromSession} onChange={handleChange} required style={styles.input}>
                                <option value="1">Full Day / AM</option>
                                <option value="2">PM Half Day</option>
                            </select>
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="toDate" style={styles.label}>To Date</label>
                            <input type="date" id="toDate" name="toDate" value={formData.toDate} onChange={handleChange} required style={styles.input} />
                        </div>
                        <div style={styles.formGroup}>
                            <label htmlFor="toSession" style={styles.label}>To Session</label>
                            <select id="toSession" name="toSession" value={formData.toSession} onChange={handleChange} required style={styles.input}>
                                <option value="1">AM Half Day</option>
                                <option value="2">Full Day / PM</option>
                            </select>
                        </div>
                    </div>

                    {/* Reason */}
                    <div style={styles.formGroup}>
                        <label htmlFor="reason" style={styles.label}>Reason</label>
                        <textarea id="reason" name="reason" value={formData.reason} onChange={handleChange} required style={{...styles.input, height: '80px'}} />
                    </div>

                    {/* Action Buttons */}
                    <div style={styles.actions}>
                        <button type="button" onClick={onClose} disabled={isSubmitting} style={{...styles.button, backgroundColor: '#ccc'}}>
                            Cancel
                        </button>
                        <button type="submit" disabled={isSubmitting} style={{...styles.button, backgroundColor: '#007bff'}}>
                            {isSubmitting ? 'Submitting...' : 'Submit Application'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default Modal;