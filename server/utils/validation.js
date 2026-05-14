const Joi = require("joi");

// User validation schemas
const userSchemas = {
  register: Joi.object({
    name: Joi.string().min(2).max(50).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(6).max(100).required(),
    role: Joi.string().valid("employee", "lead", "admin").default("employee"),
  }),

  login: Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required(),
  }),

  updateProfile: Joi.object({
    name: Joi.string().min(2).max(50),
    avatarStyle: Joi.string().valid("circle", "square", "triangle"),
    focusMode: Joi.boolean(),
  }),
};

// Task validation schemas
const taskSchemas = {
  create: Joi.object({
    title: Joi.string().min(1).max(200).required(),
    description: Joi.string().max(1000),
    priority: Joi.string().valid("low", "medium", "high").default("medium"),
    assignedTo: Joi.string().hex().length(24),
    dueDate: Joi.date().greater("now"),
  }),

  update: Joi.object({
    title: Joi.string().min(1).max(200),
    description: Joi.string().max(1000),
    priority: Joi.string().valid("low", "medium", "high"),
    status: Joi.string().valid(
      "pending",
      "in-progress",
      "completed",
      "cancelled",
    ),
    assignedTo: Joi.string().hex().length(24),
    dueDate: Joi.date().greater("now"),
  }),
};

// Message validation schemas
const messageSchemas = {
  send: Joi.object({
    content: Joi.string().min(1).max(500).required(),
    position: Joi.object({
      x: Joi.number().min(0).max(2000).required(),
      y: Joi.number().min(0).max(2000).required(),
    }).required(),
  }),
};

// Session validation schemas
const sessionSchemas = {
  create: Joi.object({
    startTime: Joi.date(),
    endTime: Joi.date().when("startTime", {
      is: Joi.exist(),
      then: Joi.date().greater(Joi.ref("startTime")),
    }),
  }),
};

// Validation middleware
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join("."),
        message: detail.message,
      }));

      return res.status(400).json({
        message: "Validation failed",
        errors,
      });
    }

    next();
  };
};

module.exports = {
  userSchemas,
  taskSchemas,
  messageSchemas,
  sessionSchemas,
  validate,
};
