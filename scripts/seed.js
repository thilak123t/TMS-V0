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

async function seedDatabase() {
  const client = await pool.connect()

  try {
    console.log("Starting database seeding...")

    // Check if seed tracking table exists, create if not
    await client.query(`
      CREATE TABLE IF NOT EXISTS seed_history (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        applied_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      )
    `)

    // Get list of applied seeds
    const { rows: appliedSeeds } = await client.query("SELECT name FROM seed_history")
    const appliedSeedNames = appliedSeeds.map((s) => s.name)

    // Read seed files
    const seedsDir = path.join(__dirname, "..", "scripts")
    const files = await fs.readdir(seedsDir)

    // Filter seed SQL files
    const seedFiles = files.filter((file) => file.endsWith(".sql") && file.includes("seed")).sort() // Sort to ensure seeds run in order

    // Run seeds that haven't been applied yet
    for (const file of seedFiles) {
      if (!appliedSeedNames.includes(file)) {
        console.log(`Applying seed: ${file}`)

        // Read and execute seed file
        const filePath = path.join(seedsDir, file)
        const sql = await fs.readFile(filePath, "utf8")

        await client.query("BEGIN")

        try {
          await client.query(sql)
          await client.query("INSERT INTO seed_history (name) VALUES ($1)", [file])
          await client.query("COMMIT")
          console.log(`Seed ${file} applied successfully`)
        } catch (error) {
          await client.query("ROLLBACK")
          console.error(`Error applying seed ${file}:`, error)
          throw error
        }
      } else {
        console.log(`Seed ${file} already applied, skipping`)
      }
    }

    console.log("Database seeding completed successfully")
  } catch (error) {
    console.error("Seeding failed:", error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

// Run seeding
seedDatabase()
