import api from './api';

export const createStudyRoom = async (roomData) => {
    try {
        const response = await api.post('/studyrooms', roomData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to create study room' };
    }
};

export const getStudyRooms = async () => {
    try {
        const response = await api.get('/studyrooms');
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to get study rooms' };
    }
};

export const getRoomMessages = async (roomId) => {
    try {
        const response = await api.get(`/studyrooms/${roomId}/messages`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to get room messages' };
    }
};

export const getStudyRoom = async (roomId) => {
    try {
        const response = await api.get(`/studyrooms/${roomId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to get study room' };
    }
};

export const deleteStudyRoom = async (roomId) => {
    try {
        const response = await api.delete(`/studyrooms/${roomId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: 'Failed to delete study room' };
    }
};
