import { Request, Response } from "express";
import { AdmissionsService } from "./admissions.service";
import { HTTP_STATUS } from "../../constants";
import { AuthRequest } from "../../middlewares/AuthMiddleware";
import { handleControllerError } from "../../utils/controllerError";

const admissionsService = new AdmissionsService();

export const lookupPatient = async (req: Request, res: Response) => {
  try {
    const { documentTypeId, document } = req.query;
    const result = await admissionsService.lookupPatient({
      documentTypeId: Number(documentTypeId),
      document: String(document),
    });
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "lookupPatient");
  }
};

export const registerAdmission = async (req: AuthRequest, res: Response) => {
  try {
    const result = await admissionsService.createAdmission(
      req.body,
      req.user!.id,
      req.user!.email,
      req.user!.role,
    );
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "registerAdmission");
  }
};

export const getCensus = async (req: Request, res: Response) => {
  try {
    const result = await admissionsService.getCensus();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "getCensus");
  }
};

export const dischargeAdmission = async (req: AuthRequest, res: Response) => {
  try {
    const result = await admissionsService.dischargeAdmission(
      req.params.admissionNumber,
      req.user!.id,
      req.user!.email,
      req.user!.role,
    );
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "dischargeAdmission");
  }
};

export const updateAdmissionState = async (req: AuthRequest, res: Response) => {
  try {
    const result = await admissionsService.updateAdmissionState(
      req.params.admissionNumber,
      req.body.state,
      req.user!.id,
    );
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "updateAdmissionState");
  }
};
