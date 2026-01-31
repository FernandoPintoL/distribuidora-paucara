# Fase 2: Integración en ProductosTable

## Plan de Implementación

### 1. CAMBIOS EN ProductosTable.tsx

#### 1.1 Importes nuevos
```typescript
import { ModalComprasDiferenciaCostoComponent } from '@/presentation/components/precios/modal-compras-diferencia-costo';
import { tienePreferenciaDiferencia } from '@/domain/types/cascada-precios.types';
import { actualizarCascadaPreciosAPI } from '@/infrastructure/api/precios.api'; // Nuevo
```

#### 1.2 Estado nuevo (después de línea 107)
```typescript
// Estado para modal de cascada de precios
const [modalCascadaState, setModalCascadaState] = useState<{
    isOpen: boolean;
    productoId: number | null;
    precioActual: number | null;
    precioCostoNuevo: number | null;
    detalleIndex: number | null;
    productoData: any;
}>({
    isOpen: false,
    productoId: null,
    precioActual: null,
    precioCostoNuevo: null,
    detalleIndex: null,
    productoData: null
});

const [loadingCascada, setLoadingCascada] = useState(false);
```

#### 1.3 Handler nuevo (después de handleAddProduct)
```typescript
// Handler para abrir modal de cascada de precios
const handleAbrirModalCascada = useCallback(async (index: number, detalle: DetalleProducto) => {
    const precioCosto = detalle.precio_costo || detalle.producto?.precio_costo || 0;

    try {
        setLoadingCascada(true);

        // Validar que el producto tenga precios
        if (!detalle.producto || !detalle.producto.precios || detalle.producto.precios.length === 0) {
            NotificationService.error('El producto no tiene precios configurados');
            return;
        }

        // Abrir modal
        setModalCascadaState({
            isOpen: true,
            productoId: detalle.producto_id as number,
            precioActual: precioCosto,
            precioCostoNuevo: detalle.precio_unitario,
            detalleIndex: index,
            productoData: detalle.producto
        });
    } catch (error) {
        NotificationService.error('Error al abrir modal de cascada');
        console.error(error);
    } finally {
        setLoadingCascada(false);
    }
}, []);

// Handler para guardar precios desde modal
const handleGuardarPreciosModal = useCallback(async (
    preciosCambiados: Array<{
        precio_id: number;
        precio_nuevo: number;
        porcentaje_ganancia: number;
        motivo: string;
    }>
) => {
    try {
        return await actualizarCascadaPreciosAPI(
            modalCascadaState.productoId as number,
            preciosCambiados
        );
    } catch (error) {
        throw error; // El modal maneja el error
    }
}, [modalCascadaState.productoId]);

// Handler cuando se guardan precios exitosamente
const handlePreciosActualizados = useCallback(() => {
    setModalCascadaState(prev => ({ ...prev, isOpen: false }));
    NotificationService.success('Precios actualizados exitosamente');
    // Opcional: Refrescar datos si es necesario
}, []);

// Handler para cerrar modal
const handleCerrarModalCascada = useCallback(() => {
    setModalCascadaState(prev => ({ ...prev, isOpen: false }));
}, []);
```

#### 1.4 Cambios en el render (alrededor de línea 525-530)

**ANTES**: Solo resalta la fila con color

**DESPUÉS**: Además de resaltar, agrega IconButton

```typescript
// En la fila donde se evalúa tieneDiferencia, agregar columna adicional
// Después de la última celda de acciones:

{tipo === 'compra' && tieneDiferencia && (
    <td className="px-4 py-2 whitespace-nowrap">
        <button
            type="button"
            disabled={readOnly}
            onClick={() => handleAbrirModalCascada(index, detalle)}
            className="p-1.5 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar cascada de precios"
        >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
    </td>
)}
```

#### 1.5 Renderizar modal (antes del cierre del return)

Después del `{showScannerModal && ... }` y antes del cierre del `<div>`

```typescript
{/* Modal de cascada de precios */}
<ModalComprasDiferenciaCostoComponent
    isOpen={modalCascadaState.isOpen}
    onClose={handleCerrarModalCascada}
    producto={modalCascadaState.productoData}
    precioActual={modalCascadaState.precioActual}
    precioCostoNuevo={modalCascadaState.precioCostoNuevo}
    onActualizarPrecios={handleGuardarPreciosModal}
    onSuccess={handlePreciosActualizados}
/>
```

### 2. CREAR API SERVICE

**Archivo**: `/infrastructure/api/precios.api.ts`

Función para llamar al backend:
```typescript
export async function actualizarCascadaPreciosAPI(
    productoId: number,
    precios: Array<{
        precio_id: number;
        precio_nuevo: number;
        porcentaje_ganancia: number;
        motivo: string;
    }>
) {
    const response = await fetch('/api/precios/actualizar-cascada', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
        },
        body: JSON.stringify({
            producto_id: productoId,
            precios
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.mensaje || 'Error al actualizar precios');
    }

    return response.json();
}
```

