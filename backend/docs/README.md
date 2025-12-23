# 📚 Documentación del Proyecto - Generador de Facturas

## Índice

- [Configuración](./CONFIGURACION.md) - Guía completa de configuración
- [Migraciones](./MIGRACIONES.md) - Sistema de migraciones de base de datos
- [Arquitectura](./ARQUITECTURA.md) - Estructura y diseño del sistema

---

## 🚀 Inicio Rápido

### Requisitos

- Node.js 16+ 
- npm o yarn
- SQLite (incluido) o PostgreSQL (opcional)

### Instalación

```bash
cd backend
npm install
```

### Configuración

1. Copia `env.example` a `.env`
2. Configura las variables de entorno necesarias
3. Ver [Configuración](./CONFIGURACION.md) para más detalles

### Ejecución

```bash
# Desarrollo
npm run dev

# Producción
npm start
```

---

## 📁 Estructura del Proyecto

```
backend/
├── config/          # Configuración
├── controllers/     # Controladores (lógica de request/response)
├── services/        # Servicios (lógica de negocio)
├── routes/          # Rutas de API
├── modules/         # Módulos del sistema
├── middlewares/     # Middlewares de Express
├── migrations/      # Migraciones de base de datos
├── utils/           # Utilidades
├── docs/            # Documentación
└── server.js        # Punto de entrada
```

---

## 🔗 Enlaces Útiles

- [Guía de Configuración](./CONFIGURACION.md)
- [Sistema de Migraciones](./MIGRACIONES.md)
- [Mejoras de Rendimiento](../MEJORAS_RENDIMIENTO.md)

---

**Última actualización**: 2025-01-27

