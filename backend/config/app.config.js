const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const securityMiddleware = require('../middlewares/security.middleware');
const loggingMiddleware = require('../middlewares/logging.middleware');
const { limiter, loginLimiter } = require('../middlewares/rateLimiter.middleware');

/**
 * Configurar middleware de Express
 */
function configureApp(app, logger, securityMonitor) {
    // Aplicar rate limiting general
    app.use(limiter);

    // Aplicar rate limiting estricto a endpoints de autenticación
    app.use('/api/auth/login', loginLimiter);
    app.use('/api/auth/register', loginLimiter);

    // Middleware de seguridad
    app.use(securityMiddleware());

    // Middleware de logging
    app.use(loggingMiddleware(logger, securityMonitor));

    // Middleware de validación de entrada
    app.use((req, res, next) => {
        // Sanitizar parámetros de consulta
        if (req.query) {
            Object.keys(req.query).forEach(key => {
                if (typeof req.query[key] === 'string') {
                    req.query[key] = req.query[key].replace(/[<>\"'%;()&+]/g, '');
                }
            });
        }

        // Validar tamaño del body
        const contentLength = parseInt(req.get('content-length') || '0');
        if (contentLength > 10 * 1024 * 1024) { // 10MB
            return res.status(413).json({ error: 'Payload demasiado grande' });
        }

        next();
    });

    // CORS y body parser
    app.use(cors(config.get('server.cors')));
    app.use(bodyParser.json({ limit: '10mb' }));
    app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

    // Configurar multer para subida de archivos
    const storage = multer.diskStorage({
        destination: (req, file, cb) => {
            const uploadDir = path.join(__dirname, '../../temp');
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }
            cb(null, uploadDir);
        },
        filename: (req, file, cb) => {
            const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
            cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
        }
    });

    const upload = multer({
        storage: storage,
        fileFilter: (req, file, cb) => {
            // Validar tipo MIME
            const allowedMimeTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
                'application/vnd.ms-excel' // .xls
            ];

            // Validar extensión
            const allowedExtensions = ['.xlsx', '.xls'];
            const ext = path.extname(file.originalname).toLowerCase();

            if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(ext)) {
                cb(null, true);
            } else {
                cb(new Error('Solo se permiten archivos Excel (.xlsx, .xls)'), false);
            }
        },
        limits: {
            fileSize: 5 * 1024 * 1024, // 5MB límite
            files: 1 // Solo un archivo por vez
        }
    });

    // Hacer upload disponible en app
    app.set('upload', upload);

    // Hacer logger disponible en app
    app.set('logger', logger);

    return { upload };
}

module.exports = configureApp;

