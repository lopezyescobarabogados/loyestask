import colors from "colors";
import User from "../models/User";
import { hashPassword } from "../utils/auth";

export class InitializationService {
  private static instance: InitializationService;

  private constructor() {}

  static getInstance(): InitializationService {
    if (!InitializationService.instance) {
      InitializationService.instance = new InitializationService();
    }
    return InitializationService.instance;
  }

  /**
   * Crea el usuario administrador si no existe
   */
  async createAdminUser(): Promise<void> {
    try {
      console.log(colors.yellow.bold("🔧 Verificando usuario administrador..."));

      // Verificar si ya existe un admin
      const existingAdmin = await User.findOne({ role: 'admin' });
      
      if (existingAdmin) {
        console.log(colors.green.bold("✅ Usuario administrador ya existe"));
        console.log(colors.cyan(`📧 Email: ${existingAdmin.email}`));
        return;
      }

      console.log(colors.yellow.bold("👤 Creando usuario administrador..."));

      // Obtener credenciales desde variables de entorno o usar valores por defecto
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@loyestask.com';
      const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';
      const adminName = process.env.ADMIN_NAME || 'Administrador';

      // Crear el usuario admin
      const admin = new User({
        name: adminName,
        email: adminEmail,
        password: await hashPassword(adminPassword),
        role: 'admin',
        confirmed: true
      });

      await admin.save();
      
      console.log(colors.green.bold("✅ Usuario administrador creado exitosamente"));
      console.log(colors.cyan.bold("📋 Credenciales del administrador:"));
      console.log(colors.white(`📧 Email: ${adminEmail}`));
      console.log(colors.white(`🔑 Password: ${adminPassword}`));
      console.log(colors.white(`👑 Rol: admin`));
      console.log(colors.yellow.bold("⚠️  IMPORTANTE: Cambia la contraseña después del primer login"));

    } catch (error) {
      console.error(colors.red.bold("❌ Error al crear usuario administrador:"));
      console.error(colors.red(error.message));
      
      // No detener la aplicación por este error, solo registrarlo
      if (process.env.NODE_ENV === 'production') {
        console.log(colors.yellow.bold("⚠️  La aplicación continuará sin usuario admin"));
      } else {
        throw error; // En desarrollo, sí mostrar el error
      }
    }
  }

  /**
   * Ejecuta todas las tareas de inicialización
   */
  async initialize(): Promise<void> {
    try {
      console.log(colors.magenta.bold("🚀 Iniciando configuración de la aplicación..."));
      
      // Crear usuario admin
      await this.createAdminUser();
      
      // Aquí se pueden agregar más tareas de inicialización en el futuro
      // Por ejemplo: migración de datos, creación de índices, etc.
      
      console.log(colors.green.bold("✅ Configuración de la aplicación completada"));
      
    } catch (error) {
      console.error(colors.red.bold("❌ Error durante la inicialización:"));
      console.error(colors.red(error.message));
      
      if (process.env.NODE_ENV === 'production') {
        console.log(colors.yellow.bold("⚠️  Algunas funciones pueden no estar disponibles"));
      } else {
        process.exit(1);
      }
    }
  }

  /**
   * Verifica si existe al menos un usuario administrador
   */
  async hasAdminUser(): Promise<boolean> {
    try {
      const adminCount = await User.countDocuments({ role: 'admin' });
      return adminCount > 0;
    } catch (error) {
      console.error(colors.red("Error al verificar usuarios admin: " + error.message));
      return false;
    }
  }
}
