import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FormInput } from "../../components/auth/FormInput.jsx";
import { AuthPanel } from "../../components/auth/AuthPanel.jsx";
import { BrandLogo } from "../../components/auth/BrandLogo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { authAPI, getRoleDashboard } from "../../utils/api.js";

const validate = (email, password) => {
  const errs = {};
  if (!email) errs.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errs.email = "Enter a valid email";
  if (!password) errs.password = "Password is required";
  else if (password.length < 6) errs.password = "Password must be at least 6 characters";
  return errs;
};

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate(form.email, form.password);
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const data = await authAPI.login(form.email, form.password);
      console.log("API response:", data);
      console.log("Login successful, received token:", data.accessToken);
      const decoded = login(data.accessToken);
      navigate(getRoleDashboard(decoded.role));
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Left decorative panel */}
      <div className="w-[52%] flex-shrink-0">
        <AuthPanel />
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-20 py-12 bg-white relative">
        {/* Top-right corner decoration */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-[80px] -z-0" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          {/* Mobile logo */}
          <div className="lg:hidden mb-10">
            <BrandLogo size="md" />
          </div>

          {/* Header */}
          <div className="mb-9">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">Welcome back</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
              Sign in to your<br />workspace
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              Enter your credentials to access the platform.
            </p>
          </div>

          {/* Role hint badges */}
          <div className="flex gap-2 mb-8">
            {["Admin", "Manager", "Employee"].map((role) => (
              <span
                key={role}
                className="text-xs px-3 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold border border-blue-100"
              >
                {role}
              </span>
            ))}
          </div>

          {/* Global API error */}
          {apiError && (
            <div className="mb-6 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
              <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {apiError}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-5">
            <FormInput
              label="Email Address"
              type="email"
              value={form.email}
              onChange={handleChange("email")}
              error={errors.email}
              placeholder="you@company.com"
              required
              autoComplete="email"
            />
            <FormInput
              label="Password"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              error={errors.password}
              placeholder="••••••••"
              required
              autoComplete="current-password"
            />

            {/* Forgot password */}
            <div className="flex justify-end">
              <button type="button" className="text-xs text-blue-600 hover:text-blue-800 font-semibold transition-colors">
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl
                font-bold text-sm text-white tracking-wide
                bg-gradient-to-r from-blue-600 to-blue-700
                hover:from-blue-700 hover:to-blue-800
                active:scale-[0.98] transition-all duration-150
                shadow-lg shadow-blue-200 hover:shadow-blue-300
                disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100
              `}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span>Signing in…</span>
                </>
              ) : (
                <>
                  <span>Sign In</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-100" />
            </div>
            <div className="relative flex justify-center">
              <span className="bg-white px-3 text-xs text-slate-400 font-medium">New to AgentTrack?</span>
            </div>
          </div>

          {/* Sign up link */}
          <Link
            to="/register"
            className="
              w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl
              font-bold text-sm text-blue-700 tracking-wide
              bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-200
              transition-all duration-150 active:scale-[0.98]
            "
          >
            Create an account
          </Link>

          {/* Footer note */}
          <p className="mt-8 text-center text-xs text-slate-400 leading-relaxed">
            By signing in you agree to our{" "}
            <span className="text-blue-500 cursor-pointer hover:underline">Terms of Service</span>{" "}
            and{" "}
            <span className="text-blue-500 cursor-pointer hover:underline">Privacy Policy</span>.
          </p>
        </div>
      </div>
    </div>
  );
}
