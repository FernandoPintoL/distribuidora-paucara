# ⚡ Guía Rápida: Nuevos Métodos de Entregas

## 🎯 Cheat Sheet de Métodos

### ✅ Validación de Fuente

```php
$entrega = Entrega::find(1);

// Obtener la fuente
$fuente = $entrega->obtenerFuente();      // Venta o Proforma
$nombre = $entrega->obtenerNombreFuente(); // "Venta" o "Proforma"

// Comprobar en qué flujo está
if ($entrega->estaEnFlujoDeCargas()) {
    // PREPARACION_CARGA, EN_CARGA, LISTO_PARA_ENTREGA, EN_TRANSITO
}

if ($entrega->estaEnFlujoLegacy()) {
    // ASIGNADA, EN_CAMINO, LLEGO
}

// Comprobar si tiene reporte
if ($entrega->tieneReporteDeCarga()) {
    $reporte = $entrega->reporteCarga;
}
```

---

### 🚦 Transiciones de Estado

```php
$entrega = Entrega::find(1);  // Estado actual: PROGRAMADO

// VER TRANSICIONES VÁLIDAS
$validos = $entrega->obtenerEstadosSiguientes();
// Retorna: ['ASIGNADA', 'PREPARACION_CARGA', 'CANCELADA']

// VALIDAR UNA TRANSICIÓN
if ($entrega->esTransicionValida('EN_CARGA')) {
    echo "Puedo pasar a EN_CARGA";
} else {
    echo "NO puedo pasar a EN_CARGA desde {$entrega->estado}";
}

// CAMBIAR ESTADO
try {
    $entrega->cambiarEstado(
        'PREPARACION_CARGA',
        'Iniciando flujo de carga',
        auth()->user()  // opcional
    );
    echo "Estado actualizado ✅";
} catch (\InvalidArgumentException $e) {
    echo "Error: " . $e->getMessage();
}
```

---

### 🔍 Estados Disponibles

**Flujo Nuevo (Carga)**:
```
PROGRAMADO → PREPARACION_CARGA → EN_CARGA → LISTO_PARA_ENTREGA → EN_TRANSITO → ENTREGADO
```

**Flujo Legacy**:
```
PROGRAMADO → ASIGNADA → EN_CAMINO → LLEGO → ENTREGADO
```

**Excepcionales**:
```
Cualquier estado → CANCELADA  (terminal)
Cualquier estado → NOVEDAD    (requiere resolución)
LLEGO/EN_TRANSITO → RECHAZADO → CANCELADA
```

---

### 📊 Crear Entregas

#### Opción 1: Desde Venta (Nuevo Flujo)
```php
use App\Http\Requests\CrearEntregaRequest;

public function store(CrearEntregaRequest $request)
{
    // Request valida automáticamente:
    // - Al menos proforma_id o venta_id
    // - Relaciones existen

    $entrega = Entrega::create($request->validated());
    return response()->json($entrega, 201);
}
```

#### Opción 2: Directa (Menos segura)
```php
// ✅ Válido (tiene venta_id)
$entrega = Entrega::create([
    'venta_id' => 5,
    'estado' => 'PROGRAMADO',
]);

// ❌ Inválido (sin fuente)
$entrega = Entrega::create([
    'estado' => 'PROGRAMADO',
]);
// Error: Entrega debe tener al menos proforma_id o venta_id
```

---

## 🔗 Flujo Completo de Ejemplo

### Crear entrega desde venta
```php
// 1. Crear
$entrega = Entrega::create([
    'venta_id' => 5,
    'estado' => 'PROGRAMADO',
    'fecha_programada' => '2025-12-25 08:00:00',
]);

// 2. Verificar transiciones disponibles
$proximos = $entrega->obtenerEstadosSiguientes();
// ['ASIGNADA', 'PREPARACION_CARGA', 'CANCELADA']

// 3. Pasar a PREPARACION_CARGA
$entrega->cambiarEstado('PREPARACION_CARGA', 'Listo para preparar');

// 4. Generar reporte de carga
$reporte = $entrega->reporteCarga()->create([
    'numero_reporte' => 'RC-001',
    'peso_total_kg' => 150,
    'generado_por' => auth()->id(),
]);

// 5. Pasar a EN_CARGA
$entrega->cambiarEstado('EN_CARGA', 'Iniciando carga física');

// 6. Confirmar carga
$entrega->update(['confirmado_carga_por' => auth()->id()]);
$entrega->cambiarEstado('LISTO_PARA_ENTREGA', 'Carga completada');

// 7. Salida
$entrega->cambiarEstado('EN_TRANSITO');

// 8. Entregada
$entrega->cambiarEstado('ENTREGADO');

// 9. Ver historial
$entrega->historialEstados()->get();
// [
//   { estado_anterior: null, estado_nuevo: 'PROGRAMADO', ... },
//   { estado_anterior: 'PROGRAMADO', estado_nuevo: 'PREPARACION_CARGA', ... },
//   ...
// ]
```

