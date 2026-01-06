# Adaptación Inventario Inicial Avanzado para Mobile

## 📱 Cambios Recomendados para Mobile

He identificado los cambios necesarios para hacer la pantalla completamente responsiva. Aquí está el plan de adaptación:

### 1. **Importaciones (Línea 8)**
Agregar íconos de menú mobile:
```typescript
import { AlertCircle, Barcode, RefreshCw, CheckCircle2, Clock, Menu, X } from 'lucide-react';
```

### 2. **Estado para menú mobile (Línea 85)**
Agregar estado para controlar el menú en mobile:
```typescript
const [showMenuMovil, setShowMenuMovil] = useState(false);
```

### 3. **Encabezado Responsivo (Línea 464-471)**
```jsx
// ANTES:
<div className="max-w-7xl mx-auto py-6 px-4 space-y-6">
    <div>
        <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-gray-100">Inventario Inicial Avanzado</h1>
        <p className="text-gray-600 dark:text-gray-400">
            Sistema de carga inicial de inventario con guardado automático como borrador
        </p>
    </div>

// DESPUÉS:
<div className="w-full min-h-screen bg-gray-50 dark:bg-gray-900 py-3 md:py-6 px-0">
    <div className="max-w-7xl mx-auto space-y-3 md:space-y-6 px-3 md:px-4">
        <div className="space-y-1">
            <h1 className="text-xl md:text-3xl font-bold text-gray-900 dark:text-gray-100">
                Inventario Inicial
            </h1>
            <p className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
                Carga con guardado automático como borrador
            </p>
        </div>
```

### 4. **Input de búsqueda responsivo (Línea 480-487)**
```jsx
// ANTES:
<Input
    placeholder="Buscar producto por nombre, SKU o código de barras..."
    value={busqueda}
    onChange={(e) => handleBusquedaChange(e.target.value)}
    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
    className="flex-1"
    autoComplete="off"
/>

// DESPUÉS:
<Input
    placeholder="Buscar producto..."
    value={busqueda}
    onChange={(e) => handleBusquedaChange(e.target.value)}
    onBlur={() => setTimeout(() => setMostrarSugerencias(false), 200)}
    className="text-sm md:text-base py-2 px-3 md:px-4"
    autoComplete="off"
/>
```

### 5. **Botones Responsivos - Desktop (Línea 517-570)**
Reemplazar botones con versión responsive:

```jsx
{/* Botones responsivos - Desktop */}
<div className="hidden md:flex gap-2 flex-wrap">
    <Button
        size="sm"
        onClick={() => {
            setModoCargarTodos(true);
            cargarProductosPaginados(1, busqueda);
        }}
        disabled={guardando || cargandoProductos}
        className="gap-2"
    >
        <Barcode className="h-4 w-4" />
        {cargandoProductos ? 'Cargando...' : 'Cargar Todos'}
    </Button>
    <Button
        variant="outline"
        size="icon"
        onClick={() => cargarBorrador(borrador.id)}
        disabled={guardando}
        title="Refrescar"
        className="h-9 w-9"
    >
        <RefreshCw className="h-4 w-4" />
    </Button>
    <Button
        variant={scannerActivo ? "default" : "outline"}
        size="sm"
        onClick={() => setScannerActivo(!scannerActivo)}
        disabled={guardando}
        className="gap-2"
    >
        <Barcode className="h-4 w-4" />
        {scannerActivo ? 'Scanner' : 'Inactivo'}
    </Button>
    <Button
        variant="default"
        size="sm"
        onClick={guardarTodosBorrador}
        disabled={guardando || productosUnicos.length === 0}
        className="gap-2 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white ml-auto"
    >
        <CheckCircle2 className="h-4 w-4" />
        Guardar
    </Button>
</div>

{/* Botones responsivos - Mobile */}
<div className="md:hidden space-y-2">
    <div className="flex gap-2">
        <Button
            size="sm"
            onClick={() => {
                setModoCargarTodos(true);
                cargarProductosPaginados(1, busqueda);
            }}
            disabled={guardando || cargandoProductos}
            className="gap-1.5 flex-1 text-xs"
        >
            <Barcode className="h-3.5 w-3.5" />
            Cargar
        </Button>
        <Button
            variant="outline"
            size="icon"
            onClick={() => cargarBorrador(borrador.id)}
            disabled={guardando}
            className="h-9 w-9"
        >
            <RefreshCw className="h-4 w-4" />
        </Button>
        <Button
            variant={showMenuMovil ? "default" : "outline"}
            size="icon"
            onClick={() => setShowMenuMovil(!showMenuMovil)}
            className="h-9 w-9"
        >
            {showMenuMovil ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </Button>
    </div>
    {showMenuMovil && (
        <div className="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-2">
            <Button
                variant={scannerActivo ? "default" : "outline"}
                size="sm"
                onClick={() => setScannerActivo(!scannerActivo)}
                disabled={guardando}
                className="gap-2 w-full justify-start text-xs"
            >
                <Barcode className="h-4 w-4" />
                {scannerActivo ? 'Scanner Activo' : 'Scanner Inactivo'}
            </Button>
            <Button
                variant="default"
                size="sm"
                onClick={guardarTodosBorrador}
                disabled={guardando || productosUnicos.length === 0}
                className="gap-2 w-full justify-start bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white text-xs"
            >
                <CheckCircle2 className="h-4 w-4" />
                Guardar en Borrador
            </Button>
        </div>
    )}
</div>
```

