import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageLayout } from "@/components/site/PageLayout";
import { useI18n } from "@/lib/i18n";
import { signInWithEmail, signUpWithEmail, signInWithGoogle } from "@/lib/auth-client";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول · Advanced Koryo" },
      { name: "description", content: "سجّل دخولك أو أنشئ حساب جديد." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const { t } = useI18n();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/account" });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") navigate({ to: "/account" });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    const fn = mode === "login" ? signInWithEmail(email, password) : signUpWithEmail(email, password, fullName);
    const { error } = await fn;
    setLoading(false);
    if (error) setMsg(error.message);
    else if (mode === "register") setMsg("✓ Check your email to confirm your account, then log in.");
  }

  async function google() {
    setLoading(true);
    const result = await signInWithGoogle();
    setLoading(false);
    if (result.error) setMsg(result.error.message ?? String(result.error));
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-md px-4 py-12 lg:py-20">
        <div className="rounded-3xl border border-border bg-card p-6 lg:p-8 shadow-card">
          <h1 className="text-2xl font-bold text-center">
            {mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
          </h1>

          <button
            onClick={google}
            disabled={loading}
            className="mt-6 inline-flex items-center justify-center gap-2 w-full h-11 rounded-xl border border-border bg-background font-bold text-sm hover:bg-surface"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A10.99 10.99 0 0012 23z"/><path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 015.5 12c0-.73.13-1.44.34-2.1V7.05H2.18A11 11 0 001 12c0 1.77.42 3.45 1.18 4.95l3.66-2.85z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.05l3.66 2.85C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
            Continue with Google
          </button>

          <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
            <div className="flex-1 h-px bg-border" /> or <div className="flex-1 h-px bg-border" />
          </div>

          <form onSubmit={submit} className="space-y-3">
            {mode === "register" && (
              <label className="block">
                <div className="text-xs font-bold mb-1">Full name</div>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
              </label>
            )}
            <label className="block">
              <div className="text-xs font-bold mb-1">{t.auth.email}</div>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
            </label>
            <label className="block">
              <div className="text-xs font-bold mb-1">{t.auth.password}</div>
              <input type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full h-11 px-3 rounded-lg border border-border bg-surface text-sm font-semibold" />
            </label>
            <button type="submit" disabled={loading} className="w-full h-12 rounded-xl bg-foreground text-background font-bold hover:bg-gold hover:text-gold-foreground disabled:opacity-50">
              {loading ? "..." : mode === "login" ? t.auth.loginTitle : t.auth.registerTitle}
            </button>
          </form>

          {msg && <p className="mt-3 text-sm text-center text-muted-foreground">{msg}</p>}

          <button
            onClick={() => setMode((m) => (m === "login" ? "register" : "login"))}
            className="mt-4 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {mode === "login" ? t.auth.switchToRegister : t.auth.switchToLogin}
          </button>
        </div>
      </div>
    </PageLayout>
  );
}
