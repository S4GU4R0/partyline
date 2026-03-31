import sqlite3 from "sqlite3";
import { getDb } from "../resources/db.js";
import { RiskAssessment } from "../resources/types.js";

// Return risk level + notes from DB
export function assessRisk(resourceId: number): Promise<RiskAssessment> {
  return new Promise((resolve, reject) => {
    const db = getDb();
    
    db.get(
      "SELECT risk_level, risk_notes FROM resources WHERE id = ?",
      [resourceId],
      (err, row: { risk_level: string; risk_notes: string }) => {
        if (err) {
          console.error("line's busy rn, try again later", err);
          reject(err);
          return;
        }
        
        if (!row) {
          reject(new Error("resource not found"));
          return;
        }
        
        resolve({
          level: row.risk_level as "none" | "low" | "med" | "high",
          notes: row.risk_notes,
        });
      }
    );
  });
}
