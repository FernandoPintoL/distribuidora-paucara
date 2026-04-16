# 🎉 Implementación Completa: Ventas de Prestables

## ✅ Los 3 Puntos Implementados:

### 1️⃣ ENDPOINTS API
**Archivo:** `app/Http/Controllers/PrestamoVendidoController.php`

```
GET    /api/prestamos-vendidos              → Listar ventas (con filtros y paginación)
POST   /api/prestamos-vendidos              → Crear venta nueva (BORRADOR)
GET    /api/prestamos-vendidos/{venta}      → Obtener detalle de venta
POST   /api/prestamos-vendidos/{venta}/agregar-detalle     → Agregar línea
DELETE /api/prestamos-vendidos/{venta}/detalles/{detalle}  → Eliminar línea
POST   /api/prestamos-vendidos/{venta}/confirmar           → Confirmar venta ⚠️
POST   /api/prestamos-vendidos/{venta}/cancelar            → Cancelar venta
GET    /api/prestamos-vendidos/{venta}/descargar-pdf       → Descargar PDF
```

**Rutas registradas en:** `routes/api.php`

### 2️⃣ PÁGINA REACT
**Archivo:** `resources/js/presentation/pages/prestamos/ventas/crear.tsx`

**Características:**
- ✅ Crear nueva venta (genera número único PV-2026-00001)
- ✅ Agregar detalles (prestable, almacén, cantidad, precio)
- ✅ Eliminar detalles
- ✅ Tabla responsiva de detalles
- ✅ Cálculo automático de subtotales
- ✅ Totales con IVA (21%)
- ✅ Confirmación de venta (✅ ACTUALIZA STOCK AUTOMÁTICAMENTE)
- ✅ Descarga de PDF
- ✅ Dark mode support
- ✅ Estados visuales (BORRADOR/CONFIRMADA/CANCELADA)

**Acceso:** `GET /prestamos/ventas/crear`
**Ruta registrada en:** `routes/web.php`

### 3️⃣ REPORTE PDF
**Archivo:** `resources/views/prestamos/venta-pdf.blade.php`

**Contenido del PDF:**
- ✅ Encabezado: "VENTA DE PRESTABLES"
- ✅ Información de venta (número, fecha, estado, usuario)
- ✅ Datos del cliente
- ✅ Tabla con detalles (prestable, almacén, cantidad, precio, subtotal)
- ✅ Cálculos: Subtotal, IVA (21%), Total
- ✅ Observaciones (si existen)
- ✅ Motivo de cancelación (si está cancelada)
- ✅ Footer con fecha de generación
- ✅ Estilos profesionales
- ✅ Color-coded según estado (CONFIRMADA=verde, BORRADOR=amarillo, CANCELADA=rojo)

## 🔄 Flujo Completo de Venta

### 1. **Crear Venta** (GET `/prestamos/ventas/crear`)
```
POST /api/prestamos-vendidos
├─ Genera número único (PV-2026-00001)
├─ Estado: BORRADOR
└─ Retorna instancia de venta vacía
```

### 2. **Agregar Detalles** (Estado: BORRADOR)
```
POST /api/prestamos-vendidos/{venta}/agregar-detalle
├─ Prestable: ID del prestable a vender
├─ Almacén: Almacén del cual se saca
├─ Cantidad: Cuántas unidades
├─ Precio Unitario: Precio de venta
└─ Actualiza totales automáticamente
```

### 3. **Revisar Venta**
```
Estado BORRADOR:
├─ Tabla de detalles editable
├─ Totales calculados en tiempo real
├─ Botón para agregar más detalles
└─ Botón para eliminar detalles
```

### 4. **Confirmar Venta** ⚠️ MOMENTO CRÍTICO
```
POST /api/prestamos-vendidos/{venta}/confirmar

AQUÍ SUCEDE:
✅ Para cada detalle:
   ├─ Reduce cantidad_disponible en prestable_stock
   ├─ Registra movimiento en movimientos_prestables
   │  └─ tipo: VENTA_PRESTABLE
   └─ Registra referencia para auditoría

✅ Estado: BORRADOR → CONFIRMADA
✅ Fecha confirmación: NOW()
✅ TRANSACCIÓN ATÓMICA (rollback si falla)
```

### 5. **Descargar PDF**
```
GET /api/prestamos-vendidos/{venta}/descargar-pdf

Genera PDF con:
├─ Información de venta
├─ Detalles de líneas
├─ Cálculos y totales
└─ Firma digital (opcional, puede agregarse)
```

### 6. **Cancelar Venta** (Opcional)
```
POST /api/prestamos-vendidos/{venta}/cancelar

REVIERTE:
✅ Restaura cantidad_disponible
✅ Marca movimientos como anulados
✅ Estado: CONFIRMADA → CANCELADA
✅ Registra motivo de cancelación
```

## 📊 Impacto en Stock

### Antes de Confirmar:
```
prestable_stock (id=5, almacen_id=3)
├─ cantidad_disponible: 100
├─ prestamo_cliente: 20
├─ prestamo_proveedor: 10
└─ cantidad_vendida: (se calcula: 150)
```

### Confirmar venta de 50 unidades:
```
POST /api/prestamos-vendidos/123/confirmar
```

