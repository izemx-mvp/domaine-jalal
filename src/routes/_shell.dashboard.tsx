import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  ArrowLeftRight,
  ArrowRight,
  Banknote,
  FileText,
  HandCoins,
  Plus,
  Receipt,
  TrendingDown,
  Wallet,
} from "lucide-react";
import { useMemo, useState } from "react";

import { CategoryDonut, ExpenseLine, FarmBars } from "@/components/charts/charts";
import { KpiCard, Money, SectionHeading, StatusBadge } from "@/components/common/ui-bits";
import { FarmNetwork } from "@/components/dashboard/farm-network";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  byCategory,
  byFarm,
  evolution,
  farmName,
  farmStats,
  monthlySeries,
  partyName,
  previousScopeTransactions,
  remainingOf,
  scopeTransactions,
  statusOf,
  totals,
} from "@/data/selectors";
import { formatMAD, relativeTime, shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/dashboard")({
  head: () => ({
    meta: [
      { title: "Tableau de bord — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Vue consolidée des dépenses, dettes fournisseurs, avances ouvriers et encaissements des quatre exploitations du Domaine Jalal.",
      },
      { property: "og:title", content: "Tableau de bord — Domaine Jalal AI" },
      {
        property: "og:description",
        content: "Pilotage financier en temps réel des exploitations agricoles du Domaine Jalal.",
      },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data, now, period, farmScope } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [formType, setFormType] = useState<"Dépense" | "Avance" | "Encaissement">("Dépense");

  const scoped = useMemo(
    () => scopeTransactions(data, { period, farmId: farmScope, now }),
    [data, period, farmScope, now],
  );
  const previous = useMemo(
    () => previousScopeTransactions(data, { period, farmId: farmScope, now }),
    [data, period, farmScope, now],
  );
  const t = totals(scoped);
  const p = totals(previous);

  const series = useMemo(() => monthlySeries(data, farmScope, now), [data, farmScope, now]);
  const farmSeries = useMemo(() => byFarm(data, scoped), [data, scoped]);
  const categories = useMemo(() => byCategory(scoped), [scoped]);

  const alerts = useMemo(() => {
    const list: { title: string; detail: string; tone: "warning" | "critical" }[] = [];
    const overdue = data.transactions
      .filter((x) => x.partyKind === "supplier" && remainingOf(x) > 0 && !x.cancelled)
      .sort((a, b) => b.date.localeCompare(a.date));
    if (overdue.length)
      list.push({
        title: `${overdue.length} factures fournisseurs non soldées`,
        detail: `Reste global ${formatMAD(overdue.reduce((s, x) => s + remainingOf(x), 0))}`,
        tone: "critical",
      });
    for (const farm of data.farms) {
      const stats = farmStats(data, farm.id, now);
      if (stats.budgetUsed > 85)
        list.push({
          title: `${farm.name} — budget à ${Math.round(stats.budgetUsed)} %`,
          detail: `${formatMAD(stats.monthExpenses)} engagés sur ${formatMAD(farm.monthlyBudget)} ce mois`,
          tone: stats.budgetUsed > 100 ? "critical" : "warning",
        });
    }
    const missingDocs = data.transactions.filter(
      (x) =>
        x.amount >= data.settings.rules.requireDocumentAbove &&
        !data.documents.some((d) => d.transactionRef === x.reference),
    );
    if (missingDocs.length)
      list.push({
        title: `${missingDocs.length} transactions sans justificatif`,
        detail: `Au-delà de ${formatMAD(data.settings.rules.requireDocumentAbove)}, un document est requis`,
        tone: "warning",
      });
    return list.slice(0, 4);
  }, [data, now]);

  const recent = useMemo(
    () => [...scoped].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 8),
    [scoped],
  );

  const quick = [
    { label: "Nouvelle dépense", icon: Receipt, type: "Dépense" as const },
    { label: "Avance ouvrier", icon: HandCoins, type: "Avance" as const },
    { label: "Encaissement client", icon: Banknote, type: "Encaissement" as const },
  ];

  return (
    <div className="space-y-7">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <KpiCard
          label="Dépenses de la période"
          value={t.expenses}
          icon={TrendingDown}
          evolution={evolution(t.expenses, p.expenses)}
          tooltip="Achats, dépenses, paiements et avances enregistrés sur la période sélectionnée."
        />
        <KpiCard
          label="Dettes fournisseurs"
          value={t.supplierDebt}
          icon={Wallet}
          tone="warning"
          comparison="Montants restant à régler"
          tooltip="Somme des restes à payer sur les factures fournisseurs."
        />
        <KpiCard
          label="Encaissements clients"
          value={t.collected}
          icon={Banknote}
          tone="positive"
          evolution={evolution(t.collected, p.collected)}
        />
        <KpiCard
          label="Avances ouvriers"
          value={t.advances}
          icon={HandCoins}
          evolution={evolution(t.advances, p.advances)}
          tooltip="Avances versées aux ouvriers, à déduire des paies."
        />
        <KpiCard
          label="Reste à payer"
          value={t.toPay}
          icon={AlertTriangle}
          tone="critical"
          comparison="Toutes exploitations confondues"
        />
        <KpiCard
          label="Transactions"
          value={t.count}
          money={false}
          icon={Receipt}
          comparison={`${data.transactions.length} au total dans le domaine`}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <SectionHeading
            title="Évolution des dépenses"
            description="12 derniers mois, toutes catégories confondues"
          />
          <div className="mt-4">
            <ExpenseLine data={series} />
          </div>
        </div>
        <div className="surface p-5">
          <SectionHeading title="Répartition par catégorie" description="Période sélectionnée" />
          <div className="mt-4">
            <CategoryDonut data={categories} height={220} />
          </div>
        </div>
      </div>

      <FarmNetwork />

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <SectionHeading
            title="Dépenses par exploitation"
            description="Comparaison directe sur la période"
          />
          <div className="mt-4">
            <FarmBars data={farmSeries} />
          </div>
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <SectionHeading title="Actions rapides" />
            <div className="mt-4 space-y-2">
              {quick.map((q) => (
                <Button
                  key={q.label}
                  variant="outline"
                  className="w-full justify-start gap-2"
                  onClick={() => {
                    setFormType(q.type);
                    setFormOpen(true);
                  }}
                >
                  <q.icon className="h-4 w-4 text-primary" /> {q.label}
                </Button>
              ))}
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link to="/flux-internes">
                  <ArrowLeftRight className="h-4 w-4 text-primary" /> Transfert interne
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link to="/documents">
                  <FileText className="h-4 w-4 text-primary" /> Joindre un justificatif
                </Link>
              </Button>
            </div>
          </div>

          <div className="surface p-5">
            <SectionHeading title="Alertes" description="Points d'attention du domaine" />
            <ul className="mt-4 space-y-3">
              {alerts.map((a) => (
                <li key={a.title} className="flex gap-3">
                  <span
                    className={
                      a.tone === "critical"
                        ? "mt-1 h-2 w-2 shrink-0 rounded-full bg-critical"
                        : "mt-1 h-2 w-2 shrink-0 rounded-full bg-warning"
                    }
                  />
                  <div className="min-w-0">
                    <div className="text-sm font-semibold">{a.title}</div>
                    <div className="text-xs text-muted-foreground">{a.detail}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface overflow-hidden lg:col-span-2">
          <div className="flex items-center justify-between p-5 pb-3">
            <SectionHeading title="Dernières transactions" description="Période sélectionnée" />
            <Button asChild variant="ghost" size="sm" className="gap-1">
              <Link to="/transactions">
                Tout voir <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-sm">
              <tbody>
                {recent.map((x) => (
                  <tr key={x.id} className="border-t border-border/60">
                    <td className="num px-5 py-3 whitespace-nowrap text-muted-foreground">
                      {shortDate(x.date)}
                    </td>
                    <td className="px-2 py-3">
                      <div className="font-semibold">{partyName(data, x)}</div>
                      <div className="text-xs text-muted-foreground">
                        {x.category} · {farmName(data, x.farmId)}
                      </div>
                    </td>
                    <td className="px-2 py-3">
                      <StatusBadge status={statusOf(x)} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Money value={x.amount} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="surface p-5">
          <SectionHeading title="Budgets du mois" description="Consommation par exploitation" />
          <div className="mt-4 space-y-4">
            {data.farms.map((f) => {
              const s = farmStats(data, f.id, now);
              return (
                <Link
                  key={f.id}
                  to="/exploitations/$slug"
                  params={{ slug: f.slug }}
                  className="block rounded-xl p-2 transition-colors hover:bg-accent/60"
                >
                  <div className="flex items-baseline justify-between gap-2 text-sm">
                    <span className="font-medium">{f.name}</span>
                    <span className="num text-xs text-muted-foreground">
                      {Math.round(s.budgetUsed)} %
                    </span>
                  </div>
                  <Progress value={Math.min(100, s.budgetUsed)} className="mt-2 h-1.5" />
                  <div className="num mt-1 text-[0.7rem] text-muted-foreground">
                    {formatMAD(s.monthExpenses, { compact: true })} /{" "}
                    {formatMAD(f.monthlyBudget, { compact: true })}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <SectionHeading title="Activité récente" description="Journal des opérations du domaine" />
        <ol className="mt-4 space-y-3">
          {data.activity.slice(0, 10).map((a) => (
            <li key={a.id} className="flex gap-3 text-sm">
              <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary/70" />
              <div className="min-w-0 flex-1">
                <div className="font-medium">{a.label}</div>
                <div className="text-xs text-muted-foreground">{a.entity}</div>
              </div>
              <span className="num shrink-0 text-xs text-muted-foreground">
                {relativeTime(a.date, now)}
              </span>
            </li>
          ))}
        </ol>
      </div>

      <Button
        onClick={() => {
          setFormType("Dépense");
          setFormOpen(true);
        }}
        className="fixed right-5 bottom-5 z-40 h-12 gap-2 rounded-full px-5 shadow-[var(--shadow-lifted)] lg:hidden"
      >
        <Plus className="h-5 w-5" /> Transaction
      </Button>

      <TransactionDialog open={formOpen} onOpenChange={setFormOpen} defaults={{ type: formType }} />
    </div>
  );
}
