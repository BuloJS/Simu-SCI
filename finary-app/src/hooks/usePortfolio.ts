import { useCallback, useEffect, useState } from 'react';
import { emptyPortfolio, type Portfolio } from '../types';

const KEY = 'finary-portfolio-v1';

function load(): Portfolio {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyPortfolio;
    return { ...emptyPortfolio, ...(JSON.parse(raw) as Portfolio) };
  } catch {
    return emptyPortfolio;
  }
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio>(load);

  useEffect(() => {
    localStorage.setItem(KEY, JSON.stringify(portfolio));
  }, [portfolio]);

  const update = useCallback(
    <K extends keyof Portfolio>(key: K, value: Portfolio[K]) =>
      setPortfolio((p) => ({ ...p, [key]: value })),
    [],
  );

  return { portfolio, setPortfolio, update };
}
