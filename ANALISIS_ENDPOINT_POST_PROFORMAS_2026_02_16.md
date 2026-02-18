# 📊 ANÁLISIS DETALLADO: POST /proformas :: ProformaController@store

## 🎯 Objetivo del Endpoint
Crear una nueva proforma con validaciones, procesamiento de detalles, y reserva automática de stock.

---

## 🔄 Flujo Completo de Ejecución

```
FRONTEND (POST /proformas)
│
├─ VALIDACIÓN (StoreProformaRequest)
│  │
│  ├─ Cliente existe en BD (existe:clientes,id) ✅
│  ├─ Fechas en formato Y-m-d ✅
│  ├─ Detalles array con min 1 producto ✅
│  ├─ Cada detalle:
│  │  ├─ producto_id existe (exists:productos,id) ✅
│  │  ├─ cantidad > 0 ✅
│  │  ├─ unidad_medida_id existe (optional) ✅
│  │  └─ precio_unitario numeric (optional) ✅
│  ├─ Subtotal, Impuesto, Total numeric ✅
│  ├─ Política de pago: CONTRA_ENTREGA|ANTICIPADO_100|MEDIO_MEDIO|CREDITO ✅
│  │
│  └─ VALIDACIONES CUSTOM (withValidator):
│     └─ Para cada producto:
│        ├─ Si NO fraccionado → unidad_medida_id debe ser igual a producto.unidad_medida_id
│        └─ Si fraccionado → debe existir ConversionUnidadProducto
│
├─ CREACIÓN DE DTO (CrearProformaDTO::fromRequest)
│  │
│  ├─ cliente_id: (int) $request->input('cliente_id')
│  ├─ fecha: $request->input('fecha', today())
│  ├─ fecha_vencimiento: $request->input('fecha_vencimiento', today()+15)
│  ├─ detalles: $request->input('detalles', [])  ← AQUÍ SE PASAN LOS 3 CAMPOS NUEVOS
│  ├─ subtotal: (float) $request->input('subtotal', 0)
│  ├─ impuesto: (float) $request->input('impuesto', 0)
│  ├─ total: (float) $request->input('total', 0)
│  ├─ almacen_id: (int) $request->input('almacen_id', 1)
│  ├─ observaciones: $request->input('observaciones')
│  ├─ canal: $request->input('canal', 'PRESENCIAL')
│  ├─ politica_pago: $request->input('politica_pago', 'CONTRA_ENTREGA')
│  ├─ usuario_id: Auth::id()  ← Siempre usuario autenticado
│  ├─ preventista_id: $request->input('preventista_id') (optional)
│  └─ estado_inicial: 'BORRADOR' | 'PENDIENTE'  ← Validado para ser uno de estos 2
│
├─ LOGGING (📋 Creando proforma)
│  └─ Log::info con usuario_autenticado_id, cliente_id, dto_usuario_id
│
├─ SERVICIO (ProformaService::crear($dto)) ← PROCESAMIENTO COMPLETO
│  │
│  ├─ ✅ Valida detalles (validarDetalles())
│  ├─ ✅ Crea registro Proforma (cliente_id, usuario_id, etc.)
│  ├─ ✅ Procesa cada detalle:
│  │  │
│  │  ├─ PROCESA combo_items_seleccionados:
│  │  │  │ (DESDE: $detalle['combo_items_seleccionados'])
│  │  │  │
│  │  │  ├─ Filtra solo items where incluido = true
│  │  │  ├─ Reindexar array después de filtrar
│  │  │  └─ Mapea a formato estándar:
│  │  │     {
│  │  │       'combo_item_id': ...,
│  │  │       'producto_id': ...,
│  │  │       'incluido': true
│  │  │     }
│  │  │
│  │  └─ Crea DetalleProforma con:
│  │     ├─ proforma_id
│  │     ├─ producto_id
│  │     ├─ cantidad
│  │     ├─ precio_unitario
│  │     ├─ subtotal
│  │     ├─ unidad_medida_id
│  │     ├─ tipo_precio_id       ← NUEVO ✅ (desde $detalle['tipo_precio_id'])
│  │     ├─ tipo_precio_nombre   ← NUEVO ✅ (desde $detalle['tipo_precio_nombre'])
│  │     └─ combo_items_seleccionados ← NUEVO ✅ (procesado)
│  │
│  ├─ ✅ RESERVA stock automáticamente:
│  │  │
│  │  └─ Proforma::reservarStock()
│  │     └─ Para cada detalle:
│  │        ├─ Obtiene almacen_id (usuario.empresa.almacen_id)
│  │        ├─ Calcula fecha_vencimiento (fecha + 3 días)
│  │        └─ Llamar ReservaDistribucionService::distribuirReserva()
│  │           ├─ Obtiene stock_productos por FIFO (oldest first)
│  │           ├─ Distribuye cantidad entre lotes
│  │           ├─ Crea ReservaProforma por cada lote
│  │           └─ Registra MovimientoInventario (RESERVA_PROFORMA)
│  │
│  └─ ✅ Retorna ProformaResponseDTO con datos completos
│
├─ LOGGING (✅ Proforma creada exitosamente)
│  └─ Log::info con proforma_id, usuario_creador_id, timestamp
│
├─ RESPUESTA JSON (201 CREATED)
│  │
│  └─ respondSuccess(
│     data: $proformaDTO,
│     message: 'Proforma creada exitosamente',
│     redirectTo: route('proformas.show', $proformaDTO->id),
│     statusCode: 201,
│  )
│
└─ ERROR HANDLING (3 tipos de excepciones):
   ├─ StockInsuficientException (422):
   │  └─ Retorna errores detallados de stock insuficiente
   │
   ├─ DomainException (400):
   │  └─ Errores de lógica de negocio
   │
   └─ Generic Exception (500):
      └─ Log error + respuesta genérica
```

