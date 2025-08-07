const express = require("express")
const multer = require("multer")
const path = require("path")
const fs = require("fs").promises
const sharp = require("sharp")
const { v4: uuidv4 } = require("uuid")
const { query } = require("../config/database")
const { auth: authenticateToken } = require("../middleware/auth")
const logger = require("../utils/logger")

const router = express.Router()

// Ensure upload directories exist
const ensureUploadDirs = async () => {
  const dirs = ["uploads/tenders", "uploads/bids", "uploads/avatars", "uploads/temp"]
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true })
    } catch (error) {
      logger.error(`Failed to create directory ${dir}:`, error)
    }
  }
}

ensureUploadDirs()

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadType = req.params.type || "temp"
    const uploadPath = `uploads/${uploadType}`
    cb(null, uploadPath)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  },
})

const fileFilter = (req, file, cb) => {
  const allowedTypes = {
    documents: [".pdf", ".doc", ".docx", ".xls", ".xlsx", ".txt", ".rtf"],
    images: [".jpg", ".jpeg", ".png", ".gif", ".bmp", ".webp"],
    avatars: [".jpg", ".jpeg", ".png", ".gif", ".webp"],
  }

  const uploadType = req.params.type || "documents"
  const fileExt = path.extname(file.originalname).toLowerCase()

  if (allowedTypes[uploadType] && allowedTypes[uploadType].includes(fileExt)) {
    cb(null, true)
  } else {
    cb(new Error(`Invalid file type for ${uploadType}. Allowed: ${allowedTypes[uploadType]?.join(", ")}`), false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: Number.parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
})

// Upload tender attachments
router.post("/tenders/:tenderId", authenticateToken, upload.array("files", 10), async (req, res) => {
  const { tenderId } = req.params

  try {
    // Check if tender exists and user has permission
    const tenderResult = await query("SELECT creator_id FROM tenders WHERE id = $1", [tenderId])

    if (tenderResult.rows.length === 0) {
      return res.status(404).json({ error: "Tender not found" })
    }

    const tender = tenderResult.rows[0]

    if (req.user.role === "tender-creator" && tender.creator_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" })
    }

    // Save file information to database
    const attachmentPromises = req.files.map((file) =>
      query(
        `INSERT INTO tender_attachments (tender_id, filename, original_name, file_path, file_size, mime_type, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [tenderId, file.filename, file.originalname, file.path, file.size, file.mimetype, req.user.id],
      ),
    )

    const results = await Promise.all(attachmentPromises)
    const attachments = results.map((result) => result.rows[0])

    logger.info(`${req.files.length} files uploaded for tender ${tenderId} by ${req.user.email}`)

    res.json({
      success: true,
      message: `${req.files.length} files uploaded successfully`,
      data: {
        attachments: attachments.map((attachment) => ({
          id: attachment.id,
          filename: attachment.filename,
          originalName: attachment.original_name,
          fileSize: attachment.file_size,
          mimeType: attachment.mime_type,
          uploadedAt: attachment.created_at,
        })),
      },
    })
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach((file) => {
        fs.unlink(file.path).catch((unlinkError) => {
          logger.error("Failed to delete file on error:", unlinkError)
        })
      })
    }

    logger.error("Upload tender attachments error:", error)
    res.status(500).json({ error: "Failed to upload files" })
  }
})

// Upload bid documents
router.post("/bids/:bidId", authenticateToken, upload.array("files", 10), async (req, res) => {
  const { bidId } = req.params

  try {
    // Check if bid exists and belongs to user
    const bidResult = await query("SELECT vendor_id FROM bids WHERE id = $1", [bidId])

    if (bidResult.rows.length === 0) {
      return res.status(404).json({ error: "Bid not found" })
    }

    const bid = bidResult.rows[0]

    if (bid.vendor_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: "No files uploaded" })
    }

    // Save file information to database
    const documentPromises = req.files.map((file) =>
      query(
        `INSERT INTO bid_documents (bid_id, filename, original_name, file_path, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [bidId, file.filename, file.originalname, file.path, file.size, file.mimetype],
      ),
    )

    const results = await Promise.all(documentPromises)
    const documents = results.map((result) => result.rows[0])

    logger.info(`${req.files.length} documents uploaded for bid ${bidId} by ${req.user.email}`)

    res.json({
      success: true,
      message: `${req.files.length} documents uploaded successfully`,
      data: {
        documents: documents.map((document) => ({
          id: document.id,
          filename: document.filename,
          originalName: document.original_name,
          fileSize: document.file_size,
          mimeType: document.mime_type,
          uploadedAt: document.uploaded_at,
        })),
      },
    })
  } catch (error) {
    // Clean up uploaded files on error
    if (req.files) {
      req.files.forEach((file) => {
        fs.unlink(file.path).catch((unlinkError) => {
          logger.error("Failed to delete file on error:", unlinkError)
        })
      })
    }

    logger.error("Upload bid documents error:", error)
    res.status(500).json({ error: "Failed to upload documents" })
  }
})

// Upload user avatar
router.post("/avatar", authenticateToken, upload.single("avatar"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" })
    }

    // Process image with sharp (resize and optimize)
    const processedFilename = `avatar-${req.user.id}-${Date.now()}.webp`
    const processedPath = `uploads/avatars/${processedFilename}`

    await sharp(req.file.path).resize(200, 200, { fit: "cover" }).webp({ quality: 80 }).toFile(processedPath)

    // Delete original file
    await fs.unlink(req.file.path)

    // Update user avatar URL
    const avatarUrl = `/uploads/avatars/${processedFilename}`
    await query("UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [
      avatarUrl,
      req.user.id,
    ])

    logger.info(`Avatar uploaded for user ${req.user.email}`)

    res.json({
      success: true,
      message: "Avatar uploaded successfully",
      data: {
        avatarUrl,
      },
    })
  } catch (error) {
    // Clean up uploaded file on error
    if (req.file) {
      fs.unlink(req.file.path).catch((unlinkError) => {
        logger.error("Failed to delete file on error:", unlinkError)
      })
    }

    logger.error("Upload avatar error:", error)
    res.status(500).json({ error: "Failed to upload avatar" })
  }
})

