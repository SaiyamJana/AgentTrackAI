import mongoose from "mongoose";

/*
 * managerId is kept here as a denormalized fast-lookup field —
 * it mirrors the EmployeeProject record where projectRole = "manager".
 * This lets us quickly filter "projects managed by X" without
 * joining EmployeeProject every time.
 */
const projectSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true, trim: true },
    description: { type: String },
    companyId:   { type: mongoose.Schema.Types.ObjectId, ref: "Company", required: true },

    // Denormalized from EmployeeProject for fast queries
    managerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    priority: { type: String, enum: ["low", "medium", "high"], default: "medium" },
    status:   { type: String, enum: ["active", "completed", "on-hold"], default: "active" },
    startDate: { type: Date, required: true },
    endDate:   { type: Date, required: true },
    progressPercentage: { type: Number, default: 0, min: 0, max: 100 },
    tags: [{ type: String }],
  },
  { timestamps: true }
);

projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ managerId: 1 });

export const Project = mongoose.model("Project", projectSchema);
