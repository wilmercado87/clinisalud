import { Request, Response } from "express";
import { CatalogsService } from "./catalogs.service";
import { getHttpCode } from "../../utils/StatusCodes";

const catalogsService = new CatalogsService();

const CACHE_MAX_AGE = 86400;

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const data = await catalogsService.findByType(type);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};

export const getMunicipalities = async (req: Request, res: Response) => {
  try {
    const departmentId = req.query.departmentId as string | undefined;
    const data = await catalogsService.getMunicipalities(departmentId);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};

export const getContracts = async (req: Request, res: Response) => {
  try {
    const epsId = req.query.epsId ? Number(req.query.epsId) : undefined;
    const data = await catalogsService.getContracts(epsId);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};

export const getBeds = async (req: Request, res: Response) => {
  try {
    const status = req.query.status !== undefined ? Number(req.query.status) : undefined;
    const data = await catalogsService.getBeds(status);
    res.set("Cache-Control", `private, max-age=${CACHE_MAX_AGE}`);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};

export const searchDiagnostics = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const data = await catalogsService.searchDiagnostics(q);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};

export const searchCups = async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || "";
    const data = await catalogsService.searchCups(q);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};
