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
        
        // Allow Railway domains for internal service communication
        if (process.env.NODE_ENV === 'production' && origin) {
            const isRailwayDomain = origin.includes('.railway.app') || origin.includes('.up.railway.app');
            if (isRailwayDomain) {
                whitelist.push(origin);
            }
        }
        
        console.log(`CORS check - Origin: ${origin}, Whitelist: ${JSON.stringify(whitelist)}`);
        
        if(whitelist.includes(origin) || !origin) {
            callback(null, true)
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error("Error de CORS - Origen no permitido"))
        }
    },
    credentials: true, // Permitir cookies y headers de autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}