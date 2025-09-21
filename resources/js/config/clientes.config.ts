// Configuration: Clientes module configuration
import type { ModuleConfig } from '@/domain/generic';
import type { Cliente, ClienteFormData } from '@/domain/clientes';
import FileUploadPreview from '@/components/generic/FileUploadPreview';
import React, { createElement } from 'react';

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
            key: 'localidad_id',
            label: 'Localidad',
            type: 'select',
            required: true,
            placeholder: 'Seleccione una localidad',
            extraDataKey: 'localidades',
            options: [], // Se cargarán dinámicamente
        },
        /* {
            key: 'latitud',
            label: 'Latitud',
            type: 'number',
            placeholder: '-17.7833',
        },
        {
            key: 'longitud',
            label: 'Longitud',
            type: 'number',
            placeholder: '-63.1833',
        }, */
        {
            key: 'activo',
            label: 'Cliente activo',
            type: 'boolean',
        },
        // Campo personalizado para manejar una única dirección simplificada
        {
            key: 'direcciones',
            label: 'Dirección de entrega / domicilio',
            type: 'custom',
            render: ({ value, onChange, label, disabled }) => {
                const items = Array.isArray(value) ? value : [];
                const addr = items[0] || null;

                const setSingle = (newAddr: { [k: string]: unknown } | null) => {
                    if (newAddr === null) {
                        onChange([]);
                    } else {
                        // always ensure the single address is principal and active
                        onChange([{ ...newAddr, es_principal: true, activa: true }]);
                    }
                };

                const handleField = (field: string, v: string | boolean) => {
                    const newAddr = {
                        direccion: addr?.direccion || '',
                        observaciones: addr?.observaciones || '',
                        ...addr,
                        [field]: v,
                    };
                    setSingle(newAddr);
                };

                // If there's no address, show compact empty state with add button
                if (!addr) {
                    return createElement('div', { className: 'space-y-2' },
                        createElement('label', { className: 'text-sm font-medium block' }, label),
                        createElement('div', { className: 'p-4 border rounded-md bg-white flex items-center justify-between' },
                            createElement('span', { className: 'text-sm text-muted-foreground' }, 'No hay dirección. Puedes agregar una dirección para el cliente.'),
                            createElement('button', {
                                type: 'button',
                                onClick: () => setSingle({ direccion: '', observaciones: '' }),
                                className: 'text-blue-600'
                            }, 'Agregar dirección')
                        )
                    );
                }

                // Render simplified card for the single address (only direccion & observaciones)
                return createElement('div', { className: 'space-y-3' },
                    createElement('label', { className: 'text-sm font-medium block' }, label),
                    createElement('div', { className: 'p-4 border rounded-lg bg-white shadow-sm' },
                        createElement('div', { className: 'mb-3' },
                            createElement('input', {
                                className: 'w-full p-3 border rounded-md text-sm',
                                placeholder: 'Dirección (calle, número, referencia)',
                                value: addr.direccion || '',
                                onChange: (e: React.ChangeEvent<HTMLInputElement>) => handleField('direccion', e.target.value),
                                disabled: Boolean(disabled)
                            })
                        ),
                        createElement('div', { className: 'mb-3' },
                            createElement('textarea', {
                                className: 'w-full p-3 border rounded-md text-sm',
                                placeholder: 'Observaciones (p. ej. referencia de entrega)',
                                value: addr.observaciones || '',
                                onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => handleField('observaciones', e.target.value),
                                rows: 3,
                                disabled: Boolean(disabled)
                            })
                        ),
                        createElement('div', { className: 'flex items-center justify-end' },
                            createElement('button', {
                                type: 'button',
                                onClick: () => setSingle(null),
                                className: 'text-red-600 text-sm'
                            }, 'Quitar dirección')
                        )
                    )
                );
            }
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
            },
            {
                key: 'tipo_documento',
                label: 'Tipo de documento',
                type: 'select',
                placeholder: 'Todos los tipos',
                options: [
                    { value: 'ci', label: 'Cédula de Identidad' },
                    { value: 'nit', label: 'NIT' },
                    { value: 'pasaporte', label: 'Pasaporte' },
                    { value: 'ruc', label: 'RUC' }
                ],
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
