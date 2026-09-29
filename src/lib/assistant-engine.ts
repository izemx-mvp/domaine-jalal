/**
 * Simulated assistant: matches the question against intents and answers from local demo data.
 * No real AI call is made (front-end-only demo).
 */
import {
  byCategory,
  byFarm,
  farmName,
  isExpense,
  recommendReplacements,
  remainingOf,
  scopeTransactions,
  topSuppliers,
  totals,
  vetOverview,
  type ReplacementCandidate,
} from "@/data/selectors";
import { SKILLS, type AppData, type SkillName } from "@/data/types";
import { formatMAD } from "@/lib/format";

export type AnswerBlock =
  | { kind: "text"; text: string }
  | { kind: "kpis"; items: { label: string; value: string }[] }
  | { kind: "bars"; title: string; items: { label: string; value: number }[] }
  | { kind: "table"; columns: string[]; rows: string[][] }
  | {
      kind: "workers";
      candidates: ReplacementCandidate[];
      context: { farmId: string; skill: SkillName; task: string; date: string; replacing?: string };
    }
  | { kind: "transactions"; ids: string[] }
  | { kind: "links"; links: { label: string; to: string; params?: Record<string, string> }[] };

export const SUGGESTIONS = [
  "Combien avons-nous dépensé ce mois-ci ?",
  "Quelle exploitation dépense le plus ?",
  "Quel montant reste à payer aux fournisseurs ?",
  "Quels ouvriers peuvent remplacer Ahmed pour l'irrigation ?",
  "Quelles sont les prochaines visites vétérinaires ?",
  "Quels traitements vétérinaires sont en cours ?",
];

const norm = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ");

const has = (q: string, ...words: string[]) => words.some((w) => q.includes(w));

