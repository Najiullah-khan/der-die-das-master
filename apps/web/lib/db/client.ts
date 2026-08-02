import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import * as schema from "./schema";

// Same client shape for local dev and real Turso — only the env vars change.
// Unset TURSO_DATABASE_URL -> falls back to a local SQLite file, zero cloud setup required.
const url = process.env.TURSO_DATABASE_URL ?? "file:./local.db";
const authToken = process.env.TURSO_AUTH_TOKEN;

const client = createClient({ url, authToken });

export const db = drizzle(client, { schema });
