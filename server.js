require("dotenv").config()
const express = require("express")
const cors = require("cors")
const helmet = require("helmet")
const compression = require("compression")
const morgan = require("morgan")
const path = require("path")
const http = require("http")
const socketIo = require("socket.io")
const logger = require("./src/utils/logger")
const errorHandler = require("./src/middleware/errorHandler")

// Import routes
const authRoutes = require("./src/routes/auth")
const usersRoutes = require("./src/routes/users")
const tendersRoutes = require("./src/routes/tenders")
const bidsRoutes = require("./src/routes/bids")
const commentsRoutes = require("./src/routes/comments")
const notificationsRoutes = require("./src/routes/notifications")
const uploadsRoutes = require("./src/routes/uploads")
const dashboardRoutes = require("./src/routes/dashboard")

// Initialize express app
const app = express()
const server = http.createServer(app)

// Set up Socket.IO
const io = socketIo(server, {
  cors: {
    origin: process.env.SOCKET_CORS_ORIGIN || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
})

// Middleware
app.use(helmet()) // Security headers
app.use(compression()) // Compress responses
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials: true,
  }),
)
app.use(express.json()) // Parse JSON bodies
app.use(express.urlencoded({ extended: true })) // Parse URL-encoded bodies
app.use(morgan("dev")) // HTTP request logger

// Static files
app.use("/uploads", express.static(path.join(__dirname, "uploads")))

// Make io accessible to routes
app.use((req, res, next) => {
  req.io = io
  next()
})

// Routes
app.use("/api/auth", authRoutes)
app.use("/api/users", usersRoutes)
app.use("/api/tenders", tendersRoutes)
app.use("/api/bids", bidsRoutes)
app.use("/api/comments", commentsRoutes)
app.use("/api/notifications", notificationsRoutes)
app.use("/api/uploads", uploadsRoutes)
app.use("/api/dashboard", dashboardRoutes)

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date() })
})

// Error handling middleware
app.use(errorHandler)

// Socket.IO connection handling
io.on("connection", (socket) => {
  logger.info(`Socket connected: ${socket.id}`)

  // Join user-specific room for targeted notifications
  socket.on("join", (userId) => {
    if (userId) {
      socket.join(`user:${userId}`)
      logger.info(`User ${userId} joined their room`)
    }
  })

  // Handle disconnection
  socket.on("disconnect", () => {
    logger.info(`Socket disconnected: ${socket.id}`)
  })
})

// Start server
const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`)
  logger.info(`Environment: ${process.env.NODE_ENV}`)
})

// Handle unhandled promise rejections
process.on("unhandledRejection", (err) => {
  logger.error("Unhandled Rejection:", err)
})

module.exports = { app, server, io }
