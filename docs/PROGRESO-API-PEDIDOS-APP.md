# 📱 API de Pedidos para App de Clientes - Progreso de Implementación

## Estado General del Proyecto

**Fecha de inicio**: 17 de Octubre, 2025
**Última actualización**: 17 de Octubre, 2025

---

## 🎯 Objetivo General

Desarrollar una API REST completa y optimizada para que los clientes puedan crear y gestionar pedidos desde una aplicación móvil Flutter, con funcionalidades de reserva de stock, seguimiento de pedidos y gestión de direcciones de entrega.

---

## ✅ FASE 1: ENDPOINTS BÁSICOS DE PEDIDOS

### ✅ FASE 1.1: Crear Pedidos desde la App
**Estado**: ✅ **COMPLETADO**
**Fecha de completación**: 17 de Octubre, 2025

#### Implementación Realizada

**Endpoint creado**:
- `POST /api/app/pedidos` → `ApiProformaController@crearPedidoDesdeApp`

**Ubicación en código**:
- Controlador: `app/Http/Controllers/Api/ApiProformaController.php:470-708`
- Ruta: `routes/api.php:72`

**Características implementadas**:
- ✅ Autenticación automática del cliente (vía Sanctum)
- ✅ Validación de items (productos y cantidades)
- ✅ Validación de dirección de entrega
  - Usa dirección especificada o la principal del cliente
  - Verifica que la dirección esté activa y pertenezca al cliente
- ✅ Verificación de stock disponible
  - Retorna detalles de stock insuficiente si aplica
- ✅ Validación de productos activos y con precio
- ✅ Cálculo automático de totales
  - Subtotal
  - Impuesto (13% IVA Bolivia)
  - Total
- ✅ Creación automática de proforma
- ✅ **Reserva automática de stock**
- ✅ Respuesta optimizada para app móvil con:
  - Datos del pedido
  - Información de dirección de entrega
  - Estado de reservas de stock

**Validaciones**:
```php
- items: required|array|min:1
- items.*.producto_id: required|exists:productos,id
- items.*.cantidad: required|numeric|min:0.01
- direccion_id: nullable|exists:direcciones_cliente,id
- observaciones: nullable|string|max:1000
```

**Casos de error manejados**:
- ❌ Usuario sin cliente asociado (403)
- ❌ Dirección no existe o no pertenece al cliente (422)
- ❌ Cliente sin direcciones configuradas (422)
- ❌ Stock insuficiente con detalle de faltantes (422)
- ❌ Producto inactivo (422)
- ❌ Producto sin precio (422)
- ❌ Error al reservar stock (422)
- ❌ Errores de validación (422)
- ❌ Errores del servidor (500)

**Archivo de pruebas**:
- `docs/api-tests/crear-pedido-app.http` (11 casos de prueba)

---

### ✅ FASE 1.2: Endpoints de Consulta
**Estado**: ✅ **COMPLETADO**
**Fecha de completación**: 17 de Octubre, 2025

#### Implementación Realizada

**Endpoints creados**:

#### 1. Historial de Pedidos
- `GET /api/app/cliente/pedidos` → `ApiProformaController@obtenerHistorialPedidos`

**Ubicación**: `ApiProformaController.php:728-833`
**Ruta**: `routes/api.php:75`

**Características**:
- ✅ Paginación personalizable (default: 15, max: 50 items)
- ✅ Filtros disponibles:
  - `estado`: PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA_A_VENTA
  - `fecha_desde`: formato Y-m-d
  - `fecha_hasta`: formato Y-m-d (debe ser >= fecha_desde)
  - `page`: número de página
  - `per_page`: items por página
- ✅ Vista previa de items (primeros 3 productos)
- ✅ Resumen estadístico (total, pendientes, aprobados)
- ✅ Información de reservas activas

**Respuesta incluye**:
```json
{
  "pedidos": [...],
  "paginacion": {
    "total": 10,
    "por_pagina": 15,
    "pagina_actual": 1,
    "ultima_pagina": 1,
    "desde": 1,
    "hasta": 10
  },
  "resumen": {
    "total_pedidos": 10,
    "pendientes": 3,
    "aprobados": 5
  }
}
```

