import {
  Download,
  Filter,
  MoreHorizontal,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  Money,
  Pager,
  SectionHeading,
  SortHeader,
  StatusBadge,
  TypeBadge,
  statusTone,
} from "@/components/common/ui-bits";
import { PaymentDialog } from "@/components/transactions/payment-dialog";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
import { TransactionDrawer } from "@/components/transactions/transaction-drawer";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { farmName, paidOf, partyName, remainingOf, statusOf } from "@/data/selectors";
import {
  PAYMENT_METHODS,
  STATUSES,
  TRANSACTION_TYPES,
  type Transaction,
  type TransactionStatus,
} from "@/data/types";
import { useTable } from "@/hooks/use-table";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/app-store";

type Field = "date" | "amount" | "remaining" | "farm" | "party" | "type" | "status";

const ALL = "__all__";

export function TransactionsTable({
  transactions,
  title,
  description,
  showFarmColumn = true,
  className,
  defaults,
}: {
  transactions: Transaction[];
  title?: string;
  description?: string;
  showFarmColumn?: boolean;
  className?: string;
  defaults?: Partial<Transaction>;
}) {
  const { data, deleteTransaction, updateTransaction } = useStore();

  const [type, setType] = useState<string>(ALL);
  const [status, setStatus] = useState<string>(ALL);
  const [category, setCategory] = useState<string>(ALL);
  const [method, setMethod] = useState<string>(ALL);
  const [farm, setFarm] = useState<string>(ALL);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [payFor, setPayFor] = useState<Transaction | null>(null);
  const [detail, setDetail] = useState<Transaction | null>(null);
  const [toDelete, setToDelete] = useState<Transaction | null>(null);

  const filters = [type, status, category, method, farm].filter((v) => v !== ALL).length +
    [from, to, min, max].filter(Boolean).length;

  const filtered = useMemo(
    () =>
      transactions.filter((t) => {
        if (type !== ALL && t.type !== type) return false;
        if (status !== ALL && statusOf(t) !== status) return false;
        if (category !== ALL && t.category !== category) return false;
        if (method !== ALL && t.method !== method) return false;
        if (farm !== ALL && t.farmId !== farm) return false;
        if (from && t.date < from) return false;
        if (to && t.date > `${to}T23:59:59`) return false;
        if (min && t.amount < Number(min)) return false;
        if (max && t.amount > Number(max)) return false;
        return true;
      }),
    [transactions, type, status, category, method, farm, from, to, min, max],
  );

  const table = useTable<Transaction, Field>(filtered, {
    initialSort: { field: "date", dir: "desc" },
    sortValue: (t, field) => {
      switch (field) {
        case "amount":
          return t.amount;
        case "remaining":
          return remainingOf(t);
        case "farm":
          return farmName(data, t.farmId);
        case "party":
          return partyName(data, t);
        case "type":
          return t.type;
        case "status":
          return statusOf(t);
        default:
          return t.date;
      }
    },
    searchText: (t) =>
      [t.reference, t.description, t.category, t.type, partyName(data, t), farmName(data, t.farmId)].join(" "),
  });

  const resetFilters = () => {
    setType(ALL);
    setStatus(ALL);
    setCategory(ALL);
    setMethod(ALL);
    setFarm(ALL);
    setFrom("");
    setTo("");
    setMin("");
    setMax("");
  };

  const exportCsv = () => {
    const header = "Référence;Date;Type;Catégorie;Exploitation;Tiers;Montant;Payé;Reste;Statut";
    const lines = table.all.map((t) =>
      [
        t.reference,
        shortDate(t.date),
        t.type,
        t.category,
        farmName(data, t.farmId),
        partyName(data, t),
        t.amount,
        paidOf(t),
        remainingOf(t),
        statusOf(t),
      ].join(";"),
    );
    const blob = new Blob([[header, ...lines].join("\n")], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "transactions-domaine-jalal.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${table.all.length} transactions exportées.`);
  };

  return (
    <div className={cn("space-y-4", className)}>
      {title ? (
        <SectionHeading
          title={title}
          description={description}
          action={
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nouvelle transaction
            </Button>
          }
        />
      ) : null}

      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={table.query}
              onChange={(e) => table.setQuery(e.target.value)}
              placeholder="Rechercher une référence, un tiers, une catégorie..."
              className="pl-9"
            />
          </div>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="gap-2">
                <Filter className="h-4 w-4" /> Filtres
                {filters ? (
                  <span className="num rounded-full bg-primary px-1.5 text-[0.68rem] text-primary-foreground">
                    {filters}
                  </span>
                ) : null}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-[340px] space-y-3">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-semibold">
                  <SlidersHorizontal className="h-4 w-4" /> Affiner la sélection
                </span>
                {filters ? (
                  <Button size="sm" variant="ghost" className="h-7 gap-1 px-2" onClick={resetFilters}>
                    <X className="h-3.5 w-3.5" /> Réinitialiser
                  </Button>
                ) : null}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <FilterSelect label="Type" value={type} onChange={setType} options={TRANSACTION_TYPES} />
                <FilterSelect label="Statut" value={status} onChange={setStatus} options={STATUSES} />
                <FilterSelect
                  label="Catégorie"
                  value={category}
                  onChange={setCategory}
                  options={data.settings.categories}
                />
                <FilterSelect
                  label="Paiement"
                  value={method}
                  onChange={setMethod}
                  options={PAYMENT_METHODS}
                />
                {showFarmColumn ? (
                  <div className="col-span-2 space-y-1.5">
                    <Label className="text-xs text-muted-foreground">Exploitation</Label>
                    <Select value={farm} onValueChange={setFarm}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL}>Toutes</SelectItem>
                        {data.farms.map((f) => (
                          <SelectItem key={f.id} value={f.id}>
                            {f.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Du</Label>
                  <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Au</Label>
                  <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="h-9" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Montant min</Label>
                  <Input
                    inputMode="numeric"
                    value={min}
                    onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
                    className="h-9"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Montant max</Label>
                  <Input
                    inputMode="numeric"
                    value={max}
                    onChange={(e) => setMax(e.target.value.replace(/\D/g, ""))}
                    className="h-9"
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>

          <Button variant="outline" className="gap-2" onClick={exportCsv}>
            <Download className="h-4 w-4" /> Exporter
          </Button>

          {!title ? (
            <Button
              className="gap-2"
              onClick={() => {
                setEditing(null);
                setFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4" /> Nouvelle
            </Button>
          ) : null}
        </div>

        {table.total === 0 ? (
          <EmptyState
            icon={Receipt}
            title="Aucune transaction trouvée"
            description="Ajustez votre recherche ou vos filtres, ou enregistrez une nouvelle opération."
            action={
              <Button
                onClick={() => {
                  setEditing(null);
                  setFormOpen(true);
                }}
              >
                Nouvelle transaction
              </Button>
            }
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left">
                    <th className="px-4 py-3">
                      <SortHeader label="Date" field="date" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">Référence</th>
                    <th className="px-4 py-3">
                      <SortHeader label="Type" field="type" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    {showFarmColumn ? (
                      <th className="px-4 py-3">
                        <SortHeader label="Exploitation" field="farm" sort={table.sort} onSort={table.toggleSort} />
                      </th>
                    ) : null}
                    <th className="px-4 py-3">
                      <SortHeader label="Tiers" field="party" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Montant" field="amount" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Reste" field="remaining" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Statut" field="status" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((t) => {
                    const st = statusOf(t);
                    const remaining = remainingOf(t);
                    return (
                      <tr
                        key={t.id}
                        onClick={() => setDetail(t)}
                        className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/60"
                      >
                        <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">
                          {shortDate(t.date)}
                        </td>
                        <td className="px-4 py-3">
                          <div className="num font-semibold">{t.reference}</div>
                          <div className="max-w-[220px] truncate text-xs text-muted-foreground">
                            {t.description}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <TypeBadge type={t.type} />
                          <div className="mt-1 text-xs text-muted-foreground">{t.category}</div>
                        </td>
                        {showFarmColumn ? (
                          <td className="px-4 py-3 whitespace-nowrap">{farmName(data, t.farmId)}</td>
                        ) : null}
                        <td className="px-4 py-3">{partyName(data, t)}</td>
                        <td className="px-4 py-3 text-right">
                          <Money value={t.amount} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Money value={remaining} tone={remaining ? "warning" : "muted"} />
                        </td>
                        <td className="px-4 py-3">
                          <StatusBadge status={st} />
                        </td>
                        <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-52">
                              <DropdownMenuItem onClick={() => setDetail(t)}>Voir le détail</DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setEditing(t);
                                  setFormOpen(true);
                                }}
                              >
                                Modifier
                              </DropdownMenuItem>
                              {remaining > 0 && !t.cancelled ? (
                                <DropdownMenuItem onClick={() => setPayFor(t)}>
                                  Ajouter un paiement
                                </DropdownMenuItem>
                              ) : null}
                              <DropdownMenuItem
                                onClick={() => {
                                  updateTransaction(t.id, { cancelled: !t.cancelled });
                                  toast.success(
                                    t.cancelled ? "Transaction réactivée." : "Transaction annulée.",
                                  );
                                }}
                              >
                                {t.cancelled ? "Réactiver" : "Annuler la transaction"}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-critical focus:text-critical"
                                onClick={() => setToDelete(t)}
                              >
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <Pager
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPage={table.setPage}
              onPageSize={table.setPageSize}
              noun="transactions"
            />
          </>
        )}
      </div>

      <TransactionDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        transaction={editing}
        defaults={defaults}
      />
      <PaymentDialog transaction={payFor} open={!!payFor} onOpenChange={(v) => !v && setPayFor(null)} />
      <TransactionDrawer
        transaction={detail}
        open={!!detail}
        onOpenChange={(v) => !v && setDetail(null)}
        onAddPayment={(t) => {
          setDetail(null);
          setPayFor(t);
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette transaction ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.reference} sera définitivement retirée du suivi financier du domaine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteTransaction(toDelete.id);
                toast.success("Transaction supprimée.");
                setToDelete(null);
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="h-9">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="max-h-60">
          <SelectItem value={ALL}>Tous</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export type { TransactionStatus };
