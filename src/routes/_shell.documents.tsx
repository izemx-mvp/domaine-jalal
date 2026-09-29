import { createFileRoute } from "@tanstack/react-router";
import {
  FileCheck2,
  FileText,
  Image as ImageIcon,
  MoreHorizontal,
  Search,
  Upload,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { EmptyState, KpiCard, Pager, SectionHeading, StatusBadge } from "@/components/common/ui-bits";
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
import { farmName } from "@/data/selectors";
import type { DocumentItem } from "@/data/types";
import { useTable } from "@/hooks/use-table";
import { shortDate } from "@/lib/format";
import { useStore } from "@/store/app-store";

export const Route = createFileRoute("/_shell/documents")({
  head: () => ({
    meta: [
      { title: "Documents — Domaine Jalal AI" },
      {
        name: "description",
        content:
          "Bibliothèque des justificatifs du Domaine Jalal : factures, reçus, tickets et photos rattachés aux transactions.",
      },
      { property: "og:title", content: "Documents — Domaine Jalal AI" },
      { property: "og:description", content: "Justificatifs classés par exploitation et par transaction." },
    ],
  }),
  component: DocumentsPage,
});

const CATEGORIES: DocumentItem["category"][] = [
  "Factures",
  "Reçus",
  "Tickets",
  "Photos",
  "Justificatifs",
  "Documents fournisseurs",
];

const ALL = "__all__";

function DocumentsPage() {
  const { data, addDocument, renameDocument, deleteDocument } = useStore();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [renaming, setRenaming] = useState<DocumentItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [toDelete, setToDelete] = useState<DocumentItem | null>(null);
  const [categoryFilter, setCategoryFilter] = useState(ALL);
  const [farmFilter, setFarmFilter] = useState(ALL);

  const rows = useMemo(
    () =>
      data.documents.filter(
        (d) =>
          (categoryFilter === ALL || d.category === categoryFilter) &&
          (farmFilter === ALL || d.farmId === farmFilter),
      ),
    [data.documents, categoryFilter, farmFilter],
  );

  const table = useTable<DocumentItem, "date" | "name" | "category">(rows, {
    initialSort: { field: "date", dir: "desc" },
    sortValue: (d, field) => (field === "name" ? d.name : field === "category" ? d.category : d.date),
    searchText: (d) => [d.name, d.entity, d.category, d.transactionRef ?? "", farmName(data, d.farmId)].join(" "),
  });

  const validated = data.documents.filter((d) => d.status === "Validé").length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-3">
        <KpiCard label="Documents archivés" value={data.documents.length} money={false} icon={FileText} />
        <KpiCard label="Documents validés" value={validated} money={false} icon={FileCheck2} tone="positive" />
        <KpiCard
          label="En attente de validation"
          value={data.documents.length - validated}
          money={false}
          icon={ImageIcon}
          tone="warning"
        />
      </div>

      <SectionHeading
        title="Bibliothèque de justificatifs"
        description="Factures, reçus et photos rattachés aux opérations du domaine."
        action={
          <Button className="gap-2" onClick={() => setUploadOpen(true)}>
            <Upload className="h-4 w-4" /> Ajouter un document
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
              placeholder="Rechercher un document, une entité, une référence..."
              className="pl-9"
            />
          </div>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ALL}>Toutes les catégories</SelectItem>
              {CATEGORIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
        </div>

        {table.total === 0 ? (
          <EmptyState
            icon={FileText}
            title="Aucun document"
            description="Ajoutez un justificatif ou modifiez vos filtres."
            action={<Button onClick={() => setUploadOpen(true)}>Ajouter un document</Button>}
          />
        ) : (
          <>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {table.rows.map((d) => (
                <div key={d.id} className="surface surface-hover flex items-start gap-3 p-4">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-accent text-canopy">
                    {d.category === "Photos" ? (
                      <ImageIcon className="h-4 w-4" />
                    ) : (
                      <FileText className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold">{d.name}</div>
                    <div className="num mt-0.5 text-xs text-muted-foreground">
                      {d.category} · {shortDate(d.date)} · {d.sizeKb} Ko
                    </div>
                    <div className="mt-1 truncate text-xs text-muted-foreground">
                      {d.entity} · {farmName(data, d.farmId)}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <StatusBadge status={d.status} />
                      {d.transactionRef ? (
                        <span className="num text-[0.68rem] text-muted-foreground">{d.transactionRef}</span>
                      ) : null}
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8" aria-label="Actions">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => toast.success("Aperçu simulé du document.")}>
                        Aperçu
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => toast.success("Téléchargement simulé.")}>
                        Télécharger
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => {
                          setRenaming(d);
                          setRenameValue(d.name);
                        }}
                      >
                        Renommer
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-critical focus:text-critical"
                        onClick={() => setToDelete(d)}
                      >
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
            <Pager
              page={table.page}
              pageSize={table.pageSize}
              total={table.total}
              onPage={table.setPage}
              onPageSize={table.setPageSize}
              noun="documents"
            />
          </>
        )}
      </div>

      <UploadDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onSubmit={(values) => {
          addDocument(values);
          toast.success("Document ajouté à la bibliothèque.");
        }}
      />

      <Dialog open={!!renaming} onOpenChange={(v) => !v && setRenaming(null)}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Renommer le document</DialogTitle>
            <DialogDescription>Choisissez un nom explicite pour l'archivage.</DialogDescription>
          </DialogHeader>
          <Input value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRenaming(null)}>
              Annuler
            </Button>
            <Button
              disabled={!renameValue.trim()}
              onClick={() => {
                if (renaming) renameDocument(renaming.id, renameValue.trim());
                toast.success("Document renommé.");
                setRenaming(null);
              }}
            >
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce document ?</AlertDialogTitle>
            <AlertDialogDescription>{toDelete?.name} sera retiré de la bibliothèque.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (toDelete) deleteDocument(toDelete.id);
                toast.success("Document supprimé.");
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

function UploadDialog({
  open,
  onOpenChange,
  onSubmit,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSubmit: (values: Omit<DocumentItem, "id">) => void;
}) {
  const { data } = useStore();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentItem["category"]>("Factures");
  const [farmId, setFarmId] = useState(data.farms[0].id);
  const [entity, setEntity] = useState("");
  const [transactionRef, setTransactionRef] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName("");
    setCategory("Factures");
    setFarmId(data.farms[0].id);
    setEntity("");
    setTransactionRef("");
    setUploading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Ajouter un justificatif</DialogTitle>
          <DialogDescription>
            Le dépôt est simulé : le document est archivé dans la bibliothèque de démonstration.
          </DialogDescription>
        </DialogHeader>

        <button
          type="button"
          onClick={() => {
            const n = `Facture-${Math.floor(Math.random() * 9000 + 1000)}.pdf`;
            setName(n);
            toast.success("Fichier sélectionné.");
          }}
          className="flex w-full flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-muted/40 px-4 py-8 text-center transition-colors hover:border-primary/50"
        >
          <Upload className="h-6 w-6 text-primary" />
          <span className="text-sm font-medium">{name || "Cliquez pour choisir un fichier"}</span>
          <span className="text-xs text-muted-foreground">PDF, JPG ou PNG — 10 Mo maximum</span>
        </button>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as DocumentItem["category"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            <Label htmlFor="d-entity">Entité concernée</Label>
            <Input
              id="d-entity"
              value={entity}
              onChange={(e) => setEntity(e.target.value)}
              placeholder="Fournisseur, client, ouvrier..."
            />
          </div>
          <div className="space-y-2">
            <Label>Transaction liée</Label>
            <Select value={transactionRef || "none"} onValueChange={setTransactionRef}>
              <SelectTrigger>
                <SelectValue placeholder="Aucune" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="none">Aucune</SelectItem>
                {data.transactions.slice(0, 40).map((t) => (
                  <SelectItem key={t.id} value={t.reference}>
                    {t.reference} — {t.category}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!name || uploading}
            onClick={() => {
              setUploading(true);
              setTimeout(() => {
                onSubmit({
                  name,
                  category,
                  farmId,
                  entity: entity || "Domaine Jalal",
                  transactionRef: transactionRef && transactionRef !== "none" ? transactionRef : null,
                  date: new Date().toISOString(),
                  sizeKb: Math.floor(Math.random() * 1800 + 120),
                  status: "En attente",
                });
                setUploading(false);
                onOpenChange(false);
              }, 500);
            }}
          >
            {uploading ? "Dépôt en cours..." : "Ajouter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
