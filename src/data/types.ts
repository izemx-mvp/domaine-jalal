export type TransactionType =
  | "Dépense"
  | "Achat"
  | "Paiement"
  | "Encaissement"
  | "Avance"
  | "Vente"
  | "Ajustement";

export type TransactionStatus =
  | "Payé"
  | "Partiellement payé"
  | "À payer"
  | "En attente"
  | "Annulé";

export type PaymentMethod = "Espèces" | "Virement bancaire" | "Chèque" | "Carte" | "Autre";

export type Source = "Manuel" | "Import" | "WhatsApp";

export type PartyKind = "supplier" | "worker" | "client" | "none";

export interface Farm {
  id: string;
  slug: string;
  name: string;
  activity: string;
  manager: string;
  location: string;
  annualBudget: number;
  monthlyBudget: number;
  status: "Active" | "Saisonnière";
  categories: string[];
  hectares: number;
}

export interface Supplier {
  id: string;
  name: string;
  activity: string;
  contact: string;
  phone: string;
  email: string;
  products: string;
  farmIds: string[];
  status: "Actif" | "Inactif";
  notes: Note[];
}

export interface Worker {
  id: string;
  name: string;
  farmId: string;
  role: string;
  phone: string;
  compensation: number;
  compensationUnit: "jour" | "mois";
  status: "Actif" | "Saisonnier" | "Inactif";
  notes: Note[];
}

export interface Client {
  id: string;
  name: string;
  activity: string;
  contact: string;
  phone: string;
  email: string;
  status: "Actif" | "Inactif";
  notes: Note[];
}

export interface Note {
  id: string;
  date: string;
  text: string;
  author: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  note?: string;
}

export interface Transaction {
  id: string;
  reference: string;
  date: string;
  farmId: string;
  type: TransactionType;
  category: string;
  partyKind: PartyKind;
  partyId: string | null;
  amount: number;
  method: PaymentMethod;
  description: string;
  source: Source;
  payments: Payment[];
  cancelled?: boolean;
  documentId?: string | null;
}

export interface Flow {
  id: string;
  reference: string;
  date: string;
  fromFarmId: string;
  toFarmId: string;
  product: string;
  quantity: number;
  unit: string;
  value: number;
  responsible: string;
  status: "Terminé" | "En cours" | "Planifié";
  comment?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: "Factures" | "Reçus" | "Tickets" | "Photos" | "Justificatifs" | "Documents fournisseurs";
  farmId: string;
  entity: string;
  transactionRef: string | null;
  date: string;
  sizeKb: number;
  status: "Validé" | "En attente";
}

export interface NotificationItem {
  id: string;
  title: string;
  detail: string;
  date: string;
  read: boolean;
  kind: "payment" | "expense" | "document" | "budget" | "advance" | "flow" | "collection";
}

export interface ActivityItem {
  id: string;
  label: string;
  entity: string;
  date: string;
  kind: NotificationItem["kind"];
}

export interface AppSettings {
  domainName: string;
  currency: string;
  fiscalYearStart: string;
  language: string;
  categories: string[];
  paymentMethods: string[];
  notifications: {
    supplierDebt: boolean;
    missingDocuments: boolean;
    budgetAlerts: boolean;
    workerAdvances: boolean;
    internalFlows: boolean;
    weeklyDigest: boolean;
  };
  rules: {
    requireDocumentAbove: number;
    maxAdvancePerWorker: number;
    blockOverBudget: boolean;
    requireValidationAbove: number;
  };
}

export interface AppData {
  farms: Farm[];
  suppliers: Supplier[];
  workers: Worker[];
  clients: Client[];
  transactions: Transaction[];
  flows: Flow[];
  documents: DocumentItem[];
  notifications: NotificationItem[];
  activity: ActivityItem[];
  settings: AppSettings;
}

export const EXPENSE_TYPES: TransactionType[] = ["Dépense", "Achat", "Paiement", "Avance"];
export const INCOME_TYPES: TransactionType[] = ["Encaissement", "Vente"];

export const CATEGORIES = [
  "Gasoil",
  "Semences",
  "Engrais",
  "Produits chimiques",
  "Traitement agricole",
  "Irrigation",
  "Main-d'œuvre",
  "Maintenance",
  "Transport",
  "Machines",
  "Récolte",
  "Stockage",
  "Vétérinaire",
  "Médicaments",
  "Alimentation animale",
  "Eau",
  "Énergie",
  "Autres",
];

export const PAYMENT_METHODS: PaymentMethod[] = [
  "Espèces",
  "Virement bancaire",
  "Chèque",
  "Carte",
  "Autre",
];

export const TRANSACTION_TYPES: TransactionType[] = [
  "Dépense",
  "Achat",
  "Paiement",
  "Encaissement",
  "Avance",
  "Vente",
  "Ajustement",
];

export const STATUSES: TransactionStatus[] = [
  "Payé",
  "Partiellement payé",
  "À payer",
  "En attente",
  "Annulé",
];

/** Reference "today" for the demo dataset. */
export const DEMO_NOW = new Date("2026-09-29T18:40:00.000Z");
