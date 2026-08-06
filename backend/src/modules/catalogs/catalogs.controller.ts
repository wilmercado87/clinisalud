import { Request, Response } from "express";
import { CatalogsService } from "./catalogs.service";
import { handleControllerError } from "../../utils/controllerError";

const catalogsService = new CatalogsService();

const CACHE_MAX_AGE = 86400;

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const result = await catalogsService.findByType(req.params.type);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "getCatalog");
  }
};

export const getMunicipalities = async (req: Request, res: Response) => {
  try {
    const result = await catalogsService.getMunicipalities(req.query.departmentId as string | undefined);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "getMunicipalities");
  }
};

export const getContracts = async (req: Request, res: Response) => {
  try {
    const epsId = req.query.epsId ? Number(req.query.epsId) : undefined;
    const result = await catalogsService.getContracts(epsId);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "getContracts");
  }
};

export const getBeds = async (req: Request, res: Response) => {
  try {
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 10));
    const data = await catalogsService.getBeds(status, page, pageSize);
    res.set("Cache-Control", "no-store");
    res.json(data);
  } catch (error: unknown) {
    return handleControllerError(error, res, "getBeds");
  }
};

export const searchDiagnostics = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const limit = Number(req.query.limit) || 20;
    const result = await catalogsService.searchDiagnostics(q, limit);
    res.json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "searchDiagnostics");
  }
};

export const searchCups = async (req: Request, res: Response) => {
  try {
    const q = typeof req.query.q === "string" ? req.query.q : "";
    const feeScheduleId =
      req.query.feeScheduleId !== undefined ? Number(req.query.feeScheduleId) : undefined;
    const page = Math.max(1, Number(req.query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 20));
    const result = await catalogsService.searchCups(q, feeScheduleId, page, pageSize);
    res.json(result);
  } catch (error: unknown) {
    return handleControllerError(error, res, "searchCups");
  }
};