import { Router } from "express";
import jwt from "jsonwebtoken";

const router = Router();

// Endpoint de login simplificado para desarrollo
router.post("/dev-login", async (req, res) => {
  try {
    if (process.env.NODE_ENV !== 'development') {
      return res.status(404).json({ error: 'Endpoint no disponible en producción' });
    }

    const { email, password } = req.body;

    // Validar credenciales mock
    if (email === 'admin@loyestask.com' && password === 'admin123') {
      const mockUser = {
        _id: 'mock_admin_id',
        name: 'Administrador',
        email: 'admin@loyestask.com',
        role: 'admin',
        confirmed: true
      };

      const token = jwt.sign(
        { id: mockUser._id },
        process.env.JWT_SECRET!,
        { expiresIn: '30d' }
      );

      res.json({
        msg: 'Login exitoso (modo desarrollo)',
        token,
        user: mockUser
      });
    } else {
      res.status(401).json({ error: 'Credenciales inválidas' });
    }
  } catch (error) {
    console.error('Error en dev login:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

export default router;
