import {
  CATEGORIES,
  DEMO_NOW,
  type ActivityItem,
  type AppData,
  type Client,
  type DocumentItem,
  type Farm,
  type Flow,
  type NotificationItem,
  type PaymentMethod,
  type Source,
  type Supplier,
  type Transaction,
  type TransactionType,
  type Worker,
} from "./types";

function makeRng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

const rnd = makeRng(20260929);
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];
const between = (min: number, max: number) => min + rnd() * (max - min);
const round = (v: number, step = 50) => Math.round(v / step) * step;

const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number, hour = 10) => {
  const d = new Date(DEMO_NOW);
  d.setDate(d.getDate() - n);
  d.setHours(hour, Math.floor(rnd() * 59), 0, 0);
  return iso(d);
};

export const FARMS: Farm[] = [
  {
    id: "f-orange",
    slug: "orange-banane",
    name: "Orange & Banane",
    activity: "Arboriculture — agrumes & bananiers",
    manager: "Youssef Benali",
    location: "Souk El Arbaa, Gharb",
    annualBudget: 4_320_000,
    monthlyBudget: 360_000,
    status: "Active",
    hectares: 120,
    categories: [
      "Main-d'œuvre",
      "Engrais",
      "Traitement agricole",
      "Irrigation",
      "Gasoil",
      "Maintenance",
    ],
  },
  {
    id: "f-ble1",
    slug: "ble-1",
    name: "Blé 1",
    activity: "Grandes cultures — blé tendre",
    manager: "Abdelhak Mounir",
    location: "Sidi Kacem",
    annualBudget: 2_640_000,
    monthlyBudget: 220_000,
    status: "Active",
    hectares: 210,
    categories: ["Semences", "Engrais", "Machines", "Récolte", "Transport", "Gasoil"],
  },
  {
    id: "f-ble2",
    slug: "ble-2",
    name: "Blé 2",
    activity: "Grandes cultures — blé dur",
    manager: "Rachid Ouazzani",
    location: "Mechra Bel Ksiri",
    annualBudget: 2_280_000,
    monthlyBudget: 190_000,
    status: "Active",
    hectares: 175,
    categories: ["Semences", "Gasoil", "Main-d'œuvre", "Maintenance", "Récolte", "Stockage"],
  },
  {
    id: "f-bovin",
    slug: "elevage-bovin",
    name: "Élevage bovin",
    activity: "Élevage — 340 têtes bovines",
    manager: "Hamid Sebti",
    location: "Kénitra, route de Sidi Yahya",
    annualBudget: 3_360_000,
    monthlyBudget: 280_000,
    status: "Active",
    hectares: 45,
    categories: ["Alimentation animale", "Vétérinaire", "Médicaments", "Eau", "Énergie", "Main-d'œuvre"],
  },
];

