// Configuration: Empleados module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Empleado, EmpleadoFormData } from '@/domain/entities/empleados';
import MapPicker from '@/presentation/components/maps/MapPicker';
import { createElement } from 'react';

export const empleadosConfig: ModuleConfig<Empleado, EmpleadoFormData> = {
    // Module identification
    moduleName: 'empleados',
    singularName: 'empleado',
    pluralName: 'empleados',

    // Display configuration
    displayName: 'Empleados',
    description: 'Gestiona los empleados de la empresa',

    // 🆕 Form sections (organizar campos en secciones)
    formSections: [
        {
            id: 'Información Personal',
            title: 'Información Personal',
            description: 'Datos personales del empleado',
            order: 1,
        },
        {
            id: 'Acceso al Sistema',
            title: 'Acceso al Sistema',
            description: 'Configuración de acceso',
            order: 4,
        },
    ],

    // 🆕 Form layout (controla el diseño del formulario)
    formLayout: 'auto', // Responsive automático

    // Table configuration
    tableColumns: [
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'codigo_empleado', label: 'Código', type: 'text' },
        { key: 'nombre', label: 'Nombre Completo', type: 'text' },
        { key: 'ci', label: 'CI', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'estado', label: 'Estado', type: 'text' },
        { key: 'puede_acceder_sistema', label: 'Acceso Sistema', type: 'boolean' },
    ],

    // Form configuration
    formFields: [
        {
            key: 'codigo_empleado',
            label: 'Código de Empleado',
            type: 'text',
            placeholder: 'Se genera automáticamente si se deja vacío',
            visible: (data) => !!data.id, // Solo visible si tiene ID (modo edición)
            section: 'Información Personal',
        },
        {
            key: 'nombre',
            label: 'Nombre Completo',
            type: 'text',
            required: true,
            placeholder: 'Nombre completo del empleado',
            validation: { maxLength: 255 },
            colSpan: 2, // 🆕 Ocupa 2 columnas
            section: 'Información Personal',
            description: 'Nombre completo como aparece en su CI',
        },
        {
            key: 'ci',
            label: 'Cédula de Identidad',
            type: 'text',
            required: true,
            placeholder: 'Número de cédula de identidad',
            validation: { minLength: 6, maxLength: 15 },
            colSpan: 1,
            section: 'Información Personal',
        },
        {
            key: 'fecha_ingreso',
            label: 'Fecha de Ingreso',
            type: 'date',
            required: true,
            colSpan: 1,
            section: 'Información Personal',
        },
        {
            key: 'telefono',
            label: 'Teléfono',
            type: 'text',
            placeholder: 'Número de teléfono',
            validation: { maxLength: 20 },
            colSpan: 1,
            section: 'Información Personal',
            prefix: '📱', // 🆕 Icono de teléfono
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text',
            required: false, // 🆕 Email es opcional (se puede usar nick o teléfono para login)
            placeholder: 'Correo electrónico (opcional)',
            validation: { maxLength: 255 },
            colSpan: 1,
            section: 'Información Personal',
            prefix: '✉️', // 🆕 Icono de email
            description: 'Opcional - Se puede usar nick o teléfono para acceder',
        },
        {
            key: 'direccion',
            label: 'Dirección',
            type: 'textarea',
            placeholder: 'Dirección completa',
            validation: { maxLength: 500 },
            colSpan: 3, // 🆕 Ocupa todo el ancho
            section: 'Información Personal',
        },
        // Campo personalizado para ubicación en mapa
        {
            key: 'coordenadas',
            hidden: true, // Campo oculto, se maneja internamente
            label: 'Ubicación en el mapa',
            type: 'custom',
            colSpan: 3,
            fullWidth: true, // 🆕 Ocupa TODO el ancho de la pantalla
            section: 'Información Personal',
            render: ({ value, onChange, disabled, formData }) => {
                // formData contiene latitud y longitud separados
                const latitud = (formData as any)?.latitud;
                const longitud = (formData as any)?.longitud;

                return createElement(MapPicker, {
                    latitude: latitud,
                    longitude: longitud,
                    onLocationSelect: (lat: number, lng: number, address?: string) => {
                        // Actualizar los campos latitud y longitud
                        onChange({ latitud: lat, longitud: lng, address });
                    },
                    label: 'Ubicación del empleado',
                    description: 'Selecciona la ubicación del empleado en el mapa',
                    disabled: Boolean(disabled),
                    height: '350px'
                });
            }
        },
        {
            key: 'estado',
            label: 'Estado',
            type: 'select',
            required: true,
            options: [
                { value: 'activo', label: 'Activo' },
                { value: 'inactivo', label: 'Inactivo' },
                { value: 'vacaciones', label: 'Vacaciones' },
                { value: 'licencia', label: 'Licencia' },
                { value: 'suspendido', label: 'Suspendido' },
            ],
            colSpan: 1,
            section: 'Información Laboral',
            hidden: true, // 🆕 OCULTO - Se maneja internamente
            defaultValue: 'activo', // 🆕 Por defecto activo al crear
        },
        // Campos de acceso al sistema
        {
            key: 'puede_acceder_sistema',
            label: 'Puede Acceder al Sistema',
            type: 'boolean',
            colSpan: 3,
            section: 'Acceso al Sistema',
            description: 'Habilitar para crear un usuario de sistema',
        },
        {
            key: 'usernick',
            label: 'Nombre de Usuario (Nick)',
            type: 'text',
            required: true, // 🆕 Requerido cuando puede acceder al sistema
            placeholder: 'Nick para iniciar sesión',
            validation: { maxLength: 50 },
            colSpan: 1,
            section: 'Acceso al Sistema',
            visible: (data) => !!data.puede_acceder_sistema, // 🆕 Solo visible si puede_acceder_sistema es true
            description: 'Requerido para login - Se puede usar nick o teléfono',
        },
        {
            key: 'roles',
            label: 'Roles de Sistema',
            type: 'multiselect',
            options: [], // Se cargará dinámicamente desde el backend
            colSpan: 2,
            section: 'Acceso al Sistema',
            visible: (data) => !!data.puede_acceder_sistema, // 🆕 Solo visible si puede_acceder_sistema es true
            description: 'Selecciona uno o más roles que tendrá el empleado',
            maxSelections: 5, // Máximo 5 roles por empleado
        },
        // Campos de contraseña
        {
            key: 'password',
            label: 'Contraseña',
            type: 'password',
            required: (data) => {
                // Requerido solo cuando se crea un nuevo empleado con acceso al sistema
                return !!data.puede_acceder_sistema && !data.id;
            },
            placeholder: (data) => {
                // Placeholder diferente según si es creación o edición
                return data.id
                    ? 'Dejar vacío para mantener la contraseña actual'
                    : 'Mínimo 8 caracteres';
            },
            validation: { minLength: 8 },
            colSpan: 1,
            section: 'Acceso al Sistema',
            visible: (data) => {
                // Visible si puede acceder al sistema
                return !!data.puede_acceder_sistema;
            },
            description: (data) => {
                return data.id
                    ? 'Mínimo 8 caracteres. Dejar vacío para no cambiar'
                    : 'Mínimo 8 caracteres';
            },
        },
        {
            key: 'password_confirmation',
            label: 'Confirmar Contraseña',
            type: 'password',
            required: (data) => {
                // Requerido solo si se está creando un nuevo empleado con acceso al sistema
                // O si se está cambiando la contraseña en edición
                return !!data.puede_acceder_sistema && (!data.id || !!data.password);
            },
            placeholder: 'Repetir la contraseña',
            colSpan: 1,
            section: 'Acceso al Sistema',
            visible: (data) => {
                // Visible si puede acceder al sistema
                return !!data.puede_acceder_sistema;
            },
            description: 'Debe coincidir con la contraseña',
        },
    ],

    // Search configuration
    searchableFields: ['nombre', 'ci', 'codigo_empleado', 'cargo', 'email'],
    searchPlaceholder: 'Buscar empleados por nombre, CI, código...',

    // 🆕 Modern index filters configuration (like productos)
    indexFilters: {
        filters: [
            {
                key: 'puede_acceder_sistema',
                label: 'Acceso al Sistema',
                type: 'boolean' as const,
                placeholder: 'Todos',
                width: 'md' as const,
            },
            {
                key: 'estado',
                label: 'Estado',
                type: 'select' as const,
                placeholder: 'Todos los estados',
                options: [
                    { value: 'activo', label: 'Activo' },
                    { value: 'inactivo', label: 'Inactivo' },
                    { value: 'vacaciones', label: 'Vacaciones' },
                    { value: 'licencia', label: 'Licencia' },
                    { value: 'suspendido', label: 'Suspendido' },
                ],
                width: 'md' as const,
            },
        ],
        sortOptions: [
            { value: 'id', label: 'ID' },
            { value: 'nombre', label: 'Nombre' },
            { value: 'codigo_empleado', label: 'Código de Empleado' },
            { value: 'ci', label: 'Cédula de Identidad' },
            { value: 'fecha_ingreso', label: 'Fecha de Ingreso' },
            { value: 'created_at', label: 'Fecha de Registro' },
        ],
        defaultSort: { field: 'nombre', direction: 'asc' as const },
        layout: 'grid' as const,
    },
};