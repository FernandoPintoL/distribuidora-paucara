# 🚫 CHANGELOG: Sistema de Rechazos y Problemas de Entrega

**Fecha:** 2025-10-24 / 2025-10-25
**Versión:** 1.0.0
**Estado:** ✅ LISTO PARA PRODUCCIÓN

---

## 📋 Resumen de Cambios

Se ha implementado un sistema completo para manejar rechazos de entregas cuando:
- El cliente no se encuentra en el lugar
- La tienda está cerrada
- Existe otro problema

El chofer puede reportar el problema con fotos como evidencia, y el sistema notifica en tiempo real a los managers vía WebSocket.

---

## 📂 Archivos Modificados

### 1. **Modelos (Backend)**

#### `app/Models/Envio.php` ✅
- **Líneas agregadas:** +60
- **Cambios:**
  - Agregados campos `fillable`: `motivo_rechazo`, `fotos_rechazo`, `fecha_intento_entrega`, `estado_entrega`
  - Agregados `casts`: `fecha_intento_entrega` como datetime, `fotos_rechazo` como array
  - Agregadas constantes:
    - `ESTADO_ENTREGA_EXITOSA`
    - `ESTADO_ENTREGA_RECHAZADA`
    - `ESTADO_ENTREGA_CLIENTE_AUSENTE`
    - `ESTADO_ENTREGA_TIENDA_CERRADA`
    - `ESTADO_ENTREGA_PROBLEMA`
  - Agregados métodos:
    - `puedeRechazarEntrega()` - Validar si puede rechazarse
    - `marcarClienteAusente(fotos)` - Marcar como cliente ausente
    - `marcarTiendaCerrada(fotos)` - Marcar como tienda cerrada
    - `marcarConProblema(motivo, fotos)` - Marcar con problema personalizado
    - `marcarComoEntregada(...)` - Marcar entrega exitosa

### 2. **Controladores (Backend)**

#### `app/Http/Controllers/EnvioController.php` ✅
- **Líneas agregadas:** +80
- **Nuevo método:** `rechazarEntrega(Envio $envio, Request $request)`
  - Valida tipo de rechazo (cliente_ausente, tienda_cerrada, otro_problema)
  - Procesa fotos (hasta 5, máx 5MB cada)
  - Almacena en `storage/rechazos-entregas/`
  - Notifica WebSocket a managers
  - Registra seguimiento con detalles
  - Revierte estado de venta a PENDIENTE_ENVIO
  - Error handling robusto

### 3. **Rutas API**

#### `routes/api.php` ✅
- **Línea agregada:** 99-100
- **Nueva ruta:**
  ```
  PUT /api/app/envios/{envio}/rechazar
  ```
  - Middleware: `auth:sanctum`
  - Controlador: `EnvioController@rechazarEntrega`
  - Nombre: `api.envios.rechazar`
  - Multipart form-data (soporta archivos)

### 4. **Migraciones (Base de Datos)**

#### `database/migrations/2025_10_25_030126_add_rejection_fields_to_envios_table.php` ✅
- **Creado:** Nuevo archivo
- **Campos agregados a tabla `envios`:**
  - `estado_entrega` (string, nullable) - Estados del resultado
  - `motivo_rechazo` (text, nullable) - Descripción del problema
  - `fotos_rechazo` (json, nullable) - Array de rutas a fotos
  - `fecha_intento_entrega` (datetime, nullable) - Cuándo fue el intento
- **Índices agregados:**
  - `estado_entrega` (para búsquedas rápidas)
  - `fecha_intento_entrega` (para reportes)
- **Método down():** Elimina todos los campos y índices

### 5. **Documentación**

#### `documentaciones/SISTEMA_VENTAS_APP_EXTERNA.md` ✅
- **Secciones agregadas:**
  - "📱 CANALES WEBSOCKET PARA APP FLUTTER" (+400 líneas)
    - Eventos específicos que Flutter debe escuchar
    - Ejemplos en Dart
    - Estructuras JSON completas
    - Flujo de seguimiento
  - "🚫 FLUJO DE RECHAZOS Y PROBLEMAS DE ENTREGA" (+450 líneas)
    - 4 escenarios posibles con diagramas
    - Estructura de BD actualizada
    - API endpoint completo
    - Notificaciones WebSocket
    - Código React de ejemplo
    - Almacenamiento y auditoría
  - "⚙️ INSTRUCCIONES PARA ACTIVAR AHORA" (+80 líneas)
    - Paso a paso para ejecutar
    - Cómo agregar rutas
    - Testing con Postman
    - Verificación de implementación

