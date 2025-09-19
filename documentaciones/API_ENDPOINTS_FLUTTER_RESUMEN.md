# 📱 API Endpoints para Flutter - Resumen Completo

## 🔐 Autenticación (Endpoints Públicos)

### Login

- **POST** `/api/login`
  - **Body esperado:**

    ```json
    {
      "login": "admin@paucara.test", // o usernick
      "password": "password123"
    }
    ```

  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "user": {
          "id": 1,
          "name": "Administrador",
          "usernick": "admin",
          "email": "admin@paucara.test",
          "activo": true
        },
        "token": "1|abc123def456...",
        "roles": ["admin"],
        "permissions": ["ver-productos", "crear-productos", ...]
      }
    }
    ```

### Registro

- **POST** `/api/register`
  - **Body esperado:**

    ```json
    {
      "name": "Juan Pérez",
      "usernick": "juanperez",
      "email": "juan@example.com",
      "password": "password123",
      "password_confirmation": "password123"
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "user": {
          "id": 2,
          "name": "Juan Pérez",
          "usernick": "juanperez",
          "email": "juan@example.com",
          "activo": true
        },
        "token": "2|def456ghi789...",
        "roles": ["cliente"],
        "permissions": [...]
      }
    }
    ```

## 🔒 Endpoints Protegidos (Requieren Token)

### Gestión de Sesión

- **POST** `/api/logout`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Sesión cerrada exitosamente",
      "data": null
    }
    ```

- **GET** `/api/user`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "user": {
          "id": 1,
          "name": "Administrador",
          "usernick": "admin",
          "email": "admin@paucara.test",
          "activo": true
        },
        "roles": ["admin"],
        "permissions": ["ver-productos", "crear-productos", ...]
      }
    }
    ```

- **POST** `/api/refresh`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "token": "3|newtoken123..."
      }
    }
    ```

### 🛍️ Productos (CRUD Completo)

- **GET** `/api/productos`
  - **Headers:** `Authorization: Bearer {token}`
  - **Query params opcionales:** `per_page=20`, `q=búsqueda`, `categoria_id=1`, `marca_id=1`, `proveedor_id=1`, `activo=true`
  - **Búsqueda en campos:** `nombre`, `codigo_barras`, `codigo_qr`, `descripcion`
  - **Respuesta exitosa (200):**

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
            "categoria": {
              "id": 1,
              "nombre": "Categoría 1"
            },
            "marca": {
              "id": 1,
              "nombre": "Marca 1"
            },
            "proveedor": {
              "id": 1,
              "nombre": "Proveedor 1",
              "razon_social": "Proveedor S.A."
            },
            "unidad_medida": {
              "id": 1,
              "nombre": "Unidad"
            },
            "activo": true
          }
        ],
        "per_page": 20,
        "total": 100
      }
    }
    ```

- **POST** `/api/productos`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body esperado:**

    ```json
    {
      "nombre": "Nuevo Producto",
      "codigo": "NP001",
      "descripcion": "Descripción",
      "categoria_id": 1,
      "marca_id": 1,
      "proveedor_id": 1,
      "unidad_medida_id": 1,
      "precio_compra": 100.00,
      "precio_venta": 150.00,
      "stock_minimo": 5,
      "stock_maximo": 100,
      "activo": true
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Producto creado exitosamente",
      "data": {
        "id": 2,
        "nombre": "Nuevo Producto",
        "codigo": "NP001",
        // ... datos completos del producto con relaciones
      }
    }
    ```

- **GET** `/api/productos/buscar`
  - **Headers:** `Authorization: Bearer {token}`
  - **Query params:** `q=texto_búsqueda`, `limite=10`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "nombre": "Producto encontrado",
          "codigo": "PROD001"
        }
      ]
    }
    ```

- **GET** `/api/productos/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "id": 1,
        "nombre": "Producto Ejemplo",
        "codigo": "PROD001",
        "categoria": { "id": 1, "nombre": "Categoría" },
        "marca": { "id": 1, "nombre": "Marca" },
        "proveedor": { "id": 1, "nombre": "Proveedor" },
        "unidad_medida": { "id": 1, "nombre": "Unidad" },
        "stock": [
          {
            "cantidad": 50,
            "almacen": { "id": 1, "nombre": "Almacén Principal" }
          }
        ],
        "precios": [
          {
            "valor": 150.00,
            "tipo_precio": { "id": 1, "nombre": "Venta" }
          }
        ],
        "codigos_barra": ["123456789"],
        "imagenes": [
          {
            "url": "http://localhost/storage/productos/imagen1.jpg",
            "orden": 1
          }
        ]
      }
    }
    ```

- **PUT** `/api/productos/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body:** Similar al POST pero con campos opcionales
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Producto actualizado exitosamente",
      "data": { /* datos actualizados del producto */ }
    }
    ```

