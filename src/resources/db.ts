import sqlite3 from "sqlite3";
import { CONFIG } from "../config.js";

let db: sqlite3.Database | null = null;

export function getDb(): sqlite3.Database {
  if (!db) {
    db = new sqlite3.Database(CONFIG.dbPath, (err) => {
      if (err) {
        console.error("line's busy rn, try again later", err);
      } else {
        console.log("got you covered 🤙 - db connected");
      }
    });
  }
  return db;
}

export function initDb(): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    const schema = `
      CREATE TABLE IF NOT EXISTS resources (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        location TEXT,
        requirements TEXT,
        accommodates TEXT,
        off_label_uses TEXT,
        risk_level TEXT,
        risk_notes TEXT,
        contact_info TEXT,
        is_211_alternative BOOLEAN
      )
    `;
    
    database.run(schema, (err) => {
      if (err) {
        console.error("line's busy rn, try again later", err);
        reject(err);
      } else {
        loadSampleData().then(resolve).catch(reject);
      }
    });
  });
}

function loadSampleData(): Promise<void> {
  return new Promise((resolve, reject) => {
    const database = getDb();
    
    // Check if we already have data
    database.get("SELECT COUNT(*) as count FROM resources", (err, row: { count: number }) => {
      if (err) {
        reject(err);
        return;
      }
      
      if (row.count > 0) {
        console.log("data already loaded, skipping");
        resolve();
        return;
      }
      
      const samples = [
        {
          id: 1,
          name: "Trans Safety Emergency Fund (TSEF)",
          category: "safety",
          location: "Switzerland (international)",
          requirements: JSON.stringify(["Monthly window: 1st-3rd only", "Zoom interview", "Verification required", "Follow-up report"]),
          accommodates: JSON.stringify(["undocumented", "no_bank_account", "unhoused"]),
          off_label_uses: JSON.stringify(["Emergency relocation from hostile states", "Gap funding during asylum denial", "Bridge money when local orgs have waiting lists"]),
          risk_level: "low",
          risk_notes: "App window is TIGHT (72 hours monthly). Plan ahead. They support Kakuma Refugee Camp and Kampala specifically.",
          contact_info: "transsafety.fund/get-help/",
          is_211_alternative: 1
        },
        {
          id: 2,
          name: "Four Thieves Vinegar Collective",
          category: "medical",
          location: "worldwide",
          requirements: JSON.stringify(["Technical skill varies", "Hardware/electronics access", "Chemical reagents for some projects"]),
          accommodates: JSON.stringify(["undocumented", "unhoused", "disability_accommodation_needed", "no_bank_account"]),
          off_label_uses: JSON.stringify(["DIY HRT when gatekept", "DIY abortion (miso cards)", "Vyvanse synthesis during shortages", "EpiPencil when uninsured", "Tooth Seal when dental unaffordable"]),
          risk_level: "high",
          risk_notes: "Legal gray zone. Start with low-risk (Tooth Seal) before synthesis. Warrant canary active. Onion site available.",
          contact_info: "fourthievesvinegar.org | .onion: ga5wrpojaen4lhedpp2ccbps2gzdt5kxtyvqwr364jji53oqjbsbdvyd.onion",
          is_211_alternative: 1
        },
        {
          id: 3,
          name: "FreeSewing",
          category: "clothing",
          location: "worldwide",
          requirements: JSON.stringify(["Measurements", "Printer", "Sewing machine or hand supplies", "Fabric"]),
          accommodates: JSON.stringify(["undocumented", "no_bank_account", "disability_accommodation_needed", "no_internet_reliable"]),
          off_label_uses: JSON.stringify(["Clothes for transitioning bodies", "Gender-affirming garments without boutique markup", "Adaptive clothing for disabled bodies", "Income generation via pattern skills"]),
          risk_level: "none",
          risk_notes: "Industry sizing is lies. No company, no staff, no ads, no tracking, no AI training on your data.",
          contact_info: "freesewing.org",
          is_211_alternative: 1
        }
      ];
      
      const stmt = database.prepare(`
        INSERT INTO resources (id, name, category, location, requirements, accommodates, off_label_uses, risk_level, risk_notes, contact_info, is_211_alternative)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      
      let completed = 0;
      for (const sample of samples) {
        stmt.run(
          sample.id,
          sample.name,
          sample.category,
          sample.location,
          sample.requirements,
          sample.accommodates,
          sample.off_label_uses,
          sample.risk_level,
          sample.risk_notes,
          sample.contact_info,
          sample.is_211_alternative,
          (err: Error | null) => {
            if (err) {
              console.error("failed to insert:", sample.name, err);
            }
            completed++;
            if (completed === samples.length) {
              console.log("loaded 3 samples");
              resolve();
            }
          }
        );
      }
      stmt.finalize();
    });
  });
}
