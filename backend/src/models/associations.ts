import Usuario from "./Usuario";
import Rol from "./Rol";
import OpcionMenu from "./OpcionMenu";
import PermisoRolMenu from "./PermisoRolMenu";
import SobreescrituraMenuUsuario from "./SobreescrituraMenuUsuario";
import Notificacion from "./Notificacion";
import DestinatarioNotificacion from "./DestinatarioNotificacion";

import TipoDocumento from "./TipoDocumento";
import TipoUsuario from "./TipoUsuario";
import TipoGenero from "./TipoGenero";
import TipoEstado from "./TipoEstado";
import Cama from "./Cama";
import Convenio from "./Convenio";
import Contrato from "./Contrato";
import Paciente from "./Paciente";
import Admision from "./Admision";
import Triage from "./Triage";

import Tarifario from "./Tarifario";
import NivelAtencion from "./NivelAtencion";
import CentroCosto from "./CentroCosto";
import Cups from "./Cups";
import TipoAutorizacion from "./TipoAutorizacion";
import Autorizacion from "./Autorizacion";
import TipoParentesco from "./TipoParentesco";
import Acompanante from "./Acompanante";

import Articulado from "./Articulado";
import TipoParagrafo from "./TipoParagrafo";
import ParagrafoAplicacion from "./ParagrafoAplicacion";
import ParagrafoEdad from "./ParagrafoEdad";
import ParagrafoInclusion from "./ParagrafoInclusion";
import ParagrafoValor from "./ParagrafoValor";
import TipoAcceso from "./TipoAcceso";
import ViaAcceso from "./ViaAcceso";

import TipoOrigen from "./TipoOrigen";
import Diagnostico from "./Diagnostico";
import DiagnosticoPaciente from "./DiagnosticoPaciente";
import TipoTriage from "./TipoTriage";
import TriagePrioridad from "./TriagePrioridad";
import Especialidad from "./Especialidad";
import Departamento from "./Departamento";
import Municipio from "./Municipio";

