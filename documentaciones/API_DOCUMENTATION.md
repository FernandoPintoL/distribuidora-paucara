# Documentación de API - Distribuidora Paucara

Esta documentación describe los endpoints de la API REST de la aplicación Distribuidora Paucara, incluyendo los formatos de request y response para cada endpoint.

## Base URL

```
http://tu-dominio.com/api
```

## Estructura de Respuestas

Todas las respuestas de la API siguen el formato estándar definido en `ApiResponse`:

### Respuesta Exitosa

```json
{
  "success": true,
  "message": "Mensaje descriptivo del resultado",
  "data": {
    // Datos de la respuesta
  }
}
```

### Respuesta de Error

```json
{
  "success": false,
  "message": "Mensaje de error descriptivo",
  "data": null
}
```

---

## 📦 PRODUCTOS

### GET `/productos`

Lista productos con paginación y filtros.

**Parámetros de consulta:**

- `per_page` (int, opcional): Elementos por página (por defecto: 20)
- `q` (string, opcional): Búsqueda por nombre o código
- `categoria_id` (int, opcional): ID de categoría
- `marca_id` (int, opcional): ID de marca  
- `activo` (boolean, opcional): Filtrar por estado activo (por defecto: true)

**Ejemplo de Request:**

```http
GET /api/productos?per_page=10&q=producto&categoria_id=1&activo=true
```

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "nombre": "Producto Ejemplo",
        "codigo": "PROD001",
        "descripcion": "Descripción del producto",
        "categoria_id": 1,
        "marca_id": 2,
        "unidad_medida_id": 1,
        "precio_venta": 25.50,
        "stock_minimo": 10,
        "stock_maximo": 100,
        "activo": true,
        "categoria": {
          "id": 1,
          "nombre": "Categoría 1"
        },
        "marca": {
          "id": 2,
          "nombre": "Marca A"
        },
        "unidad_medida": {
          "id": 1,
          "nombre": "Unidad"
        }
      }
    ],
    "per_page": 20,
    "total": 50
  }
}
```

### GET `/productos/{id}`

Obtiene detalles de un producto específico.

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id": 1,
    "nombre": "Producto Ejemplo",
    "codigo": "PROD001",
    "descripcion": "Descripción detallada",
    "categoria_id": 1,
    "marca_id": 2,
    "unidad_medida_id": 1,
    "precio_venta": 25.50,
    "stock_minimo": 10,
    "stock_maximo": 100,
    "activo": true,
    "categoria": {...},
    "marca": {...},
    "unidad_medida": {...},
    "stock": [
      {
        "id": 1,
        "producto_id": 1,
        "almacen_id": 1,
        "cantidad": 50,
        "lote": "L001",
        "fecha_vencimiento": "2024-12-31",
        "almacen": {
          "id": 1,
          "nombre": "Almacén Principal"
        }
      }
    ],
    "precios": [...],
    "codigos_barra": [...],
    "imagenes": [...]
  }
}
```

### POST `/productos`

Crea un nuevo producto.

**Ejemplo de Request:**

```json
{
  "nombre": "Nuevo Producto",
  "codigo": "PROD002",
  "descripcion": "Descripción del nuevo producto",
  "categoria_id": 1,
  "marca_id": 2,
  "unidad_medida_id": 1,
  "precio_compra": 15.00,
  "precio_venta": 25.50,
  "stock_minimo": 5,
  "stock_maximo": 50,
  "activo": true
}
```

**Campos requeridos:**

- `nombre` (string, max: 255)
- `categoria_id` (int, existe en categorías)
- `unidad_medida_id` (int, existe en unidades_medida)
- `precio_compra` (decimal, min: 0)
- `precio_venta` (decimal, min: 0)
- `stock_minimo` (int, min: 0)
- `stock_maximo` (int, min: 0)

**Campos opcionales:**

- `codigo` (string, max: 100, único)
- `descripcion` (string)
- `marca_id` (int, existe en marcas)
- `activo` (boolean, por defecto: true)

**Ejemplo de Response (201):**

```json
{
  "success": true,
  "message": "Producto creado exitosamente",
  "data": {
    // Producto creado con relaciones cargadas
  }
}
```

### PUT `/productos/{id}`

Actualiza un producto existente.

**Ejemplo de Request:**

```json
{
  "nombre": "Producto Actualizado",
  "precio_venta": 30.00,
  "stock_maximo": 75
}
```

**Validaciones:**

