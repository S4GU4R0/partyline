// Strict TypeScript interfaces - no `any` allowed

export interface Resource {
  id: number;
  name: string;
  category: "safety" | "medical" | "clothing" | "food" | "housing" | "identity" | "labor";
  location: string;
  requirements: string[]; // what they SAY they need
  accommodates: string[]; // what they ACTUALLY handle
  off_label_uses: string[]; // what this can actually do
  risk_level: "none" | "low" | "med" | "high";
  risk_notes: string;
  contact_info: string;
  is_211_alternative: boolean;
}

export interface SearchFilters {
  category?: string;
  location?: string;
}

export interface BarrierCheckInput {
  barriers: string[];
}

export interface ResourceMatch {
  resource: Resource;
  matches: number;
  total_barriers: number;
  missing: string[];
}

export interface RiskAssessment {
  level: "none" | "low" | "med" | "high";
  notes: string;
}
