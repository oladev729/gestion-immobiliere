import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5055/api',
});

api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Instance API sans authentification pour les visiteurs
export const publicApi = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5055/api',
});

export default api;