- Todos los campos son opcionales (`sometimes` required)
- `codigo` debe ser único excluyendo el producto actual
- Mismas validaciones que en creación para campos incluidos

### DELETE `/productos/{id}`

Elimina o desactiva un producto.

**Comportamiento:**

- Si el producto tiene stock: Error 400
- Si el producto tiene historial de movimientos: Solo desactiva
- Si no tiene restricciones: Elimina completamente

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Producto eliminado exitosamente",
  "data": null
}
```

### GET `/productos/buscar`

Busca productos para autocompletado.

**Parámetros:**

- `q` (string, requerido): Término de búsqueda (mínimo 2 caracteres)
- `limite` (int, opcional): Número máximo de resultados (por defecto: 10)

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": [
    {
      "id": 1,
      "nombre": "Producto Ejemplo",
      "codigo": "PROD001",
      "precio_venta": 25.50,
      "stock": [
        {
          "producto_id": 1,
          "almacen_id": 1,
          "cantidad": 50,
          "almacen": {
            "id": 1,
            "nombre": "Almacén Principal"
          }
        }
      ]
    }
  ]
}
```

### GET `/productos/{id}/historial-precios`

Obtiene el historial de cambios de precios de un producto.

---

## 👥 CLIENTES

### GET `/clientes`

Lista clientes con paginación y filtros.

**Parámetros de consulta:**

- `per_page` (int, opcional): Elementos por página (por defecto: 20)
- `q` (string, opcional): Búsqueda por nombre, razón social, NIT, teléfono o email
- `activo` (boolean, opcional): Filtrar por estado activo (por defecto: true)

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "nombre": "Juan Pérez",
        "razon_social": "Juan Pérez S.R.L.",
        "nit": "1234567890",
        "email": "juan@email.com",
        "telefono": "77777777",
        "whatsapp": "77777777",
        "fecha_nacimiento": "1990-01-15",
        "genero": "M",
        "limite_credito": 5000.00,
        "activo": true,
        "observaciones": "Cliente preferencial",
        "fecha_registro": "2024-01-01T00:00:00"
      }
    ],
    "per_page": 20,
    "total": 25
  }
}
```

### GET `/clientes/{id}`

Obtiene detalles de un cliente específico incluyendo direcciones y cuentas por cobrar.

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "id": 1,
    "nombre": "Juan Pérez",
    // ... otros campos básicos ...
    "direcciones": [
      {
        "id": 1,
        "cliente_id": 1,
        "direccion": "Av. Principal #123",
        "ciudad": "La Paz",
        "departamento": "La Paz",
        "codigo_postal": "10001",
        "es_principal": true
      }
    ],
    "cuentas_por_cobrar": [
      {
        "id": 1,
        "cliente_id": 1,
        "numero_documento": "V-001",
        "monto_total": 500.00,
        "saldo": 250.00,
        "fecha_vencimiento": "2024-02-15"
      }
    ]
  }
}
```

### POST `/clientes`

Crea un nuevo cliente.

**Ejemplo de Request:**

```json
{
  "nombre": "María García",
  "razon_social": "María García E.I.R.L.",
  "nit": "9876543210",
  "email": "maria@email.com",
  "telefono": "76543210",
  "whatsapp": "76543210",
  "fecha_nacimiento": "1985-05-20",
  "genero": "F",
  "limite_credito": 3000.00,
  "activo": true,
  "observaciones": "Cliente nuevo",
  "direcciones": [
    {
      "direccion": "Calle Falsa #456",
      "ciudad": "Cochabamba",
      "departamento": "Cochabamba",
      "codigo_postal": "20001",
      "es_principal": true
    }
  ]
}
```

**Campos requeridos:**

- `nombre` (string, max: 255)

**Campos opcionales:**

- `razon_social` (string, max: 255)
- `nit` (string, max: 50)
- `email` (email, max: 255)
- `telefono` (string, max: 20)
- `whatsapp` (string, max: 20)
- `fecha_nacimiento` (date)
- `genero` (enum: M, F, O)
- `limite_credito` (decimal, min: 0)
- `activo` (boolean, por defecto: true)
- `observaciones` (string)
- `direcciones` (array)

### PUT `/clientes/{id}`

Actualiza un cliente existente.

**Ejemplo de Request:**

```json
{
  "telefono": "78901234",
  "limite_credito": 4000.00,
  "observaciones": "Cliente actualizado"
}
```

### DELETE `/clientes/{id}`

Elimina o desactiva un cliente.

**Comportamiento:**

