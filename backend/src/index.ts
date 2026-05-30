import app from "./app";
import { createServer } from "http";
import sequelize from "./config/database";
import { runSeeder } from "./seed";
import { logInfo, logError } from "./utils/Logger";
import { initSocketGateway } from "./socket/socket.gateway";

import "./models/associations";

const PORT = process.env["PORT"] || 3000;

async function main() {
  try {
    console.log("⏳ Sincronizando base de datos...");
    await sequelize.sync({ force: true });
    console.log("✅ Tablas sincronizadas con éxito.");

    console.log("🌱 Corriendo Seeders...");
    await runSeeder();
    console.log("✅ Datos base insertados.");

    const httpServer = createServer(app);
    initSocketGateway(httpServer);

    httpServer.listen(PORT, () => {
      console.log("🚀 Servidor corriendo en http://localhost:3000");
    });

    process.on("SIGINT", () => {
      console.log("👋 Cerrando servidor legalmente...");
      process.exit(0);
    });

    process.on("SIGTERM", () => {
      console.log("🛑 Servidor terminado por el sistema.");
      process.exit(0);
    });
  } catch (error) {
    console.error("❌ Error fatal al arrancar:", error);
  }
}

main();
