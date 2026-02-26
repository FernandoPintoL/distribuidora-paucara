import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { ArrowLeft, Package, Wifi, WifiOff, CheckCircle2, Navigation, Flag } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { Entrega, VehiculoCompleto, EstadoEntrega } from '@/domain/entities/entregas';

import EntregaFlujoCarga from './components/EntregaFlujoCarga';
import VentasEntregaSection from './components/VentasEntregaSection';
import ProductosAgrupados from './components/ProductosAgrupados';
import ResumenPagosEntrega from './components/ResumenPagosEntrega';
import ConfirmacionesEntregaSection from './components/ConfirmacionesEntregaSection';
import { CorregirPagoModal } from './components/CorregirPagoModal';
import { EntregaActionsModal } from '@/presentation/components/logistica/entrega-actions-modal';
import EstadoBadge from '@/presentation/components/logistica/EstadoBadge';
import EstregaMap from '@/presentation/components/logistica/EstregaMap';
import EntregaHistorialCambios from '@/presentation/components/logistica/EntregaHistorialCambios';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
import { useState, useEffect } from 'react';
import { useEntregaNotifications } from '@/application/hooks/use-entrega-notifications';
import { useToastNotifications } from '@/application/hooks/use-toast-notifications';
import { useWebSocket } from '@/application/hooks/use-websocket';
import type { VentaEntrega } from '@/domain/entities/entregas';

interface TipoPago {
    id: number;
    nombre: string;
    activo: boolean;
}

interface DesglosePago {
    tipo_pago_id: number;
    tipo_pago_nombre: string;
    monto: number;
    referencia?: string;
}

interface ShowProps {
    entrega: Entrega;
    vehiculos?: VehiculoCompleto[];
    tiposPago: TipoPago[];
}

/* const estadoBadgeColor: Record<string, string> = {
    PROGRAMADO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    ASIGNADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    EN_CAMINO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    LLEGO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
    NOVEDAD: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    CANCELADA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
}; */

