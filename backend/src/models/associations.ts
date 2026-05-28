import User from "./User";
import Role from "./Role";
import MenuOption from "./MenuOption";
import RoleMenuPermission from "./RoleMenuPermission";
import UserMenuOverride from "./UserMenuOverride";

import TipoDocumento from "./TipoDocumento";
import TipoUsuario from "./TipoUsuario";
import TipoGenero from "./TipoGenero";
import TipoEstado from "./TipoEstado";
import Camas from "./Camas";
import Convenios from "./Convenios";
import Contratos from "./Contratos";
import Paciente from "./Paciente";
import Admisiones from "./Admisiones";
import Triage from "./Triage";

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

export function initAssociations() {
  // === [MÓDULO 0: SEGURIDAD] ===
  User.belongsTo(Role, { foreignKey: "roleId", as: "roleData" });
  User.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentTypeData" });

  RoleMenuPermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  RoleMenuPermission.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

  User.hasMany(UserMenuOverride, { foreignKey: "userId", as: "menuOverrides" });
  UserMenuOverride.belongsTo(User, { foreignKey: "userId", as: "user" });
  UserMenuOverride.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

  MenuOption.belongsTo(MenuOption, { as: "parent", foreignKey: "parent_id" });

  // === [MÓDULO 1: PACIENTE] ===
  Paciente.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentType" });
  Paciente.belongsTo(TipoUsuario, { foreignKey: "userTypeId", as: "userType" });
  Paciente.belongsTo(TipoGenero, { foreignKey: "genderId", as: "gender" });
  Paciente.belongsTo(TipoEstado, { foreignKey: "statusId", as: "status" });
  Paciente.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 2: ADMISIONES E INFRAESTRUCTURA] ===
  Admisiones.belongsTo(Paciente, { foreignKey: "documentPatient", targetKey: "document", as: "patient" });
  Admisiones.belongsTo(Camas, { foreignKey: "roomId", as: "room" });
  Admisiones.belongsTo(Convenios, { foreignKey: "epsCode", targetKey: "epsCode", as: "eps" });
  Admisiones.belongsTo(TipoEstado, { foreignKey: "statusId", as: "admissionStatus" });
  Admisiones.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 3: TRIAGE] ===
  Triage.belongsTo(TipoTriage, { foreignKey: "priorityTypeId", as: "priorityType" });
  Triage.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentType" });
  Triage.belongsTo(Convenios, { foreignKey: "epsCode", targetKey: "epsCode", as: "eps" });
  Triage.belongsTo(Diagnostico, { foreignKey: "diagnosticCode", targetKey: "code", as: "diagnostic" });
  Triage.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 4: CONFIGURACIÓN COMERCIAL Y TARIFARIOS] ===
  Convenios.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  Contratos.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  CentroCosto.belongsTo(NivelAtencion, { foreignKey: "levelId", as: "level" });
  CentroCosto.belongsTo(Especialidades, { foreignKey: "specialtyId", as: "especialidad" });
  Cups.belongsTo(CentroCosto, { foreignKey: "costCenterId", as: "costCenter" });
  Cups.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  Cups.belongsTo(NivelAtencion, { foreignKey: "attentionLevelId", as: "attentionLevel" });

  // === [MÓDULO 5: AUTORIZACIONES] ===
  Autorizaciones.belongsTo(Admisiones, { foreignKey: "admissionNumber", as: "admission" });
  Autorizaciones.belongsTo(TipoAutorizacion, { foreignKey: "authTypeId", as: "authType" });
  Autorizaciones.belongsTo(Cups, { foreignKey: "cupsId", as: "cups" });
  Autorizaciones.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 6: REGLAS DE AUDITORÍA Y PARÁGRAFOS] ===
  Articulados.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  Articulados.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  TipoParagrafo.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  TipoParagrafo.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoAplicacion.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoAplicacion.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoEdad.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoEdad.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoInclusion.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoInclusion.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoValor.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoValor.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  TiposAcceso.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ViasAcceso.belongsTo(TiposAcceso, { foreignKey: "accessViaId", as: "accessVia" });

  // === [MÓDULO 7: HISTORIAL CLÍNICO, TRIAGE Y GEOGRAFÍA] ===
  Diagnostico.belongsTo(TipoOrigen, { foreignKey: "originTypeId", as: "originType" });
  DiagnosticoPaciente.belongsTo(Admisiones, { foreignKey: "admissionNumber", as: "admission" });
  DiagnosticoPaciente.belongsTo(Diagnostico, { foreignKey: "diagnosticId", as: "diagnostic" });
  ParagrafoAplicacion.belongsTo(Diagnostico, { foreignKey: "diagnosticCode", targetKey: "code", as: "diagnostic" });
  TriagePrioridad.belongsTo(TipoTriage, { foreignKey: "triageId", as: "triage" });
  Municipios.belongsTo(Departamentos, { foreignKey: "dptoId", as: "department" });
}
