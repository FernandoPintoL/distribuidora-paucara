# 📋 Seeder: Tipo Operación Caja - Direcciones

## 🎯 Objetivo

Asignar direcciones (`ENTRADA`, `SALIDA`, `AJUSTE`, `ESPECIAL`) a todos los tipos de operación de caja, permitiendo que `CierreCajaService` clasifique movimientos sin lógica hardcodeada.

---

## 📊 Clasificación de Direcciones

### 📥 ENTRADA (Ingresos de dinero)
- `VENTA` - Venta registrada
- `PAGO` - Pago de crédito recibido
- `INGRESO_EXTRA` - Ingresos extraordinarios

### 📤 SALIDA (Egresos de dinero)
- `COMPRA` - Compra registrada
- `GASTOS` - Gastos de operación
- `PAGO_SUELDO` - Pago de nómina
- `ANTICIPO` - Anticipo a empleados
- `ANULACION` - Anulación de venta

### 🔧 AJUSTE (Operaciones especiales)
- `AJUSTE` - Ajuste de inventario/caja
- `CREDITO` - Movimiento de crédito

### 🔐 ESPECIAL (Operaciones del sistema)
- `APERTURA` - Apertura de caja
- `CIERRE` - Cierre de caja

---

## 🚀 Ejecución

### Opción 1: Fresh Database (RECOMENDADO)

Si estás inicializando la BD desde cero:

```bash
php artisan migrate:fresh --seed
```

✅ Ejecutará automáticamente `TipoOperacionCajaDireccionSeeder` después de `TipoOperacionCajaSeeder`

---

### Opción 2: Solo el Seeder (Database Existente)

Si ya tienes datos y necesitas ejecutar SOLO este seeder:

```bash
php artisan seed:tipo-operacion-direcciones
```

✅ Te pedirá confirmación antes de ejecutar
✅ Mostrará las clasificaciones que se asignarán
✅ Opción `--force` para ejecutar sin confirmar:

```bash
php artisan seed:tipo-operacion-direcciones --force
```

---

### Opción 3: Seeder Completo (Todos los seeders)

Si necesitas ejecutar todos los seeders:

```bash
php artisan db:seed
```

✅ Ejecutará automáticamente `TipoOperacionCajaDireccionSeeder` en el orden correcto

---

## 📝 Verificación

### Ver Resultados en BD

```sql
SELECT id, codigo, nombre, direccion FROM tipo_operacion_caja ORDER BY codigo;
```

**Esperado**:
```
id | codigo          | nombre                | direccion
---|-----------------|----------------------|----------
1  | VENTA           | Venta                 | ENTRADA
2  | PAGO            | Pago                  | ENTRADA
3  | COMPRA          | Compra                | SALIDA
4  | GASTOS          | Gastos                | SALIDA
5  | PAGO_SUELDO     | Pago de Sueldo        | SALIDA
6  | ANTICIPO        | Anticipo              | SALIDA
7  | ANULACION       | Anulación             | SALIDA
8  | AJUSTE          | Ajuste                | AJUSTE
9  | CREDITO         | Crédito               | AJUSTE
10 | APERTURA        | Apertura              | ESPECIAL
11 | CIERRE          | Cierre                | ESPECIAL
12 | INGRESO_EXTRA   | Ingreso Extra         | ENTRADA
```

### Verificar en la Aplicación

```php
// En tinker
php artisan tinker

// Ver tipos con dirección
App\Models\TipoOperacionCaja::all()->pluck('codigo', 'direccion');

// Ver por dirección específica
App\Models\TipoOperacionCaja::where('direccion', 'ENTRADA')->get();
```

---

## 🔄 Cambiar Clasificación Posterior

Si necesitas cambiar la clasificación de un tipo de operación:

```sql
UPDATE tipo_operacion_caja SET direccion = 'SALIDA' WHERE codigo = 'GASTOS';
```

**Beneficio**: La clasificación es administrativa en la BD, no hardcodeada en código.

---

## 🔗 Relación con CierreCajaService

`CierreCajaService` usa la columna `direccion` para:

```php
// Calcular ingresos totales
$movimientos
    ->filter(fn($m) => $m->tipoOperacion?->direccion === 'ENTRADA')
    ->sum('monto');

// Calcular egresos totales
$movimientos
    ->filter(fn($m) => $m->tipoOperacion?->direccion === 'SALIDA')
    ->sum('monto');
```

✅ No hay hardcoding de tipos específicos
✅ Es fácil agregar nuevos tipos sin cambiar código
✅ Es fácil cambiar clasificación desde BD

---

## 📁 Archivos Relacionados

| Archivo | Descripción |
|---------|-------------|
| `database/migrations/2026_02_10_100420_add_direccion_to_tipo_operacion_caja.php` | Crea columna `direccion` |
| `database/seeders/TipoOperacionCajaDireccionSeeder.php` | Asigna direcciones |
| `database/seeders/DatabaseSeeder.php` | Llama al seeder (REGISTRADO) |
| `app/Console/Commands/SeedTipoOperacionDirecciones.php` | Comando artisan para ejecutar |
| `app/Services/CierreCajaService.php` | Usa `direccion` para cálculos |

---

## ✅ Checklist

- [ ] Migración ejecutada: `php artisan migrate`
- [ ] Seeder ejecutado: `php artisan db:seed` o `php artisan seed:tipo-operacion-direcciones`
- [ ] Verificar BD: Columna `direccion` tiene valores
- [ ] Verificar CierreCajaService: Usa `direccion` en filtros
- [ ] Probar cierre de caja: Debe funcionar sin errores

---

**Status**: ✅ Seeder registrado en DatabaseSeeder.php
**Fecha**: 2026-02-11
**Comando**: `php artisan seed:tipo-operacion-direcciones`
