import * as bcrypt from "bcryptjs";
import path from "node:path";
import sequelize from "./config/database";
import Role from "./models/Role";
import MenuOption from "./models/MenuOption";
import User from "./models/User";
import RoleMenuPermission from "./models/RoleMenuPermission";
import TipoDocumento from "./models/TipoDocumento";
import UserMenuOverride from "./models/UserMenuOverride";
import Notification from "./models/Notification";
import NotificationRecipient from "./models/NotificationRecipient";
import { initAssociations } from "./models/associations";

// Helpers de automatización
import { parseCSV } from "./utils/bd/csvReader";
import { autoMapCsvRow } from "./utils/bd/autoMapper";

// Importación de la arquitectura de modelos
import TipoUsuario from "./models/TipoUsuario";
import TipoGenero from "./models/TipoGenero";
import TipoEstado from "./models/TipoEstado";
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
import Paciente from "./models/Paciente";
import Triage from "./models/Triage";
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

// ----------------------------------------------------------------
// FUNCIONES AUXILIARES (Solución S3776: Reduce Complejidad Cognitiva)
// ----------------------------------------------------------------

async function resetDatabaseTables() {
  await sequelize.query("PRAGMA foreign_keys = OFF;");
  
  const allModels: any[] = [
    RoleMenuPermission, UserMenuOverride, User, Role, MenuOption, TipoDocumento,
    Notification, NotificationRecipient, 
    TipoUsuario, TipoGenero, TipoEstado, Camas, Tarifarios, NivelAtencion,
    TipoAutorizacion, TipoOrigen, TipoTriage, Especialidades, Departamentos,
    CentroCosto, Municipios, Diagnostico, TriagePrioridad, Convenios, Contratos,
    Cups, Paciente, Triage, Admisiones, Autorizaciones, DiagnosticoPaciente,
    Articulados, TipoParagrafo, ParagrafoAplicacion, ParagrafoEdad,
    ParagrafoInclusion, ParagrafoValor, TiposAcceso, ViasAcceso
  ];

  for (const model of allModels) {
    await model.truncate({ force: true });
  }

  await sequelize.query("PRAGMA foreign_keys = ON;");
}