- Si tiene cuentas por cobrar pendientes: Error 400
- Si tiene historial de ventas: Solo desactiva
- Si no tiene restricciones: Elimina completamente

### GET `/clientes/buscar`

Busca clientes para autocompletado (similar a productos).

### GET `/clientes/{id}/saldo-cuentas`

Obtiene el saldo total de cuentas por cobrar de un cliente.

### GET `/clientes/{id}/historial-ventas`

Obtiene el historial de ventas de un cliente.

---

## 🏢 DIRECCIONES DE CLIENTES

### GET `/clientes/{clienteId}/direcciones`

Lista las direcciones de un cliente.

### POST `/clientes/{clienteId}/direcciones`

Crea una nueva dirección para un cliente.

**Ejemplo de Request:**

```json
{
  "direccion": "Nueva dirección #789",
  "ciudad": "Santa Cruz",
  "departamento": "Santa Cruz",
  "codigo_postal": "30001",
  "es_principal": false
}
```

### PUT `/clientes/{clienteId}/direcciones/{direccionId}`

Actualiza una dirección existente.

### DELETE `/clientes/{clienteId}/direcciones/{direccionId}`

Elimina una dirección.

### PATCH `/clientes/{clienteId}/direcciones/{direccionId}/principal`

Establece una dirección como principal (automáticamente quita el estado principal de las demás).

---

## 📊 INVENTARIO

### GET `/inventario/buscar-productos`

Busca productos en el inventario con información de stock.

**Parámetros:**

- `q` (string): Término de búsqueda
- `almacen_id` (int, opcional): Filtrar por almacén
- `limite` (int, opcional): Número de resultados (por defecto: 10)

### GET `/inventario/stock-producto/{productoId}`

Obtiene información detallada del stock de un producto por almacén.

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "producto_id": 1,
    "producto": {
      "id": 1,
      "nombre": "Producto Ejemplo"
    },
    "stock_por_almacen": [
      {
        "almacen_id": 1,
        "almacen": "Almacén Principal",
        "cantidad": 50,
        "lote": "L001",
        "fecha_vencimiento": "2024-12-31"
      }
    ],
    "stock_total": 50
  }
}
```

### POST `/inventario/ajustes`

Procesa ajustes masivos de inventario.

**Ejemplo de Request:**

```json
{
  "ajustes": [
    {
      "stock_producto_id": 1,
      "nueva_cantidad": 45,
      "observacion": "Ajuste por diferencia de inventario"
    },
    {
      "stock_producto_id": 2,
      "nueva_cantidad": 30,
      "observacion": "Producto dañado"
    }
  ]
}
```

### GET `/inventario/movimientos`

Lista movimientos de inventario con filtros.

**Parámetros:**

- `fecha_inicio` (date)
- `fecha_fin` (date)
- `tipo` (string): Tipo de movimiento
- `almacen_id` (int): ID del almacén
- `producto_id` (int): ID del producto

### POST `/inventario/movimientos`

Crea un nuevo movimiento de inventario.

---

## 📈 REPORTES DE INVENTARIO

### GET `/inventario/reportes/estadisticas`

Obtiene estadísticas generales del inventario.

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "total_productos": 150,
    "productos_activos": 140,
    "productos_stock_bajo": 8,
    "productos_proximos_vencer": 5,
    "productos_vencidos": 2,
    "valor_total_inventario": 125000.50,
    "almacenes_activos": 3
  }
}
```

### GET `/inventario/reportes/stock-bajo`

Lista productos con stock bajo.

**Parámetros:**

- `almacen_id` (int, opcional): Filtrar por almacén

### GET `/inventario/reportes/proximos-vencer`

Lista productos próximos a vencer.

**Parámetros:**

- `dias` (int, opcional): Días hacia adelante a considerar (por defecto: 30)

### GET `/inventario/reportes/vencidos`

Lista productos vencidos.

### GET `/inventario/reportes/movimientos-periodo`

Obtiene movimientos por período con resumen.

**Parámetros:**

- `fecha_inicio` (date, requerido)
- `fecha_fin` (date, requerido)
- `almacen_id` (int, opcional)

### GET `/inventario/reportes/productos-mas-movidos`

Lista productos con más movimientos en un período.

**Parámetros:**

- `periodo` (string): 'semana', 'mes', 'año'
- `limite` (int, opcional): Número de resultados

### GET `/inventario/reportes/valorizacion`