const frDay = (s: string) =>
  new Date(`${s}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });

function findSkill(q: string): SkillName | null {
  const map: [string, SkillName][] = [
    ["irrig", "Irrigation"],
    ["recolt", "Récolte"],
    ["machine", "Conduite de machines"],
    ["tracteur", "Conduite de machines"],
    ["maintenan", "Maintenance"],
    ["traitement agricole", "Traitement agricole"],
    ["phyto", "Traitement agricole"],
    ["stock", "Stockage"],
    ["alimentation", "Alimentation du bétail"],
    ["betail", "Alimentation du bétail"],
    ["surveillance", "Surveillance élevage"],
    ["manutention", "Manutention"],
  ];
  for (const [k, v] of map) if (q.includes(k)) return v;
  return null;
}

function findFarm(data: AppData, q: string) {
  if (has(q, "orange", "banane", "agrume")) return data.farms.find((f) => f.id === "f-orange");
  if (has(q, "ble 2", "ble2")) return data.farms.find((f) => f.id === "f-ble2");
  if (has(q, "ble 1", "ble1")) return data.farms.find((f) => f.id === "f-ble1");
  if (has(q, "bovin", "elevage")) return data.farms.find((f) => f.id === "f-bovin");
  return undefined;
}

function findWorker(data: AppData, q: string) {
  return data.workers.find((w) => {
    const parts = norm(w.name).split(" ");
    return q.includes(norm(w.name)) || parts.some((p) => p.length > 3 && new RegExp(`\\b${p}\\b`).test(q));
  });
}

export function answer(data: AppData, now: Date, question: string): AnswerBlock[] {
  const q = norm(question);
  const today = now.toISOString().slice(0, 10);

  // --- Veterinary
  if (has(q, "veterin", "vaccin", "visite", "sanitaire") || (has(q, "traitement") && !has(q, "agricole"))) {
    const o = vetOverview(data, now);
    if (has(q, "en cours", "traitement")) {
      return [
        { kind: "text", text: `${o.ongoing.length} traitement(s) vétérinaire(s) en cours sur l'élevage bovin.` },
        {
          kind: "table",
          columns: ["Date", "Lot", "Traitement", "Médicaments"],
          rows: o.ongoing.map((e) => [e.date, e.lot, e.treatment, e.medications]),
        },
        { kind: "links", links: [{ label: "Ouvrir le suivi vétérinaire", to: "/exploitations/$slug", params: { slug: "elevage-bovin" } }] },
      ];
    }
    const list = has(q, "vaccin") ? o.vaccinations : o.upcoming;
    return [
      {
        kind: "text",
        text: o.nextVisit
          ? `Prochaine intervention : ${o.nextVisit.type.toLowerCase()} le ${frDay(o.nextVisit.date)} à ${o.nextVisit.time} avec ${o.nextVisit.vet}.`
          : "Aucune intervention vétérinaire n'est planifiée.",
      },
      {
        kind: "kpis",
        items: [
          { label: "À venir", value: String(o.upcoming.length) },
          { label: "Vaccinations", value: String(o.vaccinations.length) },
          { label: "Coût année", value: formatMAD(o.costYear, { compact: true }) },
        ],
      },
      {
        kind: "table",
        columns: ["Date", "Type", "Lot", "Vétérinaire"],
        rows: list.slice(0, 6).map((e) => [`${e.date} ${e.time}`, e.type, e.lot, e.vet]),
      },
      { kind: "links", links: [{ label: "Voir le calendrier vétérinaire", to: "/exploitations/$slug", params: { slug: "elevage-bovin" } }] },
    ];
  }

  // --- Replacement / skills
  if (has(q, "remplac", "competen", "affect") || (has(q, "ouvrier") && findSkill(q))) {
    const worker = findWorker(data, q);
    const skill = findSkill(q) ?? worker?.skills?.[0]?.name ?? "Irrigation";
    const farm = findFarm(data, q) ?? (worker ? data.farms.find((f) => f.id === worker.farmId) : data.farms[0]);
    const candidates = recommendReplacements(data, {
      skill,
      farmId: farm!.id,
      date: today,
      excludeId: worker?.id,
    });
    return [
      {
        kind: "text",
        text: worker
          ? `${worker.name} (${worker.role}, ${farmName(data, worker.farmId)}) est actuellement « ${worker.availability ?? "Disponible"} ». Voici les meilleurs profils en ${skill.toLowerCase()} pour le remplacer :`
          : `Profils recommandés en ${skill.toLowerCase()} pour ${farm!.name} :`,
      },
      {
        kind: "workers",
        candidates,
        context: {
          farmId: farm!.id,
          skill,
          task: `${skill} — ${worker ? `remplacement de ${worker.name.split(" ")[0]}` : farm!.name}`,
          date: today,
          replacing: worker?.name,
        },
      },
      { kind: "links", links: [{ label: "Gérer les ouvriers", to: "/ouvriers" }] },
    ];
  }

  // --- Supplier debt
  if (has(q, "reste a payer", "fournisseur", "dette", "doit")) {
    const all = totals(data.transactions);
    const top = topSuppliers(data, data.transactions, 20)
      .filter((s) => s.remaining > 0)
      .sort((a, b) => b.remaining - a.remaining)
      .slice(0, 6);
    const open = data.transactions
      .filter((t) => t.partyKind === "supplier" && !t.cancelled && remainingOf(t) > 0)
      .sort((a, b) => remainingOf(b) - remainingOf(a))
      .slice(0, 5);
    return [
      { kind: "text", text: `Il reste ${formatMAD(all.supplierDebt)} à régler aux fournisseurs, réparti sur ${top.length}+ fournisseurs.` },
      { kind: "bars", title: "Reste à payer par fournisseur", items: top.map((s) => ({ label: s.name, value: s.remaining })) },
      { kind: "transactions", ids: open.map((t) => t.id) },
      { kind: "links", links: [{ label: "Voir les fournisseurs", to: "/fournisseurs" }, { label: "Finance", to: "/finance" }] },
    ];
  }

  // --- Which farm spends the most
  if (has(q, "exploitation") && has(q, "plus", "classement", "compar")) {
    const scoped = scopeTransactions(data, { period: "year", farmId: "all", now });
    const rows = byFarm(data, scoped).sort((a, b) => b.depenses - a.depenses);
    return [
      { kind: "text", text: `Sur l'année, ${rows[0].name} est l'exploitation qui dépense le plus avec ${formatMAD(rows[0].depenses)}.` },
      { kind: "bars", title: "Dépenses par exploitation (année)", items: rows.map((r) => ({ label: r.name, value: r.depenses })) },
      { kind: "links", links: [{ label: `Ouvrir ${rows[0].name}`, to: "/exploitations/$slug", params: { slug: rows[0].slug } }] },
    ];
  }

  // --- Collections / clients
  if (has(q, "client", "encaiss", "recevoir")) {
    const t = totals(data.transactions);
    return [
      { kind: "text", text: `${formatMAD(t.toReceive)} restent à encaisser auprès des clients.` },
      { kind: "kpis", items: [
        { label: "Facturé", value: formatMAD(t.incomeInvoiced, { compact: true }) },
        { label: "Encaissé", value: formatMAD(t.collected, { compact: true }) },
        { label: "À recevoir", value: formatMAD(t.toReceive, { compact: true }) },
      ] },
      { kind: "links", links: [{ label: "Voir les clients", to: "/clients" }] },
    ];
  }

  // --- Spending (month / period)
  if (has(q, "depens", "combien", "cout", "budget", "mois")) {
    const farm = findFarm(data, q);
    const period = has(q, "annee", "an ") ? "year" : has(q, "semaine") ? "7d" : "30d";
    const scoped = scopeTransactions(data, { period, farmId: farm?.id ?? "all", now });
    const t = totals(scoped);
    const cats = byCategory(scoped).slice(0, 6);
    const recent = scoped.filter(isExpense).sort((a, b) => b.date.localeCompare(a.date)).slice(0, 5);
    const label = period === "year" ? "sur l'année" : period === "7d" ? "ces 7 derniers jours" : "ce mois-ci (30 jours)";
    return [
      { kind: "text", text: `${farm ? farm.name + " a" : "Le domaine a"} dépensé ${formatMAD(t.expenses)} ${label}, dont ${formatMAD(t.toPay)} restent à payer.` },
      { kind: "kpis", items: [
        { label: "Dépenses", value: formatMAD(t.expenses, { compact: true }) },
        { label: "Payé", value: formatMAD(t.paidOut, { compact: true }) },
        { label: "À payer", value: formatMAD(t.toPay, { compact: true }) },
      ] },
      { kind: "bars", title: "Principales catégories", items: cats.map((c) => ({ label: c.name, value: c.value })) },
      { kind: "transactions", ids: recent.map((x) => x.id) },
      { kind: "links", links: [{ label: "Ouvrir les transactions", to: "/transactions" }] },
    ];
  }

  if (has(q, "ouvrier", "equipe")) {
    const skill = findSkill(q);
    const list = data.workers.filter((w) => !skill || w.skills?.some((s) => s.name === skill));
    return [
      { kind: "text", text: `${list.length} ouvriers${skill ? ` maîtrisent ${skill.toLowerCase()}` : " sont suivis"}. Disponibles aujourd'hui : ${list.filter((w) => w.availability === "Disponible").length}.` },
      { kind: "table", columns: ["Ouvrier", "Exploitation", "Disponibilité"], rows: list.slice(0, 8).map((w) => [w.name, farmName(data, w.farmId), w.availability ?? "—"]) },
      { kind: "links", links: [{ label: "Gérer les ouvriers", to: "/ouvriers" }] },
    ];
  }

  return [
    {
      kind: "text",
      text: `Je peux analyser les dépenses, exploitations, fournisseurs, clients, ouvriers (${SKILLS.slice(0, 3).join(", ").toLowerCase()}…) et le suivi vétérinaire. Essayez l'une de ces questions :`,
    },
  ];
}
