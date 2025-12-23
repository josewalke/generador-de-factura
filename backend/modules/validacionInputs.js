/**
 * Módulo de Validación de Inputs
 * Proporciona funciones de validación y sanitización para inputs del usuario
 */

class ValidacionInputs {
    /**
     * Sanitiza un string eliminando caracteres peligrosos
     */
    static sanitizeString(str) {
        if (typeof str !== 'string') return str;
        
        return str
            .trim()
            .replace(/[<>]/g, '') // Eliminar < y >
            .replace(/javascript:/gi, '') // Eliminar javascript:
            .replace(/on\w+=/gi, ''); // Eliminar event handlers
    }

    /**
     * Valida y sanitiza un email
     */
    static validateEmail(email) {
        if (!email) return { valid: false, error: 'Email es requerido' };
        
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const sanitized = this.sanitizeString(email);
        
        if (!emailRegex.test(sanitized)) {
            return { valid: false, error: 'Email inválido', sanitized: null };
        }
        
        return { valid: true, sanitized };
    }

    /**
     * Valida un número
     */
    static validateNumber(value, min = null, max = null) {
        if (value === undefined || value === null) {
            return { valid: false, error: 'Número es requerido' };
        }
        
        const num = parseFloat(value);
        
        if (isNaN(num)) {
            return { valid: false, error: 'Debe ser un número válido' };
        }
        
        if (min !== null && num < min) {
            return { valid: false, error: `Debe ser mayor o igual a ${min}` };
        }
        
        if (max !== null && num > max) {
            return { valid: false, error: `Debe ser menor o igual a ${max}` };
        }
        
        return { valid: true, sanitized: num };
    }

    /**
     * Valida un entero
     */
    static validateInteger(value, min = null, max = null) {
        const numValidation = this.validateNumber(value, min, max);
        
        if (!numValidation.valid) {
            return numValidation;
        }
        
        const int = parseInt(value);
        
        if (!Number.isInteger(int)) {
            return { valid: false, error: 'Debe ser un número entero' };
        }
        
        return { valid: true, sanitized: int };
    }

    /**
     * Valida un string con longitud mínima y máxima
     */
    static validateString(str, minLength = 1, maxLength = 1000) {
        if (!str) {
            return { valid: false, error: 'Campo es requerido' };
        }
        
        const sanitized = this.sanitizeString(str);
        
        if (sanitized.length < minLength) {
            return { valid: false, error: `Debe tener al menos ${minLength} caracteres` };
        }
        
        if (sanitized.length > maxLength) {
            return { valid: false, error: `No puede exceder ${maxLength} caracteres` };
        }
        
        return { valid: true, sanitized };
    }

    /**
     * Valida una fecha
     */
    static validateDate(dateString) {
        if (!dateString) {
            return { valid: false, error: 'Fecha es requerida' };
        }
        
        const date = new Date(dateString);
        
        if (isNaN(date.getTime())) {
            return { valid: false, error: 'Fecha inválida' };
        }
        
        return { valid: true, sanitized: dateString };
    }

    /**
     * Valida un ID numérico
     */
    static validateId(id) {
        return this.validateInteger(id, 1);
    }

    /**
     * Valida un CIF español básico
     */
    static validateCIF(cif) {
        if (!cif) {
            return { valid: false, error: 'CIF es requerido' };
        }
        
        const sanitized = this.sanitizeString(cif).toUpperCase();
        
        // Formato básico: letra + 7-8 dígitos + letra/dígito
        const cifRegex = /^[A-Z][0-9]{7,8}[0-9A-Z]$/;
        
        if (!cifRegex.test(sanitized)) {
            return { valid: false, error: 'Formato de CIF inválido' };
        }
        
        return { valid: true, sanitized };
    }

    /**
     * Valida un teléfono
     */
    static validatePhone(phone) {
        if (!phone) {
            return { valid: true, sanitized: null }; // Opcional
        }
        
        const sanitized = this.sanitizeString(phone);
        const phoneRegex = /^[0-9\s\-\+\(\)]{6,20}$/;
        
        if (!phoneRegex.test(sanitized)) {
            return { valid: false, error: 'Formato de teléfono inválido' };
        }
        
        return { valid: true, sanitized };
    }

    /**
     * Middleware de validación genérico
     */
    static validate(schema) {
        return (req, res, next) => {
            const errors = [];
            const sanitized = {};
            
            // Validar body
            if (schema.body) {
                for (const [field, rules] of Object.entries(schema.body)) {
                    const value = req.body[field];
                    const validation = this.validateField(value, rules);
                    
                    if (!validation.valid) {
                        errors.push({ field, error: validation.error });
                    } else if (validation.sanitized !== undefined) {
                        sanitized[field] = validation.sanitized;
                    }
                }
            }
            
            // Validar params
            if (schema.params) {
                for (const [field, rules] of Object.entries(schema.params)) {
                    const value = req.params[field];
                    const validation = this.validateField(value, rules);
                    
                    if (!validation.valid) {
                        errors.push({ field, error: validation.error });
                    } else if (validation.sanitized !== undefined) {
                        sanitized[field] = validation.sanitized;
                    }
                }
            }
            
            // Validar query
            if (schema.query) {
                for (const [field, rules] of Object.entries(schema.query)) {
                    const value = req.query[field];
                    if (value !== undefined) {
                        const validation = this.validateField(value, rules);
                        
                        if (!validation.valid) {
                            errors.push({ field, error: validation.error });
                        } else if (validation.sanitized !== undefined) {
                            sanitized[field] = validation.sanitized;
                        }
                    }
                }
            }
            
            if (errors.length > 0) {
                return res.status(400).json({
                    success: false,
                    error: 'Errores de validación',
                    errors: errors
                });
            }
            
            // Aplicar valores sanitizados
            Object.assign(req.body, sanitized);
            Object.assign(req.params, sanitized);
            Object.assign(req.query, sanitized);
            
            next();
        };
    }

    /**
     * Valida un campo según las reglas
     */
    static validateField(value, rules) {
        // Si es opcional y no está presente
        if (rules.optional && (value === undefined || value === null || value === '')) {
            return { valid: true, sanitized: null };
        }
        
        // Si es requerido y no está presente
        if (!rules.optional && (value === undefined || value === null || value === '')) {
            return { valid: false, error: rules.error || 'Campo es requerido' };
        }
        
        // Validar según el tipo
        switch (rules.type) {
            case 'string':
                return this.validateString(value, rules.minLength, rules.maxLength);
            case 'email':
                return this.validateEmail(value);
            case 'number':
                return this.validateNumber(value, rules.min, rules.max);
            case 'integer':
                return this.validateInteger(value, rules.min, rules.max);
            case 'id':
                return this.validateId(value);
            case 'date':
                return this.validateDate(value);
            case 'cif':
                return this.validateCIF(value);
            case 'phone':
                return this.validatePhone(value);
            default:
                return { valid: true, sanitized: this.sanitizeString(value) };
        }
    }
}

module.exports = ValidacionInputs;







