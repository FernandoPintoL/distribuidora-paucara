# 🧪 Testing Manual: Validación de Caja para Conversión

## 📋 Configuración Previa

### 1. Preparar Usuario Admin (Tinker)

```bash
php artisan tinker
```

```php
// Obtener usuario admin
$user = User::where('email', 'admin@example.com')->first();

// Obtener empleado
$empleado = $user->empleado;

// Verificar que sea cajero
$user->hasRole('Cajero'); // debe ser true

// Salir
exit
```

---

## 🧪 Test 1: Conversión con Caja Abierta HOY

### Paso 1: Abrir Caja

**URL:** `POST /cajas/abrir`

```bash
curl -X POST http://localhost:8000/cajas/abrir \
  -H "Accept: application/json" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "monto_apertura": 5000
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Caja abierta exitosamente",
  "apertura_id": 123
}
```

---

### Paso 2: Crear Proforma

**URL:** `POST /api/proformas`

```bash
curl -X POST http://localhost:8000/api/proformas \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "cliente_id": 1,
    "items": [{"producto_id": 1, "cantidad": 5, "precio": 100}]
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "proforma_id": 29,
  "total": 500
}
```

---

### Paso 3: Convertir Proforma a Venta

**URL:** `POST /api/proformas/29/convertir-venta`

```bash
curl -X POST http://localhost:8000/api/proformas/29/convertir-venta \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "con_pago": true,
    "tipo_pago_id": 1,
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 500
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Venta creada exitosamente",
  "venta_id": 100,
  "validacion_caja": {
    "estado": "ABIERTA",
    "caja_id": 5
  }
}
```

**Verificación en Logs:**
```bash
tail -f storage/logs/laravel.log | grep "convertirAVenta"
```

Debe mostrar:
```
[2026-01-21 10:30:45] ✅ [ApiProformaController::convertirAVenta] Validación de caja exitosa
{
  "proforma_id": 29,
  "usuario_id": 1,
  "estado_caja": "ABIERTA",
  "caja_id": 5,
  "politica": "ANTICIPADO_100",
  "monto": 500
}
```

---

## 🧪 Test 2: Conversión con Caja Consolidada (< 24h)

### Paso 1: Cerrar Caja (Crear CierreCaja con estado PENDIENTE)

**URL:** `POST /cajas/cerrar`

```bash
curl -X POST http://localhost:8000/cajas/cerrar \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "monto_real": 5450,
    "observaciones": "Conteo manual realizado"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Caja cerrada exitosamente",
  "cierre": {
    "id": 50,
    "estado": "PENDIENTE"
  }
}
```

---

### Paso 2: Consolidar Cierre (Admin aprueba)

**URL:** `POST /api/admin/cierres/50/consolidar`

```bash
curl -X POST http://localhost:8000/api/admin/cierres/50/consolidar \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "observaciones": "Verificado correctamente"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Cierre consolidado exitosamente",
  "data": {
    "cierre_id": 50,
    "estado_nuevo": "CONSOLIDADA"
  }
}
```

---

### Paso 3: Verificar en BD

**Tinker:**
```bash
php artisan tinker
```

```php
// Obtener el cierre
$cierre = \App\Models\CierreCaja::find(50);

// Verificar estado
$cierre->estadoCierre->codigo; // debe ser "CONSOLIDADA"
$cierre->fecha; // debe ser hoy
$cierre->usuario_verificador_id; // debe tener ID del admin

exit
```

---

### Paso 4: Día siguiente, convertir sin abrir caja nueva

**Asumir:** Hoy es día siguiente, no hay caja abierta aún

**URL:** `POST /api/proformas/30/convertir-venta`

```bash
curl -X POST http://localhost:8000/api/proformas/30/convertir-venta \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "con_pago": true,
    "tipo_pago_id": 1,
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 600
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "message": "Venta creada exitosamente",
  "venta_id": 101,
  "validacion_caja": {
    "estado": "CONSOLIDADA_ANTERIOR",
    "cierre_id": 50,
    "fecha": "2026-01-21"
  }
}
```