---

## 📋 Estructura de Request

### Headers Requeridos
```
POST /proformas
Content-Type: application/json
Accept: application/json
```

### Body JSON Requerido

```json
{
  "cliente_id": 27,
  "fecha": "2026-02-16",
  "fecha_vencimiento": "2026-03-02",
  "almacen_id": 1,
  "politica_pago": "CONTRA_ENTREGA",
  "canal": "PRESENCIAL",
  "observaciones": "Notas opcionales",
  "detalles": [
    {
      "producto_id": 45,
      "cantidad": 10,
      "precio_unitario": 100.00,
      "unidad_medida_id": 3,
      "tipo_precio_id": 2,
      "tipo_precio_nombre": "Mayorista",
      "combo_items_seleccionados": [
        {
          "combo_item_id": 5,
          "producto_id": 101,
          "incluido": true
        },
        {
          "combo_item_id": 6,
          "producto_id": 102,
          "incluido": false
        },
        {
          "combo_item_id": 7,
          "producto_id": 103,
          "incluido": true
        }
      ]
    },
    {
      "producto_id": 46,
      "cantidad": 5,
      "precio_unitario": 50.00,
      "unidad_medida_id": 3,
      "tipo_precio_id": 1,
      "tipo_precio_nombre": "Retail",
      "combo_items_seleccionados": null
    }
  ],
  "subtotal": 1250.00,
  "impuesto": 0,
  "total": 1250.00
}
```

---

## ✅ Campos que Ahora se Soportan en detalles

### ORIGINALES (Siempre Soportados)
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| `producto_id` | integer | ✅ | Validado: exists:productos,id |
| `cantidad` | numeric | ✅ | Validado: min 0.000001 |
| `precio_unitario` | numeric | ❌ | Si no se proporciona, null |
| `unidad_medida_id` | integer | ❌ | Validación custom para fraccionados |

### NUEVOS CAMPOS AGREGADOS (2026-02-16)
| Campo | Tipo | Requerido | Notas |
|-------|------|-----------|-------|
| **`tipo_precio_id`** | integer | ❌ | FK → tipos_precio.id |
| **`tipo_precio_nombre`** | string | ❌ | Nombre legible: "Mayorista", "Retail", etc. |
| **`combo_items_seleccionados`** | array | ❌ | Array de items seleccionados (solo `incluido=true` se guardan) |

---

## 🔍 Detalles del Procesamiento de combo_items_seleccionados

### ENTRADA (Desde Frontend)
```json
{
  "combo_items_seleccionados": [
    { "combo_item_id": 5, "producto_id": 101, "incluido": true },
    { "combo_item_id": 6, "producto_id": 102, "incluido": false },
    { "combo_item_id": 7, "producto_id": 103, "incluido": true },
    { "combo_item_id": 8, "producto_id": 104, "incluido": false }
  ]
}
```

