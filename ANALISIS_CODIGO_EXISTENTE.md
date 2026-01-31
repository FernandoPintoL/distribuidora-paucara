# Análisis: Reutilizar Código Existente (Sin Duplicación)

## 🎯 Hallazgo Principal

**El endpoint y la lógica de actualización de precios en lote YA EXISTEN.**

No es necesario crear un nuevo endpoint backend ni duplicar código.

---

## 📍 Dónde Existe el Código

### 1. Página `/pages/precios/index.tsx` (LÍNEA 355-366)

```typescript
<ModalComprasDiferenciaCostoComponent
    isOpen={showModalCompras}
    onClose={handleCerrarModalCompras}
    producto={estado.productoComprasSeleccionado}
    precioActual={...}
    precioCostoNuevo={estado.precioCostoNuevo}
    compras={estado.comprasConDiferencia}
    loading={estado.loadingCompras}
    onActualizarPrecios={handleActualizarPreciosModal} // ← AQUÍ
/>
```

### 2. Handler en `/pages/precios/index.tsx` (LÍNEA 85-96)

```typescript
const handleActualizarPreciosModal = async (precios: Array<{...}>) => {
    try {
        console.log('💾 Página Precios - handleActualizarPreciosModal iniciado');
        await acciones.actualizarLote(precios); // ← LLAMA AL HOOK
        await acciones.obtenerPrecios(filtros); // ← RECARGA LISTA
    } catch (error) {
        console.error('❌ Error actualizando precios:', error);
        throw error;
    }
};
```

### 3. Hook `usePrecios()` (LÍNEA 187-212)

```typescript
const actualizarLote = useCallback(
    async (precios: Array<{...}>) => {
        try {
            console.log('🔄 Iniciando actualización de lote');
            setEstado(prev => ({ ...prev, loading: true }));
            const resultado = await preciosService.actualizarLote(precios); // ← LLAMA AL SERVICIO
            await obtenerPrecios(); // ← RECARGA
            setEstado(prev => ({ ...prev, loading: false }));
        } catch (error) {
            // Manejo de error
        }
    },
    [obtenerPrecios]
);
```

### 4. Servicio `precios.service.ts` (LÍNEA 215-255)

```typescript
async actualizarLote(precios: Array<{
    precio_id: number;
    precio_nuevo: number;
    porcentaje_ganancia?: number;
    motivo: string;
}>): Promise<...> {
    try {
        // Log de debug
        console.log('🚀 POST a:', `${this.baseUrl}/actualizar-lote`);
        console.log('📦 Payload:', JSON.stringify(payload, null, 2));

        const response = await fetch(`${this.baseUrl}/actualizar-lote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': this.getCsrfToken(),
            },
            body: JSON.stringify(payload),
        });

        return resultado;
    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    }
}
```

---

## 🔗 Flujo Existente

```
/pages/precios/index.tsx
    ├─ Modal renderizado
    ├─ onActualizarPrecios={handleActualizarPreciosModal}
    └─ handleActualizarPreciosModal()
        │
        └─ acciones.actualizarLote(precios)
            │
            └─ usePrecios hook
                │
                └─ preciosService.actualizarLote(precios)
                    │
                    └─ POST /api/precios/actualizar-lote
                        │
                        └─ Backend (Laravel)
```

---

## 🚀 Optimización: NO Duplicar Código

### ❌ LO QUE HICIMOS (ANTERIOR)

Creamos:
- `precios.api.ts` (nuevo archivo con `actualizarCascadaPreciosAPI()`)
- POST a `/api/precios/actualizar-cascada` (nuevo endpoint)

### ✅ LO QUE DEBEMOS HACER (ÓPTIMO)

**Opción A: Usar el servicio existente DIRECTAMENTE**

En ProductosTable, en lugar de crear `precios.api.ts`:

```typescript
// Importar el servicio existente
import { preciosService } from '@/application/services/precios.service';

// En handleGuardarPreciosModal
const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await preciosService.actualizarLote(precios);
}, []);
```

**Opción B: Usar el hook existente (MÁS LIMPIO)**

En ProductosTable, importar `usePrecios`:

```typescript
import { usePrecios } from '@/application/hooks/use-precios';

// En el componente
const [estado, acciones] = usePrecios();

// En handleGuardarPreciosModal
const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await acciones.actualizarLote(precios);
}, [acciones]);
```

---

## 📊 Comparación de Enfoques

### Enfoque Anterior (LO QUE HICIMOS)

```
ProductosTable
    └─ precios.api.ts (NUEVO)
        └─ POST /api/precios/actualizar-cascada (NUEVO ENDPOINT)
            └─ Backend (NUEVO CÓDIGO)
```

**Problemas**:
- ❌ Duplica `actualizarLote()`
- ❌ Crea nuevo endpoint redundante
- ❌ No usa código existente

### Enfoque Óptimo (LO QUE DEBEMOS HACER)

```
ProductosTable
    └─ preciosService.actualizarLote() (REUTILIZA)
        └─ POST /api/precios/actualizar-lote (YA EXISTE)
            └─ Backend (YA EXISTE)
