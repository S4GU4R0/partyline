import sqlite3 from "sqlite3";
import { getDb } from "../resources/db.js";
import { Resource } from "../resources/types.js";

// finds you spots that won't waste your time
export function searchResources(
  category?: string,
  location?: string,
  verification?: string,
  has_external_code?: string,
  source?: string
): Promise<Resource[]> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    let query = "SELECT * FROM resources WHERE 1=1";
    const params: (string | number)[] = [];
    
    if (category) {
      query += " AND category = ?";
      params.push(category);
    }
    
    if (location) {
      query += " AND (location = ? OR location = 'worldwide' OR location = 'nationwide')";
      params.push(location);
    }
    
    // verification filter - never blocks, just filters IN
    if (verification) {
      const tiers = verification.split(',').map(t => t.trim()).filter(t => t);
      if (tiers.length > 0) {
        const placeholders = tiers.map(() => '?').join(',');
        query += ` AND verification_tier IN (${placeholders})`;
        params.push(...tiers);
      }
    }
    
    // has_external_code filter - checks if JSON has this key
    if (has_external_code) {
      query += " AND json_type(external_codes, ?) IS NOT NULL";
      params.push(`$.${has_external_code}`);
    }
    
    // source attribution substring match
    if (source) {
      query += " AND source_attribution LIKE ?";
      params.push(`%${source}%`);
    }
    
    query += " ORDER BY is_211_alternative DESC, name ASC";
    
    db.all(query, params, (err, rows: sqlite3.RunResult[]) => {
      if (err) {
        console.error("line's busy rn, try again later", err);
        reject(err);
        return;
      }
      
      const resources: Resource[] = (rows || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        category: row.category,
        location: row.location,
        requirements: JSON.parse(row.requirements || "[]"),
        accommodates: JSON.parse(row.accommodates || "[]"),
        off_label_uses: JSON.parse(row.off_label_uses || "[]"),
        risk_level: row.risk_level,
        risk_notes: row.risk_notes,
        contact_info: row.contact_info,
        is_211_alternative: Boolean(row.is_211_alternative),
        verification_tier: row.verification_tier || 'unverified',
        external_codes: JSON.parse(row.external_codes || "{}"),
        source_attribution: row.source_attribution || ''
      }));
      
      console.log(`found ${resources.length} spots`);
      resolve(resources);
    });
  });
}
