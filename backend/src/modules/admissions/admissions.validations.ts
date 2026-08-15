import { query, body, param } from "express-validator";
import { ADMISSION_MODALITY, ADMISSION_STATUSES, ERROR_MESSAGES_ADMISION } from "../../constants";

export const patientLookupValidation = [
  query("documentTypeId")
    .isInt({ min: 1 })
    .withMessage(ERROR_MESSAGES_ADMISION.DOCUMENT_TYPE_VALID),
  query("document")
    .isLength({ min: 1, max: 30 })
    .withMessage(ERROR_MESSAGES_ADMISION.DOCUMENT_REQUIRED_MAX),
];

export const createAdmissionValidation = [
  body("isNewPatient").isBoolean().withMessage(ERROR_MESSAGES_ADMISION.IS_NEW_PATIENT_BOOLEAN),
  body("documentTypeId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.DOCUMENT_TYPE_REQUIRED),
  body("document").isLength({ min: 1, max: 30 }).withMessage(ERROR_MESSAGES_ADMISION.DOCUMENT_REQUIRED),
  body("epsId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.EPS_REQUIRED),
  body("roomId").optional({ values: "null" }).isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.BED_REQUIRED),
  body("companion").optional().isObject().withMessage(ERROR_MESSAGES_ADMISION.COMPANION_OBJECT),
  body("companion.firstName").optional({ values: "falsy" }).isString().withMessage(ERROR_MESSAGES_ADMISION.COMPANION_FIRST_NAME_INVALID),
  body("companion.lastName").optional({ values: "falsy" }).isString().withMessage(ERROR_MESSAGES_ADMISION.COMPANION_LAST_NAME_INVALID),
  body("companion.documentTypeId").optional().isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.COMPANION_DOCUMENT_TYPE_INVALID),
  body("companion.document").optional({ values: "falsy" }).isLength({ max: 30 }).withMessage(ERROR_MESSAGES_ADMISION.COMPANION_DOCUMENT_INVALID),
  body("companion.address").optional({ values: "falsy" }).isString().withMessage(ERROR_MESSAGES_ADMISION.COMPANION_ADDRESS_INVALID),
  body("companion.relationshipId").optional().isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.COMPANION_RELATIONSHIP_INVALID),
  body("companion.phone").optional({ values: "falsy" }).isNumeric().withMessage(ERROR_MESSAGES_ADMISION.COMPANION_PHONE_INVALID),
  body("authorizations").optional().isArray().withMessage(ERROR_MESSAGES_ADMISION.AUTHORIZATIONS_ARRAY),
  body("authorizations.*.authTypeId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_TYPE_REQUIRED),
  body("authorizations.*.authNumber").isLength({ min: 1, max: 50 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_NUMBER_REQUIRED),
  body("authorizations.*.mapiissCode").isLength({ min: 1, max: 30 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_MAPIISS_REQUIRED),
  body("authorizations.*.quantity").optional().isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_QUANTITY_MIN),
];

export const dischargeAdmissionValidation = [
  param("admissionNumber")
    .isLength({ min: 1, max: 50 })
    .withMessage(ERROR_MESSAGES_ADMISION.ADMISSION_NUMBER_REQUIRED),
];

export const updateAdmissionValidation = [
  param("admissionNumber")
    .isLength({ min: 1, max: 50 })
    .withMessage(ERROR_MESSAGES_ADMISION.ADMISSION_NUMBER_REQUIRED),
  body("roomId").optional({ values: "null" }).isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.BED_REQUIRED),
  body("observations").optional({ values: "null" }).isString().withMessage(ERROR_MESSAGES_ADMISION.OBSERVATIONS_INVALID),
  body("authorizations").optional().isArray().withMessage(ERROR_MESSAGES_ADMISION.AUTHORIZATIONS_ARRAY),
  body("authorizations.*.authTypeId").isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_TYPE_REQUIRED),
  body("authorizations.*.authNumber").isLength({ min: 1, max: 50 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_NUMBER_REQUIRED),
  body("authorizations.*.mapiissCode").isLength({ min: 1, max: 30 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_MAPIISS_REQUIRED),
  body("authorizations.*.quantity").optional().isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_QUANTITY_MIN),
];

export const updateAdmissionStateValidation = [
  param("admissionNumber")
    .isLength({ min: 1, max: 50 })
    .withMessage(ERROR_MESSAGES_ADMISION.ADMISSION_NUMBER_REQUIRED),
  body("state")
    .isIn(ADMISSION_STATUSES)
    .withMessage(ERROR_MESSAGES_ADMISION.ADMISSION_STATE_INVALID),
];

export const billabilityCheckValidation = [
  body("admissionNumber")
    .isLength({ min: 1, max: 50 })
    .withMessage(ERROR_MESSAGES_ADMISION.ADMISSION_NUMBER_REQUIRED),
  body("modality")
    .isIn([ADMISSION_MODALITY.AMBULATORY, ADMISSION_MODALITY.HOSPITALIZATION])
    .withMessage(ERROR_MESSAGES_ADMISION.BILLABILITY_MODALITY_INVALID),
  body("enforce").optional().isBoolean().withMessage(ERROR_MESSAGES_ADMISION.IS_NEW_PATIENT_BOOLEAN),
  body("items").isArray({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.BILLABILITY_ITEMS_REQUIRED),
  body("items.*.mapiissCode").isLength({ min: 1, max: 30 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_MAPIISS_REQUIRED),
  body("items.*.quantity").optional().isInt({ min: 1 }).withMessage(ERROR_MESSAGES_ADMISION.AUTH_QUANTITY_MIN),
];
