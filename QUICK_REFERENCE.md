# Quick Reference - Registro de Cajas en Proformas

## ¿Qué cambió?

**1 archivo modificado:**
- `app/Http/Controllers/Api/ApiProformaController.php`

**2 cambios principales:**
1. Línea 2214: Llamada a nuevo método `registrarMovimientoCajaParaPago()`
2. Línea 2781: Implementación del método privado

---

## 📌 Resumen en 30 segundos

Cuando un usuario convierte una proforma a venta con:
- Política: `ANTICIPADO_100` o `MEDIO_MEDIO`
- Monto pagado: > 0
- Usuario tiene caja abierta

Se registra automáticamente un **MovimientoCaja** en la tabla `movimientos_caja` con:
```
├─ caja_id: caja abierta del usuario
├─ user_id: usuario actual
├─ tipo_operacion_id: tipo VENTA
├─ numero_documento: número de venta
├─ monto: lo que se pagó
└─ observaciones: detalles de la conversión
```

---

## 🔍 Verificación Rápida

### Opción 1: Código Existe
```bash
grep "registrarMovimientoCajaParaPago" \
app/Http/Controllers/Api/ApiProformaController.php
```
Debe retornar varias líneas.

### Opción 2: Convertir y Validar
```
1. Ir a /proformas
2. Seleccionar proforma
3. Aprobar y convertir con ANTICIPADO_100, monto > 0
4. Venta debe crearse ✅
5. Movimiento debe aparecer en cajas ✅
```

### Opción 3: Base de Datos
```sql
SELECT * FROM movimientos_caja
WHERE numero_documento = 'VNT-00123'
LIMIT 1;
```
Debe retornar el registro.

---

## 🚀 Flujo Ejecutado

```
handleAprobarYConvertirConPago()
    ↓
POST /api/proformas/{id}/convertir-venta
    ↓
ApiProformaController::convertirAVenta()
    ├─ Crea Venta ✅
    ├─ Consume reservas ✅
    ├─ registrarMovimientoCajaParaPago() ← 🆕 NUEVO
    │   └─ Obtiene caja abierta del usuario
    │   └─ Registra en MovimientoCaja
    └─ Retorna venta
```

---

## ⚡ Puntos Clave

✅ **Registra:**
- ANTICIPADO_100: 100% ANTICIPADO
- MEDIO_MEDIO: 50% ANTICIPO

❌ **NO registra:**
- CONTRA_ENTREGA (se registra al entregar)
- CREDITO (no requiere pago)

⚠️ **Importante:**
- Cada usuario con su propia caja
- No bloquea la conversión si falla
- Logs detallados de todo

---

## 📊 Campos Registrados

| Campo | Valor |
|-------|-------|
| `caja_id` | ID de caja abierta del usuario |
| `user_id` | ID del usuario que convierte |
| `tipo_operacion_id` | ID tipo "VENTA" |
| `numero_documento` | Número de venta (VNT-XXXXX) |
| `monto` | Monto pagado |
| `fecha` | Fecha/hora actual |
| `observaciones` | Detalles: venta, proforma, política |

---

## 🧪 Test Rápido

```bash
php artisan tinker

# Obtener última venta creada desde proforma
> $v = \App\Models\Venta::whereNotNull('proforma_id')->latest()->first()
> $v->numero
=> "VNT-00123"

# Verificar que movimiento existe
> \App\Models\MovimientoCaja::where('numero_documento', $v->numero)->first()
=> Movimiento encontrado con monto correspondiente
```

---

## 📋 Checklist

- [ ] Código existe en ApiProformaController.php
- [ ] Puedo convertir proforma con ANTICIPADO_100
- [ ] Aparece movimiento en movimientos_caja
- [ ] Monto es correcto
- [ ] Observaciones tienen detalles
- [ ] Funciona para MEDIO_MEDIO también
- [ ] No afecta CONTRA_ENTREGA o CREDITO
- [ ] Logs muestran información correcta

---

## 🎯 Lo Más Importante

**Cada usuario tiene su propia caja y se valida automáticamente.**

Cuando se convierte una proforma con pago inmediato:
1. Se obtiene la caja abierta del usuario → `user->empleado->cajaAbierta()`
2. Se registra el movimiento en esa caja
3. El saldo de la caja aumenta automáticamente
4. El movimiento aparece en cierre de cajas

---

## 📚 Documentación Completa

- **IMPLEMENTACION_CAJAS_PROFORMA.md** - Detalles técnicos
- **VALIDAR_IMPLEMENTACION.md** - Pruebas y validación
- **RESUMEN_CAMBIOS.txt** - Este documento

---

**Estado:** ✅ Listo para usar
**Última actualización:** 2026-01-21
