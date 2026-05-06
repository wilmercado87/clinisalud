import { Op } from "sequelize";
import Diagnostico from "../models/Diagnostico";
import Cups from "../models/Cups";
import Triage from "../models/Triage";
import Prioridad from "../models/Prioridad";

/**
 * MedicalCatalogService - Catálogo de datos médicos
 * Maneja: diagnósticos, procedimientos (CUPS), triage, prioridades
 */
export class MedicalCatalogService {
  /**
   * Busca diagnósticos por término (código o descripción)
   */
  searchDiagnoses(term: string, limit = 20) {
    return Diagnostico.findAll({
      where: {
        [Op.or]: [
          { codigoDiagnostico: { [Op.iLike]: `%${term}%` } },
          { descripcion: { [Op.iLike]: `%${term}%` } },
        ],
      },
      limit,
      order: [["codigoDiagnostico", "ASC"]],
    });
  }

  /**
   * Busca diagnóstico por código
   */
  findDiagnosisByCode(codigoDiagnostico: string) {
    return Diagnostico.findOne({ where: { codigoDiagnostico } });
  }

  /**
   * Obtiene todos los diagnósticos con paginación
   */
  getAllDiagnoses(limit = 100, offset = 0) {
    return Diagnostico.findAll({ limit, offset, order: [["codigoDiagnostico", "ASC"]] });
  }

  /**
   * Busca procedimientos CUPS por término
   */
  searchProcedures(term: string, limit = 20) {
    return Cups.findAll({
      where: {
        [Op.or]: [
          { pkCodigoMapiiss: { [Op.iLike]: `%${term}%` } },
          { descripcionMapiiss: { [Op.iLike]: `%${term}%` } },
        ],
      },
      limit,
      order: [["pkCodigoMapiiss", "ASC"]],
    });
  }

  /**
   * Busca procedimiento por código
   */
  findProcedureByCode(pkCodigoMapiiss: string) {
    return Cups.findByPk(pkCodigoMapiiss);
  }

  /**
   * Obtiene todos los procedimientos con paginación
   */
  getAllProcedures(limit = 100, offset = 0) {
    return Cups.findAll({ limit, offset, order: [["pkCodigoMapiiss", "ASC"]] });
  }

  /**
   * Obtiene todos los niveles de triage
   */
  getAllTriageLevels() {
    return Triage.findAll({ order: [["id", "ASC"]] });
  }

  /**
   * Busca triage por ID
   */
  findTriageById(id: number) {
    return Triage.findByPk(id);
  }

  /**
   * Busca triage por tipo
   */
  findTriageByType(tipoTriage: string) {
    return Triage.findOne({ where: { tipoTriage } });
  }

  /**
   * Busca triage por clasificación
   */
  findTriageByClassification(clasificacion: string) {
    return Triage.findOne({ where: { clasificacion: { [Op.iLike]: `%${clasificacion}%` } } });
  }

  /**
   * Obtiene triage por prioridad
   */
  getTriageByPriority(priorityLevel: number) {
    return Triage.findByPk(priorityLevel);
  }

  /**
   * Obtiene triage urgente (tipo I)
   */
  getUrgentTriage() {
    return Triage.findOne({ where: { tipoTriage: "I" } });
  }

  /**
   * Obtiene tiempo de espera para tipo de triage
   */
  async getEmergencyWaitTime(tipoTriage: string): Promise<string | null> {
    const triage = await this.findTriageByType(tipoTriage);
    return triage?.tiempoEspera || null;
  }

  /**
   * Obtiene todas las prioridades
   */
  getAllPriorities() {
    return Prioridad.findAll({ order: [["prioridad", "ASC"]] });
  }

  /**
   * Busca prioridad por ID
   */
  findPriorityById(id: number) {
    return Prioridad.findByPk(id);
  }

  /**
   * Busca prioridad por número
   */
  findPriorityByNumber(prioridad: number) {
    return Prioridad.findAll({ where: { prioridad } });
  }

  /**
   * Busca prioridad por edad y sexo
   */
  findPriorityByAgeAndSex(age: number, sexo: string) {
    return Prioridad.findOne({
      where: {
        rangoDesde: { [Op.lte]: age },
        rangoHasta: { [Op.gte]: age },
        sexo,
      },
    });
  }
}

export default new MedicalCatalogService();