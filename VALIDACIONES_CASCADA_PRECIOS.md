# Validaciones Implementadas - Cascada de Precios en Compras

## Fase 1: Validaciones Centralizadas

### 1. **useCascadaPreciosCompra.ts** - Hook de lógica

#### Validaciones en `calcularCascada()`:

- ✅ **Precios no nulos**: Verifica que el array de precios no esté vacío
- ✅ **Costo nuevo requerido**: Valida que `precioCostoNuevo` no sea null/undefined
- ✅ **Precio costo > 0**: No permite costo cero (aunque se verifica en `validarCambios()`)
- ✅ **Índices válidos**: En `actualizarPrecioPropuesto()` y `actualizarGananciaPropuesta()`
- ✅ **Costo positivo para ganancia**: Valida que costo > 0 antes de calcular %

#### Validaciones en `validarCambios()`:

- ✅ **Cambios significativos**: Solo acepta cambios > 0.01 (tolerancia)
- ✅ **Precios positivos**: Rechaza precios < 0
- ✅ **Costo nunca 0**: Valida específicamente que COSTO > 0
- ✅ **Cantidad de cambios**: Debe haber al menos 1 precio con cambios

**Retorna:**
```typescript
{
    esValido: boolean;
    mensaje: string;
    preciosCambiados: Array<{
        id: number;
        precio_propuesto: number;
        porcentaje_ganancia_propuesto: number;
    }>;
}
```

---

### 2. **precios.utils.ts** - Utilidades compartidas

#### Funciones de validación:

```typescript
esPrecioValido(valor: number | null | undefined): boolean
// Valida: no null, tipo number, no NaN, >= 0

tienePreferenciaDiferencia(precioCosto, precioCompra, tolerancia = 0.01): boolean
// Detecta diferencia significativa entre dos precios

estaDentroDeRango(minimo, maximo, valor): boolean
// Valida que precio esté en rango permitido
```

#### Funciones de cálculo (implícitamente seguras):

```typescript
redondearDos(valor): number
// Siempre devuelve 2 decimales (seguro para moneda)

calcularPorcentajeGanancia(costo, precio): number
// Valida costo > 0 antes de dividir

calcularPrecioDesdeGanancia(costo, porcentaje): number
// Valida costo > 0
```

---

### 3. **cascada-precios.types.ts** - Tipos y validación de integración

#### Función `validarDatosParaModal()`:

Validaciones antes de abrir modal:
- ✅ Producto existe
- ✅ Producto tiene precios
- ✅ Precio costo actual es requerido y válido
- ✅ Precio costo nuevo es requerido y válido
- ✅ Ninguno de los precios es negativo
- ✅ Callback `onActualizarPrecios` existe

---

### 4. **ModalComprasDiferenciaCostoComponent** - Validaciones en UI

#### En `handleGuardarPrecios()`:

- ✅ Motivo de actualización no está vacío
- ✅ Usa `validarCambios()` del hook
- ✅ Rechaza si no hay cambios significativos
- ✅ Callback `onActualizarPrecios` existe

#### Manejo de errores:

- ✅ Error en cascada → Modal muestra pantalla de error con mensaje específico
- ✅ Error en guardado → `NotificationService.error()` + log en consola
- ✅ Error en validación → `NotificationService.warning()`

---

## Casos de Validación Cubiertos

### ✅ Caso 1: Precio costo = 0 (RECHAZADO)
```typescript
calcularCascada() → Error: "El costo debe ser mayor a 0"
validarCambios() → esValido: false
```

### ✅ Caso 2: Precio costo negativo (RECHAZADO)
```typescript
validarDatosParaModal() → Error: "Precio costo nuevo no puede ser negativo"
```

### ✅ Caso 3: No hay cambios significativos (RECHAZADO)
```typescript
validarCambios() → esValido: false
                    mensaje: "No hay cambios significativos en los precios"
```

### ✅ Caso 4: Usuario edita precio a valor negativo (RECHAZADO)
```typescript
validarCambios() → esValido: false
                    mensaje: "Los precios no pueden ser negativos"
```

### ✅ Caso 5: Motivo vacío (RECHAZADO)
```typescript
handleGuardarPrecios() → NotificationService.warning("Motivo obligatorio")
```

### ✅ Caso 6: Producto sin precios (RECHAZADO)
```typescript
validarDatosParaModal() → Error: "Debe tener precios configurados"
```

### ✅ Caso 7: API falla al guardar (RECHAZADO)
```typescript
try/catch en handleGuardarPrecios()
→ NotificationService.error(mensaje específico)
```

---

## Flujo de Validación Completo

```
ProductosTable detecta diferencia
    ↓
    ├─ validarDatosParaModal() [PASO 1: Validación previa]
    │  └─ Si falla → Mostrar error en ProductosTable
    │
    └─ Modal abre ✅
        ↓
        calcularCascada() [PASO 2: Cálculo de cascada]
        │  ├─ Valida precios no nulos
        │  ├─ Valida costo nuevo existe
        │  └─ Si falla → Pantalla de error en modal
        │
        Usuario edita precios ↓
        │
        Usuario hace clic "Guardar" ↓
        │
        handleGuardarPrecios() [PASO 3: Validación final]
        │  ├─ validarCambios() ✅
        │  │  ├─ Cambios significativos
        │  │  └─ Precios válidos
        │  │
        │  ├─ Motivo no vacío
        │  │
        │  └─ Si falla → NotificationService.warning()
        │
        Si pasa → Enviar a API ↓
        │
        Esperar respuesta ↓
        │
        Si éxito:
        │  ├─ NotificationService.success()
        │  ├─ onSuccess() callback
        │  └─ Modal cierra
        │
        Si fallo:
           ├─ NotificationService.error()
           ├─ Log en consola
           └─ Modal se mantiene abierto
```

---

## Tolerancias Configurables

```typescript
// En validarCambios(tolerancia = 0.01)
// Cambios menores a $0.01 se ignoran

// En tienePreferenciaDiferencia(tolerancia = 0.01)
// Diferencias menores a $0.01 no disparan modal
```

---

## Mejoras Futuras (Fase 2+)

- [ ] Validación de rango máximo/mínimo de precios
- [ ] Historial de cambios de precios
- [ ] Confirmación visual antes de guardar
- [ ] Undo/Rollback si API falla
- [ ] Auditoría de quién cambió qué precio cuándo
- [ ] Validación contra precios de competencia
- [ ] Alerta si cambio es muy grande (> 10% por ejemplo)

---

## Testing Recomendado

```typescript
// useCascadaPreciosCompra.test.ts
test('Rechaza costo = 0', () => {
    const {calcularCascada} = useCascadaPreciosCompra(precios, null, 0);
    expect(() => calcularCascada()).toThrow();
});

test('Rechaza cambios < 0.01', () => {
    const {validarCambios} = useCascadaPreciosCompra(...);
    const resultado = validarCambios();
    expect(resultado.esValido).toBe(false);
});

test('Calcula cascada correctamente', () => {
    const {calcularCascada, preciosPropuestos} = useCascadaPreciosCompra(...);
    calcularCascada();
    expect(preciosPropuestos.length).toBe(precios.length);
    expect(preciosPropuestos[0].precio_propuesto).toBeGreaterThan(0);
});
```
