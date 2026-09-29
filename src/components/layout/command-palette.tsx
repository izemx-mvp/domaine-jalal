import { useNavigate } from "@tanstack/react-router";
import {
  Building2,
  FileText,
  HardHat,
  Receipt,
  Truck,
  Users,
} from "lucide-react";

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { formatMAD } from "@/lib/format";
import { useStore } from "@/store/app-store";

export function CommandPalette({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data } = useStore();
  const navigate = useNavigate();

  const go = (to: string) => {
    onOpenChange(false);
    navigate({ to });
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Rechercher une transaction, un fournisseur, un ouvrier, un client..." />
      <CommandList>
        <CommandEmpty>Aucun résultat trouvé.</CommandEmpty>

        <CommandGroup heading="Exploitations">
          {data.farms.map((f) => (
            <CommandItem
              key={f.id}
              value={`${f.name} ${f.activity} exploitation`}
              onSelect={() => go(`/exploitations/${f.slug}`)}
            >
              <Building2 className="text-primary" />
              <span>{f.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{f.activity}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Transactions">
          {data.transactions.slice(0, 40).map((t) => (
            <CommandItem
              key={t.id}
              value={`${t.reference} ${t.category} ${t.type}`}
              onSelect={() => go("/transactions")}
            >
              <Receipt className="text-primary" />
              <span className="num">{t.reference}</span>
              <span className="text-xs text-muted-foreground">{t.category}</span>
              <span className="ml-auto text-xs num">{formatMAD(t.amount)}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Fournisseurs">
          {data.suppliers.slice(0, 25).map((s) => (
            <CommandItem
              key={s.id}
              value={`${s.name} ${s.activity} fournisseur`}
              onSelect={() => go("/fournisseurs")}
            >
              <Truck className="text-primary" />
              <span>{s.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{s.activity}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Ouvriers">
          {data.workers.slice(0, 25).map((w) => (
            <CommandItem
              key={w.id}
              value={`${w.name} ${w.role} ouvrier`}
              onSelect={() => go("/ouvriers")}
            >
              <HardHat className="text-primary" />
              <span>{w.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{w.role}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Clients">
          {data.clients.map((c) => (
            <CommandItem
              key={c.id}
              value={`${c.name} ${c.activity} client`}
              onSelect={() => go("/clients")}
            >
              <Users className="text-primary" />
              <span>{c.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{c.activity}</span>
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandGroup heading="Documents">
          {data.documents.slice(0, 20).map((d) => (
            <CommandItem
              key={d.id}
              value={`${d.name} ${d.category} document`}
              onSelect={() => go("/documents")}
            >
              <FileText className="text-primary" />
              <span>{d.name}</span>
              <span className="ml-auto text-xs text-muted-foreground">{d.category}</span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