const SUPPLIER_SEED: [string, string, string, string][] = [
  ["Agro Maroc Distribution", "Intrants agricoles", "Karim Belhaj", "Engrais, semences, films"],
  ["Atlas Engrais", "Engrais & amendements", "Nadia Serghini", "NPK, urée, sulfate"],
  ["GreenFarm Services", "Services agricoles", "Omar Tazi", "Travaux de sol, taille"],
  ["Maroc Irrigation", "Irrigation", "Samira Lahlou", "Goutte-à-goutte, pompes"],
  ["AgriFuel Maroc", "Carburants", "Hicham Bennis", "Gasoil, lubrifiants"],
  ["BioCrop Maroc", "Produits phytosanitaires", "Leila Amrani", "Traitements bio, fongicides"],
  ["VetAgri Services", "Vétérinaire", "Dr. Younes Kadiri", "Soins, vaccination"],
  ["Atlas Semences", "Semences", "Mustapha Rami", "Blé tendre, blé dur"],
  ["Maroc Machines Agricoles", "Machinisme", "Fouad Chraibi", "Tracteurs, pièces"],
  ["AgriTransport Services", "Transport", "Said Ouhadi", "Camions, bennes"],
  ["Nutri Bovin Maroc", "Alimentation animale", "Zineb Fathi", "Aliment composé, tourteaux"],
  ["Gharb Plastique Agricole", "Emballage", "Anas Berrada", "Caisses, filets"],
  ["Sotrama Pièces Agricoles", "Pièces détachées", "Khalid Naciri", "Roulements, filtres"],
  ["Lumière Énergie Kénitra", "Énergie", "Mehdi Alaoui", "Électricité, groupes"],
  ["Hydro Gharb", "Eau & forages", "Rachida Bennani", "Forages, entretien"],
  ["Compost Rif", "Amendement organique", "Tarik Idrissi", "Compost, fumier"],
  ["Phyto Protect Maroc", "Phytosanitaire", "Amine Sqalli", "Insecticides, herbicides"],
  ["Cooperative Al Baraka", "Coopérative", "Hassan Moutaouakil", "Main-d'œuvre saisonnière"],
  ["Maroc Froid Logistique", "Logistique froid", "Imane Cherkaoui", "Chambres froides"],
  ["Agrivet Gharb", "Médicaments vétérinaires", "Dr. Salma Rifi", "Antibiotiques, vitamines"],
  ["Mecano Tracteur Sidi Kacem", "Réparation", "Brahim Zeroual", "Réparation moteurs"],
  ["Semences du Nord", "Semences", "Jalil Hakimi", "Semences certifiées"],
  ["Gharb Stockage Céréales", "Stockage", "Noureddine Kabbaj", "Silos, séchage"],
  ["Tech Irrigation Atlas", "Irrigation", "Yassine Douiri", "Filtration, vannes"],
  ["Ferme Services Kénitra", "Services généraux", "Wafae Bouzidi", "Nettoyage, gardiennage"],
];

const WORKER_NAMES = [
  "Mohamed El Amrani",
  "Abdellah Bouchra",
  "Fatima Zahra Idrissi",
  "Hassan Rahmouni",
  "Khadija Bennour",
  "Youssef Sbai",
  "Rachid El Malki",
  "Aziz Bouzid",
  "Nawal Oukacha",
  "Driss Hamdaoui",
  "Said Mekouar",
  "Amina Lamrani",
  "Mustapha Jebli",
  "Hamid Rochdi",
  "Zahra Boutaleb",
  "Karim Ezzaoui",
  "Abderrahim Sadki",
  "Latifa Nassiri",
  "Omar Belkhadir",
  "Jamal Bourkia",
  "Hafid Zerouali",
  "Samir Aït Ali",
  "Malika Chafik",
  "Noureddine Baraka",
  "Hicham Lemseffer",
  "Ahmed Boulaich",
  "Souad Haddadi",
  "Mounir Talbi",
  "Abdelkader Ziani",
  "Yassine Regragui",
  "Ilham Sefrioui",
  "Brahim Ouazzani",
  "Kamal Bennis",
  "Rabia Oulhaj",
  "Tarek Marzouki",
  "Adil Bouhaddou",
  "Nadia Chorfi",
  "El Mehdi Fassi",
  "Abdelilah Kacimi",
  "Hanane Tahiri",
];

const WORKER_ROLES = [
  "Ouvrier agricole",
  "Chef d'équipe",
  "Tractoriste",
  "Irrigateur",
  "Vacher",
  "Magasinier",
  "Gardien",
  "Ouvrière de récolte",
  "Technicien agricole",
];

const CLIENT_SEED: [string, string, string][] = [
  ["Marché de gros Casablanca", "Distribution fruits", "Mohamed Tahiri"],
  ["Souk Al Ahad Kénitra", "Commerce local", "Abdellatif Rami"],
  ["Exportagrumes Maroc", "Export agrumes", "Selma Bennani"],
  ["Les Vergers du Gharb", "Négoce fruits", "Ayoub Sekkat"],
  ["Moulins El Amal", "Meunerie", "Hassan Ait Lahcen"],
  ["Semoulerie Atlas", "Semoulerie", "Nabil Zouiten"],
  ["Coopérative Laitière Gharb", "Lait & dérivés", "Fatiha Mansouri"],
  ["Boucherie Centrale Rabat", "Viande", "Rachid Belkacem"],
  ["Halal Meat Maroc", "Transformation viande", "Younes Berrada"],
  ["Marjane Approvisionnement", "Grande distribution", "Ilias Sabri"],
  ["Fruits du Nord SARL", "Négoce", "Kenza Haddioui"],
  ["Société Agro Kénitra", "Agro-industrie", "Mourad Lahbabi"],
  ["Marché Rabat Agdal", "Commerce local", "Nadir Oumlil"],
  ["Sodifruit Maroc", "Conditionnement", "Rania Chakib"],
  ["Ferme Bio Zemmour", "Élevage", "Taoufik Lemrani"],
  ["Provende Gharb", "Alimentation animale", "Hamza Nejjar"],
  ["Distri Banane Maroc", "Distribution bananes", "Soufiane Alaoui"],
  ["Grossiste Fès Agrumes", "Commerce de gros", "Anouar Filali"],
];

