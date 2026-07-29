import TipoDocumento from "../../models/TipoDocumento";
import TipoGenero from "../../models/TipoGenero";
import TipoUsuario from "../../models/TipoUsuario";
import TipoEstado from "../../models/TipoEstado";
import Convenio from "../../models/Convenio";
import Departamento from "../../models/Departamento";
import Municipio from "../../models/Municipio";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";

const CATALOG_MAP: Record<string, { model: any; order: any[] }> = {
  "document-types": { model: TipoDocumento, order: [["description", "ASC"]] },
  "genders": { model: TipoGenero, order: [["description", "ASC"]] },
  "user-types": { model: TipoUsuario, order: [["name", "ASC"]] },
  "status": { model: TipoEstado, order: [["description", "ASC"]] },
  "insurance-companies": { model: Convenio, order: [["epsName", "ASC"]] },
  "departments": { model: Departamento, order: [["department", "ASC"]] },
  "municipalities": { model: Municipio, order: [["municipalityName", "ASC"]] },
};

export class CatalogsService {
  async findByType(type: string): Promise<any[]> {
    const catalog = CATALOG_MAP[type];
    if (!catalog) {
      throw ApiError.notFound(`Catálogo no encontrado: ${type}`);
    }
    return await catalog.model.findAll({ order: catalog.order });
  }
}
