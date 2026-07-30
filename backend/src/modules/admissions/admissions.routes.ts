import { Router } from "express";
import * as AdmissionsController from "./admissions.controller";
import { authenticateToken } from "../../middlewares/AuthMiddleware";
import { validateQuery, validateBody } from "../../middlewares/ValidationMiddleware";
import { patientLookupValidation, createAdmissionValidation } from "./admissions.validations";

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

export default router;
