import { Router } from "express";
import {
  getCatalog,
  getMunicipalities,
  getContracts,
  getBeds,
  searchDiagnostics,
  searchCups,
} from "./catalogs.controller";
import { authenticateToken } from "../../middlewares/AuthMiddleware";

const router = Router();

router.get("/catalogs/diagnostics/search", authenticateToken, searchDiagnostics);
router.get("/catalogs/cups/search", authenticateToken, searchCups);
router.get("/catalogs/municipalities", authenticateToken, getMunicipalities);
router.get("/catalogs/contracts", authenticateToken, getContracts);
router.get("/catalogs/beds", authenticateToken, getBeds);
router.get("/catalogs/:type", authenticateToken, getCatalog);

export default router;
