# 📍 Guía del Servicio EntregaLocalidadesService

## Descripción
Servicio centralizado para gestionar y obtener información sobre localidades en entregas. Uso recomendado en cualquier parte de la aplicación.

**Ubicación:** `/app/Services/EntregaLocalidadesService.php`

---

## 🚀 Inyección de Dependencias

### En Controllers
```php
namespace App\Http\Controllers;

use App\Services\EntregaLocalidadesService;
use App\Models\Entrega;

class EntregaController extends Controller
{
    public function __construct(
        private EntregaLocalidadesService $service
    ) {}

    public function detalles(Entrega $entrega)
    {
        $localidades = $this->service->obtenerLocalidades($entrega);
        return view('entregas.detalles', compact('entrega', 'localidades'));
    }
}
```

### En Servicios
```php
use App\Services\EntregaLocalidadesService;

class MiServicio
{
    public function __construct(
        private EntregaLocalidadesService $localidadesService
    ) {}

    public function procesarEntrega($entregaId)
    {
        $entrega = Entrega::find($entregaId);
        $resumen = $this->localidadesService->obtenerLocalidadesResumen($entrega);
        // Procesar resumen...
    }
}
```

### Uso Manual (Sin Inyección)
```php
$service = app(EntregaLocalidadesService::class);
$localidades = $service->obtenerLocalidades($entrega);
```

---

## 📚 Métodos Disponibles

### 1️⃣ `obtenerLocalidades(Entrega $entrega)`
Obtiene todas las localidades únicas de una entrega.

**Parámetros:**
- `$entrega` - Instancia de modelo Entrega
- `$cargarRelaciones` - (opcional, default: true) Si debe cargar relaciones

**Retorna:** `Collection` de objetos Localidad

**Ejemplo:**
```php
$localidades = $service->obtenerLocalidades($entrega);

foreach ($localidades as $localidad) {
    echo "{$localidad->nombre} ({$localidad->codigo})";
}

// Salida:
// La Paz (LP)
// Santa Cruz (SC)
```

---

### 2️⃣ `obtenerLocalidadesResumen(Entrega $entrega)`
Obtiene información agrupada y resumida de localidades con ventas y clientes.

**Parámetros:**
- `$entrega` - Instancia de modelo Entrega
- `$cargarRelaciones` - (opcional, default: true) Si debe cargar relaciones

**Retorna:** `Array` con estructura:
```php
[
  [
    'localidad_id' => 1,
    'localidad_nombre' => 'La Paz',
    'localidad_codigo' => 'LP',
    'cantidad_ventas' => 3,
    'clientes' => ['Cliente A', 'Cliente B', 'Cliente C']
  ],
  [
    'localidad_id' => 2,
    'localidad_nombre' => 'Santa Cruz',
    'localidad_codigo' => 'SC',
    'cantidad_ventas' => 1,
    'clientes' => ['Cliente D']
  ]
]
```

**Ejemplo:**
```php
$resumen = $service->obtenerLocalidadesResumen($entrega);

foreach ($resumen as $item) {
    echo "{$item['localidad_nombre']}: {$item['cantidad_ventas']} ventas\n";
    echo "  Clientes: " . implode(', ', $item['clientes']) . "\n";
}

// Salida:
// La Paz: 3 ventas
//   Clientes: Cliente A, Cliente B, Cliente C
// Santa Cruz: 1 ventas
//   Clientes: Cliente D
```

---

### 3️⃣ `esConsolidada(Entrega $entrega)`
Valida si una entrega tiene múltiples localidades (consolidada).

**Parámetros:**
- `$entrega` - Instancia de modelo Entrega

**Retorna:** `bool` - true si tiene 2+ localidades

**Ejemplo:**
```php
if ($service->esConsolidada($entrega)) {
    Log::info("Entrega consolidada de múltiples localidades");
    // Aplicar lógica especial
} else {
    Log::info("Entrega simple de una localidad");
}
```

