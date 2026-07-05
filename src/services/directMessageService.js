import api from './api';

export const getConversations = async () => {
    try {
        const response = await api.get('/messages/conversations');
        return response.data || [];
    } catch (error) {
        console.error("Failed to get conversations:", error);
        return [];
    }
};

export const getMessagesWithPartner = async (partnerId) => {
    try {
        const response = await api.get(`/messages/conversations/${partnerId}`);
        return response.data || [];
    } catch (error) {
        console.error("Failed to fetch direct messages:", error);
        return [];
    }
};

export const sendDirectMessage = async (partnerId, text) => {
    try {
        const response = await api.post(`/messages/conversations/${partnerId}`, { text });
        return response.data;
    } catch (error) {
        console.error("Failed to deliver direct message:", error);
        throw error;
    }
};
