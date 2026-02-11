// Configuration: Clientes module configuration
import type { ModuleConfig } from '@/domain/entities/generic';
import type { Cliente, ClienteFormData } from '@/domain/entities/clientes';
import FileUploadPreview from '@/presentation/components/generic/FileUploadPreview';
import MapPickerWithLocations from '@/presentation/components/maps/MapPickerWithLocations';
import LocationModal from '@/presentation/components/maps/LocationModal';
import VentanasEntregaSelector from '@/presentation/components/clientes/VentanasEntregaSelector';
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
            id: 'Acceso al Sistema',
            title: 'Acceso al Sistema',
            description: 'Credenciales de usuario para acceso al sistema',
            order: 1.5,
        },
        {
            id: 'Configuración de Crédito',
            title: 'Configuración de Crédito',
            description: 'Control de crédito y límites',
            order: 2,
        },
        {
            id: 'Direcciones',
            title: 'Direcciones',
            description: 'Localidad y dirección de entrega',
            order: 3,
        },
        {
            id: 'Dias de visitas',
            title: 'Días de Visita',
            description: 'Días y horarios en que el cliente prefiere recibir visitas',
            order: 4,
        },
        {
            id: 'Fotos',
            title: 'Fotos',
            description: 'Imágenes y documentos del cliente',
            order: 5,
        },
    ],

    // 🆕 Form layout (controla el diseño del formulario)
    formLayout: 'auto', // Responsive automático

    // Table configuration
    tableColumns: [
        { key: 'id', label: 'ID', type: 'number' },
        {
            key: 'foto_perfil_url',
            label: 'Foto',
            type: 'text',
            render: (value: unknown) => {
                const imageUrl = (value as string | null) || null;
                return createElement('div', { className: 'flex items-center justify-center' },
                    createElement('div', {
                        className: 'w-10 h-10 rounded-full overflow-hidden border-2 border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 flex items-center justify-center relative'
                    },
                        imageUrl
                            ? [
                                createElement('img', {
                                    key: 'image',
                                    src: imageUrl,
                                    alt: 'Perfil',
                                    className: 'w-full h-full object-cover',
                                    onError: (e: any) => {
                                        // Ocultar la imagen y mostrar el icono cuando falle la carga
                                        e.target.style.display = 'none';
                                        const icon = e.target.nextElementSibling;
                                        if (icon) icon.style.display = 'block';
                                    }
                                }),
                                createElement('svg', {
                                    key: 'icon',
                                    className: 'w-6 h-6 text-gray-400',
                                    fill: 'currentColor',
                                    viewBox: '0 0 24 24',
                                    style: { display: 'none' }
                                },
                                    createElement('path', {
                                        d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
                                    })
                                )
                            ]
                            : createElement('svg', {
                                className: 'w-6 h-6 text-gray-400',
                                fill: 'currentColor',
                                viewBox: '0 0 24 24'
                            },
                                createElement('path', {
                                    d: 'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z'
                                })
                            )
                    )
                );
            }
        },
        { key: 'codigo_cliente', label: 'Código', type: 'text' },
        { key: 'nombre', label: 'Nombre', type: 'text' },
        { key: 'razon_social', label: 'Razon Social', type: 'text' },
        { key: 'nit', label: 'N° Documento', type: 'text' },
        { key: 'telefono', label: 'Teléfono', type: 'text' },
        { key: 'email', label: 'Email', type: 'text' },
        { key: 'localidad.nombre', label: 'Localidad', type: 'text' },
        {
            key: 'puede_tener_credito',
            label: 'Crédito',
            type: 'boolean',
            render: (value: unknown, row: any) => {
                if (!value) return createElement('span', { className: 'text-gray-400 text-sm' }, '❌ Deshabilitado');
                return createElement('div', { className: 'flex items-center space-x-1' },
                    createElement('span', { className: 'text-green-600 text-sm' }, '✅ Habilitado'),
                    row.limite_credito ? createElement('span', { className: 'text-blue-600 text-xs' }, `(Límite: Bs. ${parseFloat(row.limite_credito).toFixed(2)})`) : null
                );
            }
        },
        /* {
            key: 'credito_utilizado',
            label: 'Crédito Utilizado',
            type: 'number',
            render: (value: unknown, row: any) => {
                // Solo mostrar si el cliente tiene crédito habilitado
                if (!row.puede_tener_credito) {
                    return createElement('span', { className: 'text-gray-400 text-sm' }, '-');
                }

                const creditoUtilizado = parseFloat(value as string) || 0;
                const limiteCredito = parseFloat(row.limite_credito || '0') || 0;
                const saldoDisponible = limiteCredito - creditoUtilizado;
                const porcentajeUsado = limiteCredito > 0 ? (creditoUtilizado / limiteCredito) * 100 : 0;

                // Determinar color según el porcentaje de uso
                let colorText = 'text-green-600';
                let colorBg = 'bg-green-50 dark:bg-green-950';
                if (porcentajeUsado > 75) {
                    colorText = 'text-red-600 dark:text-red-400';
                    colorBg = 'bg-red-50 dark:bg-red-950';
                } else if (porcentajeUsado > 50) {
                    colorText = 'text-orange-600 dark:text-orange-400';
                    colorBg = 'bg-orange-50 dark:bg-orange-950';
                } else if (porcentajeUsado > 25) {
                    colorText = 'text-yellow-600 dark:text-yellow-400';
                    colorBg = 'bg-yellow-50 dark:bg-yellow-950';
                }

                return createElement('div', { className: `${colorBg} rounded px-2 py-1` },
                    createElement('div', { className: `${colorText} text-sm font-semibold` },
                        `Bs. ${creditoUtilizado.toFixed(2)}`
                    ),
                    createElement('div', { className: 'text-xs text-gray-600 dark:text-gray-400' },
                        `${porcentajeUsado.toFixed(0)}% de Bs. ${limiteCredito.toFixed(2)}`
                    ),
                    saldoDisponible > 0 ? createElement('div', { className: 'text-xs text-green-600 dark:text-green-400 mt-1' },
                        `Disponible: Bs. ${saldoDisponible.toFixed(2)}`
                    ) : createElement('div', { className: 'text-xs text-red-600 dark:text-red-400 mt-1 font-semibold' },
                        `⚠️ Sin crédito disponible`
                    )
                );
            }
        }, */
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
            //disabled: () => true, // Siempre deshabilitado (solo lectura)
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
        // 🔐 SECCIÓN DE ACCESO AL SISTEMA
        {
            key: 'crear_usuario',
            label: 'Crear usuario de acceso al sistema',
            type: 'boolean',
            defaultValue: false,
            colSpan: 3,
            section: 'Acceso al Sistema',
            description: 'Habilita esta opción para crear credenciales de acceso al sistema para este cliente',
        },
        // Campo: Información de usuario existente (solo visible en edición CON usuario)
        {
            key: 'usuario_info',
            label: 'Información del Usuario',
            type: 'custom',
            colSpan: 3,
            section: 'Acceso al Sistema',
            visible: (data) => {
                // Solo visible en modo edición Y si tiene user_id
                return !!data.id && !!data.user_id;
            },
            render: ({ formData }) => {
                const cliente = formData as any;
                const user = cliente.user;

                if (!user) return null;

                return createElement('div', {
                    className: 'rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20 p-4'
                }, [
                    createElement('div', {
                        key: 'header',
                        className: 'flex items-center gap-2 mb-3'
                    }, [
                        createElement('svg', {
                            className: 'w-5 h-5 text-blue-600 dark:text-blue-400',
                            fill: 'currentColor',
                            viewBox: '0 0 20 20'
                        }, createElement('path', {
                            fillRule: 'evenodd',
                            d: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z',
                            clipRule: 'evenodd'
                        })),
                        createElement('h4', {
                            className: 'font-semibold text-blue-900 dark:text-blue-100'
                        }, 'Usuario del Sistema')
                    ]),
                    createElement('div', {
                        key: 'info',
                        className: 'space-y-2 text-sm'
                    }, [
                        createElement('div', { key: 'name', className: 'flex gap-2' }, [
                            createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 min-w-24' }, 'Nombre:'),
                            createElement('span', { className: 'text-gray-900 dark:text-gray-100' }, user.name)
                        ]),
                        createElement('div', { key: 'username', className: 'flex gap-2' }, [
                            createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 min-w-24' }, 'Username:'),
                            createElement('span', { className: 'text-gray-900 dark:text-gray-100 font-mono' }, user.usernick)
                        ]),
                        user.email ? createElement('div', { key: 'email', className: 'flex gap-2' }, [
                            createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 min-w-24' }, 'Email:'),
                            createElement('span', { className: 'text-gray-900 dark:text-gray-100' }, user.email)
                        ]) : null,
                        createElement('div', { key: 'status', className: 'flex gap-2' }, [
                            createElement('span', { className: 'font-medium text-gray-700 dark:text-gray-300 min-w-24' }, 'Estado:'),
                            createElement('span', {
                                className: user.activo
                                    ? 'text-green-600 dark:text-green-400 font-medium'
                                    : 'text-red-600 dark:text-red-400 font-medium'
                            }, user.activo ? '✓ Activo' : '✗ Inactivo')
                        ])
                    ]),
                    createElement('div', {
                        key: 'divider',
                        className: 'border-t border-blue-200 dark:border-blue-800 my-3'
                    }),
                    createElement('p', {
                        key: 'help',
                        className: 'text-xs text-blue-700 dark:text-blue-300'
                    }, 'Puedes cambiar la contraseña del usuario completando los campos a continuación.')
                ]);
            }
        },
        // Campo: Password
        {
            key: 'password',
            label: 'Contraseña',
            type: 'password',
            colSpan: 3,
            section: 'Acceso al Sistema',
            placeholder: 'Dejar vacío para usar el teléfono como contraseña',
            validation: {
                minLength: 8,
            },
            visible: (data) => {
                // Visible si está creando usuario NUEVO
                if (data.crear_usuario) return true;

                // Visible si está EDITANDO y tiene usuario existente
                if (data.id && data.user_id) return true;

                return false;
            },
            required: (data) => {
                // Solo requerido si crear_usuario=true Y no está editando
                return Boolean(data.crear_usuario && !data.id);
            },
            description: (data) => {
                // Mensaje diferente según contexto
                if (data.id && data.user_id) {
                    return '💡 Dejar vacío para mantener la contraseña actual. Mínimo 8 caracteres si deseas cambiarla.';
                }
                return '💡 Mínimo 8 caracteres. Si se deja vacío, se usará el teléfono como contraseña.';
            }
        },
        // Campo: Confirmación de password
        {
            key: 'password_confirmation',
            label: 'Confirmar Contraseña',
            type: 'password',
            colSpan: 3,
            section: 'Acceso al Sistema',
            placeholder: 'Repetir contraseña',
            visible: (data) => {
                // Visible solo si:
                // 1. Está creando usuario (crear_usuario = true)
                // 2. O está editando y tiene usuario Y ingresó un password nuevo
                const isCreatingUser = data.crear_usuario === true;
                const hasPasswordInput = data.password && String(data.password).trim().length > 0;
                const isEditingWithUser = data.id && data.user_id;

                // Si está creando usuario, mostrar siempre
                if (isCreatingUser) return true;

                // Si está editando y tiene usuario, mostrar solo si ingresó contraseña
                if (isEditingWithUser && hasPasswordInput) return true;

                return false;
            },
            required: (data) => {
                // Requerido solo si password tiene valor realmente ingresado
                return Boolean(data.password && String(data.password).trim().length > 0);
            },
            description: (data) => {
                const hasPassword = data.password && String(data.password).trim().length > 0;
                if (hasPassword) {
                    return '⚠️ Debe coincidir con la contraseña ingresada arriba';
                }
                return 'Campo opcional - solo requerido si ingresas contraseña nueva';
            }
        },
        // 💳 SECCIÓN DE CONFIGURACIÓN DE CRÉDITO
        {
            key: 'puede_tener_credito',
            label: 'Habilitar crédito',
            type: 'boolean',
            defaultValue: false,
            colSpan: 1,
            section: 'Configuración de Crédito',
            description: 'Marca esta opción para permitir que el cliente realice compras a crédito',
        },
        {
            key: 'limite_credito',
            label: 'Límite de crédito',
            type: 'number',
            placeholder: 'Ej: 10000',
            colSpan: 2,
            section: 'Configuración de Crédito',
            description: 'Monto máximo que el cliente puede comprar a crédito',
            visible: (data) => data.puede_tener_credito === true,
            validation: {
                minValue: 0,
                step: '0.01'
            },
            prefix: '💰',
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
            colSpan: 2,
            section: 'Direcciones',
            description: 'Selecciona la localidad donde reside el cliente',
        },
        // ✅ NUEVO: Botón para abrir modal de registro de dirección personal
        {
            key: 'ir_a_direcciones',
            label: '',
            type: 'custom',
            colSpan: 1,
            section: 'Direcciones',
            render: ({ value, onChange, disabled, formData }) => {
                const [isModalOpen, setIsModalOpen] = React.useState(false);
                const direcciones = Array.isArray(formData?.direcciones) ? formData.direcciones : [];
                const clienteId = formData?.id || null;
                const localidadId = formData?.localidad_id || null;

                return createElement('div', { className: 'flex items-end h-full gap-2' },
                    createElement('button', {
                        type: 'button',
                        onClick: () => setIsModalOpen(true),
                        disabled: disabled,
                        className: 'w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center justify-center gap-2 whitespace-nowrap'
                    },
                        createElement('span', null, '📍'),
                        createElement('span', null, 'Agregar')
                    ),
                    // Modal para registrar dirección
                    isModalOpen ? createElement('div', {
                        className: 'fixed inset-0 bg-black/50 flex items-center justify-center z-50',
                        onClick: () => setIsModalOpen(false)
                    },
                        createElement('div', {
                            className: 'bg-white dark:bg-zinc-900 rounded-lg p-6 max-w-xl max-h-[80vh] overflow-auto',
                            onClick: (e: any) => e.stopPropagation()
                        },
                            createElement('h2', { className: 'text-lg font-semibold mb-4' }, 'Registrar Dirección'),
                            createElement(LocationModal, {
                                isOpen: true,
                                latitude: -17.78629,
                                longitude: -63.18117,
                                geocodedAddress: '',
                                clienteId: clienteId, // ✨ Pasar cliente ID
                                localidadId: localidadId, // ✨ Pasar localidad ID
                                existingData: {
                                    direccion: '',
                                    latitud: -17.78629,
                                    longitud: -63.18117,
                                    observaciones: '',
                                    es_principal: true // ✅ Marcar automáticamente como principal
                                },
                                onClose: () => setIsModalOpen(false),
                                onSaveSuccess: clienteId ? (data: any) => {
                                    // Si se guardó en la BD, recargar direcciones desde API
                                    const reloadDirecciones = async () => {
                                        try {
                                            const response = await fetch(`/api/clientes/${clienteId}/direcciones`);
                                            if (response.ok) {
                                                const result = await response.json();
                                                // Actualizar las direcciones en el formulario
                                                window.dispatchEvent(new CustomEvent('updateDirecciones', {
                                                    detail: { direcciones: result.data || [] }
                                                }));
                                            }
                                        } catch (error) {
                                            console.error('Error al recargar direcciones:', error);
                                        }
                                    };
                                    reloadDirecciones();
                                    setIsModalOpen(false);
                                } : undefined,
                                onSave: !clienteId ? (data: any) => {
                                    // Si no hay clienteId (cliente nuevo), guardar localmente
                                    const newAddresses = [...direcciones, data];
                                    window.dispatchEvent(new CustomEvent('updateDirecciones', {
                                        detail: { direcciones: newAddresses }
                                    }));
                                    setIsModalOpen(false);
                                } : undefined
                            })
                        )
                    ) : null
                );
            }
        },
        // Campo personalizado para ubicaciones en el mapa con modal
        {
            key: 'direcciones',
            label: 'Ubicaciones del cliente',
            type: 'custom',
            fullWidth: true, // Ocupa TODO el ancho de la pantalla
            section: 'Direcciones',
            render: ({ value, onChange, disabled, formData }) => {
                // value es un array de DireccionData
                const addresses = Array.isArray(value) ? value : [];
                // Obtener localidad_id y cliente_id del formulario actual
                const localidadId = formData?.localidad_id || null;
                const clienteId = formData?.id || null; // ID del cliente si está en edición

                return createElement('div', { id: 'direcciones-section' },
                    createElement(MapPickerWithLocations, {
                        addresses: addresses,
                        onAddressesChange: (newAddresses: any[]) => {
                            onChange(newAddresses);
                        },
                        label: 'Ubicaciones del cliente',
                        description: 'Haz clic en el mapa para agregar una nueva ubicación o en un marcador para editarla',
                        disabled: Boolean(disabled),
                        height: '450px',
                        localidadId: localidadId,
                        clienteId: clienteId, // ✨ NUEVO: Pasar cliente ID para guardar en BD
                        // ✨ NUEVO: Callback para actualizar localidad cuando se detecta
                        onLocalidadDetected: (id: number, nombre: string) => {
                            // Disparar evento personalizado para que el formulario lo detecte
                            const event = new CustomEvent('localidadDetected', {
                                detail: { localidadId: id, localidadNombre: nombre }
                            });
                            window.dispatchEvent(event);
                            console.log(`✅ Localidad auto-detectada: ${nombre} (ID: ${id})`);
                        }
                    })
                );
            }
        },
        // 📅 SECCIÓN DE VENTANAS DE ENTREGA
        {
            key: 'ventanas_entrega',
            label: 'Días y horarios de visita',
            type: 'custom',
            fullWidth: true,
            section: 'Dias de visitas',
            render: ({ value, onChange, disabled }) => {
                const ventanas = Array.isArray(value) ? value : [];

                return createElement(VentanasEntregaSelector, {
                    value: ventanas,
                    onChange: onChange,
                    disabled: Boolean(disabled)
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
                key: 'puede_tener_credito',
                label: 'Habilitación de crédito',
                type: 'boolean',
                placeholder: 'Todos los tipos',
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
            { value: 'puede_tener_credito', label: 'Habilitación de crédito' },
            { value: 'limite_credito', label: 'Límite de crédito' },
            { value: 'created_at', label: 'Fecha registro' },
            { value: 'updated_at', label: 'Última actualización' }
        ],
        defaultSort: { field: 'nombre', direction: 'asc' },
        layout: 'grid'
    },

    // Legacy support (deprecated)
    // Custom row actions for clients
    rowActions: [
        {
            label: "Ver Crédito",
            icon: "💳",
            action: "view-credit",
            href: (row) => `/clientes/${row.id}/credito`,
            color: "info",
            show: (row) => row.puede_tener_credito === true
        },
    ],
    showIndexFilters: true,
};
