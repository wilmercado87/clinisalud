import { Router } from "express";
import { getCatalog } from "./catalogs.controller";

const router = Router();

router.get("/catalogs/:type", getCatalog);

export default router;
