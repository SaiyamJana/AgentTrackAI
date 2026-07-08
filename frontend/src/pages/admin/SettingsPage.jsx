import { useEffect, useState } from "react";
import DashboardLayout from "../../components/layout/DashboardLayout";
import Icon from "../../components/shared/Icon";
import { useAuth } from "../../context/AuthContext";
import { companyAPI, userAPI } from "../../utils/api";
import {
  ACCENT_COLORS,
  applyAccentColor,
  getStoredAccentColor,
} from "../../utils/theme.js";

const URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const VERSION = import.meta.env.VITE_VERSION || "api/v1";

export default function SettingsPage() {
  const { user } = useAuth();
  const [company, setCompany] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [showReveal, setShowReveal] = useState(false);
  const [showRegen, setShowRegen] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [action, setAction] = useState("");
  const [accentColor, setAccentColor] = useState(getStoredAccentColor());

  const handleAccentChange = (key) => {
    applyAccentColor(key);
    setAccentColor(key);
  };
  useEffect(() => {
    if (!user?.companyId) return;
    Promise.all([
      companyAPI.getById(user.companyId),
      userAPI.list({ role: "employee" }),
    ])
      .then(([compRes, usersRes]) => {
        setCompany(compRes.data ?? null);
        setEmployees(usersRes.data ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [user?.companyId]);

  const copyCode = () => {
    navigator.clipboard.writeText(company?.inviteCode ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const resetPasswordForm = () => {
    setPassword("");
    setPwError("");
    setShowReveal(false);
    setShowRegen(false);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim()) {
      setPwError("Password is required");
      return;
    }
    setPwLoading(true);
    setPwError("");
    try {
      const res = await fetch(
        `${URL}/${VERSION}/users/login`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            companyId: company?.inviteCode,
            email: user.email,
            password,
          }),
        },
      );
      if (!res.ok) throw new Error("Incorrect password");

      if (action === "reveal") {
        setRevealed(true);
        setTimeout(() => setRevealed(false), 30000);
        resetPasswordForm();
      } else if (action === "regen") {
        const r = await companyAPI.regenerateInvite(user.companyId);
        setCompany((prev) => ({ ...prev, inviteCode: r.data.inviteCode }));
        setRevealed(true);
        resetPasswordForm();
      }
    } catch {
      setPwError("Incorrect password. Please try again.");
    } finally {
      setPwLoading(false);
    }
  };

  const active = employees.filter((e) => e.isActive).length;
  const inactive = employees.filter((e) => !e.isActive).length;

  const PasswordForm = ({ title, submitLabel, submitClass }) => (
    <form
      onSubmit={handlePasswordSubmit}
      className="bg-slate-50 border border-slate-200 rounded-xl p-4 mb-3"
    >
      <p className="text-sm font-semibold text-slate-700 mb-3">{title}</p>
      <input
        type="password"
        value={password}
        onChange={(e) => {
          setPassword(e.target.value);
          setPwError("");
        }}
        placeholder="Admin password"
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm mb-2 focus:outline-none focus:ring-2 focus:border-blue-400 ${
          pwError
            ? "border-red-300 focus:ring-red-500/20"
            : "border-slate-200 focus:ring-primary/20"
        }`}
        autoFocus
      />
      {pwError && <p className="text-xs text-red-500 mb-2">{pwError}</p>}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={resetPasswordForm}
          className="flex-1 py-2 rounded-xl text-xs font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pwLoading}
          className={`flex-1 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-60 transition-colors ${submitClass}`}
        >
          {pwLoading ? "Verifying…" : submitLabel}
        </button>
      </div>
    </form>
  );

  return (
    <DashboardLayout title="Settings">
  <div className="mb-6 page-enter">
        <h2 className="text-xl font-bold text-slate-800">Settings</h2>
        <p className="text-sm text-slate-500 mt-0.5">
          Manage your company workspace and security settings.
        </p>
      </div>
      {/* Appearance */}
<div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4 page-enter-delay-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Appearance
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Choose an accent color for your workspace.
        </p>
        <div className="flex items-center gap-3">
          {Object.entries(ACCENT_COLORS).map(([key, { primary, label }]) => {
            const isActive = accentColor === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => handleAccentChange(key)}
                title={label}
                className={`relative w-11 h-11 rounded-2xl flex items-center justify-center transition-transform hover:scale-105 ${
                  isActive ? "ring-2 ring-offset-2 ring-slate-300" : ""
                }`}
                style={{ backgroundColor: primary }}
              >
                {isActive && (
                  <svg
                    className="w-5 h-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={3}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* Company details */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Company details
        </p>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-5 bg-slate-50 rounded-xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {[
              { label: "Company name", value: company?.name },
              { label: "Domain", value: company?.domain },
              { label: "Industry", value: company?.industry },
              { label: "Status", value: null, isStatus: true },
            ].map(({ label, value, isStatus }) => (
              <div
                key={label}
                className="flex items-center justify-between py-3"
              >
                <span className="text-sm text-slate-500">{label}</span>
                {isStatus ? (
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-lg ${
                      company?.isActive
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {company?.isActive ? "Active" : "Inactive"}
                  </span>
                ) : (
                  <span className="text-sm font-semibold text-slate-800">
                    {value ?? "—"}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Invite code */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5 mb-4">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
          Employee Secure Code
        </p>
        <p className="text-sm text-slate-500 mb-4">
          Share this code with employees so they can join your workspace.
          Password required to view or change.
        </p>

        {loading ? (
          <div className="h-12 bg-slate-50 rounded-xl animate-pulse" />
        ) : (
          <>
            {/* Code display */}
            <div className="bg-primary-light border border-blue-200 rounded-xl px-4 py-3 flex items-center gap-3 mb-3">
              <p className="text-sm font-bold text-primary font-mono tracking-widest flex-1 break-all select-none">
                {revealed
                  ? (company?.inviteCode ?? "—")
                  : "••••••••••••••••••••••••"}
              </p>
              <div className="flex items-center gap-2 shrink-0">
                {revealed && (
                  <button
                    onClick={copyCode}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                      copied
                        ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {copied ? "Copied!" : "Copy"}
                  </button>
                )}
                <button
                  onClick={() => {
                    if (revealed) {
                      setRevealed(false);
                      return;
                    }
                    setAction("reveal");
                    setShowReveal(true);
                    setShowRegen(false);
                    setPassword("");
                    setPwError("");
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border bg-white text-slate-600 border-slate-200 hover:bg-slate-50 transition-all"
                >
                  <Icon
                    name={revealed ? "eyeOff" : "eye"}
                    className="w-3.5 h-3.5"
                  />
                  {revealed ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>

            {/* Reveal password form */}
            {showReveal && (
              <PasswordForm
                title="Enter your password to reveal the code"
                submitLabel="Reveal"
                submitClass="bg-primary hover:bg-primary-hover"
              />
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-800 mb-4">
              Regenerating will invalidate the current code immediately.
              Employees who haven't registered yet will need the new code.
            </div>

            {/* Regenerate */}
            {!showRegen ? (
              <button
                onClick={() => {
                  setAction("regen");
                  setShowRegen(true);
                  setShowReveal(false);
                  setPassword("");
                  setPwError("");
                }}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-red-50 text-red-700 border border-red-200 hover:bg-red-100 transition-colors"
              >
                <Icon name="settings" className="w-4 h-4" />
                Regenerate code
              </button>
            ) : (
              <PasswordForm
                title="Enter your password to regenerate the code"
                submitLabel="Confirm regenerate"
                submitClass="bg-red-600 hover:bg-red-700"
              />
            )}
          </>
        )}
      </div>

      {/* Stats */}
      <div className="bg-white rounded-2xl border border-slate-100 p-5">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">
          Workspace overview
        </p>
        <div className="grid grid-cols-3 gap-3">
          {[
            {
              label: "Total employees",
              value: loading ? "…" : employees.length,
              color: "bg-primary-light text-primary",
            },
            {
              label: "Active",
              value: loading ? "…" : active,
              color: "bg-emerald-50 text-emerald-700",
            },
            {
              label: "Inactive",
              value: loading ? "…" : inactive,
              color: "bg-slate-50 text-slate-600",
            },
          ].map((k) => (
            <div key={k.label} className={`rounded-xl px-4 py-3 ${k.color}`}>
              <p className="text-2xl font-black">{k.value}</p>
              <p className="text-xs font-semibold mt-0.5 opacity-80">
                {k.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
