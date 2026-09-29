import { Link } from "@tanstack/react-router";
import { ArrowUpRight, Send, UserCheck, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Money } from "@/components/common/ui-bits";
import { AssignDialog } from "@/components/workers/worker-skills";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { farmName, partyName } from "@/data/selectors";
import type { SkillName, Worker } from "@/data/types";
import { answer, SUGGESTIONS, type AnswerBlock } from "@/lib/assistant-engine";
import { formatMAD, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useStore } from "@/store/app-store";

const POS_KEY = "domaine-jalal-assistant-pos";
const SIZE = 60;

interface Msg {
  id: number;
  role: "user" | "assistant";
  text?: string;
  blocks?: AnswerBlock[];
}

function AssistantMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={className} aria-hidden fill="none">
      <path d="M16 27V11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <path d={`M16 ${20 - i * 4.5} C 12 ${19 - i * 4.5}, 10.5 ${16 - i * 4.5}, 11 ${13.5 - i * 4.5} C 14 ${14.5 - i * 4.5}, 15.5 ${17 - i * 4.5}, 16 ${20 - i * 4.5}Z`} fill="currentColor" opacity={0.9 - i * 0.15} />
          <path d={`M16 ${20 - i * 4.5} C 20 ${19 - i * 4.5}, 21.5 ${16 - i * 4.5}, 21 ${13.5 - i * 4.5} C 18 ${14.5 - i * 4.5}, 16.5 ${17 - i * 4.5}, 16 ${20 - i * 4.5}Z`} fill="currentColor" opacity={0.75 - i * 0.15} />
        </g>
      ))}
      <circle cx="25" cy="7" r="1.6" fill="currentColor" />
      <circle cx="7.5" cy="9" r="1" fill="currentColor" opacity="0.7" />
    </svg>
  );
}

