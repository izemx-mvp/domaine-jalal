import { createFileRoute } from "@tanstack/react-router";
import { Banknote, HandCoins, TrendingDown, Wallet } from "lucide-react";
import { useMemo } from "react";

import { CategoryDonut, HorizontalBars, InOutArea } from "@/components/charts/charts";
import { KpiCard, Money, SectionHeading, StatusBadge } from "@/components/common/ui-bits";
import {
  byCategory,
  evolution,
  farmName,
  monthlySeries,
  partyName,
  previousScopeTransactions,
  remainingOf,
  scopeTransactions,
  statusOf,
  topSuppliers,
  totals,
} from "@/data/selectors";
import { shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/finance")({
  head: () => ({
    meta: [
      { title: "Finance — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Analyse financière du Domaine Jalal : entrées et sorties, dettes fournisseurs, avances ouvriers et créances clients.",
      },
      { property: "og:title", content: "Finance — Domaine Jalal AI" },
      {
        property: "og:description",
        content: "Trésorerie, dettes et créances consolidées du domaine agricole.",
      },
    ],
  }),
  component: FinancePage,
});

function FinancePage() {
  const { data, now, period, farmScope } = useStore();
  const scoped = useMemo(
    () => scopeTransactions(data, { period, farmId: farmScope, now }),
    [data, period, farmScope, now],
  );
  const prev = useMemo(
    () => previousScopeTransactions(data, { period, farmId: farmScope, now }),
    [data, period, farmScope, now],
  );
  const t = totals(scoped);
  const p = totals(prev);
  const series = useMemo(() => monthlySeries(data, farmScope, now), [data, farmScope, now]);
  const debts = useMemo(() => topSuppliers(data, data.transactions, 8), [data]);
  const categories = useMemo(() => byCategory(scoped), [scoped]);

  const unpaid = useMemo(
    () =>
      data.transactions
        .filter((x) => remainingOf(x) > 0 && !x.cancelled)
        .sort((a, b) => remainingOf(b) - remainingOf(a))
        .slice(0, 10),
    [data],
  );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Sorties de trésorerie"
          value={t.paidOut}
          icon={TrendingDown}
          evolution={evolution(t.paidOut, p.paidOut)}
        />
        <KpiCard
          label="Entrées encaissées"
          value={t.collected}
          icon={Banknote}
          tone="positive"
          evolution={evolution(t.collected, p.collected)}
        />
        <KpiCard label="Dettes fournisseurs" value={t.supplierDebt} icon={Wallet} tone="warning" />
        <KpiCard
          label="Avances ouvriers"
          value={t.advances}
          icon={HandCoins}
          comparison={`Paiements de paie : ${Math.round(t.workerPayments).toLocaleString("fr-FR")} DH`}
        />
      </div>

      <div className="surface p-5">
        <SectionHeading
          title="Entrées et sorties"
          description="Comparaison mensuelle sur les 12 derniers mois"
        />
        <div className="mt-4">
          <InOutArea data={series} height={300} />
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface p-5">
          <SectionHeading title="Principaux fournisseurs" description="Volume d'achats cumulé" />
          <div className="mt-4">
            <HorizontalBars data={debts} dataKey="total" height={300} />
          </div>
        </div>
        <div className="surface p-5">
          <SectionHeading title="Restes à payer par fournisseur" description="Dettes ouvertes" />
          <div className="mt-4">
            <HorizontalBars
              data={debts.filter((d) => d.remaining > 0)}
              dataKey="remaining"
              height={300}
              color="var(--color-chart-4)"
            />
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5">
          <SectionHeading title="Structure des coûts" description="Période sélectionnée" />
          <div className="mt-4">
            <CategoryDonut data={categories} height={240} />
          </div>
        </div>

        <div className="surface overflow-hidden lg:col-span-2">
          <div className="p-5 pb-3">
            <SectionHeading
              title="Échéances les plus lourdes"
              description="Montants restant à régler, tous tiers confondus"
            />
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-muted/40 text-left text-[0.72rem] uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Référence</th>
                  <th className="px-3 py-3">Tiers</th>
                  <th className="px-3 py-3">Exploitation</th>
                  <th className="px-3 py-3">Statut</th>
                  <th className="px-5 py-3 text-right">Reste</th>
                </tr>
              </thead>
              <tbody>
                {unpaid.map((x) => (
                  <tr key={x.id} className="border-t border-border/60">
                    <td className="px-5 py-3">
                      <div className="num font-semibold">{x.reference}</div>
                      <div className="num text-xs text-muted-foreground">{shortDate(x.date)}</div>
                    </td>
                    <td className="px-3 py-3">{partyName(data, x)}</td>
                    <td className="px-3 py-3 text-muted-foreground">{farmName(data, x.farmId)}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={statusOf(x)} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Money value={remainingOf(x)} tone="warning" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