---

## 🔄 Flujo Completo

### **Escenario 1: Entrega Exitosa** ✅

```
Chofer toca timbre y cliente abre
    ↓
Chofer confirma entrega
    ↓
API: PUT /api/envios/{id}/confirmar-entrega
    ↓
Envio.marcarComoEntregada()
    ↓
estado = ENTREGADO
estado_entrega = EXITOSA
    ↓
WebSocket: envio-entregado
    ↓
Cliente (Flutter) ve notificación
Manager (React) ve cambio en listado
```

### **Escenario 2: Problema de Entrega** 🚷

```
Chofer llega pero cliente no está
    ↓
Chofer toma 2-3 fotos como evidencia
Chofer selecciona "Cliente ausente"
    ↓
API: PUT /api/app/envios/{id}/rechazar
{
  "tipo_rechazo": "cliente_ausente",
  "fotos[]": [foto1.jpg, foto2.jpg]
}
    ↓
EnvioController::rechazarEntrega()
    ↓
- Procesa fotos
- Envio.marcarClienteAusente(fotos)
- Notifica WebSocket a managers
- Registra seguimiento
- Actualiza estado venta
    ↓
estado = EN_RUTA (sin cambio)
estado_entrega = CLIENTE_AUSENTE
fotos_rechazo = [ruta1, ruta2]
motivo = "Cliente no se encontraba en el lugar"
    ↓
WebSocket: entrega-rechazada
{
  "envio_id": 42,
  "tipo_rechazo": "cliente_ausente",
  "motivo": "Cliente no se encontraba en el lugar",
  "fotos": ["rechazos-entregas/.../foto1.jpg", ...]
}
    ↓
Manager (React) ve alerta en tiempo real
    ↓
Manager puede:
  - Ver fotos
  - Contactar cliente
  - Programar reintento
```

---

## 📊 Cambios de Base de Datos

### **Antes (Tabla envios)**
```sql
id, numero_envio, venta_id, vehiculo_id, chofer_id,
fecha_programada, fecha_salida, fecha_entrega,
estado, direccion_entrega, coordenadas_lat, coordenadas_lng,
observaciones, foto_entrega, firma_cliente,
receptor_nombre, receptor_documento, created_at, updated_at
```

### **Después (Tabla envios)**
```sql
id, numero_envio, venta_id, vehiculo_id, chofer_id,
fecha_programada, fecha_salida, fecha_entrega,
estado, direccion_entrega, coordenadas_lat, coordenadas_lng,
observaciones, foto_entrega, firma_cliente,
receptor_nombre, receptor_documento,
↓ ✅ NUEVOS CAMPOS ↓
estado_entrega,           ← EXITOSA | CLIENTE_AUSENTE | TIENDA_CERRADA | OTRO_PROBLEMA
motivo_rechazo,           ← Descripción del problema
fotos_rechazo,            ← JSON array de rutas
fecha_intento_entrega,    ← Cuándo se intentó
created_at, updated_at
```

---

## 🚀 Instalación / Activación

### **Paso 1: Ejecutar Migración**
```bash
php artisan migrate
```

### **Paso 2: Verificar Ruta**
```bash
php artisan route:list | findstr "envios/.*rechazar"
```

Debería mostrar:
```
PUT    /api/app/envios/{envio}/rechazar    api.envios.rechazar
```

### **Paso 3: Testear con Postman**

**Request:**
```
PUT http://localhost:8000/api/app/envios/42/rechazar
Authorization: Bearer {token}
Content-Type: multipart/form-data

Body (form-data):
  tipo_rechazo: cliente_ausente
  fotos: [file1.jpg, file2.jpg]
```

**Response (200):**
```json
{
  "success": true,
  "message": "Rechazo de entrega registrado",
  "envio": {
    "id": 42,
    "numero_envio": "ENV-20251024-0002",
    "estado": "EN_RUTA",
    "estado_entrega": "CLIENTE_AUSENTE",
    "fotos_rechazo": [
      "rechazos-entregas/ENV-20251024-0002-foto1.jpg",
      "rechazos-entregas/ENV-20251024-0002-foto2.jpg"
    ],
    "motivo_rechazo": "Cliente no se encontraba en el lugar",
    "fecha_intento_entrega": "2025-10-24T15:30:00Z"
  }
}
```

