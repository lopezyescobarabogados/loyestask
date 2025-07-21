import colors from "colors";
import server from "./server";
import { connectDB } from "./config/db";
import { NotificationService } from "./services/NotificationService";
import { InitializationService } from "./services/InitializationService";

// Función principal de inicio
async function startServer() {
  try {
    // Conectar a la base de datos
    await connectDB();
    console.log(colors.green.bold("✅ Base de datos conectada"));

    // Ejecutar inicialización de la aplicación
    const initService = InitializationService.getInstance();
    await initService.initialize();

    // Inicializar servicios
    NotificationService.getInstance().initialize();

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
