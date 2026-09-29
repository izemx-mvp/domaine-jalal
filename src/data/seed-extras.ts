import {
  DEMO_NOW,
  SKILLS,
  type AppData,
  type Assignment,
  type Availability,
  type DocumentItem,
  type SkillName,
  type Transaction,
  type VetEvent,
  type Worker,
  type WorkerSkill,
} from "./types";

/** Deterministic helpers (independent RNG so the main seed stays stable). */
function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) >>> 0;
    return s / 4294967296;
  };
}

const ROLE_SKILLS: Record<string, SkillName[]> = {
  Irrigateur: ["Irrigation", "Maintenance"],
  Tractoriste: ["Conduite de machines", "Maintenance"],
  Vacher: ["Alimentation du bétail", "Surveillance élevage"],
  Magasinier: ["Stockage", "Manutention"],
  Gardien: ["Surveillance élevage", "Manutention"],
  "Chef d'équipe": ["Récolte", "Irrigation"],
  "Ouvrière de récolte": ["Récolte", "Manutention"],
  "Technicien agricole": ["Traitement agricole", "Irrigation"],
  "Ouvrier agricole": ["Récolte", "Manutention"],
};

const FARM_SKILL: Record<string, SkillName> = {
  "f-orange": "Irrigation",
  "f-ble1": "Conduite de machines",
  "f-ble2": "Récolte",
  "f-bovin": "Alimentation du bétail",
};

const FARM_IDS = ["f-orange", "f-ble1", "f-ble2", "f-bovin"];

