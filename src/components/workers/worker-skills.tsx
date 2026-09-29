import { CalendarClock, MapPin, UserCheck, Wand2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { StatusBadge } from "@/components/common/ui-bits";
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
import { farmName, recommendReplacements, versatilityLabel } from "@/data/selectors";
import { SKILLS, type SkillName, type Worker } from "@/data/types";
import { shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/app-store";

export function SkillLevel({ level }: { level: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`Niveau ${level} sur 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <span
          key={i}
          className={cn("h-1.5 w-3.5 rounded-full", i < level ? "bg-primary" : "bg-muted")}
        />
      ))}
    </span>
  );
}

export function AvailabilityBadge({ value }: { value?: string }) {
  const v = value ?? "Disponible";
  const tone =
    v === "Disponible"
      ? "bg-positive/12 text-positive"
      : v === "En congé"
        ? "bg-critical/10 text-critical"
        : "bg-warning/15 text-earth";
  return <span className={cn("rounded-full px-2 py-0.5 text-[0.7rem] font-medium", tone)}>{v}</span>;
}

/** Skills, availability, versatility and assignment history for a worker sheet. */
export function WorkerSkillsPanel({ worker, onAssign }: { worker: Worker; onAssign: () => void }) {
  const { data } = useStore();
  const skills = worker.skills ?? [];
  return (
    <section className="space-y-4">
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="surface bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Exploitation principale</div>
          <div className="font-medium">{farmName(data, worker.farmId)}</div>
        </div>
        <div className="surface bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Fonction</div>
          <div className="font-medium">{worker.role}</div>
        </div>
        <div className="surface bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Disponibilité</div>
          <div className="mt-1">
            <AvailabilityBadge value={worker.availability} />
          </div>
        </div>
        <div className="surface bg-muted/40 p-3">
          <div className="text-xs text-muted-foreground">Polyvalence</div>
          <div className="font-medium">
            {versatilityLabel(skills.length)} · {skills.length} comp.
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-sm font-semibold">Compétences</h3>
        <ul className="mt-2 space-y-2">
          {skills.map((s) => (
            <li key={s.name} className="flex items-center justify-between gap-3 text-sm">
              <span>{s.name}</span>
              <span className="flex items-center gap-3">
                <span className="num text-xs text-muted-foreground">{s.years} ans</span>
                <SkillLevel level={s.level} />
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Button variant="outline" className="w-full gap-2" onClick={onAssign}>
        <MapPin className="h-4 w-4" /> Affecter temporairement
      </Button>

      <div>
        <h3 className="font-display text-sm font-semibold">Historique des affectations</h3>
        <ul className="mt-2 space-y-2">
          {(worker.assignments ?? []).map((a) => (
            <li key={a.id} className="rounded-xl bg-muted/50 px-3 py-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-medium">{a.task}</span>
                <StatusBadge status={a.kind === "Temporaire" ? "En cours" : "Actif"} />
              </div>
              <div className="num mt-0.5 text-xs text-muted-foreground">
                {farmName(data, a.farmId)} · {shortDate(a.startDate)}
                {a.endDate ? ` → ${shortDate(a.endDate)}` : " → aujourd'hui"}
                {a.replacing ? ` · remplace ${a.replacing}` : ""}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function AssignDialog({
  worker,
  open,
  onOpenChange,
  defaults,
}: {
  worker: Worker | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaults?: { farmId?: string; task?: string; skill?: SkillName; date?: string; replacing?: string };
}) {
  const { data, now, assignWorker } = useStore();
  const today = now.toISOString().slice(0, 10);
  const [farmId, setFarmId] = useState("");
  const [task, setTask] = useState("");
  const [skill, setSkill] = useState<string>("");
  const [start, setStart] = useState(today);
  const [end, setEnd] = useState("");

  useEffect(() => {
    if (!open || !worker) return;
    setFarmId(defaults?.farmId ?? data.farms.find((f) => f.id !== worker.farmId)?.id ?? worker.farmId);
    setTask(defaults?.task ?? "");
    setSkill(defaults?.skill ?? worker.skills?.[0]?.name ?? "");
    const s = defaults?.date ?? today;
    setStart(s);
    const e = new Date(s);
    e.setDate(e.getDate() + 5);
    setEnd(e.toISOString().slice(0, 10));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, worker?.id]);

  if (!worker) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Affecter temporairement {worker.name}</DialogTitle>
          <DialogDescription>L'affectation est ajoutée à l'historique de l'ouvrier.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-3">
          <div className="grid gap-1.5">
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
          <div className="grid gap-1.5">
            <Label>Tâche</Label>
            <Input value={task} onChange={(e) => setTask(e.target.value)} placeholder="Ex. Irrigation secteur nord" />
          </div>
          <div className="grid gap-1.5">
            <Label>Compétence</Label>
            <Select value={skill} onValueChange={setSkill}>
              <SelectTrigger>
                <SelectValue placeholder="Choisir" />
              </SelectTrigger>
              <SelectContent>
                {SKILLS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="grid gap-1.5">
              <Label>Début</Label>
              <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
              <Label>Fin</Label>
              <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button
            disabled={!task.trim() || !start}
            onClick={() => {
              if (end && end < start) {
                toast.error("La date de fin doit suivre la date de début.");
                return;
              }
              assignWorker(worker.id, {
                farmId,
                task: task.trim(),
                skill: (skill || null) as SkillName | null,
                startDate: start,
                endDate: end,
                kind: "Temporaire",
                replacing: defaults?.replacing,
              });
              toast.success(`${worker.name} affecté(e) à ${farmName(data, farmId)}.`);
              onOpenChange(false);
            }}
          >
            Confirmer l'affectation
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** "Trouver un remplaçant" — simulated AI ranking. */
export function ReplacementDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data, now } = useStore();
  const today = now.toISOString().slice(0, 10);
  const [task, setTask] = useState("Irrigation secteur nord");
  const [farmId, setFarmId] = useState("f-orange");
  const [skill, setSkill] = useState<SkillName>("Irrigation");
  const [date, setDate] = useState(today);
  const [assignFor, setAssignFor] = useState<Worker | null>(null);

  const results = useMemo(
    () => recommendReplacements(data, { skill, farmId, date }),
    [data, skill, farmId, date],
  );

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-[620px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="h-4 w-4 text-primary" /> Trouver un remplaçant
            </DialogTitle>
            <DialogDescription>
              Recommandations basées sur les compétences, le niveau, la disponibilité et l'expérience.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="grid gap-1.5 sm:col-span-2">
              <Label>Tâche</Label>
              <Input value={task} onChange={(e) => setTask(e.target.value)} />
            </div>
            <div className="grid gap-1.5">
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
            <div className="grid gap-1.5">
              <Label>Compétence nécessaire</Label>
              <Select value={skill} onValueChange={(v) => setSkill(v as SkillName)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SKILLS.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label>Date</Label>
              <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </div>
          </div>

          <div className="mt-2 space-y-2">
            <div className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
              {results.length} profils recommandés
            </div>
            {results.map((r, idx) => (
              <div key={r.worker.id} className="surface flex items-start justify-between gap-3 p-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="num flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-canopy">
                      {idx + 1}
                    </span>
                    <span className="font-semibold">{r.worker.name}</span>
                    <AvailabilityBadge value={r.worker.availability} />
                  </div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {r.worker.role} · {farmName(data, r.worker.farmId)}
                  </div>
                  <ul className="mt-1.5 flex flex-wrap gap-1">
                    {r.reasons.map((x) => (
                      <li key={x} className="rounded-full bg-muted px-2 py-0.5 text-[0.68rem]">
                        {x}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="flex shrink-0 flex-col items-end gap-2">
                  <span className="num font-display text-lg font-semibold text-primary">{r.score}%</span>
                  <Button size="sm" className="gap-1.5" onClick={() => setAssignFor(r.worker)}>
                    <UserCheck className="h-3.5 w-3.5" /> Affecter
                  </Button>
                </div>
              </div>
            ))}
            {results.length === 0 ? (
              <p className="flex items-center gap-2 text-sm text-muted-foreground">
                <CalendarClock className="h-4 w-4" /> Aucun ouvrier ne possède cette compétence.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
      <AssignDialog
        worker={assignFor}
        open={!!assignFor}
        onOpenChange={(v) => !v && setAssignFor(null)}
        defaults={{ farmId, task, skill, date }}
      />
    </>
  );
}