---

#### 2. Detalle Completo de Pedido
- `GET /api/app/pedidos/{id}` → `ApiProformaController@obtenerDetallePedido`

**Ubicación**: `ApiProformaController.php:846-960`
**Ruta**: `routes/api.php:78`

**Características**:
- ✅ Información completa del pedido
- ✅ Lista de items con detalles de productos:
  - Nombre, código, categoría, marca
  - Unidad de medida
  - Cantidad, precio unitario, subtotal
  - Imagen del producto
- ✅ Dirección de entrega completa
- ✅ Estado de reservas de stock:
  - Cantidad de reservas
  - Fecha de expiración
  - Tiempo restante en horas
  - Detalle por almacén
- ✅ Información de seguimiento:
  - Usuario creador y fecha
  - Usuario aprobador y fecha
- ✅ Permisos contextuales:
  - `puede_cancelar`
  - `puede_extender_reserva`

**Respuesta incluye**:
```json
{
  "pedido": {...},
  "items": [...],
  "direccion_entrega": {...},
  "reservas_stock": {...},
  "seguimiento": {...}
}
```

---

#### 3. Estado Actual del Pedido (Endpoint Ligero)
- `GET /api/app/pedidos/{id}/estado` → `ApiProformaController@obtenerEstadoPedido`

**Ubicación**: `ApiProformaController.php:973-1043`
**Ruta**: `routes/api.php:81`

**Características**:
- ✅ Endpoint ultra-ligero sin relaciones
- ✅ Solo campos esenciales del estado
- ✅ Información para la UI:
  - Descripción amigable en español
  - Código de color hexadecimal
  - Nombre de icono
- ✅ Tiempo restante de reserva en horas
- ✅ Ideal para actualizaciones rápidas/polling

**Helpers implementados**:
- `obtenerDescripcionEstado()`: Mensajes amigables
- `obtenerColorEstado()`: Colores para UI
- `obtenerIconoEstado()`: Iconos para UI

**Mapeo de estados**:
```php
PENDIENTE → "Tu pedido está siendo revisado..." (#FFA500, clock)
APROBADA → "Tu pedido ha sido aprobado..." (#4CAF50, check-circle)
RECHAZADA → "Lo sentimos, tu pedido no pudo ser procesado" (#F44336, x-circle)
CONVERTIDA_A_VENTA → "Tu pedido ha sido confirmado..." (#2196F3, truck)
```

**Respuesta incluye**:
```json
{
  "id": 1,
  "codigo": "PRO-20251017-0001",
  "estado": "PENDIENTE",
  "estado_detalle": {
    "descripcion": "...",
    "color": "#FFA500",
    "icono": "clock"
  },
  "reserva_info": {
    "fecha_expiracion": "2025-10-18 10:00:00",
    "tiempo_restante_horas": 22.5
  }
}
```

---

**Validaciones de seguridad** (todos los endpoints de consulta):
- ✅ Usuario debe tener cliente asociado (403)
- ✅ Solo puede ver sus propios pedidos (403)
- ✅ Validación de parámetros de filtro (422)
- ✅ Manejo de pedidos no encontrados (404)

**Archivo de pruebas**:
- `docs/api-tests/consultar-pedidos-app.http` (14 casos de prueba + flujo completo)

---

## 📋 FASE 2: GESTIÓN DE DIRECCIONES DE ENTREGA

### ⏳ FASE 2.1: CRUD de Direcciones
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `GET /api/app/cliente/direcciones` - Listar direcciones del cliente
- [ ] `POST /api/app/cliente/direcciones` - Crear nueva dirección
- [ ] `PUT /api/app/cliente/direcciones/{id}` - Actualizar dirección
- [ ] `DELETE /api/app/cliente/direcciones/{id}` - Eliminar dirección
- [ ] `PATCH /api/app/cliente/direcciones/{id}/establecer-principal` - Marcar como principal

