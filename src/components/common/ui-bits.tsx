import { ArrowDown, ArrowUp, ChevronsUpDown, Info, type LucideIcon } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { formatMAD, formatPercent, groupDigits } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransactionStatus } from "@/data/types";

export function CountUp({
  value,
  money = false,
  compact = false,
  suffix,
}: {
  value: number;
  money?: boolean;
  compact?: boolean;
  suffix?: string;
}) {
  const [display, setDisplay] = useState(value);
  const fromRef = useRef(value);

  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    const duration = 700;
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(from + (value - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  const text = money ? formatMAD(display, { compact }) : groupDigits(display);
  return (
    <span className="num">
      {text}
      {suffix}
    </span>
  );
}

export function KpiCard({
  label,
  value,
  money = true,
  compact = false,
  evolution,
  comparison = "vs période précédente",
  icon: Icon,
  tooltip,
  tone = "neutral",
  className,
}: {
  label: string;
  value: number;
  money?: boolean;
  compact?: boolean;
  evolution?: number;
  comparison?: string;
  icon: LucideIcon;
  tooltip?: string;
  tone?: "neutral" | "positive" | "warning" | "critical";
  className?: string;
}) {
  const toneRing = {
    neutral: "bg-accent text-canopy",
    positive: "bg-primary/12 text-primary",
    warning: "bg-warning/12 text-warning",
    critical: "bg-critical/12 text-critical",
  }[tone];

  return (
    <div className={cn("surface surface-hover rise-in p-5", className)}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-[0.8rem] font-medium text-muted-foreground">
          <span>{label}</span>
          {tooltip ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  type="button"
                  aria-label={`À propos de ${label}`}
                  className="text-muted-foreground/70 transition-colors hover:text-primary"
                >
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent className="max-w-56">{tooltip}</TooltipContent>
            </Tooltip>
          ) : null}
        </div>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-xl", toneRing)}>
          <Icon className="h-4 w-4" />
        </span>
      </div>
      <div className="mt-4 font-display text-2xl font-semibold tracking-tight">
        <CountUp value={value} money={money} compact={compact} />
      </div>
      {evolution !== undefined ? (
        <div className="mt-2 flex items-center gap-2 text-xs">
          <span
            className={cn(
              "rounded-full px-2 py-0.5 font-semibold num",
              evolution > 0 ? "bg-warning/12 text-warning" : "bg-primary/12 text-primary",
            )}
          >
            {formatPercent(evolution)}
          </span>
          <span className="text-muted-foreground">{comparison}</span>
        </div>
      ) : (
        <div className="mt-2 text-xs text-muted-foreground">{comparison}</div>
      )}
    </div>
  );
}

const STATUS_STYLES: Record<string, string> = {
  Payé: "bg-primary/12 text-primary border-primary/20",
  "Partiellement payé": "bg-wheat/18 text-warning border-warning/25",
  "À payer": "bg-warning/12 text-warning border-warning/25",
  "En attente": "bg-muted text-muted-foreground border-border",
  Annulé: "bg-critical/10 text-critical border-critical/25",
  Actif: "bg-primary/12 text-primary border-primary/20",
  Active: "bg-primary/12 text-primary border-primary/20",
  Inactif: "bg-muted text-muted-foreground border-border",
  Saisonnier: "bg-earth/25 text-canopy border-earth/40",
  Saisonnière: "bg-earth/25 text-canopy border-earth/40",
  Terminé: "bg-primary/12 text-primary border-primary/20",
  "En cours": "bg-wheat/20 text-warning border-warning/25",
  Planifié: "bg-accent text-canopy border-border",
  Validé: "bg-primary/12 text-primary border-primary/20",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge
      variant="outline"
      className={cn(
        "rounded-full border px-2.5 py-0.5 text-[0.7rem] font-semibold",
        STATUS_STYLES[status] ?? "bg-muted text-muted-foreground",
        className,
      )}
    >
      {status}
    </Badge>
  );
}

