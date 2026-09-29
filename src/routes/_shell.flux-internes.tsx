import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeftRight, MoreHorizontal, Plus, Search, Truck } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";
import { farmName, flowsBetween } from "@/data/selectors";
import type { Flow } from "@/data/types";
import { useTable } from "@/hooks/use-table";
import { formatMAD, shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/flux-internes")({
  head: () => ({
    meta: [
      { title: "Flux internes — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Transferts internes entre les exploitations du Domaine Jalal : fourrage, semences, gasoil et matériel valorisés.",
      },
      { property: "og:title", content: "Flux internes — Domaine Jalal AI" },
      { property: "og:description", content: "Transferts valorisés entre exploitations du domaine." },
    ],
  }),
  component: FlowsPage,
});

type Field = "date" | "product" | "from" | "to" | "value" | "status";

function FlowsPage() {
  const { data, addFlow, updateFlow, deleteFlow } = useStore();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Flow | null>(null);
  const [toDelete, setToDelete] = useState<Flow | null>(null);

  const table = useTable<Flow, Field>(data.flows, {
    initialSort: { field: "date", dir: "desc" },
    sortValue: (f, field) => {
      switch (field) {
        case "product":
          return f.product;
        case "from":
          return farmName(data, f.fromFarmId);
        case "to":
          return farmName(data, f.toFarmId);
        case "value":
          return f.value;
        case "status":
          return f.status;
        default:
          return f.date;
      }
    },
    searchText: (f) =>
      [f.reference, f.product, f.responsible, farmName(data, f.fromFarmId), farmName(data, f.toFarmId)].join(" "),
  });

  const totalValue = data.flows.reduce((s, f) => s + f.value, 0);
  const pairs = useMemo(() => flowsBetween(data), [data]);

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Transferts enregistrés" value={data.flows.length} money={false} icon={ArrowLeftRight} />
        <KpiCard label="Valeur transférée" value={totalValue} icon={Truck} />
        <KpiCard
          label="En cours ou planifiés"
          value={data.flows.filter((f) => f.status !== "Terminé").length}
          money={false}
          icon={ArrowLeftRight}
          tone="warning"
        />
      </div>

      <div className="surface p-5">
        <SectionHeading
          title="Liaisons entre exploitations"
          description="Chaque paire indique les échanges cumulés du domaine"
        />
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pairs.map((p) => (
            <div key={`${p.from}-${p.to}`} className="rounded-2xl border border-border bg-muted/40 p-4">
              <div className="text-sm font-semibold">
                {farmName(data, p.from)} → {farmName(data, p.to)}
              </div>
              <div className="num mt-1 text-xs text-muted-foreground">
                {p.count} transferts · {formatMAD(p.value, { compact: true })}
              </div>
              <div className="mt-2 text-xs text-muted-foreground">Dernier : {p.product}</div>
            </div>
          ))}
        </div>
      </div>

      <SectionHeading
        title="Registre des flux internes"
        description="Suivi des mouvements de produits et de matériel entre exploitations."
        action={
          <Button
            className="gap-2"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="h-4 w-4" /> Nouveau transfert
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
              placeholder="Rechercher un produit, une exploitation, un responsable..."
              className="pl-9"
            />
          </div>
        </div>

        {table.total === 0 ? (
          <EmptyState
            icon={ArrowLeftRight}
            title="Aucun transfert"
            description="Enregistrez un mouvement de fourrage, de semences ou de matériel."
            action={<Button onClick={() => setFormOpen(true)}>Nouveau transfert</Button>}
          />
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-sm">
                <thead className="bg-muted/40 text-left">
                  <tr className="border-b border-border">
                    <th className="px-4 py-3">
                      <SortHeader label="Date" field="date" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Produit" field="product" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Origine" field="from" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Destination" field="to" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="px-4 py-3">Responsable</th>
                    <th className="px-4 py-3 text-right">
                      <SortHeader label="Valeur" field="value" sort={table.sort} onSort={table.toggleSort} align="right" />
                    </th>
                    <th className="px-4 py-3">
                      <SortHeader label="Statut" field="status" sort={table.sort} onSort={table.toggleSort} />
                    </th>
                    <th className="w-10 px-2 py-3" />
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((f) => (
                    <tr key={f.id} className="border-b border-border/60 last:border-0 hover:bg-accent/60">
                      <td className="num px-4 py-3 whitespace-nowrap text-muted-foreground">{shortDate(f.date)}</td>
                      <td className="px-4 py-3">
                        <div className="font-semibold">{f.product}</div>
                        <div className="num text-xs text-muted-foreground">
                          {f.reference} · {f.quantity} {f.unit}
                        </div>
                      </td>
                      <td className="px-4 py-3">{farmName(data, f.fromFarmId)}</td>
                      <td className="px-4 py-3">{farmName(data, f.toFarmId)}</td>
                      <td className="px-4 py-3 text-muted-foreground">{f.responsible}</td>
                      <td className="px-4 py-3 text-right">
                        <Money value={f.value} />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={f.status} />
                      </td>
                      <td className="px-2 py-3">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setEditing(f);
                                setFormOpen(true);
                              }}
                            >
                              Modifier
                            </DropdownMenuItem>
                            {f.status !== "Terminé" ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  updateFlow(f.id, { status: "Terminé" });
                                  toast.success("Transfert marqué comme terminé.");
                                }}
                              >
                                Marquer terminé
                              </DropdownMenuItem>
                            ) : null}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              className="text-critical focus:text-critical"
                              onClick={() => setToDelete(f)}
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
              noun="transferts"
            />
          </>
        )}
      </div>

      <FlowForm
        open={formOpen}
        onOpenChange={setFormOpen}
        flow={editing}
        onSubmit={(values) => {
          if (editing) {
            updateFlow(editing.id, values);
            toast.success("Transfert mis à jour.");
          } else {
            addFlow(values);
            toast.success("Transfert interne enregistré.");
          }
        }}
      />

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce transfert ?</AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.reference} — {toDelete?.product} sera retiré du registre des flux internes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteFlow(toDelete.id);
                toast.success("Transfert supprimé.");
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

