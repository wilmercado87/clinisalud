import { Op, Transaction, UniqueConstraintError } from "sequelize";
import sequelize from "../../config/database";
import Admision from "../../models/Admision";
import Convenio from "../../models/Convenio";
import TipoEstado from "../../models/TipoEstado";
import TipoAutorizacion from "../../models/TipoAutorizacion";
import Cups from "../../models/Cups";
import Tarifario from "../../models/Tarifario";
import Autorizacion from "../../models/Autorizacion";
import Acompanante from "../../models/Acompanante";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import {
  ADMISSION_ERROR_CODES,
  ADMISSION_NOTIFICATIONS,
  ADMISSION_STATE_MACHINE,
  ADMISSION_STATUS,
  ERROR_MESSAGES_ADMISION,
} from "../../constants";
import { formatMessage } from "../../utils/formatMessage";
import { dispatchNotification } from "../../utils/notify";
import { NotificationsService } from "../notifications/notifications.service";
import { getStatusIdByDescription } from "./admission-status.util";
import { PatientService } from "./patient.service";
import { BedService } from "./bed.service";
import { BillabilityService } from "./billability.service";
import {
  toAdmissionResponse,
  toCensusRowResponse,
  toDischargeResponse,
  toPatientLookupResponse,
} from "./admission.mapper";
import {
  AuthorizationData,
  AdmissionStateResponse,
  BillabilityRequest,
  BillabilityResponse,
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
  private readonly patientService = new PatientService();
  private readonly bedService = new BedService();
  private readonly billabilityService = new BillabilityService();

  public async lookupPatient(query: PatientLookupRequest): Promise<PatientLookupResponse> {
    const patient = await this.patientService.findByDocument(
      query.documentTypeId,
      query.document,
    );
    if (!patient) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.PATIENT_NOT_FOUND);

    const latestAdmission = await Admision.findOne({
      where: { patientId: patient.id },
      order: [["admissionDate", "DESC"]],
    });

    const dischargedStatusId = await getStatusIdByDescription(ADMISSION_STATUS.DISCHARGED);
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
      const patientId = await this.patientService.ensurePatient(data, userId, t);
      await this.assertNoActiveAdmission(patientId, t);
      await this.bedService.occupyBed(data.roomId, t);
      await this.assertEpsExists(data.epsId, t);
      await this.assertAuthorizationsAreValid(data.authorizations, t);

      const registeredStatusId = await getStatusIdByDescription(ADMISSION_STATUS.REGISTERED, t);
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

  private async assertNoActiveAdmission(patientId: number, t: Transaction): Promise<void> {
    const dischargedStatusId = await getStatusIdByDescription(ADMISSION_STATUS.DISCHARGED, t);
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

  private async assertEpsExists(epsId: number, t: Transaction): Promise<void> {
    const eps = await Convenio.findByPk(epsId, { transaction: t });
    if (!eps) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.EPS_NOT_FOUND);
  }

  private async assertAuthorizationsAreValid(
    authorizations: AuthorizationData[] | undefined,
    t: Transaction,
  ): Promise<void> {
    if (!authorizations || authorizations.length === 0) return;

    for (const authorization of authorizations) {
      await this.assertAuthTypeExists(authorization.authTypeId, t);
      const cups = await this.assertMapiissCodeExists(authorization.mapiissCode, t);
      await this.assertFeeScheduleMatchesCups(authorization.feeScheduleId, cups, t);
      this.assertQuantityWithinMax(authorization, cups);
    }
  }

  private async assertMapiissCodeExists(
    mapiissCode: string,
    t: Transaction,
  ): Promise<Cups> {
    const cups = await Cups.findOne({ where: { mapiissCode }, transaction: t });
    if (!cups) {
      throw ApiError.badRequest(
        formatMessage(ERROR_MESSAGES_ADMISION.AUTH_MAPIISS_NOT_FOUND, { mapiissCode }),
      );
    }
    return cups;
  }

  private async assertFeeScheduleMatchesCups(
    feeScheduleId: number,
    cups: Cups,
    t: Transaction,
  ): Promise<void> {
    if (!feeScheduleId) {
      throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.AUTH_FEE_SCHEDULE_REQUIRED);
    }
    const tarifario = await Tarifario.findByPk(feeScheduleId, { transaction: t });
    if (!tarifario) {
      throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.AUTH_FEE_SCHEDULE_REQUIRED);
    }
    if (cups.feeScheduleId !== feeScheduleId) {
      throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.AUTH_FEE_SCHEDULE_MISMATCH);
    }
  }

  private async assertAuthTypeExists(authTypeId: number, t: Transaction): Promise<void> {
    const authType = await TipoAutorizacion.findByPk(authTypeId, { transaction: t });
    if (!authType) throw ApiError.badRequest(ERROR_MESSAGES_ADMISION.AUTH_TYPE_NOT_FOUND);
  }

  private assertQuantityWithinMax(authorization: AuthorizationData, cups: Cups): void {
    if (!authorization.quantity || authorization.quantity <= 0) return;
    if (authorization.quantity > cups.maxQuantity) {
      throw ApiError.badRequest(
        formatMessage(ERROR_MESSAGES_ADMISION.AUTH_QUANTITY_EXCEEDS_MAX, {
          maxQuantity: cups.maxQuantity,
        }),
      );
    }
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
      feeScheduleId: a.feeScheduleId,
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
    dispatchNotification(
      this.notificationsService,
      config,
      { id: userId, name: userName, role: userRole },
      {
        admissionNumber,
        firstName: data.firstName || "",
        lastName: data.lastName || "",
      },
    );
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

      const dischargedStatusId = await getStatusIdByDescription(ADMISSION_STATUS.DISCHARGED, t);
      if (admission.statusId === dischargedStatusId) {
        throw ApiError.conflict(
          ERROR_MESSAGES_ADMISION.ADMISSION_ALREADY_DISCHARGED,
          ADMISSION_ERROR_CODES.ADMISSION_ALREADY_DISCHARGED,
        );
      }

      if (admission.roomId) {
        await this.bedService.releaseBed(admission.roomId, t);
      }

      await admission.update(
        { statusId: dischargedStatusId, systemUserId: userId, dischargedAt: new Date() },
        { transaction: t },
      );

      this.notifyAdmissionDischarged(admissionNumber, userId, userName, userRole);

      return toDischargeResponse(
        admissionNumber,
        dischargedStatusId,
        admission.roomId ?? null,
        admission.dischargedAt ?? new Date(),
      );
    });
  }

  public async updateAdmissionState(
    admissionNumber: string,
    nextState: string,
    userId: number,
  ): Promise<AdmissionStateResponse> {
    const admission = await Admision.findByPk(admissionNumber);
    if (!admission) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.ADMISSION_NOT_FOUND);

    const currentState = await this.getStatusDescription(admission.statusId);
    if (currentState === nextState) {
      throw ApiError.conflict(
        formatMessage(ERROR_MESSAGES_ADMISION.ADMISSION_STATE_UNCHANGED, { state: nextState }),
        ADMISSION_ERROR_CODES.ADMISSION_STATE_UNCHANGED,
      );
    }

    const allowedTransitions = ADMISSION_STATE_MACHINE[currentState] ?? [];
    if (!allowedTransitions.includes(nextState)) {
      throw ApiError.conflict(
        formatMessage(ERROR_MESSAGES_ADMISION.INVALID_STATE_TRANSITION, {
          currentState,
          nextState,
        }),
        ADMISSION_ERROR_CODES.INVALID_STATE_TRANSITION,
      );
    }

    const nextStatusId = await getStatusIdByDescription(nextState);
    await admission.update({ statusId: nextStatusId, systemUserId: userId });

    return { admissionNumber, statusId: nextStatusId, state: nextState };
  }

  private async getStatusDescription(statusId: number): Promise<string> {
    const status = await TipoEstado.findByPk(statusId);
    return status?.description ?? "";
  }

  private notifyAdmissionDischarged(
    admissionNumber: string,
    userId: number,
    userName: string,
    userRole: string,
  ): void {
    const config = ADMISSION_NOTIFICATIONS.ADMISSION_DISCHARGED;
    dispatchNotification(
      this.notificationsService,
      config,
      { id: userId, name: userName, role: userRole },
      { admissionNumber },
    );
  }

  public async evaluateBillability(payload: BillabilityRequest): Promise<BillabilityResponse> {
    return this.billabilityService.evaluateBillability(payload);
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

    const states = await TipoEstado.findAll();
    const stateById = new Map(states.map((s) => [s.id, s.description]));

    return admissions.map((adm) => toCensusRowResponse(adm, stateById.get(adm.statusId) ?? ""));
  }
}