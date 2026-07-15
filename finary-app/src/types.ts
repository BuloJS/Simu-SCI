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

/** Carte Pokémon de la collection */
export interface PokemonCard {
  id: string;
  cardId?: string; // id pokemontcg.io
  name: string;
  set: string; // extension
  number: string; // ex: "1/104"
  image?: string;
  price: number; // valeur marché de référence en € (état Near Mint)
  prices?: { avg30?: number; avg7?: number; avg1?: number; trend?: number };
  url?: string; // lien Cardmarket
  condition?: string; // état de la carte (M, NM, EX, GD, LP, PL, PO)
  source?: string; // provenance du prix : "Cardmarket" ou "TCGplayer"
}

export interface Portfolio {
  livrets: Livret[];
  cto: CtoLine[];
  crypto: CryptoLine[];
  budget: BudgetLine[];
  pokemon: PokemonCard[];
}

export const emptyPortfolio: Portfolio = {
  livrets: [],
  cto: [],
  crypto: [],
  budget: [],
  pokemon: [],
};
