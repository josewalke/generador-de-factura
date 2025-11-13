# 🌐 Configuración de ngrok para Acceso Externo

## 📋 Resumen

Este proyecto usa **ngrok** para permitir acceso al backend desde cualquier lugar del mundo sin necesidad de configurar routers.

## 🚀 Inicio Rápido

### En el Servidor (donde corre el backend):

1. **Instalar ngrok** (solo primera vez):
   ```powershell
   .\instalar-ngrok.ps1
   ```

2. **Configurar token** (solo primera vez):
   ```powershell
   .\configurar-ngrok-token.ps1
   ```
   Obtén tu token en: https://dashboard.ngrok.com/get-started/your-authtoken

3. **Iniciar todo**:
   ```powershell
   .\iniciar-todo.ps1
   ```
   O doble clic en: `iniciar-todo.bat`

Esto iniciará:
- ✅ Backend en puerto 3000
- ✅ ngrok creando túnel público
- ✅ Frontend configurado automáticamente

## 📱 En Otro Ordenador

Ver: `INSTRUCCIONES_OTRO_ORDENADOR.md`

## ⚠️ Importante

- **URL cambia cada vez** que reinicias ngrok (plan gratuito)
- **Visita la URL en el navegador** la primera vez para autorizar
- **Mantén abiertas** las ventanas de backend y ngrok

## 📚 Documentación Completa

- `INSTRUCCIONES_RAPIDAS_NGROK.md` - Guía rápida
- `LEER_PRIMERO_NGROK.md` - Documentación completa
- `INSTRUCCIONES_OTRO_ORDENADOR.md` - Para usar en otro PC

