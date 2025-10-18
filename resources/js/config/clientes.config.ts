// Configuration: Clientes module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Cliente, ClienteFormData } from '@/domain/entities/clientes';
import FileUploadPreview from '@/presentation/components/generic/FileUploadPreview';
import MapPickerWithLocations from '@/presentation/components/maps/MapPickerWithLocations';
import React, { createElement } from 'react';

export const clientesConfig: ModuleConfig<Cliente, ClienteFormData> = {
    // Module identification
    moduleName: 'clientes',
    singularName: 'cliente',
    pluralName: 'clientes',

    // Display configuration
    displayName: 'Clientes',
    description: 'Gestiona los clientes',

    // 🆕 Form sections (organizar campos en secciones)
    formSections: [
        {
            id: 'Información Personal',
            title: 'Información Personal',
            description: 'Datos básicos del cliente',
            order: 1,
        },
        {
            id: 'Direcciones',
            title: 'Direcciones',
            description: 'Localidad y dirección de entrega',
            order: 2,
        },
        {
            id: 'Fotos',
            title: 'Fotos',
            description: 'Imágenes y documentos del cliente',
            order: 3,
        },
    ],

    // 🆕 Form layout (controla el diseño del formulario)
    formLayout: 'auto', // Responsive automático

    // Table configuration
    tableColumns: [
        { key: 'id', label: 'ID', type: 'number' },
        { key: 'codigo_cliente', label: 'Código', type: 'text' },
        { key: 'nombre', label: 'Nombre', type: 'text' },
        { key: 'razon_social', label: 'Razon Social', type: 'text' },
        { key: 'nit', label: 'N° Documento', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'localidad.nombre', label: 'Localidad', type: 'text' },
        { key: 'activo', label: 'Estado', type: 'boolean' },
    ],

    // Form configuration
    formFields: [
        // 📋 Código de cliente - Solo visible en modo EDICIÓN
        {
            key: 'codigo_cliente',
            label: 'Código de Cliente',
            type: 'text',
            visible: (data) => !!data.id, // Solo visible si tiene ID (modo edición)
            disabled: () => true, // Siempre deshabilitado (solo lectura)
            placeholder: 'Se genera automáticamente',
            colSpan: 1,
            section: 'Información Personal',
            description: 'Código único generado automáticamente basado en la localidad',
            prefix: '#',
        },
        {
            key: 'nombre',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Nombre del cliente',
            validation: { maxLength: 255 },
            colSpan: 2, // 🆕 Ocupa 2 columnas
            section: 'Información Personal',
            description: 'Nombre completo o razón social del cliente',
        },
        {
            key: 'razon_social',
            label: 'Razón Social',
            type: 'text',
            placeholder: 'Razón social',
            validation: { maxLength: 255 },
            colSpan: 1,
            section: 'Información Personal',
        },
        {
            key: 'nit',
            label: 'NIT / N° Documento',
            type: 'text',
            required: false,
            placeholder: '20123456789',
            validation: { maxLength: 255 },
            colSpan: 1,
            section: 'Información Personal',
            prefix: '🆔',
        },
        {
            key: 'telefono',
            label: 'Teléfono',
            type: 'text',
            placeholder: '(01) 234-5678',
            colSpan: 1,
            section: 'Información Personal',
            prefix: '📱',
        },
        {
            key: 'email',
            label: 'Email',
            type: 'text',
            placeholder: 'cliente@empresa.com',
            colSpan: 1,
            section: 'Información Personal',
            prefix: '✉️',
        },
        // ✅ Estado activo - Solo visible en modo EDICIÓN
        {
            key: 'activo',
            label: 'Cliente activo',
            type: 'boolean',
            visible: (data) => !!data.id, // Solo visible si tiene ID (modo edición)
            defaultValue: true,
            colSpan: 1,
            section: 'Información Personal',
            description: 'Marcar como activo para poder realizar ventas',
        },
        // 📍 SECCIÓN DE DIRECCIONES
        {
            key: 'localidad_id',
            label: 'Localidad',
            type: 'select',
            required: true,
            placeholder: 'Seleccione una localidad',
            extraDataKey: 'localidades',
            options: [], // Se cargarán dinámicamente
            colSpan: 3,
            section: 'Direcciones',
            description: 'Selecciona la localidad donde reside el cliente',
        },
        // Campo personalizado para ubicaciones en el mapa con modal
        {
            key: 'direcciones',
            label: 'Ubicaciones del cliente',
            type: 'custom',
            fullWidth: true, // Ocupa TODO el ancho de la pantalla
            section: 'Direcciones',
            render: ({ value, onChange, disabled }) => {
                // value es un array de DireccionData
                const addresses = Array.isArray(value) ? value : [];

                return createElement(MapPickerWithLocations, {
                    addresses: addresses,
                    onAddressesChange: (newAddresses: any[]) => {
                        onChange(newAddresses);
                    },
                    label: 'Ubicaciones del cliente',
                    description: 'Haz clic en el mapa para agregar una nueva ubicación o en un marcador para editarla',
                    disabled: Boolean(disabled),
                    height: '450px'
                });
            }
        },
        // 📷 SECCIÓN DE FOTOS
        {
            key: 'foto_perfil',
            label: 'Foto de perfil (opcional)',
            type: 'file',
            colSpan: 3,
            section: 'Fotos',
            description: 'Foto del cliente o logo de la empresa',
            render: ({ value, onChange, label, disabled, formData }) => {
                // Buscar el campo _preview si existe (para modo edición)
                const previewUrl = (formData as any)?.foto_perfil_preview || null;
                return createElement(FileUploadPreview, {
                    label,
                    name: 'foto_perfil',
                    value: value as File | string | null,
                    previewUrl: previewUrl as string | null,
                    onChange: onChange as (file: File | null) => void,
                    previewType: 'circle',
                    disabled,
                });
            },
        },
        {
            key: 'ci_anverso',
            label: 'CI - Anverso (opcional)',
            type: 'file',
            colSpan: 1,
            section: 'Fotos',
            description: 'Anverso del carnet de identidad',
            render: ({ value, onChange, label, disabled, formData }) => {
                // Buscar el campo _preview si existe (para modo edición)
                const previewUrl = (formData as any)?.ci_anverso_preview || null;
                return createElement(FileUploadPreview, {
                    label,
                    name: 'ci_anverso',
                    value: value as File | string | null,
                    previewUrl: previewUrl as string | null,
                    onChange: onChange as (file: File | null) => void,
                    previewType: 'rect',
                    disabled,
                });
            },
        },
        {
            key: 'ci_reverso',
            label: 'CI - Reverso (opcional)',
            type: 'file',
            colSpan: 1,
            section: 'Fotos',
            description: 'Reverso del carnet de identidad',
            render: ({ value, onChange, label, disabled, formData }) => {
                // Buscar el campo _preview si existe (para modo edición)
                const previewUrl = (formData as any)?.ci_reverso_preview || null;
                return createElement(FileUploadPreview, {
                    label,
                    name: 'ci_reverso',
                    value: value as File | string | null,
                    previewUrl: previewUrl as string | null,
                    onChange: onChange as (file: File | null) => void,
                    previewType: 'rect',
                    disabled,
                });
            },
        },
    ],

    // Search configuration
    searchableFields: ['codigo_cliente', 'nombre', 'razon_social', 'nit', 'email', 'telefono'],
    searchPlaceholder: 'Buscar clientes...',

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
                key: 'localidad_id',
                label: 'Localidad del cliente',
                type: 'select',
                placeholder: 'Todas las localidades',
                extraDataKey: 'localidades',
                width: 'md'
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
