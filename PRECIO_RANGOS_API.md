# Documentación: Precios Dinámicos por Rango de Cantidad

## Descripción General

Este sistema permite configurar precios especiales basados en **rangos de cantidad** para cada producto. Cuando un cliente selecciona una cierta cantidad de un producto, el sistema calcula automáticamente el precio correspondiente al rango.

**Ejemplo:**
```
PEPSI 250ML:
- 1-9 unidades   → Bs. 10.00 (Precio Normal)
- 10-49 unidades → Bs. 8.50 (Precio Descuento)
- 50+ unidades   → Bs. 7.00 (Precio Especial)
```

## Arquitectura

### Base de Datos

**Tabla:** `precio_rango_cantidad_producto`

| Campo | Tipo | Descripción |
|-------|------|-------------|
| `id` | BIGINT | ID único |
| `empresa_id` | BIGINT | Empresa dueña de la configuración |
| `producto_id` | BIGINT | Producto asociado |
| `tipo_precio_id` | BIGINT | Tipo de precio a aplicar (VENTA_NORMAL, DESCUENTO, ESPECIAL) |
| `cantidad_minima` | INT | Cantidad mínima para este rango |
| `cantidad_maxima` | INT | Cantidad máxima (NULL = sin límite) |
| `fecha_vigencia_inicio` | DATE | Fecha desde cuando es válido (NULL = siempre) |
| `fecha_vigencia_fin` | DATE | Fecha hasta cuando es válido (NULL = siempre) |
| `activo` | BOOLEAN | Si el rango está activo |
| `orden` | INT | Orden de aplicación |

### Modelos Laravel

- **`PrecioRangoCantidadProducto`** - Modelo para rangos
- **`Producto`** - Métodos agregados:
  - `obtenerPrecioConRango(cantidad, empresaId)` - Obtiene precio considerando rango
  - `obtenerPrecioConDetallesRango(cantidad, empresaId)` - Devuelve detalles completos
  - `obtenerRangosActivos(empresaId)` - Lista rangos configurados

### Servicios

**`App\Services\Venta\PrecioRangoProductoService`**

Métodos principales:
- `calcularPrecioUnitario()` - Calcula precio por cantidad
- `calcularPrecioCompleto()` - Devuelve precio + rango + ahorro proximo
- `calcularCarrito()` - Calcula carrito completo
- `crearRango()` - Crea nuevo rango
- `actualizarRango()` - Actualiza rango
- `desactivarRango()` - Desactiva rango
- `validarIntegridad()` - Valida que no haya solapamientos

## Endpoints API

### 1. Obtener Rangos Configurados

```http
GET /api/productos/{producto_id}/rangos-precio
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "cantidad_minima": 1,
      "cantidad_maxima": 9,
      "rango_texto": "1-9",
      "tipo_precio": {
        "id": 1,
        "nombre": "Venta Normal",
        "codigo": "VENTA_NORMAL"
      },
      "precio_unitario": 10.00,
      "activo": true,
      "vigente": true
    },
    {
      "id": 2,
      "cantidad_minima": 10,
      "cantidad_maxima": 49,
      "rango_texto": "10-49",
      "tipo_precio": {
        "id": 2,
        "nombre": "Descuento",
        "codigo": "DESCUENTO"
      },
      "precio_unitario": 8.50,
      "activo": true,
      "vigente": true
    }
  ],
  "integridad": {
    "es_valido": true,
    "problemas": [],
    "cantidad_rangos": 2
  }
}
```

### 2. Crear Nuevo Rango

```http
POST /api/productos/{producto_id}/rangos-precio
Content-Type: application/json

{
  "cantidad_minima": 10,
  "cantidad_maxima": 49,
  "tipo_precio_id": 2,
  "fecha_vigencia_inicio": null,
  "fecha_vigencia_fin": null
}
```

**Response:**
```json
{
  "success": true,
  "message": "Rango de precio creado exitosamente",
  "data": {
    "id": 2,
    "empresa_id": 1,
    "producto_id": 1,
    "tipo_precio_id": 2,
    "cantidad_minima": 10,
    "cantidad_maxima": 49,
    "activo": true,
    "created_at": "2026-01-04T10:30:00Z"
  }
}
```

### 3. Actualizar Rango

```http
PUT /api/productos/{producto_id}/rangos-precio/{rango_id}
Content-Type: application/json

{
  "cantidad_maxima": 99,
  "tipo_precio_id": 3
}
```

### 4. Desactivar Rango

```http
DELETE /api/productos/{producto_id}/rangos-precio/{rango_id}
```

### 5. Calcular Precio para Cantidad

