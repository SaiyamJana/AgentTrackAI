import mongoose from "mongoose";

/*
 * This junction table is the single source of truth for who is on which project
 * and what role they play ON that project.
 *
 * projectRole values:
 *   "manager"     — the employee Admin designated as project manager
 *   "sub-manager" — elevated by the project manager for a subset of tasks
 *   "member"      — regular contributor
 */
const employeeProjectSchema = new mongoose.Schema(
  {
    projectId:  { type: mongoose.Schema.Types.ObjectId, ref: "Project",  required: true },
    employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },
    companyId:  { type: mongoose.Schema.Types.ObjectId, ref: "Company",  required: true },
    assignedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User",     required: true },

    projectRole: {
      type: String,
      enum: ["manager", "sub-manager", "member"],
      default: "member",
    },

    assignedAt: { type: Date, default: Date.now },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: false }
);

employeeProjectSchema.index({ projectId: 1, employeeId: 1 }, { unique: true });
employeeProjectSchema.index({ employeeId: 1, isActive: 1 });
employeeProjectSchema.index({ projectId: 1, projectRole: 1 });

export const EmployeeProject = mongoose.model("EmployeeProject", employeeProjectSchema);
