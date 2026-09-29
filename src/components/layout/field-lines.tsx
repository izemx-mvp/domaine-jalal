import { cn } from "@/lib/utils";

/** One stylised wheat stalk (stem + grain ear + awns), drawn upward from (0,0). */
function Stalk({ x, h, bend = 0 }: { x: number; h: number; bend?: number }) {
  const top = -h;
  const grains = 6;
  return (
    <g transform={`translate(${x} 700)`}>
      <path d={`M0 0 Q ${bend} ${top / 2}, ${bend * 1.4} ${top}`} stroke="currentColor" strokeWidth="1.1" fill="none" />
      {Array.from({ length: grains }).map((_, i) => {
        const y = top + i * 7;
        const cx = bend * 1.4 - (i * bend) / 40;
        return (
          <g key={i}>
            <ellipse cx={cx - 2.6} cy={y} rx="2" ry="4.2" transform={`rotate(-24 ${cx - 2.6} ${y})`} fill="currentColor" />
            <ellipse cx={cx + 2.6} cy={y} rx="2" ry="4.2" transform={`rotate(24 ${cx + 2.6} ${y})`} fill="currentColor" />
            <path d={`M${cx - 3} ${y - 3} l -5 -9 M${cx + 3} ${y - 3} l 5 -9`} stroke="currentColor" strokeWidth="0.5" />
          </g>
        );
      })}
    </g>
  );
}

function Layer({ count, seed, minH, maxH, className }: { count: number; seed: number; minH: number; maxH: number; className: string }) {
  let s = seed;
  const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  return (
    <g className={className}>
      {Array.from({ length: count }).map((_, i) => (
        <Stalk key={i} x={(i / count) * 1300 - 50 + r() * 30} h={minH + r() * (maxH - minH)} bend={(r() - 0.5) * 30} />
      ))}
    </g>
  );
}

/**
 * Animated agricultural background: soft field contours plus three wheat layers
 * swaying right → left → right at different speeds (parallax), with light dust.
 * Very low opacity so content stays readable.
 */
export function FieldLines({
  className,
  intensity = "subtle",
}: {
  className?: string;
  intensity?: "subtle" | "showcase";
}) {
  const strong = intensity === "showcase";
  return (
    <div aria-hidden className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMax slice"
        className={cn("h-full w-full", strong ? "opacity-[0.55]" : "opacity-[0.2]")}
      >
        <defs>
          <linearGradient id="fl-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="45%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
          <linearGradient id="wheat-fade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0" />
            <stop offset="55%" stopColor="white" stopOpacity="1" />
          </linearGradient>
          <mask id="wheat-mask">
            <rect width="1200" height="700" fill="url(#wheat-fade)" />
          </mask>
        </defs>

        <g className="field-drift text-primary">
          {Array.from({ length: 12 }).map((_, i) => (
            <path
              key={`a-${i}`}
              d={`M-120 ${60 + i * 44} C 180 ${10 + i * 46}, 420 ${140 + i * 40}, 700 ${70 + i * 44} S 1080 ${130 + i * 42}, 1340 ${50 + i * 46}`}
              fill="none"
              stroke="url(#fl-stroke)"
              strokeWidth={i % 4 === 0 ? 1.3 : 0.7}
            />
          ))}
        </g>

        <g mask="url(#wheat-mask)">
          <g className="text-wheat" opacity="0.45">
            <Layer count={70} seed={7} minH={120} maxH={190} className="wheat-sway-far" />
          </g>
          <g className="text-olive" opacity="0.55">
            <Layer count={42} seed={19} minH={170} maxH={260} className="wheat-sway-mid" />
          </g>
          <g className="text-canopy" opacity="0.5">
            <Layer count={18} seed={43} minH={240} maxH={340} className="wheat-sway-near" />
          </g>
        </g>

        <g className="text-wheat">
          {Array.from({ length: strong ? 18 : 10 }).map((_, i) => (
            <circle
              key={i}
              cx={(i * 137) % 1200}
              cy={260 + ((i * 89) % 380)}
              r={i % 3 === 0 ? 1.8 : 1.1}
              fill="currentColor"
              className="wheat-dust"
              style={{ animationDelay: `${(i * 1.7) % 18}s` }}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}