```http
POST /api/productos/{producto_id}/calcular-precio
Content-Type: application/json

{
  "cantidad": 15
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "precio_unitario": 8.50,
    "subtotal": 127.50,
    "rango_aplicado": {
      "id": 2,
      "cantidad_minima": 10,
      "cantidad_maxima": 49,
      "tipo_precio_id": 2,
      "tipo_precio_nombre": "Descuento"
    },
    "proximo_rango": {
      "cantidad_minima": 50,
      "cantidad_maxima": null,
      "tipo_precio_nombre": "Especial",
      "falta_cantidad": 35
    },
    "ahorro_proximo": 75.00
  }
}
```

### 6. Calcular Carrito Completo

```http
POST /api/carrito/calcular
Content-Type: application/json

{
  "items": [
    { "producto_id": 1, "cantidad": 15 },
    { "producto_id": 2, "cantidad": 5 },
    { "producto_id": 3, "cantidad": 75 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "detalles": [
      {
        "producto_id": 1,
        "producto_nombre": "PEPSI 250ML",
        "cantidad": 15,
        "precio_unitario": 8.50,
        "subtotal": 127.50,
        "rango_aplicado": { ... },
        "proximo_rango": { ... },
        "ahorro_proximo": 75.00
      }
    ],
    "total": 350.50,
    "cantidad_items": 3
  }
}
```

### 7. Validar Integridad de Rangos

```http
GET /api/productos/{producto_id}/rangos-precio/validar
```

**Response:**
```json
{
  "success": true,
  "data": {
    "es_valido": true,
    "problemas": [],
    "cantidad_rangos": 3
  }
}
```

### 8. Copiar Rangos Entre Productos

```http
POST /api/productos/{producto_origen}/rangos-precio/copiar/{producto_destino}
```

**Response:**
```json
{
  "success": true,
  "message": "Se copiaron 3 rangos exitosamente",
  "datos": {
    "rangos_copiados": 3,
    "rangos_disponibles": 3
  }
}
```

## Integración con Carrito (Proforma)

### Cambios en `/api/proformas` (POST)

**Antes:**
```json
{
  "cliente_id": 1,
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 15,
      "precio_unitario": 8.50  // ❌ Cliente envía precio
    }
  ]
}
```

**Ahora:**
```json
{
  "cliente_id": 1,
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 15
      // ✅ NO incluir precio_unitario - se calcula en backend
    }
  ]
}
```

### Response de Proforma

**Nuevo campo `detalles_rangos`:**
```json
{
  "success": true,
  "data": {
    "proforma": { ... },
    "numero": "PRF-2026-001",
    "total": 127.50,
    "detalles_rangos": [
      {
        "producto_nombre": "PEPSI 250ML",
        "precio_unitario": 8.50,
        "subtotal": 127.50,
        "rango_aplicado": { ... },
        "proximo_rango": { ... },
        "ahorro_proximo": 75.00
      }
    ]
  }
}
```

## Flujo de Cálculo

```
Cliente selecciona PEPSI 250ML x 15 unidades
    ↓
Backend recibe cantidad (NO precio)
    ↓
Busca rango para cantidad=15 en base de datos
    Encontrado: 10-49 → Tipo DESCUENTO
    ↓
Obtiene precio del tipo DESCUENTO
    Resultado: Bs. 8.50
    ↓
Calcula subtotal: 15 × 8.50 = Bs. 127.50
    ↓
Busca próximo rango: 50+ con ahorro Bs. 75.00
    ↓
Devuelve información completa al cliente
```

## Validaciones y Restricciones

### 1. Sin Solapamiento

Los rangos NO pueden solaparse:
```
✅ VÁLIDO:    1-9, 10-49, 50+
❌ INVÁLIDO:  1-9, 1-9 (duplicados)
❌ INVÁLIDO:  10-50, 30-60 (solapan)
❌ INVÁLIDO:  1-9, 11-50 (hueco en 10)
```

### 2. Continuidad

Se verifica que los rangos sean continuos sin huecos:
```
Rango 1: 1-9
Rango 2: DEBE EMPEZAR EN 10 (9+1)
Rango 3: DEBE EMPEZAR EN 50 (si Rango 2 termina en 49)
```

### 3. Vigencia

Solo se aplican rangos dentro de su período de vigencia:
- `fecha_vigencia_inicio` ≤ hoy ≤ `fecha_vigencia_fin`
- Si ambas son NULL, el rango es válido siempre

### 4. Precios Existentes

Solo se puede crear un rango si existe precio para ese tipo:
```
Error: El producto no tiene precio configurado para el tipo: ESPECIAL
```

