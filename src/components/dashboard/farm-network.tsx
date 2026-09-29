import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { formatMAD, shortDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { farmStats, flowsBetween } from "@/data/selectors";
import { useStore } from "@/store/app-store";

const POSITIONS: Record<string, { x: number; y: number }> = {
  "f-orange": { x: 18, y: 22 },
  "f-ble1": { x: 82, y: 20 },
  "f-ble2": { x: 16, y: 78 },
  "f-bovin": { x: 84, y: 79 },
};

export function FarmNetwork() {
  const { data, now } = useStore();
  const navigate = useNavigate();
  const [hover, setHover] = useState<string | null>(null);
  const links = flowsBetween(data);

  return (
    <div className="canopy-panel surface relative overflow-hidden border-transparent p-6">
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="font-display text-lg font-semibold text-cream">Cartographie du domaine</h2>
          <p className="mt-1 text-xs text-cream/60">
            Quatre activités, un centre de décision. Les tracés indiquent les flux internes récents.
          </p>
        </div>
        <span className="rounded-full border border-cream/15 px-3 py-1 text-[0.65rem] tracking-wide text-cream/60 uppercase">
          {links.length} liaisons actives
        </span>
      </div>

      <div className="relative mt-4 h-[340px] w-full">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {links.map((l) => {
            const a = POSITIONS[l.from];
            const b = POSITIONS[l.to];
            if (!a || !b) return null;
            const active = hover === l.from || hover === l.to;
            return (
              <line
                key={`${l.from}-${l.to}`}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                stroke="var(--color-leaf)"
                strokeWidth={active ? 0.7 : 0.35}
                opacity={active ? 0.95 : 0.4}
                className="flow-pulse"
                vectorEffect="non-scaling-stroke"
              />
            );
          })}
          {Object.values(POSITIONS).map((p, i) => (
            <line
              key={i}
              x1={50}
              y1={50}
              x2={p.x}
              y2={p.y}
              stroke="var(--color-cream)"
              strokeWidth={0.2}
              opacity={0.18}
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center">
          <div className="rounded-2xl border border-cream/20 bg-cream/10 px-5 py-3 backdrop-blur-sm">
            <div className="font-display text-sm font-semibold text-cream">Domaine Jalal</div>
            <div className="text-[0.62rem] tracking-[0.2em] text-leaf uppercase">Direction</div>
          </div>
        </div>

        {data.farms.map((farm) => {
          const pos = POSITIONS[farm.id];
          const stats = farmStats(data, farm.id, now);
          const recent = data.flows.find(
            (f) => f.fromFarmId === farm.id || f.toFarmId === farm.id,
          );
          return (
            <button
              key={farm.id}
              onMouseEnter={() => setHover(farm.id)}
              onMouseLeave={() => setHover(null)}
              onFocus={() => setHover(farm.id)}
              onBlur={() => setHover(null)}
              onClick={() => navigate({ to: "/exploitations/$slug", params: { slug: farm.slug } })}
              style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
              className={cn(
                "absolute w-[168px] -translate-x-1/2 -translate-y-1/2 rounded-2xl border p-3 text-left transition-all duration-300",
                hover === farm.id
                  ? "border-leaf bg-cream/16 shadow-[0_18px_40px_-20px_rgba(0,0,0,0.6)]"
                  : "border-cream/14 bg-cream/8 hover:border-leaf/60",
              )}
            >
              <div className="text-[0.8rem] font-semibold text-cream">{farm.name}</div>
              <div className="num mt-1 text-[0.7rem] text-leaf">
                {formatMAD(stats.monthExpenses, { compact: true })} ce mois
              </div>
              {hover === farm.id ? (
                <div className="mt-2 space-y-0.5 text-[0.66rem] text-cream/70">
                  <div className="num">{stats.count} opérations</div>
                  <div className="num">Budget {formatMAD(farm.monthlyBudget, { compact: true })}</div>
                  {recent ? (
                    <div className="num">
                      Dernier flux {shortDate(recent.date)} · {recent.product}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
