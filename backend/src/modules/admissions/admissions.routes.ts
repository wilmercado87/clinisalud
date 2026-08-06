import { Router } from "express";
import * as AdmissionsController from "./admissions.controller";
import { authenticateToken, requireRole } from "../../middlewares/AuthMiddleware";
import { validateQuery, validateBody, validateParams } from "../../middlewares/ValidationMiddleware";
import {
  patientLookupValidation,
  createAdmissionValidation,
  dischargeAdmissionValidation,
  updateAdmissionStateValidation,
  billabilityCheckValidation,
} from "./admissions.validations";

const router = Router();

router.get(
  "/admissions/patient-lookup",
  authenticateToken,
  validateQuery(patientLookupValidation),
  AdmissionsController.lookupPatient,
);

router.post(
  "/admissions",
  authenticateToken,
  validateBody(createAdmissionValidation),
  AdmissionsController.registerAdmission,
);

router.get(
  "/admissions/census",
  authenticateToken,
  AdmissionsController.getCensus,
);

router.post(
  "/admissions/:admissionNumber/discharge",
  authenticateToken,
  requireRole("SUPER_ADMIN", "ADMIN", "ADMISIONES"),
  validateParams(dischargeAdmissionValidation),
  AdmissionsController.dischargeAdmission,
);

router.patch(
  "/admissions/:admissionNumber/state",
  authenticateToken,
  requireRole("SUPER_ADMIN", "ADMIN", "ADMISIONES"),
  validateParams(updateAdmissionStateValidation),
  validateBody(updateAdmissionStateValidation),
  AdmissionsController.updateAdmissionState,
);

router.post(
  "/admissions/billability-check",
  authenticateToken,
  requireRole("SUPER_ADMIN", "ADMIN"),
  validateBody(billabilityCheckValidation),
  AdmissionsController.evaluateBillability,
);

export default router;
