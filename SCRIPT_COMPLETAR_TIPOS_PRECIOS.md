# Script para Completar Tipos de Precios a Productos

Este script completa automáticamente todos los tipos de precios faltantes a los productos ya registrados en la base de datos.

## 📋 ¿Qué hace?

1. Obtiene todos los **productos activos** de la BD
2. Obtiene todos los **tipos de precio activos** de la BD
3. Para cada producto, identifica qué tipos de precio le faltan
4. Crea automáticamente registros de precios para los tipos faltantes con **precio = 0**

## 🚀 Opción 1: Usando Artisan Command (RECOMENDADO)

### Paso 1: Simulación (sin guardar cambios)

Para ver qué cambios se harían sin realmente guardarlos:

```bash
php artisan productos:completar-tipos-precios --dry-run
```

**Ejemplo de salida:**
```
🚀 Iniciando proceso de completar tipos de precios...

⚠️  MODO SIMULACIÓN: Los cambios NO serán guardados

📦 Total de productos activos: 125
💰 Total de tipos de precio activos: 4

[████████████████████████] 100%

✅ Proceso completado!

📊 Resumen:
  • Productos actualizados: 87
  • Precios creados: 218

ℹ️  Esto fue una SIMULACIÓN. Para guardar los cambios, ejecuta:
   php artisan productos:completar-tipos-precios
```

### Paso 2: Ejecutar en producción

Una vez verificado que todo es correcto, ejecuta sin el flag `--dry-run`:

```bash
php artisan productos:completar-tipos-precios
```

**Salida:**
```
🚀 Iniciando proceso de completar tipos de precios...

📦 Total de productos activos: 125
💰 Total de tipos de precio activos: 4

[████████████████████████] 100%

✅ Proceso completado!

📊 Resumen:
  • Productos actualizados: 87
  • Precios creados: 218

🎉 Todos los tipos de precios han sido completados exitosamente!
```

---

## 🌱 Opción 2: Usando Seeder

### Paso 1: Ejecutar el seeder

```bash
php artisan db:seed --class=CompletarTiposPreciosSeeder
```

**Salida:**
```
🚀 Completando tipos de precios a productos existentes...

📦 Procesando 125 productos...
💰 Tipos de precio disponibles: 4

  📝 Producto A - Agregando 2 tipos de precio
  📝 Producto B - Agregando 1 tipos de precio
  ...

✅ Proceso completado!
  • Productos actualizados: 87
  • Precios creados: 218
```

---

## 📊 Información Técnica

### Datos Creados

Para cada precio faltante se crea un registro con:

| Campo | Valor |
|-------|-------|
| `producto_id` | ID del producto |
| `tipo_precio_id` | ID del tipo de precio |
| `precio` | **0** (debe completarse manualmente) |
| `activo` | `true` |
| `es_precio_base` | Heredado del `TipoPrecio` |
| `margen_ganancia` | 0 |
| `porcentaje_ganancia` | 0 |
| `motivo_cambio` | "Creado automáticamente..." |

### Base de Datos Afectada

- **Tabla:** `precios_producto`
- **Operación:** INSERT (solo crea nuevos registros, no modifica existentes)
- **Seguridad:** Verifica que el tipo de precio no exista antes de crear

---

## ⚠️ Consideraciones Importantes

1. **Precios en 0**: Los precios creados tienen valor **0**, es decir, deberán completarse manualmente o mediante otro script.

2. **Solo crea faltantes**: Si un producto ya tiene un tipo de precio, no lo duplica.

3. **Solo productos activos**: Solo procesa productos con `activo = true`.

4. **Solo tipos de precio activos**: Solo completa con tipos de precio con `activo = true`.

5. **Sin historial**: No crea registros en la tabla `historial_precios`.

---

## 🔧 Modificar el Script

Si necesitas cambiar los valores por defecto, edita los archivos:

- **Comando:** `app/Console/Commands/CompletarTiposPreciosProductos.php`
- **Seeder:** `database/seeders/CompletarTiposPreciosSeeder.php`

### Cambiar precio por defecto

Busca esta línea en ambos archivos:

```php
'precio' => 0, // ← Cambiar este valor
```

Ejemplo: si quieres que se cree con precio = 10:

```php
'precio' => 10,
```

---

## 📈 Script para Completar Precios Automáticamente

Después de completar los tipos de precios, si quieres que los precios se llenen automáticamente basados en el precio base y un porcentaje, puedes usar este comando (próximamente):

```bash
php artisan productos:calcular-precios-ganancia
```

---

## 🆘 Troubleshooting

### Error: "Command not found"

Asegúrate de que el archivo esté en la ubicación correcta:
```
app/Console/Commands/CompletarTiposPreciosProductos.php
```

Y ejecuta:
```bash
php artisan list
```

Debería aparecer `productos:completar-tipos-precios` en la lista.

### Error: "Class not found"

Ejecuta:
```bash
composer dump-autoload
```

### Nada sucedió

Verifica que existan:
- ✅ Productos con `activo = true`
- ✅ Tipos de precio con `activo = true`

Si todo está inactivo, no hay nada que completar.

---

## 📝 Logs

El script proporciona información detallada:
- ✅ Total de productos procesados
- 💰 Total de tipos de precio
- 📊 Resumen de cambios
- 📝 Productos actualizados

---

## 🎯 Caso de Uso Típico

1. **Agregar nuevos tipos de precio** al sistema
2. **Ejecutar simulación** con `--dry-run` para verificar
3. **Ejecutar en producción** si el resultado es correcto
4. **Completar manualmente** los precios en la interfaz
5. **Verificar** que todos los productos tengan precios para todos los tipos

---

## 📞 Preguntas Frecuentes

**P: ¿Modifica productos inactivos?**
R: No, solo procesa productos con `activo = true`.

**P: ¿Elimina precios existentes?**
R: No, solo crea registros nuevos para tipos de precio faltantes.

**P: ¿Puedo ejecutarlo varias veces?**
R: Sí, es seguro. Solo creará precios para tipos que falten.

**P: ¿Cómo revierío los cambios?**
R: Ejecuta:
```bash
php artisan migrate:rollback --step=1
```

(Si quieres revertir completamente)

O elimina manualmente los registros con:
```sql
DELETE FROM precios_producto
WHERE motivo_cambio LIKE 'Creado automáticamente%';
```

---

Creado automáticamente para completar tipos de precios a productos existentes.
