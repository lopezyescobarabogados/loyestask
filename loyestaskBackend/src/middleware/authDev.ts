import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User';

// Mock user for development mode when DB is not available
const mockAdminUser = {
  _id: 'mock_admin_id',
  name: 'Administrador',
  email: 'admin@loyestask.com',
  role: 'admin',
  confirmed: true
};

export const authenticateDev = async (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  try {
    const bearer = req.headers.authorization;
    
    if (!bearer) {
      const error = new Error('No Autorizado');
      return res.status(401).json({ error: error.message });
    }

    const token = bearer.split(' ')[1];

    if (!token) {
      const error = new Error('No Autorizado');
      return res.status(401).json({ error: error.message });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      
      // En modo desarrollo, si hay problemas de BD, usar usuario mock
      if (process.env.NODE_ENV === 'development') {
        try {
          const user = await User.findById(decoded.id).select('-password');
          req.user = user;
        } catch (dbError) {
          console.log('Error de BD en auth, usando usuario mock');
          req.user = mockAdminUser;
        }
      } else {
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
          const error = new Error('Token No Válido');
          return res.status(401).json({ error: error.message });
        }
        req.user = user;
      }

      next();
    } catch (jwtError) {
      const error = new Error('Token No Válido');
      return res.status(401).json({ error: error.message });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error interno del servidor' });
  }
};

export const requireAdminDev = (req: Request & { user?: any }, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    const error = new Error('Permisos insuficientes');
    return res.status(403).json({ error: error.message });
  }
};
