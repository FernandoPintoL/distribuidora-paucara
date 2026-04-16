# 🛒 Sistema Completo de Ventas de Prestables

## Cambio Conceptual Importante

**Anterior:** `cantidad_vendida` era un estado más en `prestable_stock` (junto con disponible, prestamo_cliente, prestamo_proveedor)

**Nuevo:** 
- Los prestables tienen **3 estados principales** (disponible, prestamo_cliente, prestamo_proveedor)
- Las **ventas se registran en tabla separada** `prestamos_vendidos`
- `cantidad_vendida` es un **acumulativo histórico** (no estado actual)

## Arquitectura Completa

### Tablas Creadas

#### 1. `prestamos_vendidos` (Encabezado de Venta)
```sql
- id (PK)
- numero_venta (PV-2026-00001) - UNIQUE
- cliente_id (FK) - nullable
- usuario_id (FK) - usuario que vende
- estado (BORRADOR, CONFIRMADA, CANCELADA)
- subtotal, iva, total
- observaciones
- fecha_venta, fecha_confirmacion, fecha_cancelacion
- ip_usuario, user_agent (auditoría)
- timestamps
- Índices: numero_venta, cliente_id, usuario_id, estado, fecha_venta
```

#### 2. `prestamos_vendidos_detalles` (Líneas de Venta)
```sql
- id (PK)
- prestamo_vendido_id (FK) - referencia a encabezado
- prestable_id (FK) - qué prestable se vende
- almacen_id (FK) - de qué almacén sale
- cantidad - cuántos se venden
- precio_unitario
- subtotal
- observaciones
- timestamps
```

#### 3. `movimientos_prestables` (se actualiza)
Registra automáticamente movimientos cuando se confirma venta:
- tipo: `VENTA_PRESTABLE`
- referencia_tipo: `VENTA_PRESTABLE`
- referencia_id: ID de la venta
- Rastrea cambio de cantidad_disponible → reducción por venta

### Modelos

#### `PrestamoVendido`
```php
- Relaciones: cliente, usuario, detalles
- Métodos:
  - confirmar() → cambia estado a CONFIRMADA
  - cancelar($motivo) → cambia estado a CANCELADA
  - cantidad_total → suma de cantidades en detalles
- Scopes: confirmadas(), activas(), porCliente(), porUsuario(), porFecha()
```

#### `PrestamoVendidoDetalle`
```php
- Relaciones: prestamoVendido, prestable, almacen
- Métodos:
  - calcularSubtotal() → cantidad × precio_unitario
- Scopes: porPrestable(), porAlmacen()
```

### Servicio: `PrestamoVendidoService`

Maneja la lógica transaccional completa:

```php
crearVenta(array $data)
├─ Crea encabezado en estado BORRADOR
├─ Genera número único (PV-2026-00001)
└─ Retorna instancia de PrestamoVendido

agregarDetalle(venta, prestableId, almacenId, cantidad, precio)
├─ Verifica stock disponible
├─ Crea registro en detalles
├─ Actualiza totales
└─ Retorna detalle creado

confirmarVenta(venta) ← TRANSACCIÓN
├─ Para cada detalle:
│  ├─ Verifica stock suficiente
│  ├─ Reduce cantidad_disponible
│  ├─ Registra movimiento en movimientos_prestables
│  └─ Audita el cambio
├─ Cambia estado a CONFIRMADA
├─ Registra fecha_confirmacion
└─ Log completo

cancelarVenta(venta, motivo) ← TRANSACCIÓN
├─ Para cada detalle:
│  └─ Restaura cantidad_disponible
├─ Marca movimientos como anulados
├─ Cambia estado a CANCELADA
└─ Registra motivo y fecha_cancelacion
```

## Flujo de Uso

### 1. Crear Venta (BORRADOR)
```php
$ventaService = new PrestamoVendidoService($movimientoService);
$venta = $ventaService->crearVenta([
    'cliente_id' => 123,
    'usuario_id' => auth()->id(),
    'observaciones' => 'Venta especial',
]);
```

### 2. Agregar Detalles
```php
$ventaService->agregarDetalle(
    venta: $venta,
    prestableId: 5,      // Canastilla ID
    almacenId: 3,        // Almacén
    cantidad: 50,        // Cantidad a vender
    precioUnitario: 100, // Precio cada una
    observaciones: 'Lote A'
);

$ventaService->agregarDetalle(
    venta: $venta,
    prestableId: 7,
    almacenId: 3,
    cantidad: 30,
    precioUnitario: 150,
);
```

