const request = require('supertest');
const express = require('express');
const createClientesRouter = require('../../routes/clientesRoutes');

// Mock de dependencias
const createMockDb = () => {
    const clientes = [
        { id: 1, nombre: 'Cliente 1', direccion: 'Dir 1', identificacion: '12345678A' },
        { id: 2, nombre: 'Cliente 2', direccion: 'Dir 2', identificacion: '87654321B' }
    ];

    return {
        all: jest.fn((query, callback) => {
            callback(null, clientes);
        }),
        get: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const id = params[0];
            const cliente = clientes.find(c => c.id === parseInt(id));
            callback(null, cliente || null);
        }),
        run: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const nuevoCliente = {
                id: clientes.length + 1,
                nombre: params[0],
                direccion: params[1],
                codigo_postal: params[2],
                identificacion: params[3],
                email: params[4],
                telefono: params[5]
            };
            clientes.push(nuevoCliente);
            callback(null, { lastID: nuevoCliente.id, changes: 1 });
        })
    };
};

const createMockLogger = () => ({
    operationRead: jest.fn(),
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    databaseQuery: jest.fn(),
    operationCreate: jest.fn(),
    operationUpdate: jest.fn(),
    operationDelete: jest.fn()
});

const createMockCacheManager = () => ({
    invalidatePattern: jest.fn(),
    get: jest.fn(),
    set: jest.fn()
});

describe('Clientes API Integration Tests', () => {
    let app;
    let mockDb;
    let mockLogger;
    let mockCacheManager;

    beforeEach(() => {
        app = express();
        app.use(express.json());
        
        mockDb = createMockDb();
        mockLogger = createMockLogger();
        mockCacheManager = createMockCacheManager();

        app.use('/api/clientes', createClientesRouter(mockDb, mockLogger, mockCacheManager));
    });

    describe('GET /api/clientes', () => {
        it('debe obtener todos los clientes', async () => {
            const response = await request(app)
                .get('/api/clientes')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('GET /api/clientes/:id', () => {
        it('debe obtener un cliente por ID', async () => {
            const response = await request(app)
                .get('/api/clientes/1')
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id', 1);
        });

        it('debe retornar 404 si el cliente no existe', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null);
            });

            await request(app)
                .get('/api/clientes/999')
                .expect(404);
        });
    });

    describe('POST /api/clientes', () => {
        it('debe crear un nuevo cliente', async () => {
            const nuevoCliente = {
                nombre: 'Nuevo Cliente',
                direccion: 'Nueva Dirección',
                identificacion: '11111111C',
                email: 'nuevo@test.com',
                telefono: '987654321'
            };

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null); // No existe cliente con esa identificación
            });

            const response = await request(app)
                .post('/api/clientes')
                .send(nuevoCliente)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toHaveProperty('id');
        });

        it('debe retornar 400 si faltan campos obligatorios', async () => {
            const clienteIncompleto = {
                nombre: 'Cliente'
                // Faltan direccion e identificacion
            };

            await request(app)
                .post('/api/clientes')
                .send(clienteIncompleto)
                .expect(400);
        });
    });
});



