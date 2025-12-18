# Guía de Validación de Datos Críticos

## 🎯 Objetivo

Prevenir errores 404 causados por datos faltantes en la base de datos. Las rutas pueden fallar cuando los controladores intenten hacer `firstOrFail()` o `findOrFail()` en modelos que no existen.

---

## 🛠️ Herramientas Disponibles

### 1. **Comando de Validación Manual**

Valida los datos sin crear nada:

```bash
php artisan validate:system-data
```

Salida esperada:
```
🔍 Validando datos críticos del sistema...

📦 Tipos de Ajuste de Inventario:
  ✅ INVENTARIO_INICIAL
  ✅ AJUSTE_FISICO
  ✅ DONACION
  ✅ CORRECCION

🗑️  Estados de Merma:
  ✅ REGISTRADA
  ✅ APROBADA
  ✅ RECHAZADA

🏷️  Tipos de Merma:
  ✅ ROTURA
  ✅ VENCIMIENTO
  ✅ HURTO
  ✅ DEVOLUCION
  ✅ OBSOLETO
  ✅ OTRO

✅ Validación completada
  - Validaciones: 13
  - Datos creados: 0
```

### 2. **Comando de Validación y Reparación Automática**

Valida y crea automáticamente los datos faltantes:

```bash
php artisan validate:system-data --fix
```

Salida esperada cuando hay datos faltantes:
```
❌ INVENTARIO_INICIAL - FALTANTE
    ➕ Creado automáticamente
```

### 3. **Seeder de Validación**

Ejecuta automáticamente cuando haces `php artisan db:seed`

Se ejecuta al final para asegurar que todos los datos críticos existan.

```bash
php artisan db:seed
```

O ejecutar solo este seeder:

```bash
php artisan db:seed --class=ValidateAndCreateRequiredDataSeeder
```

---

## 📋 Datos Validados

### Tipos de Ajuste de Inventario
| Clave | Label | Descripción |
|-------|-------|-------------|
| INVENTARIO_INICIAL | Inventario Inicial | Carga inicial de inventario |
| AJUSTE_FISICO | Ajuste Físico | Diferencia entre conteo y sistema |
| DONACION | Donación | Salida por donación |
| CORRECCION | Corrección | Corrección de errores |

### Estados de Merma
| Clave | Nombre |
|-------|--------|
| REGISTRADA | Registrada |
| APROBADA | Aprobada |
| RECHAZADA | Rechazada |

### Tipos de Merma
| Clave | Nombre |
|-------|--------|
| ROTURA | Rotura |
| VENCIMIENTO | Vencimiento |
| HURTO | Hurto |
| DEVOLUCION | Devolución |
| OBSOLETO | Obsoleto |
| OTRO | Otro |

---

## 🚀 Flujo de Trabajo Recomendado

### Después de `migrate:fresh`

```bash
# 1. Ejecutar migraciones
php artisan migrate

# 2. Ejecutar todos los seeders (incluye validación)
php artisan db:seed

# 3. (Opcional) Verificar que todo esté bien
php artisan validate:system-data
```

### Si encuentras un error 404

```bash
# 1. Verifica qué datos faltan
php artisan validate:system-data

# 2. Si hay faltantes, créalos automáticamente
php artisan validate:system-data --fix

# 3. Verifica que todo esté bien
php artisan validate:system-data
```

---

## 🔍 Debugging Manual

Si necesitas verificar manualmente:

```bash
php artisan tinker
```

```php
// Ver todos los tipos de ajuste
\App\Models\TipoAjusteInventario::all()->pluck('clave');

// Ver todos los estados de merma
\App\Models\EstadoMerma::all()->pluck('clave');

// Ver todos los tipos de merma
\App\Models\TipoMerma::all()->pluck('clave');

// Verificar si existe uno específico
\App\Models\TipoAjusteInventario::where('clave', 'INVENTARIO_INICIAL')->exists();
// true o false

exit;
```

---

## 🛡️ Prevención de Problemas Futuros

### En Controladores

```php
// ❌ MALO - Lanza 404 confuso
$tipo = TipoAjuste::where('clave', 'INVENTARIO_INICIAL')->firstOrFail();

// ✅ MEJOR - Manejo claro
$tipo = TipoAjuste::where('clave', 'INVENTARIO_INICIAL')->first();
if (!$tipo) {
    throw new \Exception('Dato crítico faltante: TipoAjuste INVENTARIO_INICIAL no existe');
}
```

### En Seeders

```php
// Documentar qué datos se requieren
/**
 * Módulo de Inventario
 *
 * Datos requeridos:
 * - TipoAjusteInventario: INVENTARIO_INICIAL, AJUSTE_FISICO, DONACION, CORRECCION
 * - EstadoMerma: REGISTRADA, APROBADA, RECHAZADA
 * - TipoMerma: ROTURA, VENCIMIENTO, HURTO, DEVOLUCION, OBSOLETO, OTRO
 */
class InventarioController extends Controller
{
    // ...
}
```

---

## 📊 Monitoreo Automático

El sistema valida automáticamente los datos en:

1. **`DatabaseSeeder`** - Al ejecutar `php artisan db:seed`
2. **`ValidateAndCreateRequiredDataSeeder`** - Seeder dedicado
3. **Comando artisan** - `php artisan validate:system-data`

---

## ⚠️ Problemas Comunes

### Error: "Model not found" o 404

**Causa:** Datos críticos faltantes
**Solución:** `php artisan validate:system-data --fix`

### Algunos datos faltan después de `db:seed`

**Causa:** Seeders incompletos o en orden incorrecto
**Solución:** El seeder de validación se ejecuta al final y crea los que falten

### Necesito agregar más validaciones

**Qué hacer:**
1. Editar `ValidateAndCreateRequiredDataSeeder.php`
2. Agregar nuevo método `private function validateXXX()`
3. Llamarlo en el método `run()`
4. También agregar al comando `ValidateSystemDataCommand.php`

---

## 📞 Contacto

Si encuentras datos que deben validarse pero no lo están, agrega:

1. El nombre del modelo
2. Los valores que debe validar
3. La ruta que falla

En un issue o commit en el repositorio.