async function seedSystemRoles() {
  const rolesData = [
    { code: "SUPER_ADMIN", name: "Super Administrador" },
    { code: "ADMIN", name: "Administrador Sistema" },
    { code: "MEDICO", name: "Personal Médico" },
    { code: "FACTURADOR", name: "Personal de Facturación" }
  ];

  const initializedRoles: Record<string, Role> = {};

  for (const item of rolesData) {
    const [roleInstance] = await Role.findOrCreate({
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

async function assignAllRolePermissions(rolesMap: Record<string, Role>) {
  const allOptions = await MenuOption.findAll();

  for (const opt of allOptions) {
    const isGestorUsuarios = opt.label.toUpperCase() === 'GESTOR USUARIOS';

    // SUPER_ADMIN and ADMIN get ALL menu options
    await RoleMenuPermission.findOrCreate({
      where: { roleId: rolesMap["SUPER_ADMIN"].id, menuOptionId: opt.id },
    });
    await RoleMenuPermission.findOrCreate({
      where: { roleId: rolesMap["ADMIN"].id, menuOptionId: opt.id },
    });

    // MEDICO and FACTURADOR get all EXCEPT Gestor Usuarios
    if (!isGestorUsuarios) {
      await RoleMenuPermission.findOrCreate({
        where: { roleId: rolesMap["MEDICO"].id, menuOptionId: opt.id },
      });
      await RoleMenuPermission.findOrCreate({
        where: { roleId: rolesMap["FACTURADOR"].id, menuOptionId: opt.id },
      });
    }
  }
  console.log(`✅ Matriz de permisos inicializada (SUPER_ADMIN/ADMIN total, MEDICO/FACTURADOR operativo).`);
}

async function deployInitialSuperAdmin(superAdminRoleId: number) {
  const adminEmail = "admin@clinisalud.com";
  const adminExists = await User.findOne({ where: { email: adminEmail } });

  if (!adminExists) {
    const ccDocType = await TipoDocumento.findOne({ where: { code: "CC" } });
    const hashedPassword = await bcrypt.hash("Admin2026!", 10);

    await User.create({
      firstName: "Super",
      lastName: "Admin",
      documentTypeId: ccDocType ? ccDocType.id : 3,
      dni: "00000000",
      email: adminEmail,
      password: hashedPassword,
      roleId: superAdminRoleId,
      isActive: true,
    });
    console.log(`✅ Cuenta de Super Administrador desplegada: ${adminEmail} / Admin2026!`);
  }
}

// ----------------------------------------------------------------
// SEMILLA DE NOTIFICACIONES DE SIMULACIÓN
// ----------------------------------------------------------------

async function seedSampleNotifications() {
  const adminUser = await User.findOne({ where: { email: 'admin@clinisalud.com' } });
  if (!adminUser) {
    console.log("⚠️ No se encontró admin, se saltan notificaciones de simulación.");
    return;
  }

  const now = new Date();

  const notif1 = await Notification.create({
    type: "ADMISSION_CREATED",
    title: "Nueva admisión registrada",
    message:
      "Dr. Carlos Mendoza (Médico) admitió al paciente Juan Pérez (CC 12345678) en Urgencias con diagnóstico de dolor abdominal agudo.",
    actorId: 9998,
    actorName: "Dr. Carlos Mendoza",
    actorRole: "MEDICO",
    actionUrl: null,
    actionLabel: null,
    createdAt: new Date(now.getTime() - 5 * 60000),
  });

  const notif2 = await Notification.create({
    type: "BILLING_COMPLETED",
    title: "Facturación completada",
    message:
      "María López (Facturador) facturó la admisión #1245 del paciente Pedro Gómez por un total de $850,000 COP.",
    actorId: 9997,
    actorName: "María López",
    actorRole: "FACTURADOR",
    actionUrl: null,
    actionLabel: null,
    createdAt: new Date(now.getTime() - 15 * 60000),
  });

  const notif3 = await Notification.create({
    type: "DIAGNOSIS_UPDATED",
    title: "Diagnóstico actualizado",
    message:
      "Dra. Ana Martínez (Médico) actualizó el diagnóstico del paciente Luis Ramírez (CC 98765432) en la admisión #1240.",
    actorId: 9996,
    actorName: "Dra. Ana Martínez",
    actorRole: "MEDICO",
    actionUrl: null,
    actionLabel: null,
    createdAt: new Date(now.getTime() - 60 * 60000),
  });

  const notif4 = await Notification.create({
    type: "BILLING_CANCELLED",
    title: "Factura anulada",
    message:
      "María López (Facturador) anuló la factura #F-2024-089 del paciente Carlos Ruiz por error en convenio.",
    actorId: 9997,
    actorName: "María López",
    actorRole: "FACTURADOR",
    actionUrl: null,
    actionLabel: null,
    createdAt: new Date(now.getTime() - 120 * 60000),
  });

  const notif5 = await Notification.create({
    type: "AUTHORIZATION_REQUESTED",
    title: "Autorización solicitada",
    message:
      "Dr. Carlos Mendoza (Médico) solicitó autorización para procedimiento de Cirugía General en paciente María Torres.",
    actorId: 9998,
    actorName: "Dr. Carlos Mendoza",
    actorRole: "MEDICO",
    actionUrl: null,
    actionLabel: null,
    createdAt: new Date(now.getTime() - 180 * 60000),
  });

  await NotificationRecipient.bulkCreate([
    { notificationId: notif1.id, userId: adminUser.id, isRead: false },
    { notificationId: notif2.id, userId: adminUser.id, isRead: false },
    { notificationId: notif3.id, userId: adminUser.id, isRead: true, readAt: new Date(now.getTime() - 30 * 60000) },
    { notificationId: notif4.id, userId: adminUser.id, isRead: true, readAt: new Date(now.getTime() - 90 * 60000) },
    { notificationId: notif5.id, userId: adminUser.id, isRead: false },
  ]);

  console.log(`✅ ${5} notificaciones de simulación insertadas (${3} sin leer, ${2} leídas).`);
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

    console.log("📦 Iniciando procesamiento e inserción de archivos CSV...");
    const csvFolder = path.join(__dirname, "../../tablas_clinisalud");

    const loadingSequence = [
      { model: MenuOption, file: "menu_option.csv" },
      { model: TipoDocumento, file: "tipo_documento.csv" },
      { model: TipoGenero, file: "tipo_genero.csv" },
      { model: TipoEstado, file: "tipo_estado.csv" },
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
      { model: Paciente, file: "paciente.csv" },
      { model: Triage, file: "triage.csv" },
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
      await validateAndLoadCsv(step, csvFolder);
    }

    await assignAllRolePermissions(rolesMap);
    await deployInitialSuperAdmin(rolesMap["SUPER_ADMIN"].id);

    console.log("🔔 Sembrando notificaciones de simulación...");
    await seedSampleNotifications();

    console.log("🎉 ¡Reset global, validación estructural e importación masiva exitosos!");
  } catch (error) {
    console.error("❌ Error en el Seed:", error);
  }
};