jest.mock("../modules/notifications/notifications.service", () => {
  const mockCreateAndDispatch = jest.fn().mockResolvedValue(undefined);
  return {
    NotificationsService: jest.fn().mockImplementation(() => ({
      createAndDispatch: mockCreateAndDispatch,
    })),
  };
});

import sequelize from "../config/database";
import { AdmissionsService } from "../modules/admissions/admissions.service";
import Paciente from "../models/Paciente";
import Cama from "../models/Cama";
import Convenio from "../models/Convenio";
import Admision from "../models/Admision";
import TipoEstado from "../models/TipoEstado";
import Autorizacion from "../models/Autorizacion";

const expectedAdmissionNumber = () => {
  const todayPrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `ADM-${todayPrefix}-0001`;
};

describe("AdmissionsService", () => {
  let service: AdmissionsService;

  beforeEach(() => {
    service = new AdmissionsService();
    jest.clearAllMocks();
  });

  describe("lookupPatient", () => {
    beforeEach(() => {
      jest.spyOn(Admision, "findOne").mockResolvedValue(null as any);
    });

    it("should return patient when found", async () => {
      const mockPatient = {
        id: 1,
        documentTypeId: 1,
        document: "12345",
        firstName: "Juan",
        lastName: "Perez",
        toJSON: () => ({ id: 1, documentTypeId: 1, document: "12345", firstName: "Juan", lastName: "Perez" }),
      };
      jest.spyOn(Paciente, "findOne").mockResolvedValue(mockPatient as any);

      const result = await service.lookupPatient({ documentTypeId: 1, document: "12345" });

      expect(result).not.toBeNull();
      expect(result!.firstName).toBe("Juan");
    });

    it("should throw notFound when patient not found", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);

      await expect(service.lookupPatient({ documentTypeId: 1, document: "99999" })).rejects.toThrow(
        "Paciente no encontrado",
      );
    });

    it("should include epsId from latest admission", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({
        id: 1,
        toJSON: () => ({ id: 1, firstName: "Juan" }),
      } as any);
      jest.spyOn(Admision, "findOne").mockResolvedValue({ epsId: 7 } as any);

      const result = await service.lookupPatient({ documentTypeId: 1, document: "12345" });

      expect(result).toHaveProperty("epsId", 7);
    });

    it("should include related associations", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({
        id: 1,
        documentTypeId: 1,
        document: "12345",
        firstName: "Juan",
        toJSON: () => ({
          id: 1,
          firstName: "Juan",
          documentType: { id: 1, code: "CC", description: "Cédula" },
          gender: { id: 1, code: "M", description: "Masculino" },
        }),
      } as any);

      const result = await service.lookupPatient({ documentTypeId: 1, document: "12345" });

      expect(result).toHaveProperty("documentType");
      expect(result!.documentType.code).toBe("CC");
    });
  });

  describe("createAdmission", () => {
    const validData = {
      isNewPatient: true,
      documentTypeId: 1,
      document: "12345",
      firstName: "Juan",
      lastName: "Perez",
      epsId: 1,
      roomId: 1,
    };

    it("should throw on missing required fields", async () => {
      await expect(
        service.createAdmission({ isNewPatient: true, documentTypeId: 0, document: "", epsId: 0, roomId: 0 }, 1, "admin", "ADMIN"),
      ).rejects.toThrow("Tipo de documento");
    });

    it("should create admission for new patient (INV-ADM-01)", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(Paciente, "create").mockResolvedValue({
        id: 1,
        ...validData,
        toJSON: () => ({ id: 1, ...validData }),
      } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 0,
        bedCode: "CAMA-01",
        save: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue({ idEps: 1, epsName: "EPS Test" } as any);
      jest.spyOn(Admision, "count").mockResolvedValue(0);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      const bedSave = jest.fn().mockResolvedValue(true);
      jest.spyOn(Cama.prototype, "save").mockResolvedValue({} as any);
      jest.spyOn(Admision, "create").mockResolvedValue({
        admissionNumber: expectedAdmissionNumber(),
        patientId: 1,
        toJSON: () => ({ admissionNumber: expectedAdmissionNumber(), patientId: 1 }),
      } as any);

      const result = await service.createAdmission(validData, 1, "admin@test.com", "SUPER_ADMIN");

      expect(result).toHaveProperty("admissionNumber");
      expect(result.admissionNumber).toBe(expectedAdmissionNumber());
    });

    it("should throw if new patient but missing firstName", async () => {
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb({})) as any);

      await expect(
        service.createAdmission(
          { ...validData, firstName: "", lastName: "" },
          1,
          "admin@test.com",
          "SUPER_ADMIN",
        ),
      ).rejects.toThrow("Nombre del paciente");
    });

    it("should throw if bed is not available (INV-ADM-01)", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(Paciente, "create").mockResolvedValue({ id: 1, toJSON: () => ({ id: 1 }) } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 1,
        save: jest.fn(),
      } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue({ idEps: 1 } as any);

      await expect(
        service.createAdmission(validData, 1, "admin@test.com", "SUPER_ADMIN"),
      ).rejects.toThrow("no está disponible");
    });

    it("should throw if adding patient that already exists", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue({ id: 1, toJSON: () => ({ id: 1 }) } as any);

      await expect(
        service.createAdmission(validData, 1, "admin@test.com", "SUPER_ADMIN"),
      ).rejects.toThrow("Ya existe un paciente");
    });

    it("should work with existing patient", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      const updateSpy = jest.fn().mockResolvedValue(true);
      jest.spyOn(Paciente, "findOne").mockResolvedValue({
        id: 1,
        firstName: "Juan",
        lastName: "Perez",
        update: updateSpy,
        toJSON: () => ({ id: 1 }),
      } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 0,
        save: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue({ idEps: 1 } as any);
      jest.spyOn(Admision, "count").mockResolvedValue(0);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Cama.prototype, "save").mockResolvedValue({} as any);
      jest.spyOn(Admision, "create").mockResolvedValue({
        admissionNumber: expectedAdmissionNumber(),
        toJSON: () => ({ admissionNumber: expectedAdmissionNumber() }),
      } as any);

      const result = await service.createAdmission(
        { isNewPatient: false, documentTypeId: 1, document: "12345", firstName: "Juan", lastName: "Perez", genderId: 1, userTypeId: 1, age: "30", epsId: 1, roomId: 1 },
        1,
        "admin@test.com",
        "SUPER_ADMIN",
      );

      expect(result.admissionNumber).toBe(expectedAdmissionNumber());
      expect(Paciente.create).not.toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ firstName: "Juan", lastName: "Perez", genderId: 1, userTypeId: 1 }),
        expect.any(Object),
      );
    });

    it("should create authorizations when provided (INV-ADM-02)", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      const dataWithAuth = {
        ...validData,
        authorizations: [
          { authTypeId: 1, authNumber: "AUTH-001", mapiissCode: "CUP-001", quantity: 1 },
        ],
      };

      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(Paciente, "create").mockResolvedValue({ id: 1, toJSON: () => ({ id: 1 }) } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 0,
        save: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue({ idEps: 1 } as any);
      jest.spyOn(Admision, "count").mockResolvedValue(0);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Cama.prototype, "save").mockResolvedValue({} as any);
      jest.spyOn(Admision, "create").mockResolvedValue({
        admissionNumber: expectedAdmissionNumber(),
        toJSON: () => ({ admissionNumber: expectedAdmissionNumber() }),
      } as any);
      const bulkCreateSpy = jest.spyOn(Autorizacion, "bulkCreate").mockResolvedValue([] as any);

      const result = await service.createAdmission(dataWithAuth, 1, "admin@test.com", "SUPER_ADMIN");

      expect(result.admissionNumber).toBe(expectedAdmissionNumber());
      expect(bulkCreateSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ authNumber: "AUTH-001", mapiissCode: "CUP-001" }),
        ]),
        expect.any(Object),
      );
    });

    it("should reject duplicate patient document (INV-ADM-01)", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue({ id: 99, document: "12345" } as any);

      await expect(
        service.createAdmission(
          { isNewPatient: true, documentTypeId: 1, document: "12345", firstName: "Juan", lastName: "Perez", epsId: 1, roomId: 1 },
          1,
          "admin",
          "ADMIN",
        ),
      ).rejects.toThrow("Ya existe un paciente");
    });
  });

  describe("getCensus", () => {
    it("should return active admissions", async () => {
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Admision, "findAll").mockResolvedValue([
        {
          toJSON: () => ({
            admissionNumber: "ADM-001",
            patient: { id: 1, documentType: { code: "CC" }, firstName: "Juan" },
            room: { roomId: 1, bedCode: "CAMA-01" },
            eps: { idEps: 1, epsName: "EPS Test" },
            admissionDate: "2026-07-30",
            observations: null,
            statusId: 1,
          }),
        },
      ] as any);

      const result = await service.getCensus();

      expect(result).toHaveLength(1);
      expect(result[0].admissionNumber).toBe("ADM-001");
    });

    it("should return empty array when no admissions", async () => {
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Admision, "findAll").mockResolvedValue([] as any);

      const result = await service.getCensus();

      expect(result).toEqual([]);
    });
  });
});
