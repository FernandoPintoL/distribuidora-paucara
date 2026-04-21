# Sistema de Pagos Múltiples por Venta

## 📊 Vista General de la Arquitectura

```
┌─────────────────────────────────────────┐
│   Frontend (React - Por implementar)    │
│  - Formulario de múltiples pagos        │
│  - Validación de suma = total           │
│  - Resumen por tipo de pago             │
└────────────────┬────────────────────────┘
                 │
                 │ POST /api/ventas/{id}/pagos/registrar
                 │ GET  /api/ventas/{id}/pagos/resumen
                 │ GET  /api/ventas/{id}/pagos/detalle
                 │ GET  /api/ventas/pagos/reporte-caja
                 │
                 ▼
┌─────────────────────────────────────────┐
│   PagoVentaController                   │
│  - registrarPagos()                     │
│  - obtenerResumen()                     │
│  - obtenerDetalle()                     │
│  - reporteCaja()                        │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│   PagoVentaService                      │
│  - registrarPagos()   (validaciones)    │
│  - obtenerResumenPagos()                │
│  - validarPagos()                       │
│  - obtenerReporteCaja()                 │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────────────┐
│   Modelos Eloquent                       │
│  ┌──────────────────────────────────┐   │
│  │ Venta                            │   │
│  │ - id, numero, total              │   │
│  │ - monto_pagado, monto_pendiente  │   │
│  │ - detallesPagoVenta() [1:N]      │   │
│  └──────────────────────────────────┘   │
│           │                             │
│           ▼                             │
│  ┌──────────────────────────────────┐   │
│  │ DetallePagoVenta                 │   │
│  │ - id, venta_id, tipo_pago_id     │   │
│  │ - monto, referencia, fecha_pago  │   │
│  │ - comprobante, observaciones     │   │
│  │ - tipoPago() ─────────────┐      │   │
│  └──────────────────────────────────┘   │
│                                          │
│  ┌──────────────────────────────────┐   │
│  │ TipoPago                         │   │
│  │ - id, codigo, nombre             │   │
│  │ - activo, es_credito             │   │
│  └──────────────────────────────────┘   │
└──────────────────────────────────────────┘
                 │
                 ▼
         ┌───────────────┐
         │  BD: MySQL    │
         │               │
         │ detalles_     │
         │ pago_venta    │
         │               │
         └───────────────┘
```

## 🗂️ Estructura de la Base de Datos

### Tabla: `detalles_pago_venta`
```sql
CREATE TABLE detalles_pago_venta (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    venta_id BIGINT NOT NULL FOREIGN KEY → ventas(id),
    tipo_pago_id BIGINT NOT NULL FOREIGN KEY → tipos_pago(id),
    monto DECIMAL(12,2) NOT NULL,              -- Monto pagado con este método
    referencia VARCHAR(255) NULL,              -- Número transf/cheque/referencia
    fecha_pago TIMESTAMP NULL,                 -- Cuándo se realizó el pago
    comprobante VARCHAR(255) NULL,             -- URL/path del comprobante
    observaciones TEXT NULL,                   -- Notas adicionales
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**Índices:**
- `venta_id` - Para búsquedas rápidas por venta
- `tipo_pago_id` - Para reportes por tipo de pago
- `fecha_pago` - Para reportes por fecha

## 🔄 Flujo de Registro de Pagos

```
1. Usuario llena formulario con:
   ┌─────────────────────────────────────┐
   │ Venta Total: $800                   │
   │                                     │
   │ Método 1: Efectivo                  │
   │ - Monto: $500                       │
   │ - Referencia: -                     │
   │                                     │
   │ Método 2: Transferencia             │
   │ - Monto: $300                       │
   │ - Referencia: TRF-20260421-001      │
   │ - Fecha: 2026-04-21 14:30           │
   │                                     │
   │ SUMA: $800 ✅                       │
   └─────────────────────────────────────┘

2. Frontend valida:
   ✓ Cada monto > 0
   ✓ Suma de montos = total venta
   ✓ Al menos 1 método de pago

3. POST /api/ventas/{id}/pagos/registrar
   {
     "pagos": [
       {
         "tipo_pago_id": 1,
         "monto": 500
       },
       {
         "tipo_pago_id": 2,
         "monto": 300,
         "referencia": "TRF-20260421-001",
         "fecha_pago": "2026-04-21 14:30:00"
       }
     ]
   }

4. Backend (PagoVentaService):
   ✓ Valida suma = $800
   ✓ Dentro de transacción:
     - Elimina pagos anteriores
     - Crea 2 registros en detalles_pago_venta
     - Actualiza venta.monto_pagado = 800
     - Actualiza venta.monto_pendiente = 0
   ✓ Responde con confirmación

5. Resultado:
   {
     "success": true,
     "data": {
       "venta_id": 123,
       "total_venta": 800,
       "total_pagado": 800,
       "monto_pendiente": 0,
       "detalles_pago": [...]
     }
   }
```

## 🎯 Endpoints API

### 1. Registrar Pagos
```http
POST /api/ventas/{venta}/pagos/registrar
Content-Type: application/json

{
  "pagos": [
    {
      "tipo_pago_id": 1,
      "monto": 500,
      "referencia": null,
      "observaciones": "En mano"
    },
    {
      "tipo_pago_id": 2,
      "monto": 300,
      "referencia": "TRF-20260421-001",
      "fecha_pago": "2026-04-21 14:30:00",
      "observaciones": "Banco XYZ"
    }
  ]
}

Respuesta 200:
{
  "success": true,
  "message": "Pagos registrados exitosamente",
  "data": {
    "venta_id": 123,
    "total_venta": 800,
    "total_pagado": 800,
    "monto_pendiente": 0,
    "detalles_pago": [...]
  }
}
```

### 2. Obtener Resumen de Pagos
```http
GET /api/ventas/{venta}/pagos/resumen

