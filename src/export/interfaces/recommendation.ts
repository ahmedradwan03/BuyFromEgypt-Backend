export interface CustomerRecommendation {
  ProductID: string;
  Description: string;
  Category: string;
  UnitPrice: number;
  Score: number;
  RecommendationReason: string;
}

export interface BusinessProductRecommendation {
  ProductID: string;
  Description: string;
  Category: string;
  UnitPrice: number;
  Score: number;
  RecommendationReason: string;
}

export interface BusinessPartnerRecommendation {
  PartnerID: string;
  PartnerName: string;
  Industry: string;
  Location: string;
  Score: number;
  PartnershipReason: string;
}
