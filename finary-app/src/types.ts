export type Category = 'livret' | 'cto' | 'crypto';

/** Livret / épargne réglementée ou bancaire */
export interface Livret {
  id: string;
  nom: string; // ex: "Livret A"
  banque: string;
  montant: number; // solde en €
  taux: number; // taux annuel en %
}

/** Ligne d'un Compte-Titres Ordinaire (actions / ETF) */
export interface CtoLine {
  id: string;
  nom: string; // ex: "MSCI World ETF"
  ticker: string; // ex: "CW8"
  devise: string; // devise de cotation, ex: "USD", "EUR"
  bourse: string; // place de cotation, ex: "NASDAQ", "XPAR"
  quantite: number;
  pru: number; // prix de revient unitaire en €
  cours: number; // cours actuel en € (auto via API ou manuel)
}

/** Ligne crypto */
export interface CryptoLine {
  id: string;
  nom: string; // ex: "Bitcoin"
  coinId: string; // id CoinGecko, ex: "bitcoin"
  symbol: string; // ex: "BTC"
  quantite: number;
  pru: number; // prix de revient unitaire en €
  cours: number; // cours actuel en € (auto via API ou manuel)
}

/** Ligne de budget (revenu ou dépense mensuelle) */
export interface BudgetLine {
  id: string;
  label: string;
  type: 'revenu' | 'depense';
  montant: number; // € / mois
}

export interface Portfolio {
  livrets: Livret[];
  cto: CtoLine[];
  crypto: CryptoLine[];
  budget: BudgetLine[];
}

export const emptyPortfolio: Portfolio = {
  livrets: [],
  cto: [],
  crypto: [],
  budget: [],
};
