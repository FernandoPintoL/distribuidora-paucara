# Seeder: Plantillas de Impresión para Pagos

## Descripción

El seeder `PagosPlantillaImpresionSeeder` crea las plantillas de impresión necesarias para imprimir recibos de pago en tres formatos diferentes:

- **TICKET_80**: Formato de ticket de 80mm (impresoras térmicas estándar)
- **TICKET_58**: Formato de ticket de 58mm (impresoras térmicas estrechas)
- **A4**: Formato de hoja completa A4 (impresoras de escritorio)

## Plantillas Creadas

| Código | Formato | Nombre | Vista Blade |
|--------|---------|--------|------------|
| PAGO_TICKET_80 | TICKET_80 | Pago Ticket 80mm | impresion.pagos.ticket-80 |
| PAGO_TICKET_58 | TICKET_58 | Pago Ticket 58mm | impresion.pagos.ticket-58 |
| PAGO_A4 | A4 | Pago Hoja Completa A4 | impresion.pagos.hoja-completa |

## Cómo Usar

### Opción 1: Ejecutar solo este seeder

```bash
php artisan db:seed --class=PagosPlantillaImpresionSeeder
```

### Opción 2: Ejecutar todos los seeders (incluyendo este)

```bash
php artisan db:seed
```

### Opción 3: Ejecutar con la opción --fresh (borra la DB y la reconstruye)

```bash
php artisan migrate:fresh --seed
```

## Características

✅ **Idempotente**: Si las plantillas ya existen, el seeder las salta sin crear duplicados

✅ **Automático**: Se ejecuta automáticamente si corres `php artisan db:seed` sin especificar clase

✅ **Validación**: Verifica que exista la empresa principal antes de crear plantillas

✅ **Mensajes informativos**: Muestra qué plantillas se crean y cuáles ya existen

## Instalación en Nueva BD

1. Clone o prepare la base de datos nueva
2. Ejecute las migraciones:
   ```bash
   php artisan migrate
   ```
3. Ejecute los seeders (incluye PagosPlantillaImpresionSeeder automáticamente):
   ```bash
   php artisan db:seed
   ```

## Vistas Blade Requeridas

Las siguientes vistas blade deben existir en `resources/views/impresion/pagos/`:

- `ticket-80.blade.php`
- `ticket-58.blade.php`
- `hoja-completa.blade.php`

## Funcionalidad de Impresión

Una vez que este seeder se ejecuta, los pagos pueden imprimirse desde:

**Ruta**: `GET /compras/pagos/{pago_id}/imprimir?formato={FORMATO}&accion={ACCION}`

**Parámetros**:
- `formato`: TICKET_80 (default), TICKET_58, A4
- `accion`: stream (imprimir), download (descargar)

**Ejemplo**:
```
/compras/pagos/18/imprimir?formato=TICKET_80&accion=stream
```

## Solución de Problemas

### Error: "No existe empresa principal"
- Asegúrate de que existe una empresa principal en la BD
- Ejecuta `php artisan migrate` primero

### Error: "Vistas blade no encontradas"
- Verifica que existan los archivos en `resources/views/impresion/pagos/`
- Los archivos deben existir para que las plantillas funcionen

### Las plantillas no aparecen en la UI
- Ejecuta `php artisan config:clear`
- Ejecuta `php artisan cache:clear`
- Refresca el navegador

## Campos de la Tabla

La tabla `plantillas_impresion` contiene:
- `id`: ID único
- `empresa_id`: Empresa asociada
- `codigo`: Código único (ej: PAGO_TICKET_80)
- `nombre`: Nombre descriptivo
- `tipo_documento`: Tipo de documento (pago, venta, etc.)
- `formato`: Formato de impresión (TICKET_80, TICKET_58, A4)
- `vista_blade`: Ruta de la vista blade
- `activo`: Booleano (true/false)
- `es_default`: Si es plantilla por defecto
- `orden`: Orden de prioridad
- `configuracion`: JSON con configuración adicional
- `created_at`, `updated_at`: Timestamps

## Notas

- Cada formato tiene una vista blade diferente optimizada para sus dimensiones
- Las plantillas usan la empresa principal por defecto
- El seeder es seguro de ejecutar múltiples veces (no crea duplicados)
