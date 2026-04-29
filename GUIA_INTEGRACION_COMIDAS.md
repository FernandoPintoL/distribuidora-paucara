# 🍦 Guía de Integración: Sistema de Venta de Comidas/Helados

## 📋 Resumen

Se ha creado un sistema completo para vender productos de comida/helados con adicionales personalizables (leche, chocolate, uvas pasa, etc.).

## 🗂️ Archivos Creados

### Backend
```
migrations/
├── 2026_04_28_000001_add_es_producto_comida_to_productos_table.php
└── 2026_04_28_000002_create_adicionales_producto_table.php

app/Models/
├── AdicionalesProducto.php (NUEVO)
└── Producto.php (ACTUALIZADO)

app/Http/Controllers/Api/
└── AdicionalesProductoController.php (NUEVO)

routes/
└── api.php (ACTUALIZADO)
```

### Frontend
```
resources/js/presentation/components/
├── ProductosComidaSelector.tsx (NUEVO)
├── DetalleProductoComida.tsx (NUEVO)
└── VentaComidas.tsx (NUEVO)

resources/js/domain/entities/
└── productos-comida.ts (NUEVO)

resources/js/application/hooks/
└── use-carrito-comidas.ts (NUEVO)
```

## 🚀 Cómo Integrar en la Página de Ventas

### 1. Importar el Componente

En `resources/js/presentation/pages/ventas/create.tsx`:

```tsx
import { VentaComidas } from '@/presentation/components/VentaComidas';
import { useState } from 'react';

// En el componente
const [productosComida, setProductosComida] = useState([]);

// En el JSX (agregar en una sección de la página)
<VentaComidas onProductosComidaChange={setProductosComida} />
```

### 2. Estructuración de los Datos

Cuando se agrega un producto de comida al carrito, el formato es:

```typescript
{
  producto_id: 1,
  nombre_producto: "Helado Acaí",
  precio_base: 25.00,
  adicionalesSeleccionados: [1, 3],  // IDs de adicionales
  cantidad: 2,
  precio_total: 60.00,
  adicionales_detalles: [
    { id: 1, nombre: "Leche", precio_adicional: 3.00 },
    { id: 3, nombre: "Chocolate", precio_adicional: 5.00 }
  ]
}
```

### 3. Al Guardar la Venta

Los productos de comida deben enviarse **separadamente** de los productos normales:

```tsx
// Al hacer submit del formulario
const datosVenta = {
  // Datos normales de venta
  cliente_id: data.cliente_id,
  // ... otros campos
  
  // ✨ NUEVO: Productos de comida
  productos_comida: productosComida.map(item => ({
    producto_id: item.producto_id,
    nombre: item.nombre_producto,
    precio_base: item.precio_base,
    adicionales: item.adicionalesSeleccionados, // IDs
    cantidad: item.cantidad,
    subtotal: item.precio_total,
  }))
};
```

## 📊 Estructura de la Base de Datos

### Tabla `productos` (modificada)
```sql
ALTER TABLE productos ADD COLUMN es_producto_comida BOOLEAN DEFAULT FALSE;
```

### Tabla `adicionales_producto` (nueva)
```sql
CREATE TABLE adicionales_producto (
  id BIGINT PRIMARY KEY AUTO_INCREMENT,
  producto_id BIGINT NOT NULL REFERENCES productos(id),
  nombre VARCHAR(255),
  descripcion TEXT,
  precio_adicional DECIMAL(10,2),
  orden INT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

## 🔌 Endpoints API

### Obtener productos de comida
```
GET /api/productos-comida/
```

Respuesta:
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "nombre": "Helado Acaí",
      "descripcion": "Delicioso helado de acaí",
      "precio_venta": 25.00,
      "es_producto_comida": true,
      "adicionales": [
        {
          "id": 1,
          "nombre": "Leche",
          "precio_adicional": 3.00,
          "orden": 1,
          "activo": true
        }
      ]
    }
  ]
}
```

### Obtener adicionales de un producto
```
GET /api/productos-comida/{productoId}/adicionales
```

### Crear un adicional
```
POST /api/productos-comida/adicionales
{
  "producto_id": 1,
  "nombre": "Leche",
  "precio_adicional": 3.00,
  "orden": 1
}
```

### Actualizar un adicional
```
PATCH /api/productos-comida/adicionales/{id}
{
  "nombre": "Leche Extra",
  "precio_adicional": 4.00
}
```

### Eliminar un adicional
```
DELETE /api/productos-comida/adicionales/{id}
```

## 💡 Flujo de Uso

### Para el Vendedor

1. **Seleccionar Producto**: Clic en "Helado Acaí"
2. **Seleccionar Adicionales**: 
   - ✓ Leche (+3Bs)
   - ✓ Chocolate (+5Bs)
3. **Cantidad**: 2 unidades
4. **Precio Total**: (25 + 3 + 5) × 2 = 66Bs
5. **Agregar al Carrito**
6. **Repeat** para agregar más productos

### Para el Administrador

1. **Crear Producto de Comida**:
   - Nombre: "Helado Acaí"
   - Precio Base: 25.00
   - Flag: `es_producto_comida = true`
   - Stock: No requiere (automáticamente 0)

2. **Agregar Adicionales**:
   - Leche: +3.00
   - Chocolate: +5.00
   - Uvas Pasa: +2.00

## 🎯 Características

✅ **Precio Base + Extras**: Cálculo automático
✅ **Cantidad Variable**: Aumentar/disminuir unidades
✅ **Sin Control de Stock**: Productos de comida no consumen stock
✅ **Múltiples Adicionales**: Seleccionar varios a la vez
✅ **Interfaz Clara**: UI/UX intuitiva
✅ **Reutilización de Datos**: Usa precios, imágenes del Producto

## 🔐 Validaciones

- ✓ Cantidad > 0
- ✓ Precio_adicional >= 0
- ✓ Solo productos con `es_producto_comida = true` pueden tener adicionales
- ✓ Adicionales solo activos se muestran

## 📝 Próximos Pasos

1. **Ejecutar migraciones**:
   ```bash
   php artisan migrate
   ```

2. **Crear productos de comida** en la BD o panel de administración

3. **Integrar en create.tsx** (ver sección "Cómo Integrar")

4. **Manejar guardado de venta** con productos de comida

5. **Crear panel de administración** para gestionar productos de comida y adicionales

## 🛠️ Panel de Administración (Siguiente Fase)

Se puede crear una pantalla en el admin para:
- Listar productos de comida
- Crear/editar/eliminar productos
- Agregar/editar/eliminar adicionales
- Ver reporte de ventas de comidas

Componente recomendado: `ProductosComidaAdmin.tsx`

---

**Versión**: 1.0  
**Fecha**: 2026-04-28  
**Estado**: ✅ Implementación Completada
