import * as bcrypt from "bcryptjs";
import path from "node:path";
import sequelize from "./config/database";
import Rol from "./models/Rol";
import OpcionMenu from "./models/OpcionMenu";
import Usuario from "./models/Usuario";
import PermisoRolMenu from "./models/PermisoRolMenu";
import TipoDocumento from "./models/TipoDocumento";
import SobreescrituraMenuUsuario from "./models/SobreescrituraMenuUsuario";
import Notificacion from "./models/Notificacion";
import DestinatarioNotificacion from "./models/DestinatarioNotificacion";
import { initAssociations } from "./models/associations";
import { MENU_LABELS, ROLE_CODES } from "./constants";

// Helpers de automatización
import { parseCSV } from "./utils/bd/csvReader";
import { autoMapCsvRow } from "./utils/bd/autoMapper";

// Importación de la arquitectura de modelos
import TipoUsuario from "./models/TipoUsuario";
import TipoGenero from "./models/TipoGenero";
import TipoEstado from "./models/TipoEstado";
import Cama from "./models/Cama";
import Tarifario from "./models/Tarifario";
import NivelAtencion from "./models/NivelAtencion";
import TipoAutorizacion from "./models/TipoAutorizacion";
import TipoOrigen from "./models/TipoOrigen";
import TipoTriage from "./models/TipoTriage";
import Especialidad from "./models/Especialidad";
import Departamento from "./models/Departamento";
import CentroCosto from "./models/CentroCosto";
import Municipio from "./models/Municipio";
import Diagnostico from "./models/Diagnostico";
import TriagePrioridad from "./models/TriagePrioridad";
import Convenio from "./models/Convenio";
import Contrato from "./models/Contrato";
import Cups from "./models/Cups";
import Paciente from "./models/Paciente";
import Triage from "./models/Triage";
import Admision from "./models/Admision";
import Autorizacion from "./models/Autorizacion";
import DiagnosticoPaciente from "./models/DiagnosticoPaciente";
import Articulado from "./models/Articulado";
import TipoParagrafo from "./models/TipoParagrafo";
import ParagrafoAplicacion from "./models/ParagrafoAplicacion";
import ParagrafoEdad from "./models/ParagrafoEdad";
import ParagrafoInclusion from "./models/ParagrafoInclusion";
import ParagrafoValor from "./models/ParagrafoValor";
import TipoAcceso from "./models/TipoAcceso";
import ViaAcceso from "./models/ViaAcceso";
import TipoParentesco from "./models/TipoParentesco";
import Acompanante from "./models/Acompanante";

// ----------------------------------------------------------------
// FUNCIONES AUXILIARES (Solución S3776: Reduce Complejidad Cognitiva)
// ----------------------------------------------------------------

async function resetDatabaseTables() {
  await sequelize.query("PRAGMA foreign_keys = OFF;");
  
  const allModels: any[] = [
    PermisoRolMenu, SobreescrituraMenuUsuario, Usuario, Rol, OpcionMenu, TipoDocumento,
    Notificacion, DestinatarioNotificacion, 
    TipoUsuario, TipoGenero, TipoEstado, Cama, Tarifario, NivelAtencion,
    TipoAutorizacion, TipoOrigen, TipoTriage, Especialidad, Departamento,
    CentroCosto, Municipio, Diagnostico, TriagePrioridad, Convenio, Contrato,
    Cups, Paciente, Triage, Admision, Autorizacion, DiagnosticoPaciente,
    Articulado, TipoParagrafo, ParagrafoAplicacion, ParagrafoEdad,
    ParagrafoInclusion, ParagrafoValor, TipoAcceso, ViaAcceso, TipoParentesco,
    Acompanante
  ];

  for (const model of allModels) {
    await model.truncate({ force: true });
  }

  await sequelize.query("PRAGMA foreign_keys = ON;");
}

