import { createFileRoute } from "@tanstack/react-router";
import { BarChart3, Download, FileSpreadsheet, Printer } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { CategoryDonut, ComparisonBars, InOutArea } from "@/components/charts/charts";
import { KpiCard, Money, SectionHeading } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  byCategory,
  byFarm,
  farmName,
  monthlySeries,
  paidOf,
  remainingOf,
  scopeTransactions,
  topSuppliers,
  totals,
} from "@/data/selectors";
import { formatMAD, shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/rapports")({
  head: () => ({
    meta: [
      { title: "Rapports — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Génération de rapports financiers du Domaine Jalal : synthèse par exploitation, catégorie, fournisseur et période.",
      },
      { property: "og:title", content: "Rapports — Domaine Jalal AI" },
      { property: "og:description", content: "Synthèses financières exportables du domaine agricole." },
    ],
  }),
  component: ReportsPage,
});

type ReportKind = "synthese" | "exploitations" | "categories" | "fournisseurs";

const KINDS: { value: ReportKind; label: string; description: string }[] = [
  { value: "synthese", label: "Synthèse financière", description: "Entrées, sorties et soldes de la période" },
  { value: "exploitations", label: "Par exploitation", description: "Dépenses comparées aux budgets" },
  { value: "categories", label: "Par catégorie", description: "Structure des coûts agricoles" },
  { value: "fournisseurs", label: "Par fournisseur", description: "Achats et dettes ouvertes" },
];