function FlowForm({
  open,
  onOpenChange,
  flow,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  flow: Flow | null;
  onSubmit: (values: Omit<Flow, "id" | "reference">) => void;
}) {
  const { data } = useStore();
  const [fromFarmId, setFrom] = useState(data.farms[0].id);
  const [toFarmId, setTo] = useState(data.farms[1].id);
  const [product, setProduct] = useState("");
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("tonnes");
  const [value, setValue] = useState("");
  const [responsible, setResponsible] = useState("");
  const [status, setStatus] = useState<Flow["status"]>("Terminé");
  const [date, setDate] = useState("");
  const [comment, setComment] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    setFrom(flow?.fromFarmId ?? data.farms[0].id);
    setTo(flow?.toFarmId ?? data.farms[1].id);
    setProduct(flow?.product ?? "");
    setQuantity(String(flow?.quantity ?? ""));
    setUnit(flow?.unit ?? "tonnes");
    setValue(String(flow?.value ?? ""));
    setResponsible(flow?.responsible ?? "");
    setStatus(flow?.status ?? "Terminé");
    setDate((flow?.date ?? new Date().toISOString()).slice(0, 10));
    setComment(flow?.comment ?? "");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, flow?.id]);

  const errors = {
    product: product.trim().length < 2 ? "Produit requis." : "",
    farms: fromFarmId === toFarmId ? "Choisissez deux exploitations différentes." : "",
    quantity: !quantity || Number(quantity) <= 0 ? "Quantité requise." : "",
    value: !value || Number(value) <= 0 ? "Valeur estimée requise." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>{flow ? "Modifier le transfert" : "Nouveau transfert interne"}</DialogTitle>
          <DialogDescription>
            Les transferts internes valorisent les échanges entre exploitations du domaine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Exploitation d'origine</Label>
            <Select value={fromFarmId} onValueChange={setFrom}>
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
            <Label>Exploitation destinataire</Label>
            <Select value={toFarmId} onValueChange={setTo}>
              <SelectTrigger aria-invalid={!!(touched && errors.farms)}>
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
            {touched && errors.farms ? <p className="text-xs text-critical">{errors.farms}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-product">Produit / matériel</Label>
            <Input
              id="f-product"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="Fourrage, semences, gasoil..."
              aria-invalid={!!(touched && errors.product)}
            />
            {touched && errors.product ? <p className="text-xs text-critical">{errors.product}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-date">Date</Label>
            <Input id="f-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-qty">Quantité</Label>
            <Input
              id="f-qty"
              inputMode="numeric"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value.replace(/[^\d.]/g, ""))}
              aria-invalid={!!(touched && errors.quantity)}
            />
            {touched && errors.quantity ? <p className="text-xs text-critical">{errors.quantity}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Unité</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["tonnes", "quintaux", "litres", "sacs", "unités", "têtes"].map((u) => (
                  <SelectItem key={u} value={u}>
                    {u}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-value">Valeur estimée (DH)</Label>
            <Input
              id="f-value"
              inputMode="numeric"
              value={value}
              onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
              aria-invalid={!!(touched && errors.value)}
            />
            {touched && errors.value ? <p className="text-xs text-critical">{errors.value}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="f-resp">Responsable</Label>
            <Input id="f-resp" value={responsible} onChange={(e) => setResponsible(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as Flow["status"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Planifié">Planifié</SelectItem>
                <SelectItem value="En cours">En cours</SelectItem>
                <SelectItem value="Terminé">Terminé</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="f-comment">Commentaire</Label>
            <Textarea id="f-comment" rows={2} value={comment} onChange={(e) => setComment(e.target.value)} />
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
                fromFarmId,
                toFarmId,
                product,
                quantity: Number(quantity),
                unit,
                value: Number(value),
                responsible: responsible || "Direction",
                status,
                date: new Date(`${date}T10:00:00`).toISOString(),
                comment,
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