export function AssistantFab() {
  const { data, now } = useStore();
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [thinking, setThinking] = useState(false);
  const [assign, setAssign] = useState<{ worker: Worker; ctx: Extract<AnswerBlock, { kind: "workers" }>["context"] } | null>(null);
  const drag = useRef<{ dx: number; dy: number; moved: boolean } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    const clamp = (p: { x: number; y: number }) => ({
      x: Math.min(Math.max(8, p.x), window.innerWidth - SIZE - 8),
      y: Math.min(Math.max(8, p.y), window.innerHeight - SIZE - 8),
    });
    try {
      const raw = sessionStorage.getItem(POS_KEY);
      setPos(clamp(raw ? JSON.parse(raw) : { x: window.innerWidth - SIZE - 24, y: window.innerHeight - SIZE - 24 }));
    } catch {
      setPos(clamp({ x: window.innerWidth - SIZE - 24, y: window.innerHeight - SIZE - 24 }));
    }
    const onResize = () => setPos((p) => (p ? clamp(p) : p));
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  const ask = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setInput("");
    setMsgs((m) => [...m, { id: idRef.current++, role: "user", text: q }]);
    setThinking(true);
    window.setTimeout(() => {
      setMsgs((m) => [...m, { id: idRef.current++, role: "assistant", blocks: answer(data, now, q) }]);
      setThinking(false);
    }, 650);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLButtonElement>) => {
    if (!pos) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { dx: e.clientX - pos.x, dy: e.clientY - pos.y, moved: false };
  };
  const onPointerMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    const x = Math.min(Math.max(8, e.clientX - d.dx), window.innerWidth - SIZE - 8);
    const y = Math.min(Math.max(8, e.clientY - d.dy), window.innerHeight - SIZE - 8);
    if (pos && (Math.abs(x - pos.x) > 3 || Math.abs(y - pos.y) > 3)) d.moved = true;
    if (d.moved) setPos({ x, y });
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d) return;
    if (d.moved) {
      try {
        sessionStorage.setItem(POS_KEY, JSON.stringify(pos));
      } catch {
        /* ignore */
      }
    } else setOpen((v) => !v);
  };

  if (!pos) return null;

  // Panel placement: open towards the side with more room.
  const panelW = Math.min(420, window.innerWidth - 16);
  const panelH = Math.min(600, window.innerHeight - 100);
  const left = Math.min(Math.max(8, pos.x + SIZE - panelW), window.innerWidth - panelW - 8);
  const above = pos.y > window.innerHeight / 2;
  const top = above ? Math.max(8, pos.y - panelH - 12) : Math.min(pos.y + SIZE + 12, window.innerHeight - panelH - 8);

  return (
    <>
      {open ? (
        <div
          role="dialog"
          aria-label="Assistant IA"
          style={{ left, top, width: panelW, height: panelH }}
          className="rise-in fixed z-[60] flex flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl"
        >
          <div className="canopy-panel flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-cream/15 text-wheat">
                <AssistantMark className="h-5 w-5" />
              </span>
              <div>
                <div className="font-display text-sm font-semibold text-cream">Assistant Jalal</div>
                <div className="text-[0.68rem] text-cream/65">Analyse des données du domaine</div>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="rounded-md p-1 text-cream/70 hover:bg-cream/10" aria-label="Fermer">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-4">
            {msgs.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground">
                  Posez une question sur les dépenses, exploitations, fournisseurs, ouvriers ou le suivi vétérinaire.
                </p>
                <Suggestions onPick={ask} />
              </div>
            ) : null}
            {msgs.map((m) =>
              m.role === "user" ? (
                <div key={m.id} className="ml-auto max-w-[85%] rounded-2xl rounded-br-md bg-canopy px-3.5 py-2 text-sm text-cream">
                  {m.text}
                </div>
              ) : (
                <div key={m.id} className="space-y-3">
                  {m.blocks?.map((b, i) => (
                    <Block key={i} block={b} onAssign={(worker, ctx) => setAssign({ worker, ctx })} onClose={() => setOpen(false)} />
                  ))}
                  {m.blocks?.length === 1 && m.blocks[0].kind === "text" ? <Suggestions onPick={ask} /> : null}
                </div>
              ),
            )}
            {thinking ? (
              <div className="flex gap-1 px-1">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="h-1.5 w-1.5 animate-bounce rounded-full bg-primary" style={{ animationDelay: `${i * 120}ms` }} />
                ))}
              </div>
            ) : null}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex gap-2 border-t border-border p-3"
          >
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Votre question..." autoFocus />
            <Button type="submit" size="icon" disabled={!input.trim() || thinking} aria-label="Envoyer">
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      ) : null}

      <button
        type="button"
        aria-label="Ouvrir l'assistant IA (glisser pour déplacer)"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ left: pos.x, top: pos.y, width: SIZE, height: SIZE, touchAction: "none" }}
        className={cn(
          "assistant-fab group fixed z-[61] flex cursor-grab items-center justify-center rounded-full text-wheat shadow-xl transition-transform duration-200 select-none hover:scale-105 active:cursor-grabbing",
          open && "ring-2 ring-wheat/60",
        )}
      >
        {!open ? <span className="assistant-pulse pointer-events-none absolute inset-0 rounded-full" /> : null}
        {open ? <X className="h-5 w-5 text-cream" /> : <AssistantMark className="h-8 w-8" />}
      </button>

      {assign ? (
        <AssignDialog
          worker={data.workers.find((w) => w.id === assign.worker.id) ?? assign.worker}
          open
          onOpenChange={(v) => !v && setAssign(null)}
          defaults={assign.ctx}
        />
      ) : null}
    </>
  );
}

