import app from "./app";
import sequelize from "./config/database";
import { runSeeder } from "./seed";

import "./models/Role";
import "./models/User";
import "./models/MenuOption";
import "./models/RoleMenuPermission";
import "./models/UserMenuOverride";

const PORT = process.env["PORT"] || 3000;

async function main() {
  try {
    console.log("⏳ Sincronizando base de datos...");
    await sequelize.sync({ force: true });
    console.log("✅ Tablas creadas con éxito.");

    console.log("🌱 Corriendo Seeders...");
    await runSeeder();
    console.log("✅ Datos base insertados.");

    app.listen(3000, () => {
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
