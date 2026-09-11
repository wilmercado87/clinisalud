import { Request, Response } from "express";
import { TriageService } from "./triage.service";
import { HTTP_STATUS } from "../../constants";
import { AuthRequest } from "../../middlewares/AuthMiddleware";
import { handleControllerError } from "../../utils/controllerError";

const triageService = new TriageService();

export const registerTriage = async (req: AuthRequest, res: Response) => {
  try {
    const result = await triageService.createTriage(req.body, req.user!.id);
    res.status(HTTP_STATUS.CREATED).json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "registerTriage");
  }
};
