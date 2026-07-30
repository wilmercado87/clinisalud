import { Request, Response } from "express";
import { AdmissionsService } from "./admissions.service";
import { getHttpCode } from "../../utils/StatusCodes";
import { HTTP_STATUS } from "../../constants";
import { AuthRequest } from "../../middlewares/AuthMiddleware";

const admissionsService = new AdmissionsService();

const handleError = (error: any, res: Response, context: string) => {
  const statusCode = getHttpCode(error);
  if (statusCode === HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    console.error(`Error ${context}:`, error);
  }
  return res.status(statusCode).json({ message: error.message, ...(error.code && { code: error.code }) });
};

export const lookupPatient = async (req: Request, res: Response) => {
  try {
    const { documentTypeId, document } = req.query;
    const result = await admissionsService.lookupPatient({
      documentTypeId: Number(documentTypeId),
      document: String(document),
    });
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    return handleError(error, res, "lookupPatient");
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
  } catch (error: any) {
    return handleError(error, res, "registerAdmission");
  }
};

export const getCensus = async (req: Request, res: Response) => {
  try {
    const result = await admissionsService.getCensus();
    res.status(HTTP_STATUS.OK).json(result);
  } catch (error: any) {
    return handleError(error, res, "getCensus");
  }
};
