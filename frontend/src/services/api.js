import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL || "https://studybuddy-backend-pl2i.onrender.com/api",
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to include the token in headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default api;
