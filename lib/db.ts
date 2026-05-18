import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Create a SQL client with the Neon connection
const sql = neon(process.env.DATABASE_URL!)

// Create a Drizzle client with the SQL client and schema
export const db = drizzle(sql, { schema })

/**
 * Run a parameterized SQL query. Always pass user-controlled data via `params` ($1, $2, …).
 * Never concatenate untrusted strings into `queryText`.
 */
export async function executeQuery(queryText: string, params: unknown[] = []) {
  try {
    if (typeof queryText !== "string" || queryText.length === 0) {
      throw new TypeError("executeQuery: queryText must be a non-empty string")
    }
    if (!Array.isArray(params)) {
      throw new TypeError("executeQuery: params must be an array")
    }
    const result = await sql.query(queryText, params)
    // Neon HTTP driver: `query()` resolves to an array of row objects (not pg's { rows }).
    if (Array.isArray(result)) {
      return result
    }
    if (result && typeof result === "object" && Array.isArray((result as { rows?: unknown[] }).rows)) {
      return (result as { rows: unknown[] }).rows
    }
    return []
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
