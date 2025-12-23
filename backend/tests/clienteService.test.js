const ClienteService = require('../services/clienteService');

// Mock de base de datos
const createMockDb = () => {
    const data = [];
    let idCounter = 1;

    return {
        all: jest.fn((query, callback) => {
            callback(null, data);
        }),
        get: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const id = params[0];
            const cliente = data.find(c => c.id === id || c.identificacion === id);
            callback(null, cliente || null);
        }),
        run: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const cliente = {
                id: idCounter++,
                nombre: params[0],
                direccion: params[1],
                codigo_postal: params[2],
                identificacion: params[3],
                email: params[4],
                telefono: params[5]
            };
            data.push(cliente);
            callback(null, { lastID: cliente.id, changes: 1 });
        })
    };
};

// Mock de logger
const createMockLogger = () => ({
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
});

describe('ClienteService', () => {
    let service;
    let mockDb;
    let mockLogger;

    beforeEach(() => {
        mockDb = createMockDb();
        mockLogger = createMockLogger();
        service = new ClienteService(mockDb, mockLogger);
    });

    describe('getAll', () => {
        it('debe obtener todos los clientes', async () => {
            const clientes = await service.getAll();
            expect(mockDb.all).toHaveBeenCalled();
            expect(Array.isArray(clientes)).toBe(true);
        });

        it('debe lanzar error si la base de datos no está inicializada', async () => {
            service.db = null;
            await expect(service.getAll()).rejects.toThrow('Base de datos no inicializada');
        });
    });

    describe('getById', () => {
        it('debe obtener un cliente por ID', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, nombre: 'Test Cliente' });
            });

            const cliente = await service.getById(1);
            expect(mockDb.get).toHaveBeenCalled();
            expect(cliente).toHaveProperty('id', 1);
        });

        it('debe retornar null si el cliente no existe', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null);
            });

            const cliente = await service.getById(999);
            expect(cliente).toBeNull();
        });
    });

    describe('create', () => {
        it('debe crear un nuevo cliente', async () => {
            const clienteData = {
                nombre: 'Test Cliente',
                direccion: 'Test Dirección',
                identificacion: '12345678A',
                email: 'test@test.com',
                telefono: '123456789'
            };

            mockDb.run.mockImplementation((query, params, callback) => {
                const cliente = {
                    id: 1,
                    ...clienteData
                };
                callback(null, { lastID: 1, changes: 1 });
            });

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null); // No existe cliente con esa identificación
            });

            const resultado = await service.create(clienteData);
            expect(resultado).toHaveProperty('id');
            expect(resultado.nombre).toBe(clienteData.nombre);
        });

        it('debe lanzar error si faltan campos obligatorios', async () => {
            const clienteData = {
                nombre: 'Test Cliente'
                // Faltan direccion e identificacion
            };

            await expect(service.create(clienteData)).rejects.toThrow('Campos obligatorios faltantes');
        });

        it('debe lanzar error si la identificación ya existe', async () => {
            const clienteData = {
                nombre: 'Test Cliente',
                direccion: 'Test Dirección',
                identificacion: '12345678A'
            };

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, identificacion: '12345678A' }); // Cliente ya existe
            });

            await expect(service.create(clienteData)).rejects.toThrow('La identificación ya existe');
        });
    });
});