function phone() {
  return `+212 6${Math.floor(between(10, 99))} ${Math.floor(between(100, 999))} ${Math.floor(between(100, 999))}`;
}

function slugMail(name: string) {
  return `contact@${name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "")
    .slice(0, 16)}.ma`;
}

const suppliers: Supplier[] = SUPPLIER_SEED.map(([name, activity, contact, products], i) => ({
  id: `s-${i + 1}`,
  name,
  activity,
  contact,
  phone: phone(),
  email: slugMail(name),
  products,
  farmIds: FARMS.filter(() => rnd() > 0.45)
    .map((f) => f.id)
    .slice(0, 3),
  status: i % 11 === 10 ? "Inactif" : "Actif",
  notes:
    i % 5 === 0
      ? [
          {
            id: `sn-${i}`,
            date: daysAgo(Math.floor(between(3, 60))),
            text: "Négociation d'un délai de règlement à 30 jours validée par la direction.",
            author: "Direction",
          },
        ]
      : [],
}));

for (const s of suppliers) if (s.farmIds.length === 0) s.farmIds = [pick(FARMS).id];

const workers: Worker[] = WORKER_NAMES.map((name, i) => {
  const farm = FARMS[i % 4];
  const role =
    farm.id === "f-bovin" && i % 3 === 0 ? "Vacher" : WORKER_ROLES[i % WORKER_ROLES.length];
  const monthly = rnd() > 0.55;
  return {
    id: `w-${i + 1}`,
    name,
    farmId: farm.id,
    role,
    phone: phone(),
    compensation: monthly ? round(between(3200, 6800), 100) : round(between(110, 190), 10),
    compensationUnit: monthly ? "mois" : "jour",
    status: i % 9 === 8 ? "Saisonnier" : i % 17 === 16 ? "Inactif" : "Actif",
    notes:
      i % 7 === 0
        ? [
            {
              id: `wn-${i}`,
              date: daysAgo(Math.floor(between(2, 40))),
              text: "Très bonne maîtrise du matériel d'irrigation, autonome sur le secteur nord.",
              author: farm.manager,
            },
          ]
        : [],
  };
});

const clients: Client[] = CLIENT_SEED.map(([name, activity, contact], i) => ({
  id: `c-${i + 1}`,
  name,
  activity,
  contact,
  phone: phone(),
  email: slugMail(name),
  status: i % 13 === 12 ? "Inactif" : "Actif",
  notes: [],
}));

const METHODS: PaymentMethod[] = ["Espèces", "Virement bancaire", "Chèque", "Carte", "Autre"];
const SOURCES: Source[] = ["Manuel", "Manuel", "Import", "WhatsApp"];

const DESCRIPTIONS: Record<string, string[]> = {
  Gasoil: ["Plein de gasoil pour tracteurs", "Approvisionnement citerne gasoil"],
  Engrais: ["Livraison engrais NPK", "Apport d'urée 46%"],
  Semences: ["Semences certifiées blé", "Lot de semences traitées"],
  "Produits chimiques": ["Achat fongicide", "Traitement insecticide parcelles"],
  "Traitement agricole": ["Campagne de traitement foliaire", "Traitement préventif vergers"],
  Irrigation: ["Réparation réseau goutte-à-goutte", "Achat filtres irrigation"],
  "Main-d'œuvre": ["Main-d'œuvre saisonnière récolte", "Équipe de taille — 12 journées"],
  Maintenance: ["Entretien moteur tracteur", "Maintenance pompe immergée"],
  Transport: ["Transport récolte vers silo", "Location camion benne"],
  Machines: ["Pièces détachées moissonneuse", "Location semoir"],
  Récolte: ["Prestation de moisson", "Battage et bottelage"],
  Stockage: ["Location silo céréales", "Séchage et stockage"],
  Vétérinaire: ["Visite vétérinaire troupeau", "Campagne de vaccination"],
  Médicaments: ["Achat antibiotiques bovins", "Vitamines et compléments"],
  "Alimentation animale": ["Aliment composé bovins 5 T", "Tourteau de soja"],
  Eau: ["Redevance eau irrigation", "Entretien forage"],
  Énergie: ["Facture électricité étable", "Groupe électrogène — carburant"],
  Autres: ["Fournitures diverses exploitation", "Petit outillage"],
};

