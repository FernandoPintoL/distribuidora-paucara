# Migración: Mostrar Entregas + Envios al Chofer

## Problema Original
El chofer solo podía ver **Entregas** (proformas directas), pero no los **Envios** (productos vendidos).

## Solución Implementada

### Backend (Laravel)

#### Nuevo Endpoint
```
GET /api/chofer/trabajos
```

**URL Completa:**
```
http://192.168.0.19:8000/api/chofer/trabajos?page=1&per_page=15
```

**Parámetros Soportados:**
- `page`: Número de página (default: 1)
- `per_page`: Registros por página (default: 15)
- `estado`: Filtrar por estado (opcional)

#### Respuesta
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "type": "entrega",              // 👈 Tipo de trabajo
      "numero": "PRF-2025-001",       // Número de proforma
      "cliente": "Cliente ABC",
      "estado": "EN_CAMINO",
      "fecha_asignacion": "2025-12-15T10:00:00",
      "fecha_entrega": null,
      "direccion": "Calle Principal 123",
      "observaciones": "Notas",
      "data": {...}                   // Objeto completo para detalles
    },
    {
      "id": 2,
      "type": "envio",                // 👈 Tipo diferente
      "numero": "ENV-2025-001",       // Número de envio
      "cliente": "Cliente XYZ",
      "estado": "PROGRAMADO",
      "fecha_asignacion": "2025-12-15T09:00:00",
      "fecha_entrega": null,
      "direccion": "Avenida Secundaria 456",
      "observaciones": null,
      "data": {...}                   // Objeto completo para detalles
    }
  ],
  "pagination": {
    "total": 25,
    "per_page": 15,
    "current_page": 1,
    "last_page": 2,
    "from": 1,
    "to": 15
  }
}
```

### Diferencias Clave

| Campo | Entregas | Envios |
|-------|----------|--------|
| **type** | `"entrega"` | `"envio"` |
| **numero** | Número de Proforma | Número de Envio |
| **origen** | Proforma aprobada | Venta realizada |
| **chofer_id** | Apunta a `empleados` | Apunta a `users` |
| **proceso** | Directo al cliente | Pasa por almacén |

---

## Cambios en el Código

### 1. EntregaController.php
- **Nuevo método**: `misTrabjos()` (línea 26)
- Combina entregas + envios en una sola respuesta
- Mantiene compatibilidad con endpoint legacy `/api/chofer/entregas`

### 2. routes/api.php
- **Nueva ruta**: `GET /api/chofer/trabajos` (línea 393)
- Endpoint legacy `/api/chofer/entregas` sigue disponible

---

## Cómo Usar en Flutter

### Opción 1: Usar el Nuevo Endpoint (RECOMENDADO)

```dart
// En pedido_provider.dart o donde hagas las llamadas HTTP

// Cambiar de:
final response = await dio.get('http://.../api/chofer/entregas?page=1');

// A:
final response = await dio.get('http://.../api/chofer/trabajos?page=1');
```

### Opción 2: Filtrar por Tipo en la App

Si usas el nuevo endpoint, en tu UI Flutter:

```dart
// Separar entregas de envios
List<dynamic> entregas = data.where((t) => t['type'] == 'entrega').toList();
List<dynamic> envios = data.where((t) => t['type'] == 'envio').toList();

// Mostrar diferente ícono según tipo
Widget getTipoIcon(String type) {
  if (type == 'entrega') {
    return Icon(Icons.local_shipping); // 🚐 Entrega Directa
  } else if (type == 'envio') {
    return Icon(Icons.local_post_office); // 📦 Envío desde Almacén
  }
  return SizedBox();
}
```

### Opción 3: Mantener Separados

Si prefieres que cada uno tenga su propia pantalla/sección:

```dart
// Endpoint para entregas (legacy)
final entregas = await dio.get('http://.../api/chofer/entregas?page=1');

// Endpoint nuevo para envios
// (TODO: Crear endpoint /api/chofer/envios similar)
```

---

## Resumen de Cambios

| Componente | Cambio | Impacto |
|-----------|--------|--------|
| **Backend** | Nuevo endpoint `/api/chofer/trabajos` | ✅ Chofer ve ambas entregas + envios |
| **Modelo Entrega** | Sin cambios | ✅ Compatibilidad manttenida |
| **Modelo Envio** | Sin cambios | ✅ Compatibilidad mantenida |
| **Flutter App** | Cambiar URL o filtrar por `type` | ⚠️ Requiere actualización |

---

## Estados por Tipo

### Entregas (Proformas)
- ASIGNADA
- EN_CAMINO
- LLEGO
- ENTREGADO
- NOVEDAD
- CANCELADA

### Envios (Ventas)
- PROGRAMADO
- EN_PREPARACION
- EN_RUTA
- ENTREGADO
- CANCELADO

---

## Próximos Pasos

1. **Backend**: Las migraciones ya existen y están ejecutadas ✅
2. **Backend**: El nuevo endpoint está activo ✅
3. **Frontend**: Actualizar `entregas_asignadas_screen.dart` para usar `/api/chofer/trabajos`
4. **Frontend**: Mostrar ambos tipos en la UI (entregas + envios)
5. **Testing**: Verificar que choferes tengan asignaciones en ambas tablas

---

## Testing

### Queries SQL para Verificar Data

```sql
-- Entregas asignadas al chofer 3
SELECT COUNT(*) FROM entregas WHERE chofer_id = 3;

-- Envios asignados al chofer 3 (a través de users)
SELECT COUNT(*) FROM envios WHERE chofer_id = (
  SELECT id FROM users WHERE empleado_id = 3
);

-- Ambas combinadas
SELECT COUNT(*) FROM (
  SELECT id FROM entregas WHERE chofer_id = 3
  UNION ALL
  SELECT id FROM envios WHERE chofer_id = (
    SELECT id FROM users WHERE empleado_id = 3
  )
) combined;
```

---

**Generado**: 2025-12-15
**Status**: Implementado ✅
