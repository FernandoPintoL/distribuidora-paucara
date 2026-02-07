# 📍 Obtener Localidades de una Entrega

## Resumen
Funcionalidad para obtener todas las localidades de los clientes en las ventas asociadas a una entrega.

**Relación:**
```
Entrega → Ventas (N:1) → Cliente → Localidad
```

---

## 🔌 API REST (Recomendado)

### Endpoint
```
GET /api/entregas/{entrega}/localidades
```

### Ejemplo de Solicitud
```bash
curl -X GET "http://localhost:8000/api/entregas/42/localidades" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Respuesta (200 OK)
```json
{
  "success": true,
  "data": {
    "localidades": [
      {
        "id": 1,
        "nombre": "La Paz",
        "codigo": "LP"
      },
      {
        "id": 2,
        "nombre": "Santa Cruz",
        "codigo": "SC"
      }
    ],
    "localidades_resumen": [
      {
        "localidad_id": 1,
        "localidad_nombre": "La Paz",
        "cantidad_ventas": 3,
        "clientes": ["Cliente A", "Cliente B", "Cliente C"]
      },
      {
        "localidad_id": 2,
        "localidad_nombre": "Santa Cruz",
        "cantidad_ventas": 1,
        "clientes": ["Cliente D"]
      }
    ],
    "cantidad_localidades": 2,
    "tiene_multiples_localidades": true,
    "entrega_id": 42,
    "numero_entrega": "ENT-20260207-001"
  }
}
```

---

## 💻 Métodos del Modelo Entrega

### 1️⃣ `getLocalidades()` - Obtener Localidades Únicas

**Descripción:** Retorna una colección de objetos Localidad únicos.

**Sintaxis:**
```php
$entrega = Entrega::find(42);
$localidades = $entrega->getLocalidades();
```

**Retorna:**
```php
Collection[
  Localidad{id: 1, nombre: 'La Paz', codigo: 'LP'},
  Localidad{id: 2, nombre: 'Santa Cruz', codigo: 'SC'}
]
```

**Uso en Controller:**
```php
public function mostrarLocalidades(Entrega $entrega)
{
    $localidades = $entrega->getLocalidades();

    return view('entregas.localidades', [
        'localidades' => $localidades,
        'entrega' => $entrega
    ]);
}
```

**Uso en Blade:**
```blade
<ul>
  @foreach($entrega->getLocalidades() as $localidad)
    <li>{{ $localidad->nombre }} ({{ $localidad->codigo }})</li>
  @endforeach
</ul>
```

---

### 2️⃣ `getLocalidadesResumen()` - Obtener Resumen por Localidad

**Descripción:** Retorna un array con información resumida agrupada por localidad.

**Sintaxis:**
```php
$entrega = Entrega::find(42);
$resumen = $entrega->getLocalidadesResumen();
```

**Retorna:**
```php
Array [
  [
    'localidad_id' => 1,
    'localidad_nombre' => 'La Paz',
    'cantidad_ventas' => 3,
    'clientes' => ['Cliente A', 'Cliente B', 'Cliente C']
  ],
  [
    'localidad_id' => 2,
    'localidad_nombre' => 'Santa Cruz',
    'cantidad_ventas' => 1,
    'clientes' => ['Cliente D']
  ]
]
```

**Uso en Controller:**
```php
public function resumenEntrega(Entrega $entrega)
{
    $resumen = $entrega->getLocalidadesResumen();

    return response()->json([
        'entrega' => $entrega->numero_entrega,
        'resumen_localidades' => $resumen
    ]);
}
```

**Uso en Blade:**
```blade
<table>
  <thead>
    <tr>
      <th>Localidad</th>
      <th>Ventas</th>
      <th>Clientes</th>
    </tr>
  </thead>
  <tbody>
    @foreach($entrega->getLocalidadesResumen() as $loc)
      <tr>
        <td>{{ $loc['localidad_nombre'] }}</td>
        <td>{{ $loc['cantidad_ventas'] }}</td>
        <td>{{ implode(', ', $loc['clientes']) }}</td>
      </tr>
    @endforeach
  </tbody>
</table>
```

---

### 3️⃣ `tieneMultiplesLocalidades()` - Validación Booleana

**Descripción:** Retorna `true` si la entrega tiene clientes en 2 o más localidades.

**Sintaxis:**
```php
$entrega = Entrega::find(42);
$esMultiple = $entrega->tieneMultiplesLocalidades();
```

**Retorna:**
```php
bool // true o false
```

**Uso en Controller:**
```php
public function procesarEntrega(Entrega $entrega)
{
    if ($entrega->tieneMultiplesLocalidades()) {
        // Aplicar lógica especial para entregas consolidadas
        Log::info("Entrega consolidada de múltiples localidades");
    } else {
        // Entrega simple de una localidad
        Log::info("Entrega de una sola localidad");
    }
}
```

**Uso en Blade:**
```blade
@if($entrega->tieneMultiplesLocalidades())
  <div class="alert alert-info">
    ⚠️ Esta entrega cubre múltiples localidades
  </div>
