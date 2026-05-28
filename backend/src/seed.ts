import * as bcrypt from "bcryptjs";
import path from "path";
import sequelize from "./config/database";
import Role from "./models/Role";
import MenuOption from "./models/MenuOption";
import User from "./models/User";
import RoleMenuPermission from "./models/RoleMenuPermission";
import TipoDocumento from "./models/TipoDocumento";
import UserMenuOverride from "./models/UserMenuOverride"; // 👈 1. Importación agregada
import { initAssociations } from "./models/associations";

// Helpers de automatización
import { parseCSV } from "./utils/bd/csvReader";
import { autoMapCsvRow } from "./utils/bd/autoMapper";

// Importación de la arquitectura de modelos
import TipoUsuario from "./models/TipoUsuario";
import Camas from "./models/Camas";
import Tarifarios from "./models/Tarifarios";
import NivelAtencion from "./models/NivelAtencion";
import TipoAutorizacion from "./models/TipoAutorizacion";
import TipoOrigen from "./models/TipoOrigen";
import TipoTriage from "./models/TipoTriage";
import Especialidades from "./models/Especialidades";
import Departamentos from "./models/Departamentos";
import CentroCosto from "./models/CentroCosto";
import Municipios from "./models/Municipios";
import Diagnostico from "./models/Diagnostico";
import TriagePrioridad from "./models/TriagePrioridad";
import Convenios from "./models/Convenios";
import Contratos from "./models/Contratos";
import Cups from "./models/Cups";
import Admisiones from "./models/Admisiones";
import Autorizaciones from "./models/Autorizaciones";
import DiagnosticoPaciente from "./models/DiagnosticoPaciente";
import Articulados from "./models/Articulados";
import TipoParagrafo from "./models/TipoParagrafo";
import ParagrafoAplicacion from "./models/ParagrafoAplicacion";
import ParagrafoEdad from "./models/ParagrafoEdad";
import ParagrafoInclusion from "./models/ParagrafoInclusion";
import ParagrafoValor from "./models/ParagrafoValor";
import TiposAcceso from "./models/TiposAcceso";
import ViasAcceso from "./models/ViasAcceso";

