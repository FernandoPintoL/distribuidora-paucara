# 🔗 Relaciones: Reporte de Carga ↔ Entregas (Many-to-Many)

**Fecha**: 2025-12-24
**Status**: ✅ Implementado
**Versión**: 1.0

---

## 🎯 Problema Resuelto

### Antes (Problema)
```
reporte_cargas
├── entrega_id (FK)  ← Solo UNA entrega por reporte
├── vehiculo_id
└── venta_id

❌ Reporte consolidado = múltiples entregas
❌ No hay forma de vincular 1 reporte con N entregas
❌ Difícil de verificar e imprimir
```

### Después (Solución)
```
reporte_cargas (1) ←→ (N) reporte_carga_entregas (Pivot) ←→ (N) entregas

✅ Reporte consolidado = 1 reporte con N entregas
✅ Reporte individual = 1 reporte con 1 entrega
✅ Una entrega puede estar en múltiples reportes
✅ Auditoría completa
✅ Fácil de imprimir y verificar
```

---

## 📊 Nueva Estructura

### Tabla: `reporte_cargas` (sin cambios, pero ahora con relación M-to-M)

```sql
reporte_cargas
├── id (PK)
├── numero_reporte (UNIQUE)
├── vehiculo_id (FK)
├── descripcion
├── peso_total_kg
├── estado (ENUM)
└── ... otros campos
```

### Tabla: `reporte_carga_entregas` (NUEVA - Pivot)

```sql
reporte_carga_entregas
├── id (PK)
├── reporte_carga_id (FK) → reporte_cargas
├── entrega_id (FK) → entregas
├── orden (INT)                    ← Orden en reporte consolidado
├── incluida_en_carga (BOOL)       ← Fue incluida físicamente
├── notas (TEXT)                   ← Observaciones específicas
├── created_at (TIMESTAMP)
└── updated_at (TIMESTAMP)

UNIQUE: (reporte_carga_id, entrega_id)  ← Evitar duplicados
```

---

## 🔄 Relaciones en Código

### ReporteCarga

```php
// ✅ NUEVO: Relación Many-to-Many
$reporte->entregas();           // Todas las entregas del reporte
$reporte->reporteEntregas();    // Acceso directo a pivot

// ✅ LEGACY (para compatibilidad)
$reporte->entrega;              // Primera entrega (deprecated)
```

### Entrega

```php
// ✅ NUEVO: Relación Many-to-Many inversa
$entrega->reportes();           // Todos los reportes de la entrega

// ✅ LEGACY (para compatibilidad)
$entrega->reporteCarga;         // Primer reporte (deprecated)
```

### ReporteCargaEntrega (Pivot)

```php
// Acceso a relaciones
$pivot->reporteCarga();         // El reporte
$pivot->entrega();              // La entrega

// Métodos de utilidad
$pivot->marcarComoIncluida('Todas las cajas cargadas');
$pivot->marcarComoNoIncluida('Falta stock');
```

---

## 💻 Ejemplos de Uso

### Crear Reporte Consolidado (N entregas)

```php
// 1. Crear el reporte
$reporte = ReporteCarga::create([
    'numero_reporte' => ReporteCarga::generarNumeroReporte(),
    'vehiculo_id' => 1,
    'descripcion' => 'Reporte consolidado - 3 entregas',
    'peso_total_kg' => 150,
    'generado_por' => auth()->id(),
]);

// 2. Vincular múltiples entregas
$entregaIds = [1, 2, 3];
$reporte->entregas()->attach($entregaIds);
// O con orden y notas:
$reporte->entregas()->attach([
    1 => ['orden' => 1, 'notas' => 'Entrega principal'],
    2 => ['orden' => 2],
    3 => ['orden' => 3],
]);

// ✅ Resultado: 1 reporte con 3 entregas
```

### Crear Reporte Individual (1 entrega)

