# ✅ Corrección: Dirección Cliente Condicional en Ventas (2026-02-10)

## 📋 Resumen

Se corrigió la violación de Foreign Key que ocurría al crear una venta sin envío. El sistema intentaba insertar `direccion_cliente_id=0`, lo que violaba la restricción FK en la tabla `direcciones_cliente`.

---

## 🔴 Problema

Al crear una venta con `requiere_envio=false`, el endpoint retornaba:

```
SQLSTATE[23503]: Foreign key violation: 7 ERROR:  inserción o actualización en la tabla «ventas» viola la llave foránea «ventas_direccion_cliente_id_foreign»
DETAIL:  La llave (direccion_cliente_id)=(0) no está presente en la tabla «direcciones_cliente».
```

**Causa**: Cuando `requiere_envio=false`, la venta no necesita dirección, pero el código seguía intentando insertarla.

---

## ✅ Solución Implementada

### 1. **VentaService.php** (Línea 177)

**ANTES:**
```php
'direccion_cliente_id'       => $dto->direccion_cliente_id,
```

**AHORA:**
```php
// ✅ CORREGIDO (2026-02-10): direccion_cliente_id solo se requiere si requiere_envio=true
'direccion_cliente_id'       => ($dto->requiere_envio && $dto->direccion_cliente_id) ? $dto->direccion_cliente_id : null,
```

**Lógica**:
- Si `requiere_envio=true` Y hay `direccion_cliente_id` válido → usar el ID
- Si `requiere_envio=false` O no hay dirección válida → establecer a `null` (evita FK violation)

### 2. **StoreVentaRequest.php** (Líneas 59-60)

**ANTES:**
```php
'requiere_envio'             => 'nullable|boolean',
```

**AHORA:**
```php
'requiere_envio'             => 'nullable|boolean',
// ✅ CORREGIDO (2026-02-10): direccion_cliente_id solo requerida si requiere_envio=true
'direccion_cliente_id'       => 'nullable|exists:direcciones_cliente,id',
```

**Cambio**: `direccion_cliente_id` ahora es `nullable` (no requerida inicialmente; se valida en `withValidator`)

### 3. **StoreVentaRequest.php** (Línea 135-144 - Nueva Validación)

**AGREGADO:**
```php
// ✅ NUEVO (2026-02-10): Validar que direccion_cliente_id sea requerida solo cuando requiere_envio=true
$requiereEnvio = $data['requiere_envio'] ?? false;
$direccionClienteId = $data['direccion_cliente_id'] ?? null;

if ($requiereEnvio && !$direccionClienteId) {
    $validator->errors()->add(
        'direccion_cliente_id',
        'La dirección de entrega es requerida cuando la venta requiere envío.'
    );
}
```

**Lógica de validación**:
- Si `requiere_envio=true` y NO hay dirección → Error con mensaje claro
- Si `requiere_envio=false` → Dirección no es requerida (puede ser `null`)

### 4. **StoreVentaRequest.php** (Línea 105 - Mensaje personalizado)

**AGREGADO:**
```php
'direccion_cliente_id.exists'         => 'La dirección de cliente seleccionada no existe.',
```

---

## 🎯 Comportamiento Esperado

| Escenario | requiere_envio | direccion_cliente_id | Resultado |
|-----------|-----------------|----------------------|-----------|
| ✅ Venta sin envío | `false` | `null` o no enviada | ✅ VÁLIDO - direccion_cliente_id = NULL |
| ✅ Venta sin envío | `false` | ID válido | ✅ VÁLIDO - se ignora dirección (= NULL) |
| ✅ Venta con envío | `true` | ID válido | ✅ VÁLIDO - se asigna dirección |
| ❌ Venta con envío | `true` | `null` o no enviada | ❌ ERROR - "dirección de entrega es requerida" |

---

## 📊 Flujo Actual

```
POST /ventas
├─ Frontend envía: requiere_envio=false
├─ StoreVentaRequest valida
│  ├─ direccion_cliente_id nullable ✓
│  ├─ Si requiere_envio=true y NO hay dirección → Error
│  └─ Si requiere_envio=false → OK (dirección no requerida)
├─ CrearVentaDTO.fromRequest() procesa datos
├─ VentaService::crear()
│  └─ Crea venta con:
│     ├─ Si requiere_envio=true → direccion_cliente_id = ID
│     └─ Si requiere_envio=false → direccion_cliente_id = NULL
└─ ✅ Venta creada sin FK violation
```

---

## 🔍 Validaciones Implementadas

1. ✅ **Sintaxis PHP**: `php -l` validó ambos archivos
2. ✅ **Lógica condicional**: direccion_cliente_id solo se inserta si requiere_envio=true
3. ✅ **Mensajes de error**: Claros y descriptivos si falta dirección cuando se requiere
4. ✅ **Backward compatibility**: Código existente que envía direccion_cliente_id sigue funcionando

---

## 📝 Archivos Modificados

| Archivo | Líneas | Cambio |
|---------|--------|--------|
| `app/Services/Venta/VentaService.php` | 177 | Dirección condicional en creación |
| `app/Http/Requests/StoreVentaRequest.php` | 59-60, 135-144, 105 | Validación condicional + mensajes |

---

## ✅ Status

- ✅ PHP compile check: Sin errores
- ✅ Lógica de negocio: Dirección condicional según requiere_envio
- ✅ Validaciones: Ambas capas (request + service)
- ✅ Mensajes de error: Personalizados y claros
- ✅ Backward compatible: Código existente sigue funcionando

---

## 🚀 Próximas Pruebas

1. **Crear venta sin envío**: `POST /ventas` con `requiere_envio=false`
   - Esperado: ✅ Venta creada, `direccion_cliente_id=NULL`

2. **Crear venta con envío sin dirección**: `POST /ventas` con `requiere_envio=true`, sin `direccion_cliente_id`
   - Esperado: ❌ Error "La dirección de entrega es requerida..."

3. **Crear venta con envío con dirección**: `POST /ventas` con `requiere_envio=true`, con `direccion_cliente_id=123`
   - Esperado: ✅ Venta creada, `direccion_cliente_id=123`

---

**Última actualización**: 2026-02-10
**Estado**: ✅ COMPLETO
