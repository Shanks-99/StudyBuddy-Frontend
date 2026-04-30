import api from './api';

const API_URL = '/notifications';

export const getNotifications = async () => {
    try {
        const response = await api.get(API_URL);
        return response.data.notifications || [];
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markAsRead = async (id) => {
    try {
        await api.put(`${API_URL}/${id}/read`);
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
};

export const clearAllNotifications = async () => {
    try {
        await api.delete(`${API_URL}/clear`);
        return true;
    } catch (error) {
        console.error("Error clearing notifications:", error);
        return false;
    }
};

export const markAllAsRead = async () => {
    try {
        await api.put(`${API_URL}/mark-all-read`);
        return true;
    } catch (error) {
        console.error("Error marking all notifications as read:", error);
        return false;
    }
};
