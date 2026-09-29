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

export type SkillName =
  | "Irrigation"
  | "Récolte"
  | "Conduite de machines"
  | "Maintenance"
  | "Traitement agricole"
  | "Stockage"
  | "Alimentation du bétail"
  | "Surveillance élevage"
  | "Manutention";

export const SKILLS: SkillName[] = [
  "Irrigation",
  "Récolte",
  "Conduite de machines",
  "Maintenance",
  "Traitement agricole",
  "Stockage",
  "Alimentation du bétail",
  "Surveillance élevage",
  "Manutention",
];

export interface WorkerSkill {
  name: SkillName;
  /** 1 = débutant … 5 = expert */
  level: number;
  years: number;
}

export type Availability = "Disponible" | "Occupé" | "En congé" | "Affecté temporairement";

export interface Assignment {
  id: string;
  farmId: string;
  task: string;
  skill: SkillName | null;
  startDate: string;
  endDate: string;
  kind: "Permanente" | "Temporaire";
  replacing?: string;
  note?: string;
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
  skills?: WorkerSkill[];
  availability?: Availability;
  assignments?: Assignment[];
}

export type VetEventType =
  | "Visite vétérinaire"
  | "Vaccination"
  | "Contrôle"
  | "Traitement"
  | "Suivi"
  | "Renouvellement médicament";

export const VET_TYPES: VetEventType[] = [
  "Visite vétérinaire",
  "Vaccination",
  "Contrôle",
  "Traitement",
  "Suivi",
  "Renouvellement médicament",
];

export interface VetEvent {
  id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  vet: string;
  lot: string;
  type: VetEventType;
  reason: string;
  observations: string;
  treatment: string;
  medications: string;
  nextAction: string;
  nextControl: string | null;
  status: "Planifié" | "En cours" | "Terminé";
  cost: number;
  transactionId: string | null;
  documentId: string | null;
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
  category: "Factures" | "Reçus" | "Tickets" | "Photos" | "Justificatifs" | "Documents fournisseurs" | "Vétérinaire";
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
  vetEvents: VetEvent[];
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
