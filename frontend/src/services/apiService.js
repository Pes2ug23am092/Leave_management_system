// src/services/apiService.js (conceptual)

import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api/employees'; // Adjust your backend URL

// Function to get the JWT token from localStorage (assuming it's stored there)
const getAuthToken = () => {
    return localStorage.getItem('token');
};

const api = axios.create({
    baseURL: API_BASE_URL,
});

// Interceptor to add the Authorization header to every request
api.interceptors.request.use(config => {
    const token = getAuthToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
}, error => {
    return Promise.reject(error);
});

// Global response interceptor to handle auth errors centrally
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status = error?.response?.status;
        if (status === 401) {
            // Optionally clear stale token and redirect to login
            try {
                localStorage.removeItem('token');
                localStorage.removeItem('userRole');
                localStorage.removeItem('userName');
            } catch {}
            // Preserve where user was to optionally return after login
            const returnTo = window.location?.pathname || '/';
            const loginUrl = `/login?returnTo=${encodeURIComponent(returnTo)}&reason=auth`;
            // Avoid redirect loops if already on login
            if (!window.location.pathname.startsWith('/login')) {
                window.location.assign(loginUrl);
            }
        }
        return Promise.reject(error);
    }
);

// Wrapper functions for your new endpoints
export const fetchLeaveBalances = () => {
    return api.get('/leave/balances');
};

export const fetchLeaveRequests = () => {
    return api.get('/leave/requests');
};

export const submitLeaveApplication = (leaveData) => {
    return api.post('/leave/apply', leaveData);
};

export const fetchUpcomingHolidays = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/holidays/upcoming`);
};

export const fetchTeamTimeOff = () => {
    return api.get('/team/timeoff');
};

export const fetchTeamLeaveHistory = () => {
    return api.get('/team/leave-history');
};

export const fetchLeaveActivities = () => {
    return api.get('/leave/activities');
};

export const fetchTeamLeaveRequests = () => {
    return api.get('/leave/team-requests');
};

export const updateLeaveStatus = (leaveId, status, remarks = '') => {
    return api.put(`/leave/${leaveId}/status`, { status, remarks });
};

export const cancelApprovedLeave = (leaveId, reason) => {
    return api.delete(`/leave/${leaveId}/cancel`, { data: { reason } });
};

export const fetchLeaveTypes = () => {
    return api.get('/leave/types');
};

export const fetchManagerReports = () => {
    return api.get('/manager/reports');
};

// ===============================
// 🔧 ADMIN API FUNCTIONS
// ===============================

// Admin Dashboard Metrics
export const fetchAdminMetrics = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/admin/metrics`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const fetchSystemStats = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/admin/stats`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

// Employee Management
export const fetchAllEmployees = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/admin/employees`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const createEmployee = (employeeData) => {
    return axios.post(`${API_BASE_URL.replace('/employees', '')}/admin/employees`, employeeData, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const updateEmployee = (empId, employeeData) => {
    return axios.put(`${API_BASE_URL.replace('/employees', '')}/admin/employees/${empId}`, employeeData, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const deleteEmployee = (empId) => {
    return axios.delete(`${API_BASE_URL.replace('/employees', '')}/admin/employees/${empId}`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

// Leave Type Management
export const fetchAllLeaveTypes = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/admin/leave-types`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const createLeaveType = (leaveTypeData) => {
    return axios.post(`${API_BASE_URL.replace('/employees', '')}/admin/leave-types`, leaveTypeData, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const updateLeaveType = (leaveTypeId, leaveTypeData) => {
    return axios.put(`${API_BASE_URL.replace('/employees', '')}/admin/leave-types/${leaveTypeId}`, leaveTypeData, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const deleteLeaveType = (leaveTypeId) => {
    return axios.delete(`${API_BASE_URL.replace('/employees', '')}/admin/leave-types/${leaveTypeId}`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

// Holiday Management
export const fetchAllHolidays = (year) => {
    const yearParam = year ? `?year=${year}` : '';
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/admin/holidays${yearParam}`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const createHoliday = (holidayData) => {
    return axios.post(`${API_BASE_URL.replace('/employees', '')}/admin/holidays`, holidayData, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const updateHoliday = (holidayId, holidayData) => {
    return axios.put(`${API_BASE_URL.replace('/employees', '')}/admin/holidays/${holidayId}`, holidayData, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const deleteHoliday = (holidayId) => {
    return axios.delete(`${API_BASE_URL.replace('/employees', '')}/admin/holidays/${holidayId}`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

// Leave Cancellation API functions
export const requestLeaveCancellation = (leaveAppId, cancellationReason) => {
    return axios.post(`${API_BASE_URL.replace('/employees', '')}/leave-cancellation/request`, {
        leaveAppId,
        cancellationReason
    }, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const getMyCancellationRequests = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/leave-cancellation/my-requests`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const getPendingCancellationRequests = () => {
    return axios.get(`${API_BASE_URL.replace('/employees', '')}/leave-cancellation/pending`, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

export const handleCancellationRequest = (requestId, action, managerComments) => {
    return axios.put(`${API_BASE_URL.replace('/employees', '')}/leave-cancellation/handle/${requestId}`, {
        action, // 'approve' or 'reject'
        managerComments
    }, {
        headers: {
            Authorization: `Bearer ${getAuthToken()}`
        }
    });
};

// Export the instance for general use (e.g., Profile)
export default api;