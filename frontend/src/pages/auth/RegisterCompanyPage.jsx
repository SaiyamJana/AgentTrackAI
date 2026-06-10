import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FormInput } from "../../components/auth/FormInput.jsx";
import { AuthPanel } from "../../components/auth/AuthPanel.jsx";
import { BrandLogo } from "../../components/auth/BrandLogo.jsx";
import { useAuth } from "../../context/AuthContext.jsx";
import { authAPI } from "../../utils/api.js";

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
);

const INDUSTRIES = [
  "Software", "Finance", "Healthcare", "Education",
  "Retail", "Manufacturing", "Consulting", "Media", "Other",
];

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    // Step 1 — Company details
    companyName: "",
    domain:      "",
    industry:    "",
    // Step 2 — Admin account
    adminName:     "",
    adminEmail:    "",
    adminPassword: "",
    confirmPassword: "",
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);
  // Shown after success so admin can share it
  const [inviteCode, setInviteCode] = useState("");
  const [copied,     setCopied]     = useState(false);

  const handleChange = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  // ── Step 1 validation ──────────────────────────────────────────
  const validateStep1 = () => {
    const errs = {};
    if (!form.companyName.trim()) errs.companyName = "Company name is required";
    if (!form.domain.trim())      errs.domain      = "Domain is required";
    else if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(form.domain.trim().toLowerCase()))
      errs.domain = "Enter a valid domain (e.g. mycompany.com)";
    if (!form.industry)           errs.industry    = "Please select an industry";
    return errs;
  };

  // ── Step 2 validation ──────────────────────────────────────────
  const validateStep2 = () => {
    const errs = {};
    if (!form.adminName.trim())   errs.adminName  = "Your name is required";
    if (!form.adminEmail)         errs.adminEmail = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail))
      errs.adminEmail = "Enter a valid email";
    if (!form.adminPassword)      errs.adminPassword = "Password is required";
    else if (form.adminPassword.length < 6)  errs.adminPassword = "Min. 6 characters";
    else if (!/[A-Z]/.test(form.adminPassword)) errs.adminPassword = "Include at least one uppercase letter";
    if (!form.confirmPassword)    errs.confirmPassword = "Please confirm your password";
    else if (form.adminPassword !== form.confirmPassword)
      errs.confirmPassword = "Passwords do not match";
    return errs;
  };

  const handleNext = (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) return setErrors(errs);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validateStep2();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const data = await authAPI.registerCompany({
        companyName:   form.companyName,
        domain:        form.domain.toLowerCase(),
        industry:      form.industry,
        adminName:     form.adminName,
        adminEmail:    form.adminEmail,
        adminPassword: form.adminPassword,
      });

      // Show invite code before redirecting
      setInviteCode(data.data.inviteCode);
      localStorage.setItem("companyId", data.data.company._id);
      login(data.data.accessToken);
      // Don't navigate yet — show invite code screen first
      setStep(3);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Step indicators (only for steps 1 & 2) ────────────────────
  const StepIndicator = () => (
    <div className="flex items-center gap-3 mb-8">
      {[1, 2].map((s) => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= s ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-400"}`}>
            {step > s ? (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            ) : s}
          </div>
          <span className={`text-xs font-semibold ${step >= s ? "text-blue-700" : "text-slate-400"}`}>
            {s === 1 ? "Company" : "Admin Account"}
          </span>
          {s < 2 && <div className={`w-8 h-0.5 rounded ${step > s ? "bg-blue-300" : "bg-slate-100"}`} />}
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-[45%] flex-shrink-0"><AuthPanel /></div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12 bg-white relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-[80px] -z-0" />

        <div className="relative z-10 w-full max-w-md mx-auto">
          <div className="lg:hidden mb-8"><BrandLogo size="md" /></div>

          {/* ── Step 3: Success — show invite code ── */}
          {step === 3 && (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mx-auto mb-5">
                <svg className="w-8 h-8 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-2xl font-black text-slate-800 mb-2">Company registered!</h1>
              <p className="text-sm text-slate-500 mb-8">
                Share this invite code with your employees so they can join.
              </p>

              {/* Invite code box */}
              <div className="bg-slate-50 border-2 border-slate-200 rounded-2xl px-6 py-5 mb-3">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Invite Code</p>
                <p className="text-3xl font-black text-blue-600 tracking-widest">{inviteCode}</p>
              </div>

              <button
                onClick={handleCopy}
                className={`w-full flex items-center justify-center gap-2 py-3 px-6 rounded-xl font-bold text-sm transition-all mb-6 ${copied ? "bg-green-50 text-green-600 border-2 border-green-200" : "bg-blue-50 text-blue-700 border-2 border-blue-100 hover:bg-blue-100"}`}
              >
                {copied ? (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg> Copied!</>
                ) : (
                  <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> Copy Code</>
                )}
              </button>

              <button
                onClick={() => navigate("/admin/dashboard")}
                className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200"
              >
                Go to Dashboard
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </button>
            </div>
          )}

          {/* ── Steps 1 & 2 ── */}
          {step !== 3 && (
            <>
              <div className="mb-7">
                <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">Admin Sign Up</p>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">
                  Register your company
                </h1>
                <p className="mt-2 text-sm text-slate-500">
                  Set up your workspace and invite your team.
                </p>
              </div>

              <StepIndicator />

              {/* API Error */}
              {apiError && (
                <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
                  <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {apiError}
                </div>
              )}

              {/* ── Step 1: Company details ── */}
              {step === 1 && (
                <form onSubmit={handleNext} noValidate className="space-y-5">
                  <FormInput
                    label="Company Name"
                    type="text"
                    value={form.companyName}
                    onChange={handleChange("companyName")}
                    error={errors.companyName}
                    placeholder="Acme Corp"
                    required
                  />
                  <div>
                    <FormInput
                      label="Company Domain"
                      type="text"
                      value={form.domain}
                      onChange={handleChange("domain")}
                      error={errors.domain}
                      placeholder="acmecorp.com"
                      required
                    />
                    <p className="mt-1 text-xs text-slate-400">Must be unique across the platform.</p>
                  </div>

                  {/* Industry */}
                  <div>
                    <label className="block text-sm font-semibold text-slate-600 mb-1.5 tracking-wide">
                      Industry <span className="text-blue-500">*</span>
                    </label>
                    <select
                      value={form.industry}
                      onChange={handleChange("industry")}
                      className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-800 text-sm outline-none transition-all duration-200 cursor-pointer focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${errors.industry ? "border-red-400 ring-4 ring-red-50" : "border-slate-200 hover:border-slate-300"}`}
                    >
                      <option value="" disabled>Select your industry…</option>
                      {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                    </select>
                    {errors.industry && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        {errors.industry}
                      </p>
                    )}
                  </div>

                  <button type="submit" className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 mt-2 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200">
                    <span>Continue</span>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </button>
                </form>
              )}

              {/* ── Step 2: Admin account ── */}
              {step === 2 && (
                <form onSubmit={handleSubmit} noValidate className="space-y-5">
                  <FormInput
                    label="Your Full Name"
                    type="text"
                    value={form.adminName}
                    onChange={handleChange("adminName")}
                    error={errors.adminName}
                    placeholder="Jane Doe"
                    required
                    autoComplete="name"
                  />
                  <FormInput
                    label="Your Email"
                    type="email"
                    value={form.adminEmail}
                    onChange={handleChange("adminEmail")}
                    error={errors.adminEmail}
                    placeholder="you@company.com"
                    required
                    autoComplete="email"
                  />
                  <FormInput
                    label="Password"
                    type="password"
                    value={form.adminPassword}
                    onChange={handleChange("adminPassword")}
                    error={errors.adminPassword}
                    placeholder="Min. 6 chars, 1 uppercase"
                    required
                    autoComplete="new-password"
                  />
                  <FormInput
                    label="Confirm Password"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange("confirmPassword")}
                    error={errors.confirmPassword}
                    placeholder="Re-enter password"
                    required
                    autoComplete="new-password"
                  />

                  <div className="flex gap-3 pt-1">
                    <button type="button" onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 transition-all active:scale-[0.98]">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12" />
                      </svg>
                      Back
                    </button>
                    <button type="submit" disabled={loading} className="flex-[2] flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed">
                      {loading ? <><SpinnerIcon /><span>Registering…</span></> : <><span>Register Company</span><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></>}
                    </button>
                  </div>
                </form>
              )}

              {/* Footer */}
              <div className="relative my-7">
                <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
                <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 font-medium">Already registered?</span></div>
              </div>
              <Link to="/login" className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 hover:border-blue-200 transition-all active:scale-[0.98]">
                Sign in instead
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}