// Configuration: Tipos de precio module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { TipoPrecio, TipoPrecioFormData } from '@/domain/entities/tipos-precio';
import React from 'react';

export const tiposPrecioConfig: ModuleConfig<TipoPrecio, TipoPrecioFormData> = {
    // Module identification
    moduleName: 'tipos-precio',
    singularName: 'tipo de precio',
    pluralName: 'tipos de precio',

    // Display configuration
    displayName: 'Tipos de Precio',
    description: 'Gestiona los tipos de precio para tus productos',

    // Table configuration
    tableColumns: [
        { key: 'id', label: 'ID', type: 'number' },
        {
            key: 'nombre',
            label: 'Nombre',
            type: 'text',
            render: (value: string, entity: TipoPrecio) =>
                React.createElement(
                    'div',
                    {
                        className: 'flex items-center gap-2 text-white',
                    },
                    [
                        entity.configuracion?.icono &&
                            React.createElement(
                                'span',
                                {
                                    key: 'icon',
                                    className: 'text-lg',
                                },
                                entity.configuracion.icono,
                            ),
                        React.createElement('div', { key: 'content' }, [
                            React.createElement(
                                'div',
                                {
                                    key: 'name',
                                    className: 'font-medium text-gray-900',
                                },
                                value,
                            ),
                            React.createElement(
                                'div',
                                {
                                    key: 'code',
                                    className: 'text-xs text-gray-500',
                                },
                                entity.codigo,
                            ),
                        ]),
                    ],
                ),
        },
        {
            key: 'descripcion',
            label: 'Descripción',
            type: 'text',
            render: (value: string) =>
                React.createElement(
                    'span',
                    {
                        className: 'text-gray-600 text-sm',
                    },
                    value || 'Sin descripción',
                ),
        },
        // porcentaje de ganancia
        {
            key: 'porcentaje_ganancia',
            label: 'Porcentaje de Ganancia',
            type: 'number',
            render: (value: number) =>
                React.createElement(
                    'span',
                    {
                        className: 'text-gray-600 text-sm',
                    },
                    value ? `${value}%` : 'Sin porcentaje',
                ),
        },
        {
            key: 'color',
            label: 'Tipo',
            type: 'text',
            render: (value: string, entity: TipoPrecio) => {
                const getColorClass = (color: string) => {
                    const colorMap: Record<string, string> = {
                        blue: 'bg-blue-100 text-blue-800 border-blue-200',
                        green: 'bg-green-100 text-green-800 border-green-200',
                        purple: 'bg-purple-100 text-purple-800 border-purple-200',
                        orange: 'bg-orange-100 text-orange-800 border-orange-200',
                        red: 'bg-red-100 text-red-800 border-red-200',
                        indigo: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                        pink: 'bg-pink-100 text-pink-800 border-pink-200',
                        yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
                        gray: 'bg-gray-100 text-gray-800 border-gray-200',
                        teal: 'bg-teal-100 text-teal-800 border-teal-200',
                    };
                    return colorMap[color] || colorMap.gray;
                };

                return React.createElement(
                    'span',
                    {
                        className: `inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${getColorClass(value)}`,
                    },
                    [
                        React.createElement('span', {
                            key: 'dot',
                            className: `w-1.5 h-1.5 rounded-full mr-1.5 bg-${value}-500`,
                        }),
                        entity.es_ganancia ? '💰 Ganancia' : '📦 Costo Base',
                    ],
                );
            },
        },
        {
            key: 'orden',
            label: 'Orden',
            type: 'number',
            render: (value: number) =>
                React.createElement(
                    'span',
                    {
                        className: 'inline-flex items-center justify-center w-8 h-8 bg-gray-100 text-gray-700 rounded-full text-sm font-medium',
                    },
                    value,
                ),
        },
        {
            key: 'precios_count',
            label: 'Productos',
            type: 'number',
            render: (value: number) =>
                React.createElement(
                    'span',
                    {
                        className:
                            'inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800 border border-gray-200',
                    },
                    `${value} productos`,
                ),
        },
        { key: 'activo', label: 'Estado', type: 'boolean' },
    ],

    // Form configuration
    formFields: [
        {
            key: 'nombre',
            label: 'Nombre',
            type: 'text',
            required: true,
            placeholder: 'Ej: Precio de Venta, Precio Mayorista',
            validation: { maxLength: 100 },
        },
        {
            key: 'codigo',
            label: 'Código',
            type: 'text',
            required: true,
            placeholder: 'Ej: VENTA, MAYORISTA',
            validation: { maxLength: 50 },
        },
        {
            key: 'descripcion',
            label: 'Descripción',
            type: 'textarea',
            placeholder: 'Descripción opcional del tipo de precio',
        },
        //porcentaje de ganacia
        {
            key: 'porcentaje_ganancia',
            label: 'Porcentaje de Ganancia',
            type: 'number',
            placeholder: 'Porcentaje de ganancia (opcional)',
        },
        {
            key: 'color',
            label: 'Color',
            type: 'select',
            required: true,
            placeholder: 'Seleccione un color',
        },
        {
            key: 'orden',
            label: 'Orden de visualización',
            type: 'number',
            required: true,
            placeholder: 'Número para ordenar (1, 2, 3...)',
        },
        {
            key: 'es_ganancia',
            label: 'Es tipo de ganancia',
            type: 'boolean',
        },
        {
            key: 'es_precio_base',
            label: 'Es precio base',
            type: 'boolean',
        },
        {
            key: 'activo',
            label: 'Activo',
            type: 'boolean',
        },
    ],

    // Search configuration
    searchableFields: ['nombre', 'codigo', 'descripcion'],
    searchPlaceholder: 'Buscar tipos de precio...',
};
