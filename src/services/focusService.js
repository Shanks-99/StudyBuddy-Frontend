import api from './api';

export const saveFocusSession = async (sessionData) => {
    try {
        const response = await api.post('/focus/save', sessionData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to save focus session' };
    }
};

export const getFocusSessions = async (userId) => {
    try {
        const response = await api.get(`/focus/${userId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to get focus sessions' };
    }
};