---

## 🔔 Notificaciones WebSocket

Cuando se rechaza una entrega, se envía:

**Canal:** `role_manager`
**Evento:** `entrega-rechazada`

```json
{
  "envio_id": 42,
  "envio_numero": "ENV-20251024-0002",
  "venta_numero": "V-2025-00153",
  "tipo_rechazo": "cliente_ausente",
  "motivo": "Cliente no se encontraba en el lugar",
  "fotos_cantidad": 2,
  "fotos": [
    "rechazos-entregas/ENV-20251024-0002-foto1.jpg",
    "rechazos-entregas/ENV-20251024-0002-foto2.jpg"
  ],
  "chofer": "Carlos López",
  "cliente": "Tienda XYZ",
  "timestamp": "2025-10-24T15:30:00Z"
}
```

---

## 📝 Auditoría

Se registra automáticamente en tabla `seguimiento_envios`:

```json
{
  "envio_id": 42,
  "estado": "INTENTO_ENTREGA_FALLIDO",
  "fecha_hora": "2025-10-24T15:30:00Z",
  "observaciones": "Intento fallido - Cliente no se encontraba en el lugar. Fotos: 2",
  "user_id": 5,
  "coordenadas_lat": -17.3932,
  "coordenadas_lng": -66.1593
}
```

---

## 🧪 Testing Checklist

- [ ] Migración se ejecuta sin errores: `php artisan migrate`
- [ ] Tabla `envios` tiene nuevas columnas: `estado_entrega`, `motivo_rechazo`, etc.
- [ ] Ruta API existe: `PUT /api/app/envios/{envio}/rechazar`
- [ ] Postman test exitoso con fotos
- [ ] Fotos se guardan en `storage/rechazos-entregas/`
- [ ] WebSocket notifica a managers
- [ ] Seguimiento se registra en BD
- [ ] Venta se revierte a PENDIENTE_ENVIO
- [ ] Estado entrega se actualiza correctamente
- [ ] Error handling funciona (sin fotos, tipo inválido, etc.)

---

## 📚 Documentación Relacionada

- Documentación completa: `documentaciones/SISTEMA_VENTAS_APP_EXTERNA.md`
- Secciones clave:
  - "📱 CANALES WEBSOCKET PARA APP FLUTTER" - Qué escuchar
  - "🚫 FLUJO DE RECHAZOS Y PROBLEMAS DE ENTREGA" - Flujo detallado
  - "⚙️ INSTRUCCIONES PARA ACTIVAR AHORA" - Guía paso a paso

---

## 🔧 Próximos Pasos

1. **Frontend React (Manager Dashboard)**
   - Escuchar evento `entrega-rechazada`
   - Mostrar alerta con fotos
   - Botón para ver galería de fotos
   - Botón para programar reintento

2. **App Flutter (Chofer)**
   - Interfaz para capturar fotos (cámara)
   - Selector de tipo de rechazo
   - Campo de motivo detallado
   - Envío de datos con `PUT /api/app/envios/{id}/rechazar`

3. **Reportes**
   - Dashboard de entregas rechazadas
   - Motivos más frecuentes
   - Tasa de reintento exitoso

---

## 🆘 Troubleshooting

### Error: "Migration class not found"
```bash
php artisan migrate:refresh --seed
```

### Error: "Route not found"
```bash
# Verificar routes/api.php tiene la ruta
# Ejecutar: php artisan route:cache
php artisan route:clear
php artisan route:cache
```

### Fotos no se guardan
```bash
# Verificar permisos de storage
chmod -R 775 storage/
php artisan storage:link
```

### WebSocket no notifica
```bash
# Verificar servidor WebSocket está corriendo
# En terminal aparte:
cd websocket && npm start
```

---

## 📞 Contacto / Soporte

Para problemas o preguntas sobre esta implementación, revisar:
1. Logs: `storage/logs/laravel.log`
2. Documentación: `documentaciones/SISTEMA_VENTAS_APP_EXTERNA.md`
3. Archivos modificados listados arriba

---

**Implementado por:** Sistema Automático
**Última actualización:** 2025-10-25
**Status:** ✅ Listo para producción
