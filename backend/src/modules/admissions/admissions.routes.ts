import { Router } from "express";
import * as AdmissionsController from "./admissions.controller";
import { authenticateToken, requireRole } from "../../middlewares/AuthMiddleware";
import { validateQuery, validateBody, validateParams } from "../../middlewares/ValidationMiddleware";
import { ROLE_CODES } from "../../constants";
import {
  patientLookupValidation,
  createAdmissionValidation,
  dischargeAdmissionValidation,
  updateAdmissionStateValidation,
  updateAdmissionValidation,
  billabilityCheckValidation,
} from "./admissions.validations";

const router = Router();

const admissionsRoles = requireRole(ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN, ROLE_CODES.ADMISIONES);
const clinicalRoles = requireRole(
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.ADMISIONES,
  ROLE_CODES.MEDICO,
);
const adminOnly = requireRole(ROLE_CODES.SUPER_ADMIN, ROLE_CODES.ADMIN);

router.get(
  "/admissions/patient-lookup",
  authenticateToken,
  clinicalRoles,
  validateQuery(patientLookupValidation),
  AdmissionsController.lookupPatient,
);

router.post(
  "/admissions",
  authenticateToken,
  admissionsRoles,
  validateBody(createAdmissionValidation),
  AdmissionsController.registerAdmission,
);

router.get(
  "/admissions/census",
  authenticateToken,
  clinicalRoles,
  AdmissionsController.getCensus,
);

router.post(
  "/admissions/:admissionNumber/discharge",
  authenticateToken,
  admissionsRoles,
  validateParams(dischargeAdmissionValidation),
  AdmissionsController.dischargeAdmission,
);

router.patch(
  "/admissions/:admissionNumber/state",
  authenticateToken,
  admissionsRoles,
  validateParams(updateAdmissionStateValidation),
  validateBody(updateAdmissionStateValidation),
  AdmissionsController.updateAdmissionState,
);

router.patch(
  "/admissions/:admissionNumber",
  authenticateToken,
  admissionsRoles,
  validateParams(updateAdmissionValidation),
  validateBody(updateAdmissionValidation),
  AdmissionsController.updateAdmission,
);

router.post(
  "/admissions/billability-check",
  authenticateToken,
  adminOnly,
  validateBody(billabilityCheckValidation),
  AdmissionsController.evaluateBillability,
);

export default router;
