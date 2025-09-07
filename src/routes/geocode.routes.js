// src/routes/geocode.routes.js
import { Router } from "express";
import { geocode, calcularPuntoMedio } from "../controllers/geocode.controller.js";

const router = Router();

// GET simple: /api/geocode?q=...
router.get("/geocode", geocode);

// POST: /api/geocode/midpoint
router.post("/geocode/midpoint", calcularPuntoMedio);

export default router;
