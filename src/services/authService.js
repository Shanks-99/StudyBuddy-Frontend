import api from './api';

const persistAuthData = (authPayload) => {
    if (!authPayload?.token) return;

    sessionStorage.setItem('token', authPayload.token);
    sessionStorage.setItem('user', JSON.stringify({
        ...authPayload,
        id: authPayload.id || authPayload._id
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
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    localStorage.removeItem('contentGeneratorMessages'); // Clear chat history on logout
};

export const getCurrentUser = () => {
    const userStr = sessionStorage.getItem('user');
    if (userStr) return JSON.parse(userStr);
    return null;
};

// Profile management
export const getProfile = async () => {
    const response = await api.get("/auth/profile");
    return response.data;
};

export const updateProfile = async (profileData) => {
    const response = await api.put("/auth/profile", profileData);
    if (response.data.user) {
        sessionStorage.setItem("user", JSON.stringify(response.data.user));
    }
    return response.data;
};

export const changePassword = async (passwords) => {
    const response = await api.put("/auth/change-password", passwords);
    return response.data;
};

export const deleteAccount = async () => {
    const response = await api.delete("/auth/delete-account");
    return response.data;
};