### 3. Confirmar Venta (ACTUALIZA STOCK)
```php
$ventaService->confirmarVenta($venta);
// ✅ Stock reducido
// ✅ Movimientos registrados
// ✅ Estado = CONFIRMADA
```

**¿Qué sucede?**
- prestable_stock.cantidad_disponible: 100 → 50 (para prestable_id 5, almacen 3)
- Crea movimiento: tipo='VENTA_PRESTABLE', cantidad=-50
- Estado de venta: BORRADOR → CONFIRMADA

### 4. Cancelar Venta (REVIERTE STOCK)
```php
$ventaService->cancelarVenta(
    venta: $venta,
    motivo: 'Cliente cambió de opinión'
);
// ✅ Stock restaurado
// ✅ Movimientos marcados como anulados
// ✅ Estado = CANCELADA
```

## Cálculo de Cantidad Vendida

Para obtener cantidad total vendida de un prestable:

```php
// En PrestableStock model (accessor)
public function getCantidadVendidaAttribute()
{
    return PrestamoVendidoDetalle::where('prestable_id', $this->prestable_id)
        ->whereHas('prestamoVendido', function($q) {
            $q->where('estado', 'CONFIRMADA');
        })
        ->sum('cantidad');
}

// Uso:
$stock = PrestableStock::find(1);
echo $stock->cantidad_vendida; // Ej: 150 unidades vendidas
```

## Estados de Stock (3 estados principales)

| Estado | Significado | Movimiento |
|--------|-------------|-----------|
| disponible | En almacén sin compromiso | Se reduce al vender |
| prestamo_cliente | Con cliente (debe devolverse) | Sube cuando presta, baja cuando devuelve |
| prestamo_proveedor | Con proveedor (debe devolverse) | Sube cuando presta, baja cuando devuelve |

**Nota:** `cantidad_vendida` ya NO es un estado, es un histórico calculado.

## Tipos de Movimientos Actualizados

```
VENTA_PRESTABLE (NEW)
├─ Tipo: venta
├─ Origen: prestamos_vendidos
├─ Efecto: reduce disponible
└─ Es reversible: sí (por cancelación)
```

## Ejemplo Completo de Venta

```php
// 1. Estado inicial
prestable_stock (prestable_id=5, almacen_id=3):
  disponible: 100
  prestamo_cliente: 20
  prestamo_proveedor: 10
  (cantidad_vendida calculada: 150 históricos)

// 2. Crear venta de 50 unidades
$venta = $ventaService->crearVenta([
    'cliente_id' => 123,
]);
$ventaService->agregarDetalle($venta, 5, 3, 50, 100);

// 3. Confirmar
$ventaService->confirmarVenta($venta);

// 4. Estado después
prestable_stock (prestable_id=5, almacen_id=3):
  disponible: 50 (100 - 50)
  prestamo_cliente: 20
  prestamo_proveedor: 10
  (cantidad_vendida calculada: 150 + 50 = 200)

// 5. Movimiento registrado
movimientos_prestables:
  tipo: 'VENTA_PRESTABLE'
  cantidad: -50
  disponible_anterior: 100
  disponible_posterior: 50
  referencia_tipo: 'VENTA_PRESTABLE'
  referencia_id: $venta->id
```

## Auditoría Completa

Cada venta registra:
- ✅ Quién la creó (usuario_id)
- ✅ Cuándo (fecha_venta, fecha_confirmacion)
- ✅ De dónde (IP, user_agent)
- ✅ Todos los cambios de stock en movimientos_prestables
- ✅ Motivo de cancelación si aplica
- ✅ Trazabilidad completa por cliente

## Próximas Mejoras

- [ ] Endpoints API para CRUD de ventas
- [ ] Página React para crear/editar ventas
- [ ] Generación de documento/factura PDF
- [ ] Validaciones de restricción fiscal
- [ ] Integración con sistema de pagos
- [ ] Reportes de ventas

## Testing

```php
// Verificar venta creada
$venta = PrestamoVendido::where('numero_venta', 'PV-2026-00001')->first();
echo $venta->numero_venta; // PV-2026-00001
echo $venta->estado; // CONFIRMADA
echo $venta->total; // 5000

// Verificar movimientos
$movimientos = MovimientoPrestable::where('referencia_tipo', 'VENTA_PRESTABLE')
    ->where('referencia_id', $venta->id)
    ->get();
    
// Verificar stock actualizado
$stock = PrestableStock::find(1);
echo $stock->cantidad_disponible; // Reducido
echo $stock->cantidad_vendida; // Acumulativo histórico
```

---

**Fecha:** 2026-04-13  
**Versión:** 1.0  
**Estado:** Listo para implementación
