// FRONTEND/utils/interceptors.js
import axios from 'axios';

export const setupAxiosInterceptor = () => {
    axios.defaults.withCredentials = true;
};

export default setupAxiosInterceptor;