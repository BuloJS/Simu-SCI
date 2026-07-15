import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatEur, formatPct } from '../lib/format';

const PALETTE = [
  '#6366f1',
  '#22c55e',
  '#f59e0b',
  '#ec4899',
  '#06b6d4',
  '#a855f7',
  '#ef4444',
  '#14b8a6',
  '#eab308',
  '#3b82f6',
];

export interface HoldingRow {
  label: string;
  value: number;
  invested: number;
}

/** Mini-graphe de répartition + récap (somme, +/- value, %) pour un onglet. */
export function HoldingsOverview({ rows }: { rows: HoldingRow[] }) {
  const data = rows.filter((r) => r.value > 0);
  const total = rows.reduce((s, r) => s + r.value, 0);
  const invested = rows.reduce((s, r) => s + r.invested, 0);
  const pv = total - invested;
  const pvPct = invested > 0 ? pv / invested : 0;
  const up = pv >= 0;

  if (data.length === 0) return null;

  return (
    <div className="card flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="h-28 w-28 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="label"
                innerRadius={34}
                outerRadius={54}
                paddingAngle={2}
                stroke="none"
              >
                {data.map((d, i) => (
                  <Cell key={d.label} fill={PALETTE[i % PALETTE.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(v) => formatEur(Number(v))}
                contentStyle={{
                  borderRadius: 10,
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                  fontSize: 12,
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <ul className="space-y-1 text-xs">
          {data.slice(0, 5).map((d, i) => (
            <li key={d.label} className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: PALETTE[i % PALETTE.length] }}
              />
              <span className="text-slate-600 dark:text-slate-300">{d.label}</span>
              <span className="text-slate-400">{formatPct(d.value / total)}</span>
            </li>
          ))}
          {data.length > 5 && (
            <li className="text-slate-400">+ {data.length - 5} autre(s)</li>
          )}
        </ul>
      </div>

      <div className="text-center sm:text-right">
        <p className="text-xs text-slate-500 dark:text-slate-400">Valeur totale</p>
        <p className="text-2xl font-semibold">{formatEur(total)}</p>
        <p className={`text-sm ${up ? 'text-emerald-500' : 'text-rose-500'}`}>
          {up ? '+' : ''}
          {formatEur(pv)}
          <span className="ml-1 text-xs opacity-80">({formatPct(pvPct)})</span>
        </p>
      </div>
    </div>
  );
}
