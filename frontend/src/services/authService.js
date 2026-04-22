import api from './api';

const persistAuthData = (authPayload) => {
    if (!authPayload?.token) return;

    localStorage.setItem('token', authPayload.token);
    localStorage.setItem('user', JSON.stringify({
        id: authPayload.id || authPayload._id,
        name: authPayload.name,
        role: authPayload.role
    }));
};

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const verifyRegistrationCode = async ({ email, code }) => {
    const response = await api.post('/auth/verify-code', { email, code });
    return response.data;
};

export const resendVerificationCode = async ({ email }) => {
    const response = await api.post('/auth/resend-code', { email });
    return response.data;
};

export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    persistAuthData(response.data);
    return response.data;
};

export const loginWithGoogle = async ({ idToken, role }) => {
    const response = await api.post('/auth/google', { idToken, role });
    persistAuthData(response.data);
    return response.data;
};

export const forgotPassword = async ({ email }) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
};

export const verifyResetCode = async ({ email, code }) => {
    const response = await api.post('/auth/verify-reset-code', { email, code });
    return response.data;
};

export const resetPassword = async ({ email, code, newPassword }) => {
    const response = await api.post('/auth/reset-password', { email, code, newPassword });
    return response.data;
};

export const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('contentGeneratorMessages'); // Clear chat history on logout
};

export const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};
