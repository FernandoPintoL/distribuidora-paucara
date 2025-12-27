# FASE 2: MODELOS ELOQUENT
**Refactorización de Modelos para Nueva Arquitectura**

**Fecha:** 2025-12-27
**Status:** ✅ COMPLETADO

---

## 📋 Cambios realizados

### 1. ✅ Nuevo Modelo: `EntregaVenta` (Pivot)

**Archivo:** `app/Models/EntregaVenta.php`

**Responsabilidad:** Representar el vínculo entre una Entrega y sus Ventas

**Campos principales:**
```php
- id (PK)
- entrega_id (FK)
- venta_id (FK)
- orden (INT) - Secuencia de carga
- confirmado_por (FK → users) - Quién confirmó en almacén
- fecha_confirmacion (TIMESTAMP) - Cuándo se confirmó
- notas (TEXT) - Observaciones
```

**Métodos principales:**
```php
// Verificar estado
$entregaVenta->estaCargada(): bool

// Confirmar/Desmarcar carga
$entregaVenta->confirmarCarga(?User $usuario, ?string $notas): void
$entregaVenta->desmarcarCarga(?string $razon): void

// Acceso a datos relacionados
$entregaVenta->obtenerCliente()
$entregaVenta->obtenerNumeroVenta()
$entregaVenta->obtenerPeso()
$entregaVenta->obtenerVolumen()
```

**Scopes disponibles:**
```php
EntregaVenta::confirmadas()->get()           // Solo confirmadas
EntregaVenta::pendientes()->get()            // Pendientes
EntregaVenta::confirmadosPor(5)->get()       // Por usuario
EntregaVenta::porEntrega(100)->get()         // Por entrega
EntregaVenta::ordenado()->get()              // Ordenado por orden
```

---

### 2. ✅ Refactorización: Modelo `Entrega`

**Archivo:** `app/Models/Entrega.php`

#### **Cambio 1: Relación venta() → ventas()**

**ANTES:**
```php
public function venta(): BelongsTo
{
    return $this->belongsTo(Venta::class);  // 1:1
}
```

**DESPUÉS:**
```php
public function ventas(): BelongsToMany
{
    return $this->belongsToMany(
        Venta::class,
        'entrega_venta',      // tabla pivot
        'entrega_id',         // FK en pivot
        'venta_id'            // FK en pivot
    )
    ->using(EntregaVenta::class)  // Modelo pivot
    ->withPivot(['orden', 'confirmado_por', 'fecha_confirmacion', 'notas'])
    ->withTimestamps()
    ->orderBy('entrega_venta.orden');
}

public function ventasAsociadas(): HasMany
{
    return $this->hasMany(EntregaVenta::class);
}
```

**Beneficio:** Una entrega ahora puede tener múltiples ventas

#### **Cambio 2: Campos fillable actualizados**

```php
// REMOVIDO
'venta_id'              // Ya no direct FK

// AGREGADO
'zona_id'               // Para agrupar por localidad
'numero_entrega'        // ID legible (ENT-20251227-001)
```

#### **Cambio 3: Boot del modelo actualizado**

**Antes:**
```php
// Validaba que existiera venta_id o proforma_id
// Sincronizaba solo con 1 venta
```

**Después:**
```php
// No valida venta_id (opcional ahora)
// Sincroniza con TODAS las ventas asociadas
static::updated(function ($model) {
    if ($model->isDirty('estado')) {
        foreach ($model->ventas as $venta) {
            $sincronizador->alCambiarEstadoEntrega($model, ..., $venta);
        }
    }
});
```

#### **Cambio 4: Nuevos métodos de confirmación de carga**

```php
// Confirmación de ventas
$entrega->confirmarVentaCargada(Venta $venta, ?User $usuario, ?string $notas): void
$entrega->desmarcarVentaCargada(Venta $venta, ?string $razon): void

// Consultas
$entrega->obtenerVentas()
$entrega->obtenerVentasConfirmadas()
$entrega->obtenerVentasPendientes()
$entrega->todasVentasConfirmadas(): bool

// Progreso y estado
$entrega->obtenerProgresoConfirmacion(): array
// Retorna: ['confirmadas' => 2, 'total' => 3, 'porcentaje' => 66.67, 'completado' => false]

// Cálculos
$entrega->obtenerPesoTotal(): float
$entrega->obtenerVolumenTotal(): float
$entrega->obtenerPorcentajeUtilizacion(): float
$entrega->cabe_en_vehiculo(): bool

// Gestión de ventas
$entrega->agregarVenta(Venta $venta, ?int $orden, ?string $notas)
$entrega->removerVenta(Venta $venta): bool
```

---

## 🎯 Flujo de uso típico

### Crear una entrega con múltiples ventas (NUEVA ARQUITECTURA)
```php
use App\Services\Logistica\CrearEntregaPorLocalidadService;

$service = app(CrearEntregaPorLocalidadService::class);

$entrega = $service->crearEntregaConsolidada(
    ventaIds: [1001, 1002, 1003],    // 3 ventas
    vehiculoId: 10,
    choferId: 5,
    zonaId: 3  // Centro
);

// $entrega ahora tiene 3 ventas asociadas via pivot
```

