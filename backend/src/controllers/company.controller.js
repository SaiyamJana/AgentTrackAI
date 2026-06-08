import { Company } from "../models/Company.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

// POST /api/v1/companies
export const createCompany = asyncHandler(async (req, res) => {
    const { name, domain, industry, logoUrl } = req.body;

    if (!name || !domain) {
        throw new ApiError(400, "Name and domain are required");
    }

    const existing = await Company.findOne({ domain });
    if (existing) {
        throw new ApiError(409, "Company with this domain already exists");
    }

    const company = await Company.create({
        name,
        domain,
        industry,
        logoUrl,
        adminId: req.user._id,
    });

    return res.status(201).json(
        new ApiResponse(201, company, "Company created successfully")
    );
});

// GET /api/v1/companies
export const getAllCompanies = asyncHandler(async (req, res) => {
    const companies = await Company.find({ isActive: true })
        .populate("adminId", "name email")
        .sort({ createdAt: -1 });

    return res.status(200).json(
        new ApiResponse(200, companies, "Companies fetched successfully")
    );
});

// GET /api/v1/companies/:id
export const getCompanyById = asyncHandler(async (req, res) => {
    const company = await Company.findById(req.params.id)
        .populate("adminId", "name email");

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(
        new ApiResponse(200, company, "Company fetched successfully")
    );
});

// PATCH /api/v1/companies/:id
export const updateCompany = asyncHandler(async (req, res) => {
    const { name, industry, logoUrl, isActive } = req.body;

    const company = await Company.findByIdAndUpdate(
        req.params.id,
        { name, industry, logoUrl, isActive },
        { new: true, runValidators: true }
    );

    if (!company) {
        throw new ApiError(404, "Company not found");
    }

    return res.status(200).json(
        new ApiResponse(200, company, "Company updated successfully")
    );
});