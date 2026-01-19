# ✨ Guía: Productos Fraccionados

## 📋 Resumen

Los **productos fraccionados** permiten que un producto se venda en diferentes unidades de medida. Por ejemplo, comprar en **CAJAS** (almacenamiento) pero vender en **TABLETAS** (al público).

---

## 🔑 Condicional Principal

Para que un usuario pueda crear productos fraccionados, debe cumplirse:

```
empresas.permite_productos_fraccionados = true
```

**Ubicación:** Tabla `empresas`, columna booleana

---

## 📍 Dónde se Valida

| Lugar | Comprobación |
|-------|--------------|
| **Backend** | `ProductoController::edit()` línea 589 |
| **Frontend** | `Step1DatosProducto.tsx` línea 481 |
| **Validación** | `StoreProductoRequest` línea 398 |

---

## 🚀 Activar Productos Fraccionados

### **Opción 1: Comando Artisan (Recomendado)**

**Activar para UNA empresa específica:**
```bash
php artisan empresas:activar-productos-fraccionados --empresa-id=1
```

**Activar para TODAS las empresas:**
```bash
php artisan empresas:activar-productos-fraccionados --all
```

**Ver estado actual:**
```bash
php artisan empresas:activar-productos-fraccionados
```

### **Opción 2: Seeder**

```bash
php artisan db:seed --class=ActivarProductosFraccionadosSeeder
```

### **Opción 3: Base de Datos Directa**

```sql
UPDATE empresas
SET permite_productos_fraccionados = true
WHERE id = 1;
```

### **Opción 4: Laravel Tinker**

```bash
php artisan tinker
```

```php
$empresa = App\Models\Empresa::find(1);
$empresa->update(['permite_productos_fraccionados' => true]);
exit
```

---

## 📊 Validaciones Backend

Cuando `es_fraccionado = true`, el producto DEBE tener:

### ✅ Al Menos Una Conversión

```php
if ($esFraccionado && empty($conversiones)) {
    // Error: "Un producto fraccionado debe tener al menos una conversión"
}
```

### ✅ Una Única Conversión Principal

```php
if ($principalesCount > 1) {
    // Error: "Solo puede existir una conversión principal"
}
```

### ✅ Unidades Diferentes

```php
'different:conversiones.*.unidad_base_id' // Error si son iguales
```

---

## 🛠️ Workflow Crear Producto Fraccionado

```
1. Ir a /productos/create
   ↓
2. Rellenar "Datos del Producto"
   ↓
3. Ver checkbox "⚡ Permitir Conversiones de Unidades"
   (Solo si permite_productos_fraccionados = true)
   ↓
4. Marcar checkbox para activar modo fraccionado
   ↓
5. Rellenar "Precios y códigos"
   ↓
6. (NUEVO) Ir a pestaña "Conversiones"
   ↓
7. Agregar conversiones:
   - Unidad base: CAJA
   - Unidad destino: TABLETA
   - Factor: 30 (1 caja = 30 tabletas)
   ↓
8. Marcar "Es conversión principal"
   ↓
9. Guardar producto
```

---

## 💾 Estructura de Datos

### Tabla: `empresas`

```sql
ALTER TABLE empresas ADD COLUMN permite_productos_fraccionados BOOLEAN DEFAULT FALSE;
```

| Campo | Tipo | Default | Indexed |
|-------|------|---------|---------|
| `permite_productos_fraccionados` | BOOLEAN | false | Sí |

### Tabla: `conversiones_unidad`

```sql
CREATE TABLE conversiones_unidad (
    id BIGINT PRIMARY KEY,
    producto_id BIGINT FOREIGN KEY,
    unidad_base_id BIGINT FOREIGN KEY,
    unidad_destino_id BIGINT FOREIGN KEY,
    factor_conversion DECIMAL(10,4),
    activo BOOLEAN DEFAULT true,
    es_conversion_principal BOOLEAN DEFAULT false,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

---

## 🧪 Verificar Estado

### **Ver qué empresas tienen habilitado:**

```sql
SELECT id, nombre, permite_productos_fraccionados
FROM empresas
WHERE activo = true;
```

### **Contar productos fraccionados:**

```sql
SELECT COUNT(*) as cantidad
FROM productos
WHERE es_fraccionado = true;
```

### **Ver conversiones de un producto:**

```sql
SELECT
    p.nombre as producto,
    ub.nombre as unidad_base,
    ud.nombre as unidad_destino,
    c.factor_conversion,
    c.es_conversion_principal
FROM conversiones_unidad c
JOIN productos p ON c.producto_id = p.id
JOIN unidades_medida ub ON c.unidad_base_id = ub.id
JOIN unidades_medida ud ON c.unidad_destino_id = ud.id
WHERE p.id = 1;
```

---

## 🚨 Troubleshooting

### ❌ "No veo la opción de productos fraccionados"

**Causa:** `permite_productos_fraccionados = false` en tu empresa

**Solución:**
```bash
php artisan empresas:activar-productos-fraccionados --empresa-id=YOUR_EMPRESA_ID
```

### ❌ "Error: Un producto fraccionado debe tener al menos una conversión"

**Causa:** Marcaste "fraccionado" pero no agregaste conversiones

**Solución:** Ve a la pestaña "Conversiones" y agrega al menos una

### ❌ "Error: Solo puede existir una conversión principal"

**Causa:** Marcaste más de una conversión como "principal"

**Solución:** Solo marca una como principal

---

## 📱 Campos Relacionados

### Frontend (`data` object)

```typescript
{
  es_fraccionado?: boolean;           // Si es fraccionado
  conversiones?: ConversionUnidad[];  // Array de conversiones
}
```

### Backend (Modelo `Producto`)

```php
protected $fillable = [
    'es_fraccionado',    // boolean
    'conversiones',      // relation
];
```

---

## 🔗 Archivos Clave

| Archivo | Línea | Propósito |
|---------|-------|----------|
| `ProductoController.php` | 589 | Pasa `permite_productos_fraccionados` |
| `Step1DatosProducto.tsx` | 481 | Renderiza checkbox si está habilitado |
| `StoreProductoRequest.php` | 398 | Valida conversiones si es fraccionado |
| `Empresa.php` | 34, 43 | Define y castea el campo |
| `Producto.php` | - | Relación `conversiones()` |

---

## 📞 Contacto

¿Dudas sobre productos fraccionados?

- 📖 Ver: `PRODUCTOS_FRACCIONADOS_GUIA.md` (este archivo)
- 🔧 Ejecutar: `php artisan empresas:activar-productos-fraccionados --all`
- 💬 Consultar BD: Ver sección "Verificar Estado"

---

**Última actualización:** 2026-01-18