```php
// 1. Crear el reporte
$reporte = ReporteCarga::create([
    'numero_reporte' => ReporteCarga::generarNumeroReporte(),
    'vehiculo_id' => 1,
    'descripcion' => 'Reporte individual',
    'peso_total_kg' => 50,
    'generado_por' => auth()->id(),
]);

// 2. Vincular 1 entrega
$reporte->entregas()->attach($entrega->id, ['orden' => 1]);

// ✅ Resultado: 1 reporte con 1 entrega
```

### Obtener Entregas de un Reporte

```php
$reporte = ReporteCarga::find(1);

// Todas las entregas ordenadas
$entregas = $reporte->entregas()->get();

// Con información del pivot
foreach ($reporte->entregas as $entrega) {
    echo "Entrega: {$entrega->id}";
    echo "Orden: {$entrega->pivot->orden}";
    echo "Incluida: {$entrega->pivot->incluida_en_carga}";
    echo "Notas: {$entrega->pivot->notas}";
}

// Contar entregas
echo $reporte->entregas()->count();  // 3

// Entregas incluidas en carga
$incluidas = $reporte->entregas()
    ->wherePivot('incluida_en_carga', true)
    ->get();

// Entregas no incluidas
$noIncluidas = $reporte->entregas()
    ->wherePivot('incluida_en_carga', false)
    ->get();
```

### Obtener Reportes de una Entrega

```php
$entrega = Entrega::find(1);

// Todos los reportes donde está esta entrega
$reportes = $entrega->reportes()->get();

// Último reporte
$ultimoReporte = $entrega->reportes()->latest()->first();

// Reportes confirmados
$confirmados = $entrega->reportes()
    ->where('estado', 'CONFIRMADO')
    ->get();
```

### Marcar Entregas como Incluidas/No Incluidas

```php
$reporte = ReporteCarga::find(1);

// Obtener el pivot y marcar como incluida
$pivot = $reporte->reporteEntregas()
    ->where('entrega_id', 5)
    ->first();

$pivot->marcarComoIncluida('Cargadas 10 cajas');

// O marcar como no incluida
$pivot->marcarComoNoIncluida('Sin stock disponible');
```

### Verificar Contenido de Reporte Antes de Imprimir

```php
$reporte = ReporteCarga::find(1);

// Verificación completa
$detalle = [
    'numero_reporte' => $reporte->numero_reporte,
    'total_entregas' => $reporte->entregas()->count(),
    'entregas' => $reporte->entregas->map(function($entrega) {
        return [
            'id' => $entrega->id,
            'numero' => $entrega->numero_entrega,
            'estado' => $entrega->estado,
            'orden' => $entrega->pivot->orden,
            'incluida_en_carga' => $entrega->pivot->incluida_en_carga,
            'notas' => $entrega->pivot->notas,
            'cliente' => $entrega->venta?->cliente?->nombre,
            'peso_kg' => $entrega->peso_kg,
        ];
    })->toArray(),
    'peso_total' => $reporte->entregas->sum('peso_kg'),
    'estado_reporte' => $reporte->estado,
];

return response()->json($detalle);
```

---

## 📋 Casos de Uso Reales

### Caso 1: Reporte Consolidado de Múltiples Entregas

```
Situación:
- Vehículo + Chofer asignado a 3 entregas
- Todas van a la misma zona
- Se crea UN reporte consolidado

Flujo:
1. EntregaBatchController::store() crea 3 entregas
2. ReporteCargoService genera reporte consolidado
3. Se vinculan las 3 entregas al reporte:
   - Entrega 1 (Orden 1)
   - Entrega 2 (Orden 2)
   - Entrega 3 (Orden 3)
4. Se imprime 1 reporte con 3 entregas
5. En almacén, se cargan según orden
6. Al cargar, se marca: incluida_en_carga = true
```

### Caso 2: Reporte Individual (Fallback)

```
Situación:
- Entrega sola o tipo_reporte = 'individual'
- Se crea un reporte individual

Flujo:
1. EntregaService crea 1 entrega
2. ReporteCargoService genera reporte individual
3. Se vincula 1 entrega al reporte
4. Se imprime reporte de 1 entrega
```

