import { Company } from "../models/Company.js";
import { User }    from "../models/User.js";
import { ApiError }    from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

/**
 * POST /api/v1/companies/register  ← PUBLIC (bootstrap)
 *
 * PDF Phase 1 Step 1: "Admin Registers the Company"
 * Creates the Company and its Admin user atomically.
 * Returns the companyId that employees use to self-register.
 */
export const registerCompany = asyncHandler(async (req, res) => {
    const { companyName, domain, industry, adminName, adminEmail, adminPassword } = req.body;

    if (!companyName || !domain || !adminName || !adminEmail || !adminPassword) {
        throw new ApiError(400, "companyName, domain, adminName, adminEmail, adminPassword are required");
    }

    // Guard duplicate domain
    const existingCompany = await Company.findOne({ domain });
    if (existingCompany) throw new ApiError(409, "A company with this domain already exists");

    const existingUser = await User.findOne({ email: adminEmail });
    if (existingUser) throw new ApiError(409, "A user with this email already exists");

    // Create company first (no adminId yet)
    const company = await Company.create({ name: companyName, domain, industry });

    // Create the admin user linked to that company
    const admin = await User.create({
        name:      adminName,
        email:     adminEmail,
        password:  adminPassword,
        role:      "admin",
        companyId: company._id,
    });

    // Back-fill adminId on the company
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
            // Surface the companyId prominently so Admin can share it with employees
            companyId: company._id,
        }, "Company registered successfully. Share the companyId with your employees.")
    );
});

// POST /api/v1/companies  (Admin — add a second company while already logged in)
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
