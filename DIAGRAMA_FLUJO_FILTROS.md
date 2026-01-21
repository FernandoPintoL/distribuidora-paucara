# 📊 Diagrama de Flujo - Filtros Mejorados

## 🏗️ Arquitectura General

```
┌──────────────────────────────────────────────────────────────────┐
│                      ENTREGAS INDEX PAGE                         │
│   resources/js/.../entregas/index.tsx                            │
└──────────────────────────────────────────────────────────────────┘
                                ↓
┌──────────────────────────────────────────────────────────────────┐
│                    ENTREGAS TABLE VIEW                           │
│   resources/js/.../entregas/components/EntregasTableView.tsx     │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │ Gestiona:                                               │   │
│  │ • Estado de filtros                                     │   │
│  │ • URL persistence (useQueryParam)                       │   │
│  │ • Debounce de búsqueda                                  │   │
│  │ • Lógica de filtrado                                    │   │
│  │ • Selección de entregas                                 │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
        ↓                                              ↓
┌───────────────────────────┐         ┌──────────────────────────┐
│   ENTREGAS FILTERS        │         │  ENTREGAS TABLE          │
│   (Componente UI)         │         │  (Tabla + Paginación)    │
│                           │         │                          │
│ • Dropdowns               │         │ • Filas de entregas      │
│ • Date pickers            │         │ • Checkboxes             │
│ • Search input            │         │ • Batch actions          │
│ • Tags visuales           │         │ • Modal optimización     │
│ • Reset button            │         │                          │
│                           │         │ Entrada:                 │
│ Entrada:                  │         │ entregasFiltradas (useMemo)
│ filtros (estado)          │         │                          │
│ onFilterChange            │         │                          │
│ onReset                   │         │                          │
└───────────────────────────┘         └──────────────────────────┘
```

---

## 🔄 Flujo de Datos - Paso a Paso

### 1️⃣ User Escribe en Búsqueda

```
User Type: "cliente"
         ↓
onChange → onFilterChange('busqueda', 'cliente')
         ↓
setFiltros({ ..., busqueda: 'cliente' })  [State actualizado]
setBusquedaURL('cliente')                 [URL actualizada]
         ↓
useDebouncedValue(busqueda, 300ms)
         ↓
⏳ Espera 300ms sin cambios
         ↓
busquedaDebounced = 'cliente'
         ↓
useMemo(entregasFiltradas) ← Usa busquedaDebounced
         ↓
Filter cada entrega:
  .includes('cliente'.toLowerCase())
         ↓
Tabla re-renderiza ← SOLO AQUÍ (evita renders intermedios)
         ↓
✅ Usuario ve cambios
```

### 2️⃣ User Selecciona Chofer

```
User Click: "Chofer ▼" → "Juan"
         ↓
onChange → onFilterChange('chofer_id', '5')
         ↓
setFiltros({ ..., chofer_id: '5' })      [State]
setChoferURL('5')                         [URL]
         ↓
useMemo(entregasFiltradas) ← Detecta cambio
         ↓
Filter: entrega.chofer_id === '5'
         ↓
Tabla re-renderiza
         ↓
URL actualizada: ?chofer_id=5
         ↓
✅ Tabla filtra + URL persiste
```

### 3️⃣ User Clica "Limpiar Todo"

```
User Click: "Limpiar todo"
         ↓
handleResetFiltros()
         ↓
setFiltros({                             [State limpio]
    estado: 'TODOS',
    busqueda: '',
    chofer_id: '',
    vehiculo_id: '',
    fecha_desde: '',
    fecha_hasta: '',
})
         ↓
setEstadoURL('TODOS')                    [URL limpias]
setBusquedaURL('')
setChoferURL('')
setVehiculoURL('')
setFechaDesdeURL('')
setFechaHastaURL('')
         ↓
useMemo(entregasFiltradas) ← Re-calcula
         ↓
Retorna ALL entregas (sin filtro)
         ↓
Tabla re-renderiza
         ↓
URL: /logistica/entregas?view=simple
         ↓
✅ Todo limpio
```

### 4️⃣ User Recarga Página (F5)

```
User presiona F5
         ↓
React remonta componentes
         ↓
useQueryParam('estado', 'TODOS')
  ↓ Lee URL actual
  ↓ Extrae: estado=EN_TRANSITO
  ↓ Retorna: 'EN_TRANSITO'
         ↓
setEstadoURL('EN_TRANSITO')
         ↓
useState(filtros) inicializa con valores URL
         ↓
render con filtros correctos
         ↓
✅ Filtros persisten después de reload
```

