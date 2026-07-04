import api from "./api";

export const createBuddyRoom = async (roomData) => {
    try {
        const response = await api.post("/studybuddy", roomData);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to create study buddy room" };
    }
};

export const getBuddyRooms = async () => {
    try {
        const response = await api.get("/studybuddy");
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to get study buddy rooms" };
    }
};

export const getBuddyRoomDetails = async (roomId) => {
    try {
        const response = await api.get(`/studybuddy/${roomId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to get study buddy room details" };
    }
};

export const joinBuddyRoom = async (roomId, userId, passcode) => {
    try {
        const response = await api.put(`/studybuddy/join/${roomId}`, { userId, passcode });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to join study buddy room" };
    }
};

export const leaveBuddyRoom = async (roomId, userId) => {
    try {
        const response = await api.put(`/studybuddy/leave/${roomId}`, { userId });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to leave study buddy room" };
    }
};

export const completeBuddyRoom = async (roomId) => {
    try {
        const response = await api.put(`/studybuddy/complete/${roomId}`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to end study buddy room" };
    }
};

export const getBuddyRoomMessages = async (roomId) => {
    try {
        const response = await api.get(`/studybuddy/${roomId}/messages`);
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to get chat messages" };
    }
};

export const syncBuddyNotes = async (roomId, notes) => {
    try {
        const response = await api.put(`/studybuddy/${roomId}/notes`, { notes });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to sync notes" };
    }
};

export const syncBuddyTodos = async (roomId, todos) => {
    try {
        const response = await api.put(`/studybuddy/${roomId}/todos`, { todos });
        return response.data;
    } catch (error) {
        throw error.response?.data || { message: "Failed to sync todos" };
    }
};
