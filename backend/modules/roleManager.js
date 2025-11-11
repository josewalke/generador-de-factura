/**
 * Sistema de Gestión de Roles y Permisos
 * Maneja la autorización y control de acceso basado en roles
 */

class RoleManager {
    constructor() {
        // Definir roles y sus permisos
        this.roles = {
            'admin': {
                name: 'Administrador',
                description: 'Acceso completo al sistema',
                permissions: [
                    'users.create', 'users.read', 'users.update', 'users.delete',
                    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
                    'clients.create', 'clients.read', 'clients.update', 'clients.delete',
                    'products.create', 'products.read', 'products.update', 'products.delete',
                    'vehicles.create', 'vehicles.read', 'vehicles.update', 'vehicles.delete',
                    'reports.read', 'reports.export',
                    'settings.read', 'settings.update',
                    'backup.create', 'backup.restore',
                    'logs.read', 'logs.export',
                    'certificates.manage',
                    'security.monitor'
                ]
            },
            'manager': {
                name: 'Gerente',
                description: 'Gestión de operaciones comerciales',
                permissions: [
                    'invoices.create', 'invoices.read', 'invoices.update', 'invoices.delete',
                    'clients.create', 'clients.read', 'clients.update', 'clients.delete',
                    'products.create', 'products.read', 'products.update', 'products.delete',
                    'vehicles.create', 'vehicles.read', 'vehicles.update', 'vehicles.delete',
                    'reports.read', 'reports.export',
                    'settings.read'
                ]
            },
            'operator': {
                name: 'Operador',
                description: 'Operaciones básicas de facturación',
                permissions: [
                    'invoices.create', 'invoices.read', 'invoices.update',
                    'clients.read',
                    'products.read',
                    'vehicles.read',
                    'reports.read'
                ]
            },
            'viewer': {
                name: 'Visualizador',
                description: 'Solo lectura de información',
                permissions: [
                    'invoices.read',
                    'clients.read',
                    'products.read',
                    'vehicles.read',
                    'reports.read'
                ]
            }
        };

        // Recursos del sistema
        this.resources = [
            'users', 'invoices', 'clients', 'products', 'vehicles', 
            'reports', 'settings', 'backup', 'logs', 'certificates', 'security'
        ];

        // Acciones disponibles
        this.actions = ['create', 'read', 'update', 'delete', 'export', 'manage', 'monitor', 'restore'];
    }

    /**
     * Obtiene todos los roles disponibles
     * @returns {Object} Objeto con todos los roles
     */
    getAllRoles() {
        return this.roles;
    }

    /**
     * Obtiene información de un rol específico
     * @param {string} roleName - Nombre del rol
     * @returns {Object|null} Información del rol o null si no existe
     */
    getRoleInfo(roleName) {
        return this.roles[roleName] || null;
    }

    /**
     * Obtiene los permisos de un rol específico
     * @param {string} roleName - Nombre del rol
     * @returns {Array} Array de permisos del rol
     */
    getRolePermissions(roleName) {
        const role = this.roles[roleName];
        return role ? role.permissions : [];
    }

    /**
     * Verifica si un rol tiene un permiso específico
     * @param {string} roleName - Nombre del rol
     * @param {string} permission - Permiso a verificar
     * @returns {boolean} True si tiene el permiso, false en caso contrario
     */
    hasPermission(roleName, permission) {
        const permissions = this.getRolePermissions(roleName);
        return permissions.includes(permission);
    }

    /**
     * Verifica si un rol puede acceder a un recurso con una acción específica
     * @param {string} roleName - Nombre del rol
     * @param {string} resource - Recurso a acceder
     * @param {string} action - Acción a realizar
     * @returns {boolean} True si puede acceder, false en caso contrario
     */
    canAccess(roleName, resource, action) {
        const permission = `${resource}.${action}`;
        return this.hasPermission(roleName, permission);
    }

    /**
     * Verifica si un rol existe
     * @param {string} roleName - Nombre del rol
     * @returns {boolean} True si el rol existe, false en caso contrario
     */
    roleExists(roleName) {
        return this.roles.hasOwnProperty(roleName);
    }

    /**
     * Obtiene la lista de recursos disponibles
     * @returns {Array} Array de recursos
     */
    getResources() {
        return this.resources;
    }

    /**
     * Obtiene la lista de acciones disponibles
     * @returns {Array} Array de acciones
     */
    getActions() {
        return this.actions;
    }

    /**
     * Crea un nuevo rol (solo para administradores)
     * @param {string} roleName - Nombre del nuevo rol
     * @param {string} name - Nombre descriptivo
     * @param {string} description - Descripción del rol
     * @param {Array} permissions - Array de permisos
     * @returns {boolean} True si se creó exitosamente
     */
    createRole(roleName, name, description, permissions) {
        if (this.roleExists(roleName)) {
            return false; // El rol ya existe
        }

        this.roles[roleName] = {
            name: name,
            description: description,
            permissions: permissions || []
        };

        return true;
    }

    /**
     * Actualiza un rol existente
     * @param {string} roleName - Nombre del rol
     * @param {Object} updates - Objeto con las actualizaciones
     * @returns {boolean} True si se actualizó exitosamente
     */
    updateRole(roleName, updates) {
        if (!this.roleExists(roleName)) {
            return false; // El rol no existe
        }

        if (updates.name) this.roles[roleName].name = updates.name;
        if (updates.description) this.roles[roleName].description = updates.description;
        if (updates.permissions) this.roles[roleName].permissions = updates.permissions;

        return true;
    }

    /**
     * Elimina un rol (solo roles personalizados)
     * @param {string} roleName - Nombre del rol a eliminar
     * @returns {boolean} True si se eliminó exitosamente
     */
    deleteRole(roleName) {
        // No permitir eliminar roles del sistema
        const systemRoles = ['admin', 'manager', 'operator', 'viewer'];
        if (systemRoles.includes(roleName)) {
            return false;
        }

        if (this.roleExists(roleName)) {
            delete this.roles[roleName];
            return true;
        }

        return false;
    }

    /**
     * Valida un array de permisos
     * @param {Array} permissions - Array de permisos a validar
     * @returns {Object} Objeto con validación y errores
     */
    validatePermissions(permissions) {
        const errors = [];
        const validPermissions = [];

        permissions.forEach(permission => {
            const [resource, action] = permission.split('.');
            
            if (!this.resources.includes(resource)) {
                errors.push(`Recurso inválido: ${resource}`);
            } else if (!this.actions.includes(action)) {
                errors.push(`Acción inválida: ${action}`);
            } else {
                validPermissions.push(permission);
            }
        });

        return {
            isValid: errors.length === 0,
            errors: errors,
            validPermissions: validPermissions
        };
    }

    /**
     * Obtiene estadísticas de roles
     * @returns {Object} Estadísticas del sistema de roles
     */
    getRoleStats() {
        const totalRoles = Object.keys(this.roles).length;
        const totalPermissions = Object.values(this.roles)
            .reduce((total, role) => total + role.permissions.length, 0);

        return {
            totalRoles: totalRoles,
            totalPermissions: totalPermissions,
            averagePermissionsPerRole: totalPermissions / totalRoles,
            systemRoles: ['admin', 'manager', 'operator', 'viewer'],
            customRoles: Object.keys(this.roles).filter(role => 
                !['admin', 'manager', 'operator', 'viewer'].includes(role)
            )
        };
    }
}

module.exports = RoleManager;
