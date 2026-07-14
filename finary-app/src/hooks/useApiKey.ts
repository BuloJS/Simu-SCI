import { useCallback, useEffect, useState } from 'react';

const KEY = 'finary-twelvedata-key';

/** Clé API Twelve Data, saisie par l'utilisateur et gardée dans son navigateur. */
export function useApiKey() {
  const [apiKey, setApiKeyState] = useState<string>(
    () => localStorage.getItem(KEY) ?? '',
  );

  useEffect(() => {
    if (apiKey) localStorage.setItem(KEY, apiKey);
    else localStorage.removeItem(KEY);
  }, [apiKey]);

  const setApiKey = useCallback((k: string) => setApiKeyState(k.trim()), []);

  return { apiKey, setApiKey, hasKey: apiKey.length > 0 };
}