function Suggestions({ onPick }: { onPick: (q: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {SUGGESTIONS.map((s) => (
        <button key={s} onClick={() => onPick(s)} className="rounded-full border border-border bg-background px-2.5 py-1 text-left text-xs transition-colors hover:border-primary/40 hover:bg-accent">
          {s}
        </button>
      ))}
    </div>
  );
}

function Block({
  block,
  onAssign,
  onClose,
}: {
  block: AnswerBlock;
  onAssign: (w: Worker, ctx: { farmId: string; skill: SkillName; task: string; date: string; replacing?: string }) => void;
  onClose: () => void;
}) {
  const { data } = useStore();
  switch (block.kind) {
    case "text":
      return <p className="text-sm leading-relaxed">{block.text}</p>;
    case "kpis":
      return (
        <div className="grid grid-cols-3 gap-2">
          {block.items.map((k) => (
            <div key={k.label} className="rounded-xl bg-muted/60 px-2.5 py-2">
              <div className="text-[0.66rem] text-muted-foreground">{k.label}</div>
              <div className="num font-display text-sm font-semibold">{k.value}</div>
            </div>
          ))}
        </div>
      );
    case "bars": {
      const max = Math.max(1, ...block.items.map((i) => i.value));
      return (
        <div className="rounded-xl border border-border p-3">
          <div className="mb-2 text-xs font-medium text-muted-foreground">{block.title}</div>
          <div className="space-y-1.5">
            {block.items.map((i) => (
              <div key={i.label}>
                <div className="flex justify-between text-[0.7rem]">
                  <span className="truncate pr-2">{i.label}</span>
                  <span className="num">{formatMAD(i.value, { compact: true })}</span>
                </div>
                <div className="mt-0.5 h-1.5 rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${(i.value / max) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    }
    case "table":
      return block.rows.length ? (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-xs">
            <thead className="bg-muted/50 text-left text-muted-foreground">
              <tr>{block.columns.map((c) => <th key={c} className="px-2.5 py-1.5 font-medium">{c}</th>)}</tr>
            </thead>
            <tbody>
              {block.rows.map((r, i) => (
                <tr key={i} className="border-t border-border/60">
                  {r.map((c, j) => <td key={j} className="px-2.5 py-1.5">{c}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">Aucun élément.</p>
      );
    case "workers":
      return (
        <div className="space-y-2">
          {block.candidates.map((c) => (
            <div key={c.worker.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-2.5">
              <div className="min-w-0">
                <div className="text-sm font-semibold">{c.worker.name}</div>
                <div className="truncate text-[0.7rem] text-muted-foreground">
                  {farmName(data, c.worker.farmId)} · {c.reasons.slice(0, 2).join(" · ")}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="num text-sm font-semibold text-primary">{c.score}%</span>
                <Button size="sm" variant="outline" className="h-7 gap-1 px-2 text-xs" onClick={() => onAssign(c.worker, block.context)}>
                  <UserCheck className="h-3 w-3" /> Affecter
                </Button>
              </div>
            </div>
          ))}
        </div>
      );
    case "transactions": {
      const list = block.ids.map((id) => data.transactions.find((t) => t.id === id)).filter(Boolean);
      return list.length ? (
        <ul className="divide-y divide-border/60 rounded-xl border border-border">
          {list.map((t) => (
            <li key={t!.id} className="flex items-center justify-between gap-2 px-2.5 py-1.5 text-xs">
              <div className="min-w-0">
                <div className="truncate font-medium">{t!.description}</div>
                <div className="num text-muted-foreground">{t!.reference} · {shortDate(t!.date)} · {partyName(data, t!)}</div>
              </div>
              <Money value={t!.amount} />
            </li>
          ))}
        </ul>
      ) : null;
    }
    case "links":
      return (
        <div className="flex flex-wrap gap-2">
          {block.links.map((l) => (
            <Link
              key={l.label}
              to={l.to as "/transactions"}
              params={l.params as never}
              onClick={onClose}
              className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-xs font-medium text-canopy hover:bg-accent/70"
            >
              {l.label} <ArrowUpRight className="h-3 w-3" />
            </Link>
          ))}
        </div>
      );
  }
}
