# Validación de Caja Mejorada - Aviso al Usuario

## 🎯 ¿Qué Cambió?

Se agregó una **validación fuerte** que **BLOQUEA la conversión** si el usuario no tiene caja abierta cuando intenta convertir una proforma con:
- Política: `ANTICIPADO_100` (100% ANTICIPADO)
- Política: `MEDIO_MEDIO` (50% ANTICIPO)
- Monto pagado: > 0

---

## 📍 Ubicación del Código

**Archivo:** `app/Http/Controllers/Api/ApiProformaController.php`
**Método:** `convertirAVenta()`
**Línea:** ~1992 (VALIDACIÓN 0.1)

---

## 🔍 Flujo de Validación

```
Usuario intenta convertir proforma
    ↓
¿Política = ANTICIPADO_100 o MEDIO_MEDIO?
    ├─ NO → Continúa sin validar caja ✓
    └─ SÍ → ¿Monto pagado > 0?
           ├─ NO → Continúa sin validar caja ✓
           └─ SÍ → VALIDA CAJA
                 ├─ ¿Usuario tiene empleado?
                 │  ├─ NO → ❌ BLOQUEA: "Usuario sin empleado"
                 │  └─ SÍ → Continúa
                 │
                 ├─ ¿Empleado es Cajero?
                 │  ├─ NO → ❌ BLOQUEA: "Usuario no es Cajero"
                 │  └─ SÍ → Continúa
                 │
                 └─ ¿Tiene caja abierta hoy?
                    ├─ NO → ❌ BLOQUEA: "Caja no abierta"
                    │       + Mensaje útil al usuario
                    │       + Detalles de acción requerida
                    └─ SÍ → ✅ CONTINÚA A CREAR VENTA
```

---

## 💬 Mensajes al Usuario

### Caso 1: Usuario sin Empleado Asociado

**Status HTTP:** 422 (Unprocessable Entity)

```json
{
  "success": false,
  "message": "Usuario no tiene un empleado asociado. No puede procesar pagos en caja.",
  "code": "USUARIO_SIN_EMPLEADO"
}
```

**Qué significa:** El usuario no está configurado como empleado en el sistema.

---

### Caso 2: Usuario no es Cajero

**Status HTTP:** 422

```json
{
  "success": false,
  "message": "Usuario no tiene rol de Cajero. No puede procesar pagos en caja.",
  "code": "USUARIO_NO_CAJERO"
}
```

**Qué significa:** El usuario existe como empleado pero no tiene el rol de "Cajero".

---

### Caso 3: Caja No Abierta (PRINCIPAL)

**Status HTTP:** 422

```json
{
  "success": false,
  "message": "No puede convertir proforma a venta con política 'ANTICIPADO_100' sin caja abierta. Por favor, abra una caja primero.",
  "code": "CAJA_NO_ABIERTA",
  "detalles": {
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 1500.00,
    "motivo": "La política ANTICIPADO_100 requiere que tenga una caja abierta para registrar el pago",
    "accion_requerida": "Abra una caja en /cajas antes de convertir esta proforma"
  }
}
```

**Qué significa:** El usuario es Cajero pero no tiene una caja abierta hoy.

---

## 🎬 Ejemplo de Flujo Bloqueado

### Usuario intenta convertir proforma con ANTICIPADO_100

```
Frontend (Show.tsx)
    ├─ Usuario selecciona: ANTICIPADO_100
    ├─ Usuario ingresa monto: Bs. 1000
    └─ Usuario presiona: "Aprobar y Convertir"
            ↓
POST /api/proformas/45/convertir-venta
Body: {
  "con_pago": true,
  "tipo_pago_id": 1,
  "politica_pago": "ANTICIPADO_100",
  "monto_pagado": 1000
}
            ↓
Backend ApiProformaController::convertirAVenta()
    ├─ VALIDACIÓN 0.1: Verifica caja abierta
    │   ├─ Usuario: Admin (ID: 5) ✓
    │   ├─ Empleado: Sí, es Cajero ✓
    │   ├─ Caja abierta: ❌ NO - No existe apertura sin cierre
    │   └─ RESULTADO: BLOQUEA
    │
    └─ Retorna HTTP 422
       {
         "success": false,
         "message": "No puede convertir proforma a venta con política 'ANTICIPADO_100' sin caja abierta...",
         "code": "CAJA_NO_ABIERTA",
         "detalles": {...}
       }
            ↓
Frontend
    └─ Muestra error al usuario:
       "⚠️ No puede convertir proforma sin caja abierta"
       "Abra una caja en /cajas antes de continuar"
```

---

## ✅ Ejemplo de Flujo Permitido

### Mismo usuario pero CON caja abierta

```
Usuario abre caja primero:
    ├─ Va a /cajas
    ├─ Click: "Abrir Caja"
    ├─ Selecciona: Caja Principal
    ├─ Ingresa monto inicial: Bs. 500
    └─ ✅ Caja abierta

Luego intenta convertir proforma:
    ├─ Usuario selecciona: ANTICIPADO_100
    ├─ Usuario ingresa monto: Bs. 1000
    └─ Usuario presiona: "Aprobar y Convertir"
            ↓
POST /api/proformas/45/convertir-venta
            ↓
Backend ApiProformaController::convertirAVenta()
    ├─ VALIDACIÓN 0.1: Verifica caja abierta
    │   ├─ Usuario: Admin ✓
    │   ├─ Empleado: Cajero ✓
    │   ├─ Caja abierta: ✅ SÍ (apertura sin cierre)
    │   └─ RESULTADO: CONTINÚA
    │
    ├─ Crea venta ✅
    ├─ Registra MovimientoCaja ✅
    ├─ Consume reservas ✅
    │
    └─ Retorna HTTP 201
       {
         "success": true,
         "message": "Proforma convertida exitosamente a venta VNT-00123",
         "data": {...}
       }
            ↓
Frontend
    └─ ✅ Venta creada
       └─ Recarga página
       └─ Aparece en listado de ventas
```

