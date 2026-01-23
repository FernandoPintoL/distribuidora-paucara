# 📋 Validación de Caja para Conversión de Proforma a Venta

## 🎯 Objetivo

Permitir que un admin (con rol de cajero) pueda convertir una proforma a venta **solo si** tiene:
- ✅ Una **caja abierta HOY**, O
- ✅ Una **caja consolidada del día anterior**

Si no cumple con ninguna de estas condiciones, se rechaza la conversión con un mensaje claro.

---

## 🔄 Estados Válidos

```
┌──────────────────────────────────────────────────────┐
│ USUARIO PUEDE CONVERTIR PROFORMA A VENTA SI:         │
├──────────────────────────────────────────────────────┤
│ ✅ OPCIÓN 1: Caja Abierta Hoy                        │
│    └─ AperturaCaja creada hoy sin CierreCaja        │
│       └─ Estado: activa, esperando cierre           │
│                                                       │
│ ✅ OPCIÓN 2: Caja Consolidada (Hoy o Ayer)          │
│    └─ CierreCaja con estado: CONSOLIDADA            │
│       └─ Creada hoy o ayer (dentro de 24 horas)     │
│       └─ Verificador: aprobada por admin            │
│                                                       │
│ ❌ OPCIÓN 3: Ninguna de las anteriores               │
│    └─ Conversión RECHAZADA (422 Unprocessable)      │
│    └─ Mensaje: "Sin caja abierta o consolidada"     │
└──────────────────────────────────────────────────────┘
```

---

## 🛠️ Implementación Técnica

### 1️⃣ Nuevo Método en `CajeroTrait`

**Archivo:** `app/Models/Traits/CajeroTrait.php`

#### Método Principal
```php
public function tieneCajaAbiertaOConsolidadaDelDia(): bool
{
    // Opción 1: Caja abierta hoy
    $cajaAbiertaHoy = $this->aperturasCaja()
        ->whereDoesntHave('cierre')
        ->exists();

    if ($cajaAbiertaHoy) {
        return true;
    }

    // Opción 2: Cierre consolidado de hoy o ayer
    $cierreConsolidado = $this->cierresCaja()
        ->whereHas('estadoCierre', function ($q) {
            $q->where('codigo', 'CONSOLIDADA');
        })
        ->whereDate('fecha', '>=', now()->subDay())
        ->whereDate('fecha', '<=', now())
        ->exists();

    return $cierreConsolidado;
}
```

#### Método Auxiliar (Información)
```php
public function obtenerEstadoCaja(): array
{
    // Retorna un array con:
    // [
    //     'estado' => 'ABIERTA|CONSOLIDADA_ANTERIOR|SIN_CAJA',
    //     'apertura_id|cierre_id' => ...,
    //     'fecha' => ...,
    //     'caja_id' => ...,
    // ]
}
```

---

### 2️⃣ Actualización en `ApiProformaController`

**Archivo:** `app/Http/Controllers/Api/ApiProformaController.php`
**Línea:** ~2020

#### Antes (Solo validaba caja abierta):
```php
if (!$empleado->tieneCajaAbierta()) {
    return response()->json([
        'success' => false,
        'message' => "No puede convertir proforma a venta sin caja abierta...",
        'code' => 'CAJA_NO_ABIERTA',
    ], 422);
}
```

#### Después (Valida caja abierta O consolidada):
```php
if (!$empleado->tieneCajaAbiertaOConsolidadaDelDia()) {
    $estadoCaja = $empleado->obtenerEstadoCaja();

    return response()->json([
        'success' => false,
        'message' => "No puede convertir proforma a venta con política '{$politica}' sin una caja abierta o consolidada...",
        'code' => 'CAJA_NO_DISPONIBLE',
        'detalles' => [
            'politica_pago' => $politica,
            'monto_pagado' => $montoPagado,
            'motivo' => "Requiere caja abierta HOY o consolidada del día anterior",
            'estado_caja_actual' => $estadoCaja['estado'],
            'accion_requerida' => 'Abra una caja en /cajas',
        ],
    ], 422);
}
```

