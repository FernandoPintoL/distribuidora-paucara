# Implementación: Registro de Movimientos de Caja en Conversión de Proformas

## 📋 Resumen de Cambios

Se implementó el registro automático de movimientos de caja cuando se convierte una proforma a venta con políticas de pago que requieren pagos inmediatos.

### Archivos Modificados
- `app/Http/Controllers/Api/ApiProformaController.php`

### Nueva Funcionalidad
- Método privado: `registrarMovimientoCajaParaPago()`
- Integración en: `ApiProformaController::convertirAVenta()`

---

## 🎯 Funcionalidad

### ¿Cuándo se registra?

Se registra un movimiento de caja cuando:

1. ✅ Se convierte proforma a venta llamando a `/api/proformas/{id}/convertir-venta`
2. ✅ La política de pago es `ANTICIPADO_100` o `MEDIO_MEDIO`
3. ✅ El `monto_pagado > 0`
4. ✅ El usuario tiene caja abierta

### Políticas Registradas

| Política | Monto | Se Registra | Descripción |
|----------|-------|------------|-------------|
| **ANTICIPADO_100** | 100% | ✅ Sí | Anticipo registrado como 100% ANTICIPADO |
| **MEDIO_MEDIO** | 50%+ | ✅ Sí | Anticipo registrado como 50% ANTICIPO |
| **CONTRA_ENTREGA** | $0 | ❌ No | Se registra después en entrega |
| **CREDITO** | $0 | ❌ No | No requiere pago inmediato |

---

## 🔧 Implementación Técnica

### Lugar de Registro

En `ApiProformaController::convertirAVenta()` después de consumir reservas:

```php
// ✅ NUEVO: Registrar movimiento de caja para pagos inmediatos
$this->registrarMovimientoCajaParaPago(
    $venta,
    $proforma,
    $politica,
    $montoPagado,
    request()->user()
);
```

### Método Privado

```php
private function registrarMovimientoCajaParaPago(
    \App\Models\Venta $venta,
    \App\Models\Proforma $proforma,
    string $politica,
    float $montoPagado,
    \App\Models\User $usuario
): void
```

**Parámetros:**
- `$venta`: Venta recién creada
- `$proforma`: Proforma original
- `$politica`: Política de pago (ANTICIPADO_100, MEDIO_MEDIO)
- `$montoPagado`: Monto que se pagó
- `$usuario`: Usuario que realiza la conversión

**Lógica:**
1. Valida que `$montoPagado > 0`
2. Valida que la política esté en lista de políticas con pago inmediato
3. Obtiene empleado del usuario: `$usuario->empleado`
4. Obtiene caja abierta: `$empleado->cajaAbierta()`
5. Si existe caja, crea `MovimientoCaja` con:
   - `caja_id`: ID de la caja abierta
   - `user_id`: ID del usuario
   - `tipo_operacion_id`: ID tipo "VENTA"
   - `numero_documento`: Número de venta
   - `monto`: Monto pagado
   - `fecha`: Fecha actual
   - `observaciones`: Detalles de proforma y política

---

## 📊 Flujo Completo de Datos

### FLUJO: ANTICIPADO_100

```
Frontend (Show.tsx)
    ↓
    Usuario selecciona: ANTICIPADO_100
    Usuario ingresa: Bs. 1000 (100% del total)
    Usuario selecciona: EFECTIVO
    ↓
POST /api/proformas/{id}/convertir-venta
    ├─ Body:
    │   ├─ con_pago: true
    │   ├─ tipo_pago_id: 1
    │   ├─ politica_pago: "ANTICIPADO_100"
    │   ├─ monto_pagado: 1000
    │   └─ numero_recibo: "REC-001"
    ↓
Backend (ApiProformaController)
    ├─ Valida datos de pago ✓
    ├─ Crea venta con:
    │   ├─ estado_pago: PAGADO (porque monto_pagado >= total)
    │   ├─ monto_pagado: 1000
    │   └─ monto_pendiente: 0
    ├─ Consume reservas ✓
    ├─ Llama: registrarMovimientoCajaParaPago()
    │   ├─ Obtiene caja abierta del usuario ✓
    │   ├─ Crea MovimientoCaja:
    │   │   ├─ caja_id: 1
    │   │   ├─ user_id: 5
    │   │   ├─ tipo_operacion_id: 4 (VENTA)
    │   │   ├─ numero_documento: "VNT-00123"
    │   │   ├─ monto: 1000
    │   │   ├─ fecha: 2026-01-21 14:30:45
    │   │   └─ observaciones: "Venta #VNT-00123 (100% ANTICIPADO) - Convertida desde proforma #PRF-00045"
    │   └─ Log: ✅ Registro exitoso
    └─ Retorna 201 con venta creada
    ↓
Frontend
    └─ Recarga página
    └─ Venta aparece en listar ventas
    └─ Caja del usuario refleja +Bs. 1000
```

