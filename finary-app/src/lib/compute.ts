import type { Portfolio } from '../types';

export interface Totals {
  total: number;
  livretTotal: number;
  ctoTotal: number;
  cryptoTotal: number;
  /** Revenus passifs annuels générés par les livrets (€) */
  revenusPassifs: number;
  /** Plus/moins-value latente CTO + crypto (€) */
  plusValue: number;
  /** Montant investi sur CTO + crypto (€) */
  investi: number;
  /** Taux de rendement moyen pondéré des livrets (%) */
  tauxMoyenLivrets: number;
}

export function computeTotals(p: Portfolio): Totals {
  const livretTotal = p.livrets.reduce((s, l) => s + (l.montant || 0), 0);
  const revenusPassifs = p.livrets.reduce(
    (s, l) => s + (l.montant || 0) * (l.taux || 0) / 100,
    0,
  );

  const ctoTotal = p.cto.reduce((s, c) => s + c.quantite * c.cours, 0);
  const ctoInvesti = p.cto.reduce((s, c) => s + c.quantite * c.pru, 0);

  const cryptoTotal = p.crypto.reduce((s, c) => s + c.quantite * c.cours, 0);
  const cryptoInvesti = p.crypto.reduce((s, c) => s + c.quantite * c.pru, 0);

  const investi = ctoInvesti + cryptoInvesti;
  const plusValue = ctoTotal - ctoInvesti + (cryptoTotal - cryptoInvesti);

  return {
    total: livretTotal + ctoTotal + cryptoTotal,
    livretTotal,
    ctoTotal,
    cryptoTotal,
    revenusPassifs,
    plusValue,
    investi,
    tauxMoyenLivrets: livretTotal > 0 ? (revenusPassifs / livretTotal) * 100 : 0,
  };
}
