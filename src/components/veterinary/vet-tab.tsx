import { Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  FileText,
  Pencil,
  Plus,
  Stethoscope,
  Syringe,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { KpiCard, Money, SectionHeading, StatusBadge } from "@/components/common/ui-bits";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { vetOverview } from "@/data/selectors";
import { VET_TYPES, type VetEvent, type VetEventType } from "@/data/types";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/app-store";

const TYPE_TONE: Record<VetEventType, string> = {
  "Visite vétérinaire": "bg-primary/15 text-primary border-primary/30",
  Vaccination: "bg-wheat/25 text-earth border-wheat/50",
  Contrôle: "bg-olive/15 text-olive border-olive/30",
  Traitement: "bg-critical/10 text-critical border-critical/25",
  Suivi: "bg-leaf/15 text-canopy border-leaf/30",
  "Renouvellement médicament": "bg-muted text-muted-foreground border-border",
};

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const ymd = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const frDate = (s: string) =>
  new Date(`${s}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });

const LOTS = ["Lot A — Vaches laitières", "Lot B — Génisses", "Lot C — Veaux", "Lot D — Taurillons", "Troupeau complet"];
const VETS = ["Dr. Karim Alaoui", "Dr. Samira Bennani", "Dr. Omar Tazi"];

export function VetTab() {
  const { data, now, deleteVetEvent, updateVetEvent } = useStore();
  const o = vetOverview(data, now);
  const [view, setView] = useState<"mois" | "semaine" | "agenda">("mois");
  const [cursor, setCursor] = useState(() => new Date(now));
  const [editing, setEditing] = useState<VetEvent | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [presetDate, setPresetDate] = useState<string | undefined>();
  const [selected, setSelected] = useState<VetEvent | null>(null);
  const today = ymd(now);

  const byDay = useMemo(() => {
    const m = new Map<string, VetEvent[]>();
    for (const e of o.events) m.set(e.date, [...(m.get(e.date) ?? []), e]);
    return m;
  }, [o.events]);

  const openNew = (date?: string) => {
    setEditing(null);
    setPresetDate(date);
    setFormOpen(true);
  };

  const days = useMemo(() => {
    if (view === "semaine") {
      const start = new Date(cursor);
      start.setDate(start.getDate() - ((start.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(start);
        d.setDate(d.getDate() + i);
        return d;
      });
    }
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = new Date(first);
    start.setDate(1 - ((first.getDay() + 6) % 7));
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor, view]);

  const shift = (dir: number) => {
    const d = new Date(cursor);
    if (view === "semaine") d.setDate(d.getDate() + 7 * dir);
    else d.setMonth(d.getMonth() + dir);
    setCursor(d);
  };

  const live = selected ? o.events.find((e) => e.id === selected.id) ?? null : null;

  return (
    <div className="space-y-5">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="surface p-5">
          <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
            Prochaine visite <Stethoscope className="h-4 w-4 text-primary" />
          </div>
          <div className="font-display mt-2 text-2xl font-semibold capitalize">
            {o.nextVisit ? frDate(o.nextVisit.date) : "—"}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {o.nextVisit ? `${o.nextVisit.time} · ${o.nextVisit.vet}` : "Aucune planifiée"}
          </div>
        </div>
        <KpiCard label="Traitements en cours" value={o.ongoing.length} money={false} icon={Syringe} tone="warning" comparison="Lots sous traitement" />
        <KpiCard label="Vaccinations à venir" value={o.vaccinations.length} money={false} icon={CalendarDays} comparison="Planifiées" />
        <KpiCard label="Coût vétérinaire (année)" value={o.costYear} icon={FileText} comparison="Reporté en finance" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="surface p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => shift(-1)} aria-label="Précédent">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <h3 className="font-display min-w-[150px] text-center font-semibold capitalize">
                {view === "semaine"
                  ? `Semaine du ${days[0].toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}`
                  : cursor.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
              </h3>
              <Button variant="ghost" size="icon" onClick={() => shift(1)} aria-label="Suivant">
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setCursor(new Date(now))}>
                Aujourd'hui
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex rounded-lg border border-border p-0.5">
                {(["mois", "semaine", "agenda"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={cn(
                      "rounded-md px-3 py-1 text-xs font-medium capitalize transition-colors",
                      view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <Button size="sm" className="gap-1.5" onClick={() => openNew()}>
                <Plus className="h-4 w-4" /> Nouvelle intervention
              </Button>
            </div>
          </div>

          {view === "agenda" ? (
            <ul className="mt-4 divide-y divide-border/60">
              {o.events
                .filter((e) => e.date >= ymd(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1)))
                .map((e) => (
                  <li key={e.id}>
                    <button
                      onClick={() => setSelected(e)}
                      className="flex w-full items-center gap-4 py-3 text-left hover:bg-accent/40"
                    >
                      <div className="num w-24 shrink-0 text-xs text-muted-foreground">
                        {frDate(e.date)}
                        <div>{e.time}</div>
                      </div>
                      <span className={cn("rounded-md border px-2 py-0.5 text-[0.7rem]", TYPE_TONE[e.type])}>
                        {e.type}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{e.reason}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {e.lot} · {e.vet}
                        </div>
                      </div>
                      <StatusBadge status={e.status} />
                    </button>
                  </li>
                ))}
            </ul>
          ) : (
            <div className="mt-4">
              <div className="grid grid-cols-7 gap-1 text-center text-[0.68rem] font-medium text-muted-foreground uppercase">
                {WEEKDAYS.map((d) => (
                  <div key={d}>{d}</div>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((d) => {
                  const key = ymd(d);
                  const evs = byDay.get(key) ?? [];
                  const out = view === "mois" && d.getMonth() !== cursor.getMonth();
                  return (
                    <div
                      key={key}
                      onDoubleClick={() => openNew(key)}
                      className={cn(
                        "group relative rounded-lg border border-border/60 p-1.5 text-left",
                        view === "semaine" ? "min-h-[220px]" : "min-h-[84px]",
                        out && "opacity-45",
                        key === today && "border-primary/60 bg-accent/40",
                      )}
                    >
                      <div className="flex items-center justify-between">
                        <span className="num text-xs font-medium">{d.getDate()}</span>
                        <button
                          onClick={() => openNew(key)}
                          className="rounded p-0.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-accent"
                          aria-label="Ajouter une intervention"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <div className="mt-1 space-y-1">
                        {evs.slice(0, view === "semaine" ? 6 : 2).map((e) => (
                          <button
                            key={e.id}
                            onClick={() => setSelected(e)}
                            className={cn(
                              "block w-full truncate rounded border px-1 py-0.5 text-left text-[0.64rem]",
                              TYPE_TONE[e.type],
                            )}
                          >
                            {e.time} {view === "semaine" ? e.reason : e.type}
                          </button>
                        ))}
                        {evs.length > (view === "semaine" ? 6 : 2) ? (
                          <div className="text-[0.62rem] text-muted-foreground">+{evs.length - 2}</div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="surface p-5">
            <SectionHeading title="Alertes" />
            <ul className="mt-3 space-y-2 text-sm">
              {o.overdueControls.map((e) => (
                <li key={e.id} className="flex gap-2 rounded-lg bg-critical/8 px-3 py-2 text-critical">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /> Contrôle en retard : {e.reason}
                </li>
              ))}
              {o.ongoing.map((e) => (
                <li key={e.id} className="flex gap-2 rounded-lg bg-warning/12 px-3 py-2 text-foreground">
                  <Syringe className="mt-0.5 h-4 w-4 shrink-0" /> {e.treatment} — {e.lot}
                </li>
              ))}
              {o.vaccinations.slice(0, 2).map((e) => (
                <li key={e.id} className="flex gap-2 rounded-lg bg-accent px-3 py-2 text-canopy">
                  <CalendarDays className="mt-0.5 h-4 w-4 shrink-0" /> {e.reason} le {frDate(e.date)}
                </li>
              ))}
              {!o.overdueControls.length && !o.ongoing.length && !o.vaccinations.length ? (
                <li className="text-muted-foreground">Aucune alerte sanitaire.</li>
              ) : null}
            </ul>
          </div>
          <div className="surface p-5">
            <SectionHeading title="Interventions récentes" />
            <ul className="mt-3 space-y-2">
              {o.recent.map((e) => (
                <li key={e.id}>
                  <button onClick={() => setSelected(e)} className="w-full rounded-lg px-2 py-1.5 text-left hover:bg-accent/50">
                    <div className="flex justify-between gap-2 text-sm">
                      <span className="truncate font-medium">{e.reason}</span>
                      <Money value={e.cost} />
                    </div>
                    <div className="num text-xs text-muted-foreground">
                      {frDate(e.date)} · {e.type}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      <div className="surface p-5">
        <SectionHeading title="Notes vétérinaires" description="Observations des dernières interventions" />
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          {o.recent.slice(0, 4).map((e) => (
            <div key={e.id} className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <div>{e.observations}</div>
              <div className="mt-1 text-[0.7rem] text-muted-foreground">
                {e.vet} · {frDate(e.date)} · {e.lot}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail */}
      <Dialog open={!!live} onOpenChange={(v) => !v && setSelected(null)}>
        <DialogContent className="sm:max-w-[520px]">
          {live ? (
            <>
              <DialogHeader>
                <DialogTitle>{live.reason}</DialogTitle>
                <DialogDescription>
                  {live.type} · {frDate(live.date)} à {live.time} · {live.vet}
                </DialogDescription>
              </DialogHeader>
              <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-sm">
                <dt className="text-muted-foreground">Élevage / lot</dt>
                <dd>{live.lot}</dd>
                <dt className="text-muted-foreground">Statut</dt>
                <dd>
                  <Select value={live.status} onValueChange={(v) => updateVetEvent(live.id, { status: v as VetEvent["status"] })}>
                    <SelectTrigger className="h-8 w-[150px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {["Planifié", "En cours", "Terminé"].map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </dd>
                <dt className="text-muted-foreground">Observations</dt>
                <dd>{live.observations || "—"}</dd>
                <dt className="text-muted-foreground">Traitement</dt>
                <dd>{live.treatment || "—"}</dd>
                <dt className="text-muted-foreground">Médicaments</dt>
                <dd>{live.medications || "—"}</dd>
                <dt className="text-muted-foreground">Prochaine action</dt>
                <dd>{live.nextAction || "—"}</dd>
                <dt className="text-muted-foreground">Prochain contrôle</dt>
                <dd>{live.nextControl ? frDate(live.nextControl) : "—"}</dd>
                <dt className="text-muted-foreground">Coût</dt>
                <dd>
                  <Money value={live.cost} />
                  {live.transactionId ? (
                    <Link to="/transactions" className="ml-2 text-xs text-primary hover:underline">
                      Voir la transaction
                    </Link>
                  ) : null}
                </dd>
                <dt className="text-muted-foreground">Document</dt>
                <dd>
                  {live.documentId ? (
                    <Link to="/documents" className="text-xs text-primary hover:underline">
                      {data.documents.find((d) => d.id === live.documentId)?.name ?? "Voir"}
                    </Link>
                  ) : (
                    "—"
                  )}
                </dd>
              </dl>
              <DialogFooter>
                <Button
                  variant="outline"
                  className="gap-1.5 text-critical"
                  onClick={() => {
                    deleteVetEvent(live.id);
                    setSelected(null);
                    toast.success("Intervention supprimée.");
                  }}
                >
                  <Trash2 className="h-4 w-4" /> Supprimer
                </Button>
                <Button
                  className="gap-1.5"
                  onClick={() => {
                    setEditing(live);
                    setSelected(null);
                    setFormOpen(true);
                  }}
                >
                  <Pencil className="h-4 w-4" /> Modifier
                </Button>
              </DialogFooter>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      <VetForm open={formOpen} onOpenChange={setFormOpen} event={editing} presetDate={presetDate} />
    </div>
  );
}

function VetForm({
  open,
  onOpenChange,
  event,
  presetDate,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  event: VetEvent | null;
  presetDate?: string;
}) {
  const { now, addVetEvent, updateVetEvent } = useStore();
  const blank = (): Omit<VetEvent, "id" | "transactionId" | "documentId"> => ({
    date: presetDate ?? ymd(now),
    time: "09:00",
    vet: VETS[0],
    lot: LOTS[0],
    type: "Visite vétérinaire",
    reason: "",
    observations: "",
    treatment: "",
    medications: "",
    nextAction: "",
    nextControl: null,
    status: "Planifié",
    cost: 0,
  });
  const [f, setF] = useState(blank);
  const [doc, setDoc] = useState("");

  useEffect(() => {
    if (!open) return;
    setF(event ? { ...event } : blank());
    setDoc("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, event]);

  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{event ? "Modifier l'intervention" : "Nouvelle intervention"}</DialogTitle>
          <DialogDescription>Le coût est reporté dans les transactions et la finance de l'élevage.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Date">
            <Input type="date" value={f.date} onChange={(e) => set("date", e.target.value)} />
          </Field>
          <Field label="Heure">
            <Input type="time" value={f.time} onChange={(e) => set("time", e.target.value)} />
          </Field>
          <Field label="Vétérinaire">
            <Input list="vet-list" value={f.vet} onChange={(e) => set("vet", e.target.value)} />
            <datalist id="vet-list">
              {VETS.map((v) => (
                <option key={v} value={v} />
              ))}
            </datalist>
          </Field>
          <Field label="Élevage / lot">
            <Select value={f.lot} onValueChange={(v) => set("lot", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LOTS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Type">
            <Select value={f.type} onValueChange={(v) => set("type", v as VetEventType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {VET_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Coût (DH)">
            <Input type="number" min={0} value={f.cost} onChange={(e) => set("cost", Number(e.target.value) || 0)} />
          </Field>
          <Field label="Motif" wide>
            <Input value={f.reason} onChange={(e) => set("reason", e.target.value)} placeholder="Ex. Vaccination rappel" />
          </Field>
          <Field label="Observations" wide>
            <Textarea rows={2} value={f.observations} onChange={(e) => set("observations", e.target.value)} />
          </Field>
          <Field label="Traitement">
            <Input value={f.treatment} onChange={(e) => set("treatment", e.target.value)} />
          </Field>
          <Field label="Médicaments">
            <Input value={f.medications} onChange={(e) => set("medications", e.target.value)} />
          </Field>
          <Field label="Prochaine action">
            <Input value={f.nextAction} onChange={(e) => set("nextAction", e.target.value)} />
          </Field>
          <Field label="Prochain contrôle">
            <Input
              type="date"
              value={f.nextControl ?? ""}
              onChange={(e) => set("nextControl", e.target.value || null)}
            />
          </Field>
          {!event ? (
            <Field label="Document (nom du fichier)" wide>
              <Input value={doc} onChange={(e) => setDoc(e.target.value)} placeholder="Ordonnance-vaccination.pdf" />
            </Field>
          ) : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!f.reason.trim() || !f.date}
            onClick={() => {
              if (event) {
                updateVetEvent(event.id, f);
                toast.success("Intervention mise à jour.");
              } else {
                addVetEvent(f, doc);
                toast.success(
                  f.cost > 0 ? "Intervention ajoutée et dépense enregistrée." : "Intervention ajoutée.",
                );
              }
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

function Field({ label, wide, children }: { label: string; wide?: boolean; children: React.ReactNode }) {
  return (
    <div className={cn("grid gap-1.5", wide && "sm:col-span-2")}>
      <Label>{label}</Label>
      {children}
    </div>
  );
}
