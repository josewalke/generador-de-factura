const CocheService = require('../services/cocheService');

// Mock de base de datos
const createMockDb = () => {
    const coches = [];
    let idCounter = 1;

    return {
        all: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            callback(null, coches);
        }),
        get: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const id = params[0];
            const coche = coches.find(c => c.id === parseInt(id));
            callback(null, coche || null);
        }),
        run: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const coche = {
                id: idCounter++,
                matricula: params[0],
                chasis: params[1],
                color: params[2],
                kms: params[3],
                modelo: params[4],
                marca: params[5]
            };
            coches.push(coche);
            callback(null, { lastID: coche.id, changes: 1 });
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

describe('CocheService', () => {
    let service;
    let mockDb;
    let mockLogger;

    beforeEach(() => {
        mockDb = createMockDb();
        mockLogger = createMockLogger();
        service = new CocheService(mockDb, mockLogger);
    });

    describe('getAll', () => {
        it('debe obtener todos los coches', async () => {
            const coches = await service.getAll();
            expect(mockDb.all).toHaveBeenCalled();
            expect(Array.isArray(coches)).toBe(true);
        });
    });

    describe('getById', () => {
        it('debe obtener un coche por ID', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, matricula: 'ABC1234' });
            });

            const coche = await service.getById(1);
            expect(mockDb.get).toHaveBeenCalled();
            expect(coche).toHaveProperty('id', 1);
        });

        it('debe retornar null si el coche no existe', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null);
            });

            const coche = await service.getById(999);
            expect(coche).toBeNull();
        });
    });

    describe('extractMarcaModelo', () => {
        it('debe extraer marca y modelo correctamente', () => {
            const result = service.extractMarcaModelo('Toyota Corolla');
            expect(result.marca).toBe('Toyota');
            expect(result.modelo).toBe('Corolla');
        });

        it('debe manejar modelo sin marca', () => {
            const result = service.extractMarcaModelo('Corolla');
            expect(result.marca).toBe('Corolla');
            expect(result.modelo).toBe('Corolla');
        });
    });

    describe('create', () => {
        it('debe crear un nuevo coche', async () => {
            const cocheData = {
                matricula: 'ABC1234',
                chasis: 'CH123456',
                color: 'Rojo',
                kms: 50000,
                modelo: 'Toyota Corolla',
                marca: 'Toyota'
            };

            mockDb.run.mockImplementation((query, params, callback) => {
                const coche = {
                    id: 1,
                    ...cocheData
                };
                callback(null, { lastID: 1, changes: 1 });
            });

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null); // No existe coche con esa matrícula
            });

            const resultado = await service.create(cocheData);
            expect(resultado).toHaveProperty('id');
            expect(resultado.matricula).toBe(cocheData.matricula);
        });

        it('debe lanzar error si faltan campos obligatorios', async () => {
            const cocheData = {
                matricula: 'ABC1234'
                // Faltan campos requeridos
            };

            await expect(service.create(cocheData)).rejects.toThrow('Faltan datos requeridos');
        });

        it('debe lanzar error si la matrícula ya existe', async () => {
            const cocheData = {
                matricula: 'ABC1234',
                chasis: 'CH123456',
                color: 'Rojo',
                kms: 50000,
                modelo: 'Toyota Corolla'
            };

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, matricula: 'ABC1234' }); // Coche ya existe
            });

            await expect(service.create(cocheData)).rejects.toThrow('La matrícula ya existe');
        });
    });

    describe('isVendido', () => {
        it('debe retornar true si el coche está vendido', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, vendido: 1 });
            });

            const vendido = await service.isVendido(1);
            expect(vendido).toBe(true);
        });

        it('debe retornar false si el coche no está vendido', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null);
            });

            const vendido = await service.isVendido(1);
            expect(vendido).toBe(false);
        });
    });
});