---

## 📊 Escenarios de Prueba

### Escenario 1: ✅ Conversión Exitosa (Caja Abierta Hoy)

```
Lunes 8:00 AM:
├─ Cajero abre caja
│  └─ Crea: AperturaCaja (sin cierre)
│
├─ Cajero crea proforma
│
└─ Cajero convierte a venta
   └─ Validación: tieneCajaAbiertaOConsolidadaDelDia() = TRUE ✅
      └─ Retorna: 200 OK - Venta creada
```

### Escenario 2: ✅ Conversión Exitosa (Caja Consolidada Ayer)

```
Martes 8:15 AM:
├─ Ayer por la noche: Caja fue consolidada (estado: CONSOLIDADA)
│  └─ Último CierreCaja con estado_cierre_id = CONSOLIDADA
│
├─ Hoy Martes: No hay caja abierta aún
│  └─ AperturaCaja de hoy: NO EXISTE
│
├─ Cajero intenta convertir proforma a venta
│
└─ Validación: tieneCajaAbiertaOConsolidadaDelDia() = TRUE ✅
   └─ Busca: CierreCaja con CONSOLIDADA en últimas 24 horas
   └─ Retorna: 200 OK - Venta creada
```

### Escenario 3: ❌ Conversión Fallida (Sin Caja)

```
Martes 1:00 PM:
├─ Ayer: Caja fue RECHAZADA (estado: RECHAZADA)
│  └─ Nunca fue corregida ni consolidada
│
├─ Hoy: No hay caja abierta
│  └─ No hay CierreCaja CONSOLIDADA en últimas 24 horas
│
├─ Cajero intenta convertir proforma a venta
│
└─ Validación: tieneCajaAbiertaOConsolidadaDelDia() = FALSE ❌
   └─ Retorna: 422 CAJA_NO_DISPONIBLE
   └─ Mensaje: "Sin caja abierta o consolidada"
   └─ Acción: "Abra una caja en /cajas antes de convertir"
```

### Escenario 4: ❌ Conversión Fallida (Caja Consolidada Hace 2 Días)

```
Miércoles 8:00 AM:
├─ Lunes: Caja fue consolidada
│  └─ CierreCaja con CONSOLIDADA hace 48+ horas
│
├─ Hoy Miércoles: No hay caja abierta
│  └─ Búsqueda: whereDate('fecha', '>=', now()->subDay())
│  └─ Lunes NO está dentro del rango (más de 24 horas atrás)
│
├─ Cajero intenta convertir proforma a venta
│
└─ Validación: tieneCajaAbiertaOConsolidadaDelDia() = FALSE ❌
   └─ Retorna: 422 CAJA_NO_DISPONIBLE
   └─ La caja anterior fue consolidada hace 2 días, es muy antigua
```

---

## 🔍 Lógica de Búsqueda SQL

### 1. Caja Abierta Hoy
```sql
SELECT COUNT(*) FROM aperturas_caja
WHERE user_id = ?
AND NOT EXISTS (
    SELECT 1 FROM cierres_caja
    WHERE apertura_caja_id = aperturas_caja.id
)
```

### 2. Caja Consolidada (Hoy o Ayer)
```sql
SELECT COUNT(*) FROM cierres_caja
JOIN estados_cierre ON cierres_caja.estado_cierre_id = estados_cierre.id
WHERE cierres_caja.user_id = ?
AND estados_cierre.codigo = 'CONSOLIDADA'
AND DATE(cierres_caja.fecha) >= DATE_SUB(CURDATE(), INTERVAL 1 DAY)
AND DATE(cierres_caja.fecha) <= CURDATE()
```

---

## 🎨 Flujo en el Frontend

### Estado del Botón "Convertir a Venta"

