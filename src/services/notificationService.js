import axios from 'axios';

const API_URL = '/api/notifications';

const getAuthHeader = () => {
    const user = JSON.parse(sessionStorage.getItem('user'));
    return user && user.token ? { Authorization: `Bearer ${user.token}` } : {};
};

export const getNotifications = async () => {
    try {
        const response = await axios.get(API_URL, { headers: getAuthHeader() });
        return response.data.notifications;
    } catch (error) {
        console.error("Error fetching notifications:", error);
        return [];
    }
};

export const markAsRead = async (id) => {
    try {
        await axios.put(`${API_URL}/${id}/read`, {}, { headers: getAuthHeader() });
        return true;
    } catch (error) {
        console.error("Error marking notification as read:", error);
        return false;
    }
};

export const clearAllNotifications = async () => {
    try {
        await axios.delete(`${API_URL}/clear`, { headers: getAuthHeader() });
        return true;
    } catch (error) {
        console.error("Error clearing notifications:", error);
        return false;
    }
};
