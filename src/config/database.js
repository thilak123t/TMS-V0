const { Pool } = require("pg")
const logger = require("../utils/logger")

// Create a new Pool instance with connection details from environment variables
const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
  // Maximum number of clients the pool should contain
  max: 20,
  // Maximum time in ms that a client can be idle before being closed
  idleTimeoutMillis: 30000,
  // Maximum time in ms that a client can take to connect before timing out
  connectionTimeoutMillis: 2000,
})

// Log pool errors
pool.on("error", (err) => {
  logger.error("Unexpected error on idle client", err)
  process.exit(-1)
})

// Simple query method
const query = async (text, params) => {
  const start = Date.now()
  try {
    const res = await pool.query(text, params)
    const duration = Date.now() - start

    // Log slow queries (over 100ms)
    if (duration > 100) {
      logger.warn(`Slow query: ${duration}ms\n${text}`)
    }

    return res
  } catch (err) {
    logger.error(`Query error: ${err.message}\nQuery: ${text}\nParams: ${JSON.stringify(params)}`)
    throw err
  }
}

// Transaction helper
const transaction = async (callback) => {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    const result = await callback(client)
    await client.query("COMMIT")
    return result
  } catch (e) {
    await client.query("ROLLBACK")
    throw e
  } finally {
    client.release()
  }
}

// Connect to the database and test the connection
const connectDB = async () => {
  try {
    const res = await pool.query("SELECT NOW()")
    logger.info(`Connected to PostgreSQL database at ${process.env.DB_HOST}:${process.env.DB_PORT}`)
    return res
  } catch (err) {
    logger.error("Database connection error:", err)
    process.exit(1)
  }
}

module.exports = {
  query,
  transaction,
  connectDB,
  pool,
}
