// Configuration: Clientes module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Cliente, ClienteFormData } from '@/domain/clientes';
import FileUploadPreview from '@/components/generic/FileUploadPreview';
import { createElement } from 'react';

export const clientesConfig: ModuleConfig<Cliente, ClienteFormData> = {
    // Module identification
    moduleName: 'clientes',
    singularName: 'cliente',
    pluralName: 'clientes',

    // Display configuration
    displayName: 'Clientes',
    description: 'Gestiona los clientes',

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
            placeholder: 'Nombre del cliente',
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
            placeholder: 'cliente@empresa.com',
        },
        {
            key: 'foto_perfil',
            label: 'Foto de perfil (opcional)',
            type: 'file',
            render: ({ value, onChange, label, disabled }) =>
                createElement(FileUploadPreview, {
                    label,
                    name: 'foto_perfil',
                    value,
                    onChange,
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
                    value,
                    onChange,
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
                    value,
                    onChange,
                    previewType: 'rect',
                    disabled,
                }),
        },
        {
            key: 'activo',
            label: 'Cliente activo',
            type: 'boolean',
        },
    ],

    // Search configuration
    searchableFields: ['nombre', 'razon_social', 'nit', 'email', 'telefono'],
    searchPlaceholder: 'Buscar clientes...',

    // Index filters
    showIndexFilters: true,
};
