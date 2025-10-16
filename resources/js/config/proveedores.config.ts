// Configuration: Proveedores module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Proveedor, ProveedorFormData } from '@/domain/entities/proveedores';
import FileUploadPreview from '@/presentation/components/generic/FileUploadPreview';
import MapPicker from '@/presentation/components/maps/MapPicker';
import { createElement } from 'react';

export const proveedoresConfig: ModuleConfig<Proveedor, ProveedorFormData> = {
    // Module identification
    moduleName: 'proveedores',
    singularName: 'proveedor',
    pluralName: 'proveedores',

    // Display configuration
    displayName: 'Proveedores',
    description: 'Gestiona los proveedores de productos',

    // Table configuration
    tableColumns: [
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'nombre', label: 'Nombre', type: 'text' },
        { key: 'razon_social', label: 'Razon Social', type: 'text' },
        { key: 'nit', label: 'N° Documento', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'activo', label: 'Estado', type: 'boolean' },
    ],

    // Form configuration
    formFields: [
        {
            key: 'nombre',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Nombre del proveedor',
            validation: { maxLength: 255 },
        },
        {
            key: 'razon_social',
            label: 'Razon Social',
            type: 'text',
            placeholder: 'Razon social',
            validation: { maxLength: 255 },
        },
        {
            key: 'nit',
            label: 'N° Documento',
            type: 'text',
            required: false,
            placeholder: '20123456789',
            validation: { maxLength: 255 },
        },
        {
            key: 'telefono',
            label: 'Teléfono',
            type: 'text',
            placeholder: '(01) 234-5678',
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'proveedor@empresa.com',
        },
        {
            key: 'direccion',
            label: 'Dirección',
            type: 'textarea',
            placeholder: 'Dirección completa del proveedor',
        },
        {
            key: 'contacto',
            label: 'Persona de Contacto',
            type: 'text',
            placeholder: 'Nombre del contacto principal',
        },
        // Campo personalizado para ubicación en mapa
        {
            key: 'coordenadas',
            label: 'Ubicación en el mapa',
            type: 'custom',
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
                    label: 'Ubicación del proveedor',
                    description: 'Selecciona la ubicación del proveedor en el mapa',
                    disabled: Boolean(disabled),
                    height: '350px'
                });
            }
        },
        {
            key: 'foto_perfil',
            label: 'Foto de perfil (opcional)',
            type: 'file',
            render: ({ value, onChange, label, disabled }) =>
                createElement(FileUploadPreview, {
                    label,
                    name: 'foto_perfil',
                    value: value as File | string | null,
                    onChange: onChange as (file: File | null) => void,
                    previewType: 'circle',
                    disabled,
                }),
        },
        {
            key: 'ci_anverso',
            label: 'CI - Anverso (opcional)',
            type: 'file',
            render: ({ value, onChange, label, disabled }) =>
                createElement(FileUploadPreview, {
                    label,
                    name: 'ci_anverso',
                    value: value as File | string | null,
                    onChange: onChange as (file: File | null) => void,
                    previewType: 'rect',
                    disabled,
                }),
        },
        {
            key: 'ci_reverso',
            label: 'CI - Reverso (opcional)',
            type: 'file',
            render: ({ value, onChange, label, disabled }) =>
                createElement(FileUploadPreview, {
                    label,
                    name: 'ci_reverso',
                    value: value as File | string | null,
                    onChange: onChange as (file: File | null) => void,
                    previewType: 'rect',
                    disabled,
                }),
        },
        {
            key: 'activo',
            label: 'Proveedor activo',
            type: 'boolean',
        },
    ],

    // Search configuration
    searchableFields: ['nombre', 'razon_social', 'nit', 'email', 'telefono'],
    searchPlaceholder: 'Buscar proveedores...',

    // Modern Index filters configuration
    indexFilters: {
        filters: [
            {
                key: 'activo',
                label: 'Estado',
                type: 'boolean',
                placeholder: 'Todos los estados',
                width: 'sm'
            },
            {
                key: 'tipo_proveedor',
                label: 'Tipo de proveedor',
                type: 'select',
                placeholder: 'Todos los tipos',
                options: [
                    { value: 'local', label: 'Local' },
                    { value: 'nacional', label: 'Nacional' },
                    { value: 'internacional', label: 'Internacional' }
                ],
                width: 'md'
            },
            {
                key: 'tiene_contacto',
                label: 'Con contacto',
                type: 'boolean',
                placeholder: 'Todos',
                width: 'sm'
            }
        ],
        sortOptions: [
            { value: 'id', label: 'ID' },
            { value: 'nombre', label: 'Nombre' },
            { value: 'razon_social', label: 'Razón Social' },
            { value: 'created_at', label: 'Fecha registro' },
            { value: 'updated_at', label: 'Última actualización' }
        ],
        defaultSort: { field: 'nombre', direction: 'asc' },
        layout: 'grid'
    },

    // Legacy support (deprecated)
    showIndexFilters: true,
};