---

## 📐 Data Flow Diagram

```
URL PARAMS (Window Location)
  ?estado=EN_TRANSITO&chofer_id=5&q=cliente
         ↓
         │
         ├→ useQueryParam('estado') → 'EN_TRANSITO'
         ├→ useQueryParam('chofer_id') → '5'
         ├→ useQueryParam('q') → 'cliente'
         │
         ↓
       State
    (filtros: {
      estado: 'EN_TRANSITO',
      chofer_id: '5',
      busqueda: 'cliente',
      ...
    })
         ↓
    Derived State
    (via useMemo + useDebouncedValue)
      busquedaDebounced = 'cliente' [después 300ms]
         ↓
    Computed Filtrado
    (useMemo(entregasFiltradas))
      Filter entregas por:
      - estado === 'EN_TRANSITO'
      - chofer_id === '5'
      - .includes('cliente')
         ↓
    Render (Table)
      {entregasFiltradas.map(e => <row>)}
```

---

## 🧩 Componentes y Sus Responsabilidades

### EntregasTableView.tsx (Orquestador Principal)
```typescript
export function EntregasTableView() {
    // 1. URL PERSISTENCE - Lee/escribe en URL
    const [estadoURL, setEstadoURL] = useQueryParam('estado', 'TODOS');
    const [busquedaURL, setBusquedaURL] = useQueryParam('q', '');
    const [choferURL, setChoferURL] = useQueryParam('chofer_id', '');
    const [vehiculoURL, setVehiculoURL] = useQueryParam('vehiculo_id', '');
    const [fechaDesdeURL, setFechaDesdeURL] = useQueryParam('fecha_desde', '');
    const [fechaHastaURL, setFechaHastaURL] = useQueryParam('fecha_hasta', '');

    // 2. STATE - Mantiene estado actual de filtros
    const [filtros, setFiltros] = useState<FiltrosEntregas>({
        estado: estadoURL,
        busqueda: busquedaURL,
        chofer_id: choferURL,
        vehiculo_id: vehiculoURL,
        fecha_desde: fechaDesdeURL,
        fecha_hasta: fechaHastaURL,
    });

    // 3. DEBOUNCE - Búsqueda inteligente (300ms)
    const busquedaDebounced = useDebouncedValue(filtros.busqueda, 300);

    // 4. COMPUTED - Filtra entregas
    const entregasFiltradas = useMemo(() => {
        return entregas.data.filter(e => {
            // Lógica de filtrado
        });
    }, [entregas.data, filtros, busquedaDebounced]);

    // 5. HANDLERS - Actualiza estado + URL
    const handleFilterChange = (key, value) => {
        setFiltros(prev => ({ ...prev, [key]: value }));
        // Actualizar URL correspondiente
    };

    const handleResetFiltros = () => {
        // Limpiar todo estado + URL
    };

    // 6. RENDER
    return (
        <>
            <EntregasFilters
                filtros={filtros}
                onFilterChange={handleFilterChange}
                onReset={handleResetFiltros}
                ...
            />
            <Table>
                {entregasFiltradas.map(...)}
            </Table>
        </>
    );
}
```

### EntregasFilters.tsx (UI Pura)
```typescript
export function EntregasFilters({
    filtros,                  // Recibe estado actual
    onFilterChange,          // Callback: (key, value) => void
    onReset,                 // Callback: () => void
    estadosAPI,              // Datos dinámicos
    vehiculos,
    choferes,
    isLoading,
}) {
    // Cálculo de filtros activos (visual)
    const filtrosActivos = useMemo(() => {
        return [
            filtros.estado !== 'TODOS' && { ... },
            filtros.busqueda && { ... },
            ...
        ].filter(Boolean);
    }, [filtros, choferes, vehiculos]);

    return (
        <div>
            {/* Header */}
            <div>
                Filtros ({filtrosActivos.length} activos)
                <Button onClick={onReset}>Limpiar todo</Button>
            </div>

            {/* Grid de filtros */}
            <div>
                <Select
                    value={filtros.estado}
                    onChange={(v) => onFilterChange('estado', v)}
                />
                <Select
                    value={filtros.chofer_id}
                    onChange={(v) => onFilterChange('chofer_id', v)}
                />
                {/* ... más filtros ... */}
            </div>

            {/* Tags de filtros activos */}
            <div>
                {filtrosActivos.map(f => (
                    <Badge onClick={() => onFilterChange(key, '')}>
                        {f.label}: {f.value}
                    </Badge>
                ))}
            </div>
        </div>
    );
}
```

