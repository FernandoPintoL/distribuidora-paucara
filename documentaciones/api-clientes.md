# API de Clientes - Contrato para Frontend (App móvil y Web)

Este documento describe cómo el frontend debe enviar y recibir datos para la creación y actualización de clientes, incluyendo las nuevas funcionalidades de:
- Preferencias de entrega del cliente (ventanas de entrega por día y hora)
- Categorización de clientes (múltiples categorías)
- Pedido con hora de entrega requerida

Rutas protegidas con auth:sanctum. Asegurarse de incluir el token de Sanctum en los requests.

## Endpoints

- POST /api/clientes
- PUT /api/clientes/{cliente}
- GET /api/clientes (listado, sin cambios relevantes en este doc)
- GET /api/clientes/{cliente} (incluye relaciones nuevas)

## Autenticación

- Header: `Authorization: Bearer {TOKEN}` (Sanctum)

## Crear cliente

POST /api/clientes

Content-Type: application/json o multipart/form-data si envía imágenes.

Body (JSON):
{
  "crear_usuario": false,               // opcional (bool). Si true y hay "telefono", se crea un usuario con usernick y password = telefono
  "nombre": "Juan Pérez",              // requerido
  "razon_social": "Comercial JP",     // opcional
  "nit": "1234567",                   // opcional
  "email": "juan@example.com",        // opcional (único si crear_usuario=true)
  "telefono": "70000001",             // opcional (requerido si crear_usuario=true)
  "limite_credito": 0,                 // opcional (>= 0)
  "localidad_id": 1,                   // opcional. Debe existir en localidades
  "latitud": -17.7833,                 // opcional
  "longitud": -63.1821,                // opcional
  "activo": true,                      // opcional (default true)
  // Direcciones (opcional)
  "direcciones": [
    {
      "direccion": "Av. Principal 123",
      "ciudad": "Santa Cruz",
      "departamento": "Santa Cruz",
      "codigo_postal": "",
      "es_principal": true,
      "activa": true
    }
  ],

  // Ventanas de entrega preferidas (opcional)
  "ventanas_entrega": [
    { "dia_semana": 1, "hora_inicio": "08:00", "hora_fin": "12:00", "activo": true },
    { "dia_semana": 3, "hora_inicio": "14:00", "hora_fin": "17:30" }
  ],

  // Categorías del cliente (opcional). IDs que existen en la tabla categorias_cliente
  "categorias_ids": [1, 2]
}

Validaciones clave:
- nombre: requerido
- crear_usuario=true => telefono requerido y único en clientes; email (si enviado) único en users
- ventanas_entrega: cada item requiere dia_semana (0-6), hora_inicio (HH:mm), hora_fin (HH:mm) y hora_inicio < hora_fin
- categorias_ids: deben existir en categorias_cliente

Respuesta 201 (JSON):
{
  "success": true,
  "message": "Cliente creado exitosamente",
  "data": {
    "cliente": {
      "id": 10,
      "nombre": "Juan Pérez",
      "...": "...",
      "ventanas_entrega": [
        { "id": 1, "dia_semana": 1, "hora_inicio": "08:00", "hora_fin": "12:00", "activo": true },
        { "id": 2, "dia_semana": 3, "hora_inicio": "14:00", "hora_fin": "17:30", "activo": true }
      ],
      "categorias": [
        { "id": 1, "clave": "VIP", "nombre": "VIP", "activo": true },
        { "id": 2, "clave": "MAYORISTA", "nombre": "Mayorista", "activo": true }
      ],
      "direcciones": [ { "id": 5, "direccion": "Av. Principal 123", "es_principal": true } ],
      "localidad": { "id": 1, "nombre": "Santa Cruz", "codigo": "SCZ" },
      "user": null
    },
    // Si se creó usuario (crear_usuario=true y telefono presente):
    // "usuario": { "id": 50, "name": "Juan Pérez", "usernick": "70000001", ... }
  }
}

