import { useState } from "react";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
import { useNavigate, Link } from "react-router-dom";
import { FormInput } from "../../components/auth/FormInput.jsx";
import { AuthPanel } from "../../components/auth/AuthPanel.jsx";
import { BrandLogo } from "../../components/auth/BrandLogo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { authAPI, getRoleDashboard } from "../../utils/api.js";

const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Operations",
  "HR",
  "Finance",
  "Legal",
  "Other",
];

const ROLES = [
  { value: "employee", label: "Employee", desc: "Work on tasks and projects" },
  { value: "manager", label: "Manager", desc: "Manage teams and projects" },
  { value: "admin", label: "Admin", desc: "Full platform access" },
];

const validate = (form) => {
  const errs = {};
  if (!form.name.trim()) errs.name = "Full name is required";
  else if (form.name.trim().length < 2) errs.name = "Name must be at least 2 characters";

  if (!form.email) errs.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errs.email = "Enter a valid email";

  if (!form.password) errs.password = "Password is required";
  else if (form.password.length < 6) errs.password = "Password must be at least 6 characters";
  else if (!/[A-Z]/.test(form.password)) errs.password = "Include at least one uppercase letter";

  if (!form.confirmPassword) errs.confirmPassword = "Please confirm your password";
  else if (form.password !== form.confirmPassword) errs.confirmPassword = "Passwords do not match";

  if (!form.department) errs.department = "Please select a department";
  if (!form.designation.trim()) errs.designation = "Designation is required";

  return errs;
};

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [
    password.length >= 6,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  const textColors = ["", "text-red-500", "text-orange-500", "text-yellow-600", "text-green-600"];

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${
              i <= score ? colors[score] : "bg-slate-100"
            }`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "employee",
    department: "",
    designation: "",
  });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 2-step form

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  const handleRoleSelect = (role) => {
    setForm((prev) => ({ ...prev, role }));
  };

  const handleNext = (e) => {
    e.preventDefault();
    // Validate step 1 fields only
    const step1Fields = { name: form.name, email: form.email, password: form.password, confirmPassword: form.confirmPassword };
    const errs = {};
    if (!step1Fields.name.trim()) errs.name = "Full name is required";
    else if (step1Fields.name.trim().length < 2) errs.name = "Name must be at least 2 characters";
    if (!step1Fields.email) errs.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(step1Fields.email)) errs.email = "Enter a valid email";
    if (!step1Fields.password) errs.password = "Password is required";
    else if (step1Fields.password.length < 6) errs.password = "Password must be at least 6 characters";
    else if (!/[A-Z]/.test(step1Fields.password)) errs.password = "Include at least one uppercase letter";
    if (!step1Fields.confirmPassword) errs.confirmPassword = "Please confirm your password";
    else if (step1Fields.password !== step1Fields.confirmPassword) errs.confirmPassword = "Passwords do not match";
    if (Object.keys(errs).length) return setErrors(errs);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data = await authAPI.register(payload);
      const decoded = login(data.accessToken);
      navigate(getRoleDashboard(decoded.role));
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1>Register</h1>

      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Name"
      />

      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
      />
    </div>
  );
}

export default RegisterPage;