**Verificación en Logs:**
```
[2026-01-22 09:15:30] ✅ [ApiProformaController::convertirAVenta] Validación de caja exitosa
{
  "proforma_id": 30,
  "usuario_id": 1,
  "estado_caja": "CONSOLIDADA_ANTERIOR",
  "caja_id": 5,
  "politica": "ANTICIPADO_100",
  "monto": 600
}
```

---

## 🧪 Test 3: Conversión Sin Caja Disponible

### Paso 1: Scenario Setup

- Sin caja abierta
- Sin cierre consolidado en últimas 24 horas

### Paso 2: Intentar Convertir

**URL:** `POST /api/proformas/31/convertir-venta`

```bash
curl -X POST http://localhost:8000/api/proformas/31/convertir-venta \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "con_pago": true,
    "tipo_pago_id": 1,
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 700
  }'
```

**Respuesta esperada: ERROR 422**
```json
{
  "success": false,
  "message": "No puede convertir proforma a venta con política 'ANTICIPADO_100' sin una caja abierta o consolidada. Por favor, abra una caja primero.",
  "code": "CAJA_NO_DISPONIBLE",
  "detalles": {
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 700,
    "motivo": "La política ANTICIPADO_100 requiere una caja abierta HOY o una caja consolidada del día anterior",
    "estado_caja_actual": "SIN_CAJA",
    "accion_requerida": "Abra una caja en /cajas antes de convertir esta proforma"
  }
}
```

---

## 🧪 Test 4: Caja Consolidada Antigua (> 24h)

### Paso 1: Scenario Setup

- Cierre consolidado hace 48 horas
- Sin caja abierta

### Paso 2: Verificar en BD

**Tinker:**
```bash
php artisan tinker
```

```php
// Obtener cierre antiguo
$cierreAntiguo = \App\Models\CierreCaja::where('estado_cierre_id', function($q) {
    $q->select('id')->from('estados_cierre')
      ->where('codigo', 'CONSOLIDADA');
})
->where('fecha', '<', now()->subDay())
->first();

// Si existe, es muy antiguo
$cierreAntiguo?->fecha; // hace 48+ horas

exit
```

### Paso 3: Intentar Convertir

**URL:** `POST /api/proformas/32/convertir-venta`

```bash
curl -X POST http://localhost:8000/api/proformas/32/convertir-venta \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "con_pago": true,
    "tipo_pago_id": 1,
    "politica_pago": "ANTICIPADO_100",
    "monto_pagado": 800
  }'
```

**Respuesta esperada: ERROR 422**
```json
{
  "success": false,
  "message": "No puede convertir proforma a venta con política 'ANTICIPADO_100' sin una caja abierta o consolidada. Por favor, abra una caja primero.",
  "code": "CAJA_NO_DISPONIBLE",
  "detalles": {
    "estado_caja_actual": "SIN_CAJA",
    "accion_requerida": "Abra una caja en /cajas"
  }
}
```

---

## 🧪 Test 5: Políticas Sin Requerimiento de Caja

### Test: CREDITO (No requiere caja)

**URL:** `POST /api/proformas/33/convertir-venta`

```bash
curl -X POST http://localhost:8000/api/proformas/33/convertir-venta \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "con_pago": false,
    "politica_pago": "CREDITO"
  }'
```

**Respuesta esperada: 200 OK** (sin validación de caja)
```json
{
  "success": true,
  "message": "Venta creada exitosamente",
  "venta_id": 103,
  "nota": "Política CREDITO no requiere validación de caja"
}
```

---

### Test: CONTRA_ENTREGA (No requiere caja)

**URL:** `POST /api/proformas/34/convertir-venta`

```bash
curl -X POST http://localhost:8000/api/proformas/34/convertir-venta \
  -H "Accept: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{
    "con_pago": false,
    "politica_pago": "CONTRA_ENTREGA"
  }'
```

