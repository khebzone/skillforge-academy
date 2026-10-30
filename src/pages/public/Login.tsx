import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { Eye, EyeOff, ShieldCheck, MonitorPlay, Award } from "lucide-react";
import { useAuth } from "@/auth/AuthContext";
import { homeFor } from "@/auth/guards";
import { resetDemoData } from "@/api";
import { Logo } from "@/components/Brand";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Form";

const DEMO = [
  { label: "Admin", email: "admin@skillforge.example", password: "admin123", hint: "Manage courses & enrollments" },
  { label: "Learner", email: "priya.nair@acme.example", password: "learner123", hint: "See the learner experience" },
];

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const from = (useLocation().state as { from?: string } | null)?.from;
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={homeFor(user.role)} replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      const u = await login(email, password);
      const dest = from && from.startsWith(u.role === "admin" ? "/admin" : "/learn") ? from : homeFor(u.role);
      navigate(dest, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign in failed");
      setBusy(false);
    }
  };

  return (
    <div className="grid grid-cols-1 min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <div className="relative hidden overflow-hidden bg-ink-950 p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="pointer-events-none absolute inset-0" style={{ background: "radial-gradient(70% 60% at 100% 0%, rgb(99 102 241 / 0.5), transparent 60%), radial-gradient(50% 50% at 0% 100%, rgb(14 165 233 / 0.25), transparent 60%)" }} />
        <Logo dark className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-4xl font-semibold leading-tight tracking-tight">Learn at your own pace, wherever you are.</h2>
          <ul className="mt-8 space-y-4 text-ink-300">
            {[
              [MonitorPlay, "Video, slides and documents in one place"],
              [ShieldCheck, "Only the courses assigned to you"],
              [Award, "Earn a certificate when you finish"],
            ].map(([I, t]) => {
              const Icon = I as typeof Award;
              return (
                <li key={t as string} className="flex items-center gap-3"><span className="grid size-9 place-items-center rounded-lg bg-white/10"><Icon className="size-[18px] text-brand-300" /></span>{t as string}</li>
              );
            })}
          </ul>
        </div>
        <p className="relative text-sm text-ink-500">© {new Date().getFullYear()} Skillforge Academy</p>
      </div>

      <div className="flex flex-col justify-center bg-white px-6 py-12 sm:px-12">
        <div className="mx-auto w-full max-w-sm">
          <Logo className="mb-10 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight text-ink-900">Sign in</h1>
          <p className="mt-1.5 text-sm text-ink-500">Use the credentials provided by your organization.</p>

          <form onSubmit={submit} className="mt-8 space-y-5">
            <Field label="Email address"><Input type="email" required autoComplete="username" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@company.com" /></Field>
            <Field label="Password">
              <div className="relative">
                <Input type={show ? "text" : "password"} required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} className="pr-10" />
                <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-ink-400 hover:text-ink-700">
                  {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
              </div>
            </Field>
            {error && <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 ring-1 ring-red-200">{error}</p>}
            <Button type="submit" size="lg" className="w-full" loading={busy}>Sign in</Button>
          </form>

          <div className="mt-10 rounded-xl bg-ink-50 p-4 ring-1 ring-ink-200/70">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-500">Demo accounts</p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              {DEMO.map((d) => (
                <button
                  key={d.label}
                  type="button"
                  onClick={() => {
                    setEmail(d.email);
                    setPassword(d.password);
                    setError("");
                  }}
                  className="rounded-lg bg-white p-3 text-left ring-1 ring-ink-200 hover:ring-brand-400"
                >
                  <span className="block text-sm font-semibold text-ink-900">{d.label}</span>
                  <span className="mt-0.5 block text-xs text-ink-500">{d.hint}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                resetDemoData();
                window.location.reload();
              }}
              className="mt-3 text-xs text-ink-500 underline-offset-2 hover:text-ink-800 hover:underline"
            >
              Reset demo data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
