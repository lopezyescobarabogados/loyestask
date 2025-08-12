import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

api.interceptors.request.use(config => {
    const token = localStorage.getItem('AUTH_TOKEN')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log requests solo en desarrollo
    if (import.meta.env.MODE === 'development') {
        console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            fullURL: `${config.baseURL}${config.url}`
        });
    }
    
    return config
})

// Log responses críticos solamente
api.interceptors.response.use(
    response => response,
    error => {
        if (import.meta.env.MODE === 'development') {
            console.error('❌ API Error:', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message
            });
        }
        return Promise.reject(error);
    }
)

export default api 