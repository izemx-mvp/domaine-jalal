import { CalendarDays, FileText, MapPin, Plus, Users } from "lucide-react";
import { toast } from "sonner";

import { Money, PaymentProgress, StatusBadge, TypeBadge } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { farmName, paidOf, partyName, remainingOf, statusOf } from "@/data/selectors";
import type { Transaction } from "@/data/types";
import { formatDate, formatMAD, relativeTime } from "@/lib/format";
import { useStore } from "@/store/app-store";

export function TransactionDrawer({
  transaction,
  open,
  onOpenChange,
  onAddPayment,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onAddPayment: (t: Transaction) => void;
}) {
  const { data, now } = useStore();
  if (!transaction) return null;

  const paid = paidOf(transaction);
  const remaining = remainingOf(transaction);
  const status = statusOf(transaction);
  const docs = data.documents.filter((d) => d.transactionRef === transaction.reference);

  const rows: [string, string][] = [
    ["Référence", transaction.reference],
    ["Date", formatDate(transaction.date)],
    ["Type", transaction.type],
    ["Catégorie", transaction.category],
    ["Mode de paiement", transaction.method],
    ["Source", transaction.source],
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[520px]">
        <SheetHeader className="pb-0">
          <div className="flex items-center gap-2">
            <TypeBadge type={transaction.type} />
            <StatusBadge status={status} />
          </div>
          <SheetTitle className="num mt-2 font-display text-xl">{transaction.reference}</SheetTitle>
          <SheetDescription>{transaction.description}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-8">
          <div className="surface bg-muted/40 p-4">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[0.7rem] text-muted-foreground">Montant total</div>
                <div className="num font-display text-2xl font-semibold">
                  {formatMAD(transaction.amount)}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[0.7rem] text-muted-foreground">Reste</div>
                <Money value={remaining} tone={remaining ? "warning" : "positive"} />
              </div>
            </div>
            <div className="mt-4">
              <PaymentProgress paid={paid} total={transaction.amount} />
            </div>
            {remaining > 0 && !transaction.cancelled ? (
              <Button
                size="sm"
                className="mt-4 w-full gap-2"
                onClick={() => onAddPayment(transaction)}
              >
                <Plus className="h-4 w-4" /> Ajouter un paiement
              </Button>
            ) : null}
          </div>

          <section>
            <h3 className="font-display text-sm font-semibold">Informations générales</h3>
            <dl className="mt-3 grid gap-2 text-sm">
              {rows.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-border/60 pb-2">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="num text-right font-medium">{v}</dd>
                </div>
              ))}
            </dl>
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            <div className="surface p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin className="h-3.5 w-3.5" /> Exploitation
              </div>
              <div className="mt-1.5 text-sm font-semibold">{farmName(data, transaction.farmId)}</div>
            </div>
            <div className="surface p-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users className="h-3.5 w-3.5" /> Tiers
              </div>
              <div className="mt-1.5 text-sm font-semibold">{partyName(data, transaction)}</div>
            </div>
          </section>

          <section>
            <h3 className="font-display text-sm font-semibold">Historique des paiements</h3>
            {transaction.payments.length ? (
              <ul className="mt-3 space-y-3">
                {transaction.payments.map((p) => (
                  <li key={p.id} className="flex gap-3">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-3">
                        <span className="text-sm font-medium">{formatMAD(p.amount)}</span>
                        <span className="num text-xs text-muted-foreground">{formatDate(p.date)}</span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {p.method} · {p.reference}
                      </div>
                      {p.note ? <div className="text-xs text-muted-foreground/80">{p.note}</div> : null}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Aucun paiement enregistré.</p>
            )}
          </section>

          <section>
            <h3 className="font-display text-sm font-semibold">Justificatifs</h3>
            {docs.length ? (
              <ul className="mt-3 space-y-2">
                {docs.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center gap-3 rounded-xl border border-border bg-card px-3 py-2"
                  >
                    <FileText className="h-4 w-4 text-primary" />
                    <span className="min-w-0 flex-1 truncate text-sm">{d.name}</span>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => toast.success("Téléchargement simulé du justificatif.")}
                    >
                      Télécharger
                    </Button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-muted-foreground">Aucun justificatif joint.</p>
            )}
          </section>

          <Separator />

          <section>
            <h3 className="font-display text-sm font-semibold">Chronologie</h3>
            <ul className="mt-3 space-y-3 text-sm">
              <li className="flex gap-3">
                <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                <div>
                  <div className="font-medium">Transaction créée</div>
                  <div className="text-xs text-muted-foreground">
                    {formatDate(transaction.date)} · {relativeTime(transaction.date, now)} · source{" "}
                    {transaction.source}
                  </div>
                </div>
              </li>
              {transaction.payments.map((p) => (
                <li key={p.id} className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Paiement de {formatMAD(p.amount)}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatDate(p.date)} · {p.method}
                    </div>
                  </div>
                </li>
              ))}
              {remaining === 0 ? (
                <li className="flex gap-3">
                  <CalendarDays className="mt-0.5 h-4 w-4 text-primary" />
                  <div>
                    <div className="font-medium">Transaction soldée</div>
                    <div className="text-xs text-muted-foreground">Statut passé à « Payé »</div>
                  </div>
                </li>
              ) : null}
            </ul>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
