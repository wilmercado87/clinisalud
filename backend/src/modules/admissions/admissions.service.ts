import { Op, Transaction, UniqueConstraintError } from "sequelize";
import sequelize from "../../config/database";
import Admision from "../../models/Admision";
import Paciente from "../../models/Paciente";
import Cama from "../../models/Cama";
import Convenio from "../../models/Convenio";
import TipoEstado from "../../models/TipoEstado";
import Autorizacion from "../../models/Autorizacion";
import Acompanante from "../../models/Acompanante";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import { ADMISSION_STATUS, PATIENT_STATUS } from "../../constants";
import { NotificationsService } from "../notifications/notifications.service";
import {
  AdmissionResponse,
  AuthorizationData,
  CensusRowResponse,
  CompanionData,
  CreateAdmissionRequest,
  CreateAdmissionResponse,
  PatientLookupRequest,
  PatientLookupResponse,
} from "./admissions.types";

const ADMISSION_NUMBER_ATTEMPTS = 2;

const isUniqueConstraintError = (error: unknown): boolean => {
  if (error instanceof UniqueConstraintError) return true;
  if (typeof error !== "object" || error === null) return false;
  const candidate = error as { name?: unknown };
  return candidate.name === "SequelizeUniqueConstraintError";
};

export class AdmissionsService {
  private readonly notificationsService = new NotificationsService();

  private async getStatusIdByDescription(description: string, t?: Transaction): Promise<number> {
    const status = await TipoEstado.findOne({ where: { description }, transaction: t });
    return status ? status.id : 1;
  }

  public async lookupPatient(query: PatientLookupRequest): Promise<PatientLookupResponse> {
    const patient = await Paciente.findOne({
      where: { documentTypeId: query.documentTypeId, document: query.document },
      include: [
        { association: "documentType", attributes: ["id", "code", "description"] },
        { association: "gender", attributes: ["id", "description"] },
        { association: "userType", attributes: ["id", "name"] },
      ],
    });
    if (!patient) throw ApiError.notFound("Paciente no encontrado");

    const latestAdmission = await Admision.findOne({
      where: { patientId: patient.id },
      order: [["admissionDate", "DESC"]],
    });

    return this.toPatientLookupResponse(patient, latestAdmission?.epsId ?? null);
  }

  private toPatientLookupResponse(patient: Paciente, epsId: number | null): PatientLookupResponse {
    const json = patient.toJSON() as PatientLookupResponse;
    return { ...json, id: patient.id, epsId };
  }

  public async createAdmission(
    data: CreateAdmissionRequest,
    userId: number,
    userName: string,
    userRole: string,
  ): Promise<CreateAdmissionResponse> {
    return await sequelize.transaction(async (t: Transaction) => {
      const patientId = await this.ensurePatient(data, userId, t);
      await this.occupyBed(data.roomId, t);
      await this.assertEpsExists(data.epsId, t);

      const registeredStatusId = await this.getStatusIdByDescription(ADMISSION_STATUS.REGISTERED, t);
      const admission = await this.createAdmissionRecord(data, patientId, userId, registeredStatusId, t);
      const admissionNumber = admission.admissionNumber;

      await this.createCompanionIfPresent(admissionNumber, data.companion, t);
      await this.createAuthorizationsIfPresent(admissionNumber, data.authorizations, userId, t);
      this.notifyAdmissionCreated(admissionNumber, data, userId, userName, userRole);

      return {
        admissionNumber,
        patient: { id: patientId, documentTypeId: data.documentTypeId, document: data.document },
        admission: this.toAdmissionResponse(admission),
      };
    });
  }

  private async ensurePatient(
    data: CreateAdmissionRequest,
    userId: number,
    t: Transaction,
  ): Promise<number> {
    if (data.isNewPatient) return await this.createNewPatient(data, userId, t);
    return await this.updateExistingPatient(data, t);
  }

  private async createNewPatient(
    data: CreateAdmissionRequest,
    userId: number,
    t: Transaction,
  ): Promise<number> {
    if (!data.firstName) throw ApiError.badRequest("Nombre del paciente es requerido");
    if (!data.lastName) throw ApiError.badRequest("Apellido del paciente es requerido");

    const existingPatient = await Paciente.findOne({
      where: { documentTypeId: data.documentTypeId, document: data.document },
      transaction: t,
    });
    if (existingPatient) {
      throw ApiError.conflict("Ya existe un paciente con ese tipo y número de documento");
    }

    const activeStatusId = await this.getStatusIdByDescription(PATIENT_STATUS.ACTIVE, t);

    const newPatient = await Paciente.create(
      {
        documentTypeId: data.documentTypeId,
        document: data.document,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
        age: data.age || "",
        address: data.address || "",
        phone: data.phone || "",
        email: data.email || null,
        disability: data.disability || "NO",
        userTypeId: data.userTypeId || 1,
        birthDate: data.birthDate || "",
        genderId: data.genderId || 1,
        statusId: activeStatusId,
        systemUserId: userId,
      },
      { transaction: t },
    );
    return newPatient.id;
  }

