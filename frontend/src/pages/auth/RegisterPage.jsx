import { useState } from "react";

function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
import { useNavigate, Link } from "react-router-dom";
import { FormInput } from "../../components/auth/FormInput.jsx";
import { AuthPanel }  from "../../components/auth/AuthPanel.jsx";
import { useAuth }    from "../../context/AuthContext.jsx";
import { authAPI }    from "../../utils/api.js";

const DEPARTMENTS = ["Engineering","Product","Design","Marketing","Sales","Operations","HR","Finance","Legal","Other"];

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

const PasswordStrength = ({ password }) => {
  if (!password) return null;
  const checks = [password.length >= 6, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)];
  const score = checks.filter(Boolean).length;
  const labels = ["","Weak","Fair","Good","Strong"];
  const colors = ["","bg-red-400","bg-orange-400","bg-yellow-400","bg-green-500"];
  const textColors = ["","text-red-500","text-orange-500","text-yellow-600","text-green-600"];
  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1,2,3,4].map(i => <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= score ? colors[score] : "bg-slate-100"}`} />)}
      </div>
      <p className={`text-xs font-medium ${textColors[score]}`}>{labels[score]}</p>
    </div>
  );
};

export default function RegisterPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    inviteCode: "", name: "", email: "", password: "", confirmPassword: "",
    department: "", designation: "",
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);

  const handle = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  const validateStep1 = () => {
    const e = {};
    if (!form.inviteCode.trim()) e.inviteCode = "Invite code is required";
    if (!form.name.trim())       e.name       = "Full name is required";
    if (!form.email)             e.email      = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.password)          e.password   = "Password is required";
    else if (form.password.length < 6) e.password = "Min 6 characters";
    if (form.password !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleNext = (e) => {
    e.preventDefault();
    const errs = validateStep1();
    if (Object.keys(errs).length) return setErrors(errs);
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.department)       return setErrors({ department: "Please select a department" });
    if (!form.designation.trim()) return setErrors({ designation: "Designation is required" });

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data    = await authAPI.register(payload);
      const decoded = login(data.data.accessToken);
      // Store companyId for future logins
      if (decoded.companyId) localStorage.setItem("companyId", decoded.companyId);
      navigate("/employee/dashboard");
    } catch (err) {
      setApiError(err.message);
      setStep(1);
    } finally {
      setLoading(false);
    }
  };

  return (
<<<<<<< HEAD
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
=======
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-[45%] shrink-0"><AuthPanel /></div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12 bg-white relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-[80px] z-0" />
        <div className="relative z-10 w-full max-w-md mx-auto">

          <div className="mb-7">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">Employee sign up</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Join your team</h1>
            <p className="mt-2 text-sm text-slate-500">You need an invite code from your Admin to register.</p>
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-3 mb-8">
            {[1,2].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-300 ${step >= s ? "bg-blue-600 text-white shadow-md shadow-blue-200" : "bg-slate-100 text-slate-400"}`}>
                  {step > s ? <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7"/></svg> : s}
                </div>
                <span className={`text-xs font-semibold ${step >= s ? "text-blue-700" : "text-slate-400"}`}>{s === 1 ? "Credentials" : "Profile"}</span>
                {s < 2 && <div className={`w-8 h-0.5 rounded ${step > s ? "bg-blue-300" : "bg-slate-100"}`} />}
              </div>
            ))}
          </div>

          {apiError && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.4₁₄-₁.₄₁₄L₁₀ 8.586 8.7₀₇ 7.293z" clipRule="evenodd"/>
              </svg>
              {apiError}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleNext} noValidate className="space-y-5">
              <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <p className="text-xs text-blue-700 font-semibold">Ask your Admin for the invite code before registering.</p>
              </div>
              <FormInput label="Invite Code" type="text" value={form.inviteCode} onChange={handle("inviteCode")} error={errors.inviteCode} placeholder="24-character code from Admin" required />
              <FormInput label="Full Name"   type="text" value={form.name}       onChange={handle("name")}       error={errors.name}       placeholder="Jane Doe" required autoComplete="name" />
              <FormInput label="Email"       type="email" value={form.email}     onChange={handle("email")}      error={errors.email}      placeholder="you@company.com" required autoComplete="email" />
              <div>
                <FormInput label="Password" type="password" value={form.password} onChange={handle("password")} error={errors.password} placeholder="Min 6 chars" required autoComplete="new-password" />
                <PasswordStrength password={form.password} />
              </div>
              <FormInput label="Confirm Password" type="password" value={form.confirmPassword} onChange={handle("confirmPassword")} error={errors.confirmPassword} placeholder="Re-enter password" required autoComplete="new-password" />
              <button type="submit" className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 mt-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200">
                <span>Continue</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7l5 5m0 0l-5 5m5-5H6"/></svg>
              </button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit} noValidate className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-slate-600 mb-1.5">Department <span className="text-blue-500">*</span></label>
                <select value={form.department} onChange={handle("department")}
                  className={`w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-800 text-sm outline-none transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-50 ${errors.department ? "border-red-400" : "border-slate-200 hover:border-slate-300"}`}>
                  <option value="" disabled>Select your department…</option>
                  {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.department && <p className="mt-1.5 text-xs text-red-500">{errors.department}</p>}
              </div>
              <FormInput label="Designation / Job Title" type="text" value={form.designation} onChange={handle("designation")} error={errors.designation} placeholder="e.g. Senior Developer" required />
              <div className="flex gap-3 pt-1">
                <button type="button" onClick={() => setStep(1)} className="flex-1 flex items-center justify-center gap-2 py-3.5 px-5 rounded-xl font-bold text-sm text-slate-600 bg-slate-100 hover:bg-slate-200 border-2 border-slate-200 transition-all active:scale-[0.98]">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 17l-5-5m0 0l5-5m-5 5h12"/></svg>
                  Back
                </button>
                <button type="submit" disabled={loading} className="flex-2 flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-bold text-sm text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-60">
                  {loading ? <><SpinnerIcon /><span>Creating…</span></> : <><span>Create Account</span><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7"/></svg></>}
                </button>
              </div>
            </form>
          )}

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"/></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 font-medium">Already have an account?</span></div>
          </div>
          <Link to="/login" className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 transition-all active:scale-[0.98]">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}
>>>>>>> 38b3bf62ea154c027eae0e4b374f3e015527f197
