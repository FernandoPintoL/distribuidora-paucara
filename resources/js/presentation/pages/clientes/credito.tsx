import React, { useState, useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { ArrowLeft, AlertTriangle } from 'lucide-react';
import RegistrarPagoModal from '@/presentation/components/clientes/RegistrarPagoModal';

// Import services
import { creditoService } from '@/infrastructure/services/credito.service';
import NotificationService from '@/infrastructure/services/notification.service';

// Import domain helpers
import { getCreditoColorByEstado, getCreditoEstadoLabel, type CreditoEstado } from '@/domain/entities/credito';

// Import types
import type { CuentaPorCobrarDetalle, PagoDetalle, AuditoriaCredito, CambioAuditoria } from '@/types/credito.types';

interface CreditoDetallesData {
    cliente: {
        id: number;
        nombre: string;
        codigo: string;
        nit: string;
        email: string;
        telefono: string;
        activo: boolean;
    };
    credito: {
        limite_credito: number;
        saldo_utilizado: number;
        saldo_disponible: number;
        porcentaje_utilizacion: number;
        estado: CreditoEstado;
    };
    cuentas_pendientes: {
        total: number;
        monto_total: number;
        cuentas_vencidas: number;
        dias_maximo_vencido: number;
        detalles: CuentaPorCobrarDetalle[];
    };
    historial_pagos: PagoDetalle[];
    auditoria: AuditoriaCredito[];
}

export default function CreditoPage() {
    const { clienteId } = usePage<{ clienteId: number }>().props;
    const [credito, setCredito] = useState<CreditoDetallesData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        cargarDetallesCredito();
    }, [clienteId]);

    const cargarDetallesCredito = async () => {
        try {
            setLoading(true);
            setError('');

            // Use creditoService instead of axios
            const response = await creditoService.obtenerDetallesCliente(clienteId);

            if (response && response.data) {
                setCredito(response.data);
            } else {
                throw new Error('Estructura de respuesta inválida');
            }
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error al cargar los detalles de crédito';
            setError(message);
            NotificationService.error(message);
            console.error('Error cargando detalles de crédito:', err);
        } finally {
            setLoading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        }).format(value);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="flex h-96 items-center justify-center">
                    <div className="text-center">
                        <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
                        <p className="text-gray-600 dark:text-gray-400">Cargando detalles de crédito...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    if (!credito) {
        return (
            <AppLayout>
                <div className="space-y-4">
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>{error || 'Error al cargar los datos de crédito'}</AlertDescription>
                    </Alert>
                </div>
            </AppLayout>
        );
    }

    const { cliente, credito: creditoData, cuentas_pendientes, historial_pagos, auditoria } = credito;

    return (
        <AppLayout>
            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.history.back()}
                                className="mr-2"
                            >
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver
                            </Button>
                        </div>
                        <h1 className="mt-4 text-3xl font-bold text-gray-900 dark:text-white">
                            {cliente.nombre}
                        </h1>
                        <p className="mt-2 text-gray-600 dark:text-gray-400">
                            Código: {cliente.codigo} | NIT: {cliente.nit}
                        </p>
                    </div>
                    <Button onClick={() => setShowModal(true)} className="bg-blue-600 text-white hover:bg-blue-700">
                        Registrar Pago
                    </Button>
                </div>

                {/* Alertas de estado crítico */}
                {cuentas_pendientes.cuentas_vencidas > 0 && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            ⚠️ Este cliente tiene {cuentas_pendientes.cuentas_vencidas} cuenta(s) vencida(s) por{' '}
                            {cuentas_pendientes.dias_maximo_vencido} días
                        </AlertDescription>
                    </Alert>
                )}

                {creditoData.porcentaje_utilizacion > 100 && (
                    <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                            ⚠️ Este cliente ha excedido su límite de crédito en {(creditoData.porcentaje_utilizacion - 100).toFixed(0)}%
                        </AlertDescription>
                    </Alert>
                )}

                {/* Estado de Crédito */}
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Estado del Crédito</CardTitle>
                                <Badge className={getCreditoColorByEstado(creditoData.estado)}>
                                    {getCreditoEstadoLabel(creditoData.estado)}
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Límite de Crédito</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(creditoData.limite_credito)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Disponible</p>
                                    <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                                        {formatCurrency(creditoData.saldo_disponible)}
                                    </p>
                                </div>
                            </div>

                            <div>
                                <div className="mb-2 flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Utilización: {creditoData.porcentaje_utilizacion.toFixed(1)}%
                                    </p>
                                </div>
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                                    <div
                                        className={`h-full transition-all ${creditoData.porcentaje_utilizacion > 100
                                            ? 'bg-red-600'
                                            : creditoData.porcentaje_utilizacion > 80
                                                ? 'bg-yellow-500'
                                                : 'bg-green-600'
                                            }`}
                                        style={{
                                            width: `${Math.min(creditoData.porcentaje_utilizacion, 100)}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Resumen de Deuda */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resumen de Deuda</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Saldo Utilizado</p>
                                    <p className="font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(creditoData.saldo_utilizado)}
                                    </p>
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Cuentas Pendientes</p>
                                    <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {cuentas_pendientes.total}
                                    </Badge>
                                </div>

                                {cuentas_pendientes.cuentas_vencidas > 0 && (
                                    <>
                                        <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
                                            <div className="flex items-center justify-between">
                                                <p className="text-sm text-red-600 dark:text-red-400">Cuentas Vencidas</p>
                                                <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                    {cuentas_pendientes.cuentas_vencidas}
                                                </Badge>
                                            </div>
                                            <div className="mt-2 flex items-center justify-between">
                                                <p className="text-sm text-red-600 dark:text-red-400">Días Máximo Vencido</p>
                                                <p className="font-bold text-red-600 dark:text-red-400">
                                                    {cuentas_pendientes.dias_maximo_vencido} días
                                                </p>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Cuentas Pendientes */}
                <Card>
                    <CardHeader>
                        <CardTitle>Cuentas Por Cobrar Pendientes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {cuentas_pendientes.detalles.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Venta
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Fecha
                                            </th>
                                            <th className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                                Monto Original
                                            </th>
                                            <th className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                                Saldo Pendiente
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Vencimiento
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Estado
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {cuentas_pendientes.detalles.map((cuenta) => (
                                            <tr
                                                key={cuenta.id}
                                                className={
                                                    cuenta.dias_vencido > 0
                                                        ? 'bg-red-50 dark:bg-red-950'
                                                        : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                                                }
                                            >
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">#{cuenta.numero_venta}</td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {new Date(cuenta.fecha_venta).toLocaleDateString('es-BO')}
                                                </td>
                                                <td className="px-4 py-3 text-right text-gray-900 dark:text-white">
                                                    {formatCurrency(cuenta.monto_original)}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-gray-900 dark:text-white">
                                                    {formatCurrency(cuenta.saldo_pendiente)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {new Date(cuenta.fecha_vencimiento).toLocaleDateString('es-BO')}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {cuenta.dias_vencido > 0 ? (
                                                        <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                                                            {cuenta.dias_vencido} días vencido
                                                        </Badge>
                                                    ) : (
                                                        <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            Al día
                                                        </Badge>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
                                No hay cuentas pendientes
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Historial de Pagos */}
                <Card>
                    <CardHeader>
                        <CardTitle>Historial de Pagos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {historial_pagos.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
                                        <tr>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Fecha de Pago
                                            </th>
                                            <th className="px-4 py-2 text-right font-semibold text-gray-900 dark:text-white">
                                                Monto
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Tipo de Pago
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Recibo
                                            </th>
                                            <th className="px-4 py-2 text-left font-semibold text-gray-900 dark:text-white">
                                                Usuario
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                                        {historial_pagos.map((pago) => (
                                            <tr key={pago.id} className="hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {new Date(pago.fecha_pago).toLocaleDateString('es-BO')}
                                                </td>
                                                <td className="px-4 py-3 text-right font-bold text-green-600 dark:text-green-400">
                                                    {formatCurrency(pago.monto)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-900 dark:text-white">
                                                    {pago.tipo_pago || 'N/A'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {pago.numero_recibo || '-'}
                                                </td>
                                                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                                                    {pago.usuario || '-'}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
                                No hay pagos registrados
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Auditoría de Crédito */}
                <Card>
                    <CardHeader>
                        <CardTitle>Auditoría de Crédito</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {auditoria.length > 0 ? (
                            <div className="space-y-4">
                                {auditoria.map((audit) => (
                                    <div
                                        key={audit.id}
                                        className="border-l-4 border-blue-500 bg-blue-50 p-4 dark:bg-blue-950"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {audit.responsable}
                                                </p>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                                    {new Date(audit.fecha).toLocaleDateString('es-BO', {
                                                        year: 'numeric',
                                                        month: '2-digit',
                                                        day: '2-digit',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </p>
                                            </div>
                                            <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                {audit.accion}
                                            </Badge>
                                        </div>
                                        {audit.cambios && (
                                            <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
                                                {Object.entries(audit.cambios)
                                                    .map(([key, value]: [string, CambioAuditoria]) => `${key}: ${value.anterior} → ${value.actual}`)
                                                    .join(', ')}
                                            </p>
                                        )}
                                        {audit.motivo && (
                                            <p className="mt-1 text-sm italic text-gray-600 dark:text-gray-400">
                                                Motivo: {audit.motivo}
                                            </p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="py-8 text-center text-gray-600 dark:text-gray-400">
                                No hay cambios de crédito registrados
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Modal para registrar pago */}
            <RegistrarPagoModal
                show={showModal}
                onHide={() => setShowModal(false)}
                clienteId={Number(clienteId)}
                cuentasPendientes={cuentas_pendientes.detalles}
                onPagoRegistrado={() => {
                    setShowModal(false);
                    cargarDetallesCredito();
                }}
            />
        </AppLayout>
    );
}
