import { createFileRoute } from "@tanstack/react-router";
import { MoreHorizontal, Plus, Search, Truck, Wallet } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
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
import { farmName, statusOf, supplierStats } from "@/data/selectors";
import type { Supplier } from "@/data/types";
import { useTable } from "@/hooks/use-table";
import { formatDate, shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/fournisseurs")({
  head: () => ({
    meta: [
      { title: "Fournisseurs — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Annuaire des fournisseurs du Domaine Jalal : volumes d'achats, dettes ouvertes, contacts et historique des transactions.",
      },
      { property: "og:title", content: "Fournisseurs — Domaine Jalal AI" },
      {
        property: "og:description",
        content: "Suivi des achats et des dettes par fournisseur agricole.",
      },
    ],
  }),
  component: SuppliersPage,
});

type Field = "name" | "activity" | "total" | "remaining" | "count" | "status";

function SuppliersPage() {
  const { data, addSupplier, updateSupplier, deleteSupplier, addNote } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);
  const [detail, setDetail] = useState<Supplier | null>(null);
  const [toDelete, setToDelete] = useState<Supplier | null>(null);
  const [note, setNote] = useState("");

  const rows = useMemo(
    () => data.suppliers.map((s) => ({ supplier: s, stats: supplierStats(data, s.id) })),
    [data],
  );

  const table = useTable<(typeof rows)[number], Field>(rows, {
    initialSort: { field: "total", dir: "desc" },
    sortValue: (r, field) => {
      switch (field) {
        case "name":
          return r.supplier.name;
        case "activity":
          return r.supplier.activity;
        case "remaining":
          return r.stats.remaining;
        case "count":
          return r.stats.count;
        case "status":
          return r.supplier.status;
        default:
          return r.stats.total;
      }
    },
    searchText: (r) =>
      [r.supplier.name, r.supplier.activity, r.supplier.products, r.supplier.contact, r.supplier.phone].join(" "),
  });

  const totalPurchases = rows.reduce((s, r) => s + r.stats.total, 0);
  const totalDebt = rows.reduce((s, r) => s + r.stats.remaining, 0);
  const detailStats = detail ? supplierStats(data, detail.id) : null;
  const liveDetail = detail ? data.suppliers.find((s) => s.id === detail.id) ?? detail : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Fournisseurs" value={data.suppliers.length} money={false} icon={Truck} />
        <KpiCard label="Achats cumulés" value={totalPurchases} icon={Wallet} />
        <KpiCard label="Dettes ouvertes" value={totalDebt} icon={Wallet} tone="warning" />
      </div>

      <SectionHeading
        title="Annuaire fournisseurs"
        description="Contacts, volumes d'achats et dettes par partenaire."
        action={
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouveau fournisseur
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
              placeholder="Rechercher un fournisseur, un produit, un contact..."
              className="pl-9"
            />
          </div>
        </div>

        {table.total === 0 ? (
          <EmptyState
            icon={Truck}
            title="Aucun fournisseur"
            description="Ajoutez un partenaire pour commencer à suivre ses achats et ses dettes."
            action={<Button onClick={() => setFormOpen(true)}>Nouveau fournisseur</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3">
                      <SortHeader label="Fournisseur" field="name" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Activité" field="activity" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">Exploitations</th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Transactions" field="count" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Total" field="total" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Reste dû" field="remaining" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Statut" field="status" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map(({ supplier, stats }) => (
                    <tr
                      key={supplier.id}
                      onClick={() => setDetail(supplier)}
                      className="cursor-pointer border-b border-border/60 transition-colors last:border-0 hover:bg-accent/60"
                    >
                      <td className="px-4 py-3">
                        <div className="font-semibold">{supplier.name}</div>
                        <div className="text-xs text-muted-foreground">{supplier.products}</div>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">{supplier.activity}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {supplier.farmIds.map((id) => farmName(data, id)).join(", ")}
                      </td>
                      <td className="num px-4 py-3 text-right">{stats.count}</td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.total} />
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Money value={stats.remaining} tone={stats.remaining ? "warning" : "muted"} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={supplier.status} />
                      </td>
                      <td className="px-2 py-3" onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setDetail(supplier)}>Voir la fiche</DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(supplier);
                                setFormOpen(true);
                              }}
                            >
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                updateSupplier(supplier.id, {
                                  status: supplier.status === "Actif" ? "Inactif" : "Actif",
                                });
                                toast.success("Statut mis à jour.");
                              }}
                            >
                              {supplier.status === "Actif" ? "Désactiver" : "Réactiver"}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-critical focus:text-critical"
                              onClick={() => setToDelete(supplier)}
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
              noun="fournisseurs"
            />
          </>
        )}
      </div>

      <SupplierForm
        open={formOpen}
        onOpenChange={setFormOpen}
        supplier={editing}
        onSubmit={(values) => {
          if (editing) {
            updateSupplier(editing.id, values);
            toast.success("Fournisseur mis à jour.");
          } else {
            addSupplier(values);
            toast.success("Fournisseur ajouté.");
          }
        }}
      />

      <Sheet open={!!detail} onOpenChange={(v) => !v && setDetail(null)}>
        <SheetContent side="right" className="w-full overflow-y-auto sm:max-w-[520px]">
          {liveDetail && detailStats ? (
            <>
              <SheetHeader>
                <SheetTitle className="font-display text-xl">{liveDetail.name}</SheetTitle>
                <SheetDescription>
                  {liveDetail.activity} · {liveDetail.products}
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 px-4 pb-10">
                <div className="grid grid-cols-2 gap-3">
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Achats cumulés</div>
                    <Money value={detailStats.total} />
                  </div>
                  <div className="surface bg-muted/40 p-3">
                    <div className="text-xs text-muted-foreground">Reste dû</div>
                    <Money value={detailStats.remaining} tone="warning" />
                  </div>
                </div>

                <div className="space-y-1.5 text-sm">
                  <div className="flex justify-between border-b border-border/60 pb-1.5">
                    <span className="text-muted-foreground">Contact</span>
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
                    <span className="text-muted-foreground">Exploitations</span>
                    <span className="text-right font-medium">
                      {liveDetail.farmIds.map((id) => farmName(data, id)).join(", ")}
                    </span>
                  </div>
                </div>

                <section>
                  <h3 className="font-display text-sm font-semibold">Dernières transactions</h3>
                  <ul className="mt-2 divide-y divide-border/60">
                    {detailStats.transactions
                      .slice()
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 8)
                      .map((x) => (
                        <li key={x.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                          <div className="min-w-0">
                            <div className="num font-medium">{x.reference}</div>
                            <div className="num text-xs text-muted-foreground">
                              {shortDate(x.date)} · {x.category}
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
                  <h3 className="font-display text-sm font-semibold">Notes internes</h3>
                  <div className="mt-2 space-y-2">
                    <Textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      rows={2}
                      placeholder="Ajouter une note (négociation, qualité, délais...)"
                    />
                    <Button
                      size="sm"
                      disabled={!note.trim()}
                      onClick={() => {
                        addNote("supplier", liveDetail.id, note.trim());
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
              Le fournisseur disparaîtra de l'annuaire. Ses transactions resteront dans le registre.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteSupplier(toDelete.id);
                toast.success("Fournisseur supprimé.");
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

function SupplierForm({
  open,
  onOpenChange,
  supplier,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  supplier: Supplier | null;
  onSubmit: (values: Omit<Supplier, "id" | "notes">) => void;
}) {
  const { data } = useStore();
  const [name, setName] = useState("");
  const [activity, setActivity] = useState("");
  const [contact, setContact] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [products, setProducts] = useState("");
  const [farmIds, setFarmIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"Actif" | "Inactif">("Actif");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setName(supplier?.name ?? "");
    setActivity(supplier?.activity ?? "Intrants agricoles");
    setContact(supplier?.contact ?? "");
    setPhone(supplier?.phone ?? "");
    setEmail(supplier?.email ?? "");
    setProducts(supplier?.products ?? "");
    setFarmIds(supplier?.farmIds ?? [data.farms[0].id]);
    setStatus(supplier?.status ?? "Actif");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, supplier?.id]);

  const errors = {
    name: name.trim().length < 2 ? "Nom requis." : "",
    phone: phone.trim().length < 6 ? "Téléphone requis." : "",
    farms: farmIds.length === 0 ? "Sélectionnez au moins une exploitation." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{supplier ? "Modifier le fournisseur" : "Nouveau fournisseur"}</DialogTitle>
          <DialogDescription>Coordonnées et exploitations desservies par ce partenaire.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="s-name">Nom / raison sociale</Label>
            <Input id="s-name" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={!!(touched && errors.name)} />
            {touched && errors.name ? <p className="text-xs text-critical">{errors.name}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-activity">Activité</Label>
            <Input id="s-activity" value={activity} onChange={(e) => setActivity(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-products">Produits / services</Label>
            <Input id="s-products" value={products} onChange={(e) => setProducts(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-contact">Interlocuteur</Label>
            <Input id="s-contact" value={contact} onChange={(e) => setContact(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-phone">Téléphone</Label>
            <Input id="s-phone" value={phone} onChange={(e) => setPhone(e.target.value)} aria-invalid={!!(touched && errors.phone)} />
            {touched && errors.phone ? <p className="text-xs text-critical">{errors.phone}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="s-email">E-mail</Label>
            <Input id="s-email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="space-y-2">
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
          <div className="space-y-2 sm:col-span-2">
            <Label>Exploitations desservies</Label>
            <div className="grid gap-2 sm:grid-cols-2">
              {data.farms.map((f) => (
                <label key={f.id} className="flex items-center gap-2 rounded-xl border border-border px-3 py-2 text-sm">
                  <Checkbox
                    checked={farmIds.includes(f.id)}
                    onCheckedChange={(c) =>
                      setFarmIds((prev) => (c ? [...prev, f.id] : prev.filter((x) => x !== f.id)))
                    }
                  />
                  {f.name}
                </label>
              ))}
            </div>
            {touched && errors.farms ? <p className="text-xs text-critical">{errors.farms}</p> : null}
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
              onSubmit({ name, activity, contact, phone, email, products, farmIds, status });
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
