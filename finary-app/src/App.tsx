import { useMemo, useRef, useState } from 'react';
import { AllocationDonut } from './components/AllocationDonut';
import { AuthBar } from './components/AuthBar';
import { CryptoTab } from './components/CryptoTab';
import { CtoTab } from './components/CtoTab';
import { LivretTab } from './components/LivretTab';
import { SummaryCards } from './components/SummaryCards';
import { useApiKey } from './hooks/useApiKey';
import { useAuth } from './hooks/useAuth';
import { useDarkMode } from './hooks/useDarkMode';
import { usePortfolio } from './hooks/usePortfolio';
import { computeTotals } from './lib/compute';
import { formatEur } from './lib/format';
import { emptyPortfolio, type Category, type Portfolio } from './types';

const TABS: { key: Category; label: string; emoji: string }[] = [
  { key: 'livret', label: 'Livrets', emoji: '🏦' },
  { key: 'cto', label: 'CTO', emoji: '📈' },
  { key: 'crypto', label: 'Crypto', emoji: '₿' },
];

export default function App() {
  const { user, userId, signIn, signOut } = useAuth();
  const { portfolio, setPortfolio, update, syncing } = usePortfolio(userId);
  const { dark, toggle } = useDarkMode();
  const { apiKey, setApiKey } = useApiKey();
  const [tab, setTab] = useState<Category>('livret');
  const fileRef = useRef<HTMLInputElement>(null);

  const totals = useMemo(() => computeTotals(portfolio), [portfolio]);

  const count = {
    livret: portfolio.livrets.length,
    cto: portfolio.cto.length,
    crypto: portfolio.crypto.length,
  };

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(portfolio, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `patrimoine-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const data = JSON.parse(String(reader.result)) as Partial<Portfolio>;
        setPortfolio({ ...emptyPortfolio, ...data });
      } catch {
        alert('Fichier JSON invalide.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-slate-200 bg-white/70 backdrop-blur dark:border-slate-800 dark:bg-surface-dark/70">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              <span className="text-brand">◆</span> Patrimoine
            </h1>
            <p className="text-xs text-slate-400">
              Total : {formatEur(totals.total)}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AuthBar
              email={user?.email ?? null}
              syncing={syncing}
              onSignIn={signIn}
              onSignOut={signOut}
            />
            <button onClick={exportJson} className="btn-ghost" title="Sauvegarder">
              ⬇ Export
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-ghost"
              title="Importer une sauvegarde"
            >
              ⬆ Import
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={importJson}
            />
            <button onClick={toggle} className="btn-ghost" aria-label="Thème">
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
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
              <CtoTab
                items={portfolio.cto}
                onChange={(v) => update('cto', v)}
                apiKey={apiKey}
                setApiKey={setApiKey}
              />
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
          Données enregistrées localement (export/import JSON) · Cours crypto :
          CoinGecko · Cours actions/ETF : Twelve Data · Taux réglementés au 1er
          février 2026
        </footer>
      </main>
    </div>
  );
}
