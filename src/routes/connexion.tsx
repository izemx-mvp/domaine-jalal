import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { ArrowRight, Building2, Loader2, LineChart, Lock, Mail, Wallet } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { LogoLockup } from "@/components/brand/logo";
import { FieldLines } from "@/components/layout/field-lines";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/connexion")({
  head: () => ({
    meta: [
      { title: "Connexion — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Connectez-vous à Domaine Jalal AI pour suivre vos exploitations, vos dépenses, vos paiements et vos flux internes.",
      },
      { property: "og:title", content: "Connexion — Domaine Jalal AI" },
      {
        property: "og:description",
        content: "Pilotez votre domaine agricole depuis un seul espace centralisé.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const { login, authed, ready } = useStore();
  const navigate = useNavigate();
  const [email, setEmail] = useState("direction@domainejalal.ma");
  const [password, setPassword] = useState("Domaine2026");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (ready && authed) navigate({ to: "/dashboard" });
  }, [ready, authed, navigate]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    if (!/^[^@\s]+@[^@\s]+\.[a-z]{2,}$/i.test(email)) next.email = "Adresse e-mail invalide.";
    if (password.length < 6) next.password = "Le mot de passe doit contenir au moins 6 caractères.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setLoading(true);
    setTimeout(() => {
      login();
      toast.success("Connexion réussie. Bienvenue sur Domaine Jalal AI.");
      navigate({ to: "/dashboard" });
    }, 650);
  };

  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_0.95fr]">
      {/* Left showcase */}
      <div className="canopy-panel relative hidden flex-col justify-between overflow-hidden p-10 lg:flex">
        <FieldLines intensity="showcase" className="text-leaf" />
        <div className="relative">
          <LogoLockup tone="dark" />
        </div>
        <div className="relative max-w-xl">
          <h1 className="font-display text-4xl leading-[1.1] font-semibold text-cream">
            Pilotez votre domaine depuis un seul espace.
          </h1>
          <p className="mt-5 text-[0.95rem] leading-relaxed text-cream/75">
            Suivez vos exploitations, vos dépenses, vos paiements et vos flux depuis une plateforme
            centralisée.
          </p>
          <div className="mt-9 grid gap-3 sm:grid-cols-3">
            {[
              { icon: Building2, label: "4 exploitations", detail: "Agrumes, blé, élevage" },
              { icon: Wallet, label: "Suivi financier", detail: "Dépenses & encaissements" },
              { icon: LineChart, label: "Gestion centralisée", detail: "Une seule vision" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-2xl border border-cream/12 bg-cream/8 p-4 backdrop-blur-sm"
              >
                <item.icon className="h-4 w-4 text-leaf" />
                <div className="mt-3 text-sm font-semibold text-cream">{item.label}</div>
                <div className="text-[0.72rem] text-cream/60">{item.detail}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-[0.7rem] tracking-[0.2em] text-cream/40 uppercase">
          Gharb · Sidi Kacem · Kénitra
        </div>
      </div>

      {/* Right login card */}
      <div className="relative flex items-center justify-center bg-background px-5 py-12">
        <FieldLines className="text-primary" />
        <div className="relative w-full max-w-[420px]">
          <div className="mb-8 lg:hidden">
            <LogoLockup />
          </div>
          <div className="surface rise-in p-7">
            <span className="inline-flex rounded-full bg-accent px-3 py-1 text-[0.68rem] font-semibold tracking-wide text-canopy uppercase">
              Accès démonstration
            </span>
            <h2 className="mt-5 font-display text-2xl font-semibold">Connexion</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Utilisez les identifiants pré-remplis pour découvrir la plateforme.
            </p>

            <form onSubmit={submit} className="mt-7 space-y-5" noValidate>
              <div className="space-y-2">
                <Label htmlFor="email">Adresse e-mail</Label>
                <div className="relative">
                  <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="direction@domainejalal.ma"
                    className="h-11 pl-9"
                    aria-invalid={!!errors.email}
                  />
                </div>
                {errors.email ? <p className="text-xs text-critical">{errors.email}</p> : null}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="h-11 pl-9"
                    aria-invalid={!!errors.password}
                  />
                </div>
                {errors.password ? <p className="text-xs text-critical">{errors.password}</p> : null}
              </div>

              <div className="flex items-center justify-between">
                <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground">
                  <Checkbox
                    checked={remember}
                    onCheckedChange={(v) => setRemember(Boolean(v))}
                    aria-label="Se souvenir de moi"
                  />
                  Se souvenir de moi
                </label>
                <span className="text-xs text-muted-foreground">Domaine Jalal AI</span>
              </div>

              <Button
                type="submit"
                disabled={loading || !email || !password}
                className="group h-11 w-full rounded-xl text-sm font-semibold"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Connexion...
                  </>
                ) : (
                  <>
                    Se connecter
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </Button>
            </form>
          </div>
          <p className="mt-5 text-center text-xs text-muted-foreground">
            Environnement de démonstration — données simulées du Domaine Jalal.
          </p>
        </div>
      </div>
    </div>
  );
}
