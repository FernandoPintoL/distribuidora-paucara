# Fase 2: Cambios Realizados en ProductosTable

## Resumen

Se ha integrado el modal de cascada de precios en ProductosTable. Ahora cuando un usuario ingresa un precio de compra diferente al costo registrado, aparece un icono de alerta que abre el modal para actualizar la cascada de precios.

---

## Cambios en ProductosTable.tsx

### 1. Importes Agregados (línea 1-7)

```typescript
import { useCallback } from 'react'; // ✅ Agregado
import { ModalComprasDiferenciaCostoComponent } from '@/presentation/components/precios/modal-compras-diferencia-costo';
import { tienePreferenciaDiferencia } from '@/domain/types/cascada-precios.types';
import { actualizarCascadaPreciosAPI } from '@/infrastructure/api/precios.api';
```

### 2. Estados Agregados (después de línea 107)

```typescript
// ✅ NUEVO: Estado para modal de cascada de precios
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

**Qué almacena**:
- `isOpen`: Si el modal está abierto
- `productoId`: ID del producto
- `precioActual`: Precio costo registrado
- `precioCostoNuevo`: Precio ingresado en la compra
- `detalleIndex`: Índice de la fila en la tabla
- `productoData`: Objeto completo del producto con precios

### 3. Handlers Agregados (después de handleAddProduct)

#### handleAbrirModalCascada

```typescript
const handleAbrirModalCascada = useCallback(async (index: number, detalle: DetalleProducto) => {
    // Obtiene precio costo del detalle o del producto
    const precioCosto = detalle.precio_costo || detalle.producto?.precio_costo || 0;

    // Valida que el producto tenga precios
    if (!detalle.producto || !detalle.producto.precios || detalle.producto.precios.length === 0) {
        NotificationService.error('El producto no tiene precios configurados');
        return;
    }

    // Abre el modal con todos los datos necesarios
    setModalCascadaState({
        isOpen: true,
        productoId: detalle.producto_id as number,
        precioActual: precioCosto,
        precioCostoNuevo: detalle.precio_unitario,
        detalleIndex: index,
        productoData: detalle.producto
    });
}, []);
```

**Responsabilidad**: Validar y abrir el modal

#### handleGuardarPreciosModal

```typescript
const handleGuardarPreciosModal = useCallback(async (preciosCambiados: Array<{...}>) => {
    return await actualizarCascadaPreciosAPI(
        modalCascadaState.productoId as number,
        preciosCambiados
    );
}, [modalCascadaState.productoId]);
```

**Responsabilidad**: Enviar cambios de precios al API backend

#### handlePreciosActualizados

```typescript
const handlePreciosActualizados = useCallback(() => {
    setModalCascadaState(prev => ({ ...prev, isOpen: false }));
}, []);
```

**Responsabilidad**: Cerrar modal después de guardado exitoso

#### handleCerrarModalCascada

```typescript
const handleCerrarModalCascada = useCallback(() => {
    setModalCascadaState(prev => ({ ...prev, isOpen: false }));
}, []);
```

**Responsabilidad**: Cerrar modal cuando usuario hace clic en "Cerrar"

### 4. Cambios en Renderización (Columna de Acciones)

**ANTES** (línea 837-845):
```typescript
<td className="px-4 py-2 whitespace-nowrap text-xs font-medium">
    <button
        type="button"
        disabled={readOnly}
        onClick={() => handleRemoveDetail(index)}
        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        Eliminar
    </button>
</td>
```

**DESPUÉS**:
```typescript
<td className="px-4 py-2 whitespace-nowrap text-xs font-medium flex gap-2">
    {/* ✅ NUEVO: Botón para abrir modal si hay diferencia */}
    {tipo === 'compra' && tieneDiferencia && (
        <button
            type="button"
            disabled={readOnly || loadingCascada}
            onClick={() => handleAbrirModalCascada(index, detalle)}
            className="p-1 text-amber-600 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/20 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Actualizar cascada de precios"
        >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
                </svg>
            </button>
        )}
    <button
        type="button"
        disabled={readOnly}
        onClick={() => handleRemoveDetail(index)}
        className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed"
    >
        Eliminar
    </button>
</td>
```

**Cambios**:
- Ahora es `flex gap-2` para acomodar dos botones
- El icono de alerta aparece **solo** si:
  - `tipo === 'compra'` (es una compra)
  - `tieneDiferencia` (precio ≠ costo)
- El icono es amarillo (tema de "atención")
- Se deshabilita si `readOnly` o `loadingCascada`
- Al hacer clic → Abre el modal

### 5. Modal Renderizado (antes del cierre del componente)

```typescript
{/* ✅ NUEVO: Modal de cascada de precios */}
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

---

## Archivo Nuevo: precios.api.ts

**Ubicación**: `/infrastructure/api/precios.api.ts`

**Función principal**:
```typescript
export async function actualizarCascadaPreciosAPI(
    productoId: number,
    precios: Array<{...}>
)
```

**Responsabilidades**:
- Hacer POST a `/api/precios/actualizar-cascada`
- Incluir CSRF token si es necesario
- Parsear errores específicos
- Re-lanzar errores con mensajes claros

---

## Flujo de Interacción

