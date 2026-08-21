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

  describe("searchCups", () => {
    beforeEach(() => {
      jest.spyOn(Cups, "findAndCountAll").mockResolvedValue({ count: 0, rows: [] } as any);
    });

    it("should return empty for empty query", async () => {
      const result = await service.searchCups("");
      expect(result).toEqual({ items: [], total: 0 });
    });

    it("should return empty when no fee schedule is provided", async () => {
      const result = await service.searchCups("123");
      expect(result).toEqual({ items: [], total: 0 });
    });

    it("should filter by feeScheduleId, map result and paginate", async () => {
      jest.spyOn(Cups, "findAndCountAll").mockResolvedValue({
        count: 42,
        rows: [
          {
            cupsId: 7,
            mapiissCode: "123",
            mapiissDescription: "Consulta",
            maxQuantity: 3,
            netValue: 125000,
            toJSON: () => ({}),
          },
        ],
      } as any);

      const result = await service.searchCups("123", 2, undefined, 1, 20);

      expect(result.total).toBe(42);
      expect(result.items).toEqual([
        { id: 7, code: "123", description: "Consulta", maxQuantity: 3, netValue: 125000 },
      ]);
      expect(Cups.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ feeScheduleId: 2 }),
          limit: 20,
          offset: 0,
        }),
      );
    });

    it("should filter by attentionLevelId when provided", async () => {
      jest.spyOn(Cups, "findAndCountAll").mockResolvedValue({ count: 0, rows: [] } as any);

      await service.searchCups("123", 2, 3, 1, 20);

      expect(Cups.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ feeScheduleId: 2, attentionLevelId: 3 }),
        }),
      );
    });

    it("should not include attentionLevelId filter when not provided", async () => {
      jest.spyOn(Cups, "findAndCountAll").mockResolvedValue({ count: 0, rows: [] } as any);

      await service.searchCups("123", 2, undefined, 1, 20);

      expect(Cups.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.not.objectContaining({ attentionLevelId: undefined }),
        }),
      );
    });
  });
});
