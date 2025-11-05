import React, { useRef } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/application/hooks/use-auth';
import { useExport } from '@/infrastructure/hooks/use-export';
import { compraToExportData, getDefaultCompraExportOptions } from '@/lib/export-helpers';
import { ExportButtons } from '@/presentation/components/Export/ExportButtons';
import { PrintableContent } from '@/presentation/components/Export/PrintableContent';
import { ArrowLeft, Edit, Printer, Package, User, Calendar, FileText, Hash, CreditCard, Loader2 } from 'lucide-react';

// Importar tipos del domain
import type { Compra } from '@/domain/entities/compras';
import type { EstadoDocumento } from '@/domain/entities/estados-documento';

interface PageProps extends InertiaPageProps {
    compra: Compra;
}

const getEstadoColor = (estado?: EstadoDocumento) => {
    if (!estado) return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';

    switch (estado.nombre.toLowerCase()) {
        case 'pendiente':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
        case 'completada':
        case 'aprobada':
            return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
        case 'cancelada':
            return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
        default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
};

export default function CompraShow() {
    const { props } = usePage<PageProps>();
    const { can } = useAuth();
    const { isExporting, exportToPDF, exportToExcel, exportToCSV, print, error } = useExport();
    const compra = props.compra;
    const printableRef = useRef<HTMLDivElement>(null);

    // Preparar datos para exportación
    const exportData = compraToExportData(compra);
    const defaultExportOptions = getDefaultCompraExportOptions(compra);

    const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
        try {
            switch (format) {
                case 'pdf':
                    await exportToPDF(exportData, defaultExportOptions);
                    break;
                case 'excel':
                    await exportToExcel(exportData, defaultExportOptions);
                    break;
                case 'csv':
                    await exportToCSV(exportData, defaultExportOptions);
                    break;
            }
        } catch (err) {
            console.error(`Error exportando a ${format}:`, err);
        }
    };

    const handlePrint = async () => {
        try {
            await print('printable-content', defaultExportOptions);
        } catch (err) {
            console.error('Error imprimiendo:', err);
        }
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Compras', href: '/compras' },
            { title: `Compra ${compra.numero}`, href: '#' }
        ]}>
            <Head title={`Compra ${compra.numero}`} />

            {/* Header mejorado */}
            <div className="flex items-center justify-between mb-6 p-4">
                <div className="flex items-center space-x-4">
                    <Link
                        href="/compras"
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                    >
                        <ArrowLeft className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                                {compra.numero}
                            </h1>
                            <span className={`inline-flex px-3 py-1 text-sm font-medium rounded-full ${getEstadoColor(compra.estado_documento)}`}>
                                {compra.estado_documento?.nombre || 'Sin estado'}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Creada el {compra.created_at ? new Date(compra.created_at).toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            }) : 'Fecha no disponible'}
                        </p>
                    </div>
                </div>

                <div className="flex gap-3">
                    <button
                        onClick={handlePrint}
                        disabled={isExporting}
                        className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 flex items-center gap-2 disabled:opacity-50"
                    >
                        {isExporting ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <Printer className="h-4 w-4" />
                        )}
                        {isExporting ? 'Procesando...' : 'Imprimir'}
                    </button>

                    <ExportButtons
                        data={exportData}
                        options={defaultExportOptions}
                        disabled={isExporting}
                        showPrint={false}
                        showPDF={true}
                        showExcel={true}
                        showCSV={true}
                        onExportStart={() => console.log('Iniciando exportación...')}
                        onExportEnd={() => console.log('Exportación completada')}
                        onExportError={(error) => console.error('Error en exportación:', error)}
                    />

                    {can('compras.update') && (
                        <Link
                            href={`/compras/${compra.id}/edit`}
                            className="inline-flex items-center px-4 py-2 bg-blue-600 border border-transparent rounded-md font-semibold text-xs text-white uppercase tracking-widest hover:bg-blue-700 focus:bg-blue-700 active:bg-blue-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition ease-in-out duration-150"
                        >
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                        </Link>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Información principal */}
                <div className="lg:col-span-2 space-y-6">
                    {/* Datos generales mejorados */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <FileText className="h-5 w-5 mr-2" />
                                Información General
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="flex items-start space-x-3">
                                    <Hash className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Número de Compra
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white font-mono">
                                            {compra.numero}
                                        </dd>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Fecha de Compra
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {new Date(compra.fecha).toLocaleDateString('es-ES', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </dd>
                                    </div>
                                </div>

                                {compra.numero_factura && (
                                    <div className="flex items-start space-x-3">
                                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div>
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Número de Factura
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-xs">
                                                    {compra.numero_factura}
                                                </span>
                                            </dd>
                                        </div>
                                    </div>
                                )}

                                <div className="flex items-start space-x-3">
                                    <CreditCard className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Moneda
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            <span className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs font-medium">
                                                {compra.moneda ? `${compra.moneda.codigo} - ${compra.moneda.nombre}` : 'Moneda no especificada'}
                                            </span>
                                        </dd>
                                    </div>
                                </div>

                                <div className="flex items-start space-x-3">
                                    <User className="h-5 w-5 text-gray-400 mt-0.5" />
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Registrado por
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {compra.usuario?.name || 'Usuario no especificado'}
                                        </dd>
                                    </div>
                                </div>

                                {compra.observaciones && (
                                    <div className="md:col-span-2 flex items-start space-x-3">
                                        <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
                                        <div className="flex-1">
                                            <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                                Observaciones
                                            </dt>
                                            <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                                                    {compra.observaciones}
                                                </div>
                                            </dd>
                                        </div>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Detalles de productos mejorados */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
                                <Package className="h-5 w-5 mr-2" />
                                Productos ({compra.detalles?.length || 0})
                            </h3>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Producto
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Cantidad
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Precio Unit.
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Subtotal
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Lote
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Vencimiento
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {(compra.detalles || []).map((detalle) => (
                                        <tr key={detalle.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 text-sm">
                                                <div>
                                                    <div className="font-medium text-gray-900 dark:text-white">
                                                        {detalle.producto.nombre}
                                                    </div>
                                                    {detalle.producto.codigo && (
                                                        <div className="text-gray-500 dark:text-gray-400 text-xs font-mono">
                                                            Código: {detalle.producto.codigo}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-900 dark:text-white font-mono">
                                                {detalle.cantidad.toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white font-mono">
                                                {formatCurrency(Number(detalle.precio_unitario), compra.moneda?.simbolo || '$')}
                                            </td>
                                            <td className="px-6 py-4 text-right text-sm text-gray-900 dark:text-white font-mono font-semibold">
                                                {formatCurrency(Number(detalle.subtotal), compra.moneda?.simbolo || '$')}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                {detalle.lote ? (
                                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded text-xs font-mono">
                                                        {detalle.lote}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                                                {detalle.fecha_vencimiento ? (
                                                    <span className="text-xs">
                                                        {new Date(detalle.fecha_vencimiento).toLocaleDateString('es-ES')}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Sidebar derecho mejorado */}
                <div className="space-y-6">
                    {/* Información del proveedor mejorada */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Proveedor
                            </h3>
                        </div>
                        <div className="p-6">
                            <div className="text-center mb-4">
                                <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <User className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                                </div>
                                <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    {compra.proveedor?.nombre || 'Proveedor no especificado'}
                                </h4>
                            </div>

                            <dl className="space-y-3">
                                {compra.proveedor?.razon_social && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Razón Social
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {compra.proveedor.razon_social}
                                        </dd>
                                    </div>
                                )}

                                {compra.proveedor?.nit && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            NIT
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            <span className="font-mono">{compra.proveedor.nit}</span>
                                        </dd>
                                    </div>
                                )}

                                {compra.proveedor?.telefono && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Teléfono
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            <a href={`tel:${compra.proveedor.telefono}`} className="hover:text-blue-600">
                                                {compra.proveedor.telefono}
                                            </a>
                                        </dd>
                                    </div>
                                )}

                                {compra.proveedor?.email && (
                                    <div>
                                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                            Email
                                        </dt>
                                        <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                            <a href={`mailto:${compra.proveedor.email}`} className="hover:text-blue-600">
                                                {compra.proveedor.email}
                                            </a>
                                        </dd>
                                    </div>
                                )}
                            </dl>
                        </div>
                    </div>

                    {/* Resumen financiero mejorado */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Resumen Financiero
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-4">
                                <div className="flex justify-between text-sm">
                                    <dt className="text-gray-600 dark:text-gray-400">Subtotal:</dt>
                                    <dd className="font-mono text-gray-900 dark:text-white">
                                        {formatCurrency(Number(compra.subtotal), compra.moneda?.simbolo || '$')}
                                    </dd>
                                </div>

                                {compra.descuento > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <dt className="text-gray-600 dark:text-gray-400">Descuento:</dt>
                                        <dd className="font-mono text-red-600 dark:text-red-400">
                                            -{formatCurrency(Number(compra.descuento), compra.moneda?.simbolo || '$')}
                                        </dd>
                                    </div>
                                )}

                                {/* Impuesto oculto - por ahora no se requiere */}
                                {false && compra.impuesto > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <dt className="text-gray-600 dark:text-gray-400">Impuestos:</dt>
                                        <dd className="font-mono text-gray-900 dark:text-white">
                                            {formatCurrency(Number(compra.impuesto), compra.moneda?.simbolo || '$')}
                                        </dd>
                                    </div>
                                )}

                                <div className="border-t pt-4">
                                    <div className="flex justify-between">
                                        <dt className="text-base font-semibold text-gray-900 dark:text-white">Total:</dt>
                                        <dd className="text-base font-bold font-mono text-gray-900 dark:text-white">
                                            {formatCurrency(Number(compra.total), compra.moneda?.simbolo || '$')}
                                        </dd>
                                    </div>
                                </div>
                            </dl>
                        </div>
                    </div>

                    {/* Fechas de auditoría */}
                    <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
                        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                                Información de Auditoría
                            </h3>
                        </div>
                        <div className="p-6">
                            <dl className="space-y-4">
                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Creada
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {compra.created_at ? new Date(compra.created_at).toLocaleString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Fecha no disponible'}
                                    </dd>
                                </div>

                                <div>
                                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">
                                        Última modificación
                                    </dt>
                                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                                        {compra.updated_at ? new Date(compra.updated_at).toLocaleString('es-ES', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit'
                                        }) : 'Fecha no disponible'}
                                    </dd>
                                </div>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Contenido para impresión (oculto visualmente pero disponible en DOM) */}
            <div className="absolute -left-full -top-full opacity-0 pointer-events-none print:block print:relative print:left-0 print:top-0 print:opacity-100 print:pointer-events-auto">
                <PrintableContent
                    ref={printableRef}
                    compra={compra}
                    title={`Compra ${compra.numero}`}
                />
            </div>
        </AppLayout>
    );
}
