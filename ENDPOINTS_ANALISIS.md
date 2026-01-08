# Análisis de Endpoints - Web App vs Flutter App

## 📱 Flutter App (Mobile)
```
GET /api/productos?page=1&per_page=20&almacen_id=2&con_stock=true
```
- Query parameters: page, per_page, almacen_id, con_stock
- Obtiene listado paginado desde API
- Filtra por almacén específico
- Solo con stock disponible

---

## 💻 Web App (Inventario Inicial Avanzado)

### 1️⃣ **INPUT BÚSQUEDA (Search Bar)**
```javascript
// Ubicación: handleBusquedaChange()
// Líneas: 294-311
// Tipo: LOCAL FILTERING (NO API CALL)
```
**Endpoint:** ❌ NO HACE LLAMADA A API
- Filtra **localmente** en los productos ya cargados
- Busca por:
  - `producto.nombre`
  - `producto.sku`
  - `producto.codigo_barras`
- Los datos vienen de `productosUnicos` (estado local)

**Mejora sugerida:** Debería hacer llamada a API como en Flutter

---

### 2️⃣ **CARGAR TODOS LOS PRODUCTOS (Load All Button)**
```
POST /inventario/inventario-inicial/draft/{borrador}/productos/load-paginated
```
**Ubicación:** `cargarProductosPaginados()`
**Líneas:** 160-218

**Query Parameters:**
- `page` - número de página
- `search` - búsqueda (opcional)
- `per_page` - 30 items por página

**Response:**
```json
{
  "productos": [...],
  "itemsAdded": 5,
  "current_page": 1,
  "last_page": 10,
  "total": 300
}
```

---

### 3️⃣ **BUSCAR POR CÓDIGO DE BARRAS (Scanner)**
```
GET /productos/paginados/listar?barcode={codigo}
```
**Ubicación:** `buscarPorCodigoBarras()`
**Líneas:** 326-421

**Flujo actual:**
1. Valida código
2. Busca en `borrador.items` localmente
3. Si NO existe → Llama a API con `?barcode=XXX`
4. Si NO encuentra → Toast error
5. Si encuentra → Agrega a tabla automáticamente

**Verificación de duplicados:**
- ✅ Verifica si producto ya existe en `borrador.items`
- ✅ Si existe → Solo expande (no duplica)
- ✅ Si no existe → Agrega a tabla

---

## 🔄 Comparativa de Endpoints

| Feature | Flutter App | Web App | Inconsistencia |
|---------|------------|---------|-----------------|
| **Listar Productos** | `/api/productos?page=...&almacen_id=2&con_stock=true` | `/inventario/inventario-inicial/draft/{id}/productos/load-paginated` | ❌ Diferentes endpoints |
| **Filtro por Almacén** | ✅ `almacen_id` | ❌ No filtra por almacén | ❌ Diferente |
| **Buscar por Código** | ❌ No documentado | ✅ `?barcode=XXX` | ❌ Diferente |
| **Búsqueda en Input** | ❌ No documentado | ❌ Solo LOCAL | ❌ Sin API |

---

## ✅ VERIFICACIÓN DE DUPLICADOS

### Código Actual (Líneas 389-401):
```typescript
// Verificar si ya existe en el borrador
const yaExisteEnBorrador = borrador.items.some(
    item => item.producto_id === producto.id
);

if (yaExisteEnBorrador) {
    // Ya existe, solo expandir
    setExpandidos(prev => new Set([...prev, producto.id]));
    NotificationService.success(`✓ Producto ya cargado: ${producto.nombre}`);
    return;
}

// Si no existe, agregar
await agregarProductos([producto.id]);
```

### Status: ✅ FUNCIONA CORRECTAMENTE
- Verifica si existe por `producto_id`
- No duplica
- Expande si ya existe
- Agrega si no existe

---

## 🎯 Recomendaciones de Mejora

### **1. Unificar Endpoints**
Usar el mismo endpoint que Flutter:
```typescript
// Cambiar de:
/inventario/inventario-inicial/draft/{id}/productos/load-paginated

// A:
/api/productos?page=1&per_page=20&almacen_id={almacen}&con_stock=true
```

### **2. Hacer Búsqueda en Input con API**
```typescript
// En handleBusquedaChange, agregar:
const response = await fetch(
    `/api/productos?search=${encodeURIComponent(valor)}&per_page=5`
);
```

### **3. Añadir Filtro por Almacén**
```typescript
// En buscarPorCodigoBarras, cambiar:
`/productos/paginados/listar?barcode=${codigo}&almacen_id=${selectedAlmacen}`
```

---

## 📊 Resumen Actual

| Aspecto | Estado | Nota |
|--------|--------|------|
| Búsqueda por Código | ✅ Funciona | Verifica duplicados correctamente |
| No Duplica Productos | ✅ Funciona | Usa `producto_id` para validar |
| Expandir Automático | ✅ Funciona | Se expande al agregar |
| Toast Mensajes | ✅ Funciona | Claro y descriptivo |
| Endpoint Consistencia | ❌ Inconsistente | Diferente a Flutter App |
| Búsqueda Input | ❌ Solo LOCAL | No usa API |