function descFor(category: string) {
  const list = DESCRIPTIONS[category] ?? DESCRIPTIONS.Autres;
  return pick(list);
}

function amountFor(type: TransactionType, category: string) {
  if (type === "Avance") return round(between(400, 2500), 50);
  if (type === "Paiement") return round(between(1800, 7200), 50);
  if (type === "Vente" || type === "Encaissement") return round(between(18_000, 165_000), 500);
  if (type === "Ajustement") return round(between(500, 4000), 50);
  if (category === "Machines" || category === "Récolte") return round(between(14_000, 92_000), 500);
  return round(between(2200, 46_000), 250);
}

const transactions: Transaction[] = [];
let payCounter = 1;

for (let i = 0; i < 128; i++) {
  const roll = rnd();
  let type: TransactionType;
  if (roll < 0.34) type = "Achat";
  else if (roll < 0.56) type = "Dépense";
  else if (roll < 0.68) type = "Avance";
  else if (roll < 0.79) type = "Paiement";
  else if (roll < 0.9) type = "Vente";
  else if (roll < 0.97) type = "Encaissement";
  else type = "Ajustement";

  const farm = pick(FARMS);
  let category: string;
  let partyKind: Transaction["partyKind"] = "none";
  let partyId: string | null = null;

  if (type === "Avance" || type === "Paiement") {
    category = "Main-d'œuvre";
    const farmWorkers = workers.filter((w) => w.farmId === farm.id);
    partyKind = "worker";
    partyId = pick(farmWorkers).id;
  } else if (type === "Vente" || type === "Encaissement") {
    category = farm.id === "f-bovin" ? "Alimentation animale" : "Récolte";
    partyKind = "client";
    partyId = pick(clients.filter((c) => c.status === "Actif")).id;
  } else if (type === "Ajustement") {
    category = "Autres";
  } else {
    category = pick(farm.categories);
    const matching = suppliers.filter((s) => s.farmIds.includes(farm.id));
    partyKind = "supplier";
    partyId = pick(matching.length ? matching : suppliers).id;
  }

  const amount = amountFor(type, category);
  const dayOffset = Math.floor(Math.pow(rnd(), 0.85) * 358);
  const date = daysAgo(dayOffset, Math.floor(between(7, 18)));
  const method = type === "Avance" ? (rnd() > 0.3 ? "Espèces" : "Virement bancaire") : pick(METHODS);

  const payments = [];
  const payRoll = rnd();
  const fullyPaid = type === "Avance" || type === "Paiement" || type === "Encaissement" || payRoll < 0.46;
  const partially = !fullyPaid && payRoll < 0.76;
  const pending = !fullyPaid && !partially && payRoll > 0.93;

  if (fullyPaid) {
    payments.push({
      id: `p-${payCounter++}`,
      date,
      amount,
      method,
      reference: `REG-${2026}-${String(payCounter).padStart(4, "0")}`,
      note: "Règlement intégral",
    });
  } else if (partially) {
    const first = round(amount * between(0.25, 0.6), 50);
    payments.push({
      id: `p-${payCounter++}`,
      date,
      amount: first,
      method,
      reference: `REG-${2026}-${String(payCounter).padStart(4, "0")}`,
      note: "Acompte à la commande",
    });
    if (rnd() > 0.6) {
      const second = round((amount - first) * between(0.2, 0.5), 50);
      const d2 = new Date(date);
      d2.setDate(d2.getDate() + Math.floor(between(4, 25)));
      if (d2 < DEMO_NOW)
        payments.push({
          id: `p-${payCounter++}`,
          date: iso(d2),
          amount: second,
          method: pick(METHODS),
          reference: `REG-${2026}-${String(payCounter).padStart(4, "0")}`,
          note: "Second versement",
        });
    }
  }

  transactions.push({
    id: `t-${i + 1}`,
    reference: "",
    date,
    farmId: farm.id,
    type,
    category,
    partyKind,
    partyId,
    amount,
    method,
    description: descFor(category),
    source: pick(SOURCES),
    payments,
    cancelled: !fullyPaid && !partially && !pending && rnd() > 0.93,
    documentId: null,
  });
}

