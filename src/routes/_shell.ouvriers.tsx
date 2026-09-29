import { createFileRoute } from "@tanstack/react-router";
import { HandCoins, HardHat, MoreHorizontal, Plus, Search, Wallet } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  EmptyState,
  KpiCard,
  Money,
  Pager,
  SectionHeading,
  SortHeader,
  StatusBadge,
} from "@/components/common/ui-bits";
import { TransactionDialog } from "@/components/transactions/transaction-dialog";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Textarea } from "@/components/ui/textarea";
import { farmName, statusOf, workerStats } from "@/data/selectors";
import type { Worker } from "@/data/types";
import { useTable } from "@/hooks/use-table";
import { formatDate, formatMAD, shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/ouvriers")({
  head: () => ({
    meta: [
      { title: "Ouvriers — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Gestion des ouvriers du Domaine Jalal : avances, paiements, soldes et affectation par exploitation.",
      },
      { property: "og:title", content: "Ouvriers — Domaine Jalal AI" },
      { property: "og:description", content: "Avances, paies et soldes des équipes du domaine." },
    ],
  }),
  component: WorkersPage,
});

type Field = "name" | "farm" | "role" | "advances" | "payments" | "balance" | "status";

const ALL = "__all__";

function WorkersPage() {
  const { data, addWorker, updateWorker, deleteWorker, addNote } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Worker | null>(null);
  const [detail, setDetail] = useState<Worker | null>(null);
  const [toDelete, setToDelete] = useState<Worker | null>(null);
  const [farmFilter, setFarmFilter] = useState(ALL);
  const [statusFilter, setStatusFilter] = useState(ALL);
  const [note, setNote] = useState("");
  const [advanceFor, setAdvanceFor] = useState<Worker | null>(null);

  const rows = useMemo(
    () =>
      data.workers
        .filter((w) => (farmFilter === ALL || w.farmId === farmFilter) && (statusFilter === ALL || w.status === statusFilter))
        .map((w) => ({ worker: w, stats: workerStats(data, w.id) })),
    [data, farmFilter, statusFilter],
  );

  const table = useTable<(typeof rows)[number], Field>(rows, {
    initialSort: { field: "advances", dir: "desc" },
    sortValue: (r, field) => {
      switch (field) {
        case "name":
          return r.worker.name;
        case "farm":
          return farmName(data, r.worker.farmId);
        case "role":
          return r.worker.role;
        case "payments":
          return r.stats.payments;
        case "balance":
          return r.stats.balance;
        case "status":
          return r.worker.status;
        default:
          return r.stats.advances;
      }
    },
    searchText: (r) => [r.worker.name, r.worker.role, r.worker.phone, farmName(data, r.worker.farmId)].join(" "),
  });

  const totalAdvances = rows.reduce((s, r) => s + r.stats.advances, 0);
  const totalPayments = rows.reduce((s, r) => s + r.stats.payments, 0);
  const liveDetail = detail ? data.workers.find((w) => w.id === detail.id) ?? detail : null;
  const detailStats = liveDetail ? workerStats(data, liveDetail.id) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Ouvriers suivis" value={data.workers.length} money={false} icon={HardHat} />
        <KpiCard label="Avances versées" value={totalAdvances} icon={HandCoins} tone="warning" />
        <KpiCard label="Paies versées" value={totalPayments} icon={Wallet} tone="positive" />
      </div>

      <SectionHeading
        title="Équipes du domaine"
        description="Avances, paiements et soldes par ouvrier."
        action={
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouvel ouvrier
          </Button>
        }
      />

      <div className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-4">
          <div className="relative min-w-[200px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={table.query}
              onChange={(e) => table.setQuery(e.target.value)}
              placeholder="Rechercher un ouvrier, un rôle..."
              className="pl-9"
            />
          </div>
          <Select value={farmFilter} onValueChange={setFarmFilter}>
            <SelectTrigger className="w-[190px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les exploitations</SelectItem>
              {data.farms.map((f) => (
                <SelectItem key={f.id} value={f.id}>
                  {f.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Tous les statuts</SelectItem>
              <SelectItem value="Actif">Actif</SelectItem>
              <SelectItem value="Saisonnier">Saisonnier</SelectItem>
              <SelectItem value="Inactif">Inactif</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {table.total === 0 ? (
          <EmptyState
            icon={HardHat}
            title="Aucun ouvrier"
            description="Modifiez vos filtres ou ajoutez un membre d'équipe."
            action={<Button onClick={() => setFormOpen(true)}>Nouvel ouvrier</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[920px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3">
                      <SortHeader label="Ouvrier" field="name" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Exploitation" field="farm" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Rôle" field="role" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Avances" field="advances" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Paiements" field="payments" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Solde" field="balance" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Statut" field="status" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map(({ worker, stats }) => (
                    <tr
                      key={worker.id}
                      onClick={() => setDetail(worker)}
                      className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{worker.name}</div>
                        <div className="num text-xs text-muted-foreground">{worker.phone}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{farmName(data, worker.farmId)}</td>
                      <td className="px-4 py-3">
                        <div>{worker.role}</div>
                        <div className="num text-xs text-muted-foreground">
                          {formatMAD(worker.compensation)} / {worker.compensationUnit}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.advances} tone="warning" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.payments} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.balance} tone={stats.balance < 0 ? "critical" : "positive"} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={worker.status} />
                      </td>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(worker)}>Voir la fiche</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setAdvanceFor(worker)}>
                              Enregistrer une avance
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(worker);
                                setFormOpen(true);
                              }}
                            >
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-critical focus:text-critical"
                              onClick={() => setToDelete(worker)}
                            >
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pager
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPage={table.setPage}
              onPageSize={table.setPageSize}
              noun="ouvriers"
            />
          </>
        )}
      </div>

      <WorkerForm
        open={formOpen}
        onOpenChange={setFormOpen}
        worker={editing}
        onSubmit={(values) => {
          if (editing) {
            updateWorker(editing.id, values);
            toast.success("Fiche ouvrier mise à jour.");
          } else {
            addWorker(values);
            toast.success("Ouvrier ajouté.");
          }
        }}
      />

      <TransactionDialog
        open={!!advanceFor}
        onOpenChange={(v) => !v && setAdvanceFor(null)}
        defaults={advanceFor ? { type: "Avance", farmId: advanceFor.farmId, category: "Main-d'œuvre" } : undefined}
      />

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[500px]">
          {liveDetail && detailStats ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{liveDetail.name}</SheetTitle>
                <SheetDescription>
                  {liveDetail.role} · {farmName(data, liveDetail.farmId)}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-10">
                <div className="grid grid-cols-3 gap-3">
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Avances</div>
                    <Money value={detailStats.advances} tone="warning" />
                  </div>
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Paies</div>
                    <Money value={detailStats.payments} />
                  </div>
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Solde</div>
                    <Money value={detailStats.balance} tone={detailStats.balance < 0 ? "critical" : "positive"} />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Rémunération</span>
                    <span className="num font-medium">
                      {formatMAD(liveDetail.compensation)} / {liveDetail.compensationUnit}
                    </span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="num font-medium">{liveDetail.phone}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Statut</span>
                    <StatusBadge status={liveDetail.status} />
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => setAdvanceFor(liveDetail)}>
                  <HandCoins className="h-4 w-4" /> Enregistrer une avance
                </Button>

                <section>
                  <h3 className="font-display text-sm font-semibold">Historique</h3>
                  <ul className="mt-2 divide-y divide-border/60">
                    {detailStats.transactions
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 10)
                      .map((x) => (
                        <li key={x.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div>
                            <div className="font-medium">{x.type}</div>
                            <div className="num text-xs text-muted-foreground">{shortDate(x.date)}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <StatusBadge status={statusOf(x)} />
                            <Money value={x.amount} />
                          </div>
                        </li>
                      ))}
                  </ul>
                </section>

                <section>
                  <h3 className="font-display text-sm font-semibold">Notes</h3>
                  <div className="mt-2 space-y-2">
                    <Textarea
                      rows={2}
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="Ajouter une note (présence, compétences, consignes...)"
                    />
                    <Button
                      size="sm"
                      disabled={!note.trim()}
                      onClick={() => {
                        addNote("worker", liveDetail.id, note.trim());
                        setNote("");
                        toast.success("Note ajoutée.");
                      }}
                    >
                      Ajouter la note
                    </Button>
                  </div>
                  <ul className="mt-3 space-y-2">
                    {liveDetail.notes.map((n) => (
                      <li key={n.id} className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
                        <div>{n.text}</div>
                        <div className="num mt-1 text-[0.68rem] text-muted-foreground">
                          {n.author} · {formatDate(n.date)}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
            </>
          ) : null}
        </SheetContent>
      </Sheet>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer {toDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              L'ouvrier sera retiré des équipes suivies. Son historique financier reste consultable.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteWorker(toDelete.id);
                toast.success("Ouvrier retiré.");
                setToDelete(null);
              }}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function WorkerForm({
  open,
  onOpenChange,
  worker,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  worker: Worker | null;
  onSubmit: (values: Omit<Worker, "id" | "notes">) => void;
}) {
  const { data } = useStore();
  const [name, setName] = useState("");
  const [farmId, setFarmId] = useState(data.farms[0].id);
  const [role, setRole] = useState("");
  const [phone, setPhone] = useState("");
  const [compensation, setCompensation] = useState("");
  const [unit, setUnit] = useState<"jour" | "mois">("jour");
  const [status, setStatus] = useState<Worker["status"]>("Actif");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setName(worker?.name ?? "");
    setFarmId(worker?.farmId ?? data.farms[0].id);
    setRole(worker?.role ?? "Ouvrier agricole");
    setPhone(worker?.phone ?? "");
    setCompensation(String(worker?.compensation ?? ""));
    setUnit(worker?.compensationUnit ?? "jour");
    setStatus(worker?.status ?? "Actif");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, worker?.id]);

  const errors = {
    name: name.trim().length < 2 ? "Nom requis." : "",
    phone: phone.trim().length < 6 ? "Téléphone requis." : "",
    compensation: !compensation || Number(compensation) <= 0 ? "Rémunération requise." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{worker ? "Modifier l'ouvrier" : "Nouvel ouvrier"}</DialogTitle>
          <DialogDescription>Affectation, rémunération et statut du membre d'équipe.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="w-name">Nom complet</Label>
            <Input id="w-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!(touched && errors.name)} />
            {touched && errors.name ? <p className="text-xs text-critical">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Exploitation</Label>
            <Select value={farmId} onValueChange={setFarmId}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {data.farms.map((f) => (
                  <SelectItem key={f.id} value={f.id}>
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-role">Rôle</Label>
            <Input id="w-role" value={role} onChange={(e) => setRole(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-phone">Téléphone</Label>
            <Input id="w-phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!(touched && errors.phone)} />
            {touched && errors.phone ? <p className="text-xs text-critical">{errors.phone}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="w-comp">Rémunération (DH)</Label>
            <Input
              id="w-comp"
              inputMode="numeric"
              value={compensation}
              onChange={(e) => setCompensation(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!(touched && errors.compensation)}
            />
            {touched && errors.compensation ? (
              <p className="text-xs text-critical">{errors.compensation}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label>Unité</Label>
            <Select value={unit} onValueChange={(v) => setUnit(v as "jour" | "mois")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="jour">Par jour</SelectItem>
                <SelectItem value="mois">Par mois</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Worker["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actif">Actif</SelectItem>
                <SelectItem value="Saisonnier">Saisonnier</SelectItem>
                <SelectItem value="Inactif">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            onClick={() => {
              setTouched(true);
              if (!valid) return;
              onSubmit({
                name,
                farmId,
                role,
                phone,
                compensation: Number(compensation),
                compensationUnit: unit,
                status,
              });
              onOpenChange(false);
            }}
          >
            Enregistrer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
