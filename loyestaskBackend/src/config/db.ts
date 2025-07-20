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
      serverSelectionTimeoutMS: 5000, // Tiempo de espera para seleccionar servidor
      socketTimeoutMS: 45000, // Tiempo de espera para operaciones de socket
      retryWrites: true,
      writeConcern: {
        w: 'majority' as const
      }
    };

    const { connection } = await mongoose.connect(process.env.DATABASE_URL, options);
    const url = `${connection.host}:${connection.port}`;
    console.log(colors.magenta.bold(`MongoDB conectado en: ${url}`));
    console.log(colors.green.bold(`Base de datos: ${connection.name}`));
  } catch (error) {
    console.log(colors.red.bold("Error al conectar a MongoDB"));
    console.log(colors.red(error.message));
    exit(1);
  }
};
