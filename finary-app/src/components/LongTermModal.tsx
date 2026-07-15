import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatEur, formatEur0 } from '../lib/format';

interface Point {
  annee: number;
  verse: number;
  valeur: number;
}

function project(
  capital: number,
  tauxPct: number,
  mensuel: number,
  annees: number,
): { points: Point[]; total: number; verse: number; interets: number } {
  const r = tauxPct / 100 / 12;
  let balance = capital;
  let verse = capital;
  const points: Point[] = [{ annee: 0, verse, valeur: balance }];
  for (let m = 1; m <= annees * 12; m++) {
    balance = balance * (1 + r) + mensuel;
    verse += mensuel;
    if (m % 12 === 0) {
      points.push({ annee: m / 12, verse, valeur: balance });
    }
  }
  return { points, total: balance, verse, interets: balance - verse };
}

function Field({
  label,
  value,
  onChange,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  suffix?: string;
}) {
  return (
    <label className="text-sm">
      <span className="mb-1 block text-slate-500 dark:text-slate-400">{label}</span>
      <div className="relative">
        <input
          className="input"
          type="number"
          step="any"
          min="0"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && (
          <span className="pointer-events-none absolute right-3 top-2 text-xs text-slate-400">
            {suffix}
          </span>
        )}
      </div>
    </label>
  );
}

export function LongTermModal({ onClose }: { onClose: () => void }) {
  const [capital, setCapital] = useState('1000');
  const [taux, setTaux] = useState('5');
  const [mensuel, setMensuel] = useState('150');
  const [annees, setAnnees] = useState('20');

  const sim = useMemo(
    () =>
      project(
        parseFloat(capital) || 0,
        parseFloat(taux) || 0,
        parseFloat(mensuel) || 0,
        Math.min(Math.max(parseInt(annees) || 0, 1), 60),
      ),
    [capital, taux, mensuel, annees],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="my-8 w-full max-w-3xl rounded-2xl border border-slate-200 bg-slate-50 p-6 shadow-2xl dark:border-slate-700 dark:bg-[#0d1017]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold">🔮 Vision long terme</h2>
          <button onClick={onClose} className="btn-ghost">
            Fermer ✕
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Field label="Capital de départ" value={capital} onChange={setCapital} suffix="€" />
          <Field label="Taux annuel" value={taux} onChange={setTaux} suffix="%" />
          <Field label="Versement mensuel" value={mensuel} onChange={setMensuel} suffix="€" />
          <Field label="Durée" value={annees} onChange={setAnnees} suffix="ans" />
        </div>

        {/* Récap */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          <div className="card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Capital final</p>
            <p className="mt-1 text-xl font-semibold text-brand">{formatEur(sim.total)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Total versé</p>
            <p className="mt-1 text-xl font-semibold">{formatEur(sim.verse)}</p>
          </div>
          <div className="card p-4">
            <p className="text-xs text-slate-500 dark:text-slate-400">Intérêts générés</p>
            <p className="mt-1 text-xl font-semibold text-emerald-500">
              {formatEur(sim.interets)}
            </p>
          </div>
        </div>

        {/* Graphique */}
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer>
            <AreaChart data={sim.points} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="gVal" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gVerse" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#94a3b8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#94a3b833" />
              <XAxis
                dataKey="annee"
                tickFormatter={(v) => `${v} an${v > 1 ? 's' : ''}`}
                fontSize={12}
                stroke="#94a3b8"
              />
              <YAxis
                tickFormatter={(v) => formatEur0(v)}
                width={70}
                fontSize={12}
                stroke="#94a3b8"
              />
              <Tooltip
                formatter={(v, name) => [
                  formatEur(Number(v)),
                  name === 'valeur' ? 'Valeur totale' : 'Total versé',
                ]}
                labelFormatter={(l) => `Année ${l}`}
                contentStyle={{
                  borderRadius: 12,
                  border: 'none',
                  background: '#0f172a',
                  color: '#fff',
                }}
              />
              <Area
                type="monotone"
                dataKey="verse"
                stroke="#94a3b8"
                fill="url(#gVerse)"
                strokeWidth={2}
              />
              <Area
                type="monotone"
                dataKey="valeur"
                stroke="#6366f1"
                fill="url(#gVal)"
                strokeWidth={2.5}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <p className="mt-3 text-center text-xs text-slate-400">
          Projection à intérêts composés (capitalisation mensuelle). Zone violette =
          valeur totale, zone grise = ce que tu as versé.
        </p>
      </div>
    </div>
  );
}
