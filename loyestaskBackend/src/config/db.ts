import mongoose from "mongoose";
import colors from "colors";
import { exit } from "node:process";

export const connectDB = async () => {
  try {
    if (!process.env.DATABASE_URL) {
      console.log(colors.red.bold("Error: DATABASE_URL no está definida"));
      exit(1);
    }

    // Configuración optimizada para Railway MongoDB
    const options = {
      maxPoolSize: 10, // Mantener hasta 10 conexiones en el pool
      serverSelectionTimeoutMS: 10000, // Aumentar tiempo de espera
      socketTimeoutMS: 45000, // Tiempo de espera para operaciones de socket
      connectTimeoutMS: 10000, // Tiempo de espera para conexión inicial
      retryWrites: true,
      writeConcern: {
        w: 'majority' as const
      }
      // Removido: bufferCommands y bufferMaxEntries (obsoletos en versiones recientes)
    };

    console.log(colors.blue.bold("🔄 Conectando a MongoDB..."));
    console.log(colors.gray(`📍 URL: ${process.env.DATABASE_URL.replace(/\/\/.*@/, '//***:***@')}`));

    const { connection } = await mongoose.connect(process.env.DATABASE_URL, options);
    
    // Obtener información de conexión de manera segura
    const host = connection.host || 'unknown-host';
    const port = connection.port || 'unknown-port';
    const dbName = connection.name || 'unknown-database';
    
    console.log(colors.magenta.bold(`MongoDB conectado en: ${host}:${port}`));
    console.log(colors.green.bold(`Base de datos: ${dbName}`));

    // Configurar listeners de eventos
    connection.on('error', (error) => {
      console.error(colors.red.bold('❌ Error de conexión MongoDB:'), error);
    });

    connection.on('disconnected', () => {
      console.log(colors.yellow.bold('⚠️  MongoDB desconectado'));
    });

    connection.on('reconnected', () => {
      console.log(colors.green.bold('✅ MongoDB reconectado'));
    });

    // Verificar que la conexión esté activa
    if (connection.readyState === 1) {
      console.log(colors.green.bold('✅ Estado de conexión: Activa'));
    } else {
      console.log(colors.yellow.bold(`⚠️  Estado de conexión: ${connection.readyState}`));
    }

  } catch (error) {
    console.log(colors.red.bold("❌ Error al conectar a MongoDB"));
    console.log(colors.red(`📋 Detalles: ${error.message}`));
    
    if (error.name === 'MongoServerSelectionError') {
      console.log(colors.yellow.bold("💡 Posibles soluciones:"));
      console.log(colors.white("  1. Verificar que la URL de MongoDB sea correcta"));
      console.log(colors.white("  2. Comprobar la conectividad de red"));
      console.log(colors.white("  3. Verificar las credenciales de MongoDB"));
      console.log(colors.white("  4. Asegurarse de que el clúster de MongoDB esté activo"));
    }
    
    exit(1);
  }
};
