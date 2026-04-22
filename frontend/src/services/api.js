import axios from 'axios';

const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

const configuredApiUrl = process.env.REACT_APP_API_URL;

const localApiBaseUrl = 'http://localhost:5000/api';
const remoteApiBaseUrl = 'https://studybuddy-backend-pl2i.onrender.com/api';

const defaultApiBaseUrl = isLocalhost
    ? localApiBaseUrl
    : (configuredApiUrl || remoteApiBaseUrl);

const api = axios.create({
    baseURL: defaultApiBaseUrl,
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