## Ejemplo Completo: Configurar PEPSI 250ML

### Paso 1: Obtener el producto
```bash
GET /api/productos?buscar=pepsi%20250ml
```

### Paso 2: Crear los precios (si no existen)
```bash
POST /api/productos/1/precios
{
  "tipo_precio_id": 1,  // VENTA_NORMAL
  "precio": 10.00
}

POST /api/productos/1/precios
{
  "tipo_precio_id": 2,  // DESCUENTO
  "precio": 8.50
}

POST /api/productos/1/precios
{
  "tipo_precio_id": 3,  // ESPECIAL
  "precio": 7.00
}
```

### Paso 3: Crear los rangos
```bash
POST /api/productos/1/rangos-precio
{
  "cantidad_minima": 1,
  "cantidad_maxima": 9,
  "tipo_precio_id": 1
}

POST /api/productos/1/rangos-precio
{
  "cantidad_minima": 10,
  "cantidad_maxima": 49,
  "tipo_precio_id": 2
}

POST /api/productos/1/rangos-precio
{
  "cantidad_minima": 50,
  "cantidad_maxima": null,  // Sin límite máximo
  "tipo_precio_id": 3
}
```

### Paso 4: Validar integridad
```bash
GET /api/productos/1/rangos-precio/validar
```

### Paso 5: Crear proforma con 15 unidades
```bash
POST /api/proformas
{
  "cliente_id": 1,
  "productos": [
    {
      "producto_id": 1,
      "cantidad": 15
    }
  ],
  "fecha_entrega_solicitada": "2026-01-20",
  "direccion_entrega_solicitada_id": 1
}
```

**Resultado:**
- Precio aplicado: Bs. 8.50 (rango 10-49)
- Subtotal: Bs. 127.50
- Ahorro si agrega 35 más: Bs. 75.00

## Toggle por Empresa

La funcionalidad está disponible para todas las empresas por defecto. Para desactivarla:

```php
// En App\Models\Empresa
// Agregar campo: $table->boolean('usa_rango_precios')->default(true);

// En lógica de precios:
if ($empresa->usa_rango_precios) {
    $precio = $producto->obtenerPrecioConRango($cantidad);
} else {
    $precio = $producto->obtenerPrecio('VENTA_NORMAL');
}
```

## Security Notes

✅ **Backend calcula precios**: El cliente NO puede manipular precios
✅ **Validación de stock**: Antes de confirmar carrito
✅ **Auditría**: Se registra qué rango se aplicó en cada orden
✅ **Permisos**: Solo usuarios autenticados pueden crear/editar rangos
❌ **No confiar en cliente**: Nunca usar `precio_unitario` del request

## Testing

```php
// Unit Test
$producto = Producto::find(1);
$precioX15 = $producto->obtenerPrecioConRango(15); // 8.50
$precioX50 = $producto->obtenerPrecioConRango(50); // 7.00

// Detalles completos
$detalles = $producto->obtenerPrecioConDetallesRango(15);
$this->assertEquals(8.50, $detalles['precio_unitario']);
$this->assertEquals(75.00, $detalles['ahorro_proximo']);

// Carrito
$resultado = app(PrecioRangoProductoService::class)
    ->calcularCarrito([
        ['producto_id' => 1, 'cantidad' => 15],
        ['producto_id' => 2, 'cantidad' => 75],
    ]);
$this->assertEquals(350.50, $resultado['total']);
```

## Troubleshooting

### Problema: "El producto no tiene precio definido"
**Causa:** El producto no tiene un precio para el tipo asociado al rango
**Solución:** Crear precio primero, luego crear rango

### Problema: "El rango se superpone"
**Causa:** Existe otro rango con cantidades conflictivas
**Solución:** Verificar rangos existentes con `GET /rangos-precio/validar`

### Problema: Precio no cambia al aumentar cantidad
**Causa:** No hay rango configurado para esa cantidad
**Solución:** Crear rango o verificar que esté activo y vigente

## Performance

- **Índices creados:**
  - `(empresa_id, producto_id, activo)`
  - `(cantidad_minima, cantidad_maxima)`
  - `unique(empresa_id, producto_id, cantidad_minima)`

- **Queries optimizadas:**
  - `1 + N` problem evitado con relaciones eager loading
  - Caché posible en tipos_precio (cambian rara vez)

## Roadmap

- [ ] UI Dashboard para gestionar rangos
- [ ] Importación masiva de rangos (CSV)
- [ ] Historial de cambios de rangos
- [ ] Análisis de elasticidad precio-demanda
- [ ] Descuentos progresivos automáticos
- [ ] Integración con promociones
