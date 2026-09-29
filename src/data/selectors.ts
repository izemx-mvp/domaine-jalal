import {
  EXPENSE_TYPES,
  INCOME_TYPES,
  type AppData,
  type Transaction,
  type TransactionStatus,
} from "./types";

export const paidOf = (t: Transaction) => t.payments.reduce((s, p) => s + p.amount, 0);
export const remainingOf = (t: Transaction) => Math.max(0, t.amount - paidOf(t));

export function statusOf(t: Transaction): TransactionStatus {
  if (t.cancelled) return "Annulé";
  const paid = paidOf(t);
  if (paid >= t.amount) return "Payé";
  if (paid > 0) return "Partiellement payé";
  if (t.type === "Achat" || t.type === "Dépense") return "À payer";
  return "En attente";
}

export const isExpense = (t: Transaction) => EXPENSE_TYPES.includes(t.type) && !t.cancelled;
export const isIncome = (t: Transaction) => INCOME_TYPES.includes(t.type) && !t.cancelled;

export type Period = "today" | "7d" | "30d" | "year" | "all";

export function periodRange(period: Period, now: Date) {
  const end = new Date(now);
  const start = new Date(now);
  switch (period) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "7d":
      start.setDate(start.getDate() - 7);
      break;
    case "30d":
      start.setDate(start.getDate() - 30);
      break;
    case "year":
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
      break;
    case "all":
      start.setFullYear(start.getFullYear() - 5);
      break;
  }
  return { start, end };
}

export function inRange(t: { date: string }, start: Date, end: Date) {
  const d = new Date(t.date).getTime();
  return d >= start.getTime() && d <= end.getTime();
}

export function scopeTransactions(
  data: AppData,
  opts: { period: Period; farmId: string | "all"; now: Date },
) {
  const { start, end } = periodRange(opts.period, opts.now);
  return data.transactions.filter(
    (t) => inRange(t, start, end) && (opts.farmId === "all" || t.farmId === opts.farmId),
  );
}

export function previousScopeTransactions(
  data: AppData,
  opts: { period: Period; farmId: string | "all"; now: Date },
) {
  const { start, end } = periodRange(opts.period, opts.now);
  const span = end.getTime() - start.getTime();
  const prevEnd = new Date(start.getTime() - 1);
  const prevStart = new Date(start.getTime() - span);
  return data.transactions.filter(
    (t) =>
      inRange(t, prevStart, prevEnd) && (opts.farmId === "all" || t.farmId === opts.farmId),
  );
}

export function sum(list: Transaction[], fn: (t: Transaction) => number) {
  return list.reduce((s, t) => s + fn(t), 0);
}