export default function EntregaShow({ entrega: initialEntrega, tiposPago }: ShowProps) {
    const [entrega, setEntrega] = useState<Entrega>(initialEntrega);
    const [isLive, setIsLive] = useState(false);
    const [isOutputModalOpen, setIsOutputModalOpen] = useState(false);
    const [isMarking, setIsMarking] = useState(false);
    const [isInitiatingRoute, setIsInitiatingRoute] = useState(false);
    const [isFinalizingDelivery, setIsFinalizingDelivery] = useState(false);
    const [corrigiendo, setCorrigiendo] = useState<{ ventaId: number; ventaNumero: string; ventaTotal: number; desglose: DesglosePago[] } | null>(null);
    // ✅ NUEVO: Estado para confirmación de entrega individual
    const [confirmandoEntrega, setConfirmandoEntrega] = useState<VentaEntrega | null>(null);
    // ✅ NUEVO: Estado para confirmación existente (editar)
    const [confirmacionExistente, setConfirmacionExistente] = useState<any>(null);

    // ✅ DEBUG: Ver qué datos llegan del backend
    useEffect(() => {
        console.log('📦 [ENTREGA RECIBIDA DEL BACKEND]', initialEntrega);
        /* console.log('🔍 [DEBUG] confirmacionesVentas:', {
            existe: !!initialEntrega?.confirmacionesVentas,
            cantidad: initialEntrega?.confirmacionesVentas?.length ?? 0,
            datos: initialEntrega?.confirmacionesVentas,
        }); */
    }, [initialEntrega]);

    // ✅ Cargar confirmación existente cuando se selecciona una venta
    useEffect(() => {
        if (confirmandoEntrega && entrega.confirmacionesVentas) {
            const confirmacion = entrega.confirmacionesVentas.find(
                (c: any) => c.venta_id === confirmandoEntrega.id
            );
            setConfirmacionExistente(confirmacion || null);
        } else {
            setConfirmacionExistente(null);
        }
    }, [confirmandoEntrega, entrega.confirmacionesVentas]);

    // Hooks para sincronización en tiempo real
    const { isConnected, on, off } = useWebSocket();
    const { showNotification } = useToastNotifications();

    // Configurar notificaciones en tiempo real
    useEntregaNotifications(Number(entrega.id), {
        onNotification: (data) => showNotification(data),
        enableLogging: true,
    });

    // WebSocket listener para cambios de estado en tiempo real
    useEffect(() => {
        if (!isConnected) return;

        const channel = `entrega.${entrega.id}`;

        const handleEstadoCambio = (newEntrega: Entrega) => {
            console.log('[SHOW] Cambio de estado recibido:', {
                estadoAnterior: entrega.estado_entrega_codigo,
                estadoNuevo: newEntrega.estado_entrega_codigo,
                timestamp: new Date().toISOString(),
            });

            // Actualizar estado localmente
            setEntrega(newEntrega);

            // Timeline se actualiza automáticamente porque depende de entrega.estado_entrega_codigo
        };

        on(`${channel}:estado-cambio`, handleEstadoCambio);

        return () => {
            off(`${channel}:estado-cambio`, handleEstadoCambio);
        };
    }, [on, off, isConnected, entrega.id]);

    // WebSocket listener para actualizaciones de ubicación en tiempo real
    /* useEffect(() => {
        if (!isConnected) return;

        const channel = `entrega.${entrega.id}`;

        const handleUbicacionActualizada = (data: any) => {
            console.log('[SHOW] Nueva ubicación recibida en tiempo real:', {
                latitud: data.latitud,
                longitud: data.longitud,
                velocidad: data.velocidad,
                timestamp: data.timestamp,
            });

            // El componente EstregaMap se actualiza automáticamente
            // porque el hook useTracking recibe los datos vía WebSocket
            // No necesitamos hacer nada aquí, es solo para logging
        };

        on(`${channel}:ubicacion.actualizada`, handleUbicacionActualizada);

        return () => {
            off(`${channel}:ubicacion.actualizada`, handleUbicacionActualizada);
        };
    }, [on, off, isConnected, entrega.id]); */

    // Monitor de conexión WebSocket
    /* useEffect(() => {
        const handleConnect = () => {
            console.log('[SHOW] WebSocket conectado');
            setIsLive(true);
        };

        const handleDisconnect = () => {
            console.log('[SHOW] WebSocket desconectado');
            setIsLive(false);
        };

        if (isConnected) {
            on('websocket:connected', handleConnect);
            on('websocket:disconnected', handleDisconnect);

            setIsLive(true);

            return () => {
                off('websocket:connected', handleConnect);
                off('websocket:disconnected', handleDisconnect);
            };
        } else {
            setIsLive(false);
        }
    }, [on, off, isConnected]); */

    // ✅ NUEVO: Handler para marcar entrega como listo para entrega
    const handleMarcarListoParaEntrega = async () => {
        setIsMarking(true);
        console.log('[SHOW] 📤 Iniciando: Marcar como listo para entrega');
        console.log(`[SHOW] 🔗 Endpoint: POST /api/entregas/${entrega.id}/listo-para-entrega`);
        try {
            const response = await fetch(`/api/entregas/${entrega.id}/listo-para-entrega`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            console.log('[SHOW] 📥 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            const data = await response.json();
            console.log('[SHOW] ✅ Datos parseados:', data);
            console.log('[SHOW] 🔍 Completa respuesta JSON:', JSON.stringify(data, null, 2));

            if (response.ok && data.success) {
                console.log('[SHOW] ✨ Éxito - Mostrando notificación');
                showNotification({
                    title: '✅ Éxito',
                    message: data.message || 'Operación completada',
                    type: 'success',
                });
                // Recargar la página para ver el cambio de estado
                console.log('[SHOW] ⏳ Recargando página en 1.5 segundos...');
                setTimeout(() => {
                    router.reload();
                }, 1500);
            } else {
                console.log('[SHOW] ❌ Error en respuesta:', data);
                console.log('[SHOW] 📊 Status:', response.status, response.statusText);
                showNotification({
                    title: '❌ Error',
                    message: data.message || data.error || 'Operación no completada',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('[SHOW] ❌ Excepción al marcar listo para entrega:', error);
            showNotification({
                title: '❌ Error',
                message: error instanceof Error ? error.message : 'Error desconocido',
                type: 'error',
            });
        } finally {
            setIsMarking(false);
        }
    };

    // ✅ NUEVO: Handler para iniciar ruta
    const handleIniciarRuta = async () => {
        setIsInitiatingRoute(true);
        console.log('[SHOW] 📤 Iniciando: Iniciar ruta');
        console.log(`[SHOW] 🔗 Endpoint: POST /api/chofer/entregas/${entrega.id}/iniciar-ruta`);
        try {
            const response = await fetch(`/api/chofer/entregas/${entrega.id}/iniciar-ruta`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            console.log('[SHOW] 📥 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            const data = await response.json();
            console.log('[SHOW] ✅ Datos parseados:', data);
            console.log('[SHOW] 🔍 Completa respuesta JSON:', JSON.stringify(data, null, 2));

            if (response.ok && data.success) {
                console.log('[SHOW] ✨ Éxito - Mostrando notificación');
                showNotification({
                    title: '✅ Éxito',
                    message: data.message || 'Operación completada',
                    type: 'success',
                });
                // Recargar la página para ver el cambio de estado
                console.log('[SHOW] ⏳ Recargando página en 1.5 segundos...');
                setTimeout(() => {
                    router.reload();
                }, 1500);
            } else {
                console.log('[SHOW] ❌ Error en respuesta:', data);
                console.log('[SHOW] 📊 Status:', response.status, response.statusText);
                showNotification({
                    title: '❌ Error',
                    message: data.message || data.error || 'Operación no completada',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('[SHOW] ❌ Excepción al iniciar ruta:', error);
            showNotification({
                title: '❌ Error',
                message: error instanceof Error ? error.message : 'Error desconocido',
                type: 'error',
            });
        } finally {
            setIsInitiatingRoute(false);
        }
    };

    // ✅ NUEVO: Handler para finalizar entrega
    const handleFinalizarEntrega = async () => {
        setIsFinalizingDelivery(true);
        console.log('[SHOW] 📤 Iniciando: Finalizar entrega');
        console.log(`[SHOW] 🔗 Endpoint: POST /api/chofer/entregas/${entrega.id}/finalizar-entrega`);
        try {
            const response = await fetch(`/api/chofer/entregas/${entrega.id}/finalizar-entrega`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            console.log('[SHOW] 📥 Respuesta recibida:', {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
            });

            const data = await response.json();
            console.log('[SHOW] ✅ Datos parseados:', data);
            console.log('[SHOW] 🔍 Completa respuesta JSON:', JSON.stringify(data, null, 2));

            if (response.ok && data.success) {
                console.log('[SHOW] ✨ Éxito - Mostrando notificación');
                showNotification({
                    title: '✅ Éxito',
                    message: data.message || 'Operación completada',
                    type: 'success',
                });
                // Recargar la página para ver el cambio de estado
                console.log('[SHOW] ⏳ Recargando página en 1.5 segundos...');
                setTimeout(() => {
                    router.reload();
                }, 1500);
            } else {
                console.log('[SHOW] ❌ Error en respuesta:', data);
                console.log('[SHOW] 📊 Status:', response.status, response.statusText);
                showNotification({
                    title: '❌ Error',
                    message: data.message || data.error || 'Operación no completada',
                    type: 'error',
                });
            }
        } catch (error) {
            console.error('[SHOW] ❌ Excepción al finalizar entrega:', error);
            showNotification({
                title: '❌ Error',
                message: error instanceof Error ? error.message : 'Error desconocido',
                type: 'error',
            });
        } finally {
            setIsFinalizingDelivery(false);
        }
    };

    // console.log('Entrega data:', entrega.numero_entrega);
    // const cliente: ClienteEntrega | undefined = entrega.venta?.cliente || entrega.proforma?.cliente;
    const numero: string = String(entrega.proforma?.numero || entrega.venta?.numero || entrega.numero || `#${entrega.id}`);

    // Estados del nuevo flujo de carga
    const cargoFlowStates = [
        'PREPARACION_CARGA',
        'EN_CARGA',
        'LISTO_PARA_ENTREGA',
        'EN_TRANSITO',
        'ENTREGADO',
    ];

    // Usar estado_entrega_codigo (más confiable) o caer a estado como fallback
    const estadoActualParaValidar = entrega.estado_entrega_codigo ?? entrega.estado;
    const isInCargoFlow = cargoFlowStates.includes(estadoActualParaValidar);

    return (
        <AppLayout>
            <Head title={`Entrega ${numero}`} />

            <div className="space-y-6 p-6 mx-auto bg-white dark:bg-slate-950">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit('/logistica/entregas')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entrega Folio: {numero}</h1>
                            <p>{entrega.numero_entrega}</p>
                            <p className="text-gray-500 dark:text-gray-400">Detalles de la entrega</p>
                        </div>
                    </div>

                    <EstadoBadge entrega={entrega} />

                    <div className="flex gap-2 items-center">
                        {/* ✅ NUEVO: Botón para marcar como listo para entrega - SOLO en PREPARACION_CARGA */}
                        {estadoActualParaValidar === 'PREPARACION_CARGA' && (
                            <Button
                                onClick={handleMarcarListoParaEntrega}
                                disabled={isMarking}
                                variant="default"
                                className="bg-green-600 hover:bg-green-700 text-white w-full sm:w-auto"
                            >
                                <CheckCircle2 className="w-4 h-4 mr-2" />
                                {isMarking ? 'Procesando...' : 'Listo para Entrega'}
                            </Button>
                        )}

                        {/* ✅ NUEVO: Botón para iniciar ruta - SOLO en LISTO_PARA_ENTREGA */}
                        {estadoActualParaValidar === 'LISTO_PARA_ENTREGA' && (
                            <Button
                                onClick={handleIniciarRuta}
                                disabled={isInitiatingRoute}
                                variant="default"
                                className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto"
                            >
                                <Navigation className="w-4 h-4 mr-2" />
                                {isInitiatingRoute ? 'Iniciando...' : 'Iniciar Ruta'}
                            </Button>
                        )}

                        {/* ✅ NUEVO: Botón para finalizar entrega - SOLO en EN_TRANSITO */}
                        {estadoActualParaValidar === 'EN_TRANSITO' && (
                            <Button
                                onClick={handleFinalizarEntrega}
                                disabled={isFinalizingDelivery}
                                variant="default"
                                className="bg-red-600 hover:bg-red-700 text-white w-full sm:w-auto"
                            >
                                <Flag className="w-4 h-4 mr-2" />
                                {isFinalizingDelivery ? 'Finalizando...' : 'Finalizar Entrega'}
                            </Button>
                        )}

                        {/* Botón para abrir modal de impresión/descarga */}
                        <Button
                            onClick={() => setIsOutputModalOpen(true)}
                            variant="outline"
                            className="w-full sm:w-auto"
                        >
                            <Package className="w-4 h-4 mr-2" />
                            Imprimir
                        </Button>
                    </div>

                    {/* Modal de selección de formato de impresión/descarga */}
                    <OutputSelectionModal
                        isOpen={isOutputModalOpen}
                        onClose={() => setIsOutputModalOpen(false)}
                        documentoId={entrega.id as number | string}
                        tipoDocumento="entrega"
                        documentoInfo={{
                            numero: entrega.numero_entrega,
                            fecha: entrega.fecha_asignacion,
                        }}
                    />

                    {/* ✅ NUEVO: Modal mejorado para confirmar entrega de venta */}
                    {confirmandoEntrega && (
                        <EntregaActionsModal
                            entrega={entrega}
                            venta={confirmandoEntrega as any}
                            confirmacionExistente={confirmacionExistente}
                            isOpen={Boolean(confirmandoEntrega)}
                            onClose={() => setConfirmandoEntrega(null)}
                            actionType="confirmar-entrega"
                            onSuccess={() => {
                                setConfirmandoEntrega(null);
                                // Recargar la página para reflejar cambios
                                setTimeout(() => {
                                    router.reload();
                                }, 1000);
                            }}
                        />
                    )}

                    {/* ✅ NUEVO: Modal para corregir pagos */}
                    {corrigiendo && (
                        <CorregirPagoModal
                            isOpen={Boolean(corrigiendo)}
                            onClose={() => setCorrigiendo(null)}
                            entregaId={entrega.id as number}
                            ventaId={corrigiendo.ventaId}
                            ventaNumero={corrigiendo.ventaNumero}
                            ventaTotal={corrigiendo.ventaTotal}
                            desgloseActual={corrigiendo.desglose}
                            tiposPago={tiposPago}
                        />
                    )}
                </div>

                {/* Información del Lote - Entregas con mismo chofer y vehículo */}
                {entrega.chofer && entrega.vehiculo && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-900 dark:text-purple-200">
                            <Package className="w-5 h-5" />
                            Contexto del Lote
                        </h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Chofer Asignado</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">{entrega.chofer.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Vehículo</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        {entrega.vehiculo.placa}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Fecha Programada</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        {new Date(entrega.fecha_programada).toLocaleDateString('es-ES', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Peso Entrega</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        {entrega.peso_kg ? `${entrega.peso_kg} kg` : 'N/A'}
                                    </p>
                                </div>
                                {/* ✅ NUEVO (2026-02-12): Mostrar entregador */}
                                {entrega.entregador && (
                                    <div>
                                        <p className="text-sm text-purple-700 dark:text-purple-300">Entregador</p>
                                        <p className="font-medium text-purple-900 dark:text-purple-100">{entrega.entregador.name}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Productos Agrupados - Consolidación de productos de todas las ventas */}
                {entrega.id && (
                    <ProductosAgrupados
                        entregaId={entrega.id as number}
                        mostrarDetalleVentas={true}
                    />
                )}

                {entrega.ventas && entrega.ventas.length > 0 && (
                    <VentasEntregaSection
                        entrega={entrega}
                        ventas={entrega.ventas}
                        totalVentas={entrega.ventas.length}
                        onConfirmarEntrega={(venta) => {
                            setConfirmandoEntrega(venta);
                        }}
                        onCorregirPago={(ventaId, ventaNumero, ventaTotal, desglose) => {
                            setCorrigiendo({ ventaId, ventaNumero, ventaTotal, desglose });
                        }}
                    />
                )}

                {/* ✅ NUEVA 2026-02-12: Resumen de Pagos */}
                {entrega.id && (
                    <ResumenPagosEntrega entregaId={entrega.id} />
                )}

                {/* ✅ NUEVA 2026-02-17: Reportes del Chofer - Confirmaciones de Entregas */}
                {entrega.confirmacionesVentas && entrega.confirmacionesVentas.length > 0 && (
                    <ConfirmacionesEntregaSection
                        confirmaciones={entrega.confirmacionesVentas}
                        ventasEnEntrega={entrega.ventas}
                    />
                )}

                {/* Historial de Cambios de Estado */}
                {/* <EntregaHistorialCambios entrega={entrega} /> */}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/logistica/entregas')}
                        className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
