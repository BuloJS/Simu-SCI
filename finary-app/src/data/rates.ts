/**
 * Taux de l'épargne réglementée française.
 * En vigueur depuis le 1er février 2026 (source : economie.gouv.fr).
 * Prochaine révision : 1er août 2026.
 */
export const LIVRET_PRESETS: { nom: string; taux: number; plafond?: number }[] = [
  { nom: 'Livret A', taux: 1.5, plafond: 22950 },
  { nom: 'LDDS', taux: 1.5, plafond: 12000 },
  { nom: 'LEP', taux: 2.5, plafond: 10000 },
  { nom: 'CEL', taux: 1.0, plafond: 15300 },
  { nom: 'PEL', taux: 2.0, plafond: 61200 },
  { nom: 'Livret Jeune', taux: 2.5, plafond: 1600 },
  { nom: 'Livret bancaire', taux: 0.5 },
  { nom: 'Compte à terme', taux: 3.0 },
  { nom: 'Autre', taux: 0 },
];

export const RATES_AS_OF = '1er février 2026';

/** Cryptos courantes avec leur id CoinGecko pour la récupération des cours. */
export const CRYPTO_PRESETS: { nom: string; coinId: string; symbol: string }[] = [
  { nom: 'Bitcoin', coinId: 'bitcoin', symbol: 'BTC' },
  { nom: 'Ethereum', coinId: 'ethereum', symbol: 'ETH' },
  { nom: 'Solana', coinId: 'solana', symbol: 'SOL' },
  { nom: 'BNB', coinId: 'binancecoin', symbol: 'BNB' },
  { nom: 'XRP', coinId: 'ripple', symbol: 'XRP' },
  { nom: 'Cardano', coinId: 'cardano', symbol: 'ADA' },
  { nom: 'Dogecoin', coinId: 'dogecoin', symbol: 'DOGE' },
  { nom: 'Polkadot', coinId: 'polkadot', symbol: 'DOT' },
  { nom: 'Avalanche', coinId: 'avalanche-2', symbol: 'AVAX' },
  { nom: 'Chainlink', coinId: 'chainlink', symbol: 'LINK' },
  { nom: 'Polygon', coinId: 'matic-network', symbol: 'POL' },
  { nom: 'Litecoin', coinId: 'litecoin', symbol: 'LTC' },
];