export function initAssociations() {
  // === [MÓDULO 0: SEGURIDAD] ===
  Usuario.belongsTo(Rol, { foreignKey: "roleId", as: "roleData" });
  Usuario.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentTypeData" });

  PermisoRolMenu.belongsTo(Rol, { foreignKey: "roleId", as: "role" });
  PermisoRolMenu.belongsTo(OpcionMenu, { foreignKey: "menuOptionId", as: "menuOption" });

  Usuario.hasMany(SobreescrituraMenuUsuario, { foreignKey: "userId", as: "menuOverrides" });
  SobreescrituraMenuUsuario.belongsTo(Usuario, { foreignKey: "userId", as: "user" });
  SobreescrituraMenuUsuario.belongsTo(OpcionMenu, { foreignKey: "menuOptionId", as: "menuOption" });

  OpcionMenu.belongsTo(OpcionMenu, { as: "parent", foreignKey: "parentId" });
  OpcionMenu.hasMany(OpcionMenu, { as: "children", foreignKey: "parentId" });

  // === [MÓDULO 1: PACIENTE] ===
  Paciente.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentType" });
  Paciente.belongsTo(TipoUsuario, { foreignKey: "userTypeId", as: "userType" });
  Paciente.belongsTo(TipoGenero, { foreignKey: "genderId", as: "gender" });
  Paciente.belongsTo(TipoEstado, { foreignKey: "statusId", as: "status" });
  Paciente.belongsTo(Usuario, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 2: ADMISIONES E INFRAESTRUCTURA] ===
  Admision.belongsTo(Paciente, { foreignKey: "patientId", as: "patient" });
  Admision.belongsTo(Cama, { foreignKey: "roomId", as: "room" });
  Admision.belongsTo(Convenio, { foreignKey: "epsId", as: "eps" });
  Admision.belongsTo(TipoEstado, { foreignKey: "statusId", as: "admissionStatus" });
  Admision.belongsTo(Usuario, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 3: TRIAGE] ===
  Triage.belongsTo(TipoTriage, { foreignKey: "priorityTypeId", as: "priorityType" });
  Triage.belongsTo(Paciente, { foreignKey: "pacienteId", as: "paciente" });
  Triage.belongsTo(Convenio, { foreignKey: "epsId", as: "eps" });
  Triage.belongsTo(Diagnostico, { foreignKey: "diagnosticId", as: "diagnostic" });
  Triage.belongsTo(Usuario, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 4: CONFIGURACIÓN COMERCIAL Y TARIFARIOS] ===
  Contrato.belongsTo(Convenio, { foreignKey: "epsId", as: "eps" });
  Convenio.hasMany(Contrato, { foreignKey: "epsId", as: "contracts" });
  Contrato.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  CentroCosto.belongsTo(NivelAtencion, { foreignKey: "levelId", as: "level" });
  CentroCosto.belongsTo(Especialidad, { foreignKey: "specialtyId", as: "especialidad" });
  Cups.belongsTo(CentroCosto, { foreignKey: "costCenterId", as: "costCenter" });
  Cups.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  Cups.belongsTo(NivelAtencion, { foreignKey: "attentionLevelId", as: "attentionLevel" });

  // === [MÓDULO 5: AUTORIZACIONES] ===
  Autorizacion.belongsTo(Admision, { foreignKey: "admissionNumber", as: "admission" });
  Autorizacion.belongsTo(TipoAutorizacion, { foreignKey: "authTypeId", as: "authType" });
  Autorizacion.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  Autorizacion.belongsTo(Usuario, { foreignKey: "systemUserId", as: "systemUser" });

  // === [MÓDULO 2B: ACOMPAÑANTE] ===
  Admision.hasOne(Acompanante, { foreignKey: "admissionNumber", as: "companion" });
  Acompanante.belongsTo(Admision, { foreignKey: "admissionNumber", as: "admission" });
  Acompanante.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentType" });
  Acompanante.belongsTo(TipoParentesco, { foreignKey: "relationshipId", as: "relationship" });

  // === [MÓDULO 6: REGLAS DE AUDITORÍA Y PARÁGRAFOS] ===
  Articulado.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  Articulado.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  TipoParagrafo.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  TipoParagrafo.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoAplicacion.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  ParagrafoAplicacion.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoEdad.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  ParagrafoEdad.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoInclusion.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  ParagrafoInclusion.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ParagrafoValor.belongsTo(Cups, { foreignKey: "mapiissCode", targetKey: "mapiissCode", as: "cups" });
  ParagrafoValor.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  TipoAcceso.belongsTo(Tarifario, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ViaAcceso.belongsTo(TipoAcceso, { foreignKey: "accessViaId", as: "accessVia" });

  // === [MÓDULO 7: HISTORIAL CLÍNICO, TRIAGE Y GEOGRAFÍA] ===
  Diagnostico.belongsTo(TipoOrigen, { foreignKey: "originTypeId", as: "originType" });
  DiagnosticoPaciente.belongsTo(Admision, { foreignKey: "admissionNumber", as: "admission" });
  DiagnosticoPaciente.belongsTo(Diagnostico, { foreignKey: "diagnosticId", as: "diagnostic" });
  ParagrafoAplicacion.belongsTo(Diagnostico, { foreignKey: "diagnosticId", as: "diagnostic" });
  TriagePrioridad.belongsTo(TipoTriage, { foreignKey: "triageId", as: "triage" });
  Municipio.belongsTo(Departamento, { foreignKey: "dptoId", as: "department" });

  // === [MÓDULO 8: NOTIFICACIONES] ===
  DestinatarioNotificacion.belongsTo(Notificacion, { foreignKey: "notificationId", as: "notification" });
  Notificacion.hasMany(DestinatarioNotificacion, { foreignKey: "notificationId", as: "recipients" });
  DestinatarioNotificacion.belongsTo(Usuario, { foreignKey: "userId", as: "user" });
}
