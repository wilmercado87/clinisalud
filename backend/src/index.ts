import app from "./app";
import sequelize from "./config/database";
import { runSeeder } from "./seed";
import { logInfo, logError } from "./utils/Logger";

import "./models/Role";
import "./models/User";
import "./models/MenuOption";
import "./models/RoleMenuPermission";
import "./models/UserMenuOverride";
import "./models/Paciente";
import "./models/FacturacionPaciente";
import "./models/TipoUsuario";
import "./models/TipoDocumento";
import "./models/Convenio";
import "./models/Departamento";
import "./models/Municipio";
import "./models/Especialidad";
import "./models/Diagnostico";
import "./models/Cups";
import "./models/CentroCosto";
import "./models/TipoOrigen";
import "./models/Cama";
import "./models/Estancia";
import "./models/Prioridad";
import "./models/ViaAcceso";
import "./models/TipoAcceso";
import "./models/Tarifario";
import "./models/Triage";
import "./models/DiagnosticoPaciente";
import "./models/DiagnosticoAplicacion";
import "./models/ParrafoAplicacion";
import "./models/Contrato";
import "./models/Mapiss";
import "./models/Articulado";
import "./models/Parrafo";
import "./models/ParrafoEdad";
import "./models/ParrafoInclusion";
import "./models/ParrafoValor";

const PORT = process.env["PORT"] || 3000;

async function main() {
  try {
    console.log("⏳ Sincronizando base de datos...");
    await sequelize.sync({ alter: { drop: false } });
    console.log("✅ Tablas sincronizadas con éxito.");

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
