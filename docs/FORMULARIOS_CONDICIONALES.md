# Guía: Campos Condicionales en Formularios Genéricos

Esta guía explica cómo mostrar u ocultar campos dinámicamente en formularios según el contexto (creación vs edición).

## 🎯 Problema

Necesitas que ciertos campos se comporten diferente dependiendo del modo:
- **Modo creación**: Campo oculto (ej: `codigo_cliente` se genera automáticamente)
- **Modo edición**: Campo visible pero deshabilitado (solo lectura)

## ✅ Solución: Uso de `visible` y `disabled`

El sistema de formularios genéricos soporta dos propiedades funcionales:

### 1. `visible: (data) => boolean`

Controla si el campo se muestra o no según los datos del formulario.

```typescript
{
    key: 'codigo_cliente',
    label: 'Código',
    type: 'text',
    visible: (data) => !!data.id, // Solo visible si existe ID (modo edición)
}
```

### 2. `disabled: (data) => boolean`

Controla si el campo está deshabilitado según los datos del formulario.

```typescript
{
    key: 'codigo_cliente',
    label: 'Código',
    type: 'text',
    disabled: () => true, // Siempre deshabilitado
    // O condicional:
    disabled: (data) => !!data.codigo_cliente, // Solo deshabilitado si ya tiene código
}
```

## 📋 Patrones Comunes

### Patrón 1: Campo solo en EDICIÓN (solo lectura)

```typescript
{
    key: 'codigo_cliente',
    label: 'Código de Cliente',
    type: 'text',
    visible: (data) => !!data.id,    // Solo visible en edición
    disabled: () => true,             // Siempre deshabilitado
    prefix: '#',
}
```

**Uso:** Campos generados automáticamente que el usuario debe ver pero no modificar.

### Patrón 2: Campo solo en EDICIÓN (modificable)

```typescript
{
    key: 'activo',
    label: 'Cliente activo',
    type: 'boolean',
    visible: (data) => !!data.id,    // Solo visible en edición
    defaultValue: true,
}
```

**Uso:** Campos de estado que solo tienen sentido después de crear el registro.

### Patrón 3: Campo solo en CREACIÓN

```typescript
{
    key: 'password',
    label: 'Contraseña',
    type: 'text',
    visible: (data) => !data.id,     // Solo visible al crear
    required: (data) => !data.id,    // Solo requerido al crear
}
```

**Uso:** Campos que solo se necesitan al crear (como contraseña inicial).

### Patrón 4: Campo condicional basado en otro campo

```typescript
{
    key: 'nit',
    label: 'NIT',
    type: 'text',
    visible: (data) => data.tipo_documento === 'nit',  // Solo si tipo es NIT
    required: (data) => data.tipo_documento === 'nit',
}
```

**Uso:** Mostrar campos según selecciones previas.

### Patrón 5: Campo deshabilitado condicionalmente

```typescript
{
    key: 'precio_venta',
    label: 'Precio de Venta',
    type: 'number',
    disabled: (data) => data.usa_precio_automatico, // Deshabilitar si usa precio automático
}
```

**Uso:** Deshabilitar campos según lógica de negocio.

## 🔍 Cómo funciona internamente

El componente `GenericFormFields` evalúa estas funciones:

```typescript
// Verificar visibilidad
const isFieldVisible = (field: FormField<F>): boolean => {
  if (field.hidden) return false;         // hidden estático
  if (field.visible) return field.visible(data); // visible dinámico
  return true;
};

// Verificar si está deshabilitado
const isFieldDisabled = (field: FormField<F>): boolean => {
  if (disabled) return true;              // todo el formulario deshabilitado
  if (field.disabled) return field.disabled(data); // disabled dinámico
  return false;
};
```

El parámetro `data` contiene:
- **Al crear**: `{ nombre: '', email: '', ... }` (sin `id`)
- **Al editar**: `{ id: 5, nombre: 'Juan', email: 'juan@mail.com', ... }` (con `id`)

## 💡 Tips

1. **Detectar modo edición**: Usa `!!data.id` para saber si estás editando
2. **Combinar propiedades**: Puedes usar `visible` y `disabled` juntos
3. **Campos requeridos condicionalmente**: `required` también puede ser función
4. **Validaciones condicionales**: `validation` puede depender del contexto

## 📝 Ejemplo Completo: Formulario de Cliente

```typescript
formFields: [
    // 📋 Código - Solo en edición (solo lectura)
    {
        key: 'codigo_cliente',
        label: 'Código de Cliente',
        type: 'text',
        visible: (data) => !!data.id,
        disabled: () => true,
        prefix: '#',
    },

    // ✅ Estado - Solo en edición
    {
        key: 'activo',
        label: 'Cliente activo',
        type: 'boolean',
        visible: (data) => !!data.id,
        defaultValue: true,
    },

    // 📅 Fecha registro - Solo lectura en edición
    {
        key: 'fecha_registro',
        label: 'Fecha de Registro',
        type: 'date',
        disabled: (data) => !!data.id, // Deshabilitado si ya existe
    },

    // Campos normales siempre visibles
    {
        key: 'nombre',
        label: 'Nombre',
        type: 'text',
        required: true,
    },
]
```

## 🚀 Aplicación en otros módulos

Este patrón funciona en **todos** los módulos que usan el sistema de formularios genéricos:
- Empleados
- Proveedores
- Productos
- Vehículos
- Almacenes
- etc.

Simplemente aplica las mismas reglas en tu archivo de configuración `.config.ts`.