### Almacenero confirma ventas
```php
$entrega = Entrega::find(100);
$usuario = auth()->user();

// Confirmar primera venta
$venta1 = Venta::find(1001);
$entrega->confirmarVentaCargada($venta1, $usuario, 'Confirmada por Juan');

// Confirmar segunda venta
$venta2 = Venta::find(1002);
$entrega->confirmarVentaCargada($venta2, $usuario);

// Ver progreso
$progreso = $entrega->obtenerProgresoConfirmacion();
// ['confirmadas' => 2, 'total' => 3, 'porcentaje' => 66.67, 'completado' => false]

// Confirmar tercera venta
$venta3 = Venta::find(1003);
$entrega->confirmarVentaCargada($venta3, $usuario);

// Automáticamente:
// - todasVentasConfirmadas() retorna true
// - Estado cambia a LISTO_PARA_ENTREGA
// - Se registra en historial
```

### Obtener información
```php
$entrega = Entrega::find(100);

// Todas las ventas
$ventas = $entrega->obtenerVentas();  // Ordenadas por orden de carga

// Solo confirmadas
$confirmadas = $entrega->obtenerVentasConfirmadas();

// Pendientes
$pendientes = $entrega->obtenerVentasPendientes();

// Cálculos
$peso = $entrega->obtenerPesoTotal();              // 1500 kg
$volumen = $entrega->obtenerVolumenTotal();        // 45 m³
$utilización = $entrega->obtenerPorcentajeUtilizacion();  // 75%
$cabe = $entrega->cabe_en_vehiculo();              // true/false
```

### Relaciones en query
```php
// Obtener entregas con sus ventas (lazy loading)
$entregas = Entrega::with('ventas')->get();

// Obtener entregas con solo ventas confirmadas
$entregas = Entrega::with([
    'ventas' => fn($q) => $q->whereNotNull('entrega_venta.fecha_confirmacion')
])->get();

// Obtener entregas pendientes de confirmación
$entregas = Entrega::whereHas('ventasAsociadas', function($q) {
    $q->whereNull('fecha_confirmacion');
})->get();

// Filtrar por zona
$entregas = Entrega::where('zona_id', 3)->with('ventas')->get();
```

---

## 📊 Comparación antes vs después

| Aspecto | Antes | Después |
|---------|-------|---------|
| **Relación Venta-Entrega** | 1:1 (FK `venta_id`) | N:M (Pivot `entrega_venta`) |
| **Múltiples ventas por entrega** | ❌ Imposible | ✅ Nativo |
| **Confirmación de carga** | No existe | ✅ Via `EntregaVenta::confirmarCarga()` |
| **Progreso de carga** | Manual | ✅ Automático via `obtenerProgresoConfirmacion()` |
| **Sincronización de ventas** | 1 venta | ✅ Todas las ventas |
| **Campos zona_id, numero_entrega** | No existen | ✅ Nuevos |

---

## 🔍 Verificaciones ejecutadas

✅ Modelo `EntregaVenta` creado y funcional
✅ Relación `ventas()` cambiada a `belongsToMany`
✅ Método `ventasAsociadas()` para acceso al pivot
✅ Campos nuevos agregados a `fillable`
✅ Campo `venta_id` removido de `fillable`
✅ Boot actualizado para sincronizar múltiples ventas
✅ 20+ métodos nuevos de negocio
✅ Scopes para filtrar ventas confirmadas/pendientes
✅ Todos los métodos verificados en tinker

---

## 🚀 Próximos pasos (FASE 3)

**Servicios de negocio:**
- [ ] `CrearEntregaPorLocalidadService`
  - Crear 1 Entrega con N Ventas
  - Validar peso, zona, disponibilidad
  - Generar ReporteCarga automático

- [ ] Actualizar `SincronizacionVentaEntregaService`
  - Sincronizar todas las ventas (no solo una)

- [ ] Crear `GenerarReporteCargoService` mejorado
  - Generar desde Entrega (no ReporteCarga directamente)

---

## 💡 Notas importantes

1. **Compatibilidad backward:**
   - Entregas antiguas (1 venta) siguen funcionando
   - Se migraron automáticamente al pivot en FASE 1

2. **Sincronización automática:**
   - Cuando cambia estado de Entrega, se sincroniza con todas las ventas
   - No requiere intervención manual

3. **Progreso de carga:**
   - Se calcula en tiempo real
   - Basado en `fecha_confirmacion` en el pivot

4. **Eliminación de venta_id:**
   - Cambio no rompe nada (migramos datos en FASE 1)
   - Todos los tests pasaron

---

## 📝 Archivos modificados

```
app/Models/
├── EntregaVenta.php (NUEVO)      ← Pivot model
└── Entrega.php (MODIFICADO)      ← Refactored relationships + new methods
```

---

**Ejecución completada:** ✅ FASE 2 LISTA PARA FASE 3

Todos los modelos funcionan correctamente y están listos para ser utilizados en los servicios de la Fase 3.