### FLUJO: MEDIO_MEDIO

```
Frontend
    ↓
    Usuario selecciona: MEDIO_MEDIO
    Usuario ingresa: Bs. 500 (50% del total Bs. 1000)
    ↓
POST /api/proformas/{id}/convertir-venta
    ├─ Body:
    │   ├─ politica_pago: "MEDIO_MEDIO"
    │   ├─ monto_pagado: 500
    │   └─ ...
    ↓
Backend
    ├─ Crea venta con:
    │   ├─ estado_pago: PARCIAL (500 >= 500%, pero < 100%)
    │   ├─ monto_pagado: 500
    │   └─ monto_pendiente: 500 (a cobrar en entrega)
    ├─ Registra MovimientoCaja:
    │   ├─ monto: 500 (ANTICIPO)
    │   └─ observaciones: "Venta #VNT-00124 (50% ANTICIPO) - ..."
    └─ Retorna venta
    ↓
Frontend
    └─ Venta creada
    ↓
    (Después - Chofer entrega venta)
    ↓
Entrega cobra Bs. 500 restantes
    ├─ Se registra OTRO movimiento de caja
    ├─ monto: 500 (CONTRAENTREGA)
    └─ Total en caja: 500 + 500 = 1000 ✓
```

---

## ⚠️ Manejo de Errores

### Validaciones

```php
1. ❌ $montoPagado <= 0
   └─ Log warning, NO registra (es normal para algunas políticas)

2. ❌ Política no en [ANTICIPADO_100, MEDIO_MEDIO]
   └─ Log info, NO registra (política no requiere registro inmediato)

3. ❌ Usuario sin empleado
   └─ Log warning, NO registra (usuario no es empleado)

4. ❌ Empleado sin caja abierta
   └─ Log warning, NO registra (pero no bloquea la conversión)

5. ❌ TipoOperacionCaja 'VENTA' no existe
   └─ Log error, NO registra (pero no bloquea la conversión)

6. ❌ Excepción al crear MovimientoCaja
   └─ Log error, NO registra, NO bloquea la conversión
```

### Importante: No Bloquea Conversión

**La conversión de proforma a venta NUNCA se bloquea por errores en cajas.**

Si falla algo al registrar el movimiento de caja:
- ✅ La venta ya fue creada
- ✅ Las reservas ya fueron consumidas
- ⚠️ Pero el movimiento de caja NO se registró
- 🔧 Requiere corrección manual

**Logs ayudan a identificar el problema:**
```
❌ Error al registrar movimiento de caja
   venta_id: 123
   error: "Table 'cajas' not found"
   trace: [stack trace completo]
```

---

## 📱 Flujo Desde Frontend (Show.tsx)

### Línea 660: `handleAprobarYConvertirConPago()`

```typescript
const handleAprobarYConvertirConPago = async () => {
    // PASO 1: Actualizar detalles (si hay cambios)

    // PASO 2: Aprobar proforma
    POST /api/proformas/{id}/aprobar

    // PASO 3: Convertir a venta CON PAGO
    POST /api/proformas/{id}/convertir-venta
    ├─ Body: {
    │   con_pago: true,
    │   tipo_pago_id: 1,
    │   politica_pago: 'ANTICIPADO_100',
    │   monto_pagado: 1000,
    │   numero_recibo: 'REC-001'
    │ }
    └─ Backend ejecuta: registrarMovimientoCajaParaPago()

    // PASO 4: Actualizar stocks
    POST /proformas/{id}/procesar-venta

    // PASO 5: Recargar
    window.location.reload()
}
```

---

## 🧪 Casos de Prueba

### Caso 1: ANTICIPADO_100 con Usuario con Caja Abierta ✅

**Setup:**
```
Usuario: Admin (ID: 5, Empleado)
Rol: Cajero
Caja: Abierta hoy (Caja ID: 1)
Proforma: PRF-100 (Total: Bs. 1000)
```

**Acción:**
```
1. Aprobar proforma
2. Convertir con:
   - Política: ANTICIPADO_100
   - Tipo Pago: EFECTIVO (ID: 1)
   - Monto: Bs. 1000
```

**Resultado Esperado:**
```
✅ Venta creada: VNT-001
✅ estado_pago: PAGADO
✅ monto_pagado: 1000
✅ MovimientoCaja registrado:
   {
     caja_id: 1,
     user_id: 5,
     tipo_operacion_id: 4,
     numero_documento: 'VNT-001',
     monto: 1000,
     observaciones: 'Venta #VNT-001 (100% ANTICIPADO) - ...'
   }
✅ Log: "✅ Movimiento de caja registrado exitosamente"
```

### Caso 2: MEDIO_MEDIO sin Usuario con Caja ⚠️

