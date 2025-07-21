import axios from "axios"

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL
})

// Debug logging en desarrollo
if (import.meta.env.MODE === 'development') {
    console.log('🔧 API Configuration:');
    console.log('VITE_API_URL:', import.meta.env.VITE_API_URL);
    console.log('Axios baseURL:', api.defaults.baseURL);
}

api.interceptors.request.use(config => {
    const token = localStorage.getItem('AUTH_TOKEN')
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    
    // Log requests en desarrollo
    if (import.meta.env.MODE === 'development') {
        console.log('🚀 API Request:', {
            method: config.method?.toUpperCase(),
            url: config.url,
            baseURL: config.baseURL,
            fullURL: `${config.baseURL}${config.url}`
        });
    }
    
    return config
})

// Log responses en desarrollo
api.interceptors.response.use(
    response => {
        if (import.meta.env.MODE === 'development') {
            console.log('✅ API Response:', {
                status: response.status,
                url: response.config.url,
                data: response.data
            });
        }
        return response;
    },
    error => {
        if (import.meta.env.MODE === 'development') {
            console.error('❌ API Error:', {
                status: error.response?.status,
                url: error.config?.url,
                message: error.message,
                response: error.response?.data
            });
        }
        return Promise.reject(error);
    }
)

export default api 