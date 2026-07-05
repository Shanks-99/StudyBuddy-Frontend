import api from './api';

export const assignTaskToStudent = async (studentId, title, description) => {
    try {
        const response = await api.post('/tasks/assign', { studentId, title, description });
        return response.data;
    } catch (error) {
        console.error("Failed to assign task:", error);
        throw error;
    }
};

export const getTasks = async (studentId = '') => {
    try {
        const url = studentId ? `/tasks?studentId=${studentId}` : '/tasks';
        const response = await api.get(url);
        return response.data || [];
    } catch (error) {
        console.error("Failed to retrieve tasks:", error);
        return [];
    }
};

export const toggleTaskStatus = async (taskId) => {
    try {
        const response = await api.patch(`/tasks/${taskId}/toggle`);
        return response.data;
    } catch (error) {
        console.error("Failed to toggle task:", error);
        throw error;
    }
};

export const deleteTask = async (taskId) => {
    try {
        const response = await api.delete(`/tasks/${taskId}`);
        return response.data;
    } catch (error) {
        console.error("Failed to delete task:", error);
        throw error;
    }
};
