const ClienteController = require('../controllers/clienteController');
const ClienteService = require('../services/clienteService');

// Mock de dependencias
jest.mock('../services/clienteService');

describe('ClienteController', () => {
    let controller;
    let mockDb;
    let mockLogger;
    let mockCacheManager;
    let mockReq;
    let mockRes;

    beforeEach(() => {
        mockDb = {};
        mockLogger = {
            operationRead: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
            databaseQuery: jest.fn(),
            operationCreate: jest.fn(),
            operationUpdate: jest.fn(),
            operationDelete: jest.fn()
        };
        mockCacheManager = {
            invalidatePattern: jest.fn()
        };

        controller = new ClienteController(mockDb, mockLogger, mockCacheManager);

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
        it('debe obtener todos los clientes exitosamente', async () => {
            const mockClientes = [
                { id: 1, nombre: 'Cliente 1' },
                { id: 2, nombre: 'Cliente 2' }
            ];

            jest.spyOn(controller.service, 'getAll').mockResolvedValue(mockClientes);

            await controller.getAll(mockReq, mockRes);

            expect(mockLogger.operationRead).toHaveBeenCalled();
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockClientes
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
        it('debe obtener un cliente por ID', async () => {
            const mockCliente = { id: 1, nombre: 'Cliente 1' };
            mockReq.params.id = '1';

            jest.spyOn(controller.service, 'getById').mockResolvedValue(mockCliente);

            await controller.getById(mockReq, mockRes);

            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: mockCliente
            });
        });

        it('debe retornar 404 si el cliente no existe', async () => {
            mockReq.params.id = '999';
            jest.spyOn(controller.service, 'getById').mockResolvedValue(null);

            await controller.getById(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(404);
        });
    });

    describe('create', () => {
        it('debe crear un nuevo cliente', async () => {
            const clienteData = {
                nombre: 'Nuevo Cliente',
                direccion: 'Dirección',
                identificacion: '12345678A'
            };
            mockReq.body = clienteData;

            const createdCliente = { id: 1, ...clienteData };
            jest.spyOn(controller.service, 'create').mockResolvedValue(createdCliente);

            await controller.create(mockReq, mockRes);

            expect(mockLogger.operationCreate).toHaveBeenCalled();
            expect(mockCacheManager.invalidatePattern).toHaveBeenCalledWith('clientes:*');
            expect(mockRes.json).toHaveBeenCalledWith({
                success: true,
                data: createdCliente
            });
        });

        it('debe manejar errores de validación', async () => {
            const error = new Error('La identificación ya existe');
            error.code = 'DUPLICATE_IDENTIFICACION';
            error.statusCode = 409;

            mockReq.body = { nombre: 'Test', identificacion: '12345678A' };
            jest.spyOn(controller.service, 'create').mockRejectedValue(error);

            await controller.create(mockReq, mockRes);

            expect(mockRes.status).toHaveBeenCalledWith(409);
        });
    });
});



