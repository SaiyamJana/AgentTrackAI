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
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: false }
);

// Prevent duplicate assignments
employeeProjectSchema.index({ projectId: 1, employeeId: 1 }, { unique: true });
employeeProjectSchema.index({ managerId: 1, projectId: 1 });
employeeProjectSchema.index({ employeeId: 1, isActive: 1 });

export const EmployeeProject = mongoose.model("EmployeeProject", employeeProjectSchema);