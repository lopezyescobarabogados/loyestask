import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User, { IUser } from "../models/User";

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
    }
  }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ message: "No autorizado: token faltante o mal formado" });
    return;
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as jwt.JwtPayload;

    if (!decoded || typeof decoded !== "object" || !decoded.id) {
      res.status(401).json({ error: "Token inválido" });
      return;
    }

    const user = await User.findById(decoded.id).select("_id name email role confirmed");

    if (!user) {
      res.status(401).json({ error: "Token inválido: usuario no encontrado" });
      return;
    }

    req.user = user;
    next();
  } catch (error) {
    console.error("Error al verificar token:", error);
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
