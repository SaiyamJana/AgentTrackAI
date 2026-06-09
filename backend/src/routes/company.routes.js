import express from "express";
import {
    registerCompany,
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
} from "../controllers/company.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public bootstrap route ────────────────────────────────────────────────────
// PDF Phase 1 Step 1: Admin registers the company (no auth needed yet)
router.post("/register", registerCompany);

// ── All routes below require Admin JWT ───────────────────────────────────────
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.post("/",     createCompany);
router.get("/",      getAllCompanies);
router.get("/:id",   getCompanyById);
router.patch("/:id", updateCompany);

export default router;
