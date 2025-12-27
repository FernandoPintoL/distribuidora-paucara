# FASE 4: API ENDPOINTS - ENTREGAS CONSOLIDADAS

**Fecha:** 2025-12-27
**Status:** ✅ COMPLETADO
**Versión:** 1.0.0

---

## 📋 Resumen

Fase 4 implementa los API endpoints necesarios para exponer la funcionalidad de entregas consolidadas (N:M Venta-Entrega) creada en las fases anteriores.

**Endpoints Creados:** 5
**Controlador Principal:** `App\Http\Controllers\Api\EntregaController`
**Middleware:** `auth:sanctum,web` + permisos específicos

---

## 🎯 Endpoints

### 1. Crear Entrega Consolidada
**Endpoint:** `POST /api/entregas/crear-consolidada`

Crea una nueva entrega consolidada con múltiples ventas asignadas a un vehículo y chofer.

#### Request Body
```json
{
  "venta_ids": [1001, 1002, 1003],
  "vehiculo_id": 10,
  "chofer_id": 5,
  "zona_id": 3,
  "observaciones": "Entrega zona centro"
}
```

#### Request Validations
```php
'venta_ids' => 'required|array|min:1',
'venta_ids.*' => 'integer|exists:ventas,id',
'vehiculo_id' => 'required|integer|exists:vehiculos,id',
'chofer_id' => 'required|integer|exists:empleados,id',
'zona_id' => 'nullable|integer|exists:zonas,id',
'observaciones' => 'nullable|string|max:500',
```

#### Response (201 Created)
```json
{
  "success": true,
  "message": "Entrega consolidada creada exitosamente",
  "data": {
    "id": 44,
    "numero_entrega": "ENT-20251227-0044",
    "estado": "PROGRAMADO",
    "fecha_asignacion": "2025-12-27T12:00:00Z",
    "vehiculo": {
      "id": 10,
      "placa": "DEF-456"
    },
    "chofer": {
      "id": 1,
      "nombre": "USER REG CLIENTES"
    },
    "ventas_count": 3,
    "ventas": [
      {
        "id": 1001,
        "numero": "VEN20251223000001",
        "cliente": "Cliente A",
        "total": 1500.00
      },
      {
        "id": 1002,
        "numero": "VEN20251223000002",
        "cliente": "Cliente B",
        "total": 2000.00
      },
      {
        "id": 1003,
        "numero": "VEN20251223000003",
        "cliente": "Cliente C",
        "total": 1200.00
      }
    ],
    "peso_kg": 450.5,
    "volumen_m3": 12.3
  }
}
```

#### Error Response (422 Unprocessable Entity)
```json
{
  "success": false,
  "message": "Validación fallida",
  "errors": {
    "vehiculo_id": ["El vehículo no existe"],
    "chofer_id": ["El chofer no existe"]
  }
}
```

#### Permissions
- `entregas.create`

#### Service Called
- `CrearEntregaPorLocalidadService::crearEntregaConsolidada()`

---

### 2. Confirmar Venta Cargada
**Endpoint:** `POST /api/entregas/{id}/confirmar-venta/{venta_id}`

Marca una venta como confirmada (cargada en el vehículo) por el almacenero.

#### URL Parameters
```
id: integer (Entrega ID)
venta_id: integer (Venta ID)
```

#### Request Body
```json
{
  "notas": "Confirmada sin problemas"
}
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Venta confirmada como cargada",
  "data": {
    "entrega_id": 44,
    "venta_id": 1001,
    "confirmado_por": "Juan Perez",
    "fecha_confirmacion": "2025-12-27T12:15:00Z"
  }
}
```

#### Permissions
- `entregas.update`

#### Business Logic
1. Valida que la venta pertenece a la entrega
2. Llama a `Entrega::confirmarVentaCargada()`
3. Si todas las ventas están confirmadas, automáticamente cambia estado a `LISTO_PARA_ENTREGA`

---

### 3. Desmarcar Venta Cargada
**Endpoint:** `DELETE /api/entregas/{id}/confirmar-venta/{venta_id}`

Remueve la confirmación de carga de una venta (la marca como no confirmada).

#### URL Parameters
```
id: integer (Entrega ID)
venta_id: integer (Venta ID)
```

#### Response (200 OK)
```json
{
  "success": true,
  "message": "Confirmación de venta removida"
}
```

#### Permissions
- `entregas.update`

#### Business Logic
1. Valida que la venta pertenece a la entrega
2. Llama a `Entrega::desmarcarVentaCargada()`
3. El estado de la entrega regresa a `EN_CARGA` si estaba en `LISTO_PARA_ENTREGA`

---

### 4. Obtener Detalles de Entrega
**Endpoint:** `GET /api/entregas/{id}/detalles`

Obtiene todos los detalles de una entrega consolidada con sus ventas asociadas.

#### URL Parameters
```
id: integer (Entrega ID)
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "id": 44,
    "numero_entrega": "ENT-20251227-0044",
    "estado": "EN_CARGA",
    "fecha_asignacion": "2025-12-27T12:00:00Z",
    "vehiculo": {
      "id": 10,
      "placa": "DEF-456",
      "capacidad_kg": 5000
    },
    "chofer": {
      "id": 1,
      "nombre": "USER REG CLIENTES"
    },
    "peso_kg": 450.5,
    "volumen_m3": 12.3,
    "porcentaje_utilizacion": 9.01,
    "ventas": [
      {
        "venta_id": 1001,
        "numero": "VEN20251223000001",
        "cliente": "Cliente A",
        "detalles": {
          "total_entregas": 1,
          "estado_logistico_actual": "EN_CARGA",
          "estado_logistico_calculado": "EN_CARGA",
          "entregas": [
            {
              "id": 44,
              "numero_entrega": "ENT-20251227-0044",
              "orden": 1,
              "estado": "EN_CARGA",
              "fecha_programada": "2025-12-27",
              "cargada": true,
              "chofer": "USER REG CLIENTES",
              "vehiculo": "DEF-456"
            }
          ]
        }
      }
    ]
  }
}
```

