import { Op, literal } from "sequelize";
import TipoDocumento from "../../models/TipoDocumento";
import TipoGenero from "../../models/TipoGenero";
import TipoUsuario from "../../models/TipoUsuario";
import TipoEstado from "../../models/TipoEstado";
import TipoAutorizacion from "../../models/TipoAutorizacion";
import TipoOrigen from "../../models/TipoOrigen";
import TipoTriage from "../../models/TipoTriage";
import Especialidad from "../../models/Especialidad";
import NivelAtencion from "../../models/NivelAtencion";
import CentroCosto from "../../models/CentroCosto";
import Tarifario from "../../models/Tarifario";
import Convenio from "../../models/Convenio";
import Departamento from "../../models/Departamento";
import Municipio from "../../models/Municipio";
import Contrato from "../../models/Contrato";
import Cama from "../../models/Cama";
import Diagnostico from "../../models/Diagnostico";
import Cups from "../../models/Cups";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";

interface CatalogDef {
  model: any;
  order: any[];
}

const STATIC_CATALOGS: Record<string, CatalogDef> = {
  "document-types": { model: TipoDocumento, order: [["description", "ASC"]] },
  "genders": { model: TipoGenero, order: [["description", "ASC"]] },
  "user-types": { model: TipoUsuario, order: [["name", "ASC"]] },
  "status-types": { model: TipoEstado, order: [["description", "ASC"]] },
  "authorization-types": { model: TipoAutorizacion, order: [["description", "ASC"]] },
  "origin-types": { model: TipoOrigen, order: [["description", "ASC"]] },
  "triage-types": { model: TipoTriage, order: [["classification", "ASC"]] },
  "specialties": { model: Especialidad, order: [["description", "ASC"]] },
  "attention-levels": { model: NivelAtencion, order: [["complexity", "ASC"]] },
  "cost-centers": { model: CentroCosto, order: [["description", "ASC"]] },
  "fee-schedules": { model: Tarifario, order: [["name", "ASC"]] },
  "eps": { model: Convenio, order: [["epsName", "ASC"]] },
  "departments": { model: Departamento, order: [["department", "ASC"]] },
};

export class CatalogsService {
  async findByType(type: string): Promise<any[]> {
    const catalog = STATIC_CATALOGS[type];
    if (!catalog) {
      throw ApiError.notFound(`Catálogo no encontrado: ${type}`);
    }
    return await catalog.model.findAll({ order: catalog.order });
  }

  async getMunicipalities(departmentId?: string): Promise<any[]> {
    const where = departmentId ? { dptoId: departmentId } : {};
    return await Municipio.findAll({
      where,
      order: [["municipalityName", "ASC"]],
    });
  }

  async getContracts(epsId?: number): Promise<any[]> {
    const where = epsId ? { epsId } : {};
    return await Contrato.findAll({
      where,
      order: [["contractNumber", "ASC"]],
    });
  }

  async getBeds(status?: number): Promise<any[]> {
    const where = status !== undefined ? { bedStatus: status } : {};
    return await Cama.findAll({
      where,
      order: [["bedCode", "ASC"]],
    });
  }

  async searchDiagnostics(q: string, limit = 20): Promise<any[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }
    const term = `%${q.trim()}%`;
    return await Diagnostico.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: term } },
          { description: { [Op.like]: term } },
        ],
      },
      limit,
      order: [["code", "ASC"]],
    });
  }

  async searchCups(q: string, limit = 20): Promise<any[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }
    const term = `%${q.trim()}%`;
    return await Cups.findAll({
      where: {
        [Op.or]: [
          { mapiissCode: { [Op.like]: term } },
          { mapiissDescription: { [Op.like]: term } },
        ],
      },
      limit,
      order: [["mapiissCode", "ASC"]],
    });
  }
}
