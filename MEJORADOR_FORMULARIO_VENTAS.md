# ✅ Mejora: Selector de Direcciones en Formulario de Ventas (2026-02-10)

## 📋 Resumen

Se ha mejorado el formulario `/ventas/create` para mostrar automáticamente las direcciones del cliente registradas cuando:
1. Se selecciona un cliente
2. Se activa la opción "Requiere Envío" (🚚 Información de Envío)

## 🎯 Mejoras Implementadas

### 1. **Nueva Entidad: Campo `direccion_cliente_id`**
- **Archivo**: `resources/js/domain/entities/ventas.ts`
- **Cambio**: Se agregó campo `direccion_cliente_id?: Id | null` a la interfaz `VentaFormData`
- **Propósito**: Guardar referencia a la dirección del cliente seleccionada
- **Tipo**: FK a la tabla `direcciones_cliente`

### 2. **Estados Nuevos en el Formulario**
- **Archivo**: `resources/js/presentation/pages/ventas/create.tsx`
- **Cambios**:
  ```typescript
  const [direccionesDisponibles, setDireccionesDisponibles] = useState<Array<{...}>>([]);
  const [cargandoDirecciones, setCargandoDirecciones] = useState(false);
  ```
- **Propósito**: Almacenar direcciones del cliente y mostrar indicador de carga

### 3. **Campo en el Formulario useForm**
- **Línea**: ~230
- **Cambio**: Se agregó `direccion_cliente_id` al estado del formulario
- **Inicialización**: `null` por defecto, cargado de venta existente si aplica

### 4. **useEffect para Cargar Direcciones**
- **Línea**: ~335-365
- **Trigger**: Cuando `requiere_envio = true` Y se selecciona un cliente
- **Lógica**:
  1. Llama a `/api/clientes/{cliente_id}`
  2. Filtra solo direcciones activas (`activa !== false`)
  3. Si solo hay una dirección, la selecciona automáticamente
  4. Muestra indicador de carga mientras se cargan

### 5. **UI: Selector de Direcciones**
- **Ubicación**: Sección "🚚 Información de Envío" (cuando `requiere_envio = true`)
- **Componentes**:
  - 📍 **Título**: "Direcciones del Cliente"
  - **Spinner**: Indica carga de direcciones
  - **Radio Buttons**: Permite seleccionar una dirección
  - **Información mostrada por dirección**:
    - Dirección completa
    - Localidad (si disponible)
    - Badge "Principal" si es dirección principal
  - **Mensaje alternativo**: Si no hay direcciones registradas, muestra aviso ambar

### 6. **Comportamiento del Formulario**
- **Sin dirección seleccionada**: Campo de texto es obligatorio (*)
- **Con dirección seleccionada**: Campo de texto es opcional
- **Placeholder actualizado**: "Calle, número, piso, referencias... (se rellenará automáticamente...)"

## 🔄 Flujo de Uso

```
1. Usuario accede a /ventas/create
   ↓
2. Selecciona un cliente en el campo "Cliente"
   ↓
3. Activa toggle "🚚 Requiere Envío" (cambio de No → Sí)
   ↓
4. Sistema carga automáticamente direcciones del cliente
   ↓
5. Se muestra selector de direcciones disponibles
   ↓
6. Usuario selecciona una dirección (radio button)
   ↓
7. El campo "Dirección de Envío" es ahora opcional
   ↓
8. Si usuario modifica la dirección en el textarea, se sobrescribe
   ↓
9. Al guardar venta, se envía:
      - direccion_cliente_id: 123 (FK a dirección del cliente)
      - observaciones: "Calle modificada..." (si se editó)
```

## 📊 Estructura de Datos Mostrada

```javascript
// Direcciones disponibles cargadas del cliente:
[
  {
    id: 1,
    direccion: "Calle Principal 123, Piso 2",
    localidad: "La Paz",
    es_principal: true,
    activa: true
  },
  {
    id: 2,
    direccion: "Av. Secundaria 456",
    localidad: "La Paz",
    es_principal: false,
    activa: true
  }
]
```

## 🎨 Estilos Visuales

- **Contenedor**: `bg-blue-50 dark:bg-blue-900/20` (mismo color que resto de campos)
- **Direcciones**: Radio buttons con hover effect
- **Badge Principal**: Verde con texto blanco
- **Spinner**: Animado, color azul
- **Mensaje de advertencia**: Color ámbar

## ✅ Validaciones

- ✅ Solo carga direcciones si `requiere_envio = true`
- ✅ Solo carga si hay un `cliente_id` válido
- ✅ Filtra solo direcciones activas
- ✅ Auto-selecciona si hay solo una dirección
- ✅ Maneja errores de red silenciosamente
- ✅ Campo de texto sigue siendo válido para direcciones manuales

## 🔌 API Endpoints Utilizados

- **GET** `/api/clientes/{cliente_id}` - Obtiene datos del cliente incluyendo direcciones
- **POST** `/ventas` - Guarda venta con `direccion_cliente_id` opcional

## 📝 Compatibilidad con Backend

El backend deberá:
1. Aceptar `direccion_cliente_id` nullable en `VentaController@store`
2. Validar que pertenezca al cliente seleccionado
3. Guardar en columna `direccion_cliente_id` de tabla `ventas`
4. Mantener lógica actual si `direccion_cliente_id = null`

## 🚀 Próximas Mejoras Sugeridas

1. **Pre-rellenar textarea**: Si se selecciona dirección, mostrar en textarea
2. **Validación mejorada**: Asegurar que al menos una de las dos fuentes tenga dirección
3. **Botón "Editar Direcciones"**: Para crear/editar direcciones desde el formulario
4. **Historial de direcciones**: Mostrar direcciones usadas recientemente
5. **Geolocalización**: Permitir seleccionar dirección en mapa

## 📋 Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `domain/entities/ventas.ts` | Agregó `direccion_cliente_id` | 187 |
| `pages/ventas/create.tsx` | Estados, useEffect, UI | 120-1300+ |

## ✅ Status

- ✅ Frontend: Compilado exitosamente (`npm run build`)
- ✅ TypeScript: Sin errores
- ✅ UI: Responsive y dark mode compatible
- ⏳ Backend: Requiere actualización para guardar `direccion_cliente_id`

---

**Última actualización**: 2026-02-10
**Estado**: Lista para usar (espera confirmación del backend)