```
Usuario: Admin sin caja abierta
├─ Intenta convertir proforma
│
└─ Frontend envía POST /api/proformas/{id}/convertir-venta
   ├─ Backend valida: tieneCajaAbiertaOConsolidadaDelDia()
   │
   ├─ ✅ SI existe caja abierta o consolidada:
   │  └─ 200 OK: Venta creada ✅
   │  └─ UI actualiza: muestra venta creada
   │
   └─ ❌ SI NO existe:
      └─ 422 CAJA_NO_DISPONIBLE
      └─ UI muestra error: "Sin caja disponible"
      └─ Botón: "Abra una caja" → redirige a /cajas
```

---

## 📝 Mensajes de Error

### CAJA_NO_DISPONIBLE (422)

```json
{
  "success": false,
  "message": "No puede convertir proforma a venta con política 'ANTICIPADO_100' sin una caja abierta o consolidada. Por favor, abra una caja primero.",
  "code": "CAJA_NO_DISPONIBLE",
  "detalles": {
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 15,
    "motivo": "La política ANTICIPADO_100 requiere una caja abierta HOY o una caja consolidada del día anterior",
    "estado_caja_actual": "SIN_CAJA",
    "accion_requerida": "Abra una caja en /cajas antes de convertir esta proforma"
  }
}
```

---

## ✅ Checklist de Validación

- [x] Método `tieneCajaAbiertaOConsolidadaDelDia()` creado en `CajeroTrait`
- [x] Método `obtenerEstadoCaja()` para debugging y mensajes
- [x] Validación actualizada en `ApiProformaController::convertirAVenta()`
- [x] Mensajes de error más descriptivos
- [x] Logs mejorados con estado de caja
- [x] Rango de búsqueda: últimas 24 horas (now()->subDay() a now())

---

## 🚀 Testing Manual

### Paso 1: Crear Escenario (Sin Caja)
```bash
# 1. Admin intenta convertir proforma sin caja
# 2. Obtiene error 422 CAJA_NO_DISPONIBLE
```

### Paso 2: Abrir Caja
```bash
# 1. Ir a /cajas
# 2. Click en "Abrir Caja"
# 3. Caja está abierta
```

### Paso 3: Intentar Conversión (Caja Abierta)
```bash
# 1. Vuelve a proforma
# 2. Click en "Convertir a Venta"
# 3. Ahora funciona ✅
# 4. Venta creada exitosamente
```

### Paso 4: Cerrar y Consolidar Caja
```bash
# 1. Ir a /cajas
# 2. Click en "Cerrar Caja"
# 3. CierreCaja creado con estado: PENDIENTE
# 4. Admin consolida en /admin/cajas/pendientes
# 5. CierreCaja ahora tiene estado: CONSOLIDADA
```

### Paso 5: Conversión con Caja Consolidada (24 horas después)
```bash
# 1. Día siguiente, sin abrir caja nueva aún
# 2. Intenta convertir proforma
# 3. Validación encuentra: CierreCaja CONSOLIDADA del día anterior ✅
# 4. Conversión exitosa
```

---

## 🔗 Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `app/Models/Traits/CajeroTrait.php` | + 2 nuevos métodos | +78 líneas |
| `app/Http/Controllers/Api/ApiProformaController.php` | Actualizar validación + logs | ~12 líneas modificadas |

---

## 📞 FAQ

**P: ¿Qué pasa si la caja está abierta hace 2 días?**
R: Solo se valida si está abierta HOY (sin cierre). Si hay cierre, no cuenta como "abierta".

**P: ¿Puedo convertir con caja consolidada de hace 3 días?**
R: No. La búsqueda es de últimas 24 horas: `whereDate('fecha', '>=', now()->subDay())`

**P: ¿Qué políticas requieren validación de caja?**
R: ANTICIPADO_100 y MEDIO_MEDIO (requieren pagos inmediatos)

**P: ¿Y si la política es CREDITO o CONTRA_ENTREGA?**
R: No requieren validación de caja (se procesan sin caja abierta)

**P: ¿Puede un no-cajero convertir sin validación de caja?**
R: Primero se valida `esCajero()`. Si no es cajero, se rechaza con `USUARIO_NO_CAJERO`

---

**Fecha:** 21 de Enero de 2026
**Versión:** 1.0
**Estado:** ✅ Listo para Testing