### PROCESAMIENTO (ProformaService::crear → línea 179-217)
```php
// 1. Filtrar solo items donde incluido = true
$comboItemsSeleccionados = array_filter($detalle['combo_items_seleccionados'], function($item) {
    return ($item['incluido'] ?? false) === true;
});
// Resultado: Solo items con incluido=true: [5, 7]

// 2. Reindexar array (índices 0, 1 en lugar de 0, 2)
$comboItemsSeleccionados = array_values($comboItemsSeleccionados);

// 3. Mapear a formato estándar
$comboItemsSeleccionados = array_map(function($item) {
    return [
        'combo_item_id' => $item['combo_item_id'] ?? null,
        'producto_id' => $item['producto_id'] ?? null,
        'incluido' => $item['incluido'] ?? false,
    ];
}, $comboItemsSeleccionados);
```

### SALIDA (Se Guarda en BD)
```json
[
  { "combo_item_id": 5, "producto_id": 101, "incluido": true },
  { "combo_item_id": 7, "producto_id": 103, "incluido": true }
]
```

**NOTA**: Solo 2 items se guardan (los que tenían `incluido: true`). Los 2 con `incluido: false` se descartan.

---

## 📍 Ubicación de Código Crítico

### ProformaController::store()
**Archivo**: `app/Http/Controllers/ProformaController.php:288-343`
- Autenticación de usuario (línea 291-299)
- Creación de DTO (línea 301)
- Llamada a servicio (línea 310)
- Logging y respuesta (línea 312-324)
- Error handling (línea 326-342)

### StoreProformaRequest Validación
**Archivo**: `app/Http/Requests/StoreProformaRequest.php:28-146`
- Validaciones básicas (línea 30-59)
- Validaciones custom para unidades de medida (línea 99-146)
- **⚠️ NO VALIDA LOS 3 NUEVOS CAMPOS** (tipo_precio_id, tipo_precio_nombre, combo_items_seleccionados)
- Esto es correcto porque se consideran opcionales/informativos

### CrearProformaDTO::fromRequest()
**Archivo**: `app/DTOs/Venta/CrearProformaDTO.php:36-61`
- Extrae datos del request (línea 45-60)
- Valida estado_inicial (línea 38-43)
- Siempre usa Auth::id() para usuario_id (línea 57)
- **⚠️ NO EXTRAE LOS 3 NUEVOS CAMPOS** (tipo_precio_id, tipo_precio_nombre, combo_items_seleccionados)
- Esto es correcto porque están dentro del array `detalles` (no en el DTO raíz)

### ProformaService::crear() Procesamiento
**Archivo**: `app/Services/Venta/ProformaService.php:179-217`
- **✅ PROCESA los 3 nuevos campos** (línea 190-217)
- Incluye combo_items_seleccionados en cada DetalleProforma
- Incluye tipo_precio_id y tipo_precio_nombre en cada DetalleProforma

---

## 🎯 Validación y Comportamiento

### Campos REQUERIDOS por StoreProformaRequest
✅ **Estos causan validación 422 si faltan:**
- cliente_id
- fecha
- fecha_vencimiento
- detalles (array con min 1 elemento)
- subtotal, impuesto, total

### Campos OPCIONALES en StoreProformaRequest
⚠️ **Estos NO causan error si faltan:**
- almacen_id (default: 1)
- politica_pago (default: CONTRA_ENTREGA)
- canal (default: PRESENCIAL)
- observaciones
- estado_inicial (default: BORRADOR)

### Campos NUEVOS (No Validados pero Soportados)
✅ **Estos se pasan dentro de detalles[].* y se procesan:**
- tipo_precio_id (dentro de cada detalle)
- tipo_precio_nombre (dentro de cada detalle)
- combo_items_seleccionados (dentro de cada detalle)

**CONCLUSIÓN**: Los 3 nuevos campos son opcionales, si no se envían simplemente serán NULL en la BD (column nullable).

---

## 📊 Datos que se Guardan

### Tabla: proformas
| Campo | Valor | Origen |
|-------|-------|--------|
| id | auto | DB auto-increment |
| numero | VEN20260216-XXXX | Formato: VEN + date + ID |
| cliente_id | 27 | Desde request |
| usuario_id | 5 | Auth::id() (usuario logueado) |
| preventista_id | null/5 | Opcional desde request |
| estado | BORRADOR | Desde estado_inicial (default BORRADOR) |
| fecha | 2026-02-16 | Desde request |
| fecha_vencimiento | 2026-03-02 | Desde request |
| almacen_id | 1 | Desde request (default 1) |
| politica_pago | CONTRA_ENTREGA | Desde request |
| canal | PRESENCIAL | Desde request |
| observaciones | "..." | Opcional desde request |
| subtotal | 1250.00 | Desde request |
| impuesto | 0 | Desde request |
| total | 1250.00 | Desde request |
| created_at | now() | Sistema |
| updated_at | now() | Sistema |

