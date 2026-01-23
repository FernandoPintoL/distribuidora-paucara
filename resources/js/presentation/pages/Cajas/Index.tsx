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

import { Head } from '@inertiajs/react';
import { useState } from 'react';
import AppLayout from '@/layouts/app-layout';
import AperturaCajaModal from '@/presentation/components/AperturaCajaModal';
import CierreCajaModal from '@/presentation/components/CierreCajaModal';
import RegistrarMovimientoModal from '@/presentation/components/RegistrarGastoModal';
import { FormatoSelector } from '@/presentation/components/impresion/FormatoSelector';
import { CajaHeader, CajaEstadoCard, MovimientosDelDiaTable, HistorialAperturasTable } from './components';
import { useCajas } from '@/application/hooks/use-cajas';
import { toNumber } from '@/lib/cajas.utils';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/presentation/components/ui/tabs';
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

    const { movimientosHoy, totalMovimientos, esVistaAdmin = false, usuarioDestino } = props;

    // ✅ Título dinámico según contexto
    const titulo = esVistaAdmin ? `Caja de ${usuarioDestino?.name}` : 'Gestión de Cajas';

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

                    <CajaHeader cajaAbiertaHoy={cajaAbiertaHoy} esVistaAdmin={esVistaAdmin} />

                    <CajaEstadoCard
                        cajaAbiertaHoy={cajaAbiertaHoy}
                        totalMovimientos={totalMovimientos}
                        onAbrirClick={handleAbrirModal}
                        onCerrarClick={handleAbrirCierreModal}
                        onGastoClick={() => setShowMovimientoModal(true)}
                        cierreDatos={cajaAbiertaHoy?.cierre || undefined}
                        esVistaAdmin={esVistaAdmin}
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
        </AppLayout>
    );
}
