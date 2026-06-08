import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
    },
    companyId: {                                    // ← ADDED
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
    },
    managerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
    status: {
      type: String,
      enum: ["active", "completed", "on-hold"],
      default: "active",
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    progressPercentage: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    tags: [{ type: String }],                       // ← ADDED
  },
  { timestamps: true }
);

// Indexes
projectSchema.index({ companyId: 1, status: 1 });
projectSchema.index({ managerId: 1 });

export const Project = mongoose.model("Project", projectSchema);