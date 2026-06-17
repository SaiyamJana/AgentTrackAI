import express from "express";
import { getMyAnalytics, getProjectAnalytics } from "../controllers/analytics.controller.js";
import { verifyJWT, authorizeRoles } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/test", (req, res) => {
  return res.json({
    success: true,
    message: "Analytics router working"
  });
});

router.use(verifyJWT);

// Personal analytics — any logged-in user (employee or admin)
router.get(
  "/me",
  (req, res, next) => {
    console.log("Analytics /me route hit");
    next();
  },
  authorizeRoles("admin", "employee"),
  getMyAnalytics
);

// Project/team analytics — manager / sub-manager / admin (checked in controller)
router.get("/project/:projectId", authorizeRoles("admin", "employee"), getProjectAnalytics);

export default router;
