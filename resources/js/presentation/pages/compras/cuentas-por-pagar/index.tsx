import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Plus, Eye, CreditCard, AlertTriangle } from 'lucide-react';
import type { CuentasPorPagarIndexResponse, CuentaPorPagar, FiltrosCuentasPorPagar } from '@/domain/entities/compras';

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
    cuentasPorPagar: CuentasPorPagarIndexResponse;
}

const CuentasPorPagarIndex: React.FC<Props> = ({ cuentasPorPagar }) => {
    // Inicializar hooks con valores por defecto seguros
    const filtrosDefault: FiltrosCuentasPorPagar = {};
    const [filtros, setFiltros] = useState<FiltrosCuentasPorPagar>(cuentasPorPagar?.filtros || filtrosDefault);
    const [modalDetalle, setModalDetalle] = useState<{ isOpen: boolean; cuenta?: CuentaPorPagar }>({ isOpen: false });

    // Validación defensiva para evitar errores si cuentasPorPagar es undefined
    if (!cuentasPorPagar || !cuentasPorPagar.filtros) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cargando...</h2>
                        <p className="text-gray-600 dark:text-gray-400">Por favor espere mientras se cargan los datos.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleFiltroChange = (field: keyof FiltrosCuentasPorPagar, value: string | boolean) => {
        const nuevosFiltros = { ...filtros, [field]: value };
        setFiltros(nuevosFiltros);

        // Aplicar filtros inmediatamente  
        router.get('/compras/cuentas-por-pagar', nuevosFiltros as Record<string, string | boolean | undefined>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const limpiarFiltros = () => {
        const filtrosVacios: FiltrosCuentasPorPagar = {};
        setFiltros(filtrosVacios);
        router.get('/compras/cuentas-por-pagar');
    };

    const getEstadoBadge = (estado: string) => {
        const colores = {
            'PENDIENTE': 'default',
            'PAGADO': 'secondary',
            'VENCIDO': 'destructive',
            'PARCIAL': 'outline'
        };
        return colores[estado as keyof typeof colores] || 'default';
    };

    const getUrgenciaBadge = (diasVencido: number) => {
        if (diasVencido > 30) return 'destructive';
        if (diasVencido > 15) return 'secondary';
        if (diasVencido > 0) return 'default';
        return 'outline';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Compras', href: '/compras' },
            { title: 'Cuentas por Pagar', href: '/compras/cuentas-por-pagar' }
        ]}>
            <Head title="Cuentas por Pagar" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cuentas por Pagar</h1>
                        <p className="text-gray-600 dark:text-gray-400">Gestión de deudas con proveedores</p>
                    </div>
                    <Button
                        onClick={() => router.get('/compras/cuentas-por-pagar/create')}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Cuenta por Pagar
                    </Button>
                </div>

                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-blue-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Total Pendiente</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(cuentasPorPagar.estadisticas.monto_total_pendiente)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-red-100 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Vencidas</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(cuentasPorPagar.estadisticas.monto_total_vencido)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-yellow-100 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-yellow-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Cuentas Vencidas</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {cuentasPorPagar.estadisticas.cuentas_vencidas}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-green-600" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600">Promedio Días</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {cuentasPorPagar.estadisticas.promedio_dias_pago}
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
                                    placeholder="Buscar por proveedor, número..."
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Proveedor</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={filtros.proveedor_id || ''}
                                    onChange={(e) => handleFiltroChange('proveedor_id', e.target.value)}
                                >
                                    <option value="">Todos los proveedores</option>
                                    {cuentasPorPagar.datosParaFiltros.proveedores.map((proveedor) => (
                                        <option key={proveedor.id} value={proveedor.id}>
                                            {proveedor.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Estado</label>
                                <select
                                    className="w-full p-2 border border-gray-300 rounded-md"
                                    value={filtros.estado || ''}
                                    onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="PAGADO">Pagado</option>
                                    <option value="VENCIDO">Vencido</option>
                                    <option value="PARCIAL">Parcial</option>
                                </select>
                            </div>

                            <div className="flex items-end space-x-2">
                                <label className="flex items-center space-x-2">
                                    <input
                                        type="checkbox"
                                        checked={filtros.solo_vencidas || false}
                                        onChange={(e) => handleFiltroChange('solo_vencidas', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <span className="text-sm text-gray-700">Solo vencidas</span>
                                </label>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha vencimiento desde</label>
                                <Input
                                    type="date"
                                    value={filtros.fecha_vencimiento_desde || ''}
                                    onChange={(e) => handleFiltroChange('fecha_vencimiento_desde', e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha vencimiento hasta</label>
                                <Input
                                    type="date"
                                    value={filtros.fecha_vencimiento_hasta || ''}
                                    onChange={(e) => handleFiltroChange('fecha_vencimiento_hasta', e.target.value)}
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

                {/* Tabla de Cuentas por Pagar */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Compra
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Proveedor
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Monto Original
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Saldo Pendiente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vencimiento
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Estado
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Urgencia
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200">
                                {cuentasPorPagar.cuentas_por_pagar.data.map((cuenta) => (
                                    <tr key={cuenta.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {cuenta.compra?.numero || `#${cuenta.compra_id}`}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {cuenta.compra?.proveedor?.nombre || 'Sin proveedor'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(cuenta.monto_original)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900 dark:text-white">
                                                {formatCurrency(cuenta.saldo_pendiente)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm text-gray-900 dark:text-white">
                                                {formatDate(cuenta.fecha_vencimiento)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={getEstadoBadge(cuenta.estado) as "default" | "secondary" | "destructive" | "outline"}>
                                                {cuenta.estado}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <Badge variant={getUrgenciaBadge(cuenta.dias_vencido) as "default" | "secondary" | "destructive" | "outline"}>
                                                {cuenta.dias_vencido > 0 ? `${cuenta.dias_vencido} días` : 'Al día'}
                                            </Badge>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <div className="flex justify-end space-x-2">
                                                <Button
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => setModalDetalle({ isOpen: true, cuenta })}
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                {cuenta.estado !== 'PAGADO' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={() => router.get(`/compras/pagos/create?cuenta_por_pagar_id=${cuenta.id}`)}
                                                        className="bg-green-600 hover:bg-green-700"
                                                    >
                                                        Pagar
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {cuentasPorPagar.cuentas_por_pagar.data.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay cuentas por pagar</h3>
                            <p className="mt-1 text-sm text-gray-500">No se encontraron cuentas con los filtros aplicados.</p>
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
                            <DialogTitle>Detalle de Cuenta por Pagar</DialogTitle>
                        </DialogHeader>
                        {modalDetalle.cuenta && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Compra</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.compra?.numero || `#${modalDetalle.cuenta.compra_id}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Proveedor</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.compra?.proveedor?.nombre || 'Sin proveedor'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Monto Original</label>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(modalDetalle.cuenta.monto_original)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Saldo Pendiente</label>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(modalDetalle.cuenta.saldo_pendiente)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Fecha Vencimiento</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {formatDate(modalDetalle.cuenta.fecha_vencimiento)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Estado</label>
                                        <Badge variant={getEstadoBadge(modalDetalle.cuenta.estado) as "default" | "secondary" | "destructive" | "outline"}>
                                            {modalDetalle.cuenta.estado}
                                        </Badge>
                                    </div>
                                </div>

                                {modalDetalle.cuenta.observaciones && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Observaciones</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.observaciones}
                                        </p>
                                    </div>
                                )}

                                {modalDetalle.cuenta.pagos && modalDetalle.cuenta.pagos.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Historial de Pagos</label>
                                        <div className="space-y-2">
                                            {modalDetalle.cuenta.pagos.map((pago) => (
                                                <div key={pago.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                            {formatCurrency(pago.monto)}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {formatDate(pago.fecha_pago)} - {pago.tipo_pago?.nombre}
                                                        </p>
                                                    </div>
                                                    {pago.observaciones && (
                                                        <p className="text-xs text-gray-500 max-w-xs truncate">
                                                            {pago.observaciones}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setModalDetalle({ isOpen: false })}
                                    >
                                        Cerrar
                                    </Button>
                                    {modalDetalle.cuenta.estado !== 'PAGADO' && (
                                        <Button
                                            onClick={() => {
                                                setModalDetalle({ isOpen: false });
                                                router.get(`/compras/pagos/create?cuenta_por_pagar_id=${modalDetalle.cuenta!.id}`);
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Registrar Pago
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
};

export default CuentasPorPagarIndex;
