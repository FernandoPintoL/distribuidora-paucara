/**
 * Page: Cajas/Index
 *
 * Responsabilidades:
 * ✅ Renderizar página principal de gestión de cajas
 * ✅ Orquestar componentes sub-módulos
 * ✅ Gestionar estado de modales
 * ✅ Pasar datos de cierre a componentes
 *
 * Arquitectura:
 * - Types: Domain entities from /domain/entities/cajas.ts
 * - Utils: Formatting functions from /lib/cajas.utils.tsx
 * - Hook: Business logic from /application/hooks/use-cajas.ts
 * - Components: Sub-components from ./components/
 */

import { Head, router } from '@inertiajs/react';
import { useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import AppLayout from '@/layouts/app-layout';
import AperturaCajaModal from '@/presentation/components/AperturaCajaModal';
import CierreCajaModal from '@/presentation/components/CierreCajaModal';
import RegistrarMovimientoModal from '@/presentation/components/RegistrarGastoModal';
import { FormatoSelector } from '@/presentation/components/impresion/FormatoSelector';
import { CajaHeader, CajaEstadoCard, MovimientosDelDiaTable, HistorialAperturasTable } from './components';
import { useCajas } from '@/application/hooks/use-cajas';
import { toNumber } from '@/lib/cajas.utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/presentation/components/ui/tabs';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import type { CajasIndexProps, MovimientoCaja } from '@/domain/entities/cajas';

export default function Index(props: CajasIndexProps) {
    const {
        showAperturaModal,
        showCierreModal,
        handleAbrirModal,
        handleCerrarModalApertura,
        handleAbrirCierreModal,
        handleCerrarModalCierre,
        cajaAbiertaHoy,
        cajas
    } = useCajas(props);

    const [showMovimientoModal, setShowMovimientoModal] = useState(false);
    const [isConsolidating, setIsConsolidating] = useState(false);
    const [showConsolidateDialog, setShowConsolidateDialog] = useState(false);

    const { movimientosHoy, totalMovimientos, esVistaAdmin = false, usuarioDestino, historicoAperturas } = props;

    // ✅ Título dinámico según contexto
    const titulo = esVistaAdmin ? `Caja de ${usuarioDestino?.name}` : 'Gestión de Cajas';

    // ✅ NUEVO: Contar cajas CERRADAS con estado PENDIENTE (listos para consolidar)
    const cierresPendientes = historicoAperturas?.filter((a: any) =>
        a.estado === 'Cerrada' && a.estado_cierre === 'PENDIENTE'
    ).length || 0;

    // ✅ NUEVO: Obtener detalles de cajas CERRADAS PENDIENTE para mostrar en modal
    const cierresPendientesDetalle = historicoAperturas?.filter((a: any) =>
        a.estado === 'Cerrada' && a.estado_cierre === 'PENDIENTE'
    ) || [];

    // ✅ NUEVO: Función para consolidar la caja del usuario
    const handleConsolidarCaja = () => {
        setShowConsolidateDialog(true);
    };

    // ✅ NUEVO: Confirmar consolidación con toast mejorado
    const confirmConsolidar = async () => {
        if (!usuarioDestino?.id) {
            toast.error('Error: Usuario no encontrado');
            return;
        }

        setShowConsolidateDialog(false);
        setIsConsolidating(true);

        const loadingToast = toast.loading('Consolidando cajas...');

        router.post(
            `/cajas/admin/cajas/${usuarioDestino.id}/consolidar`,
            {},
            {
                onSuccess: (page) => {
                    toast.dismiss(loadingToast);
                    setIsConsolidating(false);

                    // Obtener el mensaje desde flash (Inertia lo proporciona en page.props.flash)
                    const successMessage = page?.props?.flash?.success ||
                        `✅ Cajas consolidadas exitosamente\n${cierresPendientes} cierre(s) consolidado(s)`;

                    console.log('Éxito:', successMessage);
                    toast.success(successMessage, {
                        duration: 5000,
                        icon: '✅',
                    });
                },
                onError: (errors: any) => {
                    toast.dismiss(loadingToast);
                    setIsConsolidating(false);

                    let errorMessage = 'Error desconocido al consolidar';

                    // Si hay respuesta del servidor con mensaje específico
                    if (errors?.cierre) {
                        errorMessage = errors.cierre;
                    } else if (errors?.message) {
                        errorMessage = errors.message;
                    } else if (Object.keys(errors).length > 0) {
                        errorMessage = Object.values(errors).join(', ');
                    }

                    console.error('Error consolidando cajas:', errorMessage);
                    toast.error(`❌ Error al consolidar:\n${errorMessage}`, {
                        duration: 5000,
                        icon: '❌',
                    });
                }
            }
        );
    };

    // ✅ NUEVO: Calcular estadísticas útiles
    const stats = {
        totalMovimientos: movimientosHoy?.length || 0,
        ingresos: movimientosHoy?.filter((m: MovimientoCaja) => toNumber(m.monto) > 0).reduce((sum: number, m: MovimientoCaja) => sum + toNumber(m.monto), 0) || 0,
        egresos: Math.abs(movimientosHoy?.filter((m: MovimientoCaja) => toNumber(m.monto) < 0).reduce((sum: number, m: MovimientoCaja) => sum + toNumber(m.monto), 0) || 0),
    };

    return (
        <AppLayout>
            <Head title={titulo} />

            <div className="py-12">
                <div className="max-w-7xl mx-auto sm:px-6 lg:px-8 space-y-6">
                    {/* ✅ NUEVO: Banner si es vista admin */}
                    {esVistaAdmin && (
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-4">
                            <p className="text-sm text-blue-800 dark:text-blue-300">
                                👤 Visualizando caja de: <strong>{usuarioDestino?.name}</strong> ({usuarioDestino?.email})
                            </p>
                        </div>
                    )}

                    <CajaHeader cajaAbiertaHoy={cajaAbiertaHoy} esVistaAdmin={esVistaAdmin} usuarioDestino={usuarioDestino} />

                    <CajaEstadoCard
                        cajaAbiertaHoy={cajaAbiertaHoy}
                        totalMovimientos={totalMovimientos}
                        onAbrirClick={handleAbrirModal}
                        onCerrarClick={handleAbrirCierreModal}
                        onGastoClick={() => setShowMovimientoModal(true)}
                        onConsolidarClick={handleConsolidarCaja}
                        cierreDatos={cajaAbiertaHoy?.cierre || undefined}
                        esVistaAdmin={esVistaAdmin}
                        cierresPendientes={cierresPendientes}
                        isConsolidating={isConsolidating}
                    />

                    {/* ✅ NUEVO: Cards de estadísticas rápidas */}
                    {cajaAbiertaHoy && movimientosHoy && movimientosHoy.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total de Movimientos
                                        </p>
                                        <p className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-1">
                                            {stats.totalMovimientos}
                                        </p>
                                    </div>
                                    <div className="text-4xl">📊</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Ingresos
                                        </p>
                                        <p className="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                                            +{stats.ingresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-4xl">💚</div>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-gray-800 overflow-hidden shadow-sm sm:rounded-lg p-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            Total Egresos
                                        </p>
                                        <p className="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                                            -{stats.egresos.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-4xl">❌</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Tabs: Movimientos del Día vs Historial de Cajas */}
                    <Tabs defaultValue="movimientos" className="space-y-6">
                        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
                            <div className="px-6 pt-6 pb-0 flex justify-between items-center">
                                <TabsList className="bg-transparent border-gray-200 dark:border-gray-700">
                                    <TabsTrigger value="movimientos" className="dark:text-gray-300 dark:hover:text-gray-100">
                                        📊 Movimientos del Día
                                    </TabsTrigger>
                                    <TabsTrigger value="historial" className="dark:text-gray-300 dark:hover:text-gray-100">
                                        📋 Historial de Cajas
                                    </TabsTrigger>
                                </TabsList>

                                {/* ✅ NUEVO: Botones de impresión */}
                                <div className="flex gap-2">
                                    {/* Impresión de movimientos */}
                                    {cajaAbiertaHoy && movimientosHoy && movimientosHoy.length > 0 && (
                                        <FormatoSelector
                                            documentoId={cajaAbiertaHoy.id}
                                            tipoDocumento="cajas"
                                            formatos={[
                                                { formato: 'A4', nombre: 'Reporte A4', descripcion: 'Hoja completa' },
                                                { formato: 'TICKET_80', nombre: 'Ticket 80mm', descripcion: 'Compacto' },
                                                { formato: 'TICKET_58', nombre: 'Ticket 58mm', descripcion: 'Muy compacto' },
                                            ]}
                                            className="text-sm"
                                        />
                                    )}

                                    {/* Impresión de cierre */}
                                    {cajaAbiertaHoy?.cierre && (
                                        <FormatoSelector
                                            documentoId={cajaAbiertaHoy.id}
                                            tipoDocumento="cajas-cierre"
                                            formatos={[
                                                { formato: 'TICKET_80', nombre: 'Ticket 80mm', descripcion: 'Compacto' },
                                                { formato: 'TICKET_58', nombre: 'Ticket 58mm', descripcion: 'Muy compacto' },
                                            ]}
                                            className="text-sm"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Tab: Movimientos del Día */}
                        <TabsContent value="movimientos">
                            <MovimientosDelDiaTable
                                cajaAbiertaHoy={cajaAbiertaHoy}
                                movimientosHoy={movimientosHoy}
                            />
                        </TabsContent>

                        {/* Tab: Historial de Aperturas */}
                        <TabsContent value="historial">
                            {props.historicoAperturas && (
                                <HistorialAperturasTable historicoAperturas={props.historicoAperturas} />
                            )}
                            {!props.historicoAperturas && (
                                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 text-center">
                                    <p className="text-gray-500 dark:text-gray-400">No hay historial de cajas disponible</p>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </div>
            </div>

            {/* Modales */}
            <AperturaCajaModal
                show={showAperturaModal}
                onClose={handleCerrarModalApertura}
                cajas={cajas}
            />

            <CierreCajaModal
                show={showCierreModal}
                onClose={handleCerrarModalCierre}
                cajaAbierta={cajaAbiertaHoy}
                montoEsperado={cajaAbiertaHoy ? toNumber(cajaAbiertaHoy.monto_apertura) + toNumber(totalMovimientos) : 0}
            />

            <RegistrarMovimientoModal
                show={showMovimientoModal}
                onClose={() => setShowMovimientoModal(false)}
                tiposOperacion={props.tiposOperacion || []}
            />

            {/* ✅ NUEVO: Diálogo de confirmación para consolidación - Mejorado */}
            <AlertDialog open={showConsolidateDialog} onOpenChange={setShowConsolidateDialog}>
                <AlertDialogContent className="max-w-2xl max-h-96 overflow-y-auto">
                    <AlertDialogTitle className="text-xl font-bold">
                        ✅ Consolidar Cajas de {usuarioDestino?.name}
                    </AlertDialogTitle>

                    <AlertDialogDescription className="sr-only">
                        Diálogo de confirmación para consolidar cajas cerradas con estado pendiente
                    </AlertDialogDescription>

                    <div className="space-y-4">
                        {/* Información del usuario objetivo y consolidador */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-3">
                                <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-1">👤 Caja de Usuario</p>
                                <p className="text-sm text-blue-800 dark:text-blue-300">
                                    {usuarioDestino?.name}
                                </p>
                                <p className="text-xs text-blue-600 dark:text-blue-400">
                                    {usuarioDestino?.email}
                                </p>
                            </div>
                            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg p-3">
                                <p className="text-xs text-purple-600 dark:text-purple-400 font-semibold mb-1">✅ Consolidado por</p>
                                <p className="text-sm text-purple-800 dark:text-purple-300">
                                    Admin (Tú)
                                </p>
                                <p className="text-xs text-purple-600 dark:text-purple-400">
                                    {new Date().toLocaleDateString('es-BO')} {new Date().toLocaleTimeString('es-BO')}
                                </p>
                            </div>
                        </div>

                        {/* Resumen de cierres */}
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-3">
                            <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">
                                🔒 Cajas Cerradas Pendiente de Consolidación:
                            </p>
                            <p className="text-sm text-yellow-700 dark:text-yellow-200 mt-1">
                                Se aprobarán <strong>{cierresPendientes}</strong> caja(s) cerrada(s) con estado PENDIENTE
                            </p>
                        </div>

                        {/* Detalle de cada cierre pendiente - Mejorado */}
                        {cierresPendientesDetalle.length > 0 && (
                            <div className="space-y-2">
                                <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                    📋 Detalles de cierres pendientes:
                                </p>
                                <div className="space-y-2 max-h-52 overflow-y-auto">
                                    {cierresPendientesDetalle.map((cierre: any, idx: number) => (
                                        <div
                                            key={idx}
                                            className="bg-gray-50 dark:bg-gray-700 rounded p-3 text-xs space-y-2 border-l-4 border-yellow-400"
                                        >
                                            {/* Encabezado: Caja y ID */}
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <span className="font-semibold text-gray-900 dark:text-white">
                                                        {cierre.caja_nombre}
                                                    </span>
                                                    <span className="text-gray-500 dark:text-gray-400 ml-2">
                                                        (Apertura #{cierre.id})
                                                    </span>
                                                </div>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                    ⏳ Pendiente
                                                </span>
                                            </div>

                                            {/* Fechas de apertura y cierre */}
                                            <div className="grid grid-cols-2 gap-2 text-gray-600 dark:text-gray-400">
                                                <div>
                                                    <span className="font-medium">📅 Abierta:</span> {new Date(cierre.fecha_apertura).toLocaleDateString('es-BO', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    })}
                                                </div>
                                                <div>
                                                    <span className="font-medium">🕐 Cerrada:</span> {cierre.fecha_cierre ? new Date(cierre.fecha_cierre).toLocaleDateString('es-BO', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit'
                                                    }) : '-'}
                                                </div>
                                            </div>

                                            {/* Montos */}
                                            <div className="grid grid-cols-3 gap-2">
                                                <div className="bg-white dark:bg-gray-600 rounded p-1">
                                                    <p className="text-gray-600 dark:text-gray-300">💰 Real</p>
                                                    <p className="font-semibold">${Number(cierre.monto_real || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className="bg-white dark:bg-gray-600 rounded p-1">
                                                    <p className="text-gray-600 dark:text-gray-300">📊 Esperado</p>
                                                    <p className="font-semibold">${Number(cierre.monto_esperado || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                                                </div>
                                                <div className={`rounded p-1 ${
                                                    cierre.diferencia > 0
                                                        ? 'bg-green-100 dark:bg-green-900'
                                                        : cierre.diferencia < 0
                                                            ? 'bg-red-100 dark:bg-red-900'
                                                            : 'bg-blue-100 dark:bg-blue-900'
                                                }`}>
                                                    <p className="text-gray-600 dark:text-gray-300">Δ Diferencia</p>
                                                    <p className={`font-semibold ${
                                                        cierre.diferencia > 0
                                                            ? 'text-green-700 dark:text-green-300'
                                                            : cierre.diferencia < 0
                                                                ? 'text-red-700 dark:text-red-300'
                                                                : 'text-blue-700 dark:text-blue-300'
                                                    }`}>
                                                        {cierre.diferencia > 0 ? '+' : ''}{Number(cierre.diferencia || 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Observaciones si existen */}
                                            {cierre.observaciones && (
                                                <div className="bg-white dark:bg-gray-600 rounded p-2 border-l-2 border-blue-400">
                                                    <p className="text-gray-600 dark:text-gray-300 font-medium">📝 Notas:</p>
                                                    <p className="text-gray-700 dark:text-gray-200">{cierre.observaciones}</p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Resumen de totales */}
                        {cierresPendientesDetalle.length > 0 && (
                            <div className="bg-slate-100 dark:bg-slate-700 rounded-lg p-3">
                                <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                                    📊 Resumen Total
                                </p>
                                <div className="grid grid-cols-4 gap-2 text-xs">
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Cajas</p>
                                        <p className="font-bold text-slate-900 dark:text-white">{cierresPendientesDetalle.length}</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Total Real</p>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            ${cierresPendientesDetalle.reduce((sum: number, c: any) => sum + Number(c.monto_real || 0), 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Total Esperado</p>
                                        <p className="font-bold text-slate-900 dark:text-white">
                                            ${cierresPendientesDetalle.reduce((sum: number, c: any) => sum + Number(c.monto_esperado || 0), 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-slate-600 dark:text-slate-400">Δ Total</p>
                                        <p className={`font-bold ${
                                            cierresPendientesDetalle.reduce((sum: number, c: any) => sum + Number(c.diferencia || 0), 0) > 0
                                                ? 'text-green-600'
                                                : cierresPendientesDetalle.reduce((sum: number, c: any) => sum + Number(c.diferencia || 0), 0) < 0
                                                    ? 'text-red-600'
                                                    : 'text-slate-900 dark:text-white'
                                        }`}>
                                            ${cierresPendientesDetalle.reduce((sum: number, c: any) => sum + Number(c.diferencia || 0), 0).toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Advertencia */}
                        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-3">
                            <p className="text-xs font-semibold text-red-800 dark:text-red-300">
                                ⚠️ Advertencia:
                            </p>
                            <p className="text-xs text-red-700 dark:text-red-200 mt-1">
                                Esta acción aprobará automáticamente todos los cierres pendientes. No se puede deshacer.
                            </p>
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-4">
                        <AlertDialogCancel disabled={isConsolidating}>
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmConsolidar}
                            disabled={isConsolidating}
                            className="bg-green-600 hover:bg-green-700 disabled:opacity-50"
                        >
                            {isConsolidating ? '⏳ Consolidando...' : '✅ Consolidar'}
                        </AlertDialogAction>
                    </div>
                </AlertDialogContent>
            </AlertDialog>

            {/* ✅ NUEVO: Toaster para notificaciones */}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
            />
        </AppLayout>
    );
}
