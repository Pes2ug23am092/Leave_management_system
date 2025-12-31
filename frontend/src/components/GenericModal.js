// src/components/GenericModal.js
import React from 'react';
import './Modal.css'; // We'll use the existing Modal CSS

function GenericModal({ children, onClose }) {
  if (!children) return null;

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={handleBackdropClick}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

export default GenericModal;