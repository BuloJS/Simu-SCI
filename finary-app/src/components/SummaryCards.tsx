import type { Totals } from '../lib/compute';
import { formatEur, formatPct, formatRate } from '../lib/format';

function Stat({
  label,
  value,
  sub,
  tone = 'neutral',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'neutral' | 'up' | 'down';
}) {
  const toneClass =
    tone === 'up'
      ? 'text-emerald-500'
      : tone === 'down'
        ? 'text-rose-500'
        : 'text-slate-900 dark:text-white';
  return (
    <div className="card">
      <p className="text-sm text-slate-500 dark:text-slate-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold ${toneClass}`}>{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
    </div>
  );
}

export function SummaryCards({ t }: { t: Totals }) {
  const pvTone = t.plusValue > 0 ? 'up' : t.plusValue < 0 ? 'down' : 'neutral';
  const pvRatio = t.investi > 0 ? t.plusValue / t.investi : 0;

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      <Stat label="Patrimoine total" value={formatEur(t.total)} />
      <Stat
        label="Revenus passifs / an"
        value={formatEur(t.revenusPassifs)}
        sub={`Taux moyen livrets ${formatRate(t.tauxMoyenLivrets)}`}
        tone="up"
      />
      <Stat
        label="Plus-value latente"
        value={formatEur(t.plusValue)}
        sub={`${formatPct(pvRatio)} sur ${formatEur(t.investi)} investis`}
        tone={pvTone}
      />
      <Stat
        label="Investi (CTO + Crypto)"
        value={formatEur(t.ctoTotal + t.cryptoTotal)}
        sub={`Livrets ${formatEur(t.livretTotal)}`}
      />
    </div>
  );
}