### Tabla: detalle_proformas (POR CADA DETALLE)
| Campo | Valor | Origen |
|-------|-------|--------|
| id | auto | DB auto-increment |
| proforma_id | 42 | ID de la proforma creada |
| producto_id | 45 | Desde detalles[0].producto_id |
| cantidad | 10 | Desde detalles[0].cantidad |
| precio_unitario | 100.00 | Desde detalles[0].precio_unitario |
| subtotal | 1000.00 | cantidad * precio_unitario |
| unidad_medida_id | 3 | Desde detalles[0].unidad_medida_id |
| **tipo_precio_id** | 2 | **NUEVO**: Desde detalles[0].tipo_precio_id |
| **tipo_precio_nombre** | Mayorista | **NUEVO**: Desde detalles[0].tipo_precio_nombre |
| **combo_items_seleccionados** | JSON | **NUEVO**: Array procesado (solo incluido=true) |
| created_at | now() | Sistema |
| updated_at | now() | Sistema |

### Tabla: reservas_proforma (AUTOMÁTICO - 1 o más POR DETALLE)
Se crean automáticamente por ProformaService::reservarStock() usando ReservaDistribucionService:

| Campo | Valor | Origen |
|-------|-------|--------|
| id | auto | DB auto-increment |
| proforma_id | 42 | ID de la proforma |
| stock_producto_id | 156 | Stock del producto en almacén |
| cantidad_reservada | 10 | Cantidad bloqueada del detalle |
| fecha_vencimiento | 2026-02-19 | Fecha + 3 días (vencimiento de reserva) |
| estado | ACTIVA | Inicial es ACTIVA |

### Tabla: movimientos_inventario (AUTOMÁTICO - 1 POR LOTE RESERVADO)
Se crean automáticamente por ReservaDistribucionService para auditoría:

| Campo | Valor | Origen |
|-------|-------|--------|
| tipo | RESERVA_PROFORMA | Constante |
| cantidad | -10 | Negativo = bloqueo |
| cantidad_anterior | 190 | Stock antes de reservar |
| cantidad_posterior | 180 | Stock después de reservar |
| observacion | JSON | Detalles: FIFO, lote, vencimiento |
| numero_documento | PRO20260216-0042 | Número de la proforma |
| user_id | 5 | Usuario autenticado |

---

## 🚨 Casos de Error (422 Validation)

### 1. Cliente No Existe
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "cliente_id": ["El cliente seleccionado no existe"]
  }
}
```

### 2. Producto en Detalle No Existe
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "detalles.0.producto_id": ["El producto seleccionado no existe"]
  }
}
```

