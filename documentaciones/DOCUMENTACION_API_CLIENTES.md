# Documentación API de Gestión de Clientes - Distribuidora Paucara

## Resumen General

Se ha implementado un sistema completo de API REST para la gestión de clientes y direcciones con respuestas JSON estandarizadas. Todas las APIs utilizan el helper `ApiResponse` para garantizar consistencia en las respuestas.

## Estructura de Respuesta Estándar

```json
{
    "success": true|false,
    "message": "Mensaje descriptivo",
    "data": {}, // Solo en respuestas exitosas
    "errors": {} // Solo en respuestas de error
}
```

## Endpoints de Clientes

### Base URL
```
/api/clientes
```

### 1. Listar Clientes
- **URL**: `GET /api/clientes`
- **Parámetros de consulta**:
  - `per_page` (int): Elementos por página (defecto: 10)
  - `page` (int): Página actual
  - `buscar` (string): Búsqueda en nombre, razón social o NIT
  - `activo` (boolean): Filtrar por estado activo
- **Respuesta exitosa**:
```json
{
    "success": true,
    "message": "Clientes obtenidos exitosamente",
    "data": {
        "data": [
            {
                "id": 1,
                "nombre": "Juan Pérez",
                "razon_social": null,
                "nit": "1234567",
                "email": "juan@example.com",
                "telefono": "70123456",
                "whatsapp": "70123456",
                "fecha_nacimiento": null,
                "genero": "M",
                "limite_credito": 1000.00,
                "activo": true,
                "fecha_registro": "2024-09-09T10:00:00.000000Z"
            }
        ],
        "current_page": 1,
        "per_page": 10,
        "total": 1
    }
}
```

### 2. Crear Cliente
- **URL**: `POST /api/clientes`
- **Headers**: `Content-Type: application/json`
- **Body**:
```json
{
    "nombre": "María González", // Requerido
    "razon_social": "Empresa S.R.L.",
    "nit": "7654321",
    "email": "maria@example.com",
    "telefono": "77888999",
    "whatsapp": "77888999",
    "fecha_nacimiento": "1990-05-15",
    "genero": "F", // M, F, O
    "limite_credito": 2000.00,
    "activo": true,
    "observaciones": "Cliente VIP",
    "direcciones": [ // Opcional
        {
            "direccion": "Av. 6 de Agosto #123",
            "ciudad": "La Paz",
            "departamento": "La Paz",
            "codigo_postal": "0000",
            "es_principal": true
        }
    ]
}
```
- **Respuesta exitosa**: Status 201
```json
{
    "success": true,
    "message": "Cliente creado exitosamente",
    "data": {
        "id": 2,
        "nombre": "María González",
        // ... otros campos
        "direcciones": [
            {
                "id": 1,
                "direccion": "Av. 6 de Agosto #123",
                "ciudad": "La Paz",
                "es_principal": true
            }
        ]
    }
}
```

### 3. Obtener Cliente
- **URL**: `GET /api/clientes/{id}`
- **Respuesta**: Datos del cliente con sus direcciones

### 4. Actualizar Cliente
- **URL**: `PUT /api/clientes/{id}`
- **Body**: Mismos campos que crear (todos opcionales)
- **Respuesta**: Cliente actualizado con mensaje de éxito

### 5. Eliminar Cliente
- **URL**: `DELETE /api/clientes/{id}`
- **Lógica**:
  - Si tiene cuentas por cobrar pendientes: Error 400
  - Si tiene historial de ventas: Solo desactiva
  - Sin historial: Eliminación completa
- **Respuesta**: Mensaje de confirmación

### 6. Buscar Clientes (Autocompletado)
- **URL**: `GET /api/clientes/buscar?q={término}&limite={número}`
- **Parámetros**:
  - `q` (string): Término de búsqueda (mínimo 2 caracteres)
  - `limite` (int): Máximo resultados (defecto: 10)
- **Búsqueda en**: nombre, razón_social, nit, teléfono
- **Respuesta**: Array con clientes que coinciden

### 7. Saldo de Cuentas por Cobrar
- **URL**: `GET /api/clientes/{id}/saldo-cuentas`
- **Respuesta**:
```json
{
    "success": true,
    "data": {
        "cliente": {
            "id": 1,
            "nombre": "Juan Pérez",
            "limite_credito": 1000.00
        },
        "saldo_total": 850.50,
        "cuentas_vencidas": 2,
        "cuentas_detalle": [
            {
                "id": 1,
                "numero_documento": "VENTA-001",
                "monto_total": 500.00,
                "saldo": 500.00,
                "fecha_vencimiento": "2024-08-15",
                "dias_vencimiento": 25
            }
        ]
    }
}
```

