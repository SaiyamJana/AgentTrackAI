import express from "express";
import {
    registerCompany,
    regenerateInviteCode,
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
} from "../controllers/company.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// ── Public bootstrap ──────────────────────────────────────────────────────────
router.post("/register", registerCompany);

// ── Admin-only ────────────────────────────────────────────────────────────────
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.post("/",                           createCompany);
router.get("/",                            getAllCompanies);
router.get("/:id",                         getCompanyById);
router.patch("/:id",                       updateCompany);
// Admin regenerates the employee invite code
router.post("/:id/regenerate-invite",      regenerateInviteCode);

export default router;
