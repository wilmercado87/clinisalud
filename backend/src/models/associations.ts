// ----------------------------------------------------------------
// 1. IMPORTACIÓN DE TODOS LOS MODELOS (33)
// ----------------------------------------------------------------
import User from "./User";
import Role from "./Role";
import MenuOption from "./MenuOption";
import RoleMenuPermission from "./RoleMenuPermission";
import UserMenuOverride from "./UserMenuOverride";

import TipoDocumento from "./TipoDocumento";
import TipoUsuario from "./TipoUsuario";
import Camas from "./Camas";
import Convenios from "./Convenios";
import Contratos from "./Contratos";
import Admisiones from "./Admisiones";

import Tarifarios from "./Tarifarios";
import NivelAtencion from "./NivelAtencion";
import CentroCosto from "./CentroCosto";
import Cups from "./Cups";
import TipoAutorizacion from "./TipoAutorizacion";
import Autorizaciones from "./Autorizaciones";

import Articulados from "./Articulados";
import TipoParagrafo from "./TipoParagrafo";
import ParagrafoAplicacion from "./ParagrafoAplicacion";
import ParagrafoEdad from "./ParagrafoEdad";
import ParagrafoInclusion from "./ParagrafoInclusion";
import ParagrafoValor from "./ParagrafoValor";
import TiposAcceso from "./TiposAcceso";
import ViasAcceso from "./ViasAcceso";

import TipoOrigen from "./TipoOrigen";
import Diagnostico from "./Diagnostico";
import DiagnosticoPaciente from "./DiagnosticoPaciente";
import TipoTriage from "./TipoTriage";
import TriagePrioridad from "./TriagePrioridad";
import Especialidades from "./Especialidades";
import Departamentos from "./Departamentos";
import Municipios from "./Municipios";