@else
  <div class="alert alert-success">
    ✅ Entrega de una sola localidad
  </div>
@endif
```

---

## 📋 Casos de Uso

### Caso 1: Mostrar Localidades en Pantalla de Detalles
```php
public function show(Entrega $entrega)
{
    $localidades = $entrega->getLocalidades();

    return view('entregas.show', compact('entrega', 'localidades'));
}
```

### Caso 2: Validar Entregas Consolidadas
```php
public function validarEntrega(Entrega $entrega)
{
    if ($entrega->tieneMultiplesLocalidades()) {
        return response()->json([
            'valido' => true,
            'tipo' => 'consolidada',
            'mensaje' => 'Entrega consolidada válida'
        ]);
    }

    return response()->json([
        'valido' => true,
        'tipo' => 'simple',
        'mensaje' => 'Entrega simple'
    ]);
}
```

### Caso 3: Reporte de Entregas por Localidad
```php
public function reporteLocalidades()
{
    $entregas = Entrega::all();

    $datosReporte = $entregas->map(function ($entrega) {
        return [
            'numero_entrega' => $entrega->numero_entrega,
            'localidades' => $entrega->getLocalidades()->pluck('nombre'),
            'es_consolidada' => $entrega->tieneMultiplesLocalidades()
        ];
    });

    return response()->json($datosReporte);
}
```

### Caso 4: Frontend React - Llamada a API
```typescript
// Obtener localidades de una entrega
async function obtenerLocalidadesEntrega(entregaId: number) {
  try {
    const response = await fetch(`/api/entregas/${entregaId}/localidades`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (data.success) {
      console.log('Localidades:', data.data.localidades);
      console.log('Resumen:', data.data.localidades_resumen);
      console.log('¿Múltiples localidades?', data.data.tiene_multiples_localidades);

      // Mostrar en UI
      displayLocalidades(data.data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

function displayLocalidades(data: any) {
  const { localidades, localidades_resumen, cantidad_localidades } = data;

  console.log(`Entrega con ${cantidad_localidades} localidad(es):`);

  localidades_resumen.forEach((loc: any) => {
    console.log(`- ${loc.localidad_nombre}: ${loc.cantidad_ventas} ventas`);
    console.log(`  Clientes: ${loc.clientes.join(', ')}`);
  });
}
```

---

## 🔐 Permisos Requeridos

- **Ruta API:** `permission:entregas.show`
- **Métodos del Modelo:** Sin restricciones (úsalos en cualquier parte)

---

## 📊 Información Retornada

### Localidades (Array)
Contiene los datos básicos de cada localidad:
- `id`: ID de la localidad
- `nombre`: Nombre de la localidad (ej: "La Paz")
- `codigo`: Código de la localidad (ej: "LP")

### Localidades Resumen (Array)
Contiene información agrupada:
- `localidad_id`: ID de la localidad
- `localidad_nombre`: Nombre de la localidad
- `cantidad_ventas`: Número de ventas en esa localidad
- `clientes`: Array de nombres de clientes en esa localidad

### Metadatos
- `cantidad_localidades`: Número total de localidades únicas
- `tiene_multiples_localidades`: Boolean indicando si hay múltiples localidades
- `entrega_id`: ID de la entrega
- `numero_entrega`: Número legible de la entrega

---

## ⚡ Rendimiento

✅ **Optimizado:**
- Carga las relaciones necesarias una sola vez
- Usa `filter()` y `unique()` para datos en memoria
- Sin N+1 queries

**Complejidad:**
- O(n) donde n = número de ventas en la entrega

---

## 🔗 Archivos Modificados

1. **Modelo:** `/app/Models/Entrega.php`
   - Método: `getLocalidades()`
   - Método: `getLocalidadesResumen()`
   - Método: `tieneMultiplesLocalidades()`

2. **Controller:** `/app/Http/Controllers/Api/EntregaController.php`
   - Método: `obtenerLocalidades(Entrega $entrega)`

3. **Rutas:** `/routes/api.php`
   - Ruta: `GET /api/entregas/{entrega}/localidades`

---

## 📝 Ejemplo Completo

```php
// En un Controller
public function detallesEntrega(Entrega $entrega)
{
    // Opción 1: Usar los métodos del modelo
    $localidades = $entrega->getLocalidades();
    $resumen = $entrega->getLocalidadesResumen();
    $consolidada = $entrega->tieneMultiplesLocalidades();

    return response()->json([
        'entrega' => [
            'id' => $entrega->id,
            'numero' => $entrega->numero_entrega,
            'estado' => $entrega->estado,
        ],
        'localidades' => $localidades,
        'resumen_localidades' => $resumen,
        'es_consolidada' => $consolidada,
        'cantidad_localidades' => count($localidades)
    ]);
}
```

---

## ✅ Checklist de Implementación

- ✅ Métodos agregados al modelo Entrega
- ✅ Método API en EntregaController
- ✅ Ruta GET agregada en routes/api.php
- ✅ Documentación completa
- ✅ Ejemplos de uso
- ✅ Sin dependencies adicionales

**Listo para usar! 🚀**
