import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { FormInput } from "../../components/auth/FormInput.jsx";
import { AuthPanel }  from "../../components/auth/AuthPanel.jsx";
import { useAuth }    from "../../context/AuthContext.jsx";
import { authAPI }    from "../../utils/api.js";
import { BrandLogo } from "../../components/auth/BrandLogo.jsx";
const INDUSTRIES = ["Technology","Finance","Healthcare","Education","Retail","Manufacturing","Media","Legal","Other"];
const Spin = () => <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>;

export default function RegisterCompanyPage() {
  const navigate  = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ companyName:"", domain:"", industry:"", adminName:"", adminEmail:"", adminPassword:"", confirmPassword:"" });
  const [errors,   setErrors]   = useState({});
  const [apiError, setApiError] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [done,     setDone]     = useState(null);

  const h = (f) => (e) => { setForm(p => ({...p,[f]:e.target.value})); setErrors(p=>({...p,[f]:""})); setApiError(""); };

  const validate = () => {
    const e = {};
    if (!form.companyName.trim()) e.companyName = "Required";
    if (!form.domain.trim())      e.domain = "Required";
    if (!form.adminName.trim())   e.adminName = "Required";
    if (!form.adminEmail)         e.adminEmail = "Required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail)) e.adminEmail = "Invalid email";
    if (!form.adminPassword)      e.adminPassword = "Required";
    else if (form.adminPassword.length < 6) e.adminPassword = "Min 6 chars";
    if (form.adminPassword !== form.confirmPassword) e.confirmPassword = "Passwords don't match";
    return e;
  };

  const submit = async (ev) => {
    ev.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) return setErrors(errs);
    setLoading(true);
    try {
      const { confirmPassword, ...payload } = form;
      const data = await authAPI.registerCompany(payload);
      localStorage.setItem("companyId", data.data.company._id);
      login(data.data.accessToken);
      setDone({ inviteCode: data.data.inviteCode, companyId: data.data.company._id });
    } catch (err) { setApiError(err.message); }
    finally { setLoading(false); }
  };

  if (done) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white rounded-2xl border border-slate-100 shadow-lg p-8 max-w-md w-full text-center">
        <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
        </div>
        <h2 className="text-xl font-black text-slate-800 mb-2">Company registered!</h2>
        <p className="text-sm text-slate-500 mb-6">Share the Secure Code with your employees so they can register.</p>
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 mb-4">
  <p className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-2">Employee Secure Code</p>
  <div className="flex items-center gap-2 bg-white border border-blue-100 rounded-lg px-3 py-2.5">
    <p className="text-sm font-bold text-blue-800 font-mono tracking-tight break-all flex-1">
      {done.inviteCode}
    </p>
    <button
      type="button"
      onClick={() => navigator.clipboard.writeText(done.inviteCode)}
      className="text-[10px] font-semibold px-2.5 py-1.5 rounded-md bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors shrink-0"
    >
      Copy
    </button>
  </div>
</div>
        <button onClick={() => navigate("/admin/dashboard")} className="w-full py-3 rounded-xl bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 transition-colors">Go to Admin Dashboard →</button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-slate-50">
      <div className="hidden lg:block lg:w-[45%] shrink-0"><AuthPanel /></div>
      <div className="flex-1 flex flex-col justify-center px-8 sm:px-12 xl:px-16 py-12 bg-white overflow-y-auto">
        <div className="lg:hidden mb-7"><BrandLogo size="md" /></div>
        <div className="w-full max-w-md mx-auto">
          <div className="mb-7">
            <p className="text-xs font-bold text-blue-600 tracking-widest uppercase mb-2">Company Registration</p>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight">Register your company</h1>
            <p className="mt-2 text-sm text-slate-500">Creates your company account and your Admin login.</p>
          </div>
          {apiError && <div className="mb-5 bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3.5 rounded-xl">{apiError}</div>}
          <form onSubmit={submit} noValidate className="space-y-4">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Company Details</p>
            <FormInput label="Company Name" type="text" value={form.companyName} onChange={h("companyName")} error={errors.companyName} placeholder="Acme Corp" required />
            <FormInput label="Domain"       type="text" value={form.domain}      onChange={h("domain")}      error={errors.domain}      placeholder="acme.com"  required />
            <div>
              <label className="block text-sm font-semibold text-slate-600 mb-1.5">Industry</label>
              <select value={form.industry} onChange={h("industry")} className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 bg-white text-sm text-slate-800 outline-none focus:border-blue-500">
                <option value="">Select…</option>
                {INDUSTRIES.map(i => <option key={i}>{i}</option>)}
              </select>
            </div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest pt-2">Your Admin Account</p>
            <FormInput label="Your Full Name"  type="text"     value={form.adminName}        onChange={h("adminName")}        error={errors.adminName}        placeholder="Jane Doe"    required />
            <FormInput label="Your Email"      type="email"    value={form.adminEmail}       onChange={h("adminEmail")}       error={errors.adminEmail}       placeholder="you@co.com"  required />
            <FormInput label="Password"        type="password" value={form.adminPassword}    onChange={h("adminPassword")}    error={errors.adminPassword}    placeholder="Min 6 chars" required />
            <FormInput label="Confirm Password" type="password" value={form.confirmPassword} onChange={h("confirmPassword")} error={errors.confirmPassword}  placeholder="Re-enter"    required />
            <button type="submit" disabled={loading} className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-xl font-bold text-sm text-white bg-linear-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-lg shadow-blue-200 disabled:opacity-60 mt-2">
              {loading ? <><Spin/><span>Registering…</span></> : "Register Company"}
            </button>
          </form>
          <div className="relative my-7"><div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-100"/></div><div className="relative flex justify-center"><span className="bg-white px-3 text-xs text-slate-400">Already have an account?</span></div></div>
          <Link to="/login" className="w-full flex items-center justify-center py-3.5 rounded-xl font-bold text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 border-2 border-blue-100 transition-all">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
