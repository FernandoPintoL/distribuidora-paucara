# Guía de Validación: Registro de Cajas en Conversión de Proformas

## ✅ Checklist de Implementación

### 1. Verificar que el código fue agregado

```bash
# Buscar el nuevo método
grep -n "registrarMovimientoCajaParaPago" app/Http/Controllers/Api/ApiProformaController.php

# Debe mostrar:
# 2214:                // ✅ NUEVO: Registrar movimiento de caja para pagos inmediatos
# 2221:                    $venta,
# ...
# 2781:    private function registrarMovimientoCajaParaPago(
```

✅ Si aparecen resultados, el código está en lugar.

---

## 🧪 Pruebas Manuales

### Escenario 1: ANTICIPADO_100 con Caja Abierta

**Prerrequisitos:**
1. Usuario con rol Cajero
2. Empleado asociado al usuario
3. Caja abierta para el día actual
4. Proforma con política ANTICIPADO_100

**Pasos:**
```
1. Ir a /cajas
   └─ Verificar que hay una caja abierta "Caja Principal" o similar

2. Ir a /proformas
   └─ Encontrar proforma con estado PENDIENTE

3. Abrir proforma
   └─ Click en "Aprobar y Convertir con Pago"

4. En el modal:
   └─ Seleccionar: ANTICIPADO_100
   └─ Tipo de pago: EFECTIVO
   └─ Monto: (ingrese el 100% del total)
   └─ Click "Aprobar y Convertir"

5. Verificar resultado:
   ✅ Modal cierra
   ✅ Página recarga
   ✅ Proforma ahora estado = CONVERTIDA
   ✅ Se crea venta con estado_pago = PAGADO
```

**Validar Movimiento de Caja:**
```
1. Ir a /cajas/{caja_id}
   └─ Ver movimientos del día
   └─ Debe aparecer nuevo movimiento:
      * Número documento: VNT-XXXXX (número de venta)
      * Descripción: "100% ANTICIPADO"
      * Monto: (el monto pagado)
      * Tipo: VENTA

2. O verificar en BD:
   php artisan tinker
   > $movs = \App\Models\MovimientoCaja::latest('fecha')->limit(5)->get()
   > $movs->each(fn($m) => echo $m->numero_documento . ": " . $m->monto . "\n")

   Debe mostrar el movimiento más reciente con el número de venta
```

---

### Escenario 2: MEDIO_MEDIO con Anticipo

**Pasos:**
```
1. Abrir otra proforma con MEDIO_MEDIO

2. En modal:
   └─ Seleccionar: MEDIO_MEDIO
   └─ Tipo de pago: EFECTIVO
   └─ Monto: (ingrese 50% del total)
   └─ Click "Aprobar y Convertir"

3. Verificar Movimiento:
   └─ Debe aparecer en cajas con:
      * Observaciones: "50% ANTICIPO"
      * Monto: 50% del total
      * Venta estado_pago = PARCIAL
```

---

### Escenario 3: CONTRA_ENTREGA (sin pago)

**Pasos:**
```
1. Abrir proforma con CONTRA_ENTREGA

2. En modal:
   └─ No aparece campo de pago
   └─ Está deshabilitada la opción de pago

3. Convertir
   └─ Venta estado_pago = PENDIENTE
   └─ NO debe aparecer movimiento de caja

4. Verificar:
   php artisan tinker
   > $venta = \App\Models\Venta::latest()->first()
   > $venta->politica_pago  // "CONTRA_ENTREGA"
   > $venta->monto_pagado   // 0
```

---

## 📊 Verificación en BD

### Consulta 1: Ver movimientos registrados hoy

```sql
SELECT
    m.id,
    m.numero_documento,
    m.monto,
    m.observaciones,
    m.fecha,
    u.name as usuario,
    c.nombre as caja
FROM movimientos_caja m
JOIN users u ON m.user_id = u.id
JOIN cajas c ON m.caja_id = c.id
WHERE DATE(m.fecha) = CURDATE()
ORDER BY m.fecha DESC;
```

**Resultado esperado:**
```
| id | numero_documento | monto | observaciones | fecha | usuario | caja |
|----|------------------|-------|---------------|-------|---------|------|
| 45 | VNT-00123 | 1000 | Venta #VNT-00123 (100% ANTICIPADO) - Convertida desde proforma #PRF-00045 | 2026-01-21 14:30:45 | Admin | Principal |
```

### Consulta 2: Vincular venta con movimiento de caja

```sql
SELECT
    v.numero as venta_numero,
    v.politica_pago,
    v.estado_pago,
    v.monto_pagado,
    v.monto_pendiente,
    (SELECT SUM(monto) FROM movimientos_caja WHERE numero_documento = v.numero) as movimiento_caja_total
FROM ventas v
WHERE v.numero = 'VNT-00123';
```

**Resultado esperado:**
```
| venta_numero | politica_pago | estado_pago | monto_pagado | monto_pendiente | movimiento_caja_total |
|--------------|---------------|-------------|--------------|-----------------|----------------------|
| VNT-00123 | ANTICIPADO_100 | PAGADO | 1000.00 | 0.00 | 1000.00 |
```

---

## 🔍 Verificación de Logs

### Línea de Log Exitosa