async function seedSystemRoles() {
  const rolesData = [
    { code: ROLE_CODES.SUPER_ADMIN, name: "Super Administrador" },
    { code: ROLE_CODES.ADMIN, name: "Administrador Sistema" },
    { code: ROLE_CODES.ADMISIONES, name: "Personal de Admisiones" },
    { code: ROLE_CODES.MEDICO, name: "Personal Médico" },
    { code: ROLE_CODES.FACTURADOR, name: "Personal de Facturación" }
  ];

  const initializedRoles: Record<string, Rol> = {};

  for (const item of rolesData) {
    const [roleInstance] = await Rol.findOrCreate({
      where: { code: item.code },
      defaults: item,
    });
    initializedRoles[item.code] = roleInstance;
  }

  return initializedRoles;
}

async function validateAndLoadCsv(step: { model: any; file: string }, csvFolder: string) {
  const fullPath = path.join(csvFolder, step.file);
  console.log(`⏳ Analizando concordancia estructural para: ${step.file} ...`);

  const rawRecords = await parseCSV<any>(fullPath);
  if (rawRecords.length === 0) return;

  const csvHeaders = Object.keys(rawRecords[0]);
  const modelAttributes = step.model.getAttributes();

  for (const [camelCaseKey, attributeConfig] of Object.entries(modelAttributes)) {
    if (camelCaseKey === "createdAt" || camelCaseKey === "updatedAt") continue;

    const config = attributeConfig as any;
    const expectedColumnInCsv = config.field || camelCaseKey;

    if (config.allowNull === false && !config.autoIncrement && !csvHeaders.includes(expectedColumnInCsv)) {
      throw new Error(
        `💥 ERROR CRÍTICO DE CONCORDANCIA: La columna obligatoria '${expectedColumnInCsv}' exigida por el modelo '${step.model.name}' NO existe en el archivo '${step.file}'. Proceso interrumpido.`
      );
    }
  }

  const mappedRows = rawRecords.map(row => autoMapCsvRow(step.model, row));
  await step.model.bulkCreate(mappedRows, { ignoreDuplicates: false, hooks: false, validate: false });
  console.log(`   --> Éxito: ${mappedRows.length} registros nuevos inyectados.`);
}

async function assignAllRolePermissions(rolesMap: Record<string, Rol>) {
  const allOptions = await OpcionMenu.findAll();

  for (const opt of allOptions) {
    const isGestorUsuarios = opt.label.toUpperCase() === MENU_LABELS.GESTOR_USUARIOS;

    // SUPER_ADMIN and ADMIN get ALL menu options
    await PermisoRolMenu.findOrCreate({
      where: { roleId: rolesMap[ROLE_CODES.SUPER_ADMIN].id, menuOptionId: opt.id },
    });
    await PermisoRolMenu.findOrCreate({
      where: { roleId: rolesMap[ROLE_CODES.ADMIN].id, menuOptionId: opt.id },
    });

    // ADMISIONES, MEDICO and FACTURADOR get all EXCEPT Gestor Usuarios
    if (!isGestorUsuarios) {
      for (const code of [ROLE_CODES.ADMISIONES, ROLE_CODES.MEDICO, ROLE_CODES.FACTURADOR]) {
        await PermisoRolMenu.findOrCreate({
          where: { roleId: rolesMap[code].id, menuOptionId: opt.id },
        });
      }
    }
  }
  console.log(`✅ Matriz de permisos inicializada (SUPER_ADMIN/ADMIN total, ADMISIONES/MEDICO/FACTURADOR operativo).`);
}

async function deployInitialSuperAdmin(superAdminRoleId: number) {
  const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@clinisalud.com";
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "Admin2026!";
  const adminExists = await Usuario.findOne({ where: { email: adminEmail } });

  if (!adminExists) {
    const ccDocType = await TipoDocumento.findOne({ where: { code: "CC" } });
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    await Usuario.create({
      firstName: "Super",
      lastName: "Admin",
      documentTypeId: ccDocType ? ccDocType.id : 3,
      dni: "00000000",
      email: adminEmail,
      password: hashedPassword,
      roleId: superAdminRoleId,
      isActive: true,
    });
    console.log(`✅ Cuenta de Super Administrador desplegada: ${adminEmail}`);
  }
}

