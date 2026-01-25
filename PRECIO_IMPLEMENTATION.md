# 💰 Implementación: Gestión de Precios con Detección de Cambios

## 🎯 Resumen de Cambios

Se ha implementado un sistema completo para gestionar cambios de precios cuando se aprueban compras:

1. **Service**: Detecta automáticamente cambios de costo
2. **Controller**: API y página web para gestionar precios
3. **Frontend**: Interfaz amigable para revisar y actualizar precios
4. **Rutas**: API y web routes completamente integradas

---

## 📁 Archivos Creados

### Backend

#### 1. **Service** - `app/Services/DetectarCambiosPrecioService.php`
```php
- procesarCompraAprobada($compra): Array
  → Detecta cambios en precios de costo
  → Actualiza precios automáticamente
  → Retorna lista de cambios para alertas

- obtenerCambiosRecientes($dias): Array
  → Obtiene todos los cambios en los últimos N días
```

#### 2. **Controller** - `app/Http/Controllers/PrecioController.php`
```php
- index(Request $request)
  → Página web de gestión de precios
  → GET /precios

- mostrarProducto(Producto $producto)
  → API: Obtiene precios de un producto
  → GET /api/precios/producto/{id}

- update(Request $request, PrecioProducto $precio)
  → API: Actualiza un precio
  → PUT /api/precios/{precio_id}

- historial(PrecioProducto $precio)
  → API: Obtiene historial completo
  → GET /api/precios/{precio_id}/historial

- cambiosRecientes(Request $request)
  → API: Cambios de los últimos N días
  → GET /api/precios/resumen/cambios-recientes

- resumen()
  → API: Resumen de alertas
  → GET /api/precios/resumen

- actualizarLote(Request $request)
  → API: Actualizar múltiples precios
  → POST /api/precios/actualizar-lote
```

### Frontend

#### 3. **Página React** - `resources/js/Pages/precios/index.tsx`
- ✅ Tabla con todos los productos y precios
- ✅ Busqueda por nombre/SKU
- ✅ Filtro por tipo de precio
- ✅ Modal para editar precios
- ✅ Historial visual de cambios
- ✅ Indicadores de margen (color según ganancia %)

---

## 🔄 Flujo de Funcionamiento

### Cuando se APRUEBA una compra:

```
1. CompraController::update()
   ↓
2. Cambio de estado BORRADOR → APROBADO
   ↓
3. Se registra inventario
   ↓
4. Se registra movimiento de caja
   ↓
5. ✨ NEW: DetectarCambiosPrecioService::procesarCompraAprobada()
   ├─ Compara precio de compra con precio de costo actual
   ├─ Si hay diferencia:
   │  ├─ Actualiza precio de costo automáticamente
   │  ├─ Registra cambio en historial_precios
   │  └─ Log de alertas
   └─ Retorna lista de productos con cambios
```

### El usuario revisa precios:

```
1. Usuario va a: /precios
   ↓
2. Ve tabla con todos los productos y precios
   ↓
3. Filtro por nombre/tipo de precio si lo necesita
   ↓
4. Hace clic en "Editar" en un precio
   ↓
5. Modal se abre con:
   - Precio anterior (lectura)
   - Nuevo precio (editable)
   - Motivo del cambio (obligatorio)
   - Diferencia de precio destacada
   ↓
6. Usuario actualiza el precio
   ↓
7. Se registra en historial_precios con motivo
   ↓
8. Página se recarga mostrando confirmación
```

---

## 📊 Base de Datos - Cambios

### Tablas Utilizadas

**`precios_producto`** (existente)
- `id`, `producto_id`, `tipo_precio_id`, `precio`, `motivo_cambio`, `updated_at`

**`historial_precios`** (existente - mejorada)
- Ahora registra cada cambio de precio:
  ```
  id
  precio_producto_id
  valor_anterior
  valor_nuevo
  fecha_cambio
  motivo (ej: "Actualización por compra #COMP20260124-0001")
  usuario
  tipo_precio_id
  porcentaje_cambio
  ```

---

## 🔌 Rutas API

### Obtener información de precios

```bash
# Obtener todos los precios de un producto
GET /api/precios/producto/123

# Obtener historial de un precio específico
GET /api/precios/45/historial?page=1

# Obtener cambios recientes (últimos 7 días)
GET /api/precios/resumen/cambios-recientes?dias=7

# Obtener resumen general y alertas
GET /api/precios/resumen
```

### Actualizar precios

