import { CorsOptions } from "cors" 

export const corsConfig: CorsOptions = {
    origin: function(origin, callback) {
        const whitelist = [process.env.FRONTEND_URL]
        
        // Allow requests from localhost during development
        if (process.env.NODE_ENV !== 'production') {
            whitelist.push('http://localhost:5173', 'http://127.0.0.1:5173')
        }
        
        // Allow API tools during development
        if(process.argv[2] === '--api'){
            whitelist.push(undefined)
        }
        
        if(whitelist.includes(origin) || !origin) {
            callback(null, true)
        } else {
            callback(new Error("Error de CORS"))
        }
    }
}