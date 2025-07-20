import colors from "colors";
import server from "./server-test";

const port = process.env.PORT || 4000;

server.listen(port, () => {
  console.log(colors.cyan.bold(`TEST API funcionado en el puerto ${port}`));
});
