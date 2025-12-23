const ProductoController = require('../controllers/productoController');
const ProductoService = require('../services/productoService');

// Mock de dependencias
jest.mock('../services/productoService');

describe('ProductoController', () => {
    let controller;
    let mockDb;
    let mockLogger;
    let mockCacheManager;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockDb = {};
        mockLogger = {
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            operationCreate: jest.fn(),
            operationUpdate: jest.fn(),
            operationDelete: jest.fn()
        };
        mockCacheManager = {
            invalidatePattern: jest.fn()
        };

        controller = new ProductoController(mockDb, mockLogger, mockCacheManager);

        mockReq = {
            params: {},
            query: {},
            body: {}
        };

        mockRes = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn().mockReturnThis()
        };
    });

    describe('getAll', () => {
        it('debe obtener todos los productos exitosamente', async () => {
            const mockProductos = [
                { id: 1, codigo: 'PROD001' },
                { id: 2, codigo: 'PROD002' }
            ];

            jest.spyOn(controller.service, 'getAll').mockResolvedValue(mockProductos);

            await controller.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockProductos
            });
        });

        it('debe manejar errores correctamente', async () => {
            const error = new Error('Error de base de datos');
            jest.spyOn(controller.service, 'getAll').mockRejectedValue(error);

            await controller.getAll(mockReq, mockRes);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getById', () => {
        it('debe obtener un producto por ID', async () => {
            const mockProducto = { id: 1, codigo: 'PROD001' };
            mockReq.params.id = '1';

            jest.spyOn(controller.service, 'getById').mockResolvedValue(mockProducto);

            await controller.getById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockProducto
            });
        });

        it('debe retornar 404 si el producto no existe', async () => {
            mockReq.params.id = '999';
            jest.spyOn(controller.service, 'getById').mockResolvedValue(null);

            await controller.getById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('create', () => {
        it('debe crear un nuevo producto', async () => {
            const productoData = {
                codigo: 'PROD001',
                descripcion: 'Producto Test',
                precio: 100.50
            };
            mockReq.body = productoData;

            const createdProducto = { id: 1, ...productoData };
            jest.spyOn(controller.service, 'create').mockResolvedValue(createdProducto);

            await controller.create(mockReq, mockRes);

            expect(mockLogger.operationCreate).toHaveBeenCalled();
            expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('productos:*');
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: createdProducto
            });
        });

        it('debe manejar errores de validación', async () => {
            const error = new Error('El código ya existe');
            error.code = 'DUPLICATE_CODIGO';
            error.statusCode = 409;

            mockReq.body = { codigo: 'PROD001' };
            jest.spyOn(controller.service, 'create').mockRejectedValue(error);

            await controller.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });
    });

    describe('createDesdeCoche', () => {
        it('debe crear un producto desde un coche', async () => {
            mockReq.body = {
                coche_id: 1,
                precio: 15000,
                cantidad: 1
            };

            const createdProducto = {
                id: 1,
                codigo: 'ABC1234',
                descripcion: 'Toyota Corolla - ABC1234',
                precio: 15000,
                categoria: 'vehiculo'
            };

            jest.spyOn(controller.service, 'createDesdeCoche').mockResolvedValue(createdProducto);

            await controller.createDesdeCoche(mockReq, mockRes);

            expect(mockLogger.operationCreate).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: createdProducto
            });
        });

        it('debe validar campos obligatorios', async () => {
            mockReq.body = {
                coche_id: 1
                // Falta precio
            };

            await controller.createDesdeCoche(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(400);
        });
    });

    describe('update', () => {
        it('debe actualizar un producto', async () => {
            mockReq.params.id = '1';
            mockReq.body = { precio: 120.00 };

            const updatedProducto = { id: 1, codigo: 'PROD001', precio: 120.00 };
            jest.spyOn(controller.service, 'update').mockResolvedValue({ id: 1, changes: 1 });
            jest.spyOn(controller.service, 'getById').mockResolvedValue(updatedProducto);

            await controller.update(mockReq, mockRes);

            expect(mockLogger.operationUpdate).toHaveBeenCalled();
            expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('productos:*');
        });
    });
});