### Después de Confirmar:
```
prestable_stock (id=5, almacen_id=3)
├─ cantidad_disponible: 50 ← REDUCIDO
├─ prestamo_cliente: 20
├─ prestamo_proveedor: 10
└─ cantidad_vendida: (se calcula: 150 + 50 = 200) ← AUMENTADO

movimientos_prestables (NEW)
├─ tipo: VENTA_PRESTABLE
├─ cantidad: -50
├─ disponible_anterior: 100
├─ disponible_posterior: 50
├─ referencia_tipo: VENTA_PRESTABLE
├─ referencia_id: 123 (venta ID)
└─ usuario_id, ip_usuario, etc (auditoría completa)
```

## 🛠️ Ejemplo de Uso desde Postman/cURL

### 1. Crear venta:
```bash
POST /api/prestamos-vendidos
{
  "cliente_id": 123,
  "observaciones": "Venta especial"
}

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "numero_venta": "PV-2026-00001",
    "estado": "BORRADOR",
    "total": 0
  }
}
```

### 2. Agregar detalle:
```bash
POST /api/prestamos-vendidos/1/agregar-detalle
{
  "prestable_id": 5,
  "almacen_id": 3,
  "cantidad": 50,
  "precio_unitario": 100
}

Response:
{
  "success": true,
  "data": {
    "detalle": { ... },
    "venta": {
      "id": 1,
      "subtotal": 5000,
      "iva": 1050,
      "total": 6050
    }
  }
}
```

### 3. Confirmar:
```bash
POST /api/prestamos-vendidos/1/confirmar

Response:
{
  "success": true,
  "data": {
    "id": 1,
    "estado": "CONFIRMADA",
    "fecha_confirmacion": "2026-04-13T14:30:00"
  }
}

✅ Stock actualizado automáticamente
✅ Movimientos registrados
✅ PDF listo para descargar
```

### 4. Descargar PDF:
```bash
GET /api/prestamos-vendidos/1/descargar-pdf
→ Descarga: venta-prestables-PV-2026-00001.pdf
```

## 📱 Página Web de Ventas

**URL:** `/prestamos/ventas/crear`

### Estado BORRADOR:
```
┌─────────────────────────────────────────────┐
│ 🛒 Nueva Venta de Prestables                │
│ Venta: PV-2026-00001 - Estado: BORRADOR    │
├─────────────────────────────────────────────┤
│ Agregar Detalle                             │
│ ┌─────────────────────────────────────────┐ │
│ │ Prestable: [SELECT]                     │ │
│ │ Almacén: [SELECT]                       │ │
│ │ Cantidad: [___]  Precio: [___]  [➕]    │ │
│ └─────────────────────────────────────────┘ │
├─────────────────────────────────────────────┤
│ Prestable  | Almacén | Cant | Precio | Sub │
│ CANT-1     | Galpón  | 50   | $100   | ... │
│ CANT-2     | Galpón  | 30   | $150   | ... │
├─────────────────────────────────────────────┤
│ Subtotal:        $5000                      │
│ IVA (21%):       $1050                      │
│ TOTAL:           $6050                      │
├─────────────────────────────────────────────┤
│ [✅ Confirmar Venta]                        │
└─────────────────────────────────────────────┘
```

### Estado CONFIRMADA:
```
├─────────────────────────────────────────────┤
│ Estado: CONFIRMADA (con fecha)              │
│ Tabla sin opciones de edición               │
│ [📄 Descargar PDF]                          │
└─────────────────────────────────────────────┘
```

## 🔐 Validaciones Implementadas

✅ Stock disponible suficiente  
✅ No permitir editar venta confirmada/cancelada  
✅ Requerir al menos un detalle antes de confirmar  
✅ Autoupdating de totales  
✅ Transacción atómica en confirmación  
✅ Auditoría completa de cambios  
✅ Manejo de excepciones robusto  

## 🚀 Próximas Mejoras (Opcional)

- [ ] Página de listado de ventas
- [ ] Filtros avanzados (fecha, cliente, estado)
- [ ] Exportación a Excel
- [ ] Integración con sistema de pagos
- [ ] Envío automático de PDF por email
- [ ] Firma digital del documento
- [ ] Devoluciones/cambios de venta
- [ ] Integración con facturas

## 🧪 Testing Rápido

```bash
# 1. Crear venta
curl -X POST http://localhost:8000/api/prestamos-vendidos \
  -H "Content-Type: application/json" \
  -d '{"cliente_id": null}'

# 2. Agregar detalle
curl -X POST http://localhost:8000/api/prestamos-vendidos/1/agregar-detalle \
  -H "Content-Type: application/json" \
  -d '{
    "prestable_id": 1,
    "almacen_id": 3,
    "cantidad": 50,
    "precio_unitario": 100
  }'

# 3. Confirmar
curl -X POST http://localhost:8000/api/prestamos-vendidos/1/confirmar

# 4. Verificar stock actualizado
curl http://localhost:8000/api/prestables/1/stock

# 5. Descargar PDF
curl http://localhost:8000/api/prestamos-vendidos/1/descargar-pdf -o venta.pdf
```

---

**Fecha:** 2026-04-13  
**Status:** ✅ COMPLETADO - LISTO PARA PRODUCCIÓN  
**Versión:** 1.0  
