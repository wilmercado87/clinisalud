import sequelize from "../config/database";
import { TriageService } from "../modules/triage/triage.service";
import Paciente from "../models/Paciente";
import Triage from "../models/Triage";
import TipoTriage from "../models/TipoTriage";
import Convenio from "../models/Convenio";
import Diagnostico from "../models/Diagnostico";
import TipoEstado from "../models/TipoEstado";

const validExistingPatientData = {
  isNewPatient: false,
  documentTypeId: 1,
  document: "12345",
  priorityTypeId: 1,
  epsId: 1,
  diagnosticId: 1,
};

const validNewPatientData = {
  ...validExistingPatientData,
  isNewPatient: true,
  firstName: "Juan",
  lastName: "Perez",
};

const mockTransaction = { commit: jest.fn(), rollback: jest.fn() };

describe("TriageService", () => {
  let service: TriageService;

  beforeEach(() => {
    service = new TriageService();
    jest.clearAllMocks();
    jest
      .spyOn(sequelize, "transaction")
      .mockImplementation((async (cb: any) => cb(mockTransaction)) as any);
    jest.spyOn(TipoTriage, "findByPk").mockResolvedValue({ id: 1 } as any);
    jest.spyOn(Convenio, "findByPk").mockResolvedValue({ idEps: 1 } as any);
    jest.spyOn(Diagnostico, "findByPk").mockResolvedValue({ id: 1 } as any);
  });

  describe("createTriage (INV-HC-03)", () => {
    it("should create a triage for an existing patient reusing its identifier", async () => {
      const existingPatient = {
        id: 7,
        documentTypeId: 1,
        document: "12345",
        update: jest.fn().mockResolvedValue(true),
      };
      jest.spyOn(Paciente, "findOne").mockResolvedValue(existingPatient as any);
      const createSpy = jest.spyOn(Triage, "create").mockResolvedValue({
        id: 3,
        toJSON: () => ({
          id: 3,
          priorityTypeId: 1,
          pacienteId: 7,
          attentionDate: "2026-08-21 10:00:00",
          epsId: 1,
          diagnosticId: 1,
          systemUserId: 1,
        }),
      } as any);

      const result = await service.createTriage(validExistingPatientData, 1);

      expect(result.triage.id).toBe(3);
      expect(result.patient).toEqual({ id: 7, documentTypeId: 1, document: "12345" });
      expect(createSpy.mock.calls[0]?.[0]).toEqual(
        expect.objectContaining({ pacienteId: 7, priorityTypeId: 1 }),
      );
    });

    it("should create the patient and the triage in a single transaction when patient is new", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue(null as any);
      jest.spyOn(TipoEstado, "findOne").mockResolvedValue({ id: 1 } as any);
      const patientCreateSpy = jest.spyOn(Paciente, "create").mockResolvedValue({
        id: 9,
        toJSON: () => ({ id: 9 }),
      } as any);
      const triageCreateSpy = jest.spyOn(Triage, "create").mockResolvedValue({
        id: 4,
        toJSON: () => ({
          id: 4,
          priorityTypeId: 1,
          pacienteId: 9,
          attentionDate: "2026-08-21 10:00:00",
          epsId: 1,
          diagnosticId: 1,
          systemUserId: 1,
        }),
      } as any);

      const result = await service.createTriage(validNewPatientData, 1);

      expect(patientCreateSpy).toHaveBeenCalledTimes(1);
      expect(triageCreateSpy.mock.calls[0]?.[0]).toEqual(expect.objectContaining({ pacienteId: 9 }));
      expect(result.patient.id).toBe(9);
    });

    it("should reject when the triage priority does not exist", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({ id: 7, update: jest.fn().mockResolvedValue(true) } as any);
      jest.spyOn(TipoTriage, "findByPk").mockResolvedValue(null as any);
      const createSpy = jest.spyOn(Triage, "create").mockResolvedValue({ toJSON: () => ({}) } as any);

      await expect(service.createTriage(validExistingPatientData, 1)).rejects.toThrow(
        "La prioridad de triage seleccionada no existe",
      );
      expect(createSpy).not.toHaveBeenCalled();
    });

    it("should reject when the EPS does not exist", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({ id: 7, update: jest.fn().mockResolvedValue(true) } as any);
      jest.spyOn(Convenio, "findByPk").mockResolvedValue(null as any);

      await expect(service.createTriage(validExistingPatientData, 1)).rejects.toThrow(
        "EPS no encontrada",
      );
    });

    it("should reject when the CIE-10 diagnostic does not exist", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({ id: 7, update: jest.fn().mockResolvedValue(true) } as any);
      jest.spyOn(Diagnostico, "findByPk").mockResolvedValue(null as any);
      const createSpy = jest.spyOn(Triage, "create").mockResolvedValue({ toJSON: () => ({}) } as any);

      await expect(service.createTriage(validExistingPatientData, 1)).rejects.toThrow(
        "El diagnóstico CIE-10 seleccionado no existe",
      );
      expect(createSpy).not.toHaveBeenCalled();
    });
  });

  describe("attentionDate (INV-HC-04)", () => {
    it("should store the LOCAL attention date with YYYY-MM-DD HH:mm:ss format", async () => {
      jest.spyOn(Paciente, "findOne").mockResolvedValue({ id: 7, update: jest.fn().mockResolvedValue(true) } as any);
      const createSpy = jest.spyOn(Triage, "create").mockResolvedValue({
        id: 5,
        toJSON: () => ({ id: 5 }),
      } as any);

      await service.createTriage(validExistingPatientData, 1);

      const createdAttentionDate = (createSpy.mock.calls[0]?.[0] as { attentionDate: string })
        .attentionDate;
      expect(createdAttentionDate).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

      const now = new Date();
      const pad = (n: number) => String(n).padStart(2, "0");
      const localPrefix = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
      expect(createdAttentionDate.startsWith(localPrefix)).toBe(true);
    });
  });
});
