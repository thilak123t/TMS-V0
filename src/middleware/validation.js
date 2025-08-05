const Joi = require("joi")
const logger = require("../utils/logger")

// Generic validation middleware
const validate = (schema, property = "body") => {
  return (req, res, next) => {
    const { error } = schema.validate(req[property], { abortEarly: false })

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }))

      logger.warn("Validation error:", { errors, url: req.url })

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      })
    }

    next()
  }
}

// User validation schemas
const userSchemas = {
  register: Joi.object({
    firstName: Joi.string().min(2).max(50).required(),
    lastName: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).required(),
    role: Joi.string().valid("admin", "tender-creator", "vendor").required(),
    companyName: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    firstName: Joi.string().min(2).max(50).optional(),
    lastName: Joi.string().min(2).max(50).optional(),
    companyName: Joi.string().max(100).optional(),
    phone: Joi.string().max(20).optional(),
  }),

  changePassword: Joi.object({
    currentPassword: Joi.string().required(),
    newPassword: Joi.string().min(6).required(),
  }),
}

// Tender validation schemas
const tenderSchemas = {
  create: Joi.object({
    title: Joi.string().min(5).max(200).required(),
    description: Joi.string().min(10).max(2000).required(),
    requirements: Joi.string().max(5000).optional(),
    basePrice: Joi.number().positive().required(),
    currency: Joi.string().length(3).default("USD"),
    deadline: Joi.date().greater("now").required(),
    category: Joi.string().max(100).optional(),
    location: Joi.string().max(200).optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
  }),

  update: Joi.object({
    title: Joi.string().min(5).max(200).optional(),
    description: Joi.string().min(10).max(2000).optional(),
    requirements: Joi.string().max(5000).optional(),
    basePrice: Joi.number().positive().optional(),
    currency: Joi.string().length(3).optional(),
    deadline: Joi.date().greater("now").optional(),
    category: Joi.string().max(100).optional(),
    location: Joi.string().max(200).optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
  }),

  invite: Joi.object({
    vendorIds: Joi.array().items(Joi.number().positive()).min(1).required(),
    message: Joi.string().max(500).optional(),
  }),
}

// Bid validation schemas
const bidSchemas = {
  create: Joi.object({
    amount: Joi.number().positive().required(),
    notes: Joi.string().max(1000).optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
    deliveryTime: Joi.number().positive().optional(),
  }),

  update: Joi.object({
    amount: Joi.number().positive().optional(),
    notes: Joi.string().max(1000).optional(),
    attachments: Joi.array().items(Joi.string()).optional(),
    deliveryTime: Joi.number().positive().optional(),
  }),
}

// Comment validation schemas
const commentSchemas = {
  create: Joi.object({
    content: Joi.string().min(1).max(1000).required(),
    parentId: Joi.number().positive().optional(),
  }),
}

// Query parameter validation schemas
const querySchemas = {
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().optional(),
    sortOrder: Joi.string().valid("asc", "desc").default("desc"),
  }),

  tenderFilters: Joi.object({
    status: Joi.string().valid("draft", "published", "closed", "awarded").optional(),
    category: Joi.string().optional(),
    minPrice: Joi.number().positive().optional(),
    maxPrice: Joi.number().positive().optional(),
    search: Joi.string().max(100).optional(),
  }),
}

module.exports = {
  validate,
  userSchemas,
  tenderSchemas,
  bidSchemas,
  commentSchemas,
  querySchemas,
}