### 3. CAMBIOS EN HEADER DE LA TABLA

Agregar nueva columna header para el icono (solo si hay compras con diferencia):

```typescript
{tipo === 'compra' && detalles.some(d => {
    const precioCosto = d.precio_costo || d.producto?.precio_costo || 0;
    return precioCosto > 0 && Math.abs(d.precio_unitario - precioCosto) > 0.01;
}) && (
    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
        Acción
    </th>
)}
```

---

## Cambios por Archivo

### ProductosTable.tsx
- [ ] Agregar importes (ModalComprasDiferenciaCostoComponent, etc)
- [ ] Agregar estado modalCascadaState y loadingCascada
- [ ] Agregar handlers (handleAbrirModalCascada, handleGuardarPreciosModal, etc)
- [ ] Agregar columna header si hay diferencias
- [ ] Agregar botón/icono en filas con diferencia
- [ ] Renderizar modal al final

### precios.api.ts (NUEVO)
- [ ] Crear archivo
- [ ] Implementar actualizarCascadaPreciosAPI()

### Modal (ya refactorizado)
- [x] Ya está listo desde Fase 1

---

## Flujo de Interacción

```
Usuario ingresa precio_compra en fila
    ↓
ProductosTable detecta:
  precio_compra ≠ precio_costo_actual
    ↓
Fila se resalta (naranja si ↑, verde si ↓)
    ↓
IconButton aparece en columna "Acción"
    ↓
Usuario hace clic en IconButton
    ↓
handleAbrirModalCascada() se ejecuta
  └─ Valida datos
  └─ Abre modal
    ↓
Modal carga precios del producto
  └─ Calcula cascada automáticamente
    ↓
Usuario ve:
  - Precios actuales en columna izquierda
  - Precios propuestos (editables) en columna derecha
  - Margen de ganancia en ambas columnas
    ↓
Usuario puede:
  - Editar precio propuesto
  - Editar % ganancia (recalcula precio)
  - Escribir motivo de actualización
    ↓
Usuario hace clic "Guardar Cambios"
    ↓
handleGuardarPreciosModal() se ejecuta
  └─ Valida cambios (> 0.01)
  └─ Llama API POST /api/precios/actualizar-cascada
  └─ Espera respuesta
    ↓
Si éxito:
  └─ NotificationService.success()
  └─ onSuccess() → handlePreciosActualizados()
  └─ Modal se cierra
  └─ ProductosTable se mantiene abierta (usuario continúa comprando)
    ↓
Si error:
  └─ NotificationService.error(mensaje específico)
  └─ Modal se mantiene abierto
  └─ Usuario puede reintentar o cancelar
```

---

## Testing Manual Recomendado

1. **Caso 1: Compra con precio mayor al costo**
   - Ingresar cantidad y precio > costo
   - Verificar fila resaltada en naranja
   - Verificar icono visible
   - Hacer clic → Modal abre
   - Verificar cascada calculada correctamente
   - Editar algún precio
   - Guardar → Verificar API llamada

2. **Caso 2: Compra con precio menor al costo**
   - Ingresar precio < costo
   - Verificar fila resaltada en verde
   - Verificar icono visible
   - Abrir modal → Mismo flujo

3. **Caso 3: Sin diferencia**
   - Ingresar precio = costo
   - Verificar fila sin color
   - Verificar icono NO visible

4. **Caso 4: Errores**
   - Producto sin precios → Mostrar error
   - API falla → Mostrar error en modal
   - Usuario cancela → Modal se cierra sin cambios

---

## API Backend Requerido

**Endpoint**: `POST /api/precios/actualizar-cascada`

**Request**:
```json
{
    "producto_id": 123,
    "precios": [
        {
            "precio_id": 456,
            "precio_nuevo": 100.50,
            "porcentaje_ganancia": 25.5,
            "motivo": "Cambio de costo en compra"
        },
        {
            "precio_id": 457,
            "precio_nuevo": 125.63,
            "porcentaje_ganancia": 25.0,
            "motivo": "Cambio de costo en compra"
        }
    ]
}
```

**Response (éxito)**:
```json
{
    "success": true,
    "mensaje": "2 precios actualizados exitosamente",
    "data": {
        "precios_actualizados": 2,
        "producto_id": 123
    }
}
```

**Response (error)**:
```json
{
    "success": false,
    "mensaje": "Precio no puede ser negativo",
    "errors": {
        "precios.0.precio_nuevo": ["Debe ser mayor a 0"]
    }
}
```

---

## Documentación Adicional

- Ver: `/domain/hooks/useCascadaPreciosCompra.example.tsx` para más detalles
- Ver: `VALIDACIONES_CASCADA_PRECIOS.md` para validaciones
- Ver: `FASE_1_IMPLEMENTACION.md` para arquitectura general
