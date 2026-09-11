import { body } from "express-validator";
import { ERROR_MESSAGES_ADMISION, ERROR_MESSAGES_TRIAGE } from "../../constants";

export const createTriageValidation = [
  body("isNewPatient").isBoolean().withMessage(ERROR_MESSAGES_ADMISION.IS_NEW_PATIENT_BOOLEAN),
  body("documentTypeId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.DOCUMENT_TYPE_REQUIRED),
  body("document").isLength({ min: 1, max: 30 }).withMessage(ERROR_MESSAGES_ADMISION.DOCUMENT_REQUIRED),
  body("priorityTypeId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_TRIAGE.TRIAGE_PRIORITY_REQUIRED),
  body("epsId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.EPS_REQUIRED),
  body("diagnosticId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_TRIAGE.TRIAGE_DIAGNOSTIC_REQUIRED),
];
