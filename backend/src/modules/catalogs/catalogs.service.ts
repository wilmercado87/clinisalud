import { Model, ModelStatic, Order, Op } from "sequelize";
import TipoDocumento from "../../models/TipoDocumento";
import TipoGenero from "../../models/TipoGenero";
import TipoUsuario from "../../models/TipoUsuario";
import TipoEstado from "../../models/TipoEstado";
import TipoAutorizacion from "../../models/TipoAutorizacion";
import TipoParentesco from "../../models/TipoParentesco";
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
import { BedsPageResponse, CatalogItemResponse } from "./catalogs.types";

interface CatalogDef {
  model: ModelStatic<Model>;
  order: Order;
}

const STATIC_CATALOGS: Record<string, CatalogDef> = {
  "document-types": { model: TipoDocumento, order: [["description", "ASC"]] },
  "genders": { model: TipoGenero, order: [["description", "ASC"]] },
  "user-types": { model: TipoUsuario, order: [["name", "ASC"]] },
  "status-types": { model: TipoEstado, order: [["description", "ASC"]] },
  "authorization-types": { model: TipoAutorizacion, order: [["description", "ASC"]] },
  "parentescos": { model: TipoParentesco, order: [["description", "ASC"]] },
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
  async findByType(type: string): Promise<CatalogItemResponse[]> {
    const catalog = STATIC_CATALOGS[type];
    if (!catalog) {
      throw ApiError.notFound(`Catálogo no encontrado: ${type}`);
    }
    return (await catalog.model.findAll({ order: catalog.order })).map(
      (row) => row.toJSON() as CatalogItemResponse,
    );
  }

  async getMunicipalities(departmentId?: string): Promise<CatalogItemResponse[]> {
    const where = departmentId ? { dptoId: departmentId } : {};
    return (await Municipio.findAll({
      where,
      order: [["municipalityName", "ASC"]],
    })).map((row) => row.toJSON() as CatalogItemResponse);
  }

  async getContracts(epsId?: number): Promise<CatalogItemResponse[]> {
    const where = epsId ? { epsId } : {};
    return (await Contrato.findAll({
      where,
      order: [["contractNumber", "ASC"]],
    })).map((row) => row.toJSON() as CatalogItemResponse);
  }

  async getBeds(status?: number, page = 1, pageSize = 10): Promise<BedsPageResponse> {
    const where = status !== undefined ? { bedStatus: status } : {};
    const { count, rows } = await Cama.findAndCountAll({
      where,
      order: [["bedCode", "ASC"]],
      limit: pageSize,
      offset: (page - 1) * pageSize,
    });
    return {
      items: rows.map((row) => row.toJSON() as CatalogItemResponse),
      total: count,
    };
  }

  async searchDiagnostics(q: string, limit = 20): Promise<CatalogItemResponse[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }
    const term = `%${q.trim()}%`;
    return (await Diagnostico.findAll({
      where: {
        [Op.or]: [
          { code: { [Op.like]: term } },
          { description: { [Op.like]: term } },
        ],
      },
      limit,
      order: [["code", "ASC"]],
    })).map((row) => row.toJSON() as CatalogItemResponse);
  }

  async searchCups(q: string, limit = 20): Promise<CatalogItemResponse[]> {
    if (!q || q.trim().length === 0) {
      return [];
    }
    const term = `%${q.trim()}%`;
    return (await Cups.findAll({
      where: {
        [Op.or]: [
          { mapiissCode: { [Op.like]: term } },
          { mapiissDescription: { [Op.like]: term } },
        ],
      },
      limit,
      order: [["mapiissCode", "ASC"]],
    })).map((row) => row.toJSON() as CatalogItemResponse);
  }
}
