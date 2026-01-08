# Variables de Entorno para Railway (Producción)

## 📋 Configuración Requerida en Railway

Cuando despliegues la aplicación en Railway, configura las siguientes variables de entorno en el panel de Railway:

### 1. **Base de Datos**
```
DB_CONNECTION=pgsql
DB_HOST=<tu-host-railway>
DB_PORT=5432
DB_DATABASE=<tu-db-name>
DB_USERNAME=<tu-usuario>
DB_PASSWORD=<tu-contraseña>
```

### 2. **Aplicación**
```
APP_NAME=Distribuidora Paucara
APP_ENV=production
APP_KEY=<tu-app-key-generado-localmente>
APP_DEBUG=false
APP_URL=https://<tu-dominio-railway>.railway.app
```

### 3. **WebSocket (Opcional)**

**Si NO usas WebSocket en producción** (recomendado):
```
WEBSOCKET_ENABLED=false
```

**Si SÍ usas WebSocket**, configura:
```
WEBSOCKET_ENABLED=true
WEBSOCKET_URL=https://<tu-websocket-url>
WEBSOCKET_DEBUG=false
WEBSOCKET_TIMEOUT=5
WEBSOCKET_RETRY_ENABLED=true
WEBSOCKET_RETRY_TIMES=2
WEBSOCKET_RETRY_SLEEP=100
```

### 4. **Autenticación (Optional)**
```
SANCTUM_STATEFUL_DOMAINS=<tu-dominio-railway>
SESSION_DOMAIN=<tu-dominio-railway>
```

## 🔐 Seguridad

### **Generar APP_KEY localmente:**
```bash
php artisan key:generate --show
```
Copia el valor y pégalo en `APP_KEY` en Railway.

### **Comportamiento Automático:**
- ✅ **Desarrollo** (`APP_ENV=local`): WebSocket habilitado por defecto
- ✅ **Producción** (`APP_ENV=production`): WebSocket deshabilitado por defecto (más seguro)

## 🚀 Deploy Checklist

- [ ] Configura todas las variables en Railway
- [ ] Ejecuta migraciones: `php artisan migrate --force` (en Railway)
- [ ] Verifica logs en Railway si hay errores
- [ ] Prueba la aplicación en `https://<tu-dominio>`

## 🔧 Troubleshooting

### Error: "WebSocket connection failed"
→ **Solución**: Establece `WEBSOCKET_ENABLED=false` si no usas WebSocket en producción.

### Error: "Invalid database configuration"
→ **Solución**: Verifica que `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` sean correctos.

### Error: "APP_KEY not set"
→ **Solución**: Genera una APP_KEY localmente con `php artisan key:generate --show`.
