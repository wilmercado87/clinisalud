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
// 2. FUNCIÓN CENTRAL DE ASOCIACIONES (Solo objetos Eager BelongsTo)
// ----------------------------------------------------------------
export function initAssociations() {
  // === [MÓDULO 0: ASOCIACIONES DE SEGURIDAD] ===
  User.belongsTo(Role, { foreignKey: "roleId", as: "roleData" });
  
  RoleMenuPermission.belongsTo(Role, { foreignKey: "roleId", as: "role" });
  RoleMenuPermission.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

  // 🛠️ ÚNICO AJUSTE ADICIONADO: Creamos el puente desde User hacia sus excepciones
  User.hasMany(UserMenuOverride, { foreignKey: "userId", as: "menuOverrides" });
  UserMenuOverride.belongsTo(User, { foreignKey: "userId", as: "user" });
  UserMenuOverride.belongsTo(MenuOption, { foreignKey: "menuOptionId", as: "menuOption" });

  MenuOption.belongsTo(MenuOption, { as: "parent", foreignKey: "parent_id" });


  // === [MÓDULO 1: RELACIONES DE ADMISIONES E INFRAESTRUCTURA] ===
  Admisiones.belongsTo(Camas, { foreignKey: "roomId", as: "room" });
  User.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentTypeData" });
  Admisiones.belongsTo(TipoDocumento, { foreignKey: "documentTypeId", as: "documentTypeData" });
  Admisiones.belongsTo(TipoUsuario, { foreignKey: "userTypeId", as: "userTypeData" });
  Admisiones.belongsTo(Convenios, { foreignKey: "idEps", as: "eps" });
  Admisiones.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });


  // === [MÓDULO 2: CONFIGURACIÓN COMERCIAL Y TARIFARIOS] ===
  Convenios.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  Contratos.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  CentroCosto.belongsTo(NivelAtencion, { foreignKey: "levelId", as: "level" });
  Cups.belongsTo(CentroCosto, { foreignKey: "costCenterId", as: "costCenter" });
  Cups.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  Cups.belongsTo(NivelAtencion, { foreignKey: "attentionLevelId", as: "attentionLevel" });


  // === [MÓDULO 3: AUTORIZACIONES TRANSACCIONALES] ===
  Autorizaciones.belongsTo(Admisiones, { foreignKey: "admissionNumber", as: "admission" });
  Autorizaciones.belongsTo(TipoAutorizacion, { foreignKey: "authTypeId", as: "authType" });
  Autorizaciones.belongsTo(Cups, { foreignKey: "cupsId", as: "cups" });
  Autorizaciones.belongsTo(User, { foreignKey: "systemUserId", as: "systemUser" });


  // === [MÓDULO 4: REGLAS DE AUDITORÍA Y PARÁGRAFOS MÉDICOS] ===
  // 📑 MÓDULO 5: REGLAS DE ASOCIACIÓN DE CUPS (Camino A)
  Articulados.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  TipoParagrafo.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoAplicacion.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoEdad.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoInclusion.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  ParagrafoValor.belongsTo(Cups, { foreignKey: "mapiissCode", as: "cups" });
  TiposAcceso.belongsTo(Tarifarios, { foreignKey: "feeScheduleId", as: "feeSchedule" });
  ViasAcceso.belongsTo(TiposAcceso, { foreignKey: "accessViaId", as: "accessVia" });


  // === [MÓDULO 5: HISTORIAL CLÍNICO, TRIAGE Y GEOGRAFÍA] ===
  Diagnostico.belongsTo(TipoOrigen, { foreignKey: "originTypeId", as: "originType" });
  DiagnosticoPaciente.belongsTo(Admisiones, { foreignKey: "admissionNumber", as: "admission" });
  DiagnosticoPaciente.belongsTo(Diagnostico, { foreignKey: "diagnosticId", as: "diagnostic" });
  ParagrafoAplicacion.belongsTo(Diagnostico, { foreignKey: "diagnosticCode", targetKey: "code", as: "diagnostic" });
  TriagePrioridad.belongsTo(TipoTriage, { foreignKey: "triageId", as: "triage" });
  Municipios.belongsTo(Departamentos, { foreignKey: "dptoId", as: "department" });
}