// Delete tender attachment
router.delete("/tenders/:tenderId/attachments/:attachmentId", authenticateToken, async (req, res) => {
  const { tenderId, attachmentId } = req.params

  try {
    // Check permissions and get file path
    const attachmentResult = await query(
      `SELECT ta.file_path, t.creator_id
       FROM tender_attachments ta
       JOIN tenders t ON ta.tender_id = t.id
       WHERE ta.id = $1 AND ta.tender_id = $2`,
      [attachmentId, tenderId],
    )

    if (attachmentResult.rows.length === 0) {
      return res.status(404).json({ error: "Attachment not found" })
    }

    const attachment = attachmentResult.rows[0]

    if (req.user.role === "tender-creator" && attachment.creator_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Delete file from filesystem
    try {
      await fs.unlink(attachment.file_path)
    } catch (fileError) {
      logger.warn("Failed to delete file from filesystem:", fileError)
    }

    // Delete from database
    await query("DELETE FROM tender_attachments WHERE id = $1", [attachmentId])

    logger.info(`Tender attachment deleted: ${attachmentId} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Attachment deleted successfully",
    })
  } catch (error) {
    logger.error("Delete tender attachment error:", error)
    res.status(500).json({ error: "Failed to delete attachment" })
  }
})

// Delete bid document
router.delete("/bids/:bidId/documents/:documentId", authenticateToken, async (req, res) => {
  const { bidId, documentId } = req.params

  try {
    // Check permissions and get file path
    const documentResult = await query(
      `SELECT bd.file_path, b.vendor_id
       FROM bid_documents bd
       JOIN bids b ON bd.bid_id = b.id
       WHERE bd.id = $1 AND bd.bid_id = $2`,
      [documentId, bidId],
    )

    if (documentResult.rows.length === 0) {
      return res.status(404).json({ error: "Document not found" })
    }

    const document = documentResult.rows[0]

    if (document.vendor_id !== req.user.id) {
      return res.status(403).json({ error: "Access denied" })
    }

    // Delete file from filesystem
    try {
      await fs.unlink(document.file_path)
    } catch (fileError) {
      logger.warn("Failed to delete file from filesystem:", fileError)
    }

    // Delete from database
    await query("DELETE FROM bid_documents WHERE id = $1", [documentId])

    logger.info(`Bid document deleted: ${documentId} by ${req.user.email}`)

    res.json({
      success: true,
      message: "Document deleted successfully",
    })
  } catch (error) {
    logger.error("Delete bid document error:", error)
    res.status(500).json({ error: "Failed to delete document" })
  }
})

// Download file
router.get("/download/:type/:filename", authenticateToken, async (req, res) => {
  const { type, filename } = req.params

  try {
    const filePath = path.join("uploads", type, filename)

    // Check if file exists
    try {
      await fs.access(filePath)
    } catch {
      return res.status(404).json({ error: "File not found" })
    }

    // Set appropriate headers
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`)
    res.sendFile(path.resolve(filePath))
  } catch (error) {
    logger.error("Download file error:", error)
    res.status(500).json({ error: "Failed to download file" })
  }
})

module.exports = router
