import mongoose from "mongoose";
import crypto from "crypto";

const companySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    domain: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    industry: {
      type: String,
      trim: true,
    },
    logoUrl: {
      type: String,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,         // ← NOT required; back-filled after admin user is created
    },

    /**
     * inviteCode — the shareable token Admin gives to employees.
     *
     * - Generated automatically on company creation.
     * - Admin can regenerate it any time via POST /api/v1/companies/:id/regenerate-invite
     * - Employees must supply this code (instead of the raw MongoDB _id) when registering.
     * - If the code leaks, Admin regenerates it and old registrations are unaffected
     *   (existing users already have companyId set).
     */
    inviteCode: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(12).toString("hex"), // 24-char hex, e.g. "a3f9c1..."
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

export const Company = mongoose.model("Company", companySchema);