Obtiene la valorización del inventario.

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "fecha_reporte": "2024-01-15T10:30:00",
    "resumen": {
      "total_productos": 150,
      "valor_costo": 85000.00,
      "valor_venta": 125000.50,
      "margen_total": 40000.50,
      "porcentaje_margen": 47.06
    },
    "por_categoria": [
      {
        "categoria_id": 1,
        "categoria": "Alimentos",
        "cantidad_productos": 50,
        "valor_costo": 25000.00,
        "valor_venta": 37500.00,
        "margen": 12500.00
      }
    ],
    "por_almacen": [...]
  }
}
```

---

## 🛒 COMPRAS

### GET `/compras`

Lista compras con paginación y filtros.

**Parámetros de consulta:**

- `per_page` (int, opcional): Elementos por página (por defecto: 15)
- `q` (string, opcional): Búsqueda por número de documento o proveedor
- `fecha_inicio` (date, opcional): Filtrar desde fecha
- `fecha_fin` (date, opcional): Filtrar hasta fecha
- `proveedor_id` (int, opcional): ID del proveedor
- `estado_id` (int, opcional): ID del estado del documento

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "numero_documento": "COMP-001",
        "fecha": "2024-01-15",
        "proveedor_id": 1,
        "proveedor": {
          "id": 1,
          "nombre": "Proveedor Ejemplo",
          "razon_social": "Proveedor S.R.L."
        },
        "moneda_id": 1,
        "moneda": {
          "id": 1,
          "codigo": "BOB",
          "nombre": "Boliviano"
        },
        "subtotal": 1000.00,
        "total": 1000.00,
        "estado_documento_id": 1,
        "estado_documento": {
          "id": 1,
          "nombre": "Pendiente"
        },
        "observaciones": "Compra de mercadería mensual",
        "detalles": [
          {
            "id": 1,
            "producto_id": 1,
            "producto": {
              "id": 1,
              "nombre": "Producto A"
            },
            "cantidad": 10,
            "precio_unitario": 50.00,
            "subtotal": 500.00
          }
        ]
      }
    ],
    "per_page": 15,
    "total": 25
  }
}
```

### POST `/compras`

Crea una nueva compra.

**Ejemplo de Request:**

```json
{
  "numero_documento": "COMP-002",
  "fecha": "2024-01-16",
  "proveedor_id": 1,
  "moneda_id": 1,
  "estado_documento_id": 1,
  "observaciones": "Nueva compra",
  "detalles": [
    {
      "producto_id": 1,
      "cantidad": 15,
      "precio_unitario": 45.00
    },
    {
      "producto_id": 2,
      "cantidad": 8,
      "precio_unitario": 30.00
    }
  ]
}
```

**Campos requeridos:**

- `numero_documento` (string, único)
- `fecha` (date)
- `proveedor_id` (int, existe en proveedores)
- `moneda_id` (int, existe en monedas)
- `detalles` (array, mínimo 1 elemento)
- `detalles.*.producto_id` (int, existe en productos)
- `detalles.*.cantidad` (int, min: 1)
- `detalles.*.precio_unitario` (decimal, min: 0)

### GET `/compras/{id}`

Obtiene detalles de una compra específica con todos sus detalles.

### PUT `/compras/{id}`

Actualiza una compra existente.

**Validaciones:**

- Solo se pueden actualizar compras en estado "Pendiente"
- Los detalles se reemplazan completamente

### DELETE `/compras/{id}`

Elimina una compra.

**Comportamiento:**

- Solo se pueden eliminar compras sin movimientos de inventario asociados
- Si tiene movimientos, se desactiva en lugar de eliminar

---

## 💰 VENTAS

### GET `/ventas`

Lista ventas con paginación y filtros.

**Parámetros de consulta:**

- `per_page` (int, opcional): Elementos por página (por defecto: 15)
- `q` (string, opcional): Búsqueda por número de documento o cliente
- `fecha_inicio` (date, opcional): Filtrar desde fecha
- `fecha_fin` (date, opcional): Filtrar hasta fecha
- `cliente_id` (int, opcional): ID del cliente
- `metodo_pago` (string, opcional): Método de pago
- `estado` (string, opcional): Estado de la venta

**Ejemplo de Response:**

