import colors from "colors";
import server from "./server-auth-only";

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(colors.cyan.bold(`AUTH ONLY API funcionado en el puerto ${port}`));
});
