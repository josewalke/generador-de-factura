// Servicio para comunicarse con el Backend API
const axios = require('axios');
const config = require('./config');

class ApiService {
    constructor() {
        this.baseUrl = config.apiUrl;
        this.endpoints = config.endpoints;
    }

    // Método genérico para hacer requests HTTP
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            let response;
            if (requestOptions.method === 'GET') {
                response = await axios.get(url, { headers: requestOptions.headers });
            } else if (requestOptions.method === 'POST') {
                response = await axios.post(url, requestOptions.body, { headers: requestOptions.headers });
            } else if (requestOptions.method === 'PUT') {
                response = await axios.put(url, requestOptions.body, { headers: requestOptions.headers });
            } else if (requestOptions.method === 'DELETE') {
                response = await axios.delete(url, { headers: requestOptions.headers });
            }
            
            return response.data;
        } catch (error) {
            console.error('Error en API request:', error);
            if (error.response) {
                throw new Error(error.response.data.error || `HTTP ${error.response.status}`);
            } else {
                throw error;
            }
        }
    }

    // Clientes
    async obtenerClientes() {
        return await this.makeRequest(this.endpoints.clientes);
    }

    async crearCliente(clienteData) {
        return await this.makeRequest(this.endpoints.clientes, {
            method: 'POST',
            body: JSON.stringify(clienteData)
        });
    }

    async buscarCliente(identificacion) {
        return await this.makeRequest(`${this.endpoints.buscarCliente}/${identificacion}`);
    }

    // Productos
    async obtenerProductos() {
        return await this.makeRequest(this.endpoints.productos);
    }

    async crearProducto(productoData) {
        return await this.makeRequest(this.endpoints.productos, {
            method: 'POST',
            body: JSON.stringify(productoData)
        });
    }

    async buscarProducto(codigo) {
        return await this.makeRequest(`${this.endpoints.buscarProducto}/${codigo}`);
    }

    // Facturas
    async obtenerFacturas() {
        return await this.makeRequest(this.endpoints.facturas);
    }

    async crearFactura(facturaData) {
        return await this.makeRequest(this.endpoints.facturas, {
            method: 'POST',
            body: JSON.stringify(facturaData)
        });
    }

    async obtenerFactura(id) {
        return await this.makeRequest(`${this.endpoints.facturas}/${id}`);
    }

    async obtenerSiguienteNumero() {
        return await this.makeRequest(this.endpoints.siguienteNumero);
    }

    // Verificar conexión con el backend
    async verificarConexion() {
        try {
            const response = await this.makeRequest(this.endpoints.docs);
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Métodos de utilidad
    async cargarDatosIniciales() {
        try {
            const [clientes, productos] = await Promise.all([
                this.obtenerClientes(),
                this.obtenerProductos()
            ]);

            return {
                success: true,
                data: {
                    clientes: clientes.data || [],
                    productos: productos.data || []
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Generar factura completa
    async generarFacturaCompleta(facturaData) {
        try {
            // 1. Crear o buscar cliente
            let cliente;
            try {
                cliente = await this.buscarCliente(facturaData.cliente.identificacion);
            } catch (error) {
                // Cliente no existe, crearlo
                cliente = await this.crearCliente({
                    nombre: facturaData.cliente.nombre,
                    direccion: facturaData.cliente.direccion,
                    identificacion: facturaData.cliente.identificacion
                });
            }

            // 2. Obtener siguiente número de factura
            const siguienteNumero = await this.obtenerSiguienteNumero();

            // 3. Crear factura
            const facturaCompleta = {
                numero_factura: siguienteNumero.data.numero_factura,
                cliente_id: cliente.data.id,
                fecha_emision: facturaData.fecha,
                fecha_vencimiento: this.calcularFechaVencimiento(facturaData.fecha),
                subtotal: facturaData.subtotal,
                igic: facturaData.igic,
                total: facturaData.total,
                notas: facturaData.notas || '',
                productos: facturaData.productos
            };

            const facturaCreada = await this.crearFactura(facturaCompleta);

            return {
                success: true,
                data: {
                    factura: facturaCreada.data,
                    cliente: cliente.data,
                    numero_factura: siguienteNumero.data.numero_factura
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Calcular fecha de vencimiento
    calcularFechaVencimiento(fechaEmision) {
        const fecha = new Date(fechaEmision);
        fecha.setDate(fecha.getDate() + config.facturacion.diasVencimiento);
        return fecha.toISOString().split('T')[0];
    }

    async obtenerCliente(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/clientes/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener cliente:', error);
            throw error;
        }
    }

    async actualizarCliente(id, clienteData) {
        try {
            const response = await axios.put(`${this.baseUrl}/api/clientes/${id}`, clienteData);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar cliente:', error);
            throw error;
        }
    }

    async desactivarCliente(id) {
        try {
            const response = await axios.delete(`${this.baseUrl}/api/clientes/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al desactivar cliente:', error);
            throw error;
        }
    }

    // Métodos para coches
    async obtenerCoches() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/coches`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener coches:', error);
            throw error;
        }
    }

    async obtenerCoche(id) {
        try {
            const response = await axios.get(`${this.baseUrl}/api/coches/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener coche:', error);
            throw error;
        }
    }

    async crearCoche(cocheData) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/coches`, cocheData);
            return response.data;
        } catch (error) {
            console.error('Error al crear coche:', error);
            throw error;
        }
    }

    async actualizarCoche(id, cocheData) {
        try {
            const response = await axios.put(`${this.baseUrl}/api/coches/${id}`, cocheData);
            return response.data;
        } catch (error) {
            console.error('Error al actualizar coche:', error);
            throw error;
        }
    }

    async desactivarCoche(id) {
        try {
            const response = await axios.delete(`${this.baseUrl}/api/coches/${id}`);
            return response.data;
        } catch (error) {
            console.error('Error al desactivar coche:', error);
            throw error;
        }
    }

    async obtenerCochesDisponibles() {
        try {
            const response = await axios.get(`${this.baseUrl}/api/coches/disponibles`);
            return response.data;
        } catch (error) {
            console.error('Error al obtener coches disponibles:', error);
            throw error;
        }
    }

    async crearProductoDesdeCoche(cocheId, precio, cantidad = 1) {
        try {
            const response = await axios.post(`${this.baseUrl}/api/productos/desde-coche`, {
                coche_id: cocheId,
                precio: precio,
                cantidad: cantidad
            });
            return response.data;
        } catch (error) {
            console.error('Error al crear producto desde coche:', error);
            throw error;
        }
    }

    // Empresas
    async obtenerEmpresas() {
        return await this.makeRequest('/api/empresas');
    }

    async obtenerEmpresa(id) {
        return await this.makeRequest(`/api/empresas/${id}`);
    }

    async crearEmpresa(empresaData) {
        return await this.makeRequest('/api/empresas', {
            method: 'POST',
            body: JSON.stringify(empresaData)
        });
    }

    async actualizarEmpresa(id, empresaData) {
        return await this.makeRequest(`/api/empresas/${id}`, {
            method: 'PUT',
            body: JSON.stringify(empresaData)
        });
    }

    async desactivarEmpresa(id) {
        return await this.makeRequest(`/api/empresas/${id}`, {
            method: 'DELETE'
        });
    }
}

module.exports = ApiService;
