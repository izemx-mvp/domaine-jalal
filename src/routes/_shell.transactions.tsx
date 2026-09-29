import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, Banknote, Receipt, Wallet } from "lucide-react";
import { useMemo } from "react";

import { KpiCard } from "@/components/common/ui-bits";
import { TransactionsTable } from "@/components/transactions/transactions-table";
import { scopeTransactions, totals } from "@/data/selectors";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/transactions")({
  head: () => ({
    meta: [
      { title: "Transactions — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Registre complet des achats, dépenses, paiements, avances et encaissements du Domaine Jalal avec recherche, filtres et paiements partiels.",
      },
      { property: "og:title", content: "Transactions — Domaine Jalal AI" },
      {
        property: "og:description",
        content: "Registre financier complet du domaine : filtres, paiements partiels et justificatifs.",
      },
    ],
  }),
  component: TransactionsPage,
});

function TransactionsPage() {
  const { data, now, period, farmScope } = useStore();
  const scoped = useMemo(
    () => scopeTransactions(data, { period, farmId: farmScope, now }),
    [data, period, farmScope, now],
  );
  const t = totals(scoped);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Total dépenses" value={t.expenses} icon={Receipt} />
        <KpiCard label="Déjà réglé" value={t.paidOut} icon={Banknote} tone="positive" />
        <KpiCard label="Reste à payer" value={t.toPay} icon={Wallet} tone="warning" />
        <KpiCard
          label="Opérations"
          value={t.count}
          money={false}
          icon={AlertTriangle}
          comparison="Sur la période sélectionnée"
        />
      </div>

      <TransactionsTable
        transactions={scoped}
        title="Registre des transactions"
        description="Recherchez, filtrez, triez et gérez chaque opération financière du domaine."
      />
    </div>
  );
}