```bash
# Actualizar un precio específico
PUT /api/precios/45
{
  "precio_nuevo": 15.50,
  "motivo": "Aumento por compra a mayor costo"
}

# Actualizar múltiples precios en lote
POST /api/precios/actualizar-lote
{
  "precios": [
    {
      "precio_id": 45,
      "precio_nuevo": 15.50,
      "motivo": "Ajuste 1"
    },
    {
      "precio_id": 46,
      "precio_nuevo": 20.00,
      "motivo": "Ajuste 2"
    }
  ]
}
```

### Página web

```bash
# Ver página de gestión de precios
GET /precios

# Con filtros
GET /precios?q=laptop&tipo_precio_id=2&per_page=50
```

---

## 🔐 Permisos Requeridos

Se necesitan dos permisos:

```
precios.index      → Ver página de gestión de precios
precios.update     → Actualizar precios
```

**Agregar estos permisos en:**
```
app/Http/Controllers/PrecioController.php (líneas 16-18)
```

O en tu panel de administración de roles.

---

## 🧪 Testeo Manual

### 1. Crear una compra de prueba

```
1. Ir a Compras → Crear Nueva
2. Seleccionar un producto (ej: Laptop)
3. Precio de compra: 100.00 Bs
4. Guardar como BORRADOR
5. Cambiar estado a APROBADO
```

### 2. Verificar que el precio se actualizó

```
1. Ir a /precios
2. Buscar "Laptop"
3. Ver que el precio de COSTO cambió a 100.00 Bs
4. Ver que se registró en Historial
```

### 3. Actualizar precio de venta

```
1. En la tabla, hacer clic en "Editar" para tipo VENTA_PUBLICO
2. Cambiar precio a 130.00 Bs
3. Motivo: "Margen protegido por aumento de costo"
4. Guardar
5. Verificar que aparece en historial con usuario y fecha
```

---

## 📋 Checklist de Instalación

- [x] Crear Service `DetectarCambiosPrecioService.php`
- [x] Crear Controller `PrecioController.php`
- [x] Crear página React `precios/index.tsx`
- [x] Actualizar `CompraController.php` para usar el Service
- [x] Agregar rutas API en `routes/api.php`
- [x] Agregar ruta web en `routes/web.php`
- [ ] Crear permisos `precios.index` y `precios.update` (MANUAL)
- [ ] Asignar permisos a roles (MANUAL)
- [ ] Verificar que la carpeta `app/Services/` existe
- [ ] Revisar logs en `storage/logs/laravel.log`

---

## 🐛 Debugging

### Ver cambios registrados en logs

```
storage/logs/laravel.log

Busca:
- "Precio de costo actualizado"
- "Precios de costo actualizados, revisar precios de venta"
```

### Consultar directamente en BD

```sql
-- Ver últimos cambios de precios
SELECT * FROM historial_precios
WHERE fecha_cambio >= DATE_SUB(NOW(), INTERVAL 7 DAY)
ORDER BY fecha_cambio DESC;

-- Ver precios actuales de un producto
SELECT p.id, pp.precio, tp.nombre as tipo
FROM precios_producto pp
JOIN productos p ON pp.producto_id = p.id
JOIN tipos_precio tp ON pp.tipo_precio_id = tp.id
WHERE p.id = 123;
```

---

## 📝 Notas Importantes

1. **Permisos**: El sistema requiere permisos `precios.index` y `precios.update`. Sin ellos, el acceso será denegado.

2. **Historial**: Todos los cambios quedan registrados con:
   - Usuario que hizo el cambio
   - Fecha y hora
   - Motivo del cambio
   - Precio anterior y nuevo
   - Porcentaje de cambio

3. **Automático**: El precio de costo se actualiza automáticamente al aprobar una compra. El usuario revisa y decide si cambiar el precio de venta.

4. **Auditoria**: Por motivos de auditoría, NO se pueden eliminar registros del historial. Solo se pueden crear nuevos.

---

## 🎨 Personalización Futura

### Posibles mejoras:

- [ ] Aplicar cambios de precio automáticamente basado en configuración
- [ ] Alertas por email cuando el margen cae por debajo de X%
- [ ] Historial con gráficos de tendencia de precios
- [ ] Exportar cambios a Excel/PDF
- [ ] Ajuste masivo de precios por porcentaje
- [ ] Integración con herramienta de análisis de margen

---

## 📞 Soporte

Si hay errores:

1. Revisa `storage/logs/laravel.log`
2. Verifica que los permisos estén asignados
3. Confirma que la carpeta `app/Services/` existe
4. Ejecuta: `php artisan cache:clear`

---

**Última actualización**: 2026-01-24
**Versión**: 1.0
