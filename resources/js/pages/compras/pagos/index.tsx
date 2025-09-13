import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Eye, CreditCard, Calculator, Receipt } from 'lucide-react';
import type { PagosIndexResponse, Pago, FiltrosPagos } from '@/domain/compras';

// Helper functions
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('es-BO');
};

interface Props extends InertiaPageProps {
    pagos: PagosIndexResponse;
}

const PagosIndex: React.FC<Props> = ({ pagos }) => {
    // Validación defensiva y valores por defecto
    const filtrosDefault: FiltrosPagos = {};
    const [filtros, setFiltros] = useState<FiltrosPagos>(pagos?.filtros || filtrosDefault);
    const [modalDetalle, setModalDetalle] = useState<{ isOpen: boolean; pago?: Pago }>({ isOpen: false });

    const handleFiltroChange = (field: keyof FiltrosPagos, value: string) => {
        const nuevosFiltros = { ...filtros, [field]: value };
        setFiltros(nuevosFiltros);

        // Aplicar filtros inmediatamente
        router.get('/compras/pagos', nuevosFiltros as Record<string, string | undefined>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const limpiarFiltros = () => {
        const filtrosVacios: FiltrosPagos = {};
        setFiltros(filtrosVacios);
        router.get('/compras/pagos');
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Compras', href: '/compras' },
            { title: 'Pagos', href: '/compras/pagos' }
        ]}>
            <Head title="Pagos a Proveedores" />

            {!pagos ? (
                <div className="p-6">
                    <div className="animate-pulse">
                        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-4 bg-gray-200 rounded w-1/4 mb-8"></div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="h-32 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                            <div className="h-32 bg-gray-200 rounded"></div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Pagos a Proveedores</h1>
                            <p className="text-gray-600 dark:text-gray-400">Registro y gestión de pagos realizados</p>
                        </div>
                        <Button
                            onClick={() => router.get('/compras/pagos/create')}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Plus className="w-5 h-5 mr-2" />
                            Registrar Pago
                        </Button>
                    </div>

                    {/* Estadísticas Rápidas */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-green-100 rounded-lg">
                                        <CreditCard className="w-6 h-6 text-green-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Total Pagos Hoy</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {(pagos?.pagos?.data || []).filter(p =>
                                                new Date(p.fecha_pago).toDateString() === new Date().toDateString()
                                            ).length}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-blue-100 rounded-lg">
                                        <Calculator className="w-6 h-6 text-blue-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Monto Total</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency((pagos?.pagos?.data || []).reduce((sum, p) => sum + p.monto, 0))}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="p-6">
                                <div className="flex items-center">
                                    <div className="p-3 bg-purple-100 rounded-lg">
                                        <Receipt className="w-6 h-6 text-purple-600" />
                                    </div>
                                    <div className="ml-4">
                                        <p className="text-sm font-medium text-gray-600">Promedio por Pago</p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                            {formatCurrency(
                                                (pagos?.pagos?.data || []).length > 0
                                                    ? (pagos?.pagos?.data || []).reduce((sum, p) => sum + p.monto, 0) / (pagos?.pagos?.data || []).length
                                                    : 0
                                            )}
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Filtros */}
                    <Card>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Buscar</label>
                                    <Input
                                        value={filtros.q || ''}
                                        onChange={(e) => handleFiltroChange('q', e.target.value)}
                                        placeholder="Buscar por número, observaciones..."
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Tipo de Pago</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={filtros.tipo_pago_id || ''}
                                        onChange={(e) => handleFiltroChange('tipo_pago_id', e.target.value)}
                                    >
                                        <option value="">Todos los tipos</option>
                                        {(pagos?.datosParaFiltros?.tipos_pago || []).map((tipo) => (
                                            <option key={tipo.id} value={tipo.id}>
                                                {tipo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Cuenta por Pagar</label>
                                    <select
                                        className="w-full p-2 border border-gray-300 rounded-md"
                                        value={filtros.cuenta_por_pagar_id || ''}
                                        onChange={(e) => handleFiltroChange('cuenta_por_pagar_id', e.target.value)}
                                    >
                                        <option value="">Todas las cuentas</option>
                                        {(pagos?.datosParaFiltros?.cuentas_por_pagar || []).map((cuenta) => (
                                            <option key={cuenta.id} value={cuenta.id}>
                                                {cuenta.compra?.proveedor?.nombre} - {cuenta.compra?.numero}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fecha desde</label>
                                    <Input
                                        type="date"
                                        value={filtros.fecha_desde || ''}
                                        onChange={(e) => handleFiltroChange('fecha_desde', e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-medium">Fecha hasta</label>
                                    <Input
                                        type="date"
                                        value={filtros.fecha_hasta || ''}
                                        onChange={(e) => handleFiltroChange('fecha_hasta', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end mt-4">
                                <Button
                                    onClick={limpiarFiltros}
                                    variant="outline"
                                >
                                    Limpiar Filtros
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Tabla de Pagos */}
                    <Card>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 dark:bg-gray-800">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Proveedor
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Compra
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Monto
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo de Pago
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            N° Referencia
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Usuario
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                                    {(pagos?.pagos?.data || []).map((pago) => (
                                        <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(pago.fecha_pago)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {pago.cuenta_por_pagar?.compra?.proveedor?.nombre || 'Sin proveedor'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {pago.cuenta_por_pagar?.compra?.numero || `#${pago.cuenta_por_pagar_id}`}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-green-600">
                                                    {formatCurrency(pago.monto)}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <Badge variant="secondary">
                                                    {pago.tipo_pago?.nombre || 'Sin tipo'}
                                                </Badge>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {pago.numero_recibo || pago.numero_cheque || pago.numero_transferencia || '-'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {pago.usuario?.name || 'Sistema'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setModalDetalle({ isOpen: true, pago })}
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => router.get(`/compras/pagos/${pago.id}/imprimir`)}
                                                        className="text-blue-600 hover:text-blue-700"
                                                    >
                                                        <Receipt className="w-4 h-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {(pagos?.pagos?.data || []).length === 0 && (
                            <div className="text-center py-12">
                                <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay pagos registrados</h3>
                                <p className="mt-1 text-sm text-gray-500">No se encontraron pagos con los filtros aplicados.</p>
                            </div>
                        )}
                    </Card>

                    {/* Modal de Detalle */}
                    <Dialog
                        open={modalDetalle.isOpen}
                        onOpenChange={() => setModalDetalle({ isOpen: false })}
                    >
                        <DialogContent className="max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>Detalle del Pago</DialogTitle>
                            </DialogHeader>
                            {modalDetalle.pago && (
                                <div className="space-y-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Fecha de Pago</label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {formatDate(modalDetalle.pago.fecha_pago)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Monto</label>
                                            <p className="mt-1 text-sm font-medium text-green-600">
                                                {formatCurrency(modalDetalle.pago.monto)}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {modalDetalle.pago.cuenta_por_pagar?.compra?.proveedor?.nombre || 'Sin proveedor'}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Compra</label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {modalDetalle.pago.cuenta_por_pagar?.compra?.numero || `#${modalDetalle.pago.cuenta_por_pagar_id}`}
                                            </p>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Tipo de Pago</label>
                                            <Badge variant="secondary">
                                                {modalDetalle.pago.tipo_pago?.nombre || 'Sin tipo'}
                                            </Badge>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Usuario</label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {modalDetalle.pago.usuario?.name || 'Sistema'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Referencias de pago */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {modalDetalle.pago.numero_recibo && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">N° Recibo</label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {modalDetalle.pago.numero_recibo}
                                                </p>
                                            </div>
                                        )}
                                        {modalDetalle.pago.numero_cheque && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">N° Cheque</label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {modalDetalle.pago.numero_cheque}
                                                </p>
                                            </div>
                                        )}
                                        {modalDetalle.pago.numero_transferencia && (
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">N° Transferencia</label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {modalDetalle.pago.numero_transferencia}
                                                </p>
                                            </div>
                                        )}
                                    </div>

                                    {modalDetalle.pago.observaciones && (
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                                            <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                {modalDetalle.pago.observaciones}
                                            </p>
                                        </div>
                                    )}

                                    {/* Información de la cuenta por pagar */}
                                    <div className="border-t pt-4">
                                        <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Información de la Cuenta por Pagar</h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Monto Original</label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {formatCurrency(modalDetalle.pago.cuenta_por_pagar?.monto_original || 0)}
                                                </p>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Saldo Pendiente</label>
                                                <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                                    {formatCurrency(modalDetalle.pago.cuenta_por_pagar?.saldo_pendiente || 0)}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex justify-end space-x-3">
                                        <Button
                                            variant="outline"
                                            onClick={() => setModalDetalle({ isOpen: false })}
                                        >
                                            Cerrar
                                        </Button>
                                        <Button
                                            onClick={() => {
                                                setModalDetalle({ isOpen: false });
                                                router.get(`/compras/pagos/${modalDetalle.pago!.id}/imprimir`);
                                            }}
                                            className="bg-blue-600 hover:bg-blue-700"
                                        >
                                            <Receipt className="w-4 h-4 mr-2" />
                                            Imprimir Comprobante
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </DialogContent>
                    </Dialog>
                </div>
            )}
        </AppLayout>
    );
};

export default PagosIndex;