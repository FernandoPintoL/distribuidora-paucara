import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { X, ShoppingCart, User, FileText, CreditCard } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';
import type {
    Cliente,
    Moneda,
    EstadoDocumento,
    Producto
} from '@/domain/entities/ventas';
import type { Id } from '@/domain/entities/shared';

interface DetalleVentaConProducto {
    producto_id: Id;
    cantidad: number;
    precio_unitario: number;
    descuento: number;
    subtotal: number;
    producto?: Producto;
}

interface VentaPreviewData {
    numero: string;
    fecha: string;
    subtotal: number;
    descuento: number;
    impuesto: number;
    total: number;
    observaciones?: string;
    cliente_id: Id;
    usuario_id: number;
    estado_documento_id: Id;
    moneda_id: Id;
    proforma_id?: Id;
    tipo_pago_id?: Id;
    tipo_documento_id?: Id;
    requiere_envio?: boolean;
    canal_origen?: 'APP_EXTERNA' | 'WEB' | 'PRESENCIAL';
    estado_logistico?: 'PENDIENTE_ENVIO' | 'PREPARANDO' | 'ENVIADO' | 'ENTREGADO';
}

interface VentaPreviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    data: VentaPreviewData;
    detallesWithProducts: DetalleVentaConProducto[];
    cliente: Cliente | undefined;
    moneda: Moneda | undefined;
    estadoDocumento: EstadoDocumento | undefined;
    processing: boolean;
    isEditing: boolean;
}

export default function VentaPreviewModal({
    isOpen,
    onClose,
    onConfirm,
    data,
    detallesWithProducts,
    cliente,
    moneda,
    estadoDocumento,
    processing,
    isEditing
}: VentaPreviewModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4 text-center">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden rounded-2xl bg-white dark:bg-zinc-900 p-6 text-left align-middle shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between mb-6">
                                    <Dialog.Title
                                        as="h3"
                                        className="text-2xl font-semibold leading-6 text-gray-900 dark:text-white flex items-center gap-3"
                                    >
                                        <ShoppingCart className="h-6 w-6 text-blue-600" />
                                        Vista Previa de {isEditing ? 'Actualización' : 'Venta'}
                                    </Dialog.Title>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 dark:text-gray-300 dark:hover:text-gray-100 transition-colors"
                                    >
                                        <X className="h-6 w-6" />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    {/* Información Principal */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                                <FileText className="h-4 w-4" />
                                                Información del Documento
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Número:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{data.numero}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Fecha:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {new Date(data.fecha).toLocaleDateString('es-BO', {
                                                            year: 'numeric',
                                                            month: 'long',
                                                            day: 'numeric'
                                                        })}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Estado:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{estadoDocumento?.nombre}</span>
                                                </div>
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Moneda:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {moneda?.nombre} ({moneda?.simbolo})
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Información del Cliente
                                            </h4>
                                            <div className="space-y-2">
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Nombre:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">{cliente?.nombre || 'Sin cliente'}</span>
                                                </div>
                                                {cliente?.nit && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">NIT:</span>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{cliente.nit}</span>
                                                    </div>
                                                )}
                                                {cliente?.email && (
                                                    <div className="flex justify-between">
                                                        <span className="text-sm text-gray-600 dark:text-gray-300">Email:</span>
                                                        <span className="text-sm font-medium text-gray-900 dark:text-white">{cliente.email}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Observaciones */}
                                    {data.observaciones && (
                                        <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Observaciones</h4>
                                            <p className="text-sm text-gray-700 dark:text-gray-300">{data.observaciones}</p>
                                        </div>
                                    )}

                                    {/* Detalles de Productos */}
                                    <div className="bg-gray-50 dark:bg-zinc-800 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-4">
                                            Productos ({detallesWithProducts.length} items)
                                        </h4>

                                        <div className="overflow-x-auto">
                                            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                                                <thead>
                                                    <tr>
                                                        <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Producto
                                                        </th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Cantidad
                                                        </th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Precio Unit.
                                                        </th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Descuento
                                                        </th>
                                                        <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                                            Subtotal
                                                        </th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-200 dark:divide-zinc-700">
                                                    {detallesWithProducts.map((detalle, index) => (
                                                        <tr key={index}>
                                                            <td className="px-3 py-2 text-sm">
                                                                <div>
                                                                    <p className="font-medium text-gray-900 dark:text-white">
                                                                        {detalle.producto?.nombre}
                                                                    </p>
                                                                    {detalle.producto?.codigo && (
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            Código: {detalle.producto.codigo}
                                                                        </p>
                                                                    )}
                                                                </div>
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                                                                {detalle.cantidad}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                                                                {formatCurrency(detalle.precio_unitario)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-right text-gray-900 dark:text-white">
                                                                {formatCurrency(detalle.descuento)}
                                                            </td>
                                                            <td className="px-3 py-2 text-sm text-right font-medium text-gray-900 dark:text-white">
                                                                {formatCurrency(detalle.subtotal)}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>

                                    {/* Totales */}
                                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                                        <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-2">
                                            <CreditCard className="h-4 w-4" />
                                            Resumen de Totales
                                        </h4>
                                        <div className="space-y-2">
                                            <div className="flex justify-between">
                                                <span className="text-sm text-gray-600 dark:text-gray-300">Subtotal:</span>
                                                <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {formatCurrency(data.subtotal)}
                                                </span>
                                            </div>
                                            {data.descuento > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Descuento General:</span>
                                                    <span className="text-sm font-medium text-red-600 dark:text-red-400">
                                                        -{formatCurrency(data.descuento)}
                                                    </span>
                                                </div>
                                            )}
                                            {/* Impuesto oculto - por ahora no se requiere */}
                                            {false && data.impuesto > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-sm text-gray-600 dark:text-gray-300">Impuestos:</span>
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {formatCurrency(data.impuesto)}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="border-t border-gray-200 dark:border-zinc-600 pt-2 mt-2">
                                                <div className="flex justify-between">
                                                    <span className="text-lg font-semibold text-gray-900 dark:text-white">TOTAL:</span>
                                                    <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                                        {formatCurrency(data.total)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-8 flex justify-end space-x-3">
                                    <button
                                        type="button"
                                        onClick={onClose}
                                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-zinc-800 border border-gray-300 dark:border-zinc-600 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-700 transition-colors"
                                        disabled={processing}
                                    >
                                        Editar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={onConfirm}
                                        disabled={processing}
                                        className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-green-600 border border-transparent rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                        {processing ? 'Procesando...' : (isEditing ? 'Confirmar Actualización' : 'Confirmar Venta')}
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
