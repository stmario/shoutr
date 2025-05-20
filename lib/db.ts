import { neon } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-http"
import * as schema from "./schema"

// Create a SQL client with the Neon connection
const sql = neon(process.env.DATABASE_URL!)

// Create a Drizzle client with the SQL client and schema
export const db = drizzle(sql, { schema })

// Helper function to execute raw SQL queries
export async function executeQuery(queryText: string, params: any[] = []) {
  try {
    // For parameterized queries, we need to use a different approach with neon
    // First, replace $1, $2, etc. with ? for the neon client
    const preparedQuery = queryText

    // Execute the query with parameters
    const result = await sql.query(preparedQuery, params)

    // Return the rows
    return result.rows || []
  } catch (error) {
    console.error("Database query error:", error)
    throw error
  }
}
