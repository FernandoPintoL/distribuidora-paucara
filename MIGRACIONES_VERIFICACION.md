# 🔍 VERIFICACIÓN DE MIGRACIONES - Estado Real

**Fecha:** 2025-10-25
**Propósito:** Confirmar qué migraciones existen y cuáles NO

---

## ✅ MIGRACIONES QUE EXISTEN (CREADAS)

### 1. Tabla `envios` - EXISTE ✅

**Archivo:** `2025_09_11_150708_create_envios_table.php`
**Creada:** 11 de Septiembre
**Estado:** Migración base creada

**Campos:**
- id, numero_envio, venta_id, vehiculo_id, chofer_id
- fecha_programada, fecha_salida, fecha_entrega
- estado (PROGRAMADO, EN_PREPARACION, EN_RUTA, ENTREGADO, CANCELADO)
- direccion_entrega, coordenadas_lat, coordenadas_lng
- observaciones, foto_entrega, firma_cliente
- receptor_nombre, receptor_documento
- timestamps

### 2. Tabla `pagos` - EXISTE ✅

**Archivo:** `2025_09_09_042245_create_pagos_table.php`
**Creada:** 9 de Septiembre
**Estado:** Migración base creada

**Campos:**
- id, venta_id, tipo_pago_id, moneda_id
- monto, fecha, numero_transaccion
- observaciones, timestamps

**Nota:** Esta tabla es para pagos en general (compatible con CuentaPorPagar también)

### 3. Campos para Rechazo de Entregas - EXISTE ✅

**Archivo:** `2025_10_25_030126_add_rejection_fields_to_envios_table.php`
**Creada:** 25 de Octubre (HOY)
**Estado:** Migración CREADA pero POSIBLEMENTE NO EJECUTADA

**Campos agregados a tabla `envios`:**
```php
$table->string('estado_entrega')->nullable();      // EXITOSA, CLIENTE_AUSENTE, TIENDA_CERRADA, OTRO_PROBLEMA
$table->text('motivo_rechazo')->nullable();        // Descripción del rechazo
$table->json('fotos_rechazo')->nullable();         // Array JSON de rutas
$table->dateTime('fecha_intento_entrega')->nullable();
```

**Índices:**
- estado_entrega
- fecha_intento_entrega

---

## ❌ MIGRACIONES QUE NO EXISTEN (FALTA CREAR)

### 1. Agregar Campos de Pago a `ventas` - NO EXISTE ❌

**Archivo necesario:** `2025_10_25_add_payment_fields_to_ventas_table.php` (NO CREADO)

**Campos que necesitan agregarse:**
```php
$table->decimal('monto_pagado', 12, 2)->default(0);
$table->decimal('monto_pendiente', 12, 2)->default(0);
$table->string('politica_pago')->default('CONTRA_ENTREGA');  // ANTICIPADO_100, MEDIO_MEDIO, CONTRA_ENTREGA
$table->string('estado_pago')->default('PENDIENTE');         // PENDIENTE, PARCIALMENTE_PAGADO, PAGADO
```

**Estado:** ⏳ DEBE CREARSE E IMPLEMENTARSE

---

## 📊 TABLA RESUMEN

| Migración | Archivo | Existe | Ejecutada | Nota |
|-----------|---------|--------|-----------|------|
| **Tabla ventas** | `2025_09_09_025536_create_ventas_table.php` | ✅ | ✅ Asumido | Base creada |
| **Tabla pagos** | `2025_09_09_042245_create_pagos_table.php` | ✅ | ✅ Asumido | Base creada |
| **Tabla envios** | `2025_09_11_150708_create_envios_table.php` | ✅ | ✅ Asumido | Base creada |
| **Rechazo entregas** | `2025_10_25_030126_add_rejection_fields_to_envios_table.php` | ✅ | ❓ DUDOSO | Archivo existe pero NO sabemos si se ejecutó |
| **Pagos en ventas** | `2025_10_25_add_payment_fields_to_ventas_table.php` | ❌ | ❌ NO | NO EXISTE - DEBE CREARSE |

