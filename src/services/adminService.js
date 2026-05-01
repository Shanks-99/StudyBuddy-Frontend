import api from './api';

// Dashboard
export const getAdminDashboard = async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
};

// Students
export const getAllStudents = async (params = {}) => {
    const response = await api.get('/admin/students', { params });
    return response.data;
};

// Mentors
export const getAllMentors = async (params = {}) => {
    const response = await api.get('/admin/mentors', { params });
    return response.data;
};

// Approvals
export const getPendingApprovals = async () => {
    const response = await api.get('/admin/approvals');
    return response.data;
};

export const updateMentorStatus = async (profileId, data) => {
    const response = await api.put(`/admin/approvals/${profileId}`, data);
    return response.data;
};

// Reports
export const getAllReports = async (params = {}) => {
    const response = await api.get('/admin/reports', { params });
    return response.data;
};

export const updateReportStatus = async (reportId, data) => {
    const response = await api.put(`/admin/reports/${reportId}`, data);
    return response.data;
};

export const submitReport = async (data) => {
    const response = await api.post('/admin/reports', data);
    return response.data;
};

// User actions
export const toggleUserBan = async (userId) => {
    const response = await api.put(`/admin/users/${userId}/toggle-ban`);
    return response.data;
};

export const deleteUser = async (userId) => {
    const response = await api.delete(`/admin/users/${userId}`);
    return response.data;
};

// Analytics
export const getAnalytics = async () => {
    const response = await api.get('/admin/analytics');
    return response.data;
};
