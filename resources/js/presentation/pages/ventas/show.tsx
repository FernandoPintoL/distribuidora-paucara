import { Head, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import { User } from 'lucide-react';
import { useState } from 'react';
import type { VentaShow, EstadoDocumento } from '@/domain/entities/ventas';
import { FormatoSelector } from '@/presentation/components/impresion';

interface PageProps extends InertiaPageProps {
    venta: VentaShow;
}

export default function VentaShow() {
    const { venta } = usePage<PageProps>().props;
    const [imagenCargada, setImagenCargada] = useState(true);

    // Debug: Verificar datos que llegan
    console.log('🔍 VentaShow - Venta cargada:', venta.numero);
    console.log('  requiere_envio:', venta.requiere_envio, '(tipo:', typeof venta.requiere_envio + ')');
    console.log('  estado_logistico:', venta.estado_logistico);
    console.log('  canal_origen:', venta.canal_origen);

    const getEstadoColor = (estado: EstadoDocumento) => {
        switch (estado.nombre.toLowerCase()) {
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

    const getCuentaEstadoColor = (estado: string) => {
        switch (estado.toLowerCase()) {
            case 'pendiente':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'pagada':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'vencida':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ventas', href: '/ventas' },
            { title: `Venta ${venta.numero}`, href: '#' }
        ]}>
            <Head title={`Venta ${venta.numero}`} />

            <div className="flex items-center justify-between mb-2 px-6 pt-6">
                <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                    Venta {venta.numero}
                </h1>
                <div className="flex space-x-3">
                    {/* Botón de Impresión */}
                    <FormatoSelector
                        documentoId={venta.id}
                        tipoDocumento="venta"
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6">
                {/* Información principal */}
                <div className="space-y-6">
                    {/* Información de la venta + Cliente */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">
                            Información de la venta
                        </h2>

                        {/* Foto y datos del cliente */}
                        <div className="mb-6 pb-6 border-b border-gray-200 dark:border-zinc-700">
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase mb-4">Cliente</h3>
                            <div className="flex gap-4">
                                {/* Foto de perfil */}
                                <div className="flex-shrink-0">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-gray-200 dark:border-zinc-700 flex items-center justify-center bg-gray-100 dark:bg-zinc-800">
                                        {venta.cliente.foto_perfil && typeof venta.cliente.foto_perfil === 'string' && imagenCargada ? (
                                            <img
                                                src={venta.cliente.foto_perfil as string}
                                                alt={venta.cliente.nombre}
                                                className="w-full h-full object-cover"
                                                onError={() => setImagenCargada(false)}
                                            />
                                        ) : (
                                            <User className="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                        )}
                                    </div>
                                </div>

                                {/* Datos del cliente */}
                                <div className="flex-1 space-y-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Nombre</label>
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {venta.cliente.nombre}
                                        </p>
                                    </div>

                                    {venta.cliente.nit && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">NIT</label>
                                            <p className="text-sm text-gray-900 dark:text-white">{venta.cliente.nit}</p>
                                        </div>
                                    )}

                                    {venta.cliente.telefono && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Teléfono</label>
                                            <p className="text-sm text-gray-900 dark:text-white">{venta.cliente.telefono}</p>
                                        </div>
                                    )}

                                    {venta.cliente.email && (
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Email</label>
                                            <p className="text-sm text-gray-900 dark:text-white">{venta.cliente.email}</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Datos de la venta */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Número
                                </label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                    {venta.numero}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Fecha
                                </label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(venta.fecha).toLocaleDateString('es-ES', {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Estado
                                </label>
                                <div className="mt-1">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(venta.estado_documento)}`}>
                                        {venta.estado_documento.nombre}
                                    </span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Moneda
                                </label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {venta.moneda.codigo} - {venta.moneda.nombre}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Vendedor
                                </label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {venta.usuario.name}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Creada
                                </label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {new Date(venta.created_at).toLocaleDateString('es-ES')} {new Date(venta.created_at).toLocaleTimeString('es-ES')}
                                </p>
                            </div>
                        </div>

                        {venta.observaciones && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-500 dark:text-gray-400">
                                    Observaciones
                                </label>
                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                    {venta.observaciones}
                                </p>
                            </div>
                        )}

                        {/* Información adicional */}
                        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700">
                            <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase mb-4">
                                Información adicional
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* Tipo de Pago */}
                                {venta.tipo_pago && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Tipo de Pago
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {venta.tipo_pago.nombre}
                                        </p>
                                    </div>
                                )}

                                {/* Canal de Origen */}
                                {venta.canal_origen && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Canal de Origen
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {venta.canal_origen === 'APP_EXTERNA' && '📱 App Externa'}
                                            {venta.canal_origen === 'WEB' && '🌐 Web'}
                                            {venta.canal_origen === 'PRESENCIAL' && '🏪 Presencial'}
                                        </p>
                                    </div>
                                )}

                                {/* Requiere Envío */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Tipo de Entrega
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {venta.requiere_envio ? '🚚 Delivery' : '🏪 Presencial'}
                                    </p>
                                </div>

                                {/* Estado Logístico */}
                                {venta.requiere_envio && venta.estado_logistico && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Estado de Envío
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {venta.estado_logistico === 'PENDIENTE_ENVIO' && '⏳ Pendiente envío'}
                                            {venta.estado_logistico === 'PREPARANDO' && '📦 Preparando'}
                                            {venta.estado_logistico === 'ENVIADO' && '🚚 Enviado'}
                                            {venta.estado_logistico === 'ENTREGADO' && '✅ Entregado'}
                                        </p>
                                    </div>
                                )}

                                {/* Última Actualización */}
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                        Última Actualización
                                    </label>
                                    <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {new Date(venta.updated_at).toLocaleDateString('es-ES')} {new Date(venta.updated_at).toLocaleTimeString('es-ES')}
                                    </p>
                                </div>

                                {/* Proforma de Origen */}
                                {venta.proforma && (
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                            Proforma de Origen
                                        </label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {venta.proforma.numero}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Dirección de Entrega (si requiere envío) */}
                            {venta.requiere_envio && venta.direccion_cliente && (
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-zinc-700">
                                    <h3 className="text-sm font-semibold text-gray-600 dark:text-gray-300 uppercase mb-4">
                                        Dirección de Entrega
                                    </h3>
                                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                Dirección
                                            </label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {venta.direccion_cliente.direccion}
                                            </p>
                                        </div>
                                        {venta.direccion_cliente.referencias && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                    Referencias
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {venta.direccion_cliente.referencias}
                                                </p>
                                            </div>
                                        )}
                                        {venta.direccion_cliente.localidad && (
                                            <div>
                                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                                                    Localidad
                                                </label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {venta.direccion_cliente.localidad}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Productos + Resumen */}
                    <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                        <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                            Productos ({venta.detalles.length})
                        </h2>

                        <div className="overflow-x-auto mb-6">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-zinc-700">
                                <thead className="bg-gray-50 dark:bg-zinc-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Precio unit.
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-zinc-900 divide-y divide-gray-200 dark:divide-zinc-700">
                                    {venta.detalles.map((detalle) => (
                                        <tr key={detalle.id}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                    {detalle.producto.nombre}
                                                </div>
                                                {detalle.producto.codigo && (
                                                    <div className="text-sm text-gray-500 dark:text-gray-400">
                                                        Código: {detalle.producto.codigo}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {detalle.cantidad}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                                                {formatCurrency(detalle.precio_unitario, venta.moneda.codigo)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(detalle.subtotal, venta.moneda.codigo)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Resumen en el mismo card */}
                        <div className="border-t border-gray-200 dark:border-zinc-700 pt-6">
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(venta.subtotal, venta.moneda.codigo)}
                                    </span>
                                </div>

                                {/* {venta.descuento > 0 && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Descuento</span>
                                        <span className="text-sm text-red-600 dark:text-red-400">
                                            -{formatCurrency(venta.descuento, venta.moneda.codigo)}
                                        </span>
                                    </div>
                                )} */}

                                {/* <div className="border-t border-gray-200 dark:border-zinc-700 pt-3">
                                    <div className="flex justify-between">
                                        <span className="text-lg font-bold text-gray-900 dark:text-white">Total</span>
                                        <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
                                            {formatCurrency(venta.total, venta.moneda.codigo)}
                                        </span>
                                    </div>
                                </div> */}
                            </div>
                        </div>
                    </div>

                    {/* Pagos si existen */}
                    {venta.pagos && venta.pagos.length > 0 && (
                        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                            <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Pagos ({venta.pagos.length})
                            </h2>

                            <div className="space-y-4">
                                {venta.pagos.map((pago) => (
                                    <div key={pago.id} className="border border-gray-200 dark:border-zinc-700 rounded-lg p-4">
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                                        {pago.tipo_pago.nombre}
                                                    </span>
                                                    <span className="text-sm text-gray-500 dark:text-gray-400">
                                                        {new Date(pago.fecha).toLocaleDateString('es-ES')}
                                                    </span>
                                                </div>
                                                {pago.numero_comprobante && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        Comprobante: {pago.numero_comprobante}
                                                    </p>
                                                )}
                                                {pago.observaciones && (
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                                        {pago.observaciones}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="text-right">
                                                <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                                                    {formatCurrency(pago.monto, venta.moneda.codigo)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Cuenta por cobrar si existe */}
                    {venta.cuenta_por_cobrar && (
                        <div className="bg-white dark:bg-zinc-900 rounded-lg shadow-sm border border-gray-200 dark:border-zinc-700 p-6">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
                                Cuenta por cobrar
                            </h3>

                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Monto</span>
                                    <span className="text-sm text-gray-900 dark:text-white">
                                        {formatCurrency(venta.cuenta_por_cobrar.monto, venta.moneda.codigo)}
                                    </span>
                                </div>

                                <div className="flex justify-between">
                                    <span className="text-sm text-gray-500 dark:text-gray-400">Saldo</span>
                                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                                        {formatCurrency(venta.cuenta_por_cobrar.saldo, venta.moneda.codigo)}
                                    </span>
                                </div>

                                {venta.cuenta_por_cobrar.fecha_vencimiento && (
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Vencimiento</span>
                                        <span className="text-sm text-gray-900 dark:text-white">
                                            {new Date(venta.cuenta_por_cobrar.fecha_vencimiento).toLocaleDateString('es-ES')}
                                        </span>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCuentaEstadoColor(venta.cuenta_por_cobrar.estado)}`}>
                                        {venta.cuenta_por_cobrar.estado}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}
