import { useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { formatEur, formatPct, uid } from '../lib/format';
import type { BudgetLine } from '../types';

const PALETTE = [
  '#ef4444', '#f59e0b', '#ec4899', '#a855f7',
  '#06b6d4', '#14b8a6', '#3b82f6', '#eab308',
];

const COMMON = ['Salaire', 'Loyer', 'Charges', 'Factures', 'Investissement',
  'Courses', 'Transport', 'Abonnements', 'Loisirs', 'Épargne'];

const BASE: Omit<BudgetLine, 'id'>[] = [
  { label: 'Salaire', type: 'revenu', montant: 0 },
  { label: 'Loyer', type: 'depense', montant: 0 },
  { label: 'Charges', type: 'depense', montant: 0 },
  { label: 'Factures', type: 'depense', montant: 0 },
  { label: 'Investissement', type: 'depense', montant: 0 },
];

export function BudgetTab({
  items,
  onChange,
}: {
  items: BudgetLine[];
  onChange: (items: BudgetLine[]) => void;
}) {
  const [label, setLabel] = useState('');
  const [type, setType] = useState<'revenu' | 'depense'>('depense');
  const [montant, setMontant] = useState('');

  const add = (e: React.FormEvent) => {
    e.preventDefault();
    const m = parseFloat(montant);
    if (!label.trim() || !Number.isFinite(m)) return;
    onChange([...items, { id: uid(), label: label.trim(), type, montant: m }]);
    setLabel('');
    setMontant('');
  };

  const setMontantFor = (id: string, v: number) =>
    onChange(items.map((l) => (l.id === id ? { ...l, montant: v } : l)));
  const remove = (id: string) => onChange(items.filter((l) => l.id !== id));
  const seed = () => onChange(BASE.map((b) => ({ ...b, id: uid() })));

  const revenus = items.filter((l) => l.type === 'revenu');
  const depenses = items.filter((l) => l.type === 'depense');
  const totalRev = revenus.reduce((s, l) => s + l.montant, 0);
  const totalDep = depenses.reduce((s, l) => s + l.montant, 0);
  const reste = totalRev - totalDep;

  const donut = depenses.filter((l) => l.montant > 0);

  const List = ({ lines, titre }: { lines: BudgetLine[]; titre: string }) => (
    <div className="card p-0">
      <div className="border-b border-slate-200 px-4 py-3 text-sm font-medium dark:border-slate-800">
        {titre}
      </div>
      {lines.length === 0 ? (
        <p className="px-4 py-4 text-sm text-slate-400">Aucune ligne.</p>
      ) : (
        <ul>
          {lines.map((l) => (
            <li
              key={l.id}
              className="flex items-center gap-2 border-b border-slate-100 px-4 py-2 last:border-0 dark:border-slate-800/60"
            >
              <span className="flex-1 text-sm">{l.label}</span>
              <input
                className="input w-28 py-1 text-right"
                type="number"
                step="any"
                value={l.montant}
                onChange={(e) => setMontantFor(l.id, parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-slate-400">€</span>
              <button
                onClick={() => remove(l.id)}
                className="text-slate-400 hover:text-rose-500"
                aria-label="Supprimer"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Récap */}
      <div className="grid grid-cols-3 gap-3">
        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Revenus</p>
          <p className="mt-1 text-xl font-semibold text-emerald-500">{formatEur(totalRev)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Dépenses</p>
          <p className="mt-1 text-xl font-semibold text-rose-500">{formatEur(totalDep)}</p>
        </div>
        <div className="card p-4">
          <p className="text-xs text-slate-500 dark:text-slate-400">Reste pour vivre</p>
          <p className={`mt-1 text-xl font-semibold ${reste >= 0 ? 'text-brand' : 'text-rose-500'}`}>
            {formatEur(reste)}
          </p>
          {totalRev > 0 && (
            <p className="text-xs text-slate-400">{formatPct(reste / totalRev)} des revenus</p>
          )}
        </div>
      </div>

      {/* Ajout */}
      <form onSubmit={add} className="card grid grid-cols-2 gap-3 lg:grid-cols-4 lg:items-end">
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Poste</span>
          <input
            className="input"
            list="budget-common"
            placeholder="Loyer, Salaire…"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <datalist id="budget-common">
            {COMMON.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Type</span>
          <select
            className="input"
            value={type}
            onChange={(e) => setType(e.target.value as 'revenu' | 'depense')}
          >
            <option value="revenu">Revenu</option>
            <option value="depense">Dépense</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-500 dark:text-slate-400">Montant (€/mois)</span>
          <input
            className="input"
            type="number"
            step="any"
            value={montant}
            onChange={(e) => setMontant(e.target.value)}
          />
        </label>
        <button type="submit" className="btn-primary h-[38px]">
          + Ajouter
        </button>
      </form>

      {items.length === 0 && (
        <div className="text-center">
          <button onClick={seed} className="btn-ghost">
            Ajouter les postes de base (salaire, loyer, charges, factures, investissement)
          </button>
        </div>
      )}

      {/* Listes + graphe */}
      <div className="grid gap-4 lg:grid-cols-2">
        <List lines={revenus} titre="Revenus" />
        <List lines={depenses} titre="Dépenses" />
      </div>

      {donut.length > 0 && (
        <div className="card">
          <p className="mb-2 text-sm font-medium text-slate-500 dark:text-slate-400">
            Répartition des dépenses
          </p>
          <div className="flex flex-col items-center gap-4 sm:flex-row">
            <div className="h-40 w-40 shrink-0">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={donut} dataKey="montant" nameKey="label" innerRadius={45} outerRadius={70} paddingAngle={2} stroke="none">
                    {donut.map((d, i) => (
                      <Cell key={d.id} fill={PALETTE[i % PALETTE.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v) => formatEur(Number(v))}
                    contentStyle={{ borderRadius: 10, border: 'none', background: '#0f172a', color: '#fff', fontSize: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="grid grid-cols-2 gap-x-6 gap-y-1 text-sm">
              {donut.map((d, i) => (
                <li key={d.id} className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: PALETTE[i % PALETTE.length] }} />
                  <span className="flex-1 text-slate-600 dark:text-slate-300">{d.label}</span>
                  <span className="text-slate-400">{formatPct(d.montant / totalDep)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
