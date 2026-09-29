import { createFileRoute } from "@tanstack/react-router";
import { Plus, RotateCcw, Save, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { SectionHeading } from "@/components/common/ui-bits";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/parametres")({
  head: () => ({
    meta: [
      { title: "Paramètres — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Configuration du Domaine Jalal : profil du domaine, catégories de dépenses, règles de gestion et alertes.",
      },
      { property: "og:title", content: "Paramètres — Domaine Jalal AI" },
      { property: "og:description", content: "Profil, catégories, règles et alertes du domaine." },
    ],
  }),
  component: SettingsPage,
});

const NOTIF_LABELS: { key: keyof ReturnType<typeof notifKeys>; label: string; detail: string }[] = [];
function notifKeys() {
  return {
    supplierDebt: true,
    missingDocuments: true,
    budgetAlerts: true,
    workerAdvances: true,
    internalFlows: true,
    weeklyDigest: true,
  };
}

const NOTIFS: { key: keyof ReturnType<typeof notifKeys>; label: string; detail: string }[] = [
  { key: "supplierDebt", label: "Dettes fournisseurs", detail: "Alerte quand une facture reste impayée" },
  { key: "missingDocuments", label: "Justificatifs manquants", detail: "Transactions sans document rattaché" },
  { key: "budgetAlerts", label: "Dépassements de budget", detail: "Quand une exploitation dépasse son budget" },
  { key: "workerAdvances", label: "Avances ouvriers", detail: "Avances cumulées au-delà du plafond" },
  { key: "internalFlows", label: "Flux internes", detail: "Nouveaux transferts entre exploitations" },
  { key: "weeklyDigest", label: "Résumé hebdomadaire", detail: "Synthèse envoyée chaque lundi matin" },
];