---

### 4️⃣ `obtenerCantidadLocalidades(Entrega $entrega)`
Obtiene el número total de localidades únicas.

**Parámetros:**
- `$entrega` - Instancia de modelo Entrega

**Retorna:** `int` - Cantidad de localidades

**Ejemplo:**
```php
$cantidad = $service->obtenerCantidadLocalidades($entrega);
echo "Esta entrega cubre $cantidad localidades";

// Salida: Esta entrega cubre 2 localidades
```

---

### 5️⃣ `obtenerDatosCompletos(Entrega $entrega)`
Obtiene todos los datos estructurados en un único llamado.

**Parámetros:**
- `$entrega` - Instancia de modelo Entrega

**Retorna:** `Array` con estructura completa:
```php
[
  'localidades' => [...],              // Array de localidades
  'localidades_resumen' => [...],      // Array resumido
  'cantidad_localidades' => 2,         // Int
  'es_consolidada' => true,            // Bool
  'entrega_id' => 42,                  // Int
  'numero_entrega' => 'ENT-...'        // String
]
```

**Ejemplo:**
```php
$datos = $service->obtenerDatosCompletos($entrega);

return response()->json([
    'success' => true,
    'data' => $datos
]);
```

---

### 6️⃣ `validarLocalidadVentaEntrega(Entrega $entrega, int $ventaId, int $localidadId)`
Valida si una venta de una entrega pertenece a una localidad específica.

**Parámetros:**
- `$entrega` - Instancia de modelo Entrega
- `$ventaId` - ID de la venta
- `$localidadId` - ID de la localidad

**Retorna:** `bool` - true si la venta está en esa localidad

**Ejemplo:**
```php
$pertenece = $service->validarLocalidadVentaEntrega($entrega, 100, 1);

if ($pertenece) {
    echo "La venta 100 está en La Paz";
} else {
    echo "La venta 100 NO está en La Paz";
}
```

---

### 7️⃣ `obtenerLocalidadesComunes(array|Collection $entregas)`
Obtiene localidades que aparecen en TODAS las entregas.

**Parámetros:**
- `$entregas` - Array de IDs o colección de modelos Entrega

**Retorna:** `Collection` de objetos Localidad

**Ejemplo:**
```php
// Con IDs
$entregas = [42, 43, 44];
$localesComunes = $service->obtenerLocalidadesComunes($entregas);

// Con modelos
$entregas = Entrega::where('estado', 'EN_TRANSITO')->get();
$localesComunes = $service->obtenerLocalidadesComunes($entregas);

// Usar resultado
foreach ($localesComunes as $loc) {
    echo "Localidad común: {$loc->nombre}";
}
```

---

### 8️⃣ `obtenerEntregasPorLocalidad(int $localidadId)`
Obtiene todas las entregas que cubren una localidad específica.

**Parámetros:**
- `$localidadId` - ID de la localidad

**Retorna:** `Collection` de modelos Entrega

**Ejemplo:**
```php
// Obtener todas las entregas para La Paz
$entregas = $service->obtenerEntregasPorLocalidad(1);

foreach ($entregas as $entrega) {
    echo "{$entrega->numero_entrega} - {$entrega->estado}\n";
}

// Salida:
// ENT-20260207-001 - EN_TRANSITO
// ENT-20260207-002 - LISTO_PARA_ENTREGA
```

---

## 💡 Casos de Uso Comunes

### Caso 1: Mostrar Localidades en Dashboard
```php
public function dashboard(EntregaLocalidadesService $service)
{
    $entrega = Entrega::find(42);
    $resumen = $service->obtenerLocalidadesResumen($entrega);

    return view('dashboard', compact('resumen', 'entrega'));
}
```

