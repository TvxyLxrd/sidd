const Joi = require('joi');
const logger = require('../utils/logger');

// Middleware для валидации с использованием Joi схем
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Показываем все ошибки
      stripUnknown: true  // Удаляем неизвестные поля
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      logger.warn('Validation error', {
        path: req.path,
        errors
      });

      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    // Заменяем body валидированными данными
    req.body = value;
    next();
  };
};

// Схемы валидации для регистрации
const registerSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .min(6)
    .max(100)
    .required()
    .messages({
      'string.min': 'Password must be at least 6 characters',
      'string.max': 'Password must not exceed 100 characters',
      'any.required': 'Password is required'
    }),
  fullName: Joi.string()
    .min(2)
    .max(255)
    .required()
    .messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 255 characters',
      'any.required': 'Full name is required'
    }),
  phone: Joi.string()
    .pattern(/^[0-9\-\+\(\)\s]+$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Invalid phone number format'
    })
});

// Схема для авторизации
const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Invalid email format',
      'any.required': 'Email is required'
    }),
  password: Joi.string()
    .required()
    .messages({
      'any.required': 'Password is required'
    })
});

// Схема для создания заявки
const createRequestSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .required()
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 255 characters',
      'any.required': 'Title is required'
    }),
  description: Joi.string()
    .min(10)
    .max(5000)
    .required()
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 5000 characters',
      'any.required': 'Description is required'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .default('medium')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  categoryId: Joi.string()
    .uuid()
    .required()
    .messages({
      'string.guid': 'Invalid category ID format',
      'any.required': 'Category is required'
    })
});

// Схема для обновления заявки
const updateRequestSchema = Joi.object({
  title: Joi.string()
    .min(3)
    .max(255)
    .messages({
      'string.min': 'Title must be at least 3 characters',
      'string.max': 'Title must not exceed 255 characters'
    }),
  description: Joi.string()
    .min(10)
    .max(5000)
    .messages({
      'string.min': 'Description must be at least 10 characters',
      'string.max': 'Description must not exceed 5000 characters'
    }),
  priority: Joi.string()
    .valid('low', 'medium', 'high', 'urgent')
    .messages({
      'any.only': 'Priority must be one of: low, medium, high, urgent'
    }),
  status: Joi.string()
    .valid('pending', 'in_progress', 'completed', 'rejected', 'on_hold')
    .messages({
      'any.only': 'Invalid status value'
    }),
  assignedTo: Joi.string()
    .uuid()
    .allow(null)
    .messages({
      'string.guid': 'Invalid user ID format'
    }),
  categoryId: Joi.string()
    .uuid()
    .messages({
      'string.guid': 'Invalid category ID format'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Схема для создания комментария
const createCommentSchema = Joi.object({
  content: Joi.string()
    .min(1)
    .max(2000)
    .required()
    .messages({
      'string.min': 'Comment cannot be empty',
      'string.max': 'Comment must not exceed 2000 characters',
      'any.required': 'Comment content is required'
    }),
  isInternal: Joi.boolean()
    .default(false)
});

// Схема для обновления профиля
const updateProfileSchema = Joi.object({
  fullName: Joi.string()
    .min(2)
    .max(255)
    .messages({
      'string.min': 'Full name must be at least 2 characters',
      'string.max': 'Full name must not exceed 255 characters'
    }),
  phone: Joi.string()
    .pattern(/^[0-9\-\+\(\)\s]+$/)
    .allow('', null)
    .messages({
      'string.pattern.base': 'Invalid phone number format'
    }),
  avatarUrl: Joi.string()
    .uri()
    .allow('', null)
    .messages({
      'string.uri': 'Invalid avatar URL format'
    })
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

// Схема для смены пароля
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string()
    .required()
    .messages({
      'any.required': 'Current password is required'
    }),
  newPassword: Joi.string()
    .min(6)
    .max(100)
    .required()
    .invalid(Joi.ref('currentPassword'))
    .messages({
      'string.min': 'New password must be at least 6 characters',
      'string.max': 'New password must not exceed 100 characters',
      'any.required': 'New password is required',
      'any.invalid': 'New password must be different from current password'
    })
});

// Схема для создания категории
const createCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name must not exceed 100 characters',
      'any.required': 'Category name is required'
    }),
  slug: Joi.string()
    .pattern(/^[a-z0-9\-]+$/)
    .required()
    .messages({
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers and hyphens',
      'any.required': 'Slug is required'
    }),
  icon: Joi.string()
    .max(50)
    .allow('', null),
  description: Joi.string()
    .max(500)
    .allow('', null)
});

// Схема для обновления категории: все поля необязательны
const updateCategorySchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Category name must be at least 2 characters',
      'string.max': 'Category name must not exceed 100 characters'
    }),
  slug: Joi.string()
    .pattern(/^[a-z0-9\-]+$/)
    .messages({
      'string.pattern.base': 'Slug can only contain lowercase letters, numbers and hyphens'
    }),
  icon: Joi.string()
    .max(50)
    .allow('', null),
  description: Joi.string()
    .max(500)
    .allow('', null),
  isActive: Joi.boolean()
}).min(1).messages({
  'object.min': 'At least one field must be provided'
});

module.exports = {
  validate,
  registerSchema,
  loginSchema,
  createRequestSchema,
  updateRequestSchema,
  createCommentSchema,
  updateProfileSchema,
  changePasswordSchema,
  createCategorySchema,
  updateCategorySchema
};
