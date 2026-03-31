import sqlite3 from "sqlite3";
import { getDb } from "../resources/db.js";
import { Resource, ResourceMatch } from "../resources/types.js";
import { calculateBarrierMatch } from "../utils/filters.js";

// Barrier matching, not gatekeeping
export function checkEligibility(
  barriers: string[]
): Promise<ResourceMatch[]> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    const query = "SELECT * FROM resources ORDER BY is_211_alternative DESC";
    
    db.all(query, [], (err, rows: sqlite3.RunResult[]) => {
      if (err) {
        console.error("line's busy rn, try again later", err);
        reject(err);
        return;
      }
      
      const matches: ResourceMatch[] = (rows || []).map((row: any) => {
        const accommodates = JSON.parse(row.accommodates || "[]");
        const match = calculateBarrierMatch(barriers, accommodates);
        
        return {
          resource: {
            id: row.id,
            name: row.name,
            category: row.category,
            location: row.location,
            requirements: JSON.parse(row.requirements || "[]"),
            accommodates,
            off_label_uses: JSON.parse(row.off_label_uses || "[]"),
            risk_level: row.risk_level,
            risk_notes: row.risk_notes,
            contact_info: row.contact_info,
            is_211_alternative: Boolean(row.is_211_alternative),
          } as Resource,
          matches: match.score,
          total_barriers: barriers.length,
          missing: match.missing,
        };
      });
      
      // Sort: higher match score first, then by missing count (fewer missing = better)
      matches.sort((a, b) => {
        if (b.matches !== a.matches) return b.matches - a.matches;
        return a.missing.length - b.missing.length;
      });
      
      console.log(`found ${matches.length} options`);
      resolve(matches);
    });
  });
}
