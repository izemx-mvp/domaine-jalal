import { createFileRoute } from "@tanstack/react-router";
import { Banknote, MoreHorizontal, Plus, Search, Users, Wallet } from "lucide-react";
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
import { clientStats, statusOf } from "@/data/selectors";
import type { Client } from "@/data/types";
import { useTable } from "@/hooks/use-table";
import { formatDate, shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/clients")({
  head: () => ({
    meta: [
      { title: "Clients — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Clients et acheteurs du Domaine Jalal : ventes, encaissements, créances ouvertes et historique commercial.",
      },
      { property: "og:title", content: "Clients — Domaine Jalal AI" },
      { property: "og:description", content: "Ventes, encaissements et créances par client." },
    ],
  }),
  component: ClientsPage,
});

type Field = "name" | "activity" | "total" | "collected" | "remaining" | "status";

function ClientsPage() {
  const { data, addClient, updateClient, deleteClient, addNote } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [detail, setDetail] = useState<Client | null>(null);
  const [toDelete, setToDelete] = useState<Client | null>(null);
  const [collectFor, setCollectFor] = useState<Client | null>(null);
  const [note, setNote] = useState("");

  const rows = useMemo(
    () => data.clients.map((c) => ({ client: c, stats: clientStats(data, c.id) })),
    [data],
  );

  const table = useTable<(typeof rows)[number], Field>(rows, {
    initialSort: { field: "total", dir: "desc" },
    sortValue: (r, field) => {
      switch (field) {
        case "name":
          return r.client.name;
        case "activity":
          return r.client.activity;
        case "collected":
          return r.stats.collected;
        case "remaining":
          return r.stats.remaining;
        case "status":
          return r.client.status;
        default:
          return r.stats.total;
      }
    },
    searchText: (r) => [r.client.name, r.client.activity, r.client.contact, r.client.phone].join(" "),
  });

  const totalSales = rows.reduce((s, r) => s + r.stats.total, 0);
  const totalCollected = rows.reduce((s, r) => s + r.stats.collected, 0);
  const totalDue = rows.reduce((s, r) => s + r.stats.remaining, 0);
  const liveDetail = detail ? data.clients.find((c) => c.id === detail.id) ?? detail : null;
  const detailStats = liveDetail ? clientStats(data, liveDetail.id) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Ventes facturées" value={totalSales} icon={Users} />
        <KpiCard label="Encaissé" value={totalCollected} icon={Banknote} tone="positive" />
        <KpiCard label="Créances ouvertes" value={totalDue} icon={Wallet} tone="warning" />
      </div>

      <SectionHeading
        title="Portefeuille clients"
        description="Acheteurs, coopératives et distributeurs du domaine."
        action={
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouveau client
          </Button>
        }
      />

      <div className="surface overflow-hidden">
        <div className="border-b border-border p-4">
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={table.query}
              onChange={(e) => table.setQuery(e.target.value)}
              placeholder="Rechercher un client, une activité..."
              className="pl-9"
            />
          </div>
        </div>

        {table.total === 0 ? (
          <EmptyState
            icon={Users}
            title="Aucun client"
            description="Ajoutez un acheteur pour suivre ses ventes et encaissements."
            action={<Button onClick={() => setFormOpen(true)}>Nouveau client</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[880px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3">
                      <SortHeader label="Client" field="name" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Activité" field="activity" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Ventes" field="total" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Encaissé" field="collected" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Créance" field="remaining" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Statut" field="status" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map(({ client, stats }) => (
                    <tr
                      key={client.id}
                      onClick={() => setDetail(client)}
                      className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{client.name}</div>
                        <div className="text-xs text-muted-foreground">{client.contact}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{client.activity}</td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.total} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.collected} tone="positive" />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.remaining} tone={stats.remaining ? "warning" : "muted"} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={client.status} />
                      </td>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(client)}>Voir la fiche</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setCollectFor(client)}>
                              Enregistrer un encaissement
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(client);
                                setFormOpen(true);
                              }}
                            >
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-critical focus:text-critical"
                              onClick={() => setToDelete(client)}
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
              noun="clients"
            />
          </>
        )}
      </div>

      <ClientForm
        open={formOpen}
        onOpenChange={setFormOpen}
        client={editing}
        onSubmit={(values) => {
          if (editing) {
            updateClient(editing.id, values);
            toast.success("Client mis à jour.");
          } else {
            addClient(values);
            toast.success("Client ajouté.");
          }
        }}
      />

      <TransactionDialog
        open={!!collectFor}
        onOpenChange={(v) => !v && setCollectFor(null)}
        defaults={{ type: "Encaissement", category: "Récolte" }}
      />

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[500px]">
          {liveDetail && detailStats ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{liveDetail.name}</SheetTitle>
                <SheetDescription>{liveDetail.activity}</SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-10">
                <div className="grid grid-cols-3 gap-3">
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Ventes</div>
                    <Money value={detailStats.total} />
                  </div>
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Encaissé</div>
                    <Money value={detailStats.collected} tone="positive" />
                  </div>
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Créance</div>
                    <Money value={detailStats.remaining} tone="warning" />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Interlocuteur</span>
                    <span className="font-medium">{liveDetail.contact}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Téléphone</span>
                    <span className="num font-medium">{liveDetail.phone}</span>
                  </div>
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">E-mail</span>
                    <span className="font-medium">{liveDetail.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Dernier encaissement</span>
                    <span className="num font-medium">
                      {detailStats.last ? formatDate(detailStats.last) : "—"}
                    </span>
                  </div>
                </div>

                <Button className="w-full gap-2" onClick={() => setCollectFor(liveDetail)}>
                  <Banknote className="h-4 w-4" /> Enregistrer un encaissement
                </Button>

                <section>
                  <h3 className="font-display text-sm font-semibold">Historique commercial</h3>
                  <ul className="mt-2 divide-y divide-border/60">
                    {detailStats.transactions
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 10)
                      .map((x) => (
                        <li key={x.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div>
                            <div className="num font-medium">{x.reference}</div>
                            <div className="num text-xs text-muted-foreground">
                              {shortDate(x.date)} · {x.type}
                            </div>
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
                      placeholder="Conditions commerciales, délais de règlement..."
                    />
                    <Button
                      size="sm"
                      disabled={!note.trim()}
                      onClick={() => {
                        addNote("client", liveDetail.id, note.trim());
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
            <AlertDialogTitle>Supprimer {toDelete?.name} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le client sera retiré du portefeuille. Ses ventes restent visibles dans le registre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteClient(toDelete.id);
                toast.success("Client supprimé.");
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

function ClientForm({
  open,
  onOpenChange,
  client,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  client: Client | null;
  onSubmit: (values: Omit<Client, "id" | "notes">) => void;
}) {
  const [name, setName] = useState("");
  const [activity, setActivity] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"Actif" | "Inactif">("Actif");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setName(client?.name ?? "");
    setActivity(client?.activity ?? "Distribution de fruits");
    setContact(client?.contact ?? "");
    setPhone(client?.phone ?? "");
    setEmail(client?.email ?? "");
    setStatus(client?.status ?? "Actif");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, client?.id]);

  const errors = {
    name: name.trim().length < 2 ? "Nom requis." : "",
    phone: phone.trim().length < 6 ? "Téléphone requis." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{client ? "Modifier le client" : "Nouveau client"}</DialogTitle>
          <DialogDescription>Coordonnées commerciales de l'acheteur.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="c-name">Nom / raison sociale</Label>
            <Input id="c-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!(touched && errors.name)} />
            {touched && errors.name ? <p className="text-xs text-critical">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-activity">Activité</Label>
            <Input id="c-activity" value={activity} onChange={(e) => setActivity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-contact">Interlocuteur</Label>
            <Input id="c-contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-phone">Téléphone</Label>
            <Input id="c-phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!(touched && errors.phone)} />
            {touched && errors.phone ? <p className="text-xs text-critical">{errors.phone}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="c-email">E-mail</Label>
            <Input id="c-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as "Actif" | "Inactif")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Actif">Actif</SelectItem>
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
              onSubmit({ name, activity, contact, phone, email, status });
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