**Respuesta esperada: 200 OK** (sin validación de caja)
```json
{
  "success": true,
  "message": "Venta creada exitosamente",
  "venta_id": 104
}
```

---

## 📊 Tabla de Resultados

| Test | Caja Abierta | Caja Consolidada | Política | Resultado | Código |
|------|:---:|:---:|:---:|:---:|:---:|
| Test 1 | ✅ | N/A | ANTICIPADO_100 | ✅ 200 | venta_id |
| Test 2 | ❌ | ✅ (<24h) | ANTICIPADO_100 | ✅ 200 | venta_id |
| Test 3 | ❌ | ❌ | ANTICIPADO_100 | ❌ 422 | CAJA_NO_DISPONIBLE |
| Test 4 | ❌ | ✅ (>24h) | ANTICIPADO_100 | ❌ 422 | CAJA_NO_DISPONIBLE |
| Test 5a | ❌ | ❌ | CREDITO | ✅ 200 | venta_id |
| Test 5b | ❌ | ❌ | CONTRA_ENTREGA | ✅ 200 | venta_id |

---

## 📝 Comandos Útiles

### Ver Logs en Tiempo Real
```bash
tail -f storage/logs/laravel.log | grep -E "convertirAVenta|CAJA_NO"
```

### Limpiar Logs
```bash
echo "" > storage/logs/laravel.log
```

### Verificar Estado de Aperturas y Cierres
```bash
php artisan tinker
```

```php
$usuario = User::find(1);
$empleado = $usuario->empleado;

// Aperturas sin cierre (cajas abiertas)
$cajaAbierta = $empleado->aperturasCaja()
    ->whereDoesntHave('cierre')
    ->first();

// Cierres consolidados en últimas 24h
$cierreConsolidado = $empleado->cierresCaja()
    ->whereHas('estadoCierre', fn($q) => $q->where('codigo', 'CONSOLIDADA'))
    ->whereDate('fecha', '>=', now()->subDay())
    ->first();

echo "Caja abierta: " . ($cajaAbierta ? "SÍ" : "NO") . "\n";
echo "Cierre consolidado: " . ($cierreConsolidado ? "SÍ" : "NO") . "\n";
echo "Validación: " . ($empleado->tieneCajaAbiertaOConsolidadaDelDia() ? "✅ PASS" : "❌ FAIL") . "\n";

exit
```

---

## 🔧 Debugging

### Si el Test falla, verificar:

1. **Usuario sin empleado**
   ```php
   User::find(1)->empleado // debe retornar Empleado object
   ```

2. **Empleado no es cajero**
   ```php
   User::find(1)->hasRole('Cajero') // debe ser true
   ```

3. **Validación de caja**
   ```php
   $empleado->tieneCajaAbiertaOConsolidadaDelDia() // debe ser true si hay caja
   ```

4. **Estado de estadoCierre**
   ```php
   EstadoCierre::all() // verificar que existan los 4 estados
   ```

5. **Fecha de cierre**
   ```php
   CierreCaja::latest()->first()->fecha // verificar que sea correcta
   ```

---

## ✅ Checklist de Testing

- [ ] Test 1: Conversión con caja abierta - ✅ PASS
- [ ] Test 2: Conversión con caja consolidada (<24h) - ✅ PASS
- [ ] Test 3: Conversión sin caja - ❌ 422 ESPERADO
- [ ] Test 4: Conversión con caja antigua (>24h) - ❌ 422 ESPERADO
- [ ] Test 5a: Política CREDITO sin caja - ✅ PASS
- [ ] Test 5b: Política CONTRA_ENTREGA sin caja - ✅ PASS
- [ ] Logs contienen información correcta - ✅ VERIFICADO
- [ ] Mensajes de error son claros - ✅ VERIFICADO

---

**Testing realizado:** [fecha]
**Resultado:** ✅ TODO FUNCIONA
**Responsable:** [tu nombre]