```json
{
  "success": true,
  "message": "Operación exitosa",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "numero": "V-001",
        "fecha": "2024-01-15",
        "cliente_id": 1,
        "cliente": {
          "id": 1,
          "nombre": "Juan Pérez",
          "nit": "1234567890"
        },
        "subtotal": 150.00,
        "descuento": 0.00,
        "total": 150.00,
        "metodo_pago": "EFECTIVO",
        "estado": "COMPLETADA",
        "observaciones": "Venta de mostrador",
        "usuario_id": 1,
        "usuario": {
          "id": 1,
          "name": "Vendedor"
        },
        "detalles": [
          {
            "id": 1,
            "producto_id": 1,
            "producto": {
              "id": 1,
              "nombre": "Producto A"
            },
            "almacen_id": 1,
            "almacen": {
              "id": 1,
              "nombre": "Almacén Principal"
            },
            "cantidad": 3,
            "precio_unitario": 50.00,
            "subtotal": 150.00
          }
        ]
      }
    ],
    "per_page": 15,
    "total": 45
  }
}
```

### POST `/ventas`

Crea una nueva venta con actualización automática de inventario.

**Ejemplo de Request:**

```json
{
  "cliente_id": 1,
  "fecha": "2024-01-16",
  "metodo_pago": "EFECTIVO",
  "observaciones": "Venta de mostrador",
  "detalles": [
    {
      "producto_id": 1,
      "almacen_id": 1,
      "cantidad": 2,
      "precio_unitario": 50.00
    },
    {
      "producto_id": 3,
      "almacen_id": 1,
      "cantidad": 1,
      "precio_unitario": 75.00
    }
  ]
}
```

**Campos requeridos:**

- `cliente_id` (int, existe en clientes)
- `fecha` (date)
- `metodo_pago` (string: EFECTIVO, TARJETA, TRANSFERENCIA, CREDITO)
- `detalles` (array, mínimo 1 elemento)
- `detalles.*.producto_id` (int, existe en productos)
- `detalles.*.almacen_id` (int, existe en almacenes)
- `detalles.*.cantidad` (int, min: 1)
- `detalles.*.precio_unitario` (decimal, min: 0)

**Validaciones automáticas:**

- Verificación de stock disponible antes de crear la venta
- Actualización automática del inventario al confirmar la venta
- Cálculo automático de subtotales y total

**Ejemplo de Response (201):**

```json
{
  "success": true,
  "message": "Venta creada exitosamente",
  "data": {
    "id": 2,
    "numero": "V-002",
    "fecha": "2024-01-16",
    "cliente_id": 1,
    "subtotal": 175.00,
    "total": 175.00,
    "metodo_pago": "EFECTIVO",
    "estado": "COMPLETADA",
    "usuario_id": 1,
    "detalles": [...]
  }
}
```

### GET `/ventas/{id}`

Obtiene detalles completos de una venta específica.

### PUT `/ventas/{id}`

Actualiza una venta existente.

**Restricciones:**

- Solo ventas en estado "PENDIENTE" pueden ser modificadas
- Al modificar, se revierten los movimientos de inventario y se recalculan

### DELETE `/ventas/{id}`

Cancela o elimina una venta.

**Comportamiento:**

- Si la venta está completada, se marca como "CANCELADA" y se revierten los movimientos de inventario
- Si está pendiente, se elimina completamente

---

## Códigos de Estado HTTP

- **200 OK**: Operación exitosa
- **201 Created**: Recurso creado exitosamente
- **400 Bad Request**: Error en la petición (validación, restricciones de negocio)
- **404 Not Found**: Recurso no encontrado
- **500 Internal Server Error**: Error interno del servidor

---

## Autenticación

La API requiere autenticación mediante tokens. Incluir en el header:

```
Authorization: Bearer tu-token-aqui
```

---

## Paginación

Las respuestas paginadas incluyen la estructura estándar de Laravel:

```json
{
  "current_page": 1,
  "data": [...],
  "first_page_url": "...",
  "from": 1,
  "last_page": 5,
  "last_page_url": "...",
  "links": [...],
  "next_page_url": "...",
  "path": "...",
  "per_page": 20,
  "prev_page_url": null,
  "to": 20,
  "total": 100
}
```

---

## Filtros y Búsquedas

### Parámetros comunes

- `q`: Búsqueda general por texto
- `per_page`: Elementos por página
- `page`: Página actual
- `order_by`: Campo para ordenar
- `order_dir`: Dirección del orden (asc/desc)

### Filtros específicos

- `activo`: Estado activo/inactivo
- `fecha_inicio` / `fecha_fin`: Rangos de fecha
- IDs de relaciones: `categoria_id`, `marca_id`, `almacen_id`, etc.

Esta documentación cubre los endpoints principales de la API. Para detalles específicos de validación o comportamientos especiales, consultar el código fuente de los controladores correspondientes.