function SettingsPage() {
  const { data, updateSettings, reset } = useStore();
  const s = data.settings;

  const [domainName, setDomainName] = useState(s.domainName);
  const [currency, setCurrency] = useState(s.currency);
  const [fiscalYearStart, setFiscalYearStart] = useState(s.fiscalYearStart);
  const [language, setLanguage] = useState(s.language);
  const [newCategory, setNewCategory] = useState("");
  const [requireDoc, setRequireDoc] = useState(String(s.rules.requireDocumentAbove));
  const [maxAdvance, setMaxAdvance] = useState(String(s.rules.maxAdvancePerWorker));
  const [requireValidation, setRequireValidation] = useState(String(s.rules.requireValidationAbove));

  return (
    <div className="space-y-6">
      <SectionHeading
        title="Paramètres du domaine"
        description="Profil, catégories de dépenses, règles de gestion et alertes."
        action={
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="outline" className="gap-2">
                <RotateCcw className="h-4 w-4" /> Réinitialiser la démo
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Réinitialiser les données de démonstration ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Toutes les modifications effectuées pendant la démonstration seront remplacées par le jeu de
                  données d'origine.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => {
                    reset();
                    toast.success("Données de démonstration réinitialisées.");
                  }}
                >
                  Réinitialiser
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        }
      />

      <Tabs defaultValue="profil">
        <TabsList className="flex-wrap">
          <TabsTrigger value="profil">Profil</TabsTrigger>
          <TabsTrigger value="categories">Catégories</TabsTrigger>
          <TabsTrigger value="regles">Règles de gestion</TabsTrigger>
          <TabsTrigger value="alertes">Alertes</TabsTrigger>
          <TabsTrigger value="exploitations">Exploitations</TabsTrigger>
        </TabsList>

        <TabsContent value="profil" className="mt-4">
          <div className="surface max-w-2xl space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="p-domain">Nom du domaine</Label>
                <Input id="p-domain" value={domainName} onChange={(e) => setDomainName(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Devise</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MAD">Dirham marocain (DH)</SelectItem>
                    <SelectItem value="EUR">Euro (€)</SelectItem>
                    <SelectItem value="USD">Dollar ($)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="p-fiscal">Début d'exercice</Label>
                <Input id="p-fiscal" value={fiscalYearStart} onChange={(e) => setFiscalYearStart(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Langue de l'interface</Label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Français">Français</SelectItem>
                    <SelectItem value="Arabe">العربية</SelectItem>
                    <SelectItem value="Anglais">English</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="gap-2"
              onClick={() => {
                updateSettings({ domainName, currency, fiscalYearStart, language });
                toast.success("Profil du domaine mis à jour.");
              }}
            >
              <Save className="h-4 w-4" /> Enregistrer
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="mt-4">
          <div className="surface max-w-2xl space-y-4 p-5">
            <p className="text-sm text-muted-foreground">
              Ces catégories alimentent les formulaires de transaction et les rapports analytiques.
            </p>
            <div className="flex flex-wrap gap-2">
              {s.categories.map((c) => (
                <span
                  key={c}
                  className="flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-canopy"
                >
                  {c}
                  <button
                    aria-label={`Retirer ${c}`}
                    onClick={() => {
                      updateSettings({ categories: s.categories.filter((x) => x !== c) });
                      toast.success("Catégorie retirée.");
                    }}
                    className="text-canopy/60 transition-colors hover:text-critical"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Nouvelle catégorie (ex. Emballage)"
              />
              <Button
                className="gap-2"
                disabled={!newCategory.trim() || s.categories.includes(newCategory.trim())}
                onClick={() => {
                  updateSettings({ categories: [...s.categories, newCategory.trim()] });
                  setNewCategory("");
                  toast.success("Catégorie ajoutée.");
                }}
              >
                <Plus className="h-4 w-4" /> Ajouter
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="regles" className="mt-4">
          <div className="surface max-w-2xl space-y-4 p-5">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="r-doc">Justificatif obligatoire au-delà de (DH)</Label>
                <Input
                  id="r-doc"
                  inputMode="numeric"
                  value={requireDoc}
                  onChange={(e) => setRequireDoc(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-adv">Plafond d'avance par ouvrier (DH)</Label>
                <Input
                  id="r-adv"
                  inputMode="numeric"
                  value={maxAdvance}
                  onChange={(e) => setMaxAdvance(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="r-val">Validation direction au-delà de (DH)</Label>
                <Input
                  id="r-val"
                  inputMode="numeric"
                  value={requireValidation}
                  onChange={(e) => setRequireValidation(e.target.value.replace(/\D/g, ""))}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-2xl border border-border p-4">
              <div>
                <div className="text-sm font-semibold">Bloquer les dépenses hors budget</div>
                <div className="text-xs text-muted-foreground">
                  Empêche l'enregistrement quand le budget mensuel est dépassé
                </div>
              </div>
              <Switch
                checked={s.rules.blockOverBudget}
                onCheckedChange={(v) => {
                  updateSettings({ rules: { ...s.rules, blockOverBudget: v } });
                  toast.success("Règle mise à jour.");
                }}
              />
            </div>

            <Button
              className="gap-2"
              onClick={() => {
                updateSettings({
                  rules: {
                    ...s.rules,
                    requireDocumentAbove: Number(requireDoc || 0),
                    maxAdvancePerWorker: Number(maxAdvance || 0),
                    requireValidationAbove: Number(requireValidation || 0),
                  },
                });
                toast.success("Règles de gestion enregistrées.");
              }}
            >
              <Save className="h-4 w-4" /> Enregistrer les règles
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="alertes" className="mt-4">
          <div className="surface max-w-2xl divide-y divide-border p-2">
            {NOTIFS.map((n) => (
              <div key={n.key} className="flex items-center justify-between gap-4 px-3 py-3.5">
                <div>
                  <div className="text-sm font-semibold">{n.label}</div>
                  <div className="text-xs text-muted-foreground">{n.detail}</div>
                </div>
                <Switch
                  checked={s.notifications[n.key]}
                  onCheckedChange={(v) => {
                    updateSettings({ notifications: { ...s.notifications, [n.key]: v } });
                    toast.success(v ? "Alerte activée." : "Alerte désactivée.");
                  }}
                />
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="exploitations" className="mt-4">
          <div className="grid gap-3 md:grid-cols-2">
            {data.farms.map((f) => (
              <div key={f.id} className="surface p-5">
                <div className="font-display text-base font-semibold">{f.name}</div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {f.activity} · {f.hectares} ha · {f.location}
                </p>
                <dl className="mt-3 space-y-1.5 text-sm">
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Responsable</dt>
                    <dd className="font-medium">{f.manager}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Budget mensuel</dt>
                    <dd className="num font-medium">
                      {f.monthlyBudget.toLocaleString("fr-FR")} DH
                    </dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-muted-foreground">Budget annuel</dt>
                    <dd className="num font-medium">{f.annualBudget.toLocaleString("fr-FR")} DH</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
