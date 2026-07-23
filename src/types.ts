export interface Card {
  name: string;
  price: number;
  priceText: string;
}

export interface AnalysisResult {
  appId: string;
  gameName: string;
  gamePrice: number;
  currency: string;
  hasCards: boolean;
  numCards?: number;
  cardsDropped?: number;
  lowestCardPrice?: number;
  expectedDropValueGross?: number;
  expectedDropValueNet?: number;
  isProfitable?: boolean;
  cards?: Card[];
  error?: string;
}
