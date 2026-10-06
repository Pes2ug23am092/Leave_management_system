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

// Export the instance for general use (e.g., Profile)
export default api;