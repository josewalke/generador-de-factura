const CocheController = require('../controllers/cocheController');
const CocheService = require('../services/cocheService');

// Mock de dependencias
jest.mock('../services/cocheService');

describe('CocheController', () => {
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
            invalidatePattern: jest.fn(),
            verifyAndCorrect: jest.fn(),
            set: jest.fn()
        };

        controller = new CocheController(mockDb, mockLogger, mockCacheManager);

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
        it('debe obtener todos los coches exitosamente', async () => {
            const mockCoches = [
                { id: 1, matricula: 'ABC1234' },
                { id: 2, matricula: 'XYZ5678' }
            ];

            mockCacheManager.verifyAndCorrect.mockResolvedValue(null);
            jest.spyOn(controller.service, 'getAll').mockResolvedValue(mockCoches);

            await controller.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockCoches
            });
        });

        it('debe usar caché si está disponible', async () => {
            const cachedData = [{ id: 1, matricula: 'ABC1234' }];
            mockCacheManager.verifyAndCorrect.mockResolvedValue(cachedData);

            await controller.getAll(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: cachedData
            });
        });

        it('debe manejar errores correctamente', async () => {
            const error = new Error('Error de base de datos');
            mockCacheManager.verifyAndCorrect.mockResolvedValue(null);
            jest.spyOn(controller.service, 'getAll').mockRejectedValue(error);

            await controller.getAll(mockReq, mockRes);

            expect(mockLogger.error).toHaveBeenCalled();
            expect(mockRes.status).toHaveBeenCalledWith(500);
        });
    });

    describe('getById', () => {
        it('debe obtener un coche por ID', async () => {
            const mockCoche = { id: 1, matricula: 'ABC1234' };
            mockReq.params.id = '1';

            jest.spyOn(controller.service, 'getById').mockResolvedValue(mockCoche);

            await controller.getById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockCoche
            });
        });

        it('debe retornar 404 si el coche no existe', async () => {
            mockReq.params.id = '999';
            jest.spyOn(controller.service, 'getById').mockResolvedValue(null);

            await controller.getById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('create', () => {
        it('debe crear un nuevo coche', async () => {
            const cocheData = {
                matricula: 'ABC1234',
                chasis: 'CH123456',
                color: 'Rojo',
                kms: 50000,
                modelo: 'Toyota Corolla'
            };
            mockReq.body = cocheData;

            const createdCoche = { id: 1, ...cocheData };
            jest.spyOn(controller.service, 'create').mockResolvedValue(createdCoche);

            await controller.create(mockReq, mockRes);

            expect(mockLogger.operationCreate).toHaveBeenCalled();
            expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('coches:*');
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: createdCoche
            });
        });

        it('debe manejar errores de validación', async () => {
            const error = new Error('La matrícula ya existe');
            error.code = 'DUPLICATE_MATRICULA';
            error.statusCode = 409;

            mockReq.body = { matricula: 'ABC1234' };
            jest.spyOn(controller.service, 'create').mockRejectedValue(error);

            await controller.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });
    });

    describe('update', () => {
        it('debe actualizar un coche', async () => {
            mockReq.params.id = '1';
            mockReq.body = { color: 'Azul' };

            const updatedCoche = { id: 1, matricula: 'ABC1234', color: 'Azul' };
            jest.spyOn(controller.service, 'update').mockResolvedValue({ id: 1, changes: 1 });
            jest.spyOn(controller.service, 'getById').mockResolvedValue(updatedCoche);

            await controller.update(mockReq, mockRes);

            expect(mockLogger.operationUpdate).toHaveBeenCalled();
            expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('coches:*');
        });

        it('debe rechazar actualización de coche vendido', async () => {
            const error = new Error('No se puede modificar un vehículo vendido');
            error.code = 'COCHE_VENDIDO';
            error.statusCode = 403;

            mockReq.params.id = '1';
            jest.spyOn(controller.service, 'update').mockRejectedValue(error);

            await controller.update(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(403);
        });
    });
});



