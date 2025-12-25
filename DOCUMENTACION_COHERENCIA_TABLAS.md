# Documentación: Coherencia de Tablas y Modelo de Entregas

## 📋 Resumen de Cambios

Se realizaron ajustes significativos para mejorar la coherencia entre la estructura de bases de datos y la lógica de negocio, especialmente para soportar dos flujos de entregas:

1. **Flujo Legacy**: Entregas basadas en Proformas
2. **Flujo Nuevo**: Entregas basadas en Ventas + Flujo de Carga

---

## 🔧 Cambios Realizados

### 1. Migración: `2025_12_24_make_proforma_id_nullable_in_entregas.php`

**Problema**: La columna `proforma_id` era NOT NULL, lo que impedía crear entregas basadas solo en `venta_id`.

**Solución**: Hacer `proforma_id` nullable

```php
// ANTES
$table->foreignId('proforma_id')->constrained('proformas');

// DESPUÉS
$table->foreignId('proforma_id')->nullable()->constrained('proformas');
```

**Impacto**:
- ✅ Permite entregas del nuevo flujo (venta_id sin proforma_id)
- ✅ Mantiene compatibilidad con entregas legacy (proforma_id)
- ✅ Soporta ambos flujos simultáneamente

**Ejecutar migración:**
```bash
php artisan migrate
```

---

### 2. Actualización: Modelo `Entrega.php`

Se agregaron validaciones y métodos para mejorar la integridad de datos.

#### A. Validación en `boot()`

```php
protected static function boot(): void
{
    parent::boot();

    // Validar que siempre haya proforma_id o venta_id
    static::creating(function ($model) {
        if (!$model->proforma_id && !$model->venta_id) {
            throw new \InvalidArgumentException(
                'Entrega debe tener al menos proforma_id o venta_id'
            );
        }
    });

    static::updating(function ($model) {
        if (!$model->proforma_id && !$model->venta_id) {
            throw new \InvalidArgumentException(
                'Entrega debe tener al menos proforma_id o venta_id'
            );
        }
    });
}
```

**Uso**: Automático - se valida en create/update

#### B. Validación de Transiciones de Estados

```php
// Definir transiciones válidas
$entrega->obtenerTransicionesValidas()  // Array con todas las transiciones

// Validar una transición
$entrega->esTransicionValida('EN_CARGA')  // true/false

// Obtener estados siguientes permitidos
$entrega->obtenerEstadosSiguientes()  // ['EN_CARGA', 'CANCELADA']

// Cambiar estado (con validación)
$entrega->cambiarEstado('EN_CARGA', 'Iniciando carga', auth()->user());
```

**Transiciones válidas:**

```
PROGRAMADO
  → ASIGNADA (flujo legacy)
  → PREPARACION_CARGA (flujo nuevo)
  → CANCELADA

ASIGNADA → EN_CAMINO → LLEGO → ENTREGADO (flujo legacy)
PREPARACION_CARGA → EN_CARGA → LISTO_PARA_ENTREGA → EN_TRANSITO → ENTREGADO (flujo nuevo)

Excepciones: NOVEDAD, RECHAZADO (desde LLEGO/EN_TRANSITO)
```

#### C. Métodos Útiles

```php
// Obtener fuente (Venta o Proforma)
$entrega->obtenerFuente()        // Venta o Proforma model
$entrega->obtenerNombreFuente()  // "Venta" o "Proforma"

// Verificar flujo actual
$entrega->estaEnFlujoDeCargas()  // PREPARACION_CARGA, EN_CARGA, ...
$entrega->estaEnFlujoLegacy()    // ASIGNADA, EN_CAMINO, LLEGO

// Verificar estados
$entrega->tieneReporteDeCarga()  // bool
$entrega->esEntregada()          // bool
$entrega->fueCancelada()         // bool
$entrega->estaEnTransito()       // bool
```

---

### 3. Nueva Request Class: `CrearEntregaRequest.php`

Valida la creación de entregas asegurando que tengan al menos `proforma_id` o `venta_id`.

**Uso en Controller:**

```php
public function store(CrearEntregaRequest $request)
{
    $entrega = Entrega::create($request->validated());
    return response()->json($entrega);
}
```

**Validaciones:**
- Requiere al menos una fuente (venta o proforma)
- Valida relaciones con BD
- Mensajes de error personalizados en español

---

## 📊 Estructura de Tablas (Actualizada)

### Tabla: `entregas`

| Campo | Tipo | Nullable | Validación |
|-------|------|----------|-----------|
| id | bigint | NO | PK |
| proforma_id | bigint | **YES** ✅ | FK, nullable (legacy) |
| venta_id | bigint | YES | FK, nullable (nuevo) |
| estado | enum | NO | 12 estados válidos |
| reporte_carga_id | bigint | YES | FK, cascade |
| ... | ... | ... | ... |

**Invariante**: `proforma_id IS NOT NULL OR venta_id IS NOT NULL`

---

### Tabla: `entrega_estado_historials`

Registra todos los cambios de estado automáticamente.

