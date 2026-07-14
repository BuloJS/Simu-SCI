import { useMemo, useState } from 'react';
import { AllocationDonut } from './components/AllocationDonut';
import { CryptoTab } from './components/CryptoTab';
import { CtoTab } from './components/CtoTab';
import { LivretTab } from './components/LivretTab';
import { SummaryCards } from './components/SummaryCards';
import { useDarkMode } from './hooks/useDarkMode';
import { usePortfolio } from './hooks/usePortfolio';
import { computeTotals } from './lib/compute';
import { formatEur } from './lib/format';
import type { Category } from './types';

const TABS: { key: Category; label: string; emoji: string }[] = [
  { key: 'livret', label: 'Livrets', emoji: '🏦' },
  { key: 'cto', label: 'CTO', emoji: '📈' },
  { key: 'crypto', label: 'Crypto', emoji: '₿' },
];

export default function App() {
  const { portfolio, update } = usePortfolio();
  const { dark, toggle } = useDarkMode();
  const [tab, setTab] = useState<Category>('livret');

  const totals = useMemo(() => computeTotals(portfolio), [portfolio]);

  const count = {
    livret: portfolio.livrets.length,
    cto: portfolio.cto.length,
    crypto: portfolio.crypto.length,
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-surface-dark/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-brand">◆</span> Patrimoine
            </h1>
            <p className="text-xs text-slate-400">
              Total : {formatEur(totals.total)}
            </p>
          </div>
          <button onClick={toggle} className="btn-ghost" aria-label="Thème">
            {dark ? '☀️ Clair' : '🌙 Sombre'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-6">
        <SummaryCards t={totals} />

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-1">
            <AllocationDonut t={totals} />
          </div>

          <div className="space-y-4 lg:col-span-2">
            <nav className="flex gap-2">
              {TABS.map((tItem) => (
                <button
                  key={tItem.key}
                  onClick={() => setTab(tItem.key)}
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition ${
                    tab === tItem.key
                      ? 'bg-brand text-white shadow'
                      : 'bg-white text-slate-600 hover:bg-slate-100 dark:bg-surface-dark dark:text-slate-300 dark:hover:bg-slate-800'
                  }`}
                >
                  {tItem.emoji} {tItem.label}
                  <span className="ml-1.5 opacity-60">{count[tItem.key]}</span>
                </button>
              ))}
            </nav>

            {tab === 'livret' && (
              <LivretTab
                items={portfolio.livrets}
                onChange={(v) => update('livrets', v)}
              />
            )}
            {tab === 'cto' && (
              <CtoTab items={portfolio.cto} onChange={(v) => update('cto', v)} />
            )}
            {tab === 'crypto' && (
              <CryptoTab
                items={portfolio.crypto}
                onChange={(v) => update('crypto', v)}
              />
            )}
          </div>
        </div>

        <footer className="pt-4 text-center text-xs text-slate-400">
          Données enregistrées localement dans votre navigateur · Cours crypto :
          CoinGecko · Taux réglementés au 1er février 2026
        </footer>
      </main>
    </div>
  );
}
