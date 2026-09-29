import { Paperclip } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

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
import { paidOf } from "@/data/selectors";
import {
  PAYMENT_METHODS,
  TRANSACTION_TYPES,
  type PaymentMethod,
  type Source,
  type Transaction,
  type TransactionType,
} from "@/data/types";
import { useStore } from "@/store/app-store";

const SOURCES: Source[] = ["Manuel", "Import", "WhatsApp"];

function partyKindFor(type: TransactionType) {
  if (type === "Avance" || type === "Paiement") return "worker" as const;
  if (type === "Vente" || type === "Encaissement") return "client" as const;
  if (type === "Ajustement") return "none" as const;
  return "supplier" as const;
}

export function TransactionDialog({
  open,
  onOpenChange,
  transaction,
  defaults,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transaction?: Transaction | null;
  defaults?: Partial<Transaction>;
}) {
  const { data, addTransaction, updateTransaction, addDocument } = useStore();
  const editing = Boolean(transaction);

  const [type, setType] = useState<TransactionType>("Achat");
  const [farmId, setFarmId] = useState(data.farms[0].id);
  const [category, setCategory] = useState("Gasoil");
  const [partyId, setPartyId] = useState<string>("");
  const [amount, setAmount] = useState("");
  const [paid, setPaid] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Virement bancaire");
  const [description, setDescription] = useState("");
  const [source, setSource] = useState<Source>("Manuel");
  const [docName, setDocName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [touched, setTouched] = useState(false);

  const partyKind = partyKindFor(type);

  const parties = useMemo(() => {
    if (partyKind === "supplier") return data.suppliers.map((s) => ({ id: s.id, name: s.name }));
    if (partyKind === "worker")
      return data.workers
        .filter((w) => w.farmId === farmId)
        .map((w) => ({ id: w.id, name: `${w.name} — ${w.role}` }));
    if (partyKind === "client") return data.clients.map((c) => ({ id: c.id, name: c.name }));
    return [];
  }, [partyKind, data, farmId]);

  useEffect(() => {
    if (!open) return;
    setTouched(false);
    if (transaction) {
      setType(transaction.type);
      setFarmId(transaction.farmId);
      setCategory(transaction.category);
      setPartyId(transaction.partyId ?? "");
      setAmount(String(transaction.amount));
      setPaid(String(paidOf(transaction)));
      setDate(transaction.date.slice(0, 10));
      setMethod(transaction.method);
      setDescription(transaction.description);
      setSource(transaction.source);
      setDocName("");
    } else {
      setType((defaults?.type as TransactionType) ?? "Achat");
      setFarmId(defaults?.farmId ?? data.farms[0].id);
      setCategory(defaults?.category ?? "Gasoil");
      setPartyId(defaults?.partyId ?? "");
      setAmount("");
      setPaid("");
      setDate(new Date().toISOString().slice(0, 10));
      setMethod("Virement bancaire");
      setDescription("");
      setSource("Manuel");
      setDocName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id]);

  useEffect(() => {
    if (partyKind !== "none" && partyId && !parties.some((p) => p.id === partyId)) setPartyId("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [parties]);

  const amountNum = Number(amount);
  const paidNum = Number(paid || 0);
  const errors = {
    amount: !amount || Number.isNaN(amountNum) || amountNum <= 0 ? "Montant total requis (> 0)." : "",
    paid:
      paidNum < 0
        ? "Le montant payé ne peut pas être négatif."
        : paidNum > amountNum
          ? "Le montant payé dépasse le montant total."
          : "",
    party: partyKind !== "none" && !partyId ? "Sélectionnez un tiers." : "",
    date: !date ? "Date requise." : "",
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = () => {
    setTouched(true);
    if (!valid) return;
    setSubmitting(true);

    const isoDate = new Date(`${date}T10:00:00`).toISOString();
    const payments = paidNum
      ? [
          {
            id: "seed",
            date: isoDate,
            amount: paidNum,
            method,
            reference: `REG-${new Date(isoDate).getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`,
            note: paidNum >= amountNum ? "Règlement intégral" : "Acompte",
          },
        ]
      : [];

    setTimeout(() => {
      if (transaction) {
        updateTransaction(transaction.id, {
          type,
          farmId,
          category,
          partyKind,
          partyId: partyKind === "none" ? null : partyId,
          amount: amountNum,
          method,
          description,
          source,
          date: isoDate,
          payments: payments.map((p, i) => ({ ...p, id: `${transaction.id}-p${i}` })),
        });
        toast.success("Transaction mise à jour.");
      } else {
        const created = addTransaction({
          date: isoDate,
          farmId,
          type,
          category,
          partyKind,
          partyId: partyKind === "none" ? null : partyId,
          amount: amountNum,
          method,
          description: description || `${type} — ${category}`,
          source,
          payments: payments.map((p, i) => ({ ...p, id: `new-p${i}` })),
        });
        if (docName)
          addDocument({
            name: docName,
            category: "Justificatifs",
            farmId,
            entity: parties.find((p) => p.id === partyId)?.name ?? "Domaine Jalal",
            transactionRef: created.reference,
            date: isoDate,
            sizeKb: 420,
            status: "En attente",
          });
        toast.success("Transaction enregistrée avec succès.");
      }
      setSubmitting(false);
      onOpenChange(false);
    }, 420);
  };

  const show = (key: keyof typeof errors) => touched && errors[key];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{editing ? "Modifier la transaction" : "Nouvelle transaction"}</DialogTitle>
          <DialogDescription>
            Renseignez l'opération : elle sera immédiatement reflétée dans les indicateurs du domaine.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Type</Label>
            <Select value={type} onValueChange={(v) => setType(v as TransactionType)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TRANSACTION_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
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
            <Label>Catégorie</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {data.settings.categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>
              {partyKind === "supplier"
                ? "Fournisseur"
                : partyKind === "worker"
                  ? "Ouvrier"
                  : partyKind === "client"
                    ? "Client"
                    : "Tiers"}
            </Label>
            <Select
              value={partyId}
              onValueChange={setPartyId}
              disabled={partyKind === "none"}
            >
              <SelectTrigger aria-invalid={!!show("party")}>
                <SelectValue placeholder={partyKind === "none" ? "Interne au domaine" : "Sélectionner"} />
              </SelectTrigger>
              <SelectContent className="max-h-64">
                {parties.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {show("party") ? <p className="text-xs text-critical">{errors.party}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Montant total (DH)</Label>
            <Input
              id="amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="12500"
              aria-invalid={!!show("amount")}
            />
            {show("amount") ? <p className="text-xs text-critical">{errors.amount}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="paid">Montant payé (DH)</Label>
            <Input
              id="paid"
              inputMode="numeric"
              value={paid}
              onChange={(e) => setPaid(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder="5000"
              aria-invalid={!!show("paid")}
            />
            {show("paid") ? <p className="text-xs text-critical">{errors.paid}</p> : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              aria-invalid={!!show("date")}
            />
            {show("date") ? <p className="text-xs text-critical">{errors.date}</p> : null}
          </div>

          <div className="space-y-2">
            <Label>Mode de paiement</Label>
            <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAYMENT_METHODS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea
              id="desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Livraison engrais NPK — parcelle nord"
              rows={2}
            />
          </div>

          <div className="space-y-2">
            <Label>Source</Label>
            <Select value={source} onValueChange={(v) => setSource(v as Source)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SOURCES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Justificatif</Label>
            <Button
              type="button"
              variant="outline"
              className="w-full justify-start gap-2 font-normal"
              onClick={() => {
                const n = `Justificatif-${Math.floor(Math.random() * 9000 + 1000)}.pdf`;
                setDocName(n);
                toast.success("Justificatif joint à la transaction.");
              }}
            >
              <Paperclip className="h-4 w-4" />
              <span className="truncate">{docName || "Joindre un fichier"}</span>
            </Button>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={submitting || (touched && !valid)}>
            {submitting ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
