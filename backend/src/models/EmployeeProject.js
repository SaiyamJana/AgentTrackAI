import mongoose from "mongoose";

const employeeProjectSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    employeeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // ── Phase 3 Step 5: Manager can elevate an employee to sub-manager ──────
    projectRole: {
      type: String,
      enum: ["member", "sub-manager"],
      default: "member",
    },
    assignedAt: { type: Date, default: Date.now },
    isActive:   { type: Boolean, default: true },
  },
  { timestamps: false }
);

employeeProjectSchema.index({ projectId: 1, employeeId: 1 }, { unique: true });
employeeProjectSchema.index({ managerId: 1, projectId: 1 });
employeeProjectSchema.index({ employeeId: 1, isActive: 1 });
// Fast lookup of sub-managers for a project
employeeProjectSchema.index({ projectId: 1, projectRole: 1 });

export const EmployeeProject = mongoose.model("EmployeeProject", employeeProjectSchema);