transactions.sort((a, b) => a.date.localeCompare(b.date));
transactions.forEach((t, i) => {
  const year = new Date(t.date).getFullYear();
  t.reference = `TRX-${year}-${String(i + 1).padStart(4, "0")}`;
});
transactions.reverse();

const PRODUCTS = [
  ["Blé", "kg", 3.4],
  ["Paille", "botte", 28],
  ["Fourrage", "kg", 2.6],
  ["Fumier", "T", 320],
  ["Gasoil", "L", 12.4],
  ["Engrais NPK", "kg", 6.8],
  ["Oranges (écart de tri)", "kg", 2.1],
] as const;

const flows: Flow[] = Array.from({ length: 24 }).map((_, i) => {
  const from = pick(FARMS);
  let to = pick(FARMS);
  while (to.id === from.id) to = pick(FARMS);
  const [product, unit, price] = pick(PRODUCTS as unknown as (readonly [string, string, number])[]);
  const quantity = unit === "kg" ? round(between(400, 4200), 50) : round(between(8, 160), 2);
  return {
    id: `fl-${i + 1}`,
    reference: `FLX-2026-${String(24 - i).padStart(3, "0")}`,
    date: daysAgo(Math.floor(Math.pow(rnd(), 0.8) * 300), 11),
    fromFarmId: from.id,
    toFarmId: to.id,
    product,
    quantity,
    unit,
    value: round(quantity * price, 10),
    responsible: pick([from.manager, to.manager, "Direction du domaine"]),
    status: i < 2 ? "En cours" : i === 2 ? "Planifié" : "Terminé",
    comment: i % 4 === 0 ? "Transfert validé par la direction du domaine." : undefined,
  };
});
flows.sort((a, b) => b.date.localeCompare(a.date));

const DOC_CATEGORIES: DocumentItem["category"][] = [
  "Factures",
  "Reçus",
  "Tickets",
  "Photos",
  "Justificatifs",
  "Documents fournisseurs",
];

const documents: DocumentItem[] = Array.from({ length: 46 }).map((_, i) => {
  const t = transactions[Math.floor(rnd() * 70)];
  const category = DOC_CATEGORIES[i % DOC_CATEGORIES.length];
  const party =
    t.partyKind === "supplier"
      ? (suppliers.find((s) => s.id === t.partyId)?.name ?? "—")
      : t.partyKind === "worker"
        ? (workers.find((w) => w.id === t.partyId)?.name ?? "—")
        : t.partyKind === "client"
          ? (clients.find((c) => c.id === t.partyId)?.name ?? "—")
          : "Domaine Jalal";
  const ext = category === "Photos" ? "jpg" : "pdf";
  return {
    id: `d-${i + 1}`,
    name: `${category.slice(0, -1).replace("Document fournisseur", "Doc fournisseur")}-${t.reference}.${ext}`,
    category,
    farmId: t.farmId,
    entity: party,
    transactionRef: t.reference,
    date: t.date,
    sizeKb: Math.round(between(80, 3200)),
    status: i % 6 === 0 ? "En attente" : "Validé",
  };
});
documents.sort((a, b) => b.date.localeCompare(a.date));