---

## ⏱️ Timeline - Qué Pasa Cuándo

```
T=0ms         User escribe "c" en búsqueda
T=1ms         - setFiltros({ busqueda: 'c' })
T=1ms         - setBusquedaURL('c')
T=1ms         - (NO se filtra aún)

T=100ms       User escribe más: "cliente"
T=101ms       - setFiltros({ busqueda: 'cliente' })
T=101ms       - setBusquedaURL('cliente')
T=101ms       - (Esperando debounce)

T=400ms       User para de escribir (después de 300ms de debounce)
T=401ms       - useDebouncedValue actualiza busquedaDebounced
T=401ms       - useMemo(entregasFiltradas) se ejecuta
T=401ms       - Filter aplicado: .includes('cliente')
T=401ms       - Tabla re-renderiza

RESULTADO:
- Solo 1 filtrado (no 5+)
- Performance fluida
- URL persiste
```

---

## 🔗 Conexiones Clave

### URL ↔ State Sync
```
User Input (Búsqueda)
    ↓
onFilterChange() {
    setFiltros(...)     ← Local state
    setBusquedaURL(...) ← URL param
}
    ↓
Hook useQueryParam() mantiene sincronía
    ↓
Al recargar: URL lee y reconstruye state
```

### Debounce ↔ Filtrado
```
filtros.busqueda (state crudo)
    ↓
useDebouncedValue(busqueda, 300)
    ↓
busquedaDebounced (solo después de 300ms)
    ↓
useMemo(entregasFiltradas, [...busquedaDebounced])
    ↓
Filtra SOLO cuando busquedaDebounced cambia
```

### Multiple Filters ↔ AND Logic
```
Estado = 'EN_TRANSITO'   ←┐
Chofer = '5'             ├→ AND
Búsqueda = 'cliente'     ←┘

En código:
const cumpleEstado = ...
const cumpleChofer = ...
const cumpleBusqueda = ...

return cumpleEstado AND cumpleChofer AND cumpleBusqueda
```

---

## 🧪 Testing Walkthrough

### Test: Cambiar Filtro y Verificar URL

```
Inicio:
  State:    { estado: 'TODOS', busqueda: '', ... }
  URL:      /logistica/entregas?view=simple
  Tabla:    Muestra todas las entregas

Paso 1: Click "EN_TRANSITO"
  ↓
  State:    { estado: 'EN_TRANSITO', ... }
  URL:      /logistica/entregas?view=simple&estado=EN_TRANSITO
  Tabla:    Muestra solo EN_TRANSITO ✅

Paso 2: Escribir "cliente" en búsqueda
  ↓ (esperar 300ms)
  ↓
  State:    { estado: 'EN_TRANSITO', busqueda: 'cliente', ... }
  URL:      ...&estado=EN_TRANSITO&q=cliente
  Tabla:    Muestra EN_TRANSITO + cliente ✅

Paso 3: Click "Limpiar todo"
  ↓
  State:    { estado: 'TODOS', busqueda: '', ... }
  URL:      /logistica/entregas?view=simple
  Tabla:    Muestra todas nuevamente ✅

Paso 4: F5 (Recargar)
  ↓
  URL param: view=simple (sin filtros)
  ↓
  useQueryParam retorna defaults
  ↓
  State inicializa con defaults
  ↓
  Tabla: Muestra todas ✅
```

---

## 📝 Conclusión

### Flujo Resumen
```
USER INPUT (escribir, seleccionar, click)
    ↓
HANDLER (onFilterChange, onReset)
    ↓
STATE UPDATE (setFiltros)
    ↓
URL UPDATE (setXURL)
    ↓
DEBOUNCE (useDebouncedValue) - opcional, para búsqueda
    ↓
COMPUTED (useMemo) - filtra entregas
    ↓
RENDER (tabla re-renderiza con resultados)
    ↓
USER VE CAMBIOS
```

### Ventajas de Esta Arquitectura
- ✅ Separación clara (UI ↔ Lógica)
- ✅ URL persistence automática
- ✅ Performance optimizado (debounce)
- ✅ Fácil de probar y mantener
- ✅ Escalable (agregar nuevos filtros es simple)

---

**Para más detalles, ver:**
- `EntregasTableView.tsx` - Implementación
- `EntregasFilters.tsx` - Componente UI
- `MEJORAS_FILTRADO_ENTREGAS.md` - Documentación completa
