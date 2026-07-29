import { Router } from "express";
import {
  getCatalog,
  getMunicipalities,
  getContracts,
  getBeds,
  searchDiagnostics,
  searchCups,
} from "./catalogs.controller";

const router = Router();

router.get("/catalogs/diagnostics/search", searchDiagnostics);
router.get("/catalogs/cups/search", searchCups);
router.get("/catalogs/municipalities", getMunicipalities);
router.get("/catalogs/contracts", getContracts);
router.get("/catalogs/beds", getBeds);
router.get("/catalogs/:type", getCatalog);

export default router;
