import { cn } from "@/lib/utils";

/**
 * Animated agricultural background: slow drifting topographic field contours
 * plus a few glowing irrigation paths. Intentionally very low opacity.
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
    <div
      aria-hidden
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
    >
      <svg
        viewBox="0 0 1200 700"
        preserveAspectRatio="xMidYMid slice"
        className={cn("h-full w-full", strong ? "opacity-[0.5]" : "opacity-[0.22]")}
      >
        <defs>
          <linearGradient id="fl-stroke" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="currentColor" stopOpacity="0.1" />
            <stop offset="45%" stopColor="currentColor" stopOpacity="0.85" />
            <stop offset="100%" stopColor="currentColor" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        <g className="field-drift text-primary">
          {Array.from({ length: 16 }).map((_, i) => (
            <path
              key={`a-${i}`}
              d={`M-120 ${60 + i * 44} C 180 ${10 + i * 46}, 420 ${140 + i * 40}, 700 ${70 + i * 44} S 1080 ${130 + i * 42}, 1340 ${50 + i * 46}`}
              fill="none"
              stroke="url(#fl-stroke)"
              strokeWidth={i % 4 === 0 ? 1.5 : 0.8}
            />
          ))}
        </g>

        <g className="field-drift-slow text-olive">
          {Array.from({ length: 9 }).map((_, i) => (
            <path
              key={`b-${i}`}
              d={`M${-100 + i * 150} 760 C ${40 + i * 150} 520, ${-40 + i * 150} 320, ${120 + i * 150} -60`}
              fill="none"
              stroke="url(#fl-stroke)"
              strokeWidth="0.7"
            />
          ))}
        </g>

        <g className="text-leaf">
          <path
            d="M120 560 C 340 470, 520 600, 760 470 S 1000 330, 1160 380"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="flow-pulse"
          />
          <path
            d="M80 220 C 300 300, 520 150, 760 240 S 1020 200, 1180 140"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            className="flow-pulse"
          />
        </g>
      </svg>
    </div>
  );
}