export function TypeBadge({ type }: { type: string }) {
  const map: Record<string, string> = {
    Achat: "bg-canopy/10 text-canopy",
    Dépense: "bg-olive/15 text-olive",
    Paiement: "bg-primary/12 text-primary",
    Avance: "bg-wheat/20 text-warning",
    Encaissement: "bg-leaf/20 text-primary",
    Vente: "bg-leaf/20 text-primary",
    Ajustement: "bg-muted text-muted-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex rounded-md px-2 py-0.5 text-[0.72rem] font-semibold",
        map[type] ?? "bg-muted text-muted-foreground",
      )}
    >
      {type}
    </span>
  );
}

export function SortHeader<K extends string>({
  label,
  field,
  sort,
  onSort,
  align = "left",
}: {
  label: string;
  field: K;
  sort: { field: K; dir: "asc" | "desc" };
  onSort: (field: K) => void;
  align?: "left" | "right";
}) {
  const active = sort.field === field;
  return (
    <button
      type="button"
      onClick={() => onSort(field)}
      className={cn(
        "group inline-flex items-center gap-1 text-[0.72rem] font-semibold tracking-wide uppercase transition-colors",
        active ? "text-canopy" : "text-muted-foreground hover:text-canopy",
        align === "right" && "flex-row-reverse",
      )}
    >
      {label}
      {active ? (
        sort.dir === "asc" ? (
          <ArrowUp className="h-3 w-3" />
        ) : (
          <ArrowDown className="h-3 w-3" />
        )
      ) : (
        <ChevronsUpDown className="h-3 w-3 opacity-0 transition-opacity group-hover:opacity-60" />
      )}
    </button>
  );
}

export function Pager({
  page,
  pageSize,
  total,
  onPage,
  onPageSize,
  noun = "éléments",
}: {
  page: number;
  pageSize: number;
  total: number;
  onPage: (p: number) => void;
  onPageSize: (n: number) => void;
  noun?: string;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(total, page * pageSize);
  const numbers: number[] = [];
  for (let p = Math.max(1, page - 2); p <= Math.min(pages, page + 2); p++) numbers.push(p);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3">
      <div className="flex items-center gap-3 text-xs text-muted-foreground">
        <span className="num">
          {from}–{to} sur {groupDigits(total)} {noun}
        </span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSize(Number(e.target.value));
            onPage(1);
          }}
          aria-label="Lignes par page"
          className="rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground"
        >
          {[10, 25, 50].map((n) => (
            <option key={n} value={n}>
              {n} lignes
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPage(page - 1)}
          className="h-8"
        >
          Précédent
        </Button>
        {numbers.map((p) => (
          <Button
            key={p}
            size="sm"
            variant={p === page ? "default" : "ghost"}
            onClick={() => onPage(p)}
            className="h-8 w-8 p-0 num"
          >
            {p}
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={page >= pages}
          onClick={() => onPage(page + 1)}
          className="h-8"
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon: LucideIcon;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
      <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-canopy">
        <Icon className="h-6 w-6" />
      </span>
      <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function PaymentProgress({
  paid,
  total,
  compactLabel = false,
}: {
  paid: number;
  total: number;
  compactLabel?: boolean;
}) {
  const pct = total ? Math.min(100, (paid / total) * 100) : 100;
  return (
    <div className="space-y-1.5">
      <Progress value={pct} className="h-1.5" />
      {!compactLabel ? (
        <div className="flex justify-between text-[0.7rem] text-muted-foreground num">
          <span>{formatMAD(paid)} réglés</span>
          <span>{Math.round(pct)} %</span>
        </div>
      ) : null}
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-lg font-semibold tracking-tight">{title}</h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {action}
    </div>
  );
}

export function Money({
  value,
  tone = "neutral",
  className,
}: {
  value: number;
  tone?: "neutral" | "positive" | "warning" | "critical" | "muted";
  className?: string;
}) {
  return (
    <span
      className={cn(
        "num font-semibold",
        {
          neutral: "text-foreground",
          positive: "text-primary",
          warning: "text-warning",
          critical: "text-critical",
          muted: "text-muted-foreground",
        }[tone],
        className,
      )}
    >
      {formatMAD(value)}
    </span>
  );
}

export function statusTone(status: TransactionStatus) {
  if (status === "Payé") return "positive" as const;
  if (status === "Annulé") return "critical" as const;
  if (status === "À payer" || status === "Partiellement payé") return "warning" as const;
  return "muted" as const;
}
