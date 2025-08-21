import { CorsOptions } from "cors" 

export const corsConfig: CorsOptions = {
    origin: function(origin, callback) {
        const whitelist = []
        
        // Add frontend URL if exists
        if (process.env.FRONTEND_URL) {
            whitelist.push(process.env.FRONTEND_URL)
        }
        
        // Allow requests from localhost during development
        if (process.env.NODE_ENV !== 'production') {
            whitelist.push('http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174')
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
        
        // Remove duplicates and filter out null/undefined values
        const cleanWhitelist = [...new Set(whitelist.filter(item => item !== null && item !== undefined))]
        
        console.log(`CORS check - Origin: ${origin}, Whitelist: ${JSON.stringify(cleanWhitelist)}`);
        
        if(cleanWhitelist.includes(origin) || !origin) {
            callback(null, true)
        } else {
            console.log(`CORS blocked origin: ${origin}`);
            callback(new Error("Error de CORS - Origen no permitido"))
        }
    },
    credentials: true, // Permitir cookies y headers de autenticación
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    preflightContinue: false,
    optionsSuccessStatus: 200
}