const dateOffset = (days: number) => {
  const d = new Date(DEMO_NOW);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

export function enrichWorker(w: Worker, i: number): Worker {
  if (w.skills && w.availability && w.assignments) return w;
  const rnd = makeRng(1000 + i * 37);
  const base = ROLE_SKILLS[w.role] ?? ["Manutention"];
  const set = new Set<SkillName>([...base, FARM_SKILL[w.farmId] ?? "Manutention"]);
  const extra = Math.floor(rnd() * 3);
  for (let k = 0; k < extra; k++) set.add(SKILLS[Math.floor(rnd() * SKILLS.length)]);
  const skills: WorkerSkill[] = [...set].map((name, idx) => ({
    name,
    level: Math.max(1, Math.min(5, (idx === 0 ? 4 : 2) + Math.floor(rnd() * 2))),
    years: 1 + Math.floor(rnd() * 12),
  }));

  let availability: Availability =
    w.status === "Inactif" ? "En congé" : rnd() > 0.72 ? "Occupé" : "Disponible";

  const assignments: Assignment[] = [
    {
      id: `as-${w.id}-0`,
      farmId: w.farmId,
      task: `Affectation principale — ${w.role}`,
      skill: skills[0]?.name ?? null,
      startDate: dateOffset(-(200 + Math.floor(rnd() * 900))),
      endDate: "",
      kind: "Permanente",
    },
  ];
  if (rnd() > 0.55) {
    const other = FARM_IDS.filter((f) => f !== w.farmId)[Math.floor(rnd() * 3)];
    const start = -(20 + Math.floor(rnd() * 150));
    assignments.push({
      id: `as-${w.id}-1`,
      farmId: other,
      task: `Renfort ${skills[skills.length - 1]?.name.toLowerCase() ?? "équipe"}`,
      skill: skills[skills.length - 1]?.name ?? null,
      startDate: dateOffset(start),
      endDate: dateOffset(start + 4 + Math.floor(rnd() * 10)),
      kind: "Temporaire",
    });
  }

  // Scenario: Ahmed (irrigation expert) is on leave, which motivates the replacement flow.
  if (w.name.startsWith("Ahmed")) {
    availability = "En congé";
    const irr = skills.find((s) => s.name === "Irrigation");
    if (irr) irr.level = 5;
    else skills.unshift({ name: "Irrigation", level: 5, years: 9 });
  }

  return { ...w, skills, availability, assignments };
}

export function enrichWorkers(workers: Worker[]): Worker[] {
  return workers.map((w, i) => enrichWorker(w, i));
}

const VETS = ["Dr. Karim Alaoui", "Dr. Samira Bennani", "Dr. Omar Tazi"];
const LOTS = ["Lot A — Vaches laitières", "Lot B — Génisses", "Lot C — Veaux", "Lot D — Taurillons"];

type VetSeed = [
  number, // day offset
  string, // time
  number, // vet
  number, // lot
  VetEvent["type"],
  string, // reason
  string, // treatment
  string, // medications
  number, // cost
  number | null, // next control offset (relative to event)
];

const VET_SEED: VetSeed[] = [
  [-58, "09:00", 0, 0, "Visite vétérinaire", "Bilan sanitaire trimestriel", "—", "—", 1800, 90],
  [-44, "08:30", 1, 2, "Vaccination", "Vaccination BVD veaux", "Vaccin BVD", "Bovilis BVD (24 doses)", 3600, 180],
  [-31, "10:15", 0, 1, "Traitement", "Mammite clinique — 3 génisses", "Antibiothérapie 5 jours", "Cobactan LC, Metacam", 2400, 10],
  [-21, "14:00", 2, 3, "Contrôle", "Contrôle boiteries", "Parage + pansement", "Spray oxytétracycline", 1500, 21],
  [-12, "09:30", 1, 0, "Traitement", "Déparasitage lot A", "Antiparasitaire pour-on", "Ivomec pour-on", 2400, 30],
  [-6, "11:00", 0, 2, "Suivi", "Suivi croissance veaux", "Complément vitaminé", "AD3E injectable", 900, 14],
  [-2, "16:00", 2, 0, "Renouvellement médicament", "Stock anti-inflammatoires", "—", "Metacam 100 ml ×4", 1200, null],
  [0, "08:00", 1, 1, "Traitement", "Diarrhée néonatale", "Réhydratation orale en cours", "Diaproof-K, Bi-Sol", 1100, 5],
  [3, "09:00", 0, 0, "Visite vétérinaire", "Visite mensuelle de routine", "—", "—", 1800, null],
  [8, "10:00", 1, 2, "Vaccination", "Rappel entérotoxémie", "Vaccin clostridies", "Covexin 10", 2900, null],
  [14, "08:30", 2, 3, "Contrôle", "Contrôle post-parage", "—", "—", 800, null],
  [21, "09:00", 1, 0, "Vaccination", "Fièvre aphteuse (campagne ONSSA)", "Vaccin FA", "Aftovax", 3200, null],
  [32, "11:30", 0, 1, "Suivi", "Échographies gestation", "—", "—", 2000, null],
  [45, "09:00", 2, 0, "Visite vétérinaire", "Bilan sanitaire trimestriel", "—", "—", 1800, null],
];

export function buildVetSeed(): {
  vetEvents: VetEvent[];
  transactions: Transaction[];
  documents: DocumentItem[];
} {
  const vetEvents: VetEvent[] = [];
  const transactions: Transaction[] = [];
  const documents: DocumentItem[] = [];

  VET_SEED.forEach(([off, time, vi, li, type, reason, treatment, meds, cost, next], i) => {
    const date = dateOffset(off);
    const done = off < 0;
    const inProgress = type === "Traitement" && off >= -12;
    const id = `vet-${i + 1}`;
    let transactionId: string | null = null;
    let documentId: string | null = null;

    if (done || inProgress) {
      transactionId = `t-vet-${i + 1}`;
      const iso = new Date(`${date}T${time}:00`).toISOString();
      transactions.push({
        id: transactionId,
        reference: `TRX-2026-V${String(i + 1).padStart(3, "0")}`,
        date: iso,
        farmId: "f-bovin",
        type: "Dépense",
        category: "Vétérinaire",
        partyKind: "none",
        partyId: null,
        amount: cost,
        method: i % 2 ? "Virement bancaire" : "Chèque",
        description: `${type} — ${reason} (${VETS[vi]})`,
        source: "Manuel",
        payments:
          off < -5
            ? [
                {
                  id: `p-vet-${i + 1}`,
                  date: iso,
                  amount: cost,
                  method: i % 2 ? "Virement bancaire" : "Chèque",
                  reference: `REG-VET-${i + 1}`,
                  note: "Honoraires vétérinaires",
                },
              ]
            : [],
        documentId: `d-vet-${i + 1}`,
      });
      documentId = `d-vet-${i + 1}`;
      documents.push({
        id: documentId,
        name: `Compte-rendu ${type.toLowerCase()} — ${date}.pdf`,
        category: "Vétérinaire",
        farmId: "f-bovin",
        entity: VETS[vi],
        transactionRef: `TRX-2026-V${String(i + 1).padStart(3, "0")}`,
        date: new Date(`${date}T${time}:00`).toISOString(),
        sizeKb: 180 + i * 23,
        status: off < -5 ? "Validé" : "En attente",
      });
    }

    vetEvents.push({
      id,
      date,
      time,
      vet: VETS[vi],
      lot: LOTS[li],
      type,
      reason,
      observations: done
        ? "Animaux examinés, état général satisfaisant. Suivi recommandé."
        : "Intervention planifiée.",
      treatment,
      medications: meds,
      nextAction: next ? "Contrôle de suivi" : "",
      nextControl: next ? dateOffset(off + next) : null,
      status: inProgress ? "En cours" : done ? "Terminé" : "Planifié",
      cost,
      transactionId,
      documentId,
    });
  });

  return { vetEvents, transactions, documents };
}

/** Upgrade data persisted by an earlier version of the demo. */
export function upgradeData(parsed: AppData): AppData {
  let next = parsed;
  if (!Array.isArray(parsed.vetEvents)) {
    const vet = buildVetSeed();
    next = {
      ...next,
      vetEvents: vet.vetEvents,
      transactions: [...vet.transactions, ...next.transactions],
      documents: [...vet.documents, ...next.documents],
    };
  }
  if (next.workers.some((w) => !w.skills)) {
    next = { ...next, workers: enrichWorkers(next.workers) };
  }
  if (!next.settings.categories.includes("Vétérinaire")) {
    next = { ...next, settings: { ...next.settings, categories: [...next.settings.categories] } };
  }
  return next;
}
