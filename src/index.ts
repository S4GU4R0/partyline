import { createServer, IncomingMessage, ServerResponse } from "http";
import { initDb } from "./resources/db.js";
import { CONFIG } from "./config.js";
import { searchResources } from "./tools/search.js";
import { checkEligibility } from "./tools/check_eligibility.js";
import { assessRisk } from "./tools/assess_risk.js";
import { Resource, ResourceMatch, RiskAssessment } from "./resources/types.js";

// HTTP server for phone-first users - simple REST endpoints

async function parseBody(req: IncomingMessage): Promise<any> {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", (chunk) => (body += chunk));
    req.on("end", () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch {
        resolve({});
      }
    });
    req.on("error", reject);
  });
}

function jsonResponse(res: ServerResponse, status: number, data: any) {
  res.writeHead(status, { "Content-Type": "application/json" });
  res.end(JSON.stringify(data, null, 2));
}

const server = createServer(async (req, res) => {
  const url = req.url || "/";
  const method = req.method || "GET";

  // CORS for local development
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }

  try {
    // GET / - health check / info
    if (url === "/" && method === "GET") {
      jsonResponse(res, 200, {
        name: "partyline",
        version: "0.1.0",
        message: "we gotchu fam 🤙",
        endpoints: [
          "GET  /tools/search_resources?category=safety&location=seattle&verification=community&has_external_code=airs&source=arizona",
          "GET  /tools/check_eligibility?barriers=undocumented,unhoused",
          "GET  /tools/assess_risk/:id",
          "POST /tools/search_resources",
          "POST /tools/check_eligibility",
          "POST /tools/assess_risk",
        ],
        docs: "verification tier = data lineage, not quality. Never blocks results."
      });
      return;
    }

    // search_resources
    if (url.startsWith("/tools/search_resources")) {
      if (method === "GET") {
        const params = new URL(url, `http://${CONFIG.host}:${CONFIG.port}`).searchParams;
        const category = params.get("category") || undefined;
        const location = params.get("location") || undefined;
        const verification = params.get("verification") || undefined;
        const has_external_code = params.get("has_external_code") || undefined;
        const source = params.get("source") || undefined;
        
        const resources: Resource[] = await searchResources(category, location, verification, has_external_code, source);
        jsonResponse(res, 200, { 
          tool: "search_resources",
          filters: { category, location, verification, has_external_code, source },
          count: resources.length,
          data: resources 
        });
      } else if (method === "POST") {
        const body = await parseBody(req);
        const resources: Resource[] = await searchResources(
          body.category,
          body.location,
          body.verification,
          body.has_external_code,
          body.source
        );
        jsonResponse(res, 200, { 
          tool: "search_resources",
          filters: { 
            category: body.category, 
            location: body.location,
            verification: body.verification,
            has_external_code: body.has_external_code,
            source: body.source
          },
          count: resources.length,
          data: resources 
        });
      }
      return;
    }

    // check_eligibility
    if (url.startsWith("/tools/check_eligibility")) {
      if (method === "GET") {
        const params = new URL(url, `http://${CONFIG.host}:${CONFIG.port}`).searchParams;
        const barriersParam = params.get("barriers");
        const barriers = barriersParam ? barriersParam.split(",") : [];
        
        const matches: ResourceMatch[] = await checkEligibility(barriers);
        jsonResponse(res, 200, { 
          tool: "check_eligibility",
          barriers,
          count: matches.length,
          data: matches 
        });
      } else if (method === "POST") {
        const body = await parseBody(req);
        const barriers: string[] = body.barriers || [];
        const matches: ResourceMatch[] = await checkEligibility(barriers);
        jsonResponse(res, 200, { 
          tool: "check_eligibility",
          barriers,
          count: matches.length,
          data: matches 
        });
      }
      return;
    }

    // assess_risk
    if (url.startsWith("/tools/assess_risk")) {
      let resourceId: number | null = null;
      
      if (method === "GET") {
        const match = url.match(/\/tools\/assess_risk\/(\d+)/);
        resourceId = match ? parseInt(match[1], 10) : null;
        
        if (!resourceId) {
          const params = new URL(url, `http://${CONFIG.host}:${CONFIG.port}`).searchParams;
          resourceId = params.get("id") ? parseInt(params.get("id")!, 10) : null;
        }
      } else if (method === "POST") {
        const body = await parseBody(req);
        resourceId = body.id || body.resource_id || null;
      }
      
      if (!resourceId || isNaN(resourceId)) {
        jsonResponse(res, 400, { error: "need resource id 🤙" });
        return;
      }
      
      try {
        const assessment: RiskAssessment = await assessRisk(resourceId);
        jsonResponse(res, 200, { 
          tool: "assess_risk",
          resource_id: resourceId,
          data: assessment 
        });
      } catch (err) {
        jsonResponse(res, 404, { error: "couldn't find that one" });
      }
      return;
    }

    // 404
    jsonResponse(res, 404, { error: "don't know that one 🤙" });
  } catch (err) {
    console.error("line's busy rn:", err);
    jsonResponse(res, 500, { error: "line's busy rn, try again later" });
  }
});

async function main() {
  console.log("starting partyline...");
  await initDb();
  
  server.listen(CONFIG.port, CONFIG.host, () => {
    console.log(`partyline running on http://${CONFIG.host}:${CONFIG.port}`);
    console.log("we gotchu fam 🤙");
  });
}

main().catch((error) => {
  console.error("server crashed:", error);
  process.exit(1);
});