### 6. **Paginación Responsiva (Línea 633-684)**
```jsx
{/* Paginación responsiva */}
{(totalPaginas > 1 || modoCargarTodos) && (
    <div className="flex flex-col md:flex-row items-center justify-between gap-3 md:gap-4 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <span className="text-xs md:text-sm text-gray-600 dark:text-gray-400">
            {modoCargarTodos ? (
                <>Backend: {paginaProductosBackend}/{totalPaginasBackend} ({totalProductosBackend})</>
            ) : (
                <>Página {paginaActual} de {totalPaginas}</>
            )}
        </span>
        <div className="flex gap-1 md:gap-2 w-full md:w-auto flex-wrap justify-center md:justify-end">
            {modoCargarTodos && totalPaginasBackend > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cargarProductosPaginados(paginaProductosBackend - 1, busqueda)}
                        disabled={paginaProductosBackend === 1 || cargandoProductos}
                        className="text-xs"
                    >
                        ← Ant
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => cargarProductosPaginados(paginaProductosBackend + 1, busqueda)}
                        disabled={paginaProductosBackend === totalPaginasBackend || cargandoProductos}
                        className="text-xs"
                    >
                        Sig →
                    </Button>
                </>
            )}
            {totalPaginas > 1 && (
                <>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                        disabled={paginaActual === 1}
                        className="text-xs"
                    >
                        ← Ant
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                        disabled={paginaActual === totalPaginas}
                        className="text-xs"
                    >
                        Sig →
                    </Button>
                </>
            )}
        </div>
    </div>
)}
```

### 7. **Botones de Acción Responsivos (Línea 691-705)**
```jsx
{/* Botones de acción - Adaptados para mobile */}
<div className="flex flex-col-reverse md:flex-row justify-end gap-2 md:gap-3 pb-4">
    <Button
        variant="outline"
        onClick={() => router.visit(getRoute('inicial.index'))}
        className="w-full md:w-auto text-sm"
    >
        Cancelar
    </Button>
    <Button
        onClick={finalizarInventario}
        disabled={guardando || productosUnicos.length === 0}
        className="w-full md:w-auto text-sm"
    >
        Finalizar y Guardar
    </Button>
</div>
```

## 📏 Breakpoints Tailwind Utilizados

- `md:` (768px) - Punto de quiebre principal entre mobile y desktop
- Clases responsivas aplicadas a todos los elementos visibles

## ✨ Mejoras Clave para Mobile

1. **Reducción de padding/margen** en pantallas pequeñas
2. **Menú colapsable** para botones secundarios en mobile
3. **Tamaños de fuente reducidos** en mobile (text-xs, text-sm)
4. **Layout de una columna** en mobile, dos columnas en desktop
5. **Botones más grandes** para mejor usabilidad en touch (h-9 w-9)
6. **Texto de botones acortado** en mobile ("Cargar" vs "Cargar Todos")
7. **Paginación simplificada** con botones más pequeños ("Ant" vs "Anterior")
8. **Inputs con mejor padding** para pantallas táctiles

## 🎯 Siguientes Pasos

1. Aplicar los cambios anteriores al archivo `inventario-inicial-avanzado.tsx`
2. Revisar el componente `ProductoRowExpandible` y asegurar que también sea responsive
3. Probar en dispositivos móviles reales o usando DevTools
4. Ajustar espaciado y tamaños según sea necesario

## 📝 Notas

- Mantener consistencia con otros componentes del proyecto
- Usar las clases Tailwind CSS existentes
- Conservar toda la funcionalidad (sin cambios lógicos)
- Asegurar que la accesibilidad se mantenga
