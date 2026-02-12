# ✅ Impuesto Removido de Cálculos de Totales (2026-02-11)

## 🎯 Cambio Realizado
El impuesto **NO se suma** a los cálculos de `subtotal` y `total`. El impuesto ahora es **solo informativo** y se registra en la BD pero no afecta los valores finales.

---

## 📍 Cambios en Endpoints

### 1. **POST /api/proformas/{proforma}/actualizar-detalles**
**Archivo**: `app/Http/Controllers/Api/ApiProformaController.php` (línea 3566-3570)

**ANTES**:
```php
$impuestoOriginal = $proforma->total > 0 ? ($proforma->impuesto / $proforma->subtotal) : 0.13;
$impuestoNuevo = $subtotalNuevo * $impuestoOriginal;
$totalNuevo = $subtotalNuevo + $impuestoNuevo;  // ❌ SUMA IMPUESTO
```

**DESPUÉS**:
```php
// ✅ CAMBIO: Impuesto se calcula pero NO se suma al total (es solo informativo)
$impuestoOriginal = $proforma->total > 0 ? ($proforma->impuesto / $proforma->subtotal) : 0.13;
$impuestoNuevo = $subtotalNuevo * $impuestoOriginal;
$totalNuevo = $subtotalNuevo;  // ✅ Total SIN impuesto
```

### 2. Otros Endpoints (Ya Correctos)

| Endpoint | Línea | Estado |
|----------|-------|--------|
| `POST /api/proformas` (crear) | 205 | ✅ `$total = $subtotal` |
| `POST /api/proformas/{id}/aprobar` | 1681 | ✅ `$total = $subtotal` |
| `POST /api/proformas/{id}/convertir-venta` | 2174, 2602 | ✅ Total SIN impuesto |

---

## 📊 Fórmulas Ahora Utilizadas

### Proformas
```
Subtotal = Suma de (cantidad × precio_unitario) de cada detalle
Impuesto = Subtotal × 0.13  (solo informativo)
Total = Subtotal  (sin impuesto)
```

### Ventas (desde proforma convertida)
```
Subtotal = Suma de detalles
Impuesto = 0 (no se incluye en ventas)
Total = Subtotal - Descuento  (sin impuesto)
```

---

## 🔍 Impuesto Ahora Solo Se Usa Para:

- ✅ Información/referencia (campo `impuesto` en tabla)
- ✅ Auditoría (visible en detalles de proforma)
- ✅ Reportes (si es necesario)

**NO se usa para**:
- ❌ Cálculos de total
- ❌ Cálculos de subtotal
- ❌ Movimientos de caja
- ❌ Monto pendiente
- ❌ Cálculos de venta

---

## ✅ Build Status

- ✅ `php -l` ApiProformaController.php - Sin errores
- ✅ `npm run build` - Exitoso (29.02s)
- ✅ No hay cambios en TypeScript/frontend
- ✅ No hay cambios en rutas

---

## 🧪 Verificación

### Ejemplo: Actualizar detalles de proforma

**Request**:
```json
{
  "detalles": [
    {
      "producto_id": 5,
      "cantidad": 10,
      "precio_unitario": 100,
      "subtotal": 1000
    }
  ]
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "subtotal_nuevo": 1000,
    "total_nuevo": 1000,    // ✅ Igual a subtotal (SIN impuesto)
    "impuesto_nuevo": 130   // Informativo solamente
  }
}
```

---

## 📝 Resumen

| Aspecto | ANTES | AHORA |
|--------|-------|-------|
| **Total incluye impuesto** | ❌ Sí | ✅ No |
| **Impuesto se calcula** | ✅ Sí | ✅ Sí |
| **Impuesto se almacena** | ✅ Sí | ✅ Sí |
| **Impuesto afecta totales** | ❌ Sí | ✅ No |
| **Total = Subtotal** | ❌ No | ✅ Sí |

---

**Última actualización**: 2026-02-11  
**Versión**: 1.0 (Cambio Implementado)