```
Cambio: PROGRAMADO → PREPARACION_CARGA
↓
INSERT INTO entrega_estado_historials (
  entrega_id, usuario_id, estado_anterior, estado_nuevo, comentario, created_at
)
```

---

### Tabla: `reporte_cargas`

Almacena reportes de carga generados en el flujo nuevo.

```
Flujo:
PREPARACION_CARGA → [Generar reporte] → EN_CARGA → [Confirmar] → LISTO_PARA_ENTREGA
```

---

### Tabla: `reporte_carga_detalles`

Detalle de productos por reporte.

**Nota**: El índice unique en `(reporte_carga_id, detalle_venta_id)` permite que `detalle_venta_id` sea NULL para productos sueltos.

---

## 🚀 Cómo Usar: Casos de Uso

### Caso 1: Crear entrega basada en VENTA (Nuevo flujo)

```php
$entrega = Entrega::create([
    'venta_id' => 5,                          // Origen: Venta
    'proforma_id' => null,                    // Sin proforma
    'estado' => 'PROGRAMADO',                 // Estado inicial
    'fecha_programada' => now()->addDays(2),
    'direccion_entrega' => 'Calle 123...',
]);

// Cambiar a PREPARACION_CARGA
$entrega->cambiarEstado('PREPARACION_CARGA', 'Lista para preparar carga', auth()->user());

// Generar reporte de carga
$reporte = $entrega->reporteCarga()->create([...]);

// Cambiar a EN_CARGA
$entrega->cambiarEstado('EN_CARGA', 'Iniciando carga física');
```

### Caso 2: Crear entrega basada en PROFORMA (Flujo legacy)

```php
$entrega = Entrega::create([
    'proforma_id' => 3,                       // Origen: Proforma
    'venta_id' => null,                       // Sin venta
    'estado' => 'PROGRAMADO',
    'chofer_id' => 1,
    'vehiculo_id' => 1,
]);

// Flujo legacy
$entrega->cambiarEstado('ASIGNADA');
$entrega->cambiarEstado('EN_CAMINO');
$entrega->cambiarEstado('LLEGO');
$entrega->cambiarEstado('ENTREGADO');
```

### Caso 3: Validar transición antes de cambiar estado

```php
$nuevoEstado = 'EN_CARGA';

if ($entrega->esTransicionValida($nuevoEstado)) {
    $entrega->cambiarEstado($nuevoEstado);
} else {
    $estadosValidos = $entrega->obtenerEstadosSiguientes();
    throw new InvalidTransitionException(
        "No se puede pasar a {$nuevoEstado}. " .
        "Estados válidos: " . implode(', ', $estadosValidos)
    );
}
```

---

## ⚠️ Puntos Importantes

### 1. Validación Automática

```php
// ESTO FALLARÁ (sin fuente)
Entrega::create(['estado' => 'PROGRAMADO']);
// Error: Entrega debe tener al menos proforma_id o venta_id
```

### 2. Transiciones de Estados

```php
// ESTO FALLARÁ (transición inválida)
$entrega->cambiarEstado('ENTREGADO');  // Estaba en PROGRAMADO
// Error: No se puede transicionar de 'PROGRAMADO' a 'ENTREGADO'
```

### 3. Historial Automático

```php
// Cada cambio de estado se registra
$entrega->cambiarEstado('EN_CARGA');

// Ver historial
$entrega->historialEstados()->get();
// [
//   { estado_anterior: 'PROGRAMADO', estado_nuevo: 'EN_CARGA', ... },
//   ...
// ]
```

---

## 📈 Beneficios Implementados

| Aspecto | Antes | Después |
|--------|-------|---------|
| Flujos soportados | Solo proformas | Proformas + Ventas |
| Validación de estados | Manual en controladores | Automática en modelo |
| Historial de cambios | No confiable | Automático y auditable |
| Integridad de datos | Débil (proforma_id NOT NULL) | Fuerte (al menos uno) |
| Documentación | Implícita | Explícita en código |

---

## 🔍 Testing Recomendado

```bash
# Tests unitarios
php artisan test --filter EntregaTest

# Tests de validación
php artisan test --filter CrearEntregaValidationTest

# Tests de transiciones
php artisan test --filter EntregaStateTransitionTest
```

---

## 📝 Notas de Migración

Para bases de datos existentes con datos:

```bash
# Ejecutar la migración (es segura, solo hace nullable)
php artisan migrate

# No requiere limpieza de datos existentes
# Las proformas actuales mantienen su proforma_id
# Las nuevas entregas pueden usar venta_id
```

---

## 🆘 Troubleshooting

**Problema**: `Column 'proforma_id' cannot be null`

**Solución**: Ejecutar la migración `2025_12_24_make_proforma_id_nullable_in_entregas.php`

---

**Problema**: "No se puede transicionar de X a Y"

**Solución**: Verificar con `$entrega->obtenerEstadosSiguientes()` qué transiciones son válidas

---

**Problema**: Entrega sin proforma_id ni venta_id

**Solución**: Modificar el create/update para incluir al menos uno de estos campos
