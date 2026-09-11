import { Router } from "express";
import * as TriageController from "./triage.controller";
import { authenticateToken, requireRole } from "../../middlewares/AuthMiddleware";
import { validateBody } from "../../middlewares/ValidationMiddleware";
import { ROLE_CODES } from "../../constants";
import { createTriageValidation } from "./triage.validations";

const router = Router();

const clinicalRoles = requireRole(
  ROLE_CODES.SUPER_ADMIN,
  ROLE_CODES.ADMIN,
  ROLE_CODES.ADMISIONES,
  ROLE_CODES.MEDICO,
);

router.post(
  "/triage",
  authenticateToken,
  clinicalRoles,
  validateBody(createTriageValidation),
  TriageController.registerTriage,
);

export default router;
