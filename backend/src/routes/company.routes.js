import express from "express";
import {
    createCompany,
    getAllCompanies,
    getCompanyById,
    updateCompany,
} from "../controllers/company.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

// All company routes — Admin only
router.use(verifyJWT);
router.use(authorizeRoles("admin"));

router.post("/",     createCompany);
router.get("/",      getAllCompanies);
router.get("/:id",   getCompanyById);
router.patch("/:id", updateCompany);

export default router;