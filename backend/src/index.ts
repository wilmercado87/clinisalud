import "dotenv/config";
import app from "./app";
import { createServer } from "http";
import sequelize from "./config/database";
import { runSeeder } from "./seed";
import { logInfo, logError } from "./utils/Logger";
import { initSocketGateway } from "./socket/socket.gateway";
import { EmailService } from "./modules/notifications/email.service";

import "./models/associations";
import { initAssociations } from "./models/associations";

const PORT = process.env["PORT"] || 3000;

async function main() {
  try {
    initAssociations();
    await sequelize.authenticate();
    console.log("✅ Conexión a base de datos establecida.");

    if (process.env.DB_SYNC === "force") {
      console.log("⏳ Modo DB_SYNC=force: recreando esquema y datos...");
      await sequelize.sync({ force: true });
      console.log("✅ Tablas sincronizadas con éxito.");

      console.log("🌱 Corriendo Seeders...");
      await runSeeder();
      console.log("✅ Datos base insertados.");
    } else {
      console.log("ℹ️  Arranque normal: verificando esquema sin modificar datos...");
      const tables = await sequelize.getQueryInterface().showAllTables();
      logInfo(`Esquema verificado (${tables.length} tablas). Los datos existentes se conservan intactos.`);
    }

    const emailService = new EmailService();
    await emailService.verifyConnection();

    const httpServer = createServer(app);
    initSocketGateway(httpServer);

    httpServer.listen(PORT, () => {
      console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
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
    process.exit(1);
  }
}

main();