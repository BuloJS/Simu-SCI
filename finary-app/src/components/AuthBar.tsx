import { useState } from 'react';

export function AuthBar({
  email,
  syncing,
  onSignIn,
  onSignOut,
}: {
  email: string | null;
  syncing: boolean;
  onSignIn: (email: string) => Promise<void>;
  onSignOut: () => void;
}) {
  const [value, setValue] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    setStatus('sending');
    try {
      await onSignIn(value.trim());
      setStatus('sent');
      setMessage('Lien de connexion envoyé ! Vérifie ta boîte mail.');
    } catch (err) {
      setStatus('error');
      setMessage(err instanceof Error ? err.message : 'Erreur de connexion');
    }
  };

  if (email) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <span className="hidden text-slate-500 dark:text-slate-400 sm:inline">
          {syncing ? '⟳ Synchro…' : '☁ Synchronisé'} · {email}
        </span>
        <button onClick={onSignOut} className="btn-ghost">
          Déconnexion
        </button>
      </div>
    );
  }

  if (status === 'sent') {
    return <span className="text-sm text-emerald-500">{message}</span>;
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <input
        className="input w-44 sm:w-52"
        type="email"
        placeholder="ton@email.com"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      />
      <button type="submit" className="btn-primary shrink-0" disabled={status === 'sending'}>
        {status === 'sending' ? '…' : 'Se connecter'}
      </button>
      {status === 'error' && (
        <span className="hidden text-xs text-rose-500 md:inline">{message}</span>
      )}
    </form>
  );
}