const NOTIF_SEED: [NotificationItem["kind"], string, string][] = [
  ["payment", "Paiement fournisseur restant", "Solde à régler chez Atlas Engrais."],
  ["expense", "Nouvelle dépense créée", "Gasoil — Blé 1, 12 500 DH."],
  ["document", "Justificatif manquant", "Achat engrais sans facture jointe."],
  ["budget", "Budget exploitation élevé", "Orange & Banane à 86 % du budget mensuel."],
  ["advance", "Nouvelle avance ouvrier", "Avance de 800 DH accordée."],
  ["flow", "Transfert interne créé", "Blé 1 → Élevage bovin, 1 500 kg de blé."],
  ["collection", "Encaissement client enregistré", "Exportagrumes Maroc, 64 000 DH."],
  ["payment", "Échéance chèque à 3 jours", "Chèque n° 442198 à provisionner."],
  ["document", "Justificatif en attente de validation", "Ticket de pesée à contrôler."],
  ["budget", "Écart budgétaire détecté", "Blé 2 : +9,4 % vs budget mensuel."],
  ["expense", "Dépense vétérinaire enregistrée", "VetAgri Services — troupeau bovin."],
  ["advance", "Plafond d'avance approché", "Mohamed El Amrani : 2 100 DH ce mois."],
  ["collection", "Règlement partiel client", "Moulins El Amal, 28 000 DH reçus."],
  ["flow", "Transfert en cours", "Blé 2 → Élevage bovin en cours de livraison."],
  ["payment", "Dette fournisseur en hausse", "Agro Maroc Distribution : +14 %."],
  ["document", "Nouveau document ajouté", "Facture AgriFuel Maroc de septembre."],
  ["expense", "Dépense hors catégorie", "À reclasser sur l'exploitation Blé 1."],
  ["budget", "Consommation budget annuel", "Domaine à 71 % du budget annuel."],
  ["collection", "Créance ancienne", "Souk Al Ahad Kénitra : 45 jours."],
  ["flow", "Flux interne planifié", "Orange & Banane → Élevage bovin."],
  ["payment", "Virement exécuté", "Nutri Bovin Maroc, 34 500 DH."],
];

const notifications: NotificationItem[] = NOTIF_SEED.map(([kind, title, detail], i) => ({
  id: `n-${i + 1}`,
  kind,
  title,
  detail,
  date: daysAgo(Math.floor(i * 1.6), 9 + (i % 8)),
  read: i > 5,
}));

const ACTIVITY_LABELS: Record<string, string> = {
  Achat: "Achat enregistré",
  Dépense: "Dépense créée",
  Paiement: "Paiement ouvrier enregistré",
  Avance: "Avance ouvrier ajoutée",
  Vente: "Vente enregistrée",
  Encaissement: "Encaissement client reçu",
  Ajustement: "Ajustement comptable",
};

const activity: ActivityItem[] = [
  ...transactions.slice(0, 44).map((t, i) => ({
    id: `a-t-${i}`,
    label: ACTIVITY_LABELS[t.type] ?? "Transaction enregistrée",
    entity: `${t.reference} · ${FARMS.find((f) => f.id === t.farmId)?.name ?? ""}`,
    date: t.date,
    kind: (t.type === "Avance"
      ? "advance"
      : t.type === "Encaissement" || t.type === "Vente"
        ? "collection"
        : t.type === "Paiement"
          ? "payment"
          : "expense") as ActivityItem["kind"],
  })),
  ...flows.slice(0, 8).map((f, i) => ({
    id: `a-f-${i}`,
    label: "Nouveau transfert interne",
    entity: `${f.reference} · ${f.product}`,
    date: f.date,
    kind: "flow" as const,
  })),
  ...documents.slice(0, 8).map((d, i) => ({
    id: `a-d-${i}`,
    label: "Justificatif ajouté",
    entity: d.name,
    date: d.date,
    kind: "document" as const,
  })),
].sort((a, b) => b.date.localeCompare(a.date));

export function buildSeedData(): AppData {
  return {
    farms: FARMS,
    suppliers,
    workers,
    clients,
    transactions,
    flows,
    documents,
    notifications,
    activity,
    settings: {
      domainName: "Domaine Jalal",
      currency: "MAD (DH)",
      fiscalYearStart: "Janvier",
      language: "Français",
      categories: CATEGORIES,
      paymentMethods: ["Espèces", "Virement bancaire", "Chèque", "Carte", "Autre"],
      notifications: {
        supplierDebt: true,
        missingDocuments: true,
        budgetAlerts: true,
        workerAdvances: true,
        internalFlows: false,
        weeklyDigest: true,
      },
      rules: {
        requireDocumentAbove: 5000,
        maxAdvancePerWorker: 2500,
        blockOverBudget: false,
        requireValidationAbove: 50_000,
      },
    },
  };
}
