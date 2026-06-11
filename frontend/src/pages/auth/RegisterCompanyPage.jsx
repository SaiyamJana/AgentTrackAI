import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FormInput } from "../../components/auth/FormInput.jsx";
import { AuthPanel }  from "../../components/auth/AuthPanel.jsx";
import { useAuth }    from "../../context/AuthContext.jsx";
import { authAPI }    from "../../utils/api.js";

const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Retail","Manufacturing","Media","Legal","Other"];
const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
  </svg>
);

export default function RegisterCompanyPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    companyName:"", domain:"", industry:"",
    adminName:"", adminEmail:"", adminPassword:"", confirmPassword:"",
  });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(null); // { inviteCode, companyId }

  const handle = (field) => (e) => {
    setForm(prev => ({ ...prev, [field]: e.target.value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: "" }));
    if (apiError) setApiError("");
  };

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Company name is required";
    if (!form.domain.trim())      e.domain      = "Domain is required";
    if (!form.adminName.trim())   e.adminName   = "Your name is required";
    if (!form.adminEmail)         e.adminEmail  = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) e.adminEmail = "Enter a valid email";
    if (!form.adminPassword)      e.adminPassword = "Password is required";
    else if (form.adminPassword.length < 6) e.adminPassword = "Min 6 characters";
    if (form.adminPassword !== form.confirmPassword) e.confirmPassword = "Passwords do not match";
    return e;
  };

  const handleSubmit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);

    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data = await authAPI.registerCompany(payload);
      // Show the invite code — don't auto-login as admin yet, let them copy it first
      setDone({ inviteCode: data.data.inviteCode, companyId: data.data.company._id });
      // Auto-login the admin
      localStorage.setItem("companyId", data.data.company._id);
      login(data.data.accessToken);
    } catch (err) {
      setApiError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-xl font-black text-slate-800 mb-2">Company registered!</h2>
          <p className="text-sm text-slate-500 mb-6">Share this invite code with your employees so they can register.</p>

          <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-6">
            <p className="text-xs font-semibold text-blue-600 uppercase tracking-widest mb-1">Employee Invite Code</p>
            <p className="text-xl font-black text-blue-800 font-mono tracking-widest break-all">{done.inviteCode}</p>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 mb-6 text-left">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1">Company ID (for login)</p>
            <p className="text-sm font-mono text-slate-700 break-all">{done.companyId}</p>
          </div>

          <p className="text-xs text-slate-400 mb-6">You can regenerate the invite code anytime from Admin settings if it is compromised.</p>

          <button
            onClick={() => navigate("/admin/dashboard")}
            className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors"
          >
            Go to Admin Dashboard →
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="w-[45%] shrink-0"><AuthPanel /></div>

      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12 bg-white relative overflow-y-auto">
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-bl-[80px] z-0" />
        <div className="relative z-10 w-full max-w-md mx-auto">

          <div className="mb-7">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">Company registration</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight leading-tight">Register your company</h1>
            <p className="mt-2 text-sm text-slate-500">This creates your company account and your Admin login.</p>
          </div>

          {apiError && (
            <div className="mb-5 flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">
              <svg className="w-4 h-4 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              {apiError}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-1">Company details</p>
            <FormInput label="Company Name" type="text" value={form.companyName} onChange={handle("companyName")} error={errors.companyName} placeholder="Acme Corp" required />
            <FormInput label="Domain" type="text" value={form.domain} onChange={handle("domain")} error={errors.domain} placeholder="acme.com" required />

            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Industry</label>
              <select value={form.industry} onChange={handle("industry")}
                className="w-full px-4 py-3 rounded-xl border-2 bg-white text-slate-800 text-sm outline-none transition-all focus:border-blue-500 border-slate-200 hover:border-slate-300">
                <option value="">Select industry…</option>
                {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
              </select>
            </div>

            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Your Admin account</p>
            <FormInput label="Your Full Name" type="text" value={form.adminName} onChange={handle("adminName")} error={errors.adminName} placeholder="Jane Doe" required />
            <FormInput label="Your Email" type="email" value={form.adminEmail} onChange={handle("adminEmail")} error={errors.adminEmail} placeholder="you@acme.com" required />
            <FormInput label="Password" type="password" value={form.adminPassword} onChange={handle("adminPassword")} error={errors.adminPassword} placeholder="Min 6 characters" required />
            <FormInput label="Confirm Password" type="password" value={form.confirmPassword} onChange={handle("confirmPassword")} error={errors.confirmPassword} placeholder="Re-enter password" required />

            <button type="submit" disabled={loading}
              className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 mt-2 rounded-xl font-bold text-sm text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 active:scale-[0.98] transition-all shadow-lg shadow-blue-200 disabled:opacity-60 disabled:cursor-not-allowed">
              {loading ? <><SpinnerIcon /><span>Registering…</span></> : <><span>Register Company</span><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg></>}
            </button>
          </form>

          <div className="relative my-7">
            <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100" /></div>
            <div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400 font-medium">Already have an account?</span></div>
          </div>
          <Link to="/login" className="w-full flex items-center justify-center gap-2 py-3.5 px-6 rounded-xl font-bold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 transition-all active:scale-[0.98]">Sign in instead</Link>
        </div>
      </div>
    </div>
  );
}