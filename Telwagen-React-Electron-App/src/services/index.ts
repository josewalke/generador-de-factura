// Exportar todos los servicios
export { default as apiClient } from './apiClient';
export { clienteService } from './clienteService';
export { cocheService } from './cocheService';
export { empresaService } from './empresaService';
export { facturaService } from './facturaService';

// Exportar tipos
export type { Cliente, ClienteCreateData, ClienteUpdateData } from './clienteService';
export type { Coche, CocheCreateData, CocheUpdateData } from './cocheService';
export type { Empresa, EmpresaCreateData, EmpresaUpdateData, EmpresaPaginatedResponse } from './empresaService';
export type { Factura, FacturaCreateData, FacturaUpdateData, FacturaPaginatedResponse, FacturaFilters } from './facturaService';
