import colors from "colors";
import server from "./server";
import NotificationService from "./services/NotificationService";

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(colors.cyan.bold(`REST API funcionado en el puerto ${port}`));
  
  // Inicializar servicio de notificaciones
  const notificationService = NotificationService.getInstance();
  notificationService.initialize();
});
