import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={cn("h-9 w-9", className)}
      role="img"
      aria-label="Domaine Jalal"
    >
      <rect width="64" height="64" rx="16" className="fill-canopy" />
      <path
        d="M32 12c10 6 14 14 14 22 0 9-6 16-14 18-8-2-14-9-14-18 0-8 4-16 14-22z"
        fill="none"
        strokeWidth="3"
        strokeLinejoin="round"
        className="stroke-leaf"
      />
      <path d="M32 16v34" strokeWidth="3" strokeLinecap="round" className="stroke-cream" />
      <path
        d="M32 27c4.5-1.5 7.5-1.5 11 0M32 36c4.5-1.5 7.5-1.5 10 0M32 27c-4.5-1.5-7.5-1.5-11 0M32 36c-4.5-1.5-7.5-1.5-10 0"
        strokeWidth="2.6"
        strokeLinecap="round"
        fill="none"
        className="stroke-wheat"
      />
    </svg>
  );
}

export function LogoLockup({
  className,
  tone = "light",
}: {
  className?: string;
  tone?: "light" | "dark";
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <LogoMark />
      <div className="leading-none">
        <div
          className={cn(
            "font-display text-[0.95rem] font-semibold tracking-[0.16em] uppercase",
            tone === "light" ? "text-canopy" : "text-cream",
          )}
        >
          Domaine Jalal
        </div>
        <div
          className={cn(
            "mt-1 text-[0.62rem] font-medium tracking-[0.3em] uppercase",
            tone === "light" ? "text-muted-foreground" : "text-leaf",
          )}
        >
          Gestion agricole
        </div>
      </div>
    </div>
  );
}
