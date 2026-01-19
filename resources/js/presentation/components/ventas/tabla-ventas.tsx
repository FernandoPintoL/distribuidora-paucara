import React, { useState } from 'react';
import { Link } from '@inertiajs/react';
import { Eye, Edit, Trash2, MoreHorizontal, FileText, Truck, Store, ChevronDown, ChevronUp, MapPin, Package, Calendar } from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import type { Venta, FiltrosVentas } from '@/domain/entities/ventas';
import type { Pagination } from '@/domain/entities/shared';
import ventasService from '@/infrastructure/services/ventas.service';
import AnularVentaModal from './AnularVentaModal';
import { FormatoSelector } from '@/presentation/components/impresion/FormatoSelector';
import { toast } from 'react-toastify';

interface TablaVentasProps {
    ventas: Pagination<Venta>;
    filtros?: FiltrosVentas;
    onVentaDeleted?: (ventaId: number | string) => void;
}

export default function TablaVentas({ ventas, filtros }: TablaVentasProps) {
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
    const [anularModal, setAnularModal] = useState<{ isOpen: boolean; venta?: Venta }>({ isOpen: false });
    const [isAnulando, setIsAnulando] = useState(false);

    // ✅ DEBUG: Verificar datos de dirección en consola
    React.useEffect(() => {
        if (ventas.data && ventas.data.length > 0) {
            const ventaConDelivery = ventas.data.find(v => v.requiere_envio);
            if (ventaConDelivery) {
                console.log('📦 Venta con delivery - DEBUG:', {
                    id: ventaConDelivery.id,
                    numero: ventaConDelivery.numero,
                    requiere_envio: ventaConDelivery.requiere_envio,
                    direccionCliente: ventaConDelivery.direccionCliente,
                    estado_logistico: ventaConDelivery.estado_logistico,
                    estado_logistico_id: ventaConDelivery.estado_logistico_id,
                });
            }
        }
    }, [ventas]);

    const toggleRowExpanded = (ventaId: number) => {
        const newExpanded = new Set(expandedRows);
        if (newExpanded.has(ventaId)) {
            newExpanded.delete(ventaId);
        } else {
            newExpanded.add(ventaId);
        }
        setExpandedRows(newExpanded);
    };

    const openAnularModal = (venta: Venta) => {
        setAnularModal({ isOpen: true, venta });
    };

    const closeAnularModal = () => {
        setAnularModal({ isOpen: false });
    };

    const handleAnularVenta = async (motivo?: string) => {
        if (!anularModal.venta) return;

        setIsAnulando(true);
        try {
            const response = await fetch(`/ventas/${anularModal.venta.id}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({ motivo }),
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.message || 'Error al anular la venta');
                return;
            }

            toast.success('Venta anulada exitosamente');
            closeAnularModal();

            // Recargar la página
            setTimeout(() => window.location.reload(), 1000);
        } catch (error) {
            console.error('Error al anular venta:', error);
            toast.error('Error al anular la venta');
        } finally {
            setIsAnulando(false);
        }
    };

    const getEstadoLogisticoColor = (estado: string): string => {
        // ✅ ACTUALIZADO: Incluir todos los estados posibles desde BD
        const colorMap: { [key: string]: string } = {
            // Estados de entrega
            'SIN_ENTREGA': 'gray',
            'PENDIENTE_ENVIO': 'yellow',    // ✅ NUEVO: Pendiente de envío
            'PROGRAMADO': 'blue',
            'EN_PREPARACION': 'yellow',
            'PREPARANDO': 'yellow',         // ✅ NUEVO: Alias de preparación
            'EN_TRANSITO': 'purple',
            'ENVIADO': 'blue',              // ✅ NUEVO: En camino
            'ENTREGADA': 'green',
            'ENTREGADO': 'green',           // ✅ NUEVO: Ya entregado
            'PROBLEMAS': 'red',
            'CANCELADA': 'dark',
            'CANCELADO': 'dark',            // ✅ NUEVO: Alias
            'PENDIENTE_RETIRO': 'orange',   // ✅ NUEVO: Pendiente de retiro
            'RETIRADO': 'green'             // ✅ NUEVO: Retirado
        };
        return colorMap[estado] || 'gray';
    };

    const getEstadoLogisticoLabel = (estado: string): string => {
        // ✅ ACTUALIZADO: Incluir todos los estados posibles desde BD
        const labelMap: { [key: string]: string } = {
            'SIN_ENTREGA': 'Sin Entrega',
            'PENDIENTE_ENVIO': 'Pendiente de Envío',   // ✅ NUEVO
            'PROGRAMADO': 'Programado',
            'EN_PREPARACION': 'En Preparación',
            'PREPARANDO': 'Preparando',                 // ✅ NUEVO
            'EN_TRANSITO': 'En Tránsito',
            'ENVIADO': 'Enviado',                       // ✅ NUEVO
            'ENTREGADA': 'Entregada',
            'ENTREGADO': 'Entregado',                   // ✅ NUEVO
            'PROBLEMAS': 'Con Problemas',
            'CANCELADA': 'Cancelada',
            'CANCELADO': 'Cancelado',                   // ✅ NUEVO
            'PENDIENTE_RETIRO': 'Pendiente de Retiro', // ✅ NUEVO
            'RETIRADO': 'Retirado'                      // ✅ NUEVO
        };
        return labelMap[estado] || 'Desconocido';
    };

    /* const handleDelete = (venta: Venta) => {
        ventasService.destroy(venta.id, {
            onSuccess: () => {
                if (onVentaDeleted) {
                    onVentaDeleted(venta.id);
                }
            }
        });
    }; */

    const handleSort = (field: string) => {
        const currentSortDir = filtros?.sort_by === field && filtros?.sort_dir === 'asc' ? 'desc' : 'asc';
        ventasService.sort(field, currentSortDir);
    };

    const getSortIcon = (field: string) => {
        if (filtros?.sort_by !== field) {
            return '↕️';
        }
        return filtros?.sort_dir === 'asc' ? '↑' : '↓';
    };

    const getEstadoColor = (estado: string): string => {
        switch (estado.toLowerCase()) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'completada':
            case 'pagada':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'cancelada':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            case 'facturada':
                return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    if (!ventas.data || ventas.data.length === 0) {
        return (
            <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
                <div className="p-8 text-center">
                    <FileText className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
                        No hay ventas
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 dark:text-zinc-400">
                        {Object.keys(filtros || {}).length > 0
                            ? 'No se encontraron ventas con los filtros aplicados.'
                            : 'Comienza creando tu primera venta.'
                        }
                    </p>
                    <div className="mt-6">
                        <Link
                            href="/ventas/create"
                            className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Nueva venta
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700">
            {/* Header con información de paginación */}
            <div className="px-4 py-3 border-b border-gray-200 dark:border-zinc-700">
                <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrando{' '}
                        <span className="font-medium">{ventas.from}</span>
                        {' '}-{' '}
                        <span className="font-medium">{ventas.to}</span>
                        {' '}de{' '}
                        <span className="font-medium">{ventas.total}</span>
                        {' '}ventas
                    </div>

                    <div className="flex items-center space-x-2">
                        <select
                            value={filtros?.per_page || 15}
                            onChange={(e) => ventasService.changePerPage(Number(e.target.value))}
                            className="text-sm border-gray-300 dark:border-zinc-600 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-zinc-800 dark:text-white"
                        >
                            <option value={10}>10 por página</option>
                            <option value={15}>15 por página</option>
                            <option value={25}>25 por página</option>
                            <option value={50}>50 por página</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                    <thead className="bg-gray-50 dark:bg-zinc-800">
                        <tr>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('numero')}
                            >
                                Número {getSortIcon('numero')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('cliente_id')}
                            >
                                Cliente {getSortIcon('cliente_id')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('total')}
                            >
                                Total {getSortIcon('total')}
                            </th>
                            <th
                                scope="col"
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-zinc-700"
                                onClick={() => handleSort('requiere_envio')}
                            >
                                Tipo {getSortIcon('requiere_envio')}
                            </th>
                            <th scope="col" className="px-6 py-3">
                                <span className="sr-only">Acciones</span>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                        {ventas.data.map((venta) => (
                            <React.Fragment key={venta.id}>
                                <tr className="hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {venta.numero}
                                        </div>
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {formatDate(String(venta.fecha))}
                                        </div>
                                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getEstadoColor(venta.estado_logistico || '')
                                            }`}>
                                            {String(venta.estado_documento?.codigo ?? 'Sin estado')}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4">
                                        <div className="text-sm text-gray-900 dark:text-white">
                                            {venta.cliente?.nombre || 'Sin cliente'}
                                        </div>
                                        {venta.cliente?.nit && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                NIT: {venta.cliente.nit}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(venta.total, venta.moneda?.codigo)}
                                        </div>
                                        {venta.moneda && (
                                            <div className="text-sm text-gray-500 dark:text-gray-400">
                                                {venta.moneda.codigo}
                                            </div>
                                        )}
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                            {venta.requiere_envio ? (
                                                <>
                                                    <Truck className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                        Delivery
                                                    </span>
                                                    <button
                                                        onClick={() => toggleRowExpanded(Number(venta.id))}
                                                        className="p-1 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors"
                                                        title="Ver detalles de entrega"
                                                    >
                                                        {expandedRows.has(Number(venta.id)) ? (
                                                            <ChevronUp className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        ) : (
                                                            <ChevronDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                                        )}
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <Store className="w-4 h-4 text-green-600 dark:text-green-400" />
                                                    <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                                        Presencial
                                                    </span>
                                                </>
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end space-x-2">
                                            {/* Ver */}
                                            <Link
                                                href={ventasService.showUrl(venta.id)}
                                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 p-1 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                                title="Ver venta"
                                            >
                                                <Eye className="w-4 h-4" />
                                            </Link>

                                            {/* Editar - Deshabilitado por ahora */}
                                            {/* <button
                                                disabled
                                                className="text-gray-300 dark:text-gray-600 p-1 rounded cursor-not-allowed"
                                                title="Editar venta (próximamente)"
                                            >
                                                <Edit className="w-4 h-4" />
                                            </button> */}

                                            {/* Anular */}
                                            {venta.estado !== 'ANULADA' && (
                                                <button
                                                    onClick={() => openAnularModal(venta)}
                                                    className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-1 rounded hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                    title="Anular venta"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}

                                            {/* ✅ Descargar en formato - Usar FormatoSelector */}
                                            <FormatoSelector
                                                documentoId={venta.id}
                                                tipoDocumento="venta"
                                                className="h-9 px-2"
                                            />
                                        </div>
                                    </td>
                                </tr>

                                {/* Fila expandible para detalles de delivery */}
                                {venta.requiere_envio && expandedRows.has(Number(venta.id)) && (
                                    <tr className="bg-blue-50 dark:bg-blue-900/10 border-t-2 border-blue-200 dark:border-blue-800">
                                        <td colSpan={9} className="px-6 py-4">
                                            <div className="space-y-4">
                                                {/* Dirección de entrega */}
                                                <div className="flex items-start space-x-3">
                                                    <MapPin className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                                                            Dirección de Entrega
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {/* Dirección principal */}
                                                            <div>
                                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                    {venta.direccionCliente?.direccion || 'No especificada'}
                                                                </p>
                                                            </div>

                                                            {/* Referencias */}
                                                            {venta.direccionCliente?.referencias && (
                                                                <div>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        📌 Referencias: {venta.direccionCliente.referencias}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Localidad */}
                                                            {venta.direccionCliente?.localidad && (
                                                                <div>
                                                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                                                        🏘️ Localidad: {venta.direccionCliente.localidad}
                                                                    </p>
                                                                </div>
                                                            )}

                                                            {/* Coordenadas para mapas */}
                                                            {venta.direccionCliente?.latitud && venta.direccionCliente?.longitud && (
                                                                <div className="mt-2 p-2 bg-white dark:bg-zinc-800 rounded border border-gray-200 dark:border-zinc-700">
                                                                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono">
                                                                        📍 Coordenadas: {Number(venta.direccionCliente.latitud).toFixed(4)}, {Number(venta.direccionCliente.longitud).toFixed(4)}
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Estado logístico */}
                                                <div className="flex items-start space-x-3">
                                                    <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                    <div>
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                            Estado Logístico
                                                        </h4>
                                                        <div className="flex items-center space-x-2">
                                                            <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getEstadoLogisticoColor(venta.estado_logistico || 'SIN_ENTREGA') === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                getEstadoLogisticoColor(venta.estado_logistico || 'SIN_ENTREGA') === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                    getEstadoLogisticoColor(venta.estado_logistico || 'SIN_ENTREGA') === 'yellow' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                        getEstadoLogisticoColor(venta.estado_logistico || 'SIN_ENTREGA') === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300' :
                                                                            getEstadoLogisticoColor(venta.estado_logistico || 'SIN_ENTREGA') === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300' :
                                                                                'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                                                                }`}>
                                                                {getEstadoLogisticoLabel(venta.estado_logistico || 'SIN_ENTREGA')}
                                                            </span>
                                                            {/* ✅ NUEVO: Mostrar estado_logistico_id */}
                                                            {venta.estado_logistico_id && (
                                                                <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                                                                    (ID: {venta.estado_logistico_id})
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Fecha de entrega prometida */}
                                                {venta.fecha_entrega_comprometida && (
                                                    <div className="flex items-start space-x-3">
                                                        <Calendar className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                                Fecha Prometida de Entrega
                                                            </h4>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                {formatDate(String(venta.fecha_entrega_comprometida))}
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Peso de la venta */}
                                                {venta.peso_total_estimado && (
                                                    <div className="flex items-start space-x-3">
                                                        <Package className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                                                        <div>
                                                            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                                                Peso Total Estimado
                                                            </h4>
                                                            <p className="text-sm text-gray-700 dark:text-gray-300">
                                                                {Number(venta.peso_total_estimado).toFixed(2)} kg
                                                            </p>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {ventas.last_page > 1 && (
                <div className="px-4 py-3 border-t border-gray-200 dark:border-zinc-700">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => ventasService.goToPage(ventas.current_page - 1)}
                                disabled={ventas.current_page <= 1}
                                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Anterior
                            </button>

                            <div className="flex items-center space-x-1">
                                {/* Renderizar números de página */}
                                {(() => {
                                    const maxButtons = 5;
                                    let startPage = Math.max(1, ventas.current_page - Math.floor(maxButtons / 2));
                                    const endPage = Math.min(ventas.last_page, startPage + maxButtons - 1);

                                    // Ajustar si estamos cerca del final
                                    if (endPage - startPage < maxButtons - 1) {
                                        startPage = Math.max(1, endPage - maxButtons + 1);
                                    }

                                    const pages = [];
                                    for (let i = startPage; i <= endPage; i++) {
                                        pages.push(i);
                                    }

                                    return pages.map((pageNum) => (
                                        <button
                                            key={pageNum}
                                            onClick={() => ventasService.goToPage(pageNum)}
                                            className={`px-3 py-2 text-sm font-medium rounded-md transition-colors ${pageNum === ventas.current_page
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 hover:bg-gray-50 dark:hover:bg-zinc-700'
                                                }`}
                                        >
                                            {pageNum}
                                        </button>
                                    ));
                                })()}
                            </div>

                            <button
                                onClick={() => ventasService.goToPage(ventas.current_page + 1)}
                                disabled={ventas.current_page >= ventas.last_page}
                                className="px-3 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Siguiente
                            </button>
                        </div>

                        <div className="text-sm text-gray-700 dark:text-gray-300">
                            Página {ventas.current_page} de {ventas.last_page}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal de anulación */}
            <AnularVentaModal
                isOpen={anularModal.isOpen}
                onClose={closeAnularModal}
                ventaNumero={anularModal.venta?.numero || ''}
                onConfirm={handleAnularVenta}
                isLoading={isAnulando}
            />
        </div>
    );
}