Notas sobre imágenes (opcional):
- Si envía foto_perfil, ci_anverso, ci_reverso, use multipart/form-data. Campos: `foto_perfil`, `ci_anverso`, `ci_reverso`. Se almacenan en storage/public bajo carpeta del cliente.

## Actualizar cliente

PUT /api/clientes/{id}

Body (JSON o multipart/form-data si usa imágenes). En update los campos son opcionales salvo casos descritos.

Campos aceptados (subset de los de crear):
- crear_usuario (bool). Si true: si el cliente no tiene usuario, se crea uno con usernick y password = telefono; si ya tiene, se actualiza name/email.
- nombre, razon_social, nit, email, telefono, whatsapp, fecha_nacimiento, genero, limite_credito, localidad_id, latitud, longitud, activo, observaciones
- Imágenes: foto_perfil, ci_anverso, ci_reverso
- ventanas_entrega: array para REEMPLAZAR totalmente las ventanas existentes (si se envía la clave). Se validan igual que en crear.
- categorias_ids: array para SINCRONIZAR categorías (si se envía la clave). Reemplaza las asociaciones actuales.

Ejemplo Body:
{
  "telefono": "70000002",
  "ventanas_entrega": [ { "dia_semana": 5, "hora_inicio": "09:00", "hora_fin": "13:00" } ],
  "categorias_ids": [1]
}

Respuesta 200 (JSON):
{
  "success": true,
  "message": "Cliente actualizado exitosamente",
  "data": {
    "cliente": {
      "id": 10,
      "...": "...",
      "ventanas_entrega": [ { "id": 7, "dia_semana": 5, "hora_inicio": "09:00", "hora_fin": "13:00", "activo": true } ],
      "categorias": [ { "id": 1, "clave": "VIP", "nombre": "VIP" } ]
    }
  }
}

## Obtener cliente

GET /api/clientes/{id}

Respuesta incluye:
- direcciones
- localidad
- ventanas_entrega
- cuentas_por_cobrar (solo con saldo_pendiente > 0)

## Listar clientes

GET /api/clientes?q=texto&activo=1&order_by=nombre&order_dir=asc

Parámetros útiles: q, activo (1/0/all), order_by (id|nombre|fecha_registro), order_dir (asc|desc)

## Pedidos: hora de entrega requerida

Se agregó la columna `hora_entrega_requerida` (time, nullable) a la tabla `pedidos` para complementar `fecha_entrega_requerida` (date). Cuando el cliente confirme un pedido desde la app, el frontend debe enviar ambos valores:

Ejemplo (solo referencia de contrato):
{
  "fecha_entrega_requerida": "2025-09-30",
  "hora_entrega_requerida": "10:30"
}

Esto permite que logística planifique rutas considerando las preferencias ya registradas en `ventanas_entrega_cliente`.

## Errores comunes

- 422: validación fallida (revisar mensajes por campo)
- 401: no autenticado (falta token Sanctum)
- 404: recurso no encontrado

## Notas de modelo/datos

- Tabla: `ventanas_entrega_cliente` con claves: cliente_id, dia_semana (0=Dom ... 6=Sáb), hora_inicio, hora_fin, activo
- Tablas: `categorias_cliente` (catálogo) y `categoria_cliente` (pivot)
- Relación en Cliente: `ventanasEntrega()` y `categorias()`

## Ejemplos rápidos

1) Crear cliente mínimo:
{
  "nombre": "Cliente App",
  "telefono": "70000001"
}

2) Crear con ventanas y categorías:
{
  "nombre": "Cliente App",
  "telefono": "70000001",
  "ventanas_entrega": [
    { "dia_semana": 1, "hora_inicio": "08:00", "hora_fin": "12:00" },
    { "dia_semana": 3, "hora_inicio": "14:00", "hora_fin": "17:30" }
  ],
  "categorias_ids": [1, 2]
}