// ----------------------------------------------------------------
// 2. FUNCIÓN CENTRAL DE ASOCIACIONES (Evita retrasos de compilación)
// ----------------------------------------------------------------
export function initAssociations() {
  // === [MÓDULO 0: ASOCIACIONES DE SEGURIDAD] ===
  User.belongsTo(Role, { foreignKey: "roleId", as: "roleData" });
  Role.hasMany(User, { foreignKey: "roleId", as: "users" });

  User.hasMany(UserMenuOverride, { foreignKey: "userId", as: "menuOverrides" });

  Role.hasMany(RoleMenuPermission, { foreignKey: "roleId", as: "menuPermissions" });
  RoleMenuPermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  RoleMenuPermission.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

  MenuOption.hasMany(RoleMenuPermission, { foreignKey: "menuOptionId", as: "rolePermissions" });

  UserMenuOverride.belongsTo(User, { foreignKey: "userId", as: "user" });
  UserMenuOverride.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

  MenuOption.hasMany(MenuOption, { as: "children", foreignKey: "parent_id" });
  MenuOption.belongsTo(MenuOption, { as: "parent", foreignKey: "parent_id" });


  // === [MÓDULO 1: RELACIONES DE ADMISIONES E INFRAESTRUCTURA] ===
  // Camas tiene PK compuesta (roomId, bedCode)
  Camas.hasMany(Admisiones, { foreignKey: "roomId", as: "admisiones" });
  Admisiones.belongsTo(Camas, { foreignKey: "roomId", as: "room" });

  TipoDocumento.hasMany(User, { foreignKey: "documentTypeId", as: "users" });
  User.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentTypeData" });

  TipoDocumento.hasMany(Admisiones, { foreignKey: "documentTypeId", as: "admisiones" });
  Admisiones.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentTypeData" });

  TipoUsuario.hasMany(Admisiones, { foreignKey: "userTypeId", as: "admisiones" });
  Admisiones.belongsTo(TipoUsuario, { foreignKey: "userTypeId", as: "userTypeData" });

  Convenios.hasMany(Admisiones, { foreignKey: "epsCode", as: "admisiones" });
  Admisiones.belongsTo(Convenios, { foreignKey: "epsCode", as: "eps" });

  User.hasMany(Admisiones, { foreignKey: "systemUserId", as: "admisionesCreadas" });
  Admisiones.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });


  // === [MÓDULO 2: CONFIGURACIÓN COMERCIAL Y TARIFARIOS] ===
  Tarifarios.hasMany(Convenios, { foreignKey: "feeScheduleId", as: "convenios" });
  Convenios.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });

  Tarifarios.hasMany(Contratos, { foreignKey: "feeScheduleId", as: "contratos" });
  Contratos.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });

  NivelAtencion.hasMany(CentroCosto, { foreignKey: "levelId", as: "centrosCosto" });
  CentroCosto.belongsTo(NivelAtencion, { foreignKey: "levelId", as: "level" });

  CentroCosto.hasMany(Cups, { foreignKey: "costCenterId", as: "procedimientosCups" });
  Cups.belongsTo(CentroCosto, { foreignKey: "costCenterId", as: "costCenter" });

  Tarifarios.hasMany(Cups, { foreignKey: "feeScheduleId", as: "procedimientosCups" });
  Cups.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });

  NivelAtencion.hasMany(Cups, { foreignKey: "attentionLevelId", as: "procedimientosCups" });
  Cups.belongsTo(NivelAtencion, { foreignKey: "attentionLevelId", as: "attentionLevel" });


  // === [MÓDULO 3: AUTORIZACIONES TRANSACCIONALES] ===
  Admisiones.hasMany(Autorizaciones, { foreignKey: "admissionNumber", as: "autorizaciones" });
  Autorizaciones.belongsTo(Admisiones, { foreignKey: "admissionNumber", as: "admission" });

  TipoAutorizacion.hasMany(Autorizaciones, { foreignKey: "authTypeId", as: "autorizaciones" });
  Autorizaciones.belongsTo(TipoAutorizacion, { foreignKey: "authTypeId", as: "authType" });

  Cups.hasMany(Autorizaciones, { foreignKey: "mapiissCode", as: "autorizaciones" });
  Autorizaciones.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });

  User.hasMany(Autorizaciones, { foreignKey: "systemUserId", as: "autorizacionesEmitidas" });
  Autorizaciones.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });


  // === [MÓDULO 4: REGLAS DE AUDITORÍA Y PARÁGRAFOS MÉDICOS] ===
  Cups.hasMany(Articulados, { foreignKey: "cupsCode", as: "articulados" });
  Articulados.belongsTo(Cups, { foreignKey: "cupsCode", as: "cups" });

  Cups.hasMany(TipoParagrafo, { foreignKey: "mapiissCode", as: "paragrafosTipo" });
  TipoParagrafo.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });

  Cups.hasMany(ParagrafoAplicacion, { foreignKey: "mapiissCode", as: "paragrafosAplicacion" });
  ParagrafoAplicacion.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });

  Cups.hasMany(ParagrafoEdad, { foreignKey: "mapiissCode", as: "paragrafosEdad" });
  ParagrafoEdad.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });

  Cups.hasMany(ParagrafoInclusion, { foreignKey: "mapiissCode", as: "paragrafosInclusion" });
  ParagrafoInclusion.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });

  Cups.hasMany(ParagrafoValor, { foreignKey: "mapiissCode", as: "paragrafosValor" });
  ParagrafoValor.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });

  Tarifarios.hasMany(Articulados, { foreignKey: "feeScheduleId" });
  Tarifarios.hasMany(TipoParagrafo, { foreignKey: "feeScheduleId" });
  Tarifarios.hasMany(ParagrafoAplicacion, { foreignKey: "feeScheduleId" });
  Tarifarios.hasMany(ParagrafoEdad, { foreignKey: "feeScheduleId" });
  Tarifarios.hasMany(ParagrafoInclusion, { foreignKey: "feeScheduleId" });
  Tarifarios.hasMany(ParagrafoValor, { foreignKey: "feeScheduleId" });
  Tarifarios.hasMany(TiposAcceso, { foreignKey: "feeScheduleId", as: "viasAccesoConfig" });
  TiposAcceso.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });

  TiposAcceso.hasMany(ViasAcceso, { foreignKey: "accessViaId", as: "viasDetalle" });
  ViasAcceso.belongsTo(TiposAcceso, { foreignKey: "accessViaId", as: "accessVia" });


  // === [MÓDULO 5: HISTORIAL CLÍNICO, TRIAGE Y GEOGRAFÍA] ===
  TipoOrigen.hasMany(Diagnostico, { foreignKey: "originTypeId", as: "diagnosticos" });
  Diagnostico.belongsTo(TipoOrigen, { foreignKey: "originTypeId", as: "originType" });

  Admisiones.hasMany(DiagnosticoPaciente, { foreignKey: "admissionNumber", as: "diagnosticosEnlace" });
  DiagnosticoPaciente.belongsTo(Admisiones, { foreignKey: "admissionNumber", as: "admission" });

  Diagnostico.hasMany(DiagnosticoPaciente, { foreignKey: "diagnosticId", as: "pacientesEnlace" });
  DiagnosticoPaciente.belongsTo(Diagnostico, { foreignKey: "diagnosticId", as: "diagnostic" });

  Diagnostico.hasMany(ParagrafoAplicacion, { foreignKey: "diagnosticCode", sourceKey: "code" });
  ParagrafoAplicacion.belongsTo(Diagnostico, { foreignKey: "diagnosticCode", targetKey: "code", as: "diagnostic" });

  TipoTriage.hasMany(TriagePrioridad, { foreignKey: "triageId", as: "prioridadesEdad" });
  TriagePrioridad.belongsTo(TipoTriage, { foreignKey: "triageId", as: "triage" });

  Departamentos.hasMany(Municipios, { foreignKey: "dptoId", as: "municipios" });
  Municipios.belongsTo(Departamentos, { foreignKey: "dptoId", as: "department" });
}

// Re-exportamos para mantener intactas tus otras importaciones
export {
  User, Role, MenuOption, RoleMenuPermission, UserMenuOverride,
  TipoDocumento, TipoUsuario, Camas, Convenios, Contratos, Admisiones,
  Tarifarios, NivelAtencion, CentroCosto, Cups, TipoAutorizacion, Autorizaciones,
  Articulados, TipoParagrafo, ParagrafoAplicacion, ParagrafoEdad, ParagrafoInclusion, ParagrafoValor, TiposAcceso, ViasAcceso,
  TipoOrigen, Diagnostico, DiagnosticoPaciente, TipoTriage, TriagePrioridad, Especialidades, Departamentos, Municipios
};