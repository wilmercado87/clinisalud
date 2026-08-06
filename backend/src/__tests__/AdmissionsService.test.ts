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
import Acompanante from "../models/Acompanante";
import TipoAutorizacion from "../models/TipoAutorizacion";
import Cups from "../models/Cups";
import Tarifario from "../models/Tarifario";

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
      jest.spyOn(Admision, "findOne").mockResolvedValue({ epsId: 7, statusId: 7 } as any);

      const result = await service.lookupPatient({ documentTypeId: 1, document: "12345" });

      expect(result).toHaveProperty("epsId", 7);
      expect(result).toHaveProperty("activeAdmission", null);
    });

    it("should include activeAdmission when latest admission is not discharged", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({
        id: 1,
        toJSON: () => ({ id: 1, firstName: "Juan" }),
      } as any);
      jest.spyOn(Admision, "findOne").mockResolvedValue({
        admissionNumber: "ADM-20260804-0001",
        admissionDate: "2026-08-04",
        epsId: 7,
        statusId: 3,
      } as any);

      const result = await service.lookupPatient({ documentTypeId: 1, document: "12345" });

      expect(result).toHaveProperty("activeAdmission");
      expect(result!.activeAdmission).toEqual({
        admissionNumber: "ADM-20260804-0001",
        admissionDate: "2026-08-04",
      });
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
      expect(result!.documentType!.code).toBe("CC");
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

    beforeEach(() => {
      jest.spyOn(Admision, "findOne").mockResolvedValue(null as any);
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
          { authTypeId: 1, authNumber: "AUTH-001", mapiissCode: "CUP-001", quantity: 1, feeScheduleId: 1 },
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
      jest.spyOn(TipoAutorizacion, "findByPk").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Tarifario, "findByPk").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Cups, "findOne").mockResolvedValue({ mapiissCode: "CUP-001", maxQuantity: 10, feeScheduleId: 1 } as any);

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

    it("should throw notFound when bed does not exist", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(Paciente, "create").mockResolvedValue({ id: 1, toJSON: () => ({ id: 1 }) } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue(null as any);

      await expect(
        service.createAdmission({ ...validData, roomId: 999 }, 1, "admin@test.com", "SUPER_ADMIN"),
      ).rejects.toThrow("Cama no encontrada");
    });

    it("should throw notFound when EPS does not exist", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(Paciente, "create").mockResolvedValue({ id: 1, toJSON: () => ({ id: 1 }) } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 0,
        save: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue(null as any);

      await expect(
        service.createAdmission(validData, 1, "admin@test.com", "SUPER_ADMIN"),
      ).rejects.toThrow("EPS no encontrada");
    });

    it("should create companion when provided", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      const companion = {
        firstName: "Maria",
        lastName: "Gomez",
        documentTypeId: 1,
        document: "87654321",
        address: "Calle 10",
        relationshipId: 2,
        phone: "3001234567",
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
      jest.spyOn(Admision, "create").mockResolvedValue({
        admissionNumber: expectedAdmissionNumber(),
        toJSON: () => ({ admissionNumber: expectedAdmissionNumber() }),
      } as any);
      const companionCreateSpy = jest.spyOn(Acompanante, "create").mockResolvedValue({} as any);

      await service.createAdmission(
        { ...validData, companion },
        1,
        "admin@test.com",
        "SUPER_ADMIN",
      );

      expect(companionCreateSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          admissionNumber: expectedAdmissionNumber(),
          firstName: "Maria",
          lastName: "Gomez",
          relationshipId: 2,
        }),
        expect.any(Object),
      );
    });

    it("should default quantity to 1 in authorizations (INV-ADM-02)", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

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
      jest.spyOn(Admision, "create").mockResolvedValue({
        admissionNumber: expectedAdmissionNumber(),
        toJSON: () => ({ admissionNumber: expectedAdmissionNumber() }),
      } as any);
      const bulkCreateSpy = jest.spyOn(Autorizacion, "bulkCreate").mockResolvedValue([] as any);
      jest.spyOn(TipoAutorizacion, "findByPk").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Tarifario, "findByPk").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(Cups, "findOne").mockResolvedValue({ mapiissCode: "CUP-010", maxQuantity: 10, feeScheduleId: 1 } as any);

      await service.createAdmission(
        {
          ...validData,
          authorizations: [{ authTypeId: 1, authNumber: "AUTH-010", mapiissCode: "CUP-010", feeScheduleId: 1 }],
        },
        1,
        "admin@test.com",
        "SUPER_ADMIN",
      );

      expect(bulkCreateSpy).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ authNumber: "AUTH-010", mapiissCode: "CUP-010", quantity: 1 }),
        ]),
        expect.any(Object),
      );
    });

    it("should retry with next sequence when admissionNumber collides", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(Paciente, "create").mockResolvedValue({ id: 1, toJSON: () => ({ id: 1 }) } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 0,
        save: jest.fn().mockResolvedValue(true),
      } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue({ idEps: 1 } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);

      const todayPrefix = new Date().toISOString().slice(0, 10).replace(/-/g, "");
      jest.spyOn(Admision, "count")
        .mockResolvedValueOnce(0)
        .mockResolvedValueOnce(1);
      const uniqueError = Object.assign(new Error("UNIQUE constraint failed"), {
        name: "SequelizeUniqueConstraintError",
      });
      jest.spyOn(Admision, "create")
        .mockRejectedValueOnce(uniqueError)
        .mockResolvedValueOnce({
          admissionNumber: `ADM-${todayPrefix}-0002`,
          toJSON: () => ({ admissionNumber: `ADM-${todayPrefix}-0002` }),
        } as any);

      const result = await service.createAdmission(validData, 1, "admin@test.com", "SUPER_ADMIN");

      expect(result.admissionNumber).toBe(`ADM-${todayPrefix}-0002`);
      expect(Admision.create).toHaveBeenCalledTimes(2);
    });
  });

  it("should throw conflict when patient already has an active admission", async () => {
      const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };
      jest.spyOn(sequelize, "transaction").mockImplementation((async (cb: any) => cb(mockTransaction)) as any);

      jest.spyOn(Paciente, "findOne").mockResolvedValue({
        id: 1,
        update: jest.fn().mockResolvedValue(true),
        toJSON: () => ({ id: 1 }),
      } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 7 } as any);
      jest.spyOn(Admision, "findOne").mockResolvedValue({
        admissionNumber: "ADM-20260804-0001",
        statusId: 3,
      } as any);

      await expect(
        service.createAdmission(
          { isNewPatient: false, documentTypeId: 1, document: "12345", epsId: 1, roomId: 2 },
          1,
          "admin@test.com",
          "ADMISIONES",
        ),
      ).rejects.toThrow("admisión activa");
    });

  describe("dischargeAdmission", () => {
    const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

    beforeEach(() => {
      jest
        .spyOn(sequelize, "transaction")
        .mockImplementation((async (cb: any) => cb(mockTransaction)) as any);
    });

    it("should discharge admission and release the bed (INV-ADM-01)", async () => {
      const bedSave = jest.fn().mockResolvedValue(true);
      const updateSpy = jest.fn().mockResolvedValue(true);
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: 1,
        statusId: 2,
        update: updateSpy,
      } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 5 } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 1,
        save: bedSave,
      } as any);

      const result = await service.dischargeAdmission("ADM-001", 1, "admin@test.com", "ADMISIONES");

      expect(result.admissionNumber).toBe("ADM-001");
      expect(result.statusId).toBe(5);
      expect(result.roomId).toBe(1);
      expect(bedSave).toHaveBeenCalled();
      expect(updateSpy).toHaveBeenCalledWith(
        expect.objectContaining({ statusId: 5, systemUserId: 1 }),
        expect.any(Object),
      );
    });

    it("should throw notFound when admission does not exist", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue(null as any);

      await expect(
        service.dischargeAdmission("ADM-999", 1, "admin@test.com", "ADMISIONES"),
      ).rejects.toThrow("Admisión no encontrada");
    });

    it("should throw conflict when admission is already discharged", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: 1,
        statusId: 5,
        update: jest.fn(),
      } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 5 } as any);

      await expect(
        service.dischargeAdmission("ADM-001", 1, "admin@test.com", "ADMISIONES"),
      ).rejects.toThrow("ya fue egresada");
    });

    it("should throw conflict when bed is not occupied", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: 1,
        statusId: 2,
        update: jest.fn(),
      } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 5 } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue({
        roomId: 1,
        bedStatus: 0,
        save: jest.fn(),
      } as any);

      await expect(
        service.dischargeAdmission("ADM-001", 1, "admin@test.com", "ADMISIONES"),
      ).rejects.toThrow("no se encuentra ocupada");
    });

    it("should throw notFound when bed does not exist", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        roomId: 99,
        statusId: 2,
        update: jest.fn(),
      } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 5 } as any);
      jest.spyOn(Cama, "findByPk").mockResolvedValue(null as any);

      await expect(
        service.dischargeAdmission("ADM-001", 1, "admin@test.com", "ADMISIONES"),
      ).rejects.toThrow("Cama no encontrada");
    });
  });

  describe("getCensus", () => {
    it("should return active admissions", async () => {
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(TipoEstado, "findAll").mockResolvedValue([
        { id: 1, description: "REGISTRADA" },
      ] as any);
      jest.spyOn(Admision, "findAll").mockResolvedValue([
        {
          statusId: 1,
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
      expect(result[0].state).toBe("REGISTRADA");
    });

    it("should return empty array when no admissions", async () => {
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      jest.spyOn(TipoEstado, "findAll").mockResolvedValue([] as any);
      jest.spyOn(Admision, "findAll").mockResolvedValue([] as any);

      const result = await service.getCensus();

      expect(result).toEqual([]);
    });
  });

  describe("updateAdmissionState", () => {
    it("should move REGISTRADA to EN_ATENCION (INV-ADM state machine)", async () => {
      const updateMock = jest.fn().mockResolvedValue(true);
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        statusId: 1,
        update: updateMock,
      } as any);
      jest.spyOn(TipoEstado, "findByPk").mockResolvedValue({ id: 1, description: "REGISTRADA" } as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 2 } as any);

      const result = await service.updateAdmissionState("ADM-001", "EN_ATENCION", 1);

      expect(result.state).toBe("EN_ATENCION");
      expect(result.statusId).toBe(2);
      expect(updateMock).toHaveBeenCalledWith(
        expect.objectContaining({ statusId: 2, systemUserId: 1 }),
      );
    });

    it("should throw conflict on invalid transition", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        statusId: 1,
        update: jest.fn(),
      } as any);
      jest.spyOn(TipoEstado, "findByPk").mockResolvedValue({ id: 1, description: "REGISTRADA" } as any);

      await expect(
        service.updateAdmissionState("ADM-001", "FACTURADA", 1),
      ).rejects.toThrow("Transición de estado no permitida");
    });

    it("should throw conflict when state is unchanged", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({
        admissionNumber: "ADM-001",
        statusId: 1,
        update: jest.fn(),
      } as any);
      jest.spyOn(TipoEstado, "findByPk").mockResolvedValue({ id: 1, description: "REGISTRADA" } as any);

      await expect(
        service.updateAdmissionState("ADM-001", "REGISTRADA", 1),
      ).rejects.toThrow("ya se encuentra en el estado");
    });

    it("should throw notFound when admission does not exist", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue(null as any);

      await expect(
        service.updateAdmissionState("ADM-999", "EN_ATENCION", 1),
      ).rejects.toThrow("Admisión no encontrada");
    });
  });

  describe("evaluateBillability", () => {
    const billabilityPayload = {
      admissionNumber: "ADM-001",
      modality: "HOSPITALIZACION",
      items: [{ mapiissCode: "CUP-010", quantity: 2 }],
    };

    it("should block service requiring auth without authNumber (INV-ADM-03)", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({ admissionNumber: "ADM-001" } as any);
      jest.spyOn(Cups, "findOne").mockResolvedValue({ mapiissCode: "CUP-010", authHosp: "SI" } as any);
      jest.spyOn(Autorizacion, "findAll").mockResolvedValue([] as any);

      const result = await service.evaluateBillability(billabilityPayload);

      expect(result.items[0].billable).toBe(false);
      expect(result.items[0].reason).toContain("bloqueado para facturación");
    });

    it("should allow service without auth requirement (INV-ADM-03)", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({ admissionNumber: "ADM-001" } as any);
      jest.spyOn(Cups, "findOne").mockResolvedValue({ mapiissCode: "CUP-020", authHosp: "NO" } as any);

      const result = await service.evaluateBillability(billabilityPayload);

      expect(result.items[0].billable).toBe(true);
      expect(result.items[0].requiresAuth).toBe(false);
    });

    it("should allow service with sufficient authorized quantity (INV-ADM-03)", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({ admissionNumber: "ADM-001" } as any);
      jest.spyOn(Cups, "findOne").mockResolvedValue({ mapiissCode: "CUP-010", authHosp: "SI" } as any);
      jest.spyOn(Autorizacion, "findAll").mockResolvedValue([
        { authNumber: "AUTH-100", mapiissCode: "CUP-010", quantity: 3 },
      ] as any);

      const result = await service.evaluateBillability(billabilityPayload);

      expect(result.items[0].billable).toBe(true);
      expect(result.items[0].authorizedQuantity).toBe(3);
    });

    it("should enforce a global block when any service is not billable", async () => {
      jest.spyOn(Admision, "findByPk").mockResolvedValue({ admissionNumber: "ADM-001" } as any);
      jest.spyOn(Cups, "findOne").mockResolvedValue({ mapiissCode: "CUP-010", authHosp: "SI" } as any);
      jest.spyOn(Autorizacion, "findAll").mockResolvedValue([] as any);

      await expect(
        service.evaluateBillability({ ...billabilityPayload, enforce: true }),
      ).rejects.toThrow("bloqueado para facturación");
    });
  });
});
