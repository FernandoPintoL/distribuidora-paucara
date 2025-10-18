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
        /* {
            id: 'Compensación',
            title: 'Compensación',
            description: 'Salarios y bonos',
            order: 2,
            
        },
        {
            id: 'Información Laboral',
            title: 'Información Laboral',
            description: 'Datos relacionados con el trabajo',
            order: 3,
        }, */
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
        // { key: 'cargo', label: 'Cargo', type: 'text' },
        // { key: 'departamento', label: 'Departamento', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        // { key: 'salario_base', label: 'Salario Base', type: 'number' },
        { key: 'estado', label: 'Estado', type: 'text' },
        { key: 'puede_acceder_sistema', label: 'Acceso Sistema', type: 'boolean' },
    ],

    // Form configuration
    formFields: [
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
            key: 'codigo_empleado',
            label: 'Código de Empleado',
            type: 'text',
            placeholder: 'Se genera automáticamente si se deja vacío',
            validation: { maxLength: 20 },
            hidden: true, // 🆕 OCULTO - Lo genera el backend
        },
        {
            key: 'cargo',
            label: 'Cargo',
            type: 'text',
            required: false, // 🆕 Ya no es requerido
            placeholder: 'Cargo que desempeña',
            validation: { maxLength: 100 },
            hidden: true, // 🆕 OCULTO - No necesario por ahora
        },
        {
            key: 'departamento',
            label: 'Departamento',
            type: 'text',
            required: false, // 🆕 Ya no es requerido
            placeholder: 'Departamento de trabajo',
            validation: { maxLength: 100 },
            hidden: true, // 🆕 OCULTO - No necesario por ahora
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
            key: 'fecha_nacimiento',
            label: 'Fecha de Nacimiento',
            type: 'date',
            hidden: true, // 🆕 OCULTO - No necesario por ahora
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
            key: 'salario_base',
            label: 'Salario Base',
            type: 'number',
            required: false,
            placeholder: '0.00',
            validation: { min: 0 },
            colSpan: 1,
            section: 'Compensación',
            prefix: 'Bs.', // 🆕 Prefijo de bolivianos
            description: 'Salario base mensual en bolivianos',
            hidden: true, // 🆕 OCULTO - Se maneja internamente
        },
        {
            key: 'bonos',
            label: 'Bonos',
            type: 'number',
            placeholder: '0.00',
            validation: { min: 0 },
            colSpan: 1,
            section: 'Compensación',
            prefix: 'Bs.', // 🆕 Prefijo de bolivianos
            description: 'Bonos adicionales mensuales',
            hidden: true, // 🆕 OCULTO - Se maneja internamente
        },
        {
            key: 'tipo_contrato',
            label: 'Tipo de Contrato',
            type: 'select',
            required: true,
            options: [
                { value: 'indefinido', label: 'Indefinido' },
                { value: 'temporal', label: 'Temporal' },
                { value: 'practicante', label: 'Practicante' },
                { value: 'consultor', label: 'Consultor' },
            ],
            colSpan: 1,
            section: 'Información Laboral',
            hidden: true, // 🆕 OCULTO - No necesario por ahora
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
        {
            key: 'supervisor_id',
            label: 'Supervisor',
            type: 'select',
            options: [], // Se cargará dinámicamente desde el backend
            placeholder: 'Seleccionar supervisor',
            colSpan: 1,
            section: 'Información Laboral',
            description: 'Supervisor directo del empleado',
            hidden: true, // 🆕 OCULTO - No necesario por ahora
        },
        {
            key: 'observaciones',
            label: 'Observaciones',
            type: 'textarea',
            placeholder: 'Notas adicionales sobre el empleado',
            validation: { maxLength: 1000 },
            colSpan: 3, // 🆕 Ocupa todo el ancho
            section: 'Información Laboral',
            hidden: true, // 🆕 OCULTO - No necesario por ahora
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
    ],

    // Search configuration
    searchableFields: ['nombre', 'ci', 'codigo_empleado', 'cargo', 'departamento', 'email'],
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