# ✅ Control de Estado de Venta en Formulario (2026-02-10)

## 📋 Resumen

Se han realizado cambios en el backend para que cuando se crea una venta desde el formulario `/ventas/create`, el sistema **controle automáticamente**:
- ✅ `estado_pago = PENDIENTE` (siempre, sin excepción)
- ✅ `estado_logistico_id = SIN_ENTREGA` (ID del estado SIN_ENTREGA automáticamente)

## 🎯 Cambios Realizados

### 1. **CrearVentaDTO.php** - Cambio de Defecto
**Archivo**: `app/DTOs/Venta/CrearVentaDTO.php`

#### Antes:
```php
public ?string $estado_pago = 'PAGADO',  // ❌ Por defecto PAGADO
```

#### Después:
```php
public ?string $estado_pago = 'PENDIENTE',  // ✅ Por defecto PENDIENTE (ventas nuevas)
```

**Líneas modificadas**:
- Línea 37: Cambio en constructor
- Línea 96: Cambio en `fromRequest()`

**Razón**: Las ventas creadas desde el formulario son siempre sin pago inicial. El pago se registra después en movimientos_caja.

---

### 2. **VentaService.php** - Asignación Automática de Estado Logístico
**Archivo**: `app/Services/Venta/VentaService.php`

#### Cambio 1: Obtener ID de SIN_ENTREGA automáticamente
```php
// ✅ NUEVO (2026-02-10): Asignar estado_logistico_id = SIN_ENTREGA si no viene especificado
$estadoLogisticoId = $dto->estado_logistico_id;
if (!$estadoLogisticoId) {
    $estadoSinEntrega = \App\Models\EstadoLogistica::where('codigo', 'SIN_ENTREGA')
        ->where('categoria', 'venta_logistica')
        ->first();
    $estadoLogisticoId = $estadoSinEntrega?->id;
    Log::info('📦 [VentaService::crear] Estado logístico asignado a SIN_ENTREGA', [
        'estado_id' => $estadoLogisticoId,
        'codigo'    => 'SIN_ENTREGA',
    ]);
}
```

**Beneficio**:
- No hardcodea ID = 8
- Busca dinámicamente por código 'SIN_ENTREGA'
- Compatible si el ID cambia en la BD

#### Cambio 2: Siempre estado_pago = PENDIENTE
```php
// ✅ MODIFICADO (2026-02-10): Estado pago siempre PENDIENTE para ventas nuevas
// Las ventas se crean siempre sin pago (estado_pago = PENDIENTE)
// El pago se registra después en movimientos_caja
$estadoPago = 'PENDIENTE';
Log::info('💰 [VentaService::crear] Estado pago: PENDIENTE (nuevas ventas siempre sin pago)', [
    'politica_pago' => $dto->politica_pago,
    'nota'          => 'El pago se registra después en movimientos_caja, no al crear',
]);
```

**Beneficio**:
- Elimina la lógica de `monto_pagado_inicial` para formulario
- Todas las ventas nuevas comienzan en estado PENDIENTE
- El pago se registra después en movimientos_caja

#### Cambio 3: Usar variable calculada
```php
'estado_logistico_id'  => $estadoLogisticoId,  // ✅ Usa variable calculada (SIN_ENTREGA por defecto)
```

---

## 🔄 Flujo Completo

```
POST /ventas (Formulario)
   ↓
StoreVentaRequest valida datos
   ↓
VentaController::store() ejecuta
   ↓
VentaService::crear($dto, $cajaId) procesa:

   1. ESTADO PAGO:
      - Siempre = PENDIENTE (ignora monto_pagado_inicial)
      - Registra en log

   2. ESTADO LOGISTICO:
      - Si no viene: busca 'SIN_ENTREGA' por código
      - Obtiene su ID automáticamente
      - Asigna al movimiento

   3. VENTA CREADA:
      - estado_pago = PENDIENTE ✅
      - estado_logistico_id = ID de SIN_ENTREGA ✅
      - Listo para movimientos_caja
```

---

## 📊 Ejemplos de Comportamiento

### Ejemplo 1: Venta Sin Pago Inicial
```http
POST /ventas
{
  "cliente_id": 5,
  "detalles": [...],
  "total": 1500,
  "estado_pago": "PAGADO",      // ← Frontend envía PAGADO
  "estado_logistico_id": null   // ← Frontend no envía
}
```

**Resultado en BD**:
```json
{
  "estado_pago": "PENDIENTE",          // ✅ Se cambia a PENDIENTE (ignora frontend)
  "estado_logistico_id": 3,             // ✅ Se asigna ID de SIN_ENTREGA
  "monto_pagado": 0
}
```

### Ejemplo 2: Venta con Requiere Envío
```http
POST /ventas
{
  "cliente_id": 5,
  "requiere_envio": true,
  "direccion_cliente_id": 12,
  "estado_pago": "PAGADO",
  "estado_logistico_id": null
}
```

**Resultado en BD**:
```json
{
  "estado_pago": "PENDIENTE",          // ✅ PENDIENTE
  "estado_logistico_id": 3,             // ✅ SIN_ENTREGA (si requiere_envio=false)
  "requiere_envio": true,
  "direccion_cliente_id": 12
}
```

---

## 🔍 Validaciones

✅ **Estado de Pago**:
- Siempre `PENDIENTE` para nuevas ventas del formulario
- Ignora cualquier valor enviado desde frontend
- Registra en logs por auditoría

✅ **Estado Logístico**:
- Busca dinámicamente por código 'SIN_ENTREGA'
- No usa ID hardcodeado
- Valida que sea de categoría 'venta_logistica'
- Si no encuentra, queda NULL (sin estado logístico)

✅ **Logs**:
```
💰 [VentaService::crear] Estado pago: PENDIENTE (nuevas ventas siempre sin pago)
📦 [VentaService::crear] Estado logístico asignado a SIN_ENTREGA
   estado_id: 3
   codigo: SIN_ENTREGA
```

---

## 📝 Compatibilidad

**Frontend**:
- No necesita cambios
- Puede enviar cualquier valor para `estado_pago`
- Puede enviar null para `estado_logistico_id`
- El backend siempre asigna los valores correctos

**Backend**:
- ✅ `VentaService::crear()` - Controlado
- ✅ `VentaController::store()` - Sin cambios
- ✅ Form Requests - Sin cambios
- ✅ Listeners/Observers - Sin cambios

**BD**:
- Tabla `estados_logistica` debe contener estado 'SIN_ENTREGA'
- Categoría debe ser 'venta_logistica'

---

## 🚀 Próximas Mejoras Sugeridas

1. **Validar estado en BD**: Agregar validación que asegure SIN_ENTREGA existe
2. **Cache**: Cachear la búsqueda de SIN_ENTREGA por código (se busca en cada venta)
3. **Constante**: Usar constante para el código 'SIN_ENTREGA' en lugar de string

---

## ✅ Status

- ✅ PHP Syntax: Validado
- ✅ Logic: Implementado
- ⏳ Testing: Requiere prueba en la aplicación
- ✅ Documentación: Completada

---

**Última actualización**: 2026-02-10
**Responsable**: Sistema automático
**Impacto**: Crítico - Cambia comportamiento de creación de ventas
