const { Pool } = require("pg")
const fs = require("fs").promises
const path = require("path")
require("dotenv").config()

// Database connection configuration
const pool = new Pool({
  user: process.env.DB_USER || "postgres",
  host: process.env.DB_HOST || "localhost",
  database: process.env.DB_NAME || "tender_management",
  password: process.env.DB_PASSWORD || "password",
  port: process.env.DB_PORT || 5432,
})

async function runMigration() {
  const client = await pool.connect()

  try {
    console.log("Starting database migration...")

    // Create migrations table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get list of applied migrations
    const { rows: appliedMigrations } = await client.query("SELECT name FROM migrations")
    const appliedMigrationNames = appliedMigrations.map((m) => m.name)

    // Read migration files
    const migrationsDir = path.join(__dirname, "..", "scripts")
    const files = await fs.readdir(migrationsDir)

    // Filter SQL files that start with numbers (migration files)
    const migrationFiles = files.filter((file) => file.endsWith(".sql") && /^\d+/.test(file)).sort() // Sort to ensure migrations run in order

    // Run migrations that haven't been applied yet
    for (const file of migrationFiles) {
      if (!appliedMigrationNames.includes(file)) {
        console.log(`Applying migration: ${file}`)

        // Read and execute migration file
        const filePath = path.join(migrationsDir, file)
        const sql = await fs.readFile(filePath, "utf8")

        await client.query("BEGIN")

        try {
          await client.query(sql)
          await client.query("INSERT INTO migrations (name) VALUES ($1)", [file])
          await client.query("COMMIT")
          console.log(`Migration ${file} applied successfully`)
        } catch (error) {
          await client.query("ROLLBACK")
          console.error(`Error applying migration ${file}:`, error)
          throw error
        }
      } else {
        console.log(`Migration ${file} already applied, skipping`)
      }
    }

    console.log("Database migration completed successfully")
  } catch (error) {
    console.error("Migration failed:", error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run migration
runMigration()
