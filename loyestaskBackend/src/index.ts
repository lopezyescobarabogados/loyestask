import colors from "colors";
import server from "./server";
import { connectDB } from "./config/db";
import { NotificationService } from "./services/NotificationService";
import { InitializationService } from "./services/InitializationService";
import { FinancialNotificationService } from "./services/FinancialNotificationService";
import { EnvironmentValidator } from "./utils/environmentValidator";

// Función principal de inicio
async function startServer() {
  try {
    // Validar variables de entorno
    console.log(colors.magenta.bold("🔧 LoyesTask - Sistema de Gestión de Tareas"));
    
    const isValidEnvironment = EnvironmentValidator.validateEnvironment();
    
    if (!isValidEnvironment) {
      console.log(colors.red.bold("❌ Error: Variables de entorno inválidas"));
      console.log(colors.yellow("💡 Revisa la configuración antes de continuar"));
      
      if (process.env.NODE_ENV === 'production') {
        EnvironmentValidator.printRailwayCommands();
        process.exit(1);
      } else {
        console.log(colors.yellow("⚠️  Continuando en modo desarrollo..."));
      }
    }

    // Conectar a la base de datos
    await connectDB();
    console.log(colors.green.bold("✅ Base de datos conectada"));

    // Ejecutar inicialización de la aplicación
    const initService = InitializationService.getInstance();
    await initService.initialize();

    // Inicializar servicios
    NotificationService.getInstance().initialize();
    FinancialNotificationService.getInstance(); // Inicializar notificaciones financieras

    const port = process.env.PORT || 4000;

    server.listen(port, () => {
      console.log(colors.cyan.bold(`🚀 Servidor ejecutándose en el puerto ${port}`));
      console.log(colors.green.bold(`🌍 LoyesTask está listo para usar`));
      
      if (process.env.NODE_ENV === 'production') {
        console.log(colors.blue.bold(`📍 Railway URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN || 'tu-app.up.railway.app'}`));
      }
    });

  } catch (error) {
    console.error(colors.red.bold("❌ Error al iniciar el servidor:"));
    console.error(colors.red(error.message));
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

