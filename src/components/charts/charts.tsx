import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatMAD } from "@/lib/format";

const AXIS = {
  stroke: "var(--color-border)",
  tick: { fill: "var(--color-muted-foreground)", fontSize: 11 },
};

const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-chart-6)",
];

function TipBox({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: { name?: string; value?: number; color?: string; payload?: { name?: string } }[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl border border-border bg-popover px-3 py-2 shadow-[var(--shadow-lifted)]">
      <div className="text-[0.7rem] font-semibold text-foreground">
        {label ?? payload[0]?.payload?.name}
      </div>
      {payload.map((p, i) => (
        <div key={i} className="mt-1 flex items-center gap-2 text-[0.72rem] text-muted-foreground">
          <span className="h-2 w-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}</span>
          <span className="num ml-auto font-semibold text-foreground">{formatMAD(p.value ?? 0)}</span>
        </div>
      ))}
    </div>
  );
}

const compact = (v: number) => formatMAD(v, { compact: true }).replace(" DH", "");

export function ExpenseLine({
  data,
  height = 260,
}: {
  data: { month: string; depenses: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 6" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS.tick} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS.tick} tickFormatter={compact} />
        <Tooltip content={<TipBox />} />
        <Line
          type="monotone"
          dataKey="depenses"
          name="Dépenses"
          stroke="var(--color-chart-1)"
          strokeWidth={2.4}
          dot={{ r: 2.5, strokeWidth: 0 , fill: "var(--color-chart-1)" }}
          activeDot={{ r: 5 }}
          animationDuration={900}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}

export function FarmBars({
  data,
  height = 260,
}: {
  data: { name: string; depenses: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 6" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS.tick} interval={0} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS.tick} tickFormatter={compact} />
        <Tooltip content={<TipBox />} cursor={{ fill: "var(--color-accent)", opacity: 0.5 }} />
        <Bar dataKey="depenses" name="Dépenses" radius={[8, 8, 4, 4]} animationDuration={900}>
          {data.map((_, i) => (
            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

export function CategoryDonut({
  data,
  height = 260,
}: {
  data: { name: string; value: number }[];
  height?: number;
}) {
  const top = data.slice(0, 8);
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
      <ResponsiveContainer width="100%" height={height} className="max-w-[240px]">
        <PieChart>
          <Pie
            data={top}
            dataKey="value"
            nameKey="name"
            innerRadius="58%"
            outerRadius="88%"
            paddingAngle={2}
            stroke="var(--color-card)"
            strokeWidth={2}
            animationDuration={900}
          >
            {top.map((_, i) => (
              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip content={<TipBox />} />
        </PieChart>
      </ResponsiveContainer>
      <ul className="grid flex-1 gap-1.5">
        {top.map((d, i) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span
              className="h-2.5 w-2.5 rounded-full"
              style={{ background: CHART_COLORS[i % CHART_COLORS.length] }}
            />
            <span className="truncate text-muted-foreground">{d.name}</span>
            <span className="num ml-auto font-semibold">{formatMAD(d.value, { compact: true })}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function InOutArea({
  data,
  height = 260,
}: {
  data: { month: string; depenses: number; encaissements: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <defs>
          <linearGradient id="grad-in" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.45} />
            <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id="grad-out" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-chart-4)" stopOpacity={0.4} />
            <stop offset="100%" stopColor="var(--color-chart-4)" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 6" />
        <XAxis dataKey="month" axisLine={false} tickLine={false} tick={AXIS.tick} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS.tick} tickFormatter={compact} />
        <Tooltip content={<TipBox />} />
        <Area
          type="monotone"
          dataKey="encaissements"
          name="Encaissements"
          stroke="var(--color-chart-2)"
          strokeWidth={2}
          fill="url(#grad-in)"
          animationDuration={900}
        />
        <Area
          type="monotone"
          dataKey="depenses"
          name="Sorties"
          stroke="var(--color-chart-4)"
          strokeWidth={2}
          fill="url(#grad-out)"
          animationDuration={900}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function HorizontalBars({
  data,
  dataKey = "total",
  height = 260,
  color = "var(--color-chart-1)",
}: {
  data: { name: string; total?: number; remaining?: number }[];
  dataKey?: string;
  height?: number;
  color?: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
        <CartesianGrid horizontal={false} stroke="var(--color-border)" strokeDasharray="3 6" />
        <XAxis type="number" axisLine={false} tickLine={false} tick={AXIS.tick} tickFormatter={compact} />
        <YAxis
          type="category"
          dataKey="name"
          axisLine={false}
          tickLine={false}
          width={132}
          tick={{ fill: "var(--color-muted-foreground)", fontSize: 10.5 }}
        />
        <Tooltip content={<TipBox />} cursor={{ fill: "var(--color-accent)", opacity: 0.5 }} />
        <Bar dataKey={dataKey} name="Montant" fill={color} radius={[4, 8, 8, 4]} animationDuration={900} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ComparisonBars({
  data,
  height = 280,
}: {
  data: { name: string; depenses: number; budget: number }[];
  height?: number;
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="var(--color-border)" strokeDasharray="3 6" />
        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={AXIS.tick} interval={0} />
        <YAxis axisLine={false} tickLine={false} tick={AXIS.tick} tickFormatter={compact} />
        <Tooltip content={<TipBox />} cursor={{ fill: "var(--color-accent)", opacity: 0.5 }} />
        <Bar dataKey="depenses" name="Dépenses" fill="var(--color-chart-1)" radius={[8, 8, 4, 4]} />
        <Bar dataKey="budget" name="Budget" fill="var(--color-chart-5)" radius={[8, 8, 4, 4]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
