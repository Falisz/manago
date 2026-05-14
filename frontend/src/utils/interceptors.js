// FRONTEND/utils/interceptors.js
import axios from 'axios';

export const setupAxiosInterceptor = () => {
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = "http://localhost:5000";
};

export default setupAxiosInterceptor;