export function evolution(current: number, previous: number) {
  if (!previous) return current ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

export function totals(list: Transaction[]) {
  const expenses = list.filter(isExpense);
  const incomes = list.filter(isIncome);
  return {
    expenses: sum(expenses, (t) => t.amount),
    incomeInvoiced: sum(incomes, (t) => t.amount),
    collected: sum(incomes, paidOf),
    toReceive: sum(incomes, remainingOf),
    supplierDebt: sum(
      list.filter((t) => t.partyKind === "supplier" && !t.cancelled),
      remainingOf,
    ),
    advances: sum(
      list.filter((t) => t.type === "Avance" && !t.cancelled),
      (t) => t.amount,
    ),
    workerPayments: sum(
      list.filter((t) => t.type === "Paiement" && !t.cancelled),
      (t) => t.amount,
    ),
    paidOut: sum(expenses, paidOf),
    toPay: sum(expenses, remainingOf),
    count: list.length,
  };
}

export function supplierStats(data: AppData, supplierId: string) {
  const list = data.transactions.filter((t) => t.partyId === supplierId && !t.cancelled);
  const total = sum(list, (t) => t.amount);
  const paid = sum(list, paidOf);
  return {
    transactions: list,
    count: list.length,
    total,
    paid,
    remaining: total - paid,
    last: list.map((t) => t.date).sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

export function workerStats(data: AppData, workerId: string) {
  const list = data.transactions.filter((t) => t.partyId === workerId && !t.cancelled);
  const advances = sum(
    list.filter((t) => t.type === "Avance"),
    (t) => t.amount,
  );
  const payments = sum(
    list.filter((t) => t.type === "Paiement"),
    (t) => t.amount,
  );
  return {
    transactions: list,
    advances,
    payments,
    balance: payments - advances,
    last: list.map((t) => t.date).sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

export function clientStats(data: AppData, clientId: string) {
  const list = data.transactions.filter((t) => t.partyId === clientId && !t.cancelled);
  const total = sum(list, (t) => t.amount);
  const collected = sum(list, paidOf);
  return {
    transactions: list,
    total,
    collected,
    remaining: total - collected,
    last:
      list
        .flatMap((t) => t.payments.map((p) => p.date))
        .sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

export function farmStats(data: AppData, farmId: string, now: Date) {
  const list = data.transactions.filter((t) => t.farmId === farmId && !t.cancelled);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthList = list.filter((t) => new Date(t.date) >= monthStart);
  const prevMonthList = list.filter((t) => {
    const d = new Date(t.date);
    return (
      d >= new Date(now.getFullYear(), now.getMonth() - 1, 1) &&
      d < monthStart
    );
  });
  const farm = data.farms.find((f) => f.id === farmId)!;
  const monthExpenses = sum(monthList.filter(isExpense), (t) => t.amount);
  const prevExpenses = sum(prevMonthList.filter(isExpense), (t) => t.amount);
  const supplierIds = new Set(
    list.filter((t) => t.partyKind === "supplier").map((t) => t.partyId),
  );
  return {
    farm,
    transactions: list,
    totalExpenses: sum(list.filter(isExpense), (t) => t.amount),
    monthExpenses,
    budgetUsed: farm.monthlyBudget ? (monthExpenses / farm.monthlyBudget) * 100 : 0,
    variation: evolution(monthExpenses, prevExpenses),
    workers: data.workers.filter((w) => w.farmId === farmId).length,
    suppliers: supplierIds.size,
    count: list.length,
    flows: data.flows.filter((f) => f.fromFarmId === farmId || f.toFarmId === farmId).length,
    documents: data.documents.filter((d) => d.farmId === farmId).length,
    collected: sum(list.filter(isIncome), paidOf),
    debt: sum(
      list.filter((t) => t.partyKind === "supplier"),
      remainingOf,
    ),
    last: list.map((t) => t.date).sort((a, b) => b.localeCompare(a))[0] ?? null,
  };
}

export function monthlySeries(data: AppData, farmId: string | "all", now: Date, months = 12) {
  const out: { month: string; key: string; depenses: number; encaissements: number }[] = [];
  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const next = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
    const list = data.transactions.filter((t) => {
      const td = new Date(t.date);
      return td >= d && td < next && (farmId === "all" || t.farmId === farmId);
    });
    out.push({
      month: d.toLocaleDateString("fr-FR", { month: "short" }).replace(".", ""),
      key: d.toISOString(),
      depenses: sum(list.filter(isExpense), (t) => t.amount),
      encaissements: sum(list.filter(isIncome), paidOf),
    });
  }
  return out;
}

export function byFarm(data: AppData, list: Transaction[]) {
  return data.farms.map((f) => ({
    name: f.name,
    slug: f.slug,
    depenses: sum(
      list.filter((t) => t.farmId === f.id).filter(isExpense),
      (t) => t.amount,
    ),
    budget: f.monthlyBudget,
  }));
}

export function byCategory(list: Transaction[]) {
  const map = new Map<string, number>();
  for (const t of list.filter(isExpense))
    map.set(t.category, (map.get(t.category) ?? 0) + t.amount);
  return [...map.entries()]
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

export function topSuppliers(data: AppData, list: Transaction[], limit = 6) {
  const map = new Map<string, { total: number; remaining: number }>();
  for (const t of list.filter((x) => x.partyKind === "supplier" && !x.cancelled)) {
    const entry = map.get(t.partyId!) ?? { total: 0, remaining: 0 };
    entry.total += t.amount;
    entry.remaining += remainingOf(t);
    map.set(t.partyId!, entry);
  }
  return [...map.entries()]
    .map(([id, v]) => ({
      name: data.suppliers.find((s) => s.id === id)?.name ?? "—",
      ...v,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function partyName(data: AppData, t: Transaction) {
  if (t.partyKind === "supplier") return data.suppliers.find((s) => s.id === t.partyId)?.name ?? "—";
  if (t.partyKind === "worker") return data.workers.find((w) => w.id === t.partyId)?.name ?? "—";
  if (t.partyKind === "client") return data.clients.find((c) => c.id === t.partyId)?.name ?? "—";
  return "Domaine Jalal";
}

export function farmName(data: AppData, farmId: string) {
  return data.farms.find((f) => f.id === farmId)?.name ?? "—";
}

export function flowsBetween(data: AppData) {
  const map = new Map<string, { from: string; to: string; count: number; value: number; product: string; last: string }>();
  for (const f of data.flows) {
    const key = `${f.fromFarmId}->${f.toFarmId}`;
    const e = map.get(key);
    if (e) {
      e.count += 1;
      e.value += f.value;
      if (f.date > e.last) {
        e.last = f.date;
        e.product = f.product;
      }
    } else {
      map.set(key, {
        from: f.fromFarmId,
        to: f.toFarmId,
        count: 1,
        value: f.value,
        product: f.product,
        last: f.date,
      });
    }
  }
  return [...map.values()];
}

/* ---------------- Worker skills & replacement ---------------- */

export interface ReplacementCandidate {
  worker: import("./types").Worker;
  score: number;
  level: number;
  years: number;
  sameFarm: boolean;
  reasons: string[];
}

export function isBusyOn(w: import("./types").Worker, date: string) {
  return (w.assignments ?? []).some(
    (a) => a.kind === "Temporaire" && a.startDate <= date && (!a.endDate || a.endDate >= date),
  );
}

/** Simulated "AI" ranking: skill level, experience, availability, farm proximity, versatility. */
export function recommendReplacements(
  data: AppData,
  opts: { skill: string; farmId: string; date: string; excludeId?: string },
  limit = 5,
): ReplacementCandidate[] {
  return data.workers
    .filter((w) => w.id !== opts.excludeId && w.status !== "Inactif")
    .map((w) => {
      const sk = (w.skills ?? []).find((s) => s.name === opts.skill);
      if (!sk) return null;
      const reasons: string[] = [];
      let score = sk.level * 16 + Math.min(sk.years, 10) * 2;
      reasons.push(`Niveau ${sk.level}/5 en ${opts.skill.toLowerCase()} · ${sk.years} ans`);
      const busy = isBusyOn(w, opts.date);
      if (w.availability === "Disponible" && !busy) {
        score += 20;
        reasons.push("Disponible à la date");
      } else if (w.availability === "En congé") {
        score -= 60;
        reasons.push("En congé");
      } else {
        score -= 12;
        reasons.push(busy ? "Déjà affecté à cette date" : "Actuellement occupé");
      }
      const sameFarm = w.farmId === opts.farmId;
      if (sameFarm) {
        score += 8;
        reasons.push("Déjà sur l'exploitation");
      } else if ((w.assignments ?? []).some((a) => a.farmId === opts.farmId)) {
        score += 5;
        reasons.push("A déjà travaillé sur cette exploitation");
      }
      const versatility = (w.skills ?? []).length;
      if (versatility >= 4) {
        score += 4;
        reasons.push(`Polyvalent (${versatility} compétences)`);
      }
      return { worker: w, score: Math.max(0, Math.min(100, score)), level: sk.level, years: sk.years, sameFarm, reasons };
    })
    .filter((x): x is ReplacementCandidate => !!x)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function versatilityLabel(n: number) {
  return n >= 5 ? "Très polyvalent" : n >= 3 ? "Polyvalent" : "Spécialisé";
}

/* ---------------- Veterinary ---------------- */

export function vetOverview(data: AppData, now: Date) {
  const today = now.toISOString().slice(0, 10);
  const events = [...(data.vetEvents ?? [])].sort((a, b) =>
    (a.date + a.time).localeCompare(b.date + b.time),
  );
  const upcoming = events.filter((e) => e.date >= today && e.status === "Planifié");
  const nextVisit = upcoming.find((e) => e.type === "Visite vétérinaire") ?? upcoming[0] ?? null;
  const ongoing = events.filter((e) => e.status === "En cours");
  const vaccinations = upcoming.filter((e) => e.type === "Vaccination");
  const recent = events.filter((e) => e.date < today || e.status === "Terminé").reverse().slice(0, 6);
  const overdueControls = events.filter(
    (e) => e.nextControl && e.nextControl < today && e.status !== "Terminé",
  );
  const costYear = events
    .filter((e) => e.transactionId && e.date.slice(0, 4) === today.slice(0, 4))
    .reduce((s, e) => s + e.cost, 0);
  return { events, upcoming, nextVisit, ongoing, vaccinations, recent, overdueControls, costYear };
}