Respuesta 200:
{
  "success": true,
  "venta_numero": "VEN20260421000001",
  "total_venta": 800,
  "monto_pagado": 800,
  "monto_pendiente": 0,
  "pagos_por_tipo": [
    {
      "tipo_pago": "Efectivo",
      "codigo": "EFECTIVO",
      "cantidad": 1,
      "monto_total": 500
    },
    {
      "tipo_pago": "Transferencia",
      "codigo": "TRANSFERENCIA",
      "cantidad": 1,
      "monto_total": 300
    }
  ]
}
```

### 3. Obtener Detalle Completo
```http
GET /api/ventas/{venta}/pagos/detalle

Respuesta 200:
{
  "success": true,
  "venta_numero": "VEN20260421000001",
  "total_venta": 800,
  "monto_pagado": 800,
  "monto_pendiente": 0,
  "pagos": [
    {
      "id": 1,
      "tipo_pago": "Efectivo",
      "tipo_pago_codigo": "EFECTIVO",
      "monto": 500,
      "referencia": null,
      "fecha_pago": "2026-04-21T14:35:00.000000Z",
      "comprobante": null,
      "observaciones": "En mano",
      "icono": "Banknote"
    },
    {
      "id": 2,
      "tipo_pago": "Transferencia",
      "tipo_pago_codigo": "TRANSFERENCIA",
      "monto": 300,
      "referencia": "TRF-20260421-001",
      "fecha_pago": "2026-04-21T14:30:00.000000Z",
      "comprobante": null,
      "observaciones": "Banco XYZ",
      "icono": "Send"
    }
  ]
}
```

### 4. Reporte de Caja
```http
GET /api/ventas/pagos/reporte-caja?fecha_desde=2026-04-21&fecha_hasta=2026-04-21

Respuesta 200:
{
  "success": true,
  "data": {
    "fecha_desde": "2026-04-21",
    "fecha_hasta": "2026-04-21",
    "total_general": 5000,
    "por_tipo_pago": {
      "EFECTIVO": {
        "tipo_pago": "Efectivo",
        "total": 3000,
        "cantidad_transacciones": 8
      },
      "TRANSFERENCIA": {
        "tipo_pago": "Transferencia",
        "total": 2000,
        "cantidad_transacciones": 3
      }
    },
    "detalles": [
      {
        "venta_numero": "VEN20260421000001",
        "tipo_pago": "Efectivo",
        "monto": 500,
        "referencia": null,
        "fecha_pago": "2026-04-21 14:35:00",
        "observaciones": "En mano"
      },
      ...
    ]
  }
}
```

## 📦 Archivos Creados

```
Backend:
├── app/
│   ├── Models/
│   │   └── DetallePagoVenta.php          ✅ Modelo Eloquent
│   ├── Services/
│   │   └── PagoVentaService.php          ✅ Lógica de negocio
│   └── Http/Controllers/Api/
│       └── PagoVentaController.php       ✅ Endpoints API
├── database/migrations/
│   └── 2026_04_21_175356_create_detalles_pago_venta_table.php  ✅ Tabla BD
└── routes/
    └── api.php                           ✅ Rutas agregadas

Frontend (Auto-generados):
├── resources/js/actions/App/Http/Controllers/Api/
│   └── PagoVentaController.ts
└── resources/js/routes/api/ventas/
    └── pagos/index.ts

Documentación:
└── SISTEMA_PAGOS_VENTA.md               ✅ Este archivo
```

## 🚀 Próximos Pasos

1. **Frontend (React)**
   - Componente `FormularioPagosVenta` para registrar múltiples pagos
   - Validación en tiempo real (suma = total)
   - Selector de tipo de pago con iconos
   - Campos condicionales (referencia para transferencias/cheques)

2. **Reportes**
   - Página de resumen de caja diaria por tipo de pago
   - Reporte de efectivo vs transferencias
   - Auditoría de referencias de transacciones

3. **Mejoras**
   - Subida de comprobantes (foto/PDF del recibo)
   - Reconciliación automática con extracto bancario
   - Alertas si suma de pagos ≠ total

## ✅ Validaciones Implementadas

- ✓ Suma de pagos DEBE ser igual al total de la venta
- ✓ Cada pago debe tener monto > 0
- ✓ tipo_pago_id debe existir en table tipos_pago
- ✓ Al menos 1 método de pago requerido
- ✓ Transaccional: si falla un pago, todos se revierten

## 📋 Ejemplo de Uso en Laravel

```php
// Controlador
$venta = Venta::find(123);

// Opción 1: Vía servicio
$pagoVentaService->registrarPagos($venta, [
    ['tipo_pago_id' => 1, 'monto' => 500],
    ['tipo_pago_id' => 2, 'monto' => 300, 'referencia' => 'TRF-001'],
]);

// Opción 2: Directo (relación)
$venta->detallesPagoVenta()->createMany([
    ['tipo_pago_id' => 1, 'monto' => 500],
    ['tipo_pago_id' => 2, 'monto' => 300],
]);

// Obtener resumen
$resumen = $pagoVentaService->obtenerResumenPagos($venta);
// Resultado:
// [
//   ['tipo_pago' => 'Efectivo', 'cantidad' => 1, 'monto_total' => 500],
//   ['tipo_pago' => 'Transferencia', 'cantidad' => 1, 'monto_total' => 300],
// ]
```

---

**Estado**: ✅ Backend implementado 100%  
**Siguiente**: Implementar frontend React  
**Fecha**: 21/04/2026
