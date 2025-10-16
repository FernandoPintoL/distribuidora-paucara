# 🎨 Sistema de Formularios Genéricos Modernos

## 📋 Tabla de Contenidos

1. [Introducción](#introducción)
2. [Nuevas Características](#nuevas-características)
3. [Guía de Uso](#guía-de-uso)
4. [Ejemplos Prácticos](#ejemplos-prácticos)
5. [API Reference](#api-reference)
6. [Mejores Prácticas](#mejores-prácticas)

---

## 🎯 Introducción

El sistema de formularios genéricos ha sido modernizado con un diseño completamente responsive y nuevas características que te permiten controlar la visibilidad, agrupación y comportamiento de los campos del formulario de manera declarativa.

### ¿Qué cambió?

- ✅ **Diseño moderno y responsive** con gradientes y animaciones
- ✅ **Visibilidad condicional** de campos según otros valores
- ✅ **Deshabilitado condicional** de campos
- ✅ **Secciones y agrupación** para organizar campos
- ✅ **Grid flexible** con soporte para columnas (colSpan)
- ✅ **Prefijos y sufijos** para inputs (Ej: "Bs.", "%", "$")
- ✅ **Descripciones de ayuda** en cada campo
- ✅ **Mejor manejo de errores** con alertas visuales
- ✅ **Animaciones suaves** para mejor UX

---

## 🆕 Nuevas Características

### 1. Visibilidad Condicional

Muestra u oculta campos según el valor de otros campos:

```typescript
{
    key: 'usernick',
    label: 'Nombre de Usuario',
    type: 'text',
    // 🆕 Solo visible si puede_acceder_sistema es true
    visible: (data) => !!data.puede_acceder_sistema,
}
```

**Casos de uso:**
- Mostrar campos de usuario solo si se habilita el acceso al sistema
- Mostrar campos específicos según el tipo de contrato seleccionado
- Ocultar campos opcionales hasta que se cumplan ciertas condiciones

### 2. Deshabilitado Condicional

Deshabilita campos según condiciones:

```typescript
{
    key: 'contacto_emergencia_telefono',
    label: 'Teléfono de Emergencia',
    type: 'text',
    // 🆕 Deshabilitado si no hay nombre de contacto
    disabled: (data) => !data.contacto_emergencia_nombre,
}
```

**Casos de uso:**
- Deshabilitar campos dependientes hasta que se complete el campo padre
- Prevenir edición de campos calculados
- Deshabilitar campos según permisos del usuario

### 3. Ocultamiento Permanente

Oculta campos permanentemente sin eliminarlos de la configuración:

```typescript
{
    key: 'campo_interno',
    label: 'Campo Interno',
    type: 'text',
    // 🆕 Campo oculto permanentemente
    hidden: true,
}
```

**Casos de uso:**
- Campos que se usan en backend pero no se muestran al usuario
- Campos deprecados que se mantienen por compatibilidad

### 4. Secciones y Agrupación

Organiza campos en secciones visuales:

```typescript
// En la configuración del módulo
formSections: [
    {
        id: 'Información Personal',
        title: 'Información Personal',
        description: 'Datos personales del empleado',
        order: 1,
    },
    {
        id: 'Información Laboral',
        title: 'Información Laboral',
        description: 'Datos relacionados con el trabajo',
        order: 2,
    },
],

// En los campos
formFields: [
    {
        key: 'nombre',
        label: 'Nombre',
        type: 'text',
        section: 'Información Personal', // 🆕 Asignar a sección
    },
]
```

**Características:**
- Títulos y descripciones de sección
- Separadores visuales automáticos
- Orden personalizable
- Colapso opcional (próximamente)

### 5. Grid Flexible (colSpan)

Controla cuántas columnas ocupa cada campo:

```typescript
{
    key: 'nombre',
    label: 'Nombre Completo',
    type: 'text',
    colSpan: 2, // 🆕 Ocupa 2 columnas
}

{
    key: 'direccion',
    label: 'Dirección',
    type: 'textarea',
    colSpan: 3, // 🆕 Ocupa todo el ancho (3 columnas)
}
```

**Valores posibles:**
- `1`: 1 columna (default)
- `2`: 2 columnas
- `3`: Todo el ancho en desktop (responsive en móvil)
- `4`: Ancho completo forzado

**Responsive automático:**
- **Desktop (lg)**: Grid de 3 columnas
- **Tablet (sm)**: Grid de 2 columnas
- **Móvil**: 1 columna (full width)

### 6. Prefijos y Sufijos

Agrega decoradores visuales a los inputs:

```typescript
{
    key: 'salario_base',
    label: 'Salario Base',
    type: 'number',
    prefix: 'Bs.', // 🆕 Prefijo de moneda
}

{
    key: 'descuento',
    label: 'Descuento',
    type: 'number',
    suffix: '%', // 🆕 Sufijo de porcentaje
}
```

**Casos de uso comunes:**
- Monedas: `prefix: "Bs."`, `prefix: "$"`, `prefix: "€"`
- Porcentajes: `suffix: "%"`
- Unidades: `suffix: "kg"`, `suffix: "m"`, `suffix: "L"`
- Iconos decorativos: `prefix: "📱"`, `prefix: "✉️"`

### 7. Descripciones de Ayuda

Agrega texto explicativo a cada campo:

```typescript
{
    key: 'codigo_empleado',
    label: 'Código de Empleado',
    type: 'text',
    description: 'Se genera automáticamente si se deja vacío', // 🆕
}
```

**Características:**
- Tooltip con icono de información en el label
- Texto explicativo debajo del campo si no hay error
- Ayuda contextual para el usuario

---

## 📖 Guía de Uso

### Paso 1: Actualizar la Configuración del Módulo

Abre tu archivo de configuración (ej: `empleados.config.ts`) y agrega las nuevas propiedades:

```typescript
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Empleado, EmpleadoFormData } from '@/domain/entities/empleados';

export const empleadosConfig: ModuleConfig<Empleado, EmpleadoFormData> = {
    moduleName: 'empleados',
    singularName: 'empleado',
    pluralName: 'empleados',
    displayName: 'Empleados',
    description: 'Gestiona los empleados de la empresa',

    // 🆕 NUEVO: Define el layout del formulario
    formLayout: 'auto', // 'single' | 'two-column' | 'three-column' | 'auto'

    // 🆕 NUEVO: Define las secciones del formulario
    formSections: [
        {
            id: 'Información Personal',
            title: 'Información Personal',
            description: 'Datos personales del empleado',
            order: 1,
        },
        // ... más secciones
    ],

    // Campos del formulario
    formFields: [
        // ... campos con nuevas propiedades
    ],

    // ... resto de la configuración
};
```

### Paso 2: Configurar los Campos

Agrega las nuevas propiedades a tus campos:

```typescript
formFields: [
    {
        key: 'nombre',
        label: 'Nombre Completo',
        type: 'text',
        required: true,
        placeholder: 'Ej: Juan Pérez García',

        // 🆕 Nuevas propiedades
        section: 'Información Personal',
        colSpan: 2,
        description: 'Nombre completo como aparece en la CI',

        // Propiedades existentes
        validation: { maxLength: 255 },
    },
    {
        key: 'puede_acceder_sistema',
        label: 'Puede Acceder al Sistema',
        type: 'boolean',
        section: 'Acceso',
        colSpan: 3,
        description: 'Habilitar para crear un usuario de sistema',
    },
    {
        key: 'usernick',
        label: 'Nombre de Usuario',
        type: 'text',
        section: 'Acceso',
        colSpan: 1,

        // 🆕 Visibilidad condicional
        visible: (data) => !!data.puede_acceder_sistema,

        description: 'Se genera automáticamente',
    },
]
```

### Paso 3: Usar el Formulario (Sin cambios)

El uso del formulario NO cambia, sigue siendo igual:

```typescript
export default function EmpleadosForm({ empleado }: { empleado?: Empleado }) {
    return (
        <AppLayout>
            <GenericFormContainer<Empleado, EmpleadoFormData>
                entity={empleado}
                config={empleadosConfig}
                service={empleadosService}
                initialData={initialEmpleadoData}
            />
        </AppLayout>
    );
}
```

---

## 💡 Ejemplos Prácticos

### Ejemplo 1: Formulario de Empleados con Acceso al Sistema

```typescript
formFields: [
    {
        key: 'nombre',
        label: 'Nombre Completo',
        type: 'text',
        required: true,
        section: 'Datos Personales',
        colSpan: 2,
    },
    {
        key: 'ci',
        label: 'CI',
        type: 'text',
        required: true,
        section: 'Datos Personales',
        colSpan: 1,
    },
    {
        key: 'puede_acceder_sistema',
        label: 'Acceso al Sistema',
        type: 'boolean',
        section: 'Acceso',
        colSpan: 3,
        description: '¿Crear usuario de sistema para este empleado?',
    },
    {
        key: 'email',
        label: 'Email',
        type: 'text',
        section: 'Acceso',
        colSpan: 1,
        prefix: '✉️',
        visible: (data) => !!data.puede_acceder_sistema,
        description: 'Correo para enviar credenciales',
    },
    {
        key: 'roles',
        label: 'Roles',
        type: 'select',
        options: [],
        section: 'Acceso',
        colSpan: 2,
        visible: (data) => !!data.puede_acceder_sistema,
    },
]
```

**Resultado:**
- Los campos de email y roles solo se muestran si se marca el checkbox "Acceso al Sistema"
- El email tiene un icono de sobre como prefijo
- Todo está organizado en secciones

### Ejemplo 2: Formulario de Productos con Precios

```typescript
formFields: [
    {
        key: 'nombre',
        label: 'Nombre del Producto',
        type: 'text',
        required: true,
        section: 'Información Básica',
        colSpan: 2,
    },
    {
        key: 'tiene_precio_variable',
        label: 'Precio Variable',
        type: 'boolean',
        section: 'Precios',
        colSpan: 3,
        description: '¿El precio varía según cantidad o cliente?',
    },
    {
        key: 'precio_base',
        label: 'Precio Base',
        type: 'number',
        required: true,
        section: 'Precios',
        colSpan: 1,
        prefix: 'Bs.',
        disabled: (data) => !!data.tiene_precio_variable,
        description: 'Precio estándar del producto',
    },
    {
        key: 'descuento_maximo',
        label: 'Descuento Máximo',
        type: 'number',
        section: 'Precios',
        colSpan: 1,
        suffix: '%',
        visible: (data) => !!data.tiene_precio_variable,
        validation: { min: 0, max: 100 },
    },
]
```

**Resultado:**
- Si "Precio Variable" está activado, el "Precio Base" se deshabilita
- El campo "Descuento Máximo" solo se muestra si el precio es variable
- Los precios tienen el prefijo "Bs." y los descuentos el sufijo "%"

### Ejemplo 3: Formulario con Contacto de Emergencia

```typescript
formFields: [
    {
        key: 'contacto_emergencia_nombre',
        label: 'Contacto de Emergencia',
        type: 'text',
        section: 'Emergencia',
        colSpan: 2,
        description: 'Persona a contactar en caso de emergencia',
    },
    {
        key: 'contacto_emergencia_telefono',
        label: 'Teléfono',
        type: 'text',
        section: 'Emergencia',
        colSpan: 1,
        prefix: '📱',
        disabled: (data) => !data.contacto_emergencia_nombre,
        description: 'Solo si hay un contacto registrado',
    },
]
```

**Resultado:**
- El teléfono se deshabilita hasta que se ingrese un nombre de contacto
- Tiene un icono de teléfono como prefijo

---

## 📚 API Reference

### FormField Interface (Nuevas Propiedades)

```typescript
interface FormField<F extends BaseFormData> {
    // ... propiedades existentes ...

    // 🆕 Visibilidad y control
    hidden?: boolean;
    visible?: (data: F) => boolean;
    disabled?: (data: F) => boolean;

    // 🆕 Agrupación y organización
    group?: string;
    section?: string;
    order?: number;
    colSpan?: 1 | 2 | 3 | 4;

    // 🆕 UI/UX mejorado
    description?: string;
    icon?: string;
    prefix?: string;
    suffix?: string;
}
```

### ModuleConfig Interface (Nuevas Propiedades)

```typescript
interface ModuleConfig<T extends BaseEntity, F extends BaseFormData> {
    // ... propiedades existentes ...

    // 🆕 Form sections
    formSections?: FormSection[];

    // 🆕 Form layout
    formLayout?: 'single' | 'two-column' | 'three-column' | 'auto';
}
```

### FormSection Interface

```typescript
interface FormSection {
    id: string;
    title: string;
    description?: string;
    icon?: string;
    collapsible?: boolean;
    defaultCollapsed?: boolean;
    order?: number;
}
```

---

## 🎯 Mejores Prácticas

### 1. Organización de Secciones

**✅ Recomendado:**
```typescript
formSections: [
    { id: 'Datos Personales', title: 'Datos Personales', order: 1 },
    { id: 'Datos Laborales', title: 'Datos Laborales', order: 2 },
    { id: 'Contacto', title: 'Información de Contacto', order: 3 },
]
```

**❌ Evitar:**
- Demasiadas secciones (máx. 5-6)
- Secciones con solo 1-2 campos
- IDs con espacios o caracteres especiales

### 2. Uso de colSpan

**✅ Recomendado:**
```typescript
// Campo importante que necesita espacio
{ key: 'nombre', colSpan: 2 }

// Campo de texto largo
{ key: 'descripcion', type: 'textarea', colSpan: 3 }

// Campos relacionados en la misma fila
{ key: 'precio', colSpan: 1 }
{ key: 'descuento', colSpan: 1 }
{ key: 'total', colSpan: 1 }
```

**❌ Evitar:**
- Usar colSpan: 3 en todos los campos (pierde el beneficio del grid)
- Mezclar colSpan sin planificación (puede romper el layout)

### 3. Visibilidad Condicional

**✅ Recomendado:**
```typescript
// Condiciones simples y claras
visible: (data) => !!data.puede_acceder_sistema

// Múltiples condiciones
visible: (data) => data.tipo === 'empleado' && data.departamento === 'Ventas'
```

**❌ Evitar:**
```typescript
// Lógica compleja en visible
visible: (data) => {
    // 20 líneas de código complejo...
    return resultado;
}

// Mejor: mover a una función externa
const shouldShowField = (data: F) => {
    // lógica compleja
    return resultado;
};

visible: shouldShowField
```

### 4. Descripciones

**✅ Recomendado:**
```typescript
description: 'Se genera automáticamente si se deja vacío'
description: 'Formato: +591 70123456'
description: 'Este campo es opcional'
```

**❌ Evitar:**
```typescript
description: 'Campo para ingresar el nombre completo del empleado incluyendo apellido paterno y materno' // Muy largo
description: 'Nombre' // Redundante con el label
```

### 5. Prefijos y Sufijos

**✅ Recomendado:**
```typescript
prefix: 'Bs.'
prefix: '$'
suffix: '%'
suffix: 'kg'
prefix: '📱' // Iconos simples
```

**❌ Evitar:**
```typescript
prefix: 'Precio en Bolivianos:' // Muy largo
suffix: ' porciento' // Usar '%' en su lugar
```

---

## 🔧 Troubleshooting

### Problema: Los campos no se muestran en el orden esperado

**Solución:**
Asegúrate de que todos los campos tengan la propiedad `section` asignada. Los campos sin sección irán a 'default' y aparecerán al final.

### Problema: El grid no se ve responsive

**Solución:**
Verifica que estés usando Tailwind CSS correctamente. El grid es responsive por defecto:
- `grid-cols-1` en móvil
- `sm:grid-cols-2` en tablet
- `lg:grid-cols-3` en desktop

### Problema: La función `visible` no funciona

**Solución:**
- Verifica que la función retorne un boolean
- Asegúrate de que los campos referenciados existan en `data`
- Revisa la consola del navegador por errores

### Problema: Los prefijos/sufijos no se ven bien

**Solución:**
- Usa prefijos/sufijos cortos (máx. 5 caracteres)
- Para iconos, usa emojis o clases de iconos simples
- Revisa el CSS de tu proyecto

---

## 🚀 Próximas Características

Características en desarrollo para futuras versiones:

- 🔄 **Secciones colapsables**: Poder colapsar/expandir secciones
- 📑 **Tabs**: Organizar secciones en pestañas
- 🎨 **Temas personalizables**: Colores y estilos por módulo
- 📝 **Validaciones visuales en tiempo real**: Feedback instantáneo
- 🔍 **Búsqueda de campos**: Para formularios muy largos
- 💾 **Autoguardado**: Guardar cambios automáticamente
- 📸 **Campo de cámara**: Capturar fotos directamente
- 🗺️ **Campo de ubicación**: Selector de mapa integrado

---

## 📞 Soporte

Si tienes preguntas o encuentras problemas:

1. Revisa este documento
2. Consulta el archivo de ejemplo: `empleados.config.EXAMPLE.ts`
3. Revisa el código fuente en:
   - `domain/entities/generic.ts` (tipos)
   - `presentation/components/generic/generic-form-fields.tsx` (renderizado)
   - `presentation/components/generic/generic-form-container.tsx` (contenedor)

---

**¡Disfruta de tus formularios modernos! 🎉**
