# Autoguardado de Compras - Implementación Completada

## 🚀 Funcionalidades Implementadas

### 1. **Autoguardado Automático**

- **Intervalo**: Cada 30 segundos
- **Condiciones**: Solo cuando hay contenido mínimo y cambios sin guardar
- **Estado**: Automáticamente cambia a "PENDIENTE" cuando es una nueva compra con contenido

### 2. **Protección Contra Pérdida de Datos**

- **beforeunload**: Guarda antes de cerrar ventana/pestaña
- **visibilitychange**: Guarda cuando se pierde foco de la ventana
- **Confirmación**: Pregunta al usuario si hay cambios sin guardar

### 3. **Detección Inteligente de Contenido**

Considera que tiene contenido mínimo cuando:

- ✅ Tiene proveedor seleccionado
- ✅ Al menos un detalle con: producto_id, cantidad > 0, precio_unitario > 0

### 4. **Notificaciones Informativas**

- 📄 "Compra #XXX guardada automáticamente como pendiente" (nuevas)
- 💾 "Cambios guardados automáticamente" (ediciones)
- ⚠️ Sin interrupciones molestas al usuario

## 🔧 Detalles Técnicos

### Estados Implementados

```typescript
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
const [lastSavedData, setLastSavedData] = useState<string>('');
const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);
```

### Lógica de Autoguardado

```typescript
const autoSave = useCallback(async () => {
  // Validaciones
  if (!hasMinimumContent() || !hasUnsavedChanges) return;

  // Cambio automático a PENDIENTE para nuevas compras
  const estadoPendienteId = props.estados?.find(e => e.nombre === 'Pendiente')?.id;
  const dataToSave = {
    ...data,
    estado_documento_id: !isEditing && estadoPendienteId ? estadoPendienteId : data.estado_documento_id,
    detalles: data.detalles.filter(d => d.producto_id !== '')
  };

  // Envío con flag _autoguardado
  // ... implementación fetch
}, [dependencies]);
```

### Eventos de Protección

```typescript
// Cada 30 segundos
setInterval(autoSave, 30000);

// Antes de cerrar
window.addEventListener('beforeunload', handleBeforeUnload);

// Al perder foco
document.addEventListener('visibilitychange', handleVisibilityChange);
```

## 💡 Flujo de Trabajo

### Escenario 1: Nueva Compra

1. Usuario llena proveedor + productos
2. Autoguardado detecta contenido mínimo
3. Guarda automáticamente como "PENDIENTE"
4. Notifica: "Compra #123 guardada automáticamente como pendiente"

### Escenario 2: Editando Compra Existente

1. Usuario modifica datos
2. Autoguardado detecta cambios
3. Guarda manteniendo el estado actual
4. Notifica: "Cambios guardados automáticamente"

### Escenario 3: Cierre Inesperado

1. Usuario cierra ventana/pestaña con cambios
2. Sistema intenta guardar automáticamente
3. Muestra confirmación al usuario
4. Protege contra pérdida de datos

## 🎯 Beneficios Implementados

### Para el Usuario

- ✅ **Protección total**: Nunca pierde datos por cierres inesperados
- ✅ **Trabajo fluido**: No interrupciones constantes pidiendo guardar
- ✅ **Transparencia**: Notificaciones discretas del progreso
- ✅ **Estados lógicos**: PENDIENTE automático cuando tiene contenido

### Para el Sistema

- ✅ **Consistencia**: Datos siempre en estados coherentes
- ✅ **Recuperabilidad**: Borradores guardados automáticamente
- ✅ **Performance**: Solo guarda cuando realmente hay cambios
- ✅ **Limpieza**: Filtra detalles vacíos automáticamente

## ✅ Estado de Implementación

- [x] Hook de autoguardado implementado
- [x] Detección de cambios funcional
- [x] Protección beforeunload activa
- [x] Protección visibilitychange activa
- [x] Notificaciones informativas
- [x] Cambio automático a PENDIENTE
- [x] Filtrado de detalles válidos
- [x] Compilación exitosa sin errores
- [x] Flag _autoguardado para backend

## 🚀 Próximos Pasos Recomendados

1. **Backend**: Manejar el flag `_autoguardado` para auditoría
2. **Testing**: Probar en diferentes navegadores
3. **UX**: Considerar indicador visual de "guardando..."
4. **Configuración**: Hacer el intervalo configurable (30s por defecto)

---
**Implementación completada exitosamente** ✅  
*Fecha: Enero 2025*
