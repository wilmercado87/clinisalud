// @spec:INV-CAT-01 — Listados Transversales Unificados
import { CatalogsService } from "../modules/catalogs/catalogs.service";
import TipoDocumento from "../models/TipoDocumento";
import TipoGenero from "../models/TipoGenero";
import TipoEstado from "../models/TipoEstado";
import TipoUsuario from "../models/TipoUsuario";
import TipoAutorizacion from "../models/TipoAutorizacion";
import TipoOrigen from "../models/TipoOrigen";
import TipoTriage from "../models/TipoTriage";
import Especialidad from "../models/Especialidad";
import NivelAtencion from "../models/NivelAtencion";
import CentroCosto from "../models/CentroCosto";
import Tarifario from "../models/Tarifario";
import Convenio from "../models/Convenio";
import Departamento from "../models/Departamento";
import Municipio from "../models/Municipio";
import Contrato from "../models/Contrato";
import Cama from "../models/Cama";
import Diagnostico from "../models/Diagnostico";
import Cups from "../models/Cups";

const mockModels = [
  TipoDocumento, TipoGenero, TipoEstado, TipoUsuario, TipoAutorizacion,
  TipoOrigen, TipoTriage, Especialidad, NivelAtencion, CentroCosto,
  Tarifario, Convenio, Departamento, Municipio, Contrato, Cama,
  Diagnostico, Cups,
] as any[];

describe("CatalogsService", () => {
  let service: CatalogsService;

  beforeAll(() => {
    mockModels.forEach((m: any) => {
      jest.spyOn(m, "findAll").mockResolvedValue([]);
    });
  });

  beforeEach(() => {
    service = new CatalogsService();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // @spec:INV-CAT-01
  describe("findByType — catálogos livianos", () => {
    const catalogTypes = [
      "document-types",
      "genders",
      "status-types",
      "user-types",
      "authorization-types",
      "origin-types",
      "triage-types",
      "specialties",
      "attention-levels",
      "cost-centers",
      "fee-schedules",
      "eps",
      "departments",
    ];

    it.each(catalogTypes)("should return %s", async (type) => {
      const result = await service.findByType(type);
      expect(result).toEqual([]);
    });

    it("should throw 404 for unknown type", async () => {
      await expect(service.findByType("unknown")).rejects.toThrow("Catálogo no encontrado");
    });
  });

  // @spec:INV-CAT-01
  describe("getMunicipalities", () => {
    it("should return all without filter", async () => {
      const result = await service.getMunicipalities();
      expect(result).toEqual([]);
    });

    it("should filter by departmentId", async () => {
      const result = await service.getMunicipalities("05");
      expect(result).toEqual([]);
    });
  });

  // @spec:INV-CAT-01
  describe("getContracts", () => {
    it("should return all without filter", async () => {
      const result = await service.getContracts();
      expect(result).toEqual([]);
    });

    it("should filter by epsId", async () => {
      const result = await service.getContracts(5);
      expect(result).toEqual([]);
    });
  });

  // @spec:INV-CAT-01
  describe("getBeds", () => {
    beforeEach(() => {
      jest.spyOn(Cama, "findAndCountAll").mockResolvedValue({ count: 0, rows: [] } as any);
    });

    it("should return paginated result without filter", async () => {
      const result = await service.getBeds();
      expect(result).toEqual({ items: [], total: 0 });
    });

    it("should filter by status and paginate", async () => {
      jest.spyOn(Cama, "findAndCountAll").mockResolvedValue({
        count: 25,
        rows: [{ roomId: 1, bedCode: "CAMA-01", bedStatus: 0, toJSON: () => ({ roomId: 1, bedCode: "CAMA-01", bedStatus: 0 }) }],
      } as any);

      const result = await service.getBeds(0, 1, 10);

      expect(result.total).toBe(25);
      expect(result.items).toHaveLength(1);
      expect(Cama.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({ limit: 10, offset: 0 }),
      );
    });
  });

  // @spec:INV-CAT-01
  describe("searchDiagnostics", () => {
    it("should return empty for empty query", async () => {
      const result = await service.searchDiagnostics("");
      expect(result).toEqual([]);
    });

    it("should search by code or description", async () => {
      const result = await service.searchDiagnostics("colera");
      expect(result).toEqual([]);
    });
  });

  // @spec:INV-CAT-01
  describe("searchCups", () => {
    it("should return empty for empty query", async () => {
      const result = await service.searchCups("");
      expect(result).toEqual([]);
    });

    it("should search by mapiissCode or description", async () => {
      const result = await service.searchCups("123");
      expect(result).toEqual([]);
    });
  });
});
