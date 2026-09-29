import { useEffect, useState } from "react";
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
import { PaymentProgress } from "@/components/common/ui-bits";
import { formatMAD } from "@/lib/format";
import { paidOf, remainingOf } from "@/data/selectors";
import { PAYMENT_METHODS, type PaymentMethod, type Transaction } from "@/data/types";
import { useStore } from "@/store/app-store";

export function PaymentDialog({
  transaction,
  open,
  onOpenChange,
}: {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { addPayment } = useStore();
  const remaining = transaction ? remainingOf(transaction) : 0;
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Virement bancaire");
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (!open || !transaction) return;
    setAmount(String(remaining));
    setDate(new Date().toISOString().slice(0, 10));
    setMethod(transaction.method);
    setReference(`REG-${new Date().getFullYear()}-${Math.floor(Math.random() * 9000 + 1000)}`);
    setNote("");
    setTouched(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, transaction?.id]);

  if (!transaction) return null;

  const value = Number(amount);
  const error =
    !amount || Number.isNaN(value) || value <= 0
      ? "Saisissez un montant supérieur à 0."
      : value > remaining
        ? `Le montant dépasse le reste à payer (${formatMAD(remaining)}).`
        : "";

  const submit = () => {
    setTouched(true);
    if (error) return;
    addPayment(transaction.id, {
      amount: value,
      date: new Date(`${date}T10:00:00`).toISOString(),
      method,
      reference,
      note,
    });
    toast.success("Paiement enregistré.");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Ajouter un paiement</DialogTitle>
          <DialogDescription>
            {transaction.reference} · reste à payer {formatMAD(remaining)}
          </DialogDescription>
        </DialogHeader>

        <div className="surface bg-muted/40 p-4">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Total {formatMAD(transaction.amount)}</span>
            <span>Payé {formatMAD(paidOf(transaction))}</span>
          </div>
          <div className="mt-3">
            <PaymentProgress paid={paidOf(transaction)} total={transaction.amount} compactLabel />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-amount">Montant (DH)</Label>
            <Input
              id="p-amount"
              inputMode="numeric"
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d.]/g, ""))}
              aria-invalid={!!(touched && error)}
            />
            {touched && error ? <p className="text-xs text-critical">{error}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-date">Date</Label>
            <Input id="p-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
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
          <div className="space-y-2">
            <Label htmlFor="p-ref">Référence</Label>
            <Input id="p-ref" value={reference} onChange={(e) => setReference(e.target.value)} />
          </div>
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="p-note">Note</Label>
            <Textarea
              id="p-note"
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Règlement partiel convenu avec le fournisseur"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={submit} disabled={touched && !!error}>
            Enregistrer le paiement
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
