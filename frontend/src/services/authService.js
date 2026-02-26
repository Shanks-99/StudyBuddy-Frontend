import api from './api';

export const register = async (userData) => {
    const response = await api.post('/auth/register', userData);
    return response.data;
};

export const login = async (credentials) => {
    const response = await api.post('/auth/login', credentials);
    if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify({
            id: response.data.id || response.data._id, // Add ID here (handling potential key names from backend)
            name: response.data.name,
            role: response.data.role
        }));
    }
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
