import { NextResponse } from "next/server";
import {
  APP_NAME,
  APP_VERSION,
  APP_FRAMEWORK,
  APP_DATABASE,
  APP_ORM,
  APP_TEMPLATE,
} from "@/lib/constants";
import type { ApiInfo, EndpointInfo, EnvVarInfo } from "@/lib/types";

const ENDPOINTS: EndpointInfo[] = [
  { method: "GET", path: "/api/info", description: "Application info & endpoint list" },
  { method: "GET", path: "/api/bugs", description: "List bugs with filters (status, priority, platform, stage, search, labelId, page, pageSize)" },
  { method: "POST", path: "/api/bugs", description: "Create a new bug report (accepts raw template in `overview` for auto-parsing)" },
  { method: "GET", path: "/api/bugs/[id]", description: "Get a single bug by ID" },
  { method: "PUT", path: "/api/bugs/[id]", description: "Update a bug (partial update supported)" },
  { method: "DELETE", path: "/api/bugs/[id]", description: "Delete a bug" },
  { method: "GET", path: "/api/bugs/stats", description: "Dashboard statistics (counts, by status/priority/stage, recent bugs)" },
  { method: "GET", path: "/api/labels", description: "List all labels" },
  { method: "POST", path: "/api/labels", description: "Create a new label" },
  { method: "PUT", path: "/api/labels/[id]", description: "Update a label" },
  { method: "DELETE", path: "/api/labels/[id]", description: "Delete a label" },
];

const ENV_VARS: EnvVarInfo[] = [
  { name: "DATABASE_URL", description: "SQLite database file path (file:/path/to/db)", required: true },
];

export async function GET() {
  const info: ApiInfo = {
    name: APP_NAME,
    version: APP_VERSION,
    framework: APP_FRAMEWORK,
    database: APP_DATABASE,
    orm: APP_ORM,
    template: APP_TEMPLATE,
    endpoints: ENDPOINTS,
    envVars: ENV_VARS,
  };
  return NextResponse.json(info);
}