export const runSeeder = async () => {
  try {
    console.log("🚀 Iniciando Seed de Clinisalud 2026...");

    // Inicialización del mapa de relaciones en memoria
    initAssociations();
    console.log("🔗 Asociaciones de modelos inicializadas correctamente.");

    // ----------------------------------------------------------------
    // PASO 0: Vaciar por completo la Base de Datos (Truncate Global)
    // ----------------------------------------------------------------
    console.log("🧹 Borrando datos existentes para reiniciar las tablas...");

    // Desactivamos restricciones temporales de llave foránea para SQLite
    await sequelize.query("PRAGMA foreign_keys = OFF;");

    // 👈 2. Incluimos UserMenuOverride en el array de vaciado para evitar bloqueos
    const allModels: any[] = [
      RoleMenuPermission, UserMenuOverride, User, Role, MenuOption, TipoDocumento, 
      TipoUsuario, Camas, Tarifarios, NivelAtencion, TipoAutorizacion, TipoOrigen, 
      TipoTriage, Especialidades, Departamentos, CentroCosto, Municipios, Diagnostico,
      TriagePrioridad, Convenios, Contratos, Cups, Admisiones, Autorizaciones,
      DiagnosticoPaciente, Articulados, TipoParagrafo, ParagrafoAplicacion,
      ParagrafoEdad, ParagrafoInclusion, ParagrafoValor, TiposAcceso, ViasAcceso
    ];

    for (const model of allModels) {
      await model.truncate({ force: true });
    }

    // Re-activamos las restricciones para SQLite
    await sequelize.query("PRAGMA foreign_keys = ON;");
    console.log("🗑️ Base de datos completamente limpia y vacía.");

    // ----------------------------------------------------------------
    // PASO 1: Inicialización de Roles del Sistema
    // ----------------------------------------------------------------
    const [adminRole] = await Role.findOrCreate({
      where: { code: "ADMIN" },
      defaults: { name: "Administrador Sistema", code: "ADMIN" },
    });

    // ----------------------------------------------------------------
    // PASO 2: Secuencia y Validación Estricta de los 29 CSV
    // ----------------------------------------------------------------
    console.log("📦 Iniciando procesamiento e inserción de archivos CSV...");
    const csvFolder = path.join(__dirname, "../../tablas_clinisalud");

    const loadingSequence: { model: any; file: string }[] = [
      { model: MenuOption, file: "menu_option.csv" },
      { model: TipoDocumento, file: "tipo_documento.csv" },
      { model: TipoUsuario, file: "tipo_usuario.csv" },
      { model: Camas, file: "camas.csv" },
      { model: Tarifarios, file: "tarifarios.csv" },
      { model: NivelAtencion, file: "nivel_atencion.csv" },
      { model: TipoAutorizacion, file: "tipo_autorizacion.csv" },
      { model: TipoOrigen, file: "tipo_origen.csv" },
      { model: TipoTriage, file: "tipo_triage.csv" },
      { model: Especialidades, file: "especialidades.csv" },
      { model: Departamentos, file: "departamentos.csv" },
      { model: CentroCosto, file: "centro_costo.csv" },
      { model: Municipios, file: "municipios.csv" },
      { model: Diagnostico, file: "diagnostico.csv" },
      { model: TriagePrioridad, file: "triage_prioridad.csv" },
      { model: Convenios, file: "convenios.csv" },
      { model: Contratos, file: "contratos.csv" },
      { model: Cups, file: "cups.csv" },
      { model: Admisiones, file: "admisiones.csv" },
      { model: Autorizaciones, file: "autorizaciones.csv" },
      { model: DiagnosticoPaciente, file: "diagnostico_paciente.csv" },
      { model: Articulados, file: "articulados.csv" },
      { model: TipoParagrafo, file: "tipo_paragrafo.csv" },
      { model: ParagrafoAplicacion, file: "paragrafo_aplicacion.csv" },
      { model: ParagrafoEdad, file: "paragrafo_edad.csv" },
      { model: ParagrafoInclusion, file: "paragrafo_inclusion.csv" },
      { model: ParagrafoValor, file: "paragrafo_valor.csv" },
      { model: TiposAcceso, file: "tipos_de_acceso.csv" },
      { model: ViasAcceso, file: "vias_acceso.csv" }
    ];

    for (const step of loadingSequence) {
      const fullPath = path.join(csvFolder, step.file);
      console.log(`⏳ Analizando concordancia estructural para: ${step.file} ...`);

      const rawRecords = await parseCSV<any>(fullPath);

      if (rawRecords.length > 0) {
        const csvHeaders = Object.keys(rawRecords[0]);
        const modelAttributes = step.model.getAttributes();

        for (const [camelCaseKey, attributeConfig] of Object.entries(modelAttributes)) {
          if (camelCaseKey === "createdAt" || camelCaseKey === "updatedAt") continue;

          const config = attributeConfig as any;
          const expectedColumnInCsv = config.field || camelCaseKey;

          if (config.allowNull === false && !config.autoIncrement) {
            if (!csvHeaders.includes(expectedColumnInCsv)) {
              throw new Error(
                `💥 ERROR CRÍTICO DE CONCORDANCIA: La columna obligatoria '${expectedColumnInCsv}' exigida por el modelo '${step.model.name}' NO existe en el archivo '${step.file}'. Proceso interrumpido.`
              );
            }
          }
        }
      }

      const mappedRows = rawRecords.map(row => autoMapCsvRow(step.model, row));

      await step.model.bulkCreate(mappedRows, {
        ignoreDuplicates: false,
        hooks: false,
        validate: false
      });

      console.log(`   --> Éxito: ${mappedRows.length} registros nuevos inyectados.`);
    }

    // ----------------------------------------------------------------
    // PASO 3: Permisos totales para el rol ADMIN
    // ----------------------------------------------------------------
    const allOptions = await MenuOption.findAll();
    for (const opt of allOptions) {
      await RoleMenuPermission.findOrCreate({
        where: { roleId: adminRole.id, menuOptionId: opt.id },
      });
    }
    console.log(`✅ Acceso total a ${allOptions.length} opciones de menú para rol ADMIN.`);

    // ----------------------------------------------------------------
    // PASO 4: Crear Usuario Admin Inicial
    // ----------------------------------------------------------------
    const adminEmail = "admin@clinisalud.com";
    let adminUser = await User.findOne({ where: { email: adminEmail } });

    if (!adminUser) {
      const ccDocType = await TipoDocumento.findOne({ where: { code: "CC" } });
      const hashedPassword = await bcrypt.hash("Admin2026!", 10);

      adminUser = await User.create({
        firstName: "Admin",
        lastName: "General",
        documentTypeId: ccDocType ? ccDocType.id : 1,
        dni: "00000000",
        email: adminEmail,
        password: hashedPassword,
        roleId: adminRole.id,
        isActive: true,
      });
      console.log(`✅ Cuenta de Administrador desplegada: ${adminEmail} / Admin2026!`);
    }

    console.log("🎉 ¡Reset global, validación estructural e importación masiva exitosos!");
  } catch (error) {
    console.error("❌ Error en el Seed:", error);
  }
};