#### Permissions
- `entregas.show`

#### Service Called
- `SincronizacionVentaEntregaService::obtenerDetalleEntregas()`

---

### 5. Obtener Progreso de Confirmación
**Endpoint:** `GET /api/entregas/{id}/progreso`

Obtiene el progreso actual de confirmación de carga de una entrega.

#### URL Parameters
```
id: integer (Entrega ID)
```

#### Response (200 OK)
```json
{
  "success": true,
  "data": {
    "entrega_id": 44,
    "numero_entrega": "ENT-20251227-0044",
    "estado": "EN_CARGA",
    "confirmadas": 1,
    "total": 3,
    "pendientes": 2,
    "porcentaje": 33.33,
    "completado": false
  }
}
```

#### Permissions
- `entregas.show`

#### Use Cases
- Mostrar progress bar en frontend
- Validar si todas las ventas fueron confirmadas
- Determinar si se puede cambiar a `LISTO_PARA_ENTREGA`

---

## 🔐 Autenticación y Permisos

### Middleware Requerido
```php
middleware('auth:sanctum,web')  // Autenticado
```

### Permisos Específicos
```
entregas.create    → Crear entregas consolidadas
entregas.update    → Confirmar/desmarcar ventas cargadas
entregas.show      → Ver detalles y progreso
```

---

## 📊 Flujo Típico de Uso

### 1. Crear Entrega Consolidada
```bash
POST /api/entregas/crear-consolidada
{
  "venta_ids": [1, 2, 3],
  "vehiculo_id": 10,
  "chofer_id": 5,
  "zona_id": 3
}
```
**Resultado:** Entrega en estado `PROGRAMADO` creada

### 2. Confirmar Ventas Cargadas (Una por Una)
```bash
# Confirmar venta 1
POST /api/entregas/44/confirmar-venta/1
{ "notas": "OK" }

# Confirmar venta 2
POST /api/entregas/44/confirmar-venta/2

# Confirmar venta 3 (la última)
POST /api/entregas/44/confirmar-venta/3
```
**Resultado:** Estado cambia automáticamente a `LISTO_PARA_ENTREGA`

### 3. Verificar Progreso
```bash
GET /api/entregas/44/progreso
```
**Resultado:**
```json
{
  "confirmadas": 3,
  "total": 3,
  "porcentaje": 100,
  "completado": true
}
```

### 4. Obtener Detalles Completos
```bash
GET /api/entregas/44/detalles
```
**Resultado:** Todos los detalles de la entrega con ventas

---

## 🐛 Manejo de Errores

### Errores Comunes

#### 404 - Entrega No Encontrada
```json
{
  "success": false,
  "message": "Error obteniendo detalles: No query results found for model [App\\Models\\Entrega]"
}
```

#### 404 - Venta No Pertenece a Entrega
```json
{
  "success": false,
  "message": "La venta no pertenece a esta entrega"
}
```

#### 422 - Validación Fallida
```json
{
  "success": false,
  "message": "Validación fallida",
  "errors": {
    "venta_ids": ["Debe proporcionar al menos 1 venta"]
  }
}
```

#### 422 - Error de Negocio
```json
{
  "success": false,
  "message": "Error creando entrega consolidada: Vehículo DEF-456 no está disponible. Estado actual: MANTENIMIENTO"
}
```

#### 500 - Error Interno
```json
{
  "success": false,
  "message": "Error confirmando venta: [error details]"
}
```

---

## 🔄 Estados de Transición Automática

Cuando se confirman TODAS las ventas de una entrega:
```
EN_CARGA → LISTO_PARA_ENTREGA (automático)
```

Cuando se desmarca la última venta confirmada:
```
LISTO_PARA_ENTREGA → EN_CARGA (automático)
```

---

## 📝 Notas Importantes

1. **Transacciones:** CrearEntregaConsolidada usa transacciones para garantizar consistencia
2. **Sincronización Automática:** Los estados de las ventas se sincronizan automáticamente
3. **Validaciones:** Múltiples validaciones en nivel de servicio y controlador
4. **Auditoría:** Cada confirmación registra quién y cuándo
5. **Idempotencia:** Las confirmaciones son idempotentes (puedes confirmar múltiples veces sin error)

---

## 🚀 Próximos Pasos

**FASE 5 - Frontend:**
- [ ] Dashboard para crear entregas consolidadas
- [ ] Panel de confirmación de carga (warehouse)
- [ ] Visualización de progreso en tiempo real
- [ ] Integración con WebSockets para notificaciones

**FASE 6 - Mobile:**
- [ ] App Flutter para confirmación de carga
- [ ] QR scanning para ventas
- [ ] Notificaciones push de asignaciones

---

## 📞 Soporte

Para más información sobre los servicios de negocio que estos endpoints utilizan:
- Ver: `FASE2_MODELOS_ELOQUENT.md`
- Ver: `FASE3_SERVICIOS_LOGISTICA.md`
- Ver: `app/Services/Logistica/CrearEntregaPorLocalidadService.php`

---

**Ejecución completada:** ✅ FASE 4 COMPLETADA

Todos los endpoints están implementados y listos para ser consumidos desde el frontend o aplicaciones móviles.
