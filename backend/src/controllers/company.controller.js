import crypto from "crypto";
import { Company } from "../models/Company.js";
import { User }    from "../models/User.js";
import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/companies/register  ← PUBLIC (bootstrap)
 *
 * Phase 1 Step 1 — Admin registers the company.
 * Creates Company + Admin atomically.
 * Returns the inviteCode which Admin shares with employees (NOT the raw _id).
 */
export const registerCompany = asyncHandler(async (req, res) => {
    const { companyName, domain, industry, adminName, adminEmail, adminPassword } = req.body;

    if (!companyName || !domain || !adminName || !adminEmail || !adminPassword) {
        throw new ApiError(400, "companyName, domain, adminName, adminEmail, adminPassword are required");
    }

    const existingCompany = await Company.findOne({ domain });
    if (existingCompany) throw new ApiError(409, "A company with this domain already exists");

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) throw new ApiError(409, "A user with this email already exists");

    // 1. Create company — adminId defaults to null, inviteCode auto-generated
    const company = await Company.create({ name: companyName, domain, industry });

    // 2. Create admin user linked to that company
    const admin = await User.create({
        name:      adminName,
        email:     adminEmail,
        password:  adminPassword,
        role:      "admin",
        companyId: company._id,
    });

    // 3. Back-fill adminId now that we have the admin's _id
    company.adminId = admin._id;
    await company.save();

    const accessToken  = admin.generateAccessToken();
    const refreshToken = admin.generateRefreshToken();
    admin.refreshToken = refreshToken;
    await admin.save({ validateBeforeSave: false });

    admin.password     = undefined;
    admin.refreshToken = undefined;

    return res.status(201).json(
        new ApiResponse(201, {
            company,
            admin,
            accessToken,
            refreshToken,
            // Admin shares inviteCode (not _id) with employees
            inviteCode: company.inviteCode,
        }, "Company registered. Share the inviteCode with your employees so they can sign up.")
    );
});

/**
 * POST /api/v1/companies/:id/regenerate-invite  (Admin only)
 *
 * Admin can regenerate the inviteCode at any time — e.g. if it leaks.
 * Existing employees are unaffected (their companyId is already set).
 * New employees must use the new code to register.
 */
export const regenerateInviteCode = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id);
    if (!company) throw new ApiError(404, "Company not found");

    // Ensure admin owns this company
    if (company.adminId.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not the admin of this company");
    }

    company.inviteCode = crypto.randomBytes(12).toString("hex");
    await company.save();

    return res.status(200).json(
        new ApiResponse(200, { inviteCode: company.inviteCode },
            "Invite code regenerated. Share the new code with employees who still need to register.")
    );
});

// POST /api/v1/companies  (Admin — create additional company)
export const createCompany = asyncHandler(async (req, res) => {
    const { name, domain, industry, logoUrl } = req.body;
    if (!name || !domain) throw new ApiError(400, "Name and domain are required");

    const existing = await Company.findOne({ domain });
    if (existing) throw new ApiError(409, "Company with this domain already exists");

    const company = await Company.create({ name, domain, industry, logoUrl, adminId: req.user._id });
    return res.status(201).json(new ApiResponse(201, company, "Company created successfully"));
});

// GET /api/v1/companies  (Admin)
export const getAllCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.find({ isActive: true })
        .populate("adminId", "name email")
        .sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, companies, "Companies fetched successfully"));
});

// GET /api/v1/companies/:id  (Admin)
export const getCompanyById = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id).populate("adminId", "name email");
    if (!company) throw new ApiError(404, "Company not found");
    return res.status(200).json(new ApiResponse(200, company, "Company fetched successfully"));
});

// PATCH /api/v1/companies/:id  (Admin)
export const updateCompany = asyncHandler(async (req, res) => {
    const { name, industry, logoUrl, isActive } = req.body;
    const company = await Company.findByIdAndUpdate(
        req.params.id,
        { name, industry, logoUrl, isActive },
        { new: true, runValidators: true }
    );
    if (!company) throw new ApiError(404, "Company not found");
    return res.status(200).json(new ApiResponse(200, company, "Company updated successfully"));
});
