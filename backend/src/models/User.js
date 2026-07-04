import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true, trim: true },
    email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },

    /*
     * ONLY TWO ROLES EXIST AT THE USER LEVEL:
     *   "admin"    — the company owner; created once via /companies/register
     *   "employee" — everyone else (regular member, project manager, sub-manager)
     *
     * "Manager" and "sub-manager" are PROJECT-LEVEL roles stored in
     * EmployeeProject.projectRole — NOT here.  A person is a manager
     * on Project A and a plain member on Project B.
     */
    role: {
      type: String,
      enum: ["admin", "employee"],
      default: "employee",
    },

    companyId:    { type: mongoose.Schema.Types.ObjectId, ref: "Company", default: null },
    department:   { type: String },
    designation:  { type: String },
    refreshToken: { type: String },
    isActive:     { type: Boolean, default: true },
    lastSeen:     { type: Date, default: Date.now },
    

    /*
     * capacityHoursPerWeek — how many working hours this person has available per week.
     * Used by the workload calculation engine as the denominator for utilization %.
     * Default 40h (standard full-time). Admin can adjust per employee.
     */
    capacityHoursPerWeek: {
      type: Number,
      default: 40,
      min: 1,
      max: 80,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = function () {
  return jwt.sign(
    { _id: this._id, email: this.email, name: this.name, role: this.role, companyId: this.companyId },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({ _id: this._id }, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRY,
  });
};
userSchema.virtual("isOnline").get(function () {
  if (!this.lastSeen) return false;
  return (Date.now() - new Date(this.lastSeen).getTime()) < 3 * 60 * 1000; // 3 min
});
export const User = mongoose.model("User", userSchema);
