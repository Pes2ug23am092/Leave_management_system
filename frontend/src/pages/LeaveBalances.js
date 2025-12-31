// src/pages/LeaveBalances.js
import React, { useState, useEffect } from 'react';
import Card from '../components/Card';
import './LeaveBalances.css';
import { fetchLeaveBalances } from '../services/apiService';

function LeaveBalances() {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Leave type descriptions and information
  const getLeaveTypeInfo = (leaveType) => {
    const type = leaveType.toLowerCase();
    
    if (type.includes('earned') || type.includes('annual') || type.includes('privilege')) {
      return {
        description: 'Annual earned leave for vacation, personal time, and relaxation. Plan your holidays!',
        icon: '🏖️',
        color: '--color-summary-annual',
        borderColor: '--border-color-annual'
      };
    } else if (type.includes('sick') || type.includes('medical')) {
      return {
        description: 'Medical leave for illness, doctor visits, and health-related emergencies.',
        icon: '🏥',
        color: '--color-summary-sick',
        borderColor: '--border-color-sick'
      };
    } else if (type.includes('casual') || type.includes('personal')) {
      return {
        description: 'Casual leave for personal work, short breaks, and unexpected events.',
        icon: '☕',
        color: '--color-summary-casual',
        borderColor: '--border-color-casual'
      };
    } else if (type.includes('bereavement')) {
      return {
        description: 'Compassionate leave for family emergencies and bereavement situations.',
        icon: '🕊️',
        color: '--color-summary-unpaid',
        borderColor: '--border-color-unpaid'
      };
    } else if (type.includes('maternity')) {
      return {
        description: 'Maternity leave for childbirth and post-natal care. Congratulations!',
        icon: '👶',
        color: '--color-summary-compensatory',
        borderColor: '--border-color-compensatory'
      };
    } else if (type.includes('paternity')) {
      return {
        description: 'Paternity leave for new fathers to bond with their newborn child.',
        icon: '👨‍👶',
        color: '--color-summary-compensatory',
        borderColor: '--border-color-compensatory'
      };
    } else if (type.includes('loss of pay') || type.includes('unpaid')) {
      return {
        description: 'Unpaid leave when other leave balances are exhausted. No deduction from this balance.',
        icon: '📋',
        color: '--color-summary-unpaid',
        borderColor: '--border-color-unpaid'
      };
    }
    
    // Default fallback
    return {
      description: 'Special leave type as per company policy.',
      icon: '📅',
      color: '--color-summary-annual',
      borderColor: '--border-color-annual'
    };
  };

  useEffect(() => {
    const loadLeaveBalances = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetchLeaveBalances();
        const balanceData = response.data || [];
        
        // Enhance data with descriptions and colors
        const enhancedBalances = balanceData.map(balance => {
          const typeInfo = getLeaveTypeInfo(balance.label);
          return {
            ...balance,
            type: balance.label,
            used: balance.taken || 0,
            remaining: balance.current || 0,
            total: balance.total || 0,
            ...typeInfo
          };
        });
        
        setBalances(enhancedBalances);
        
      } catch (err) {
        console.error('❌ Error fetching leave balances:', err);
        setError('Failed to load leave balances. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadLeaveBalances();
  }, []);

  if (loading) {
    return (
      <div className="leave-balances-wrapper">
        <Card title="Your Leave Balances">
          <div className="loading-state">
            <p>Loading your leave balances...</p>
          </div>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="leave-balances-wrapper">
        <Card title="Your Leave Balances">
          <div className="error-state">
            <p className="error-message">{error}</p>
            <button 
              className="btn btn-primary"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="leave-balances-wrapper">
      <Card title="Your Leave Balances">
        <div className="balances-overview">
          <h3>Current Year: {new Date().getFullYear()}</h3>
          <p className="overview-text">
            Track your leave usage and plan your time off effectively. All balances are updated in real-time.
          </p>
        </div>
        
        <div className="balances-grid">
          {balances.map((balance, index) => (
            <div 
              className="balance-item" 
              key={index}
              style={{
                '--item-color': `var(${balance.color})`,
                '--item-border-color': `var(${balance.borderColor})`
              }}
            >
              <div className="balance-header">
                <div className="balance-type">
                  <span className="leave-icon">{balance.icon}</span>
                  {balance.type}
                </div>
                <div className="balance-status">
                  {balance.remaining > 0 ? (
                    <span className="status-available">Available</span>
                  ) : (
                    <span className="status-exhausted">Exhausted</span>
                  )}
                </div>
              </div>
              
              <div className="balance-description">
                {balance.description}
              </div>
              
              <div className="balance-numbers">
                <div className="balance-main">
                  <span className="balance-value">{balance.remaining}</span>
                  <span className="balance-unit">days remaining</span>
                </div>
                <div className="balance-breakdown">
                  <span className="used">Used: {balance.used}</span>
                  <span className="total">Total: {balance.total}</span>
                </div>
              </div>
              
              <div className="progress-section">
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar" 
                    style={{
                      width: balance.total > 0 ? `${(balance.used / balance.total) * 100}%` : '0%'
                    }}
                  ></div>
                </div>
                <div className="progress-labels">
                  <span>0</span>
                  <span>{balance.total}</span>
                </div>
              </div>
              
              {balance.remaining === 0 && balance.total > 0 && (
                <div className="exhausted-notice">
                  ⚠️ This leave type has been fully utilized for this year.
                </div>
              )}
              
              {balance.total === 0 && (
                <div className="unlimited-notice">
                  ℹ️ This leave type has no predefined limit.
                </div>
              )}
            </div>
          ))}
        </div>
        
        {balances.length === 0 && (
          <div className="no-data">
            <p>No leave balance data found for the current year.</p>
            <p>Please contact HR if you believe this is an error.</p>
          </div>
        )}
        
        <div className="leave-policies">
          <h4>📖 Leave Policies & Guidelines</h4>
          <ul>
            <li><strong>Leave Application:</strong> Apply for leave at least 2 days in advance for casual leave, 7 days for annual leave</li>
            <li><strong>Sick Leave:</strong> Medical certificate required for sick leave exceeding 3 consecutive days</li>
            <li><strong>Year-end:</strong> Unused annual leave may be carried forward as per company policy</li>
            <li><strong>Emergency:</strong> Emergency leave can be applied retrospectively with proper justification</li>
          </ul>
        </div>
        
        <p className="note">
          💡 <strong>Need Help?</strong> Contact HR at <a href="mailto:hr@company.com">hr@company.com</a> for detailed leave statements or policy clarifications.
        </p>
      </Card>
    </div>
  );
}

export default LeaveBalances;