- **DELETE** `/api/productos/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Producto eliminado exitosamente",
      "data": null
    }
    ```

- **GET** `/api/productos/{id}/historial-precios`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "tipo_precio_id": 1,
          "tipo_precio_nombre": "Venta",
          "valor_anterior": 140.00,
          "valor_nuevo": 150.00,
          "fecha_cambio": "2024-01-15 10:30",
          "motivo": "Ajuste de precio",
          "usuario": "admin",
          "porcentaje_cambio": 7.14
        }
      ]
    }
    ```

### 👥 Clientes (CRUD Completo)

- **GET** `/api/clientes`
  - **Headers:** `Authorization: Bearer {token}`
  - **Query params opcionales:** `per_page=20`, `q=búsqueda`, `activo=true`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "current_page": 1,
        "data": [
          {
            "id": 1,
            "nombre": "Cliente Ejemplo",
            "razon_social": "Empresa S.A.",
            "nit": "123456789",
            "email": "cliente@example.com",
            "telefono": "555-0123",
            "whatsapp": "555-0123",
            "activo": true
          }
        ],
        "per_page": 20,
        "total": 50
      }
    }
    ```

- **POST** `/api/clientes`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body esperado:**

    ```json
    {
      "nombre": "Nuevo Cliente",
      "razon_social": "Empresa Nueva S.A.",
      "nit": "987654321",
      "email": "nuevo@empresa.com",
      "telefono": "555-0456",
      "whatsapp": "555-0456",
      "fecha_nacimiento": "1990-01-01",
      "genero": "M",
      "limite_credito": 5000.00,
      "localidad_id": 1,
      "latitud": -16.5000,
      "longitud": -68.1500,
      "activo": true,
      "observaciones": "Cliente preferencial",
      "direcciones": [
        {
          "direccion": "Calle Principal 123",
          "ciudad": "La Paz",
          "departamento": "La Paz",
          "codigo_postal": "0000",
          "es_principal": true
        }
      ]
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Cliente creado exitosamente",
      "data": {
        "id": 2,
        "nombre": "Nuevo Cliente",
        // ... todos los datos del cliente con direcciones
      }
    }
    ```

- **GET** `/api/clientes/buscar`
  - **Headers:** `Authorization: Bearer {token}`
  - **Query params:** `q=texto_búsqueda`, `limite=10`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "nombre": "Cliente encontrado",
          "razon_social": "Empresa S.A.",
          "nit": "123456789",
          "telefono": "555-0123",
          "email": "cliente@example.com"
        }
      ]
    }
    ```

- **GET** `/api/clientes/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "id": 1,
        "nombre": "Cliente Ejemplo",
        "razon_social": "Empresa S.A.",
        "nit": "123456789",
        "email": "cliente@example.com",
        "telefono": "555-0123",
        "whatsapp": "555-0123",
        "fecha_nacimiento": "1990-01-01",
        "genero": "M",
        "limite_credito": 5000.00,
        "localidad_id": 1,
        "latitud": -16.5000,
        "longitud": -68.1500,
        "activo": true,
        "observaciones": "Cliente preferencial",
        "direcciones": [
          {
            "id": 1,
            "direccion": "Calle Principal 123",
            "ciudad": "La Paz",
            "departamento": "La Paz",
            "codigo_postal": "0000",
            "es_principal": true
          }
        ],
        "cuentas_por_cobrar": [
          {
            "id": 1,
            "monto_total": 1000.00,
            "saldo_pendiente": 500.00,
            "fecha_vencimiento": "2024-02-15"
          }
        ]
      }
    }
    ```

- **PUT** `/api/clientes/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body:** Similar al POST pero campos opcionales
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Cliente actualizado exitosamente",
      "data": { /* datos actualizados del cliente */ }
    }
    ```

- **DELETE** `/api/clientes/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Cliente eliminado exitosamente",
      "data": null
    }
    ```

- **GET** `/api/clientes/{id}/saldo-cuentas`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "cliente_id": 1,
        "total_cuentas": 5,
        "saldo_total_pendiente": 2500.00,
        "cuentas_vencidas": 2,
        "cuentas_por_vencer": 3
      }
    }
    ```

- **GET** `/api/clientes/{id}/historial-ventas`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "fecha": "2024-01-15",
          "total": 1500.00,
          "estado": "completada",
          "productos": [
            {
              "producto_id": 1,
              "nombre": "Producto vendido",
              "cantidad": 2,
              "precio_unitario": 750.00
            }
          ]
        }
      ]
    }
    ```

### 📍 Direcciones de Clientes

- **GET** `/api/clientes/{id}/direcciones`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "cliente_id": 1,
          "direccion": "Calle Principal 123",
          "ciudad": "La Paz",
          "departamento": "La Paz",
          "codigo_postal": "0000",
          "es_principal": true
        }
      ]
    }
    ```

