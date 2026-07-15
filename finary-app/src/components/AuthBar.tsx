import { useState } from 'react';

export function AuthBar({
  email,
  syncing,
  onSignIn,
  onSignUp,
  onSignOut,
}: {
  email: string | null;
  syncing: boolean;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignUp: (email: string, password: string) => Promise<{ needsConfirmation: boolean }>;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [mail, setMail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const run = async (mode: 'in' | 'up') => {
    if (!mail.trim() || !password) return;
    setBusy(true);
    setMsg(null);
    try {
      if (mode === 'in') {
        await onSignIn(mail.trim(), password);
      } else {
        const { needsConfirmation } = await onSignUp(mail.trim(), password);
        if (needsConfirmation) {
          setMsg({ type: 'ok', text: 'Compte créé — confirme via l’email reçu, puis connecte-toi.' });
          return;
        }
      }
      setOpen(false);
      setPassword('');
    } catch (e) {
      setMsg({ type: 'err', text: e instanceof Error ? e.message : 'Erreur' });
    } finally {
      setBusy(false);
    }
  };

  if (email) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">
          {syncing ? '⟳ Synchro…' : '☁ Synchronisé'}
        </span>
        <button onClick={onSignOut} className="btn-ghost">
          Déconnexion
        </button>
      </div>
    );
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-primary">
        Se connecter
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-2 rounded-xl border border-slate-200 bg-white p-3 shadow-lg dark:border-slate-700 dark:bg-slate-900">
      <input
        className="input"
        type="email"
        placeholder="email"
        autoComplete="username"
        value={mail}
        onChange={(e) => setMail(e.target.value)}
      />
      <input
        className="input"
        type="password"
        placeholder="mot de passe"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && run('in')}
      />
      <div className="flex gap-2">
        <button className="btn-primary flex-1" disabled={busy} onClick={() => run('in')}>
          Se connecter
        </button>
        <button className="btn-ghost flex-1" disabled={busy} onClick={() => run('up')}>
          Créer un compte
        </button>
      </div>
      {msg && (
        <p className={`text-xs ${msg.type === 'ok' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {msg.text}
        </p>
      )}
    </div>
  );
}
