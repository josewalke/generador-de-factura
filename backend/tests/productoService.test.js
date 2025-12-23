const ProductoService = require('../services/productoService');

// Mock de base de datos
const createMockDb = () => {
    const productos = [];
    let idCounter = 1;

    return {
        all: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            callback(null, productos);
        }),
        get: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const id = params[0] || params[1];
            const producto = productos.find(p => p.id === parseInt(id) || p.codigo === id);
            callback(null, producto || null);
        }),
        run: jest.fn((query, params, callback) => {
            if (typeof params === 'function') {
                callback = params;
                params = [];
            }
            const producto = {
                id: idCounter++,
                codigo: params[0],
                descripcion: params[1],
                precio: params[2],
                stock: params[3],
                categoria: params[4]
            };
            productos.push(producto);
            callback(null, { lastID: producto.id, changes: 1 });
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

describe('ProductoService', () => {
    let service;
    let mockDb;
    let mockLogger;

    beforeEach(() => {
        mockDb = createMockDb();
        mockLogger = createMockLogger();
        service = new ProductoService(mockDb, mockLogger);
    });

    describe('getAll', () => {
        it('debe obtener todos los productos activos', async () => {
            const productos = await service.getAll();
            expect(mockDb.all).toHaveBeenCalled();
            expect(Array.isArray(productos)).toBe(true);
        });
    });

    describe('getById', () => {
        it('debe obtener un producto por ID', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, codigo: 'PROD001' });
            });

            const producto = await service.getById(1);
            expect(mockDb.get).toHaveBeenCalled();
            expect(producto).toHaveProperty('id', 1);
        });

        it('debe retornar null si el producto no existe', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null);
            });

            const producto = await service.getById(999);
            expect(producto).toBeNull();
        });
    });

    describe('buscarPorCodigo', () => {
        it('debe buscar un producto por código', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, codigo: 'PROD001', descripcion: 'Producto Test' });
            });

            const producto = await service.buscarPorCodigo('PROD001');
            expect(producto).toHaveProperty('codigo', 'PROD001');
        });
    });

    describe('create', () => {
        it('debe crear un nuevo producto', async () => {
            const productoData = {
                codigo: 'PROD001',
                descripcion: 'Producto Test',
                precio: 100.50,
                stock: 10,
                categoria: 'vehiculo'
            };

            mockDb.run.mockImplementation((query, params, callback) => {
                const producto = {
                    id: 1,
                    ...productoData
                };
                callback(null, { lastID: 1, changes: 1 });
            });

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null); // No existe producto con ese código
            });

            const resultado = await service.create(productoData);
            expect(resultado).toHaveProperty('id');
            expect(resultado.codigo).toBe(productoData.codigo);
        });

        it('debe lanzar error si faltan campos obligatorios', async () => {
            const productoData = {
                codigo: 'PROD001'
                // Faltan descripcion y precio
            };

            await expect(service.create(productoData)).rejects.toThrow('Campos obligatorios faltantes');
        });

        it('debe lanzar error si el código ya existe', async () => {
            const productoData = {
                codigo: 'PROD001',
                descripcion: 'Producto Test',
                precio: 100.50
            };

            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, { id: 1, codigo: 'PROD001' }); // Producto ya existe
            });

            await expect(service.create(productoData)).rejects.toThrow('El código ya existe');
        });
    });

    describe('createDesdeCoche', () => {
        it('debe crear un producto desde un coche', async () => {
            const mockCoche = {
                id: 1,
                matricula: 'ABC1234',
                modelo: 'Toyota Corolla',
                color: 'Rojo',
                kms: 50000
            };

            mockDb.get
                .mockImplementationOnce((query, params, callback) => {
                    // Primera llamada: obtener coche
                    callback(null, mockCoche);
                })
                .mockImplementationOnce((query, params, callback) => {
                    // Segunda llamada: verificar código
                    callback(null, null); // No existe producto con ese código
                });

            mockDb.run.mockImplementation((query, params, callback) => {
                callback(null, { lastID: 1, changes: 1 });
            });

            const resultado = await service.createDesdeCoche(1, 15000, 1);
            expect(resultado).toHaveProperty('id');
            expect(resultado.codigo).toBe('ABC1234');
            expect(resultado.categoria).toBe('vehiculo');
        });

        it('debe lanzar error si el coche no existe', async () => {
            mockDb.get.mockImplementation((query, params, callback) => {
                callback(null, null); // Coche no existe
            });

            await expect(service.createDesdeCoche(999, 15000)).rejects.toThrow('Coche no encontrado');
        });
    });
});



