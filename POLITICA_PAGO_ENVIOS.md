# ✅ Selector de Política de Pago para Envíos (2026-02-10)

## 📋 Resumen

Se ha agregado un selector de **política de pago** en la sección de envíos que permite al usuario elegir entre:
- **Contra Entrega**: El cliente paga al recibir el pedido
- **Anticipado 100%**: El cliente paga antes de enviar el pedido

Este selector **solo aparece cuando se activa "Requiere Envío"**.

## 🎯 Mejora Implementada

### Ubicación
- **Archivo**: `resources/js/presentation/pages/ventas/create.tsx`
- **Sección**: "🚚 Información de Envío" (cuando `requiere_envio = true`)
- **Posición**: Antes del selector de direcciones del cliente

### Características

#### 1. **Radio Buttons para Selección**
- ✅ Dos opciones: CONTRA_ENTREGA y ANTICIPADO_100
- ✅ Descripciones claras para cada opción
- ✅ Solo una opción seleccionable a la vez

#### 2. **Diseño Visual**
```
💳 Política de Pago

☉ Contra Entrega
  El cliente paga al recibir el pedido

● Anticipado 100%
  El cliente paga antes de enviar el pedido
```

#### 3. **Comportamiento**
- Se muestra solo cuando `requiere_envio = true`
- Se oculta cuando `requiere_envio = false`
- La selección se guarda en `data.politica_pago`
- Compatible con dark mode
- Responsive design

### Estados Visual
- **Normal**: Fondo gris con hover effect
- **Seleccionado**: Radio button marcado
- **Dark Mode**: Colores adaptados para tema oscuro

## 🔄 Flujo de Uso

```
1. Usuario selecciona cliente
   ↓
2. Usuario activa "🚚 Requiere Envío" (toggle)
   ↓
3. ✨ Aparece selector "💳 Política de Pago"
   ↓
4. Usuario selecciona:
   - CONTRA_ENTREGA o
   - ANTICIPADO_100
   ↓
5. Se guarda en data.politica_pago
   ↓
6. Al crear venta, se envía al backend
```

## 📊 Estructura HTML

```jsx
{data.requiere_envio && (
  <div className="bg-blue-50 dark:bg-blue-900/20...">

    {/* NUEVO: Selector de Política de Pago */}
    <div>
      <label className="block text-sm font-medium...">
        💳 Política de Pago
      </label>
      <div className="space-y-2">

        {/* CONTRA_ENTREGA */}
        <label className="flex items-center gap-3 p-2 rounded...">
          <input type="radio" value="CONTRA_ENTREGA" />
          <div>
            <p>Contra Entrega</p>
            <p>El cliente paga al recibir el pedido</p>
          </div>
        </label>

        {/* ANTICIPADO_100 */}
        <label className="flex items-center gap-3 p-2 rounded...">
          <input type="radio" value="ANTICIPADO_100" />
          <div>
            <p>Anticipado 100%</p>
            <p>El cliente paga antes de enviar el pedido</p>
          </div>
        </label>

      </div>
    </div>

    {/* Selector de Direcciones (ya existente) */}
    {clienteSeleccionado && (
      <div>
        📍 Direcciones del Cliente
        ...
      </div>
    )}

  </div>
)}
```

## 🎨 Estilos

- **Contenedor**: `bg-blue-50 dark:bg-blue-900/20` (mismo que sección de envío)
- **Labels**: `text-gray-700 dark:text-gray-300`
- **Descripción**: `text-gray-600 dark:text-gray-400` (tamaño pequeño)
- **Hover**: `hover:bg-blue-100 dark:hover:bg-blue-800/30`
- **Radio Button**: `h-4 w-4 text-blue-600 focus:ring-blue-500`

## 📝 Campos Enviados

Cuando se crea la venta, se envía:

```json
{
  "cliente_id": 5,
  "requiere_envio": true,
  "direccion_cliente_id": 12,
  "politica_pago": "CONTRA_ENTREGA",  // ← Desde selector
  "total": 1500,
  ...otros campos
}
```

## ✅ Validaciones

- ✅ Solo aparece si `requiere_envio = true`
- ✅ Se oculta si `requiere_envio = false`
- ✅ Siempre hay un valor por defecto (ANTICIPADO_100)
- ✅ Solo una opción seleccionable a la vez
- ✅ Valores válidos: CONTRA_ENTREGA, ANTICIPADO_100

## 🚀 Integraciones

### Frontend
- ✅ Estado del formulario: `data.politica_pago`
- ✅ Actualización: `setData('politica_pago', value)`
- ✅ Visualización condicional: `{data.requiere_envio && (...)}`

### Backend (Ya Existente)
- ✅ DTOs aceptan `politica_pago`
- ✅ VentaService procesa `politica_pago`
- ✅ Base de datos almacena en tabla `ventas`

## 📊 Ejemplo de Uso

### Caso 1: Cliente con Envío a Domicilio

```
Cliente: Mercado López
Requiere Envío: ✓ (Activo)

💳 Política de Pago:
☉ Contra Entrega      (Seleccionado)
● Anticipado 100%

📍 Direcciones del Cliente:
○ Calle Principal 123, Piso 2
● Av. Secundaria 456  (Seleccionada)

Resultado: pago_politica = "CONTRA_ENTREGA"
```

### Caso 2: Cliente sin Envío (Presencial)

```
Cliente: Tienda Centro
Requiere Envío: ✗ (Desactivo)

💳 Política de Pago:    ← NO VISIBLE
📍 Direcciones:         ← NO VISIBLE

Resultado: No afecta (se usa default ANTICIPADO_100)
```

## 🔍 Notas Técnicas

- **Posición**: Aparece ANTES del selector de direcciones
- **Orden**: Primero política de pago, luego direcciones
- **Responsividad**: Funciona en móvil y desktop
- **Dark Mode**: Totalmente compatible
- **Accesibilidad**: Labels asociados a inputs

## ✅ Status

- ✅ Frontend: Implementado y compilado (22.87s)
- ✅ TypeScript: Sin errores
- ✅ UI: Responsive y dark mode compatible
- ✅ Funcionalidad: Completa
- ✅ Backend: Listo para recibir `politica_pago`

## 📁 Archivos Modificados

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `pages/ventas/create.tsx` | Agregó selector de política de pago | ~40 |

## 🎯 Próximas Mejoras Sugeridas

1. **Validación**: Mostrar error si no se selecciona política cuando se requiere envío
2. **Mejora UI**: Mostrar política actual si ya está seleccionada
3. **Descripción**: Mostrar diferencia de precio/plazo entre opciones
4. **Restricciones**: Ciertos clientes solo pueden usar una política

---

**Última actualización**: 2026-02-10
**Estado**: Implementado y compilado
**Impacto**: Mejora UX para ventas con envío