#### Características pendientes:
- [ ] Validación de coordenadas GPS (latitud/longitud)
- [ ] Validación de que una dirección esté marcada como principal
- [ ] Gestión de múltiples direcciones por cliente
- [ ] Validación de permisos (solo sus propias direcciones)

---

### ⏳ FASE 2.2: Validación de Direcciones
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `POST /api/app/validar-direccion` - Validar dirección con servicio de mapas
- [ ] `GET /api/app/geocodificar` - Convertir dirección a coordenadas

#### Características pendientes:
- [ ] Integración con servicio de geocodificación
- [ ] Validación de zona de cobertura
- [ ] Cálculo de distancia desde almacenes

---

## 📋 FASE 3: CATÁLOGO DE PRODUCTOS

### ⏳ FASE 3.1: Listar Productos Disponibles
**Estado**: ⏳ **PENDIENTE**

**Nota**: Ya existe endpoint básico en `routes/api.php:89`:
```php
Route::get('/app/productos-disponibles', [ApiProformaController::class, 'obtenerProductosDisponibles']);
```

#### Mejoras pendientes:
- [ ] Optimizar respuesta para app móvil
- [ ] Agregar filtros avanzados (precio, marca, categoría)
- [ ] Implementar búsqueda por texto
- [ ] Agregar información de stock disponible
- [ ] Incluir imágenes de productos
- [ ] Paginación optimizada

---

### ⏳ FASE 3.2: Detalle de Producto
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `GET /api/app/productos/{id}` - Detalle completo del producto
- [ ] `GET /api/app/productos/{id}/stock` - Stock disponible por almacén

---

### ⏳ FASE 3.3: Búsqueda y Filtros
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `GET /api/app/productos/buscar` - Búsqueda por texto
- [ ] `GET /api/app/categorias` - Listar categorías
- [ ] `GET /api/app/marcas` - Listar marcas

---

## 📋 FASE 4: GESTIÓN DE PEDIDOS AVANZADA

### ⏳ FASE 4.1: Cancelación de Pedidos
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `POST /api/app/pedidos/{id}/cancelar` - Cancelar pedido pendiente
- [ ] Validar que solo se puedan cancelar pedidos en estado PENDIENTE
- [ ] Liberar automáticamente las reservas de stock

---

### ⏳ FASE 4.2: Extensión de Reservas
**Estado**: ⏳ **PENDIENTE**

**Nota**: Ya existe endpoint básico en `routes/api.php:61`:
```php
Route::post('/{proforma}/extender-reservas', [ApiProformaController::class, 'extenderReservas']);
```

#### Mejoras pendientes:
- [ ] Adaptar para uso desde la app del cliente
- [ ] Validar límite de extensiones permitidas
- [ ] Notificar al cliente cuando la reserva está por vencer

---

### ⏳ FASE 4.3: Modificación de Pedidos
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `PUT /api/app/pedidos/{id}` - Modificar pedido pendiente
- [ ] Validar que solo se puedan modificar pedidos PENDIENTES
- [ ] Recalcular stock y totales
- [ ] Actualizar reservas de stock

---

## 📋 FASE 5: NOTIFICACIONES Y SEGUIMIENTO

### ⏳ FASE 5.1: Sistema de Notificaciones
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `GET /api/app/notificaciones` - Listar notificaciones del cliente
- [ ] `POST /api/app/notificaciones/{id}/marcar-leida` - Marcar como leída
- [ ] `POST /api/app/dispositivos/registrar` - Registrar token FCM para push

---

### ⏳ FASE 5.2: Seguimiento de Pedidos
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `GET /api/app/pedidos/{id}/seguimiento` - Timeline del pedido
- [ ] `GET /api/app/pedidos/{id}/ubicacion-envio` - Ubicación del delivery

---

## 📋 FASE 6: REPORTES Y ESTADÍSTICAS

### ⏳ FASE 6.1: Estadísticas del Cliente
**Estado**: ⏳ **PENDIENTE**

#### Endpoints a implementar:
- [ ] `GET /api/app/cliente/estadisticas` - Resumen de compras y pedidos
- [ ] `GET /api/app/cliente/historial-compras` - Historial completo