### Caso 3: Entrega Dividida entre Reportes

```
Situación:
- Entrega parcialmente cargada en Reporte 1
- Resto cargado en Reporte 2

Flujo:
1. Entrega 5 → Reporte A (incluida_en_carga = true)
2. Entrega 5 → Reporte B (incluida_en_carga = true)
3. Historial completo de dónde fue cargada
```

---

## 🔍 Consultas Útiles

### Obtener Reporte con Todas las Entregas Cargadas

```php
$reporteCompleto = ReporteCarga::with([
    'entregas' => fn($q) => $q->orderBy('reporte_carga_entregas.orden'),
    'entregas.venta.cliente',
    'entregas.chofer',
    'detalles.producto',
])->find(1);

// Acceso
foreach ($reporteCompleto->entregas as $entrega) {
    echo $entrega->venta->cliente->nombre;
    echo $entrega->pivot->orden;
}
```

### Buscar Reportes que Contienen una Entrega

```php
$entregaId = 5;

$reportes = ReporteCarga::whereHas('entregas', function($q) use ($entregaId) {
    $q->where('entrega_id', $entregaId);
})->get();
```

### Obtener Reportes Pendientes de Confirmación

```php
$pendientes = ReporteCarga::where('estado', 'PENDIENTE')
    ->with('entregas')
    ->get();
```

### Contar Entregas por Reporte

```php
$reportesConConteo = ReporteCarga::withCount('entregas')->get();

foreach ($reportesConConteo as $reporte) {
    echo "{$reporte->numero_reporte}: {$reporte->entregas_count} entregas";
}
```

---

## 🛠️ Migración para Existir Datos

Para datos existentes, ejecutar:

```bash
php artisan migrate
```

La migración creará la tabla pivot. Si ya hay datos:

```php
// Script para migrar datos existentes (opcional)
$reportes = ReporteCarga::whereNotNull('entrega_id')->get();

foreach ($reportes as $reporte) {
    // Si el reporte ya tiene entrega_id, vincularla
    $reporte->entregas()->attach($reporte->entrega_id, [
        'orden' => 1,
        'incluida_en_carga' => false,
    ]);
}
```

---

## 📝 Actualización de Servicios

### ReporteCargoService.php (debe actualizarse)

Cambiar de:
```php
// ANTES
$reporte->update(['entrega_id' => $entrega->id]);

// DESPUÉS
$reporte->entregas()->attach($entrega->id, ['orden' => 1]);
```

---

## 🔐 Garantías

✅ **Integridad Referencial**
- FKs con cascade/set null

✅ **Unicidad**
- No se puede vincular la misma entrega 2 veces a un reporte

✅ **Auditoría**
- Timestamps de cuándo se vinculó

✅ **Flexibilidad**
- Soporta reportes individuales y consolidados

---

## ⚠️ Consideraciones

1. **Compatibilidad**: El campo `entrega_id` en `reporte_cargas` sigue existiendo para compatibilidad
2. **Preferencia**: Usar `entregas()` en lugar de `entrega` para acceder
3. **Nuevos reportes**: Siempre usar pivot para vincular entregas
4. **Impresión**: Iterar sobre `$reporte->entregas` para imprimir

---

## 🧪 Tests Recomendados

```php
public function test_reporte_puede_tener_multiples_entregas()
{
    $reporte = ReporteCarga::create([...]);
    $entregas = Entrega::factory(3)->create();

    $reporte->entregas()->attach($entregas->pluck('id')->toArray());

    $this->assertCount(3, $reporte->entregas);
}

public function test_entrega_puede_estar_en_multiples_reportes()
{
    $entrega = Entrega::factory()->create();
    $reportes = ReporteCarga::factory(2)->create();

    foreach ($reportes as $reporte) {
        $reporte->entregas()->attach($entrega->id);
    }

    $this->assertCount(2, $entrega->reportes);
}
```

---

**Última actualización**: 2025-12-24
**Status**: ✅ Listo para uso