### Caso 2: Validar Entrega Consolidada
```php
public function procesarEntrega(Entrega $entrega, EntregaLocalidadesService $service)
{
    if ($service->esConsolidada($entrega)) {
        // Aplicar flujo especial para consolidadas
        return $this->procesarConsolidada($entrega);
    }

    return $this->procesarSimple($entrega);
}
```

### Caso 3: Reporte de Entregas por Localidad
```php
public function reporteLocalidad(int $localidadId, EntregaLocalidadesService $service)
{
    $entregas = $service->obtenerEntregasPorLocalidad($localidadId);

    return response()->json([
        'localidad_id' => $localidadId,
        'cantidad_entregas' => $entregas->count(),
        'entregas' => $entregas->map(fn($e) => [
            'id' => $e->id,
            'numero' => $e->numero_entrega,
            'estado' => $e->estado
        ])
    ]);
}
```

### Caso 4: Generar JSON Completo para API
```php
public function obtenerLocalidades(Entrega $entrega, EntregaLocalidadesService $service)
{
    return response()->json([
        'success' => true,
        'data' => $service->obtenerDatosCompletos($entrega)
    ]);
}
```

### Caso 5: Validar Permisos por Localidad
```php
public function autorizar(
    Entrega $entrega,
    int $localidadId,
    EntregaLocalidadesService $service
) {
    // Verificar que la entrega cubre esa localidad
    if (!in_array($localidadId, $service->obtenerLocalidades($entrega)->pluck('id')->toArray())) {
        abort(403, 'No autorizado para esta localidad');
    }

    return true;
}
```

---

## 🔍 Logging Automático

El servicio registra automáticamente todas las operaciones en el log:

```
[2026-02-07 14:30:45] local.INFO: 📍 [LOCALIDADES] Obteniendo localidades de entrega {"entrega_id":42,"cargar_relaciones":true}
[2026-02-07 14:30:45] local.INFO: ✅ [LOCALIDADES] Localidades obtenidas {"entrega_id":42,"cantidad":2,"nombres":["La Paz","Santa Cruz"]}
```

Esto permite seguimiento y debugging fácil.

---

## ⚡ Performance

✅ **Optimizado:**
- Carga relaciones una sola vez
- Usa operaciones en memoria (sin queries adicionales)
- Evita N+1 queries
- Caché implícito mediante `relationLoaded()`

**Complejidad:**
- `obtenerLocalidades()`: O(n) donde n = número de ventas
- `obtenerLocalidadesResumen()`: O(n)
- `esConsolidada()`: O(n)
- `obtenerLocalidadesComunes()`: O(n*m) donde m = número de entregas

---

## 🔄 Flujo de Inyección en Laravel

```
Request → Router → Middleware → Controller
                                    ↓
                            EntregaController
                                    ↓
                    Laravel resuelve dependencias
                                    ↓
                    EntregaLocalidadesService ← inyectado automáticamente
                                    ↓
                            Método disponible
```

---

## 📋 Métodos del Modelo vs Servicio

| Caso | Usar Método del Modelo | Usar Servicio |
|------|----------------------|---------------|
| **Acceso directo desde Blade** | ✅ | ❌ |
| **En Controllers** | ✅ | ✅✅ (Preferido) |
| **En Servicios** | ❌ | ✅ |
| **En Jobs/Queue** | ✅ | ✅✅ (Preferido) |
| **En Eventos** | ✅ | ✅ |
| **En Middleware** | ❌ | ✅ |
| **Reutilización múltiple** | ❌ | ✅✅ (Preferido) |

---

## ✅ Checklist de Implementación

- ✅ Servicio creado: `EntregaLocalidadesService.php`
- ✅ 8 métodos públicos disponibles
- ✅ Logging automático en cada operación
- ✅ Inyección de dependencias soportada
- ✅ Uso desde controllers implementado
- ✅ Documentación exhaustiva
- ✅ Optimizado para performance
- ✅ Ejemplos de uso para cada método

**¡Listo para usar en cualquier parte de la aplicación! 🚀**