Buscar en logs:
```bash
# En archivo de logs (laravel.log)
tail -f storage/logs/laravel.log | grep "registrarMovimientoCajaParaPago"

# Debe mostrar:
[2026-01-21 14:30:45] production.INFO:
[registrarMovimientoCajaParaPago] Movimiento de caja registrado exitosamente
venta_id: 123
proforma_id: 45
caja_id: 1
usuario_id: 5
monto: 1000
politica: ANTICIPADO_100
tipo_pago: 100% ANTICIPADO
```

### Línea de Log Advertencia (esperada para algunos casos)

```
[registrarMovimientoCajaParaPago] Usuario no tiene caja abierta
   usuario_id: 8
   venta_id: 124
   politica: MEDIO_MEDIO
```

---

## 🧪 Test en Artisan Tinker

```bash
php artisan tinker

# Verificar que el método existe
> method_exists(\App\Http\Controllers\Api\ApiProformaController::class, 'registrarMovimientoCajaParaPago')
=> true

# Obtener la venta más reciente creada desde proforma
> $venta = \App\Models\Venta::whereNotNull('proforma_id')->latest()->first()
> $venta->numero
=> "VNT-00123"

# Obtener movimiento de caja correspondiente
> $movimiento = \App\Models\MovimientoCaja::where('numero_documento', $venta->numero)->first()
> $movimiento ? "Encontrado" : "NO ENCONTRADO"
=> "Encontrado"

# Ver detalles del movimiento
> dd($movimiento->toArray())
```

**Resultado esperado:**
```
Array (
    [id] => 45
    [caja_id] => 1
    [user_id] => 5
    [fecha] => "2026-01-21 14:30:45"
    [monto] => "1000.00"
    [observaciones] => "Venta #VNT-00123 (100% ANTICIPADO) - Convertida desde proforma #PRF-00045"
    [numero_documento] => "VNT-00123"
    [tipo_operacion_id] => 4
)
```

---

## ⚠️ Posibles Problemas y Soluciones

### Problema 1: "Movimiento de caja no se registra"

**Causas posibles:**
1. Usuario no tiene empleado asociado
2. Empleado no tiene caja abierta
3. TipoOperacionCaja 'VENTA' no existe

**Solución:**
```bash
php artisan tinker

# Verificar usuario
> $user = \App\Models\User::find(5)
> $user->empleado  # Debe retornar un empleado

# Verificar caja abierta
> $empleado = $user->empleado
> $empleado->cajaAbierta()  # Debe retornar una caja

# Verificar tipo operación
> \App\Models\TipoOperacionCaja::where('codigo', 'VENTA')->first()
# Debe retornar algo, si no:
> \App\Models\TipoOperacionCaja::create(['codigo' => 'VENTA', 'nombre' => 'Venta', 'activo' => true])
```

### Problema 2: "Error al registrar MovimientoCaja"

**Revisar logs:**
```bash
tail -200 storage/logs/laravel.log | grep "Error al registrar movimiento"
```

**Errores comunes:**
- `Column 'tipo_operacion_id' cannot be null` → TipoOperacionCaja no existe
- `Column 'caja_id' cannot be null` → Usuario sin caja
- `Column 'user_id' cannot be null` → Usuario no identificado

---

## 📈 Casos Especiales

### Caso: Usuario es Admin sin rol Cajero

```
Usuario: Super Admin (no tiene rol Cajero)
Acción: Convertir con ANTICIPADO_100
Resultado:
- Venta se crea ✅
- Movimiento de caja NO se registra ⚠️ (esperado)
- Log: "Usuario no tiene empleado asociado"
```

### Caso: Usuario Cajero pero caja está cerrada

```
Usuario: Cajero (tiene empleado)
Caja: Cerrada (no tiene apertura sin cierre)
Acción: Convertir con ANTICIPADO_100
Resultado:
- Venta se crea ✅
- Movimiento de caja NO se registra ⚠️ (esperado)
- Log: "Usuario no tiene caja abierta"
```

### Caso: CREDITO (nunca registra)

```
Política: CREDITO
Con pago: false
Acción: Convertir
Resultado:
- Venta se crea ✅
- Movimiento de caja NO se registra ✅ (correcto)
- Log: "Política no requiere registro inmediato"
```

---

## ✅ Lista de Verificación Final

- [ ] El código fue agregado en `ApiProformaController.php`
- [ ] Se puede convertir proforma con ANTICIPADO_100
- [ ] Se puede convertir proforma con MEDIO_MEDIO
- [ ] Se registra movimiento en `movimientos_caja` ✅
- [ ] El monto es correcto ✅
- [ ] El número de documento es correcto ✅
- [ ] El observaciones contiene detalles ✅
- [ ] La caja se actualiza en cierre de caja ✅
- [ ] Los logs muestran información correcta ✅
- [ ] Los casos especiales se manejan correctamente ✅
- [ ] No se bloquean las conversiones por errores en cajas ✅

---

## 📞 Soporte

Si encuentra problemas:

1. **Revisar logs:**
   ```bash
   tail -100 storage/logs/laravel.log | grep -i caja
   ```

2. **Ejecutar en Tinker:**
   ```bash
   php artisan tinker
   > $m = \App\Models\MovimientoCaja::latest()->first()
   > dd($m)
   ```

3. **Verificar estructura de datos:**
   ```bash
   php artisan migrate --seed  # Si necesita datos de prueba
   ```

---

**Última actualización:** 2026-01-21
**Estado:** ✅ Implementado y Listo para Pruebas