### 8. Historial de Ventas
- **URL**: `GET /api/clientes/{id}/historial-ventas`
- **Parámetros**:
  - `per_page` (int): Elementos por página
  - `fecha_inicio` (date): Filtro desde
  - `fecha_fin` (date): Filtro hasta
- **Respuesta**: Paginación de ventas con detalles

## Endpoints de Direcciones de Clientes

### Base URL
```
/api/clientes/{cliente_id}/direcciones
```

### 1. Listar Direcciones del Cliente
- **URL**: `GET /api/clientes/{cliente_id}/direcciones`
- **Respuesta**: Array de direcciones del cliente

### 2. Crear Dirección
- **URL**: `POST /api/clientes/{cliente_id}/direcciones`
- **Body**:
```json
{
    "direccion": "Calle Comercio #456", // Requerido
    "ciudad": "El Alto",
    "departamento": "La Paz",
    "codigo_postal": "0001",
    "es_principal": false
}
```
- **Respuesta**: Status 201 con dirección creada

### 3. Actualizar Dirección
- **URL**: `PUT /api/clientes/{cliente_id}/direcciones/{direccion_id}`
- **Body**: Mismos campos que crear (todos opcionales)

### 4. Eliminar Dirección
- **URL**: `DELETE /api/clientes/{cliente_id}/direcciones/{direccion_id}`
- **Validación**: No permite eliminar si es la única dirección principal

### 5. Establecer como Principal
- **URL**: `PATCH /api/clientes/{cliente_id}/direcciones/{direccion_id}/principal`
- **Función**: Establece la dirección como principal y desactiva las otras

## Validaciones Implementadas

### Cliente
- `nombre`: Requerido, string, máximo 255 caracteres
- `email`: Email válido, único (opcional)
- `nit`: String, máximo 50 caracteres (opcional)
- `telefono`: String, máximo 20 caracteres (opcional)
- `genero`: Valores permitidos: 'M', 'F', 'O'
- `limite_credito`: Numérico, mínimo 0
- `fecha_nacimiento`: Fecha válida

### Dirección
- `direccion`: Requerido, string, máximo 500 caracteres
- `ciudad`: String, máximo 100 caracteres (opcional)
- `departamento`: String, máximo 100 caracteres (opcional)
- `codigo_postal`: String, máximo 20 caracteres (opcional)
- `es_principal`: Boolean

## Permisos y Middleware

Todos los endpoints requieren el permiso: `clientes.manage`

## Códigos de Estado HTTP

- **200**: Operación exitosa
- **201**: Recurso creado exitosamente
- **400**: Datos inválidos o reglas de negocio violadas
- **401**: No autenticado
- **403**: Sin permisos suficientes
- **404**: Recurso no encontrado
- **422**: Errores de validación
- **500**: Error interno del servidor

## Ejemplos de Uso con cURL

### Crear Cliente con Direcciones
```bash
curl -X POST http://localhost:8000/api/clientes \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer {token}" \
  -d '{
    "nombre": "Carlos Mendoza",
    "email": "carlos@example.com",
    "telefono": "70111222",
    "limite_credito": 1500,
    "direcciones": [
      {
        "direccion": "Av. Arce #789",
        "ciudad": "La Paz",
        "departamento": "La Paz",
        "es_principal": true
      }
    ]
  }'
```

### Buscar Clientes
```bash
curl -X GET "http://localhost:8000/api/clientes/buscar?q=carlos&limite=5" \
  -H "Authorization: Bearer {token}"
```

### Obtener Saldo de Cliente
```bash
curl -X GET http://localhost:8000/api/clientes/1/saldo-cuentas \
  -H "Authorization: Bearer {token}"
```

## Archivos Modificados/Creados

1. **app/Helpers/ApiResponse.php** - Helper para respuestas JSON estandarizadas
2. **app/Http/Controllers/ClienteController.php** - Controlador principal con métodos API
3. **app/Http/Controllers/DireccionClienteApiController.php** - Controlador específico para direcciones
4. **routes/api.php** - Definición de todas las rutas API
5. **bootstrap/app.php** - Configuración para incluir rutas API
6. **tests/Feature/SimpleClienteApiTest.php** - Tests básicos de funcionalidad

## Notas Técnicas

- Utiliza paginación automática de Laravel
- Todas las consultas incluyen ordenamiento por defecto
- Búsquedas insensibles a mayúsculas/minúsculas (ilike)
- Validaciones server-side completas
- Respuestas consistentes en todos los endpoints
- Manejo de errores centralizado

Este sistema API está listo para ser consumido por aplicaciones frontend (móviles, web, etc.) que necesiten gestionar clientes y sus direcciones de manera robusta y consistente.