---

## 🚨 VERIFICACIÓN CRÍTICA

### ¿Se ejecutó la migración de rechazo?

Para verificar si la migración de rechazo fue ejecutada, necesitarías conectarte a la BD y verificar:

```sql
DESCRIBE envios;
-- O
SHOW COLUMNS FROM envios;
```

Si ves estas columnas, fue ejecutada:
- ✅ `estado_entrega`
- ✅ `motivo_rechazo`
- ✅ `fotos_rechazo`
- ✅ `fecha_intento_entrega`

Si NO ves estas columnas, fue CREADA pero NO ejecutada.

---

## 📋 ESTADO ACTUAL

### Migración de Rechazo (Hoy creada)

```
Archivo: ✅ EXISTE
Contenido: ✅ CORRECTO
Ejecutada: ❓ DESCONOCIDO (Probablemente NO)
```

**Para ejecutarla:**
```bash
cd D:\paucara\distribuidora-paucara
php artisan migrate
```

### Migración de Pagos en Ventas

```
Archivo: ❌ NO EXISTE
Contenido: ⏳ NECESITA CREARSE
Ejecutada: ❌ NO
```

**Debe crearse así:**

1. Crear archivo de migración:
```bash
php artisan make:migration add_payment_fields_to_ventas_table
```

2. Agregar código:
```php
public function up(): void
{
    Schema::table('ventas', function (Blueprint $table) {
        $table->decimal('monto_pagado', 12, 2)->default(0);
        $table->decimal('monto_pendiente', 12, 2)->default(0);
        $table->string('politica_pago')->default('CONTRA_ENTREGA');
        $table->string('estado_pago')->default('PENDIENTE');

        $table->index('estado_pago');
        $table->index(['cliente_id', 'estado_pago']);
    });
}

public function down(): void
{
    Schema::table('ventas', function (Blueprint $table) {
        $table->dropIndex(['estado_pago']);
        $table->dropIndex(['cliente_id', 'estado_pago']);
        $table->dropColumn([
            'monto_pagado',
            'monto_pendiente',
            'politica_pago',
            'estado_pago'
        ]);
    });
}
```

3. Ejecutar:
```bash
php artisan migrate
```

---

## 🎯 CONCLUSIÓN

| Tarea | Estado |
|-------|--------|
| **Migración rechazo entregas** | ✅ Archivo listo, ❓ Necesita ejecutar |
| **Migración pagos en ventas** | ❌ No existe, ⏳ Necesita crear + ejecutar |
| **Modelos actualizados** | ✅ Venta.php y Envio.php listos |
| **Controladores** | ✅ EnvioController::rechazarEntrega() listo, ⏳ Endpoints de pago pendientes |
| **Rutas API** | ✅ Rechazo listo, ⏳ Pagos pendientes |

---

## ✅ PRÓXIMOS PASOS INMEDIATOS

### AHORA (Hoy - 30 minutos)

```bash
# 1. Ejecutar la migración de rechazo que ya existe
php artisan migrate

# 2. Verificar que los campos aparecieron
php artisan tinker
> Schema::getColumns('envios')
# Busca: estado_entrega, motivo_rechazo, fotos_rechazo, fecha_intento_entrega
```

### HOY (Primeras 4 horas)

```bash
# 3. Crear migración de pagos
php artisan make:migration add_payment_fields_to_ventas_table

# 4. Editar el archivo creado (copiar código arriba)

# 5. Ejecutar la migración
php artisan migrate
```

### DESPUÉS (Siguientes 3 horas)

- Crear endpoints de confirmación de proforma
- Crear endpoints de registro de pagos
- Validaciones

---

**Actualización:** 2025-10-25
**Verificado:** Archivos de migraciones en disco
**Pendiente:** Verificar si fueron ejecutadas en la BD
