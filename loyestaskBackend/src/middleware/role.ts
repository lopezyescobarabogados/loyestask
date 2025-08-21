import type { Request, Response, NextFunction } from 'express'

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== 'admin') {
        const error = new Error('Acceso denegado. Se requieren permisos de administrador.')
        res.status(403).json({ error: error.message })
        return
    }
    next()
}

export const requireUser = (req: Request, res: Response, next: NextFunction) => {
    if (req.user.role !== 'user' && req.user.role !== 'admin') {
        const error = new Error('Acceso denegado. Se requiere estar autenticado.')
        res.status(403).json({ error: error.message })
        return
    }
    next()
}

// Alias para compatibilidad
export const isAdmin = requireAdmin