---

## 📊 Políticas NO Validadas

Estas políticas **NO validan caja abierta:**

| Política | Por Qué |
|----------|---------|
| `CONTRA_ENTREGA` | Se paga después al entregar |
| `CREDITO` | No requiere pago inmediato |

Pueden convertirse sin tener caja abierta.

---

## 🧪 Cómo Probar

### Test 1: Sin Caja Abierta (Debe Bloquear)

```bash
# 1. Asegúrese de que NO hay caja abierta
#    Ir a /cajas → Verificar que dice "Sin caja abierta hoy"

# 2. Intentar convertir proforma con ANTICIPADO_100
#    Ir a /proformas → Seleccionar → Click "Aprobar y Convertir"
#    → Seleccionar "ANTICIPADO_100"
#    → Ingrese un monto

# 3. Resultado esperado:
#    ❌ Error 422
#    Message: "No puede convertir proforma sin caja abierta"
#    Code: "CAJA_NO_ABIERTA"
```

### Test 2: Con Caja Abierta (Debe Funcionar)

```bash
# 1. Abrir una caja
#    Ir a /cajas → Click "Abrir Caja" → Seleccionar caja → Ingresar monto

# 2. Intentar convertir proforma con ANTICIPADO_100
#    Ir a /proformas → Seleccionar → Click "Aprobar y Convertir"
#    → Seleccionar "ANTICIPADO_100"
#    → Ingrese un monto

# 3. Resultado esperado:
#    ✅ HTTP 201
#    Success: true
#    Venta creada con número
#    MovimientoCaja registrado
```

### Test 3: CONTRA_ENTREGA (Sin Validación)

```bash
# 1. SIN cener caja abierta

# 2. Intentar convertir proforma con CONTRA_ENTREGA
#    Ir a /proformas → Seleccionar → Click "Aprobar y Convertir"
#    → Política: CONTRA_ENTREGA
#    → Monto: 0 (no se puede ingresar)

# 3. Resultado esperado:
#    ✅ HTTP 201
#    Success: true
#    Venta creada (NO valida caja porque es CONTRA_ENTREGA)
```

---

## 📝 Logs Generados

### Log de Éxito (Caja Validada)

```
[2026-01-21 14:30:45] production.INFO:
[ApiProformaController::convertirAVenta] Validación de caja exitosa
{
  "proforma_id": 45,
  "usuario_id": 5,
  "caja_id": 1,
  "politica": "ANTICIPADO_100",
  "monto": 1000
}
```

### Log de Error (Sin Caja)

```
[2026-01-21 14:35:20] production.WARNING:
[ApiProformaController::convertirAVenta]
Intento de conversión sin caja abierta
{
  "proforma_id": 45,
  "politica_pago": "ANTICIPADO_100",
  "usuario_id": 5,
  "tiene_caja_abierta": false
}
```

---

## 🔧 Cambios Realizados

### En `ApiProformaController::convertirAVenta()`

**ANTES:**
```php
// Sin validación de caja
// Solo registraba con log warning si fallaba
```

**AHORA:**
```php
// Validación 0.1: Bloquea si no hay caja abierta
if (in_array($politica, $politicasQueRequierenCaja) && $montoPagado > 0) {
    // Verifica empleado
    // Verifica rol Cajero
    // Verifica caja abierta

    if (!$empleado->tieneCajaAbierta()) {
        return response()->json([
            'success' => false,
            'message' => "No puede convertir proforma sin caja abierta...",
            'code' => 'CAJA_NO_ABIERTA',
            ...
        ], 422);
    }
}
```

---

## ✅ Validación Completa

- [x] Usuarios con caja abierta pueden convertir
- [x] Usuarios sin caja abierta NO pueden convertir con ANTICIPADO_100
- [x] Usuarios sin caja abierta NO pueden convertir con MEDIO_MEDIO
- [x] CONTRA_ENTREGA funciona sin caja
- [x] CREDITO funciona sin caja
- [x] Mensaje claro al usuario
- [x] Detalles útiles de acción requerida
- [x] Logs de validación

---

## 📞 Preguntas Frecuentes

**P: ¿Qué pasa si inicio sesión sin caja abierta?**
R: Puede ver proformas y acceder al sistema, pero NO puede convertir con ANTICIPADO_100 o MEDIO_MEDIO.

**P: ¿Cómo abro una caja?**
R: Ir a `/cajas` → Click "Abrir Caja" → Seleccionar caja → Ingresar monto inicial.

**P: ¿Puedo convertir con CONTRA_ENTREGA sin caja?**
R: Sí, CONTRA_ENTREGA no requiere caja abierta porque el pago se hace después.

**P: ¿Qué pasa si cierro caja y hay una conversión en curso?**
R: La conversión fallará porque ya no tiene caja abierta.

---

**Última actualización:** 2026-01-21
**Estado:** ✅ Implementado y Validado
