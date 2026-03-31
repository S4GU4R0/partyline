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
  verification_tier: "official" | "community" | "unverified";
  external_codes: Record<string, string[]>; // { airs: ["BH-1800.1500"], ein: ["12-3456789"] }
  source_attribution: string; // where we got this
}

export interface SearchFilters {
  category?: string;
  location?: string;
  verification?: string; // comma-separated, filter-only never blocks
  has_external_code?: string; // check if external_codes has this key
  source?: string; // source_attribution substring match
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