**Setup:**
```
Usuario: Super Admin (ID: 1, No Empleado)
Proforma: PRF-101 (Total: Bs. 1000)
```

**Acción:**
```
Convertir con: MEDIO_MEDIO, Monto: 500
```

**Resultado Esperado:**
```
✅ Venta creada: VNT-002
✅ estado_pago: PARCIAL
⚠️ MovimientoCaja NO registrado
⚠️ Log warning: "Usuario no tiene empleado asociado"
ℹ️ Conversión exitosa (no bloqueada)
```

### Caso 3: ANTICIPADO_100 sin TipoOperacionCaja VENTA ⚠️

**Setup:**
```
TipoOperacionCaja::VENTA no existe
Usuario con caja abierta
```

**Acción:**
```
Convertir con: ANTICIPADO_100, Monto: 1000
```

**Resultado Esperado:**
```
✅ Venta creada: VNT-003
❌ MovimientoCaja NO registrado
❌ Log error: "Tipo operación VENTA no existe"
ℹ️ Conversión exitosa (no bloqueada)
⚠️ Requiere corrección manual (crear tipo operación)
```

### Caso 4: CONTRA_ENTREGA ✅

**Setup:**
```
Proforma con política CONTRA_ENTREGA
Usuario con caja abierta
```

**Acción:**
```
Convertir con: CONTRA_ENTREGA, Monto: 0
```

**Resultado Esperado:**
```
✅ Venta creada: VNT-004
✅ estado_pago: PENDIENTE
⚠️ MovimientoCaja NO registrado (correcto)
ℹ️ Log info: "Política no requiere registro inmediato"
✅ El registro se hará cuando se entregue y cobre
```

---

## 🔍 Monitoreo y Debugging

### Logs Importantes

```
✅ Éxito:
[registrarMovimientoCajaParaPago] Movimiento de caja registrado exitosamente
   venta_id: 123
   caja_id: 1
   monto: 1000
   politica: ANTICIPADO_100

⚠️ Advertencia (no bloquea):
[registrarMovimientoCajaParaPago] Usuario no tiene caja abierta
   usuario_id: 5
   venta_id: 123
   politica: ANTICIPADO_100

❌ Error (no bloquea):
[registrarMovimientoCajaParaPago] Error al registrar movimiento
   venta_id: 123
   error: "Column 'caja_id' cannot be null"
   trace: [...]
```

### Comando de Verificación (Artisan)

```bash
# Ver movimientos de caja de hoy
php artisan tinker
> \App\Models\MovimientoCaja::whereDate('fecha', today())->get()

# Ver movimientos de una caja específica
> \App\Models\MovimientoCaja::where('caja_id', 1)->latest()->limit(10)->get()

# Ver movimientos generados por conversión de proformas
> \App\Models\MovimientoCaja::where('observaciones', 'like', '%Convertida desde proforma%')->get()
```

---

## 🚀 Integración Futura

### Próximas Mejoras

1. **Registrar también en ProformaService**
   - Si se necesita en otros flujos
   - Actualmente solo ApiProformaController tiene el dato de pago

2. **Integración con Pago::create()**
   - Cuando se implemente tabla de `pagos` completa
   - Vincular `MovimientoCaja` con `Pago`

3. **Reportes de Cajas**
   - Dashboard mostrando anticipos registrados
   - Reconciliación automática de anticipos vs cobros finales

4. **Auditoría Mejorada**
   - Historial de quién registró qué
   - Tracking de cambios en movimientos

---

## 📚 Referencias

### Archivos Relacionados
- `app/Http/Controllers/Api/ApiProformaController.php` - Implementación principal
- `app/Models/MovimientoCaja.php` - Modelo de movimiento de caja
- `app/Models/Traits/CajeroTrait.php` - Métodos para cajeros (cajaAbierta)
- `resources/js/presentation/pages/Proformas/Show.tsx` - Frontend que invoca la conversión
- `app/Http/Controllers/Api/EntregaController.php` - Referencia similar en entregas

### Tablas de BD
- `movimientos_caja` - Donde se registran los movimientos
- `cajas` - Cajas de cada usuario
- `aperturas_caja` - Aperturas de caja (para obtener caja activa)
- `ventas` - Ventas creadas

---

## ✅ Checklist de Validación

- [x] Método implementado: `registrarMovimientoCajaParaPago()`
- [x] Llamada desde: `convertirAVenta()` después de consumir reservas
- [x] Campos correctos en `MovimientoCaja::create()`
- [x] Manejo de errores (no bloquea conversión)
- [x] Validaciones de políticas
- [x] Validaciones de usuario/caja
- [x] Logs detallados
- [x] Documentación completa

---

**Última actualización:** 2026-01-21
**Estado:** ✅ Implementado y Documentado
