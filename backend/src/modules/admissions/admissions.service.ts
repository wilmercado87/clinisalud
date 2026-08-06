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
import {
  ADMISSION_ERROR_CODES,
  ADMISSION_NOTIFICATIONS,
  ADMISSION_STATUS,
  ERROR_MESSAGES_ADMISION,
  PATIENT_STATUS,
} from "../../constants";
import { formatMessage } from "../../utils/formatMessage";
import { NotificationsService } from "../notifications/notifications.service";
import {
  toAdmissionResponse,
  toCensusRowResponse,
  toDischargeResponse,
  toPatientLookupResponse,
} from "./admission.mapper";
import {
  AuthorizationData,
  CensusRowResponse,
  CompanionData,
  CreateAdmissionRequest,
  CreateAdmissionResponse,
  DischargeAdmissionResponse,
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
    if (!patient) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.PATIENT_NOT_FOUND);

    const latestAdmission = await Admision.findOne({
      where: { patientId: patient.id },
      order: [["admissionDate", "DESC"]],
    });

    const dischargedStatusId = await this.getStatusIdByDescription(ADMISSION_STATUS.DISCHARGED);
    const activeAdmission =
      latestAdmission && latestAdmission.statusId !== dischargedStatusId
        ? {
            admissionNumber: latestAdmission.admissionNumber,
            admissionDate: latestAdmission.admissionDate,
          }
        : null;

    return toPatientLookupResponse(patient, latestAdmission?.epsId ?? null, activeAdmission);
  }

  public async createAdmission(
    data: CreateAdmissionRequest,
    userId: number,
    userName: string,
    userRole: string,
  ): Promise<CreateAdmissionResponse> {
    return await sequelize.transaction(async (t: Transaction) => {
      const patientId = await this.ensurePatient(data, userId, t);
      await this.assertNoActiveAdmission(patientId, t);
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
        admission: toAdmissionResponse(admission),
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
    if (!data.firstName) throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.FIRST_NAME_REQUIRED);
    if (!data.lastName) throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.LAST_NAME_REQUIRED);

    const existingPatient = await Paciente.findOne({
      where: { documentTypeId: data.documentTypeId, document: data.document },
      transaction: t,
    });
    if (existingPatient) {
      throw ApiError.conflict(ERROR_MESSAGES_ADMISION.PATIENT_ALREADY_EXISTS);
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
      throw ApiError.notFound(ERROR_MESSAGES_ADMISION.PATIENT_NOT_FOUND_WITH_DATA);
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

  private async assertNoActiveAdmission(patientId: number, t: Transaction): Promise<void> {
    const dischargedStatusId = await this.getStatusIdByDescription(ADMISSION_STATUS.DISCHARGED, t);
    const activeAdmission = await Admision.findOne({
      where: {
        patientId,
        statusId: { [Op.not]: dischargedStatusId },
      },
      transaction: t,
    });
    if (activeAdmission) {
      throw ApiError.conflict(
        formatMessage(ERROR_MESSAGES_ADMISION.ACTIVE_ADMISSION_EXISTS, {
          admissionNumber: activeAdmission.admissionNumber,
        }),
        ADMISSION_ERROR_CODES.ACTIVE_ADMISSION_EXISTS,
      );
    }
  }

  private async occupyBed(roomId: number, t: Transaction): Promise<void> {
    const bed = await Cama.findByPk(roomId, { transaction: t });
    if (!bed) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.BED_NOT_FOUND);
    if (bed.bedStatus !== 0) {
      throw ApiError.conflict(
        ERROR_MESSAGES_ADMISION.BED_UNAVAILABLE,
        ADMISSION_ERROR_CODES.BED_UNAVAILABLE,
      );
    }
    bed.bedStatus = 1;
    await bed.save({ transaction: t });
  }

  private async assertEpsExists(epsId: number, t: Transaction): Promise<void> {
    const eps = await Convenio.findByPk(epsId, { transaction: t });
    if (!eps) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.EPS_NOT_FOUND);
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

  private notifyAdmissionCreated(
    admissionNumber: string,
    data: CreateAdmissionRequest,
    userId: number,
    userName: string,
    userRole: string,
  ): void {
    const config = ADMISSION_NOTIFICATIONS.ADMISSION_CREATED;
    this.notificationsService
      .createAndDispatch({
        type: config.type,
        title: config.title,
        message: formatMessage(config.messageTemplate, {
          admissionNumber,
          firstName: data.firstName || "",
          lastName: data.lastName || "",
        }),
        actorId: userId,
        actorName: userName,
        actorRole: userRole,
        actionUrl: config.actionUrl,
        actionLabel: config.actionLabel,
      })
      .catch(() => {});
  }

  public async dischargeAdmission(
    admissionNumber: string,
    userId: number,
    userName: string,
    userRole: string,
  ): Promise<DischargeAdmissionResponse> {
    return await sequelize.transaction(async (t: Transaction) => {
      const admission = await Admision.findByPk(admissionNumber, { transaction: t });
      if (!admission) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.ADMISSION_NOT_FOUND);

      const dischargedStatusId = await this.getStatusIdByDescription(ADMISSION_STATUS.DISCHARGED, t);
      if (admission.statusId === dischargedStatusId) {
        throw ApiError.conflict(
          ERROR_MESSAGES_ADMISION.ADMISSION_ALREADY_DISCHARGED,
          ADMISSION_ERROR_CODES.ADMISSION_ALREADY_DISCHARGED,
        );
      }

      if (admission.roomId) {
        await this.releaseBed(admission.roomId, t);
      }

      await admission.update(
        { statusId: dischargedStatusId, systemUserId: userId },
        { transaction: t },
      );

      this.notifyAdmissionDischarged(admissionNumber, userId, userName, userRole);

      return toDischargeResponse(
        admissionNumber,
        dischargedStatusId,
        admission.roomId ?? null,
        new Date(),
      );
    });
  }

  private async releaseBed(roomId: number, t: Transaction): Promise<void> {
    const bed = await Cama.findByPk(roomId, { transaction: t });
    if (!bed) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.BED_NOT_FOUND);
    if (bed.bedStatus !== 1) {
      throw ApiError.conflict(
        ERROR_MESSAGES_ADMISION.BED_NOT_OCCUPIED,
        ADMISSION_ERROR_CODES.BED_NOT_OCCUPIED,
      );
    }
    bed.bedStatus = 0;
    await bed.save({ transaction: t });
  }

  private notifyAdmissionDischarged(
    admissionNumber: string,
    userId: number,
    userName: string,
    userRole: string,
  ): void {
    const config = ADMISSION_NOTIFICATIONS.ADMISSION_DISCHARGED;
    this.notificationsService
      .createAndDispatch({
        type: config.type,
        title: config.title,
        message: formatMessage(config.messageTemplate, { admissionNumber }),
        actorId: userId,
        actorName: userName,
        actorRole: userRole,
        actionUrl: config.actionUrl,
        actionLabel: config.actionLabel,
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

    return admissions.map((adm) => toCensusRowResponse(adm));
  }
}