- **POST** `/api/clientes/{id}/direcciones`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body esperado:**

    ```json
    {
      "direccion": "Nueva Calle 456",
      "ciudad": "La Paz",
      "departamento": "La Paz",
      "codigo_postal": "0000",
      "es_principal": false
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Dirección creada exitosamente",
      "data": { /* datos de la dirección creada */ }
    }
    ```

- **PUT** `/api/clientes/{id}/direcciones/{direccion}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body:** Similar al POST
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Dirección actualizada exitosamente",
      "data": { /* datos actualizados */ }
    }
    ```

- **DELETE** `/api/clientes/{id}/direcciones/{direccion}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Dirección eliminada exitosamente",
      "data": null
    }
    ```

- **PATCH** `/api/clientes/{id}/direcciones/{direccion}/principal`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Dirección principal actualizada exitosamente",
      "data": { /* datos de la dirección */ }
    }
    ```

### 📍 Localidades

- **GET** `/api/localidades`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "nombre": "La Paz",
          "codigo": "LP"
        },
        {
          "id": 2,
          "nombre": "Santa Cruz",
          "codigo": "SC"
        }
      ]
    }
    ```

- **GET** `/api/localidades/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": {
        "id": 1,
        "nombre": "La Paz",
        "codigo": "LP",
        "activo": true
      }
    }
    ```

- **POST** `/api/localidades`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body esperado:**

    ```json
    {
      "nombre": "Nueva Localidad",
      "codigo": "NL",
      "activo": true
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Localidad creada exitosamente",
      "data": { /* datos de la localidad */ }
    }
    ```

- **PUT** `/api/localidades/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body:** Similar al POST
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Localidad actualizada exitosamente",
      "data": { /* datos actualizados */ }
    }
    ```

- **DELETE** `/api/localidades/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Localidad eliminada exitosamente",
      "data": null
    }
    ```

## 🔧 Endpoints Adicionales para App

### Productos para App

- **GET** `/api/app/productos`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta:** Similar a `/api/productos` pero optimizado para app móvil

- **GET** `/api/app/productos/{id}`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta:** Similar a `/api/productos/{id}`

- **GET** `/api/app/productos/buscar`
  - **Headers:** `Authorization: Bearer {token}`
  - **Query params:** `q=texto_búsqueda`
  - **Respuesta:** Similar a `/api/productos/buscar`

### Proformas

- **GET** `/api/app/proformas`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "cliente_id": 1,
          "cliente": {
            "nombre": "Cliente Ejemplo",
            "razon_social": "Empresa S.A."
          },
          "productos": [
            {
              "producto_id": 1,
              "nombre": "Producto 1",
              "cantidad": 2,
              "precio_unitario": 100.00,
              "subtotal": 200.00
            }
          ],
          "total": 200.00,
          "estado": "pendiente",
          "fecha_creacion": "2024-01-15"
        }
      ]
    }
    ```

- **POST** `/api/app/proformas`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body esperado:**

    ```json
    {
      "cliente_id": 1,
      "productos": [
        {
          "producto_id": 1,
          "cantidad": 2,
          "precio_unitario": 100.00
        }
      ],
      "observaciones": "Proforma de prueba"
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Proforma creada exitosamente",
      "data": { /* datos completos de la proforma */ }
    }
    ```

### Catálogos de Mermas

- **GET** `/api/tipo-mermas`
  - **Headers:** `Authorization: Bearer {token}`
  - **Respuesta exitosa (200):**

    ```json
    {
      "success": true,
      "message": "Operación exitosa",
      "data": [
        {
          "id": 1,
          "nombre": "Merma por daño",
          "descripcion": "Producto dañado durante transporte",
          "activo": true
        }
      ]
    }
    ```

- **POST** `/api/tipo-mermas`
  - **Headers:** `Authorization: Bearer {token}`
  - **Body esperado:**

    ```json
    {
      "nombre": "Nuevo tipo de merma",
      "descripcion": "Descripción del tipo",
      "activo": true
    }
    ```

  - **Respuesta exitosa (201):**

    ```json
    {
      "success": true,
      "message": "Tipo de merma creado exitosamente",
      "data": { /* datos del tipo creado */ }
    }
    ```

## 📋 Consideraciones de Seguridad

✅ **Todos los endpoints principales están protegidos** con `auth:sanctum`
✅ **Autenticación requerida** para acceder a productos, clientes y localidades
✅ **Tokens JWT-like** generados por Laravel Sanctum
✅ **CORS configurado** para apps externas
✅ **Validación de usuarios activos** en login

## 🚀 Próximos Pasos

1. **Probar autenticación** con Postman o similar
2. **Implementar CRUD de productos** en Flutter
3. **Implementar CRUD de clientes** en Flutter
4. **Agregar manejo de errores** en la app
5. **Implementar refresh tokens** automáticamente

---

*Última actualización: $(date)*