```

**Ventajas**:
- ✅ Cero duplicación
- ✅ Reutiliza código existente
- ✅ No crea nuevos endpoints
- ✅ Mantiene la lógica centralizada

---

## 🔄 Cambios Necesarios en ProductosTable

### ANTES (con duplicación)

```typescript
import { actualizarCascadaPreciosAPI } from '@/infrastructure/api/precios.api'; // NUEVO ARCHIVO

const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await actualizarCascadaPreciosAPI(modalCascadaState.productoId, precios);
}, [modalCascadaState.productoId]);
```

### DESPUÉS (sin duplicación - Opción A: Servicio directo)

```typescript
import { preciosService } from '@/application/services/precios.service'; // YA EXISTE

const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await preciosService.actualizarLote(precios);
}, []);
```

### DESPUÉS (sin duplicación - Opción B: Hook)

```typescript
import { usePrecios } from '@/application/hooks/use-precios'; // YA EXISTE

// En el componente
const [_, acciones] = usePrecios();

const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await acciones.actualizarLote(precios);
}, [acciones]);
```

---

## 🎯 Recomendación: Opción A (Servicio Directo)

**Por qué Opción A es mejor:**
- ✅ Simple: Solo importar el servicio
- ✅ No cargas el estado del hook completo (más eficiente)
- ✅ Menos acoplamiento
- ✅ Fácil de entender y mantener

**Por qué NO Opción B (Hook):**
- ❌ Carga estado que no necesitas (`precios`, `cambiosRecientes`, etc)
- ❌ Más overhead
- ❌ Más acoplamiento a la página de precios

---

## 📋 Cambios a Realizar

### 1. ELIMINAR
- ❌ `/infrastructure/api/precios.api.ts` (NO ES NECESARIO)

### 2. MODIFICAR ProductosTable.tsx

**Reemplazar**:
```typescript
// ELIMINAR
import { actualizarCascadaPreciosAPI } from '@/infrastructure/api/precios.api';
```

**Con**:
```typescript
// AGREGAR
import { preciosService } from '@/application/services/precios.service';
```

**Reemplazar**:
```typescript
// ANTES
const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await actualizarCascadaPreciosAPI(
        modalCascadaState.productoId as number,
        precios
    );
}, [modalCascadaState.productoId]);
```

**Con**:
```typescript
// DESPUÉS - SIMPLE Y LIMPIO
const handleGuardarPreciosModal = useCallback(async (precios) => {
    return await preciosService.actualizarLote(precios);
}, []);
```

### 3. ELIMINAR de ProductosTable.tsx

```typescript
// ELIMINAR - Ya no necesario
const [loadingCascada, setLoadingCascada] = useState(false);
```

El estado `loadingCascada` no es necesario porque:
- El modal maneja su propio loading
- El servicio maneja su propio estado

---

## ✅ Beneficios de Esta Optimización

| Aspecto | Anterior | Después |
|---------|----------|---------|
| Archivos nuevos | +1 (precios.api.ts) | 0 |
| Endpoints nuevos | +1 (/actualizar-cascada) | 0 |
| Líneas duplicadas | ~100 | 0 |
| Complejidad | Media | Baja |
| Reutilización | Baja | Alta |
| Mantenimiento | Más difícil | Más fácil |

---

## 🔍 Verificación: ¿El endpoint ya existe en backend?

El servicio hace POST a: `/api/precios/actualizar-lote`

**Pregunta**: ¿Existe este endpoint en tu backend Laravel?

**Si SÍ existe**:
- ✅ Perfecto, solo aplicar cambios en ProductosTable
- ✅ Todo funciona inmediatamente

**Si NO existe**:
- ⚠️ Necesitas implementarlo en backend (pero es UNO SOLO, no dos)
- Ver FASE_3_BACKEND_GUIA.md pero adaptarlo para `/api/precios/actualizar-lote` en lugar de `/api/precios/actualizar-cascada`

---

## 📝 Resumen

### Antes de este análisis
Habíamos creado:
- `precios.api.ts` (INNECESARIO)
- Planificado endpoint `/actualizar-cascada` (REDUNDANTE)

### Después de este análisis
Deberíamos hacer:
- Usar `preciosService.actualizarLote()` (YA EXISTE)
- Usar endpoint `/api/precios/actualizar-lote` (YA EXISTE)
- Eliminar código duplicado

### Resultado
- 🎯 Cero duplicación
- 🎯 Código más limpio
- 🎯 Más mantenible
- 🎯 Menos líneas de código

---

## 🚀 Próximos Pasos

1. ✅ Verificar si endpoint `/api/precios/actualizar-lote` existe en backend
2. ⚠️ Si NO existe → Implementarlo en backend
3. ✅ Modificar ProductosTable según especificación anterior
4. ✅ Eliminar `precios.api.ts` que creamos
5. ✅ Testing

**Total de cambios**: ~20 líneas en ProductosTable (MUY SIMPLE)

