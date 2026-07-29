import { Request, Response } from "express";
import { CatalogsService } from "./catalogs.service";
import { getHttpCode } from "../../utils/StatusCodes";

const catalogsService = new CatalogsService();

export const getCatalog = async (req: Request, res: Response) => {
  try {
    const { type } = req.params;
    const data = await catalogsService.findByType(type);
    res.json(data);
  } catch (error: any) {
    const statusCode = getHttpCode(error);
    res.status(statusCode).json({ message: error.message });
  }
};