---

## 📊 Resumen de Progreso

### Por Fase:
- ✅ **Fase 1.1**: Crear Pedidos - **COMPLETADO**
- ✅ **Fase 1.2**: Endpoints de Consulta - **COMPLETADO**
- ⏳ **Fase 2**: Gestión de Direcciones - **PENDIENTE**
- ⏳ **Fase 3**: Catálogo de Productos - **PENDIENTE**
- ⏳ **Fase 4**: Gestión Avanzada - **PENDIENTE**
- ⏳ **Fase 5**: Notificaciones - **PENDIENTE**
- ⏳ **Fase 6**: Reportes - **PENDIENTE**

### Estadísticas:
- **Endpoints completados**: 4/30+ (≈13%)
- **Fases completadas**: 2/12 (≈17%)
- **Archivos de prueba**: 2 archivos HTTP con 25 casos de prueba

---

## 📁 Estructura de Archivos Modificados/Creados

### Controladores
```
app/Http/Controllers/Api/
└── ApiProformaController.php (modificado)
    ├── crearPedidoDesdeApp() [línea 470-708]
    ├── obtenerHistorialPedidos() [línea 728-833]
    ├── obtenerDetallePedido() [línea 846-960]
    ├── obtenerEstadoPedido() [línea 973-1043]
    ├── obtenerDescripcionEstado() [línea 1048-1057]
    ├── obtenerColorEstado() [línea 1062-1071]
    └── obtenerIconoEstado() [línea 1076-1085]
```

### Rutas
```
routes/
└── api.php (modificado)
    ├── POST /api/app/pedidos [línea 72]
    ├── GET /api/app/cliente/pedidos [línea 75]
    ├── GET /api/app/pedidos/{id} [línea 78]
    └── GET /api/app/pedidos/{id}/estado [línea 81]
```

### Documentación y Pruebas
```
docs/
├── PROGRESO-API-PEDIDOS-APP.md (este archivo)
└── api-tests/
    ├── crear-pedido-app.http (11 casos de prueba)
    └── consultar-pedidos-app.http (14 casos de prueba)
```

---

## 🔧 Tecnologías Utilizadas

- **Framework**: Laravel (PHP)
- **Autenticación**: Laravel Sanctum
- **Base de datos**: PostgreSQL
- **Validación**: FormRequest Validator
- **Transacciones**: DB::beginTransaction()
- **Testing**: REST Client (VS Code)

---

## 📝 Notas Importantes

### Características Destacadas Implementadas:

1. **Reserva Automática de Stock**:
   - Al crear un pedido, el stock se reserva automáticamente
   - Las reservas tienen fecha de expiración
   - Se puede verificar el tiempo restante de reserva

2. **Validaciones de Seguridad**:
   - Todos los endpoints verifican que el usuario tenga un cliente asociado
   - Los clientes solo pueden ver/modificar sus propios pedidos
   - Validación de permisos a nivel de dirección de entrega

3. **Optimización para App Móvil**:
   - Respuestas con solo los datos necesarios
   - Endpoint ligero (`/estado`) para actualizaciones rápidas
   - Paginación eficiente
   - Helpers de UI (colores, iconos, descripciones)

4. **Manejo de Errores Robusto**:
   - Códigos HTTP apropiados (200, 201, 403, 404, 422, 500)
   - Mensajes de error descriptivos en español
   - Detalles de validación cuando aplica
   - Logging de errores del servidor

---

## 🚀 Siguiente Paso Recomendado

**FASE 2.1**: Implementar CRUD de Direcciones de Entrega

Esto complementará la funcionalidad de pedidos, permitiendo que los clientes gestionen sus direcciones directamente desde la app.

---

## 📞 Información de Contacto del Proyecto

- **Proyecto**: Distribuidora Paucara
- **Módulo**: API de Pedidos para App de Clientes
- **Desarrolladores**: Claude Code + Equipo de Desarrollo

---

**Última actualización**: 17 de Octubre, 2025
