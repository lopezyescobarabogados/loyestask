import type { Request, Response, NextFunction } from "express";
import { validationResult } from "express-validator";

export const handleInputErrors = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let errors = validationResult(req);
  if (!errors.isEmpty()) {
    // Unificar formato de error con el resto de la aplicación
    const firstError = errors.array()[0];
    const errorMessage = firstError.msg || 'Error de validación';
    res.status(400).json({ 
      error: errorMessage,
      details: errors.array() // Mantener detalles para debugging
    });
    return;
  }
  next();
};