function ReportsPage() {
  const { data, now, period, farmScope } = useStore();
  const [kind, setKind] = useState<ReportKind>("synthese");
  const [generated, setGenerated] = useState(true);

  const scoped = useMemo(
    () => scopeTransactions(data, { period, farmId: farmScope, now }),
    [data, period, farmScope, now],
  );
  const t = totals(scoped);
  const series = useMemo(() => monthlySeries(data, farmScope, now), [data, farmScope, now]);
  const farms = useMemo(() => byFarm(data, scoped), [data, scoped]);
  const categories = useMemo(() => byCategory(scoped), [scoped]);
  const suppliers = useMemo(() => topSuppliers(data, scoped, 12), [data, scoped]);

  const exportCsv = () => {
    let rows: string[] = [];
    if (kind === "exploitations") {
      rows = ["Exploitation;Dépenses;Budget mensuel", ...farms.map((f) => `${f.name};${f.depenses};${f.budget}`)];
    } else if (kind === "categories") {
      rows = ["Catégorie;Montant", ...categories.map((c) => `${c.name};${c.value}`)];
    } else if (kind === "fournisseurs") {
      rows = ["Fournisseur;Achats;Reste dû", ...suppliers.map((s) => `${s.name};${s.total};${s.remaining}`)];
    } else {
      rows = [
        "Indicateur;Montant",
        `Dépenses;${t.expenses}`,
        `Réglé;${t.paidOut}`,
        `Reste à payer;${t.toPay}`,
        `Encaissements;${t.collected}`,
        `Créances clients;${t.toReceive}`,
        `Avances ouvriers;${t.advances}`,
      ];
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rapport-${kind}-domaine-jalal.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Rapport exporté en CSV.");
  };

  return (
    <div className="space-y-6">
      <div className="surface p-5">
        <SectionHeading
          title="Générateur de rapports"
          description="Choisissez un modèle : la période et l'exploitation suivent les filtres de l'en-tête."
        />
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <div className="min-w-[240px] space-y-2">
            <Label>Modèle de rapport</Label>
            <Select
              value={kind}
              onValueChange={(v) => {
                setKind(v as ReportKind);
                setGenerated(false);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {KINDS.map((k) => (
                  <SelectItem key={k.value} value={k.value}>
                    {k.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="gap-2"
            onClick={() => {
              setGenerated(true);
              toast.success("Rapport généré.");
            }}
          >
            <BarChart3 className="h-4 w-4" /> Générer
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <FileSpreadsheet className="h-4 w-4" /> Export CSV
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              toast.success("Export PDF simulé — le rapport est prêt à être partagé.");
            }}
          >
            <Download className="h-4 w-4" /> Export PDF
          </Button>
          <Button variant="ghost" className="gap-2" onClick={() => window.print()}>
            <Printer className="h-4 w-4" /> Imprimer
          </Button>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          {KINDS.find((k) => k.value === kind)?.description} ·{" "}
          {farmScope === "all" ? "toutes les exploitations" : farmName(data, farmScope)}
        </p>
      </div>

      {!generated ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Cliquez sur « Générer » pour produire le rapport sélectionné.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Dépenses" value={t.expenses} icon={BarChart3} />
            <KpiCard label="Réglé" value={t.paidOut} icon={BarChart3} tone="positive" />
            <KpiCard label="Reste à payer" value={t.toPay} icon={BarChart3} tone="warning" />
            <KpiCard label="Encaissements" value={t.collected} icon={BarChart3} tone="positive" />
          </div>

          {kind === "synthese" ? (
            <div className="surface p-5">
              <SectionHeading title="Entrées et sorties" description="12 derniers mois" />
              <div className="mt-4">
                <InOutArea data={series} height={300} />
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                {[
                  ["Créances clients", t.toReceive, "warning"],
                  ["Dettes fournisseurs", t.supplierDebt, "critical"],
                  ["Avances ouvriers", t.advances, "neutral"],
                ].map(([label, value, tone]) => (
                  <div key={label as string} className="rounded-2xl border border-border bg-muted/40 p-4">
                    <div className="text-xs text-muted-foreground">{label as string}</div>
                    <div className="mt-1">
                      <Money value={value as number} tone={tone as "warning" | "critical" | "neutral"} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {kind === "exploitations" ? (
            <div className="surface p-5">
              <SectionHeading title="Dépenses par exploitation" description="Comparaison au budget mensuel" />
              <div className="mt-4">
                <ComparisonBars data={farms} />
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead className="bg-muted/40 text-left text-[0.72rem] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Exploitation</th>
                      <th className="px-4 py-3 text-right">Dépenses</th>
                      <th className="px-4 py-3 text-right">Budget</th>
                      <th className="px-4 py-3 text-right">Écart</th>
                    </tr>
                  </thead>
                  <tbody>
                    {farms.map((f) => (
                      <tr key={f.name} className="border-t border-border/60">
                        <td className="px-4 py-3 font-medium">{f.name}</td>
                        <td className="px-4 py-3 text-right">
                          <Money value={f.depenses} />
                        </td>
                        <td className="num px-4 py-3 text-right text-muted-foreground">
                          {formatMAD(f.budget)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money
                            value={f.budget - f.depenses}
                            tone={f.budget - f.depenses < 0 ? "critical" : "positive"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {kind === "categories" ? (
            <div className="surface p-5">
              <SectionHeading title="Structure des coûts" description="Répartition par catégorie de dépense" />
              <div className="mt-4">
                <CategoryDonut data={categories} height={280} />
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[420px] text-sm">
                  <thead className="bg-muted/40 text-left text-[0.72rem] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Catégorie</th>
                      <th className="px-4 py-3 text-right">Montant</th>
                      <th className="px-4 py-3 text-right">Part</th>
                    </tr>
                  </thead>
                  <tbody>
                    {categories.map((c) => (
                      <tr key={c.name} className="border-t border-border/60">
                        <td className="px-4 py-3">{c.name}</td>
                        <td className="px-4 py-3 text-right">
                          <Money value={c.value} />
                        </td>
                        <td className="num px-4 py-3 text-right text-muted-foreground">
                          {t.expenses ? Math.round((c.value / t.expenses) * 100) : 0} %
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          {kind === "fournisseurs" ? (
            <div className="surface p-5">
              <SectionHeading title="Achats par fournisseur" description="Période sélectionnée" />
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead className="bg-muted/40 text-left text-[0.72rem] uppercase text-muted-foreground">
                    <tr>
                      <th className="px-4 py-3">Fournisseur</th>
                      <th className="px-4 py-3 text-right">Achats</th>
                      <th className="px-4 py-3 text-right">Reste dû</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliers.map((s) => (
                      <tr key={s.name} className="border-t border-border/60">
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-right">
                          <Money value={s.total} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money value={s.remaining} tone={s.remaining ? "warning" : "muted"} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}

          <div className="surface overflow-hidden">
            <div className="p-5 pb-3">
              <SectionHeading
                title="Détail des opérations retenues"
                description={`${scoped.length} transactions dans le périmètre du rapport`}
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead className="bg-muted/40 text-left text-[0.72rem] uppercase text-muted-foreground">
                  <tr>
                    <th className="px-5 py-3">Date</th>
                    <th className="px-3 py-3">Référence</th>
                    <th className="px-3 py-3">Exploitation</th>
                    <th className="px-3 py-3">Catégorie</th>
                    <th className="px-3 py-3 text-right">Montant</th>
                    <th className="px-3 py-3 text-right">Payé</th>
                    <th className="px-5 py-3 text-right">Reste</th>
                  </tr>
                </thead>
                <tbody>
                  {scoped
                    .slice()
                    .sort((a, b) => b.date.localeCompare(a.date))
                    .slice(0, 25)
                    .map((x) => (
                      <tr key={x.id} className="border-t border-border/60">
                        <td className="num px-5 py-2.5 text-muted-foreground">{shortDate(x.date)}</td>
                        <td className="num px-3 py-2.5 font-medium">{x.reference}</td>
                        <td className="px-3 py-2.5">{farmName(data, x.farmId)}</td>
                        <td className="px-3 py-2.5 text-muted-foreground">{x.category}</td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={x.amount} />
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          <Money value={paidOf(x)} tone="muted" />
                        </td>
                        <td className="px-5 py-2.5 text-right">
                          <Money value={remainingOf(x)} tone={remainingOf(x) ? "warning" : "muted"} />
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