// ----------------------------------------------------------------
// FUNCIÓN PRINCIPAL DE EJECUCIÓN (Limpia y Lineal)
// ----------------------------------------------------------------
export const runSeeder = async () => {
  try {
    console.log("🚀 Iniciando Seed de Clinisalud 2026...");

    initAssociations();
    console.log("🔗 Asociaciones de modelos inicializadas correctamente.");

    console.log("🧹 Borrando datos existentes para reiniciar las tablas...");
    await resetDatabaseTables();
    console.log("🗑️ Base de datos completamente limpia y vacía.");

    console.log("👥 Inicializando roles base del sistema...");
    const rolesMap = await seedSystemRoles();

    await deployInitialSuperAdmin(rolesMap[ROLE_CODES.SUPER_ADMIN].id);

    console.log("📦 Iniciando procesamiento e inserción de archivos CSV...");
    const csvFolder = path.join(__dirname, "../../tablas_clinisalud");

    const loadingSequence = [
      { model: OpcionMenu, file: "opcion_menu.csv" },
      { model: TipoDocumento, file: "tipo_documento.csv" },
      { model: TipoGenero, file: "tipo_genero.csv" },
      { model: TipoEstado, file: "tipo_estado.csv" },
      { model: TipoUsuario, file: "tipo_usuario.csv" },
      { model: Cama, file: "cama.csv" },
      { model: Tarifario, file: "tarifario.csv" },
      { model: NivelAtencion, file: "nivel_atencion.csv" },
      { model: TipoAutorizacion, file: "tipo_autorizacion.csv" },
      { model: TipoParentesco, file: "parentesco.csv" },
      { model: TipoOrigen, file: "tipo_origen.csv" },
      { model: TipoTriage, file: "tipo_triage.csv" },
      { model: Especialidad, file: "especialidad.csv" },
      { model: Departamento, file: "departamento.csv" },
      { model: CentroCosto, file: "centro_costo.csv" },
      { model: Municipio, file: "municipio.csv" },
      { model: Diagnostico, file: "diagnostico.csv" },
      { model: TriagePrioridad, file: "triage_prioridad.csv" },
      { model: Convenio, file: "convenio.csv" },
      { model: Contrato, file: "contrato.csv" },
      { model: Cups, file: "cups.csv" },
      { model: Paciente, file: "paciente.csv" },
      { model: Triage, file: "triage.csv" },
      { model: Admision, file: "admision.csv" },
      { model: Acompanante, file: "acompanante.csv" },
      { model: Autorizacion, file: "autorizacion.csv" },
      { model: DiagnosticoPaciente, file: "diagnostico_paciente.csv" },
      { model: Articulado, file: "articulado.csv" },
      { model: TipoParagrafo, file: "tipo_paragrafo.csv" },
      { model: ParagrafoAplicacion, file: "paragrafo_aplicacion.csv" },
      { model: ParagrafoEdad, file: "paragrafo_edad.csv" },
      { model: ParagrafoInclusion, file: "paragrafo_inclusion.csv" },
      { model: ParagrafoValor, file: "paragrafo_valor.csv" },
      { model: TipoAcceso, file: "tipo_acceso.csv" },
      { model: ViaAcceso, file: "via_acceso.csv" }
    ];

    for (const step of loadingSequence) {
      await validateAndLoadCsv(step, csvFolder);
    }

    await assignAllRolePermissions(rolesMap);

    console.log("🎉 ¡Reset global, validación estructural e importación masiva exitosos!");
  } catch (error) {
    console.error("❌ Error en el Seed:", error);
  }
};

// Auto-ejecución cuando se llama directamente: npm run seed
if (require.main === module) {
  runSeeder();
}