### 3. Cantidad Negativa o Cero
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "detalles.0.cantidad": ["La cantidad debe ser mayor a 0"]
  }
}
```

### 4. Producto No Fraccionado + Unidad Diferente
```json
{
  "success": false,
  "message": "Validation Error",
  "errors": {
    "detalles.0.unidad_medida_id": [
      "El producto 'Pepsi 2L' no es fraccionado y solo puede cotizarse en su unidad base"
    ]
  }
}
```

### 5. Stock Insuficiente (StockInsuficientException)
```json
{
  "success": false,
  "message": "Stock insuficiente para los productos especificados",
  "errors": {
    "detalle_0": "Stock insuficiente para 'Pepsi 2L': se solicitan 500, disponibles 100"
  },
  "statusCode": 422
}
```

---

## ✨ Respuesta Exitosa (201 CREATED)

```json
{
  "success": true,
  "message": "Proforma creada exitosamente",
  "data": {
    "id": 42,
    "numero": "PRO20260216-0042",
    "cliente_id": 27,
    "usuario_id": 5,
    "preventista_id": null,
    "estado": "BORRADOR",
    "fecha": "2026-02-16",
    "fecha_vencimiento": "2026-03-02",
    "almacen_id": 1,
    "politica_pago": "CONTRA_ENTREGA",
    "canal": "PRESENCIAL",
    "observaciones": null,
    "subtotal": 1250.00,
    "impuesto": 0,
    "total": 1250.00,
    "cliente": { "id": 27, "nombre": "Distribuidora ABC", ... },
    "detalles": [
      {
        "id": 1,
        "proforma_id": 42,
        "producto_id": 45,
        "cantidad": 10,
        "precio_unitario": 100.00,
        "subtotal": 1000.00,
        "unidad_medida_id": 3,
        "tipo_precio_id": 2,
        "tipo_precio_nombre": "Mayorista",
        "combo_items_seleccionados": [
          { "combo_item_id": 5, "producto_id": 101, "incluido": true },
          { "combo_item_id": 7, "producto_id": 103, "incluido": true }
        ],
        "producto": { "id": 45, "nombre": "Producto A", ... }
      }
    ],
    "created_at": "2026-02-16T14:30:00Z",
    "updated_at": "2026-02-16T14:30:00Z"
  },
  "redirectTo": "/proformas/42",
  "statusCode": 201
}
```

---

## 🔗 Relación con Otros Endpoints

### POST /api/proformas/{proforma}/actualizar-detalles
- Usa la MISMA lógica de procesamiento de combo_items_seleccionados
- También captura tipo_precio_id y tipo_precio_nombre
- Ajusta reservas automáticamente

### POST /api/proformas/{proforma}/convertir-venta
- COPIA los 3 nuevos campos desde detalle_proforma a detalle_venta
- Procesa combo_items_seleccionados idénticamente
- Consume las reservas

### GET /proformas
- Retorna listado de proformas (sin detalles de combo_items)

### GET /proformas/{id}
- Retorna proforma con TODOS los detalles incluyendo combo_items_seleccionados
- Retorna tipos de precio disponibles para edición

---

## 📝 Conclusiones

### ✅ El Endpoint POST /proformas Ahora:

1. **Valida correctamente** todos los campos requeridos vía StoreProformaRequest
2. **Soporta los 3 nuevos campos** dentro de detalles[]:
   - ✅ tipo_precio_id (optional, FK a tipos_precio)
   - ✅ tipo_precio_nombre (optional, string)
   - ✅ combo_items_seleccionados (optional, array procesado)
3. **Procesa combo_items_seleccionados** exactamente como VentaService:
   - Filtra solo items con incluido=true
   - Reindexar array
   - Mapea a formato estándar
4. **Guarda todos los datos** en detalle_proformas con los 3 nuevos campos
5. **Reserva stock automáticamente** usando ReservaDistribucionService
6. **Registra auditoría completa** en movimientos_inventario
7. **Maneja errores** con 3 tipos de excepciones y logging

### 🎯 Próximo Paso:

Cuando conviertas proforma a venta (POST /api/proformas/{id}/convertir-venta), los 3 campos se copian automáticamente a detalle_venta:
- La conversión es atómica (todo o nada)
- Stock se consume correctamente
- Reservas se marcan como CONSUMIDA

### 🔄 Ciclo Completo de una Proforma:

```
1. POST /proformas
   ↓ Crea proforma + detalles con 3 campos + reserva stock
   ↓
2. GET /proformas/{id}
   ↓ Muestra proforma con todos los detalles
   ↓
3. POST /api/proformas/{id}/actualizar-detalles (opcional)
   ↓ Actualiza detalles y ajusta reservas
   ↓
4. POST /api/proformas/{id}/convertir-venta
   ↓ Convierte a venta + copia 3 campos a detalle_venta + consume reservas
   ↓
5. POST /entregas (opcional)
   ↓ Crea entrega para la venta
```

---

## 📌 NOTA IMPORTANTE

Los 3 nuevos campos (`tipo_precio_id`, `tipo_precio_nombre`, `combo_items_seleccionados`) **NO están validados en StoreProformaRequest** porque:

1. ✅ Son **opcionales** (el usuario puede crear proforma sin especificarlos)
2. ✅ Se consideran **informativos/referenciales** (no son restricciones)
3. ✅ Se validan implícitamente en ProformaService::crear() (validarDetalles())
4. ✅ Si no se envían, simplemente serán **NULL en la BD** (columnas nullable)

Si en el futuro requieres validarlos (ej: hacer tipo_precio_id requerido), añade estas líneas a StoreProformaRequest::rules():

```php
'detalles.*.tipo_precio_id' => ['required', 'integer', 'exists:tipos_precio,id'],
'detalles.*.tipo_precio_nombre' => ['required', 'string', 'max:100'],
'detalles.*.combo_items_seleccionados' => ['nullable', 'array'],
'detalles.*.combo_items_seleccionados.*.combo_item_id' => ['nullable', 'integer', 'exists:combo_items,id'],
```