```
ProductosTable
    ↓
Usuario ingresa precio_compra en campo
    ↓
OnChange → onUpdateDetail() actualiza estado
    ↓
Componente re-renderiza
    ↓
ProductosTable detecta diferencia:
  Math.abs(precio_compra - precio_costo) > 0.01
    ↓
Fila se resalta:
  - Naranja si precio_compra > precio_costo (aumento)
  - Verde si precio_compra < precio_costo (descuento)
    ↓
Icono de alerta aparece en columna "Acciones"
    ↓
Usuario hace clic en icono
    ↓
handleAbrirModalCascada() se ejecuta
  ├─ Valida producto tenga precios
  ├─ Setea estado modalCascadaState
  └─ Modal se abre (isOpen = true)
    ↓
Modal muestra:
  - Precios actuales (izquierda)
  - Precios propuestos (derecha, editables)
  - Campo de motivo
  - Botón "Guardar Cambios"
    ↓
Usuario puede:
  - Editar precios
  - Editar % ganancia
  - Ver cambio automático
  - Escribir motivo
    ↓
Usuario hace clic "Guardar Cambios"
    ↓
Modal valida:
  - Motivo no vacío
  - Cambios significativos (> 0.01)
  - Precios > 0
    ↓
Si validación falla → Modal muestra error
Si validación pasa → Modal llama handleGuardarPreciosModal()
    ↓
handleGuardarPreciosModal() llama API
  └─ actualizarCascadaPreciosAPI(productoId, precios)
    ↓
API enviía POST a backend con:
  {
    producto_id: 123,
    precios: [{precio_id, precio_nuevo, porcentaje_ganancia, motivo}, ...]
  }
    ↓
Espera respuesta
    ↓
Si éxito (HTTP 200, success: true):
  └─ Modal muestra NotificationService.success()
  └─ Llama handlePreciosActualizados()
  └─ Modal se cierra
  └─ ProductosTable se mantiene abierta
    ↓
Si error:
  └─ Modal muestra NotificationService.error(mensaje)
  └─ Modal se mantiene abierto
  └─ Usuario puede reintentar o cerrar
```

---

## Líneas de Código Modificadas

| Sección | Línea Original | Cambio |
|---------|---|---|
| Importes | 1-7 | Agregados 3 importes nuevos |
| Estados | ~107 | +2 nuevos estados |
| Handlers | ~323 | +4 nuevos handlers |
| Render (Acciones) | 837-845 | Ahora tiene 2 botones, condicional |
| Modal | ~920 | Nuevo componente renderizado |

**Total de líneas añadidas**: ~120

---

## Testing Manual

### Test 1: Abrir Modal
1. Crear compra
2. Buscar y agregar producto con precios
3. Ingresar cantidad
4. Ingresar precio > costo
5. ✅ Verificar: Fila naranja, icono aparece
6. Hacer clic icono → Modal abre
7. ✅ Verificar: Precios mostrados correctamente

### Test 2: Editar Precios
1. En modal, cambiar un precio
2. ✅ Verificar: % ganancia se recalcula automáticamente
3. Cambiar % ganancia
4. ✅ Verificar: Precio se recalcula automáticamente

### Test 3: Guardar Cambios
1. Editar precios en modal
2. Escribir motivo
3. Hacer clic "Guardar Cambios"
4. ✅ Verificar: Spinner aparece
5. ✅ Verificar: API se llama (ver en DevTools → Network)
6. ✅ Verificar: Mensaje de éxito
7. ✅ Verificar: Modal se cierra

### Test 4: Errores
1. Si API falla → Error en modal
2. Si motivo vacío → Warning "Motivo obligatorio"
3. Si cambios < 0.01 → Warning "Sin cambios significativos"

### Test 5: Sin Diferencia
1. Ingresar precio = costo
2. ✅ Verificar: Fila sin color
3. ✅ Verificar: Icono NO aparece

---

## Dependencias y Estructura

```
ProductosTable.tsx
├── Renderiza tabla
├── Detecta diferencia de costo (ya existía)
├── Agrega icono si hay diferencia ✅ NUEVO
├── Maneja abrir/cerrar modal ✅ NUEVO
└── Renderiza ModalComprasDiferenciaCostoComponent ✅ NUEVO

ModalComprasDiferenciaCostoComponent
├── Muestra precios
├── Permite edición
├── Valida cambios
├── Llama onActualizarPrecios() ← handleGuardarPreciosModal
    └─ actualizarCascadaPreciosAPI()
        └─ POST /api/precios/actualizar-cascada
```

---

## Próximos Pasos (Fase 3)

1. **Backend API** - Implementar endpoint `POST /api/precios/actualizar-cascada`
2. **Tests unitarios** - Testar modal y handlers
3. **Historial de cambios** - Auditoría de quién cambió qué
4. **Optimizaciones** - Lazy load de precios si es necesario

---

## Notas de Implementación

### ✅ Validaciones implementadas
- Producto tiene precios ✅
- Motivo no vacío ✅
- Cambios significativos ✅
- Precios positivos ✅
- Manejo de errores API ✅

### ⚠️ Consideraciones
- El modal carga datos que ya están en `detalle.producto`
  - No hay llamada API adicional (eficiente)
  - Los precios vienen del API original de búsqueda

### 🔒 Seguridad
- CSRF token incluido en POST
- Validaciones en frontend + requeridas en backend
- Motivo de cambio obligatorio (auditoría)

---

## Diferencias Visuales

### Compra sin diferencia
```
[Producto] [Cantidad] [Precio Compra] [Subtotal] [Eliminar]
```

### Compra con diferencia
```
[Producto] [Cantidad] [Precio Compra] [Subtotal] [⚠️ Eliminar]
                      ↑naranja o verde↑
```

Icono ⚠️:
- Color: Ámbar (atención)
- Hover: Fondo ámbar claro
- Click: Abre modal
- Disabled: Si readOnly o cargando

