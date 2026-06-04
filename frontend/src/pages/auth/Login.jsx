import LoginForm from "../../components/auth/LoginForm";

export default function Login() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="glass-card rounded-3xl shadow-2xl px-8 py-10">
          <div className="flex flex-col items-center gap-3 mb-8">
            <h1 className="text-4xl font-bold theme-title">
              AgentTrackAI
            </h1>

            <h2 className="text-xl font-semibold text-slate-800">
              Welcome Back
            </h2>

            <p className="text-sm text-slate-500 text-center">
              Sign in to access your dashboard
            </p>
          </div>

          <LoginForm />
        </div>
      </div>
    </div>
  );
}