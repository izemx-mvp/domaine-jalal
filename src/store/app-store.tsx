import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { buildSeedData } from "@/data/seed";
import {
  DEMO_NOW,
  type ActivityItem,
  type AppData,
  type AppSettings,
  type Client,
  type DocumentItem,
  type Flow,
  type Note,
  type Payment,
  type Supplier,
  type Transaction,
  type Worker,
} from "@/data/types";
import type { Period } from "@/data/selectors";

const STORAGE_KEY = "domaine-jalal-data-v1";
const SESSION_KEY = "domaine-jalal-session-v1";

let idCounter = 0;
const uid = (prefix: string) => `${prefix}-${Date.now().toString(36)}-${(idCounter++).toString(36)}`;

interface Store {
  data: AppData;
  now: Date;
  ready: boolean;
  authed: boolean;
  login: () => void;
  logout: () => void;
  farmScope: string | "all";
  setFarmScope: (id: string | "all") => void;
  period: Period;
  setPeriod: (p: Period) => void;
  reset: () => void;

  addTransaction: (t: Omit<Transaction, "id" | "reference">) => Transaction;
  updateTransaction: (id: string, patch: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addPayment: (transactionId: string, payment: Omit<Payment, "id">) => void;

  addSupplier: (s: Omit<Supplier, "id" | "notes">) => void;
  updateSupplier: (id: string, patch: Partial<Supplier>) => void;
  deleteSupplier: (id: string) => void;

  addWorker: (w: Omit<Worker, "id" | "notes">) => void;
  updateWorker: (id: string, patch: Partial<Worker>) => void;
  deleteWorker: (id: string) => void;

  addClient: (c: Omit<Client, "id" | "notes">) => void;
  updateClient: (id: string, patch: Partial<Client>) => void;
  deleteClient: (id: string) => void;

  addNote: (kind: "supplier" | "worker" | "client", id: string, text: string) => void;

  addFlow: (f: Omit<Flow, "id" | "reference">) => void;
  updateFlow: (id: string, patch: Partial<Flow>) => void;
  deleteFlow: (id: string) => void;

  addDocument: (d: Omit<DocumentItem, "id">) => void;
  renameDocument: (id: string, name: string) => void;
  deleteDocument: (id: string) => void;

  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;

  updateSettings: (patch: Partial<AppSettings>) => void;
}

const AppStoreContext = createContext<Store | null>(null);

export function AppStoreProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppData>(() => buildSeedData());
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [farmScope, setFarmScope] = useState<string | "all">("all");
  const [period, setPeriod] = useState<Period>("30d");

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppData;
        if (parsed?.transactions?.length) setData(parsed);
      }
      setAuthed(localStorage.getItem(SESSION_KEY) === "1");
    } catch {
      /* ignore corrupted storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      /* quota */
    }
  }, [data, ready]);

  const pushActivity = useCallback((item: Omit<ActivityItem, "id" | "date"> & { date?: string }) => {
    setData((d) => ({
      ...d,
      activity: [
        { id: uid("a"), date: item.date ?? new Date().toISOString(), ...item },
        ...d.activity,
      ].slice(0, 200),
    }));
  }, []);

  const value = useMemo<Store>(() => {
    const patchList = <T extends { id: string }>(list: T[], id: string, patch: Partial<T>) =>
      list.map((x) => (x.id === id ? { ...x, ...patch } : x));

    return {
      data,
      now: DEMO_NOW,
      ready,
      authed,
      login: () => {
        setAuthed(true);
        try {
          localStorage.setItem(SESSION_KEY, "1");
        } catch {
          /* ignore */
        }
      },
      logout: () => {
        setAuthed(false);
        try {
          localStorage.removeItem(SESSION_KEY);
        } catch {
          /* ignore */
        }
      },
      farmScope,
      setFarmScope,
      period,
      setPeriod,
      reset: () => setData(buildSeedData()),

      addTransaction: (t) => {
        const year = new Date(t.date).getFullYear();
        const next: Transaction = {
          ...t,
          id: uid("t"),
          reference: `TRX-${year}-${String(data.transactions.length + 1).padStart(4, "0")}`,
        };
        setData((d) => ({ ...d, transactions: [next, ...d.transactions] }));
        pushActivity({
          label: `${t.type} enregistrée`,
          entity: `${next.reference} · ${data.farms.find((f) => f.id === t.farmId)?.name ?? ""}`,
          kind: t.type === "Avance" ? "advance" : t.type === "Encaissement" ? "collection" : "expense",
        });
        return next;
      },
      updateTransaction: (id, patch) =>
        setData((d) => ({ ...d, transactions: patchList(d.transactions, id, patch) })),
      deleteTransaction: (id) =>
        setData((d) => ({ ...d, transactions: d.transactions.filter((t) => t.id !== id) })),
      addPayment: (transactionId, payment) => {
        setData((d) => ({
          ...d,
          transactions: d.transactions.map((t) =>
            t.id === transactionId
              ? { ...t, payments: [...t.payments, { ...payment, id: uid("p") }] }
              : t,
          ),
        }));
        const t = data.transactions.find((x) => x.id === transactionId);
        pushActivity({
          label: "Paiement enregistré",
          entity: `${t?.reference ?? ""} · ${payment.amount} DH`,
          kind: "payment",
        });
      },

      addSupplier: (s) =>
        setData((d) => ({ ...d, suppliers: [{ ...s, id: uid("s"), notes: [] }, ...d.suppliers] })),
      updateSupplier: (id, patch) =>
        setData((d) => ({ ...d, suppliers: patchList(d.suppliers, id, patch) })),
      deleteSupplier: (id) =>
        setData((d) => ({ ...d, suppliers: d.suppliers.filter((s) => s.id !== id) })),

      addWorker: (w) =>
        setData((d) => ({ ...d, workers: [{ ...w, id: uid("w"), notes: [] }, ...d.workers] })),
      updateWorker: (id, patch) =>
        setData((d) => ({ ...d, workers: patchList(d.workers, id, patch) })),
      deleteWorker: (id) =>
        setData((d) => ({ ...d, workers: d.workers.filter((w) => w.id !== id) })),

      addClient: (c) =>
        setData((d) => ({ ...d, clients: [{ ...c, id: uid("c"), notes: [] }, ...d.clients] })),
      updateClient: (id, patch) =>
        setData((d) => ({ ...d, clients: patchList(d.clients, id, patch) })),
      deleteClient: (id) =>
        setData((d) => ({ ...d, clients: d.clients.filter((c) => c.id !== id) })),

      addNote: (kind, id, text) => {
        const note: Note = {
          id: uid("note"),
          date: new Date().toISOString(),
          text,
          author: "Direction",
        };
        setData((d) => {
          const key = kind === "supplier" ? "suppliers" : kind === "worker" ? "workers" : "clients";
          const list = d[key] as Array<Supplier | Worker | Client>;
          return {
            ...d,
            [key]: list.map((x) => (x.id === id ? { ...x, notes: [note, ...x.notes] } : x)),
          } as AppData;
        });
      },

      addFlow: (f) => {
        const reference = `FLX-${new Date(f.date).getFullYear()}-${String(data.flows.length + 1).padStart(3, "0")}`;
        setData((d) => ({ ...d, flows: [{ ...f, id: uid("fl"), reference }, ...d.flows] }));
        pushActivity({
          label: "Nouveau transfert interne",
          entity: `${reference} · ${f.product}`,
          kind: "flow",
        });
      },
      updateFlow: (id, patch) => setData((d) => ({ ...d, flows: patchList(d.flows, id, patch) })),
      deleteFlow: (id) => setData((d) => ({ ...d, flows: d.flows.filter((f) => f.id !== id) })),

      addDocument: (doc) => {
        setData((d) => ({ ...d, documents: [{ ...doc, id: uid("d") }, ...d.documents] }));
        pushActivity({ label: "Justificatif ajouté", entity: doc.name, kind: "document" });
      },
      renameDocument: (id, name) =>
        setData((d) => ({ ...d, documents: patchList(d.documents, id, { name }) })),
      deleteDocument: (id) =>
        setData((d) => ({ ...d, documents: d.documents.filter((x) => x.id !== id) })),

      markNotificationRead: (id) =>
        setData((d) => ({
          ...d,
          notifications: d.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
        })),
      markAllNotificationsRead: () =>
        setData((d) => ({
          ...d,
          notifications: d.notifications.map((n) => ({ ...n, read: true })),
        })),

      updateSettings: (patch) =>
        setData((d) => ({ ...d, settings: { ...d.settings, ...patch } })),
    };
  }, [data, ready, authed, farmScope, period, pushActivity]);

  return <AppStoreContext.Provider value={value}>{children}</AppStoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(AppStoreContext);
  if (!ctx) throw new Error("useStore must be used inside AppStoreProvider");
  return ctx;
}