  private async updateExistingPatient(
    data: CreateAdmissionRequest,
    t: Transaction,
  ): Promise<number> {
    const existingPatient = await Paciente.findOne({
      where: { documentTypeId: data.documentTypeId, document: data.document },
      transaction: t,
    });
    if (!existingPatient) {
      throw ApiError.notFound("Paciente no encontrado con los datos proporcionados");
    }

    await existingPatient.update(
      {
        firstName: data.firstName?.trim() || existingPatient.firstName,
        lastName: data.lastName?.trim() || existingPatient.lastName,
        age: data.age ?? existingPatient.age,
        address: data.address !== undefined ? data.address : existingPatient.address,
        phone: data.phone !== undefined ? data.phone : existingPatient.phone,
        email: data.email !== undefined ? data.email || null : existingPatient.email,
        disability: data.disability?.trim() || existingPatient.disability,
        userTypeId: data.userTypeId ?? existingPatient.userTypeId,
        birthDate: data.birthDate?.trim() || existingPatient.birthDate,
        genderId: data.genderId ?? existingPatient.genderId,
      },
      { transaction: t },
    );
    return existingPatient.id;
  }

  private async occupyBed(roomId: number, t: Transaction): Promise<void> {
    const bed = await Cama.findByPk(roomId, { transaction: t });
    if (!bed) throw ApiError.notFound("Cama no encontrada");
    if (bed.bedStatus !== 0) {
      throw ApiError.conflict("La cama seleccionada no está disponible");
    }
    bed.bedStatus = 1;
    await bed.save({ transaction: t });
  }

  private async assertEpsExists(epsId: number, t: Transaction): Promise<void> {
    const eps = await Convenio.findByPk(epsId, { transaction: t });
    if (!eps) throw ApiError.notFound("EPS no encontrada");
  }

  private async createAdmissionRecord(
    data: CreateAdmissionRequest,
    patientId: number,
    userId: number,
    registeredStatusId: number,
    t: Transaction,
  ): Promise<Admision> {
    const today = new Date().toISOString().slice(0, 10);
    const todayPrefix = today.replace(/-/g, "");

    for (let attempt = 1; ; attempt++) {
      const todayCount = await Admision.count({
        where: { admissionDate: { [Op.startsWith]: today } },
        transaction: t,
      });
      const seq = String(todayCount + 1).padStart(4, "0");
      const admissionNumber = `ADM-${todayPrefix}-${seq}`;
      try {
        return await Admision.create(
          {
            admissionNumber,
            patientId,
            admissionDate: today,
            roomId: data.roomId,
            epsId: data.epsId,
            observations: data.observations || null,
            statusId: registeredStatusId,
            systemUserId: userId,
          },
          { transaction: t },
        );
      } catch (error) {
        if (attempt < ADMISSION_NUMBER_ATTEMPTS && isUniqueConstraintError(error)) continue;
        throw error;
      }
    }
  }

  private async createCompanionIfPresent(
    admissionNumber: string,
    companion: CompanionData | undefined,
    t: Transaction,
  ): Promise<void> {
    if (!companion) return;
    await Acompanante.create(
      {
        admissionNumber,
        firstName: companion.firstName,
        lastName: companion.lastName,
        documentTypeId: companion.documentTypeId,
        document: companion.document,
        address: companion.address,
        relationshipId: companion.relationshipId,
        phone: companion.phone,
      },
      { transaction: t },
    );
  }

  private async createAuthorizationsIfPresent(
    admissionNumber: string,
    authorizations: AuthorizationData[] | undefined,
    userId: number,
    t: Transaction,
  ): Promise<void> {
    if (!authorizations || authorizations.length === 0) return;

    const authData = authorizations.map((a) => ({
      admissionNumber,
      authTypeId: a.authTypeId,
      authNumber: a.authNumber,
      mapiissCode: a.mapiissCode,
      quantity: a.quantity || 1,
      systemUserId: userId,
    }));
    await Autorizacion.bulkCreate(authData, { transaction: t });
  }

  private toAdmissionResponse(admission: Admision): AdmissionResponse {
    return admission.toJSON() as AdmissionResponse;
  }

  private notifyAdmissionCreated(
    admissionNumber: string,
    data: CreateAdmissionRequest,
    userId: number,
    userName: string,
    userRole: string,
  ): void {
    this.notificationsService
      .createAndDispatch({
        type: "ADMISSION_CREATED",
        title: "Nueva admisión registrada",
        message: `Se registró la admisión ${admissionNumber} para paciente ${data.firstName || ""} ${data.lastName || ""}`,
        actorId: userId,
        actorName: userName,
        actorRole: userRole,
        actionUrl: "/dashboard/admission",
        actionLabel: "Ver admisiones",
      })
      .catch(() => {});
  }

  public async getCensus(): Promise<CensusRowResponse[]> {
    const dischargedStatus = await TipoEstado.findOne({ where: { description: ADMISSION_STATUS.DISCHARGED } });
    const where = dischargedStatus ? { statusId: { [Op.notIn]: [dischargedStatus.id] } } : {};

    const admissions = await Admision.findAll({
      where,
      include: [
        { association: "patient", include: [
          { association: "documentType", attributes: ["id", "code", "description"] },
        ]},
        { association: "room" },
        { association: "eps" },
      ],
      order: [["admissionDate", "DESC"]],
    });

    return admissions.map((adm) => {
      const json = adm.toJSON() as CensusRowResponse;
      return {
        admissionNumber: json.admissionNumber,
        patient: json.patient,
        room: json.room,
        eps: json.eps,
        admissionDate: json.admissionDate,
        observations: json.observations,
        statusId: json.statusId,
      };
    });
  }
}
