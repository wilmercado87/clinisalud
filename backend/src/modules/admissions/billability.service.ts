import Admision from "../../models/Admision";
import Cups from "../../models/Cups";
import Autorizacion from "../../models/Autorizacion";
import { ApiError } from "../../middlewares/ErrorHandlerMiddleware";
import {
  ADMISSION_ERROR_CODES,
  ADMISSION_MODALITY,
  ERROR_MESSAGES_ADMISION,
} from "../../constants";
import { formatMessage } from "../../utils/formatMessage";
import {
  BillabilityItemResponse,
  BillabilityRequest,
  BillabilityResponse,
} from "./admissions.types";

export class BillabilityService {
  public async evaluateBillability(payload: BillabilityRequest): Promise<BillabilityResponse> {
    const admission = await Admision.findByPk(payload.admissionNumber);
    if (!admission) throw ApiError.notFound(ERROR_MESSAGES_ADMISION.ADMISSION_NOT_FOUND);

    const authField = ADMISSION_MODALITY.authFieldOf(payload.modality);
    const items: BillabilityItemResponse[] = [];

    for (const item of payload.items) {
      const cups = await Cups.findOne({ where: { mapiissCode: item.mapiissCode } });

      if (!cups) {
        items.push({
          mapiissCode: item.mapiissCode,
          requiresAuth: false,
          billable: false,
          reason: formatMessage(ERROR_MESSAGES_ADMISION.BILLING_SERVICE_NOT_FOUND, {
            mapiissCode: item.mapiissCode,
          }),
        });
        continue;
      }

      const requiresAuth = (cups[authField] ?? "").toUpperCase() === "SI";
      if (!requiresAuth) {
        items.push({ mapiissCode: cups.mapiissCode, requiresAuth: false, billable: true });
        continue;
      }

      const requested = item.quantity ?? 1;
      const authorizations = await Autorizacion.findAll({
        where: { admissionNumber: payload.admissionNumber, mapiissCode: cups.mapiissCode },
      });
      const hasAuthNumber = authorizations.some((a) => (a.authNumber ?? "").trim().length > 0);
      const authorizedQuantity = authorizations.reduce((acc, a) => acc + a.quantity, 0);

      if (!hasAuthNumber) {
        items.push({
          mapiissCode: cups.mapiissCode,
          requiresAuth: true,
          billable: false,
          reason: formatMessage(ERROR_MESSAGES_ADMISION.BILLING_SERVICE_NO_AUTH, {
            mapiissCode: cups.mapiissCode,
          }),
        });
        continue;
      }

      if (authorizedQuantity < requested) {
        items.push({
          mapiissCode: cups.mapiissCode,
          requiresAuth: true,
          billable: false,
          authorizedQuantity,
          reason: formatMessage(ERROR_MESSAGES_ADMISION.BILLING_AUTH_INSUFFICIENT_QUANTITY, {
            mapiissCode: cups.mapiissCode,
            authorized: authorizedQuantity,
            requested,
          }),
        });
        continue;
      }

      items.push({ mapiissCode: cups.mapiissCode, requiresAuth: true, billable: true, authorizedQuantity });
    }

    if (payload.enforce) {
      const blocked = items.find((item) => !item.billable);
      if (blocked) {
        throw ApiError.conflict(
          blocked.reason ?? ERROR_MESSAGES_ADMISION.BILLING_SERVICE_NO_AUTH,
          ADMISSION_ERROR_CODES.SERVICE_BLOCKED_FOR_BILLING,
        );
      }
    }

    return { admissionNumber: payload.admissionNumber, modality: payload.modality, items };
  }
}