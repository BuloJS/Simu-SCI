import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import type { Totals } from '../lib/compute';
import { formatEur, formatPct } from '../lib/format';

const COLORS = {
  livret: '#22c55e',
  cto: '#6366f1',
  crypto: '#f59e0b',
};

export function AllocationDonut({ t }: { t: Totals }) {
  const data = [
    { key: 'livret', name: 'Livrets', value: t.livretTotal },
    { key: 'cto', name: 'CTO', value: t.ctoTotal },
    { key: 'crypto', name: 'Crypto', value: t.cryptoTotal },
  ].filter((d) => d.value > 0);

  return (
    <div className="card flex flex-col">
      <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
        Répartition du patrimoine
      </p>

      {data.length === 0 ? (
        <div className="flex flex-1 items-center justify-center py-10 text-sm text-slate-400">
          Ajoutez des actifs pour voir la répartition
        </div>
      ) : (
        <>
          <div className="relative mx-auto h-52 w-full">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={60}
                  outerRadius={90}
                  paddingAngle={2}
                  stroke="none"
                >
                  {data.map((d) => (
                    <Cell key={d.key} fill={COLORS[d.key as keyof typeof COLORS]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(v) => formatEur(Number(v))}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid #33415522',
                    background: '#0f172a',
                    color: '#fff',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-xs text-slate-400">Total</span>
              <span className="text-lg font-semibold">{formatEur(t.total)}</span>
            </div>
          </div>

          <ul className="mt-4 space-y-2">
            {data.map((d) => (
              <li key={d.key} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span
                    className="h-3 w-3 rounded-full"
                    style={{ background: COLORS[d.key as keyof typeof COLORS] }}
                  />
                  {d.name}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatEur(d.value)} · {formatPct(d.value / t.total)}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}