---

## 🛠️ En Controladores

### EntregaController@store
```php
public function store(Request $request)
{
    // Validación personalizada
    $validated = $request->validate([
        'venta_id' => 'required|exists:ventas,id',
        // ... otros campos
    ]);

    // Crear (boot valida que sea venta o proforma)
    $entrega = Entrega::create([
        ...$validated,
        'estado' => 'PROGRAMADO',
    ]);

    return response()->json(['data' => $entrega], 201);
}
```

### EntregaController@cambiarEstado
```php
public function cambiarEstado(Request $request, Entrega $entrega)
{
    $validated = $request->validate([
        'estado' => 'required|string',
        'comentario' => 'nullable|string',
    ]);

    try {
        $entrega->cambiarEstado(
            $validated['estado'],
            $validated['comentario'],
            auth()->user()
        );

        return response()->json(['success' => true]);
    } catch (\InvalidArgumentException $e) {
        return response()->json([
            'success' => false,
            'message' => $e->getMessage(),
            'estados_validos' => $entrega->obtenerEstadosSiguientes(),
        ], 422);
    }
}
```

---

## 📱 En Frontend (React)

### Mostrar transiciones válidas
```tsx
const EstadoSelector = ({ entrega }) => {
    const [estados, setEstados] = useState([]);

    useEffect(() => {
        // Obtener estados válidos desde el backend
        fetch(`/api/entregas/${entrega.id}/estados-siguientes`)
            .then(r => r.json())
            .then(d => setEstados(d.data));
    }, [entrega.id]);

    return (
        <select onChange={(e) => cambiarEstado(e.target.value)}>
            <option>Seleccionar estado...</option>
            {estados.map(e => (
                <option key={e} value={e}>{e}</option>
            ))}
        </select>
    );
};
```

### Endpoint para obtener estados
```php
// En api.php
Route::get('/entregas/{entrega}/estados-siguientes', function (Entrega $entrega) {
    return response()->json([
        'data' => $entrega->obtenerEstadosSiguientes(),
    ]);
});
```

---

## ✅ Checklist: Antes de Usar

- [ ] Migración ejecutada: `php artisan migrate`
- [ ] Modelo Entrega actualizado
- [ ] CrearEntregaRequest creada
- [ ] Tests escritos (recomendado)
- [ ] Documentación leída

---

## 🚨 Errores Comunes

### ❌ Error 1: "Entrega debe tener proforma_id o venta_id"
```php
// MAL
$entrega = Entrega::create(['estado' => 'PROGRAMADO']);

// BIEN
$entrega = Entrega::create([
    'venta_id' => 5,  // o 'proforma_id' => 3
    'estado' => 'PROGRAMADO',
]);
```

### ❌ Error 2: "No se puede transicionar..."
```php
// MAL
$entrega->cambiarEstado('ENTREGADO');  // de PROGRAMADO

// BIEN
$proximos = $entrega->obtenerEstadosSiguientes();
$entrega->cambiarEstado($proximos[0]);
```

### ❌ Error 3: Proforma_id nullable error
```bash
# Solución
php artisan migrate
```

---

## 📞 Referencia Rápida

| Acción | Código |
|--------|--------|
| Obtener fuente | `$entrega->obtenerFuente()` |
| Ver próximos estados | `$entrega->obtenerEstadosSiguientes()` |
| Validar transición | `$entrega->esTransicionValida('NEW')` |
| Cambiar estado | `$entrega->cambiarEstado('NEW', 'msg')` |
| Ver historial | `$entrega->historialEstados()->get()` |
| En flujo carga | `$entrega->estaEnFlujoDeCargas()` |
| En flujo legacy | `$entrega->estaEnFlujoLegacy()` |
| Tiene reporte | `$entrega->tieneReporteDeCarga()` |

---

**¿Preguntas?** Revisar `DOCUMENTACION_COHERENCIA_TABLAS.md` para detalle completo.
