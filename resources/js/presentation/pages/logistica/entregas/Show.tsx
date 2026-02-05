import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { ArrowLeft, Package, Wifi, WifiOff } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { Entrega, VehiculoCompleto, EstadoEntrega } from '@/domain/entities/entregas';

import EntregaFlujoCarga from './components/EntregaFlujoCarga';
import VentasEntregaSection from './components/VentasEntregaSection';
import ProductosAgrupados from './components/ProductosAgrupados';
import EstadoBadge from '@/presentation/components/logistica/EstadoBadge';
import EstregaMap from '@/presentation/components/logistica/EstregaMap';
import EntregaHistorialCambios from '@/presentation/components/logistica/EntregaHistorialCambios';
import { FormatoSelector } from '@/presentation/components/impresion/FormatoSelector';
import { useState, useEffect } from 'react';
import { useEntregaNotifications } from '@/application/hooks/use-entrega-notifications';
import { useToastNotifications } from '@/application/hooks/use-toast-notifications';
import { useWebSocket } from '@/application/hooks/use-websocket';

interface ShowProps {
    entrega: Entrega;
    vehiculos?: VehiculoCompleto[];
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

export default function EntregaShow({ entrega: initialEntrega }: ShowProps) {
    const [entrega, setEntrega] = useState<Entrega>(initialEntrega);
    const [isLive, setIsLive] = useState(false);

    // ✅ DEBUG: Ver qué datos llegan del backend
    useEffect(() => {
        console.log('📦 [ENTREGA RECIBIDA DEL BACKEND]', initialEntrega);
    }, []);

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
    useEffect(() => {
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
    }, [on, off, isConnected, entrega.id]);

    // Monitor de conexión WebSocket
    useEffect(() => {
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
    }, [on, off, isConnected]);

    console.log('Entrega data:', entrega.numero_entrega);
    // const cliente: ClienteEntrega | undefined = entrega.venta?.cliente || entrega.proforma?.cliente;
    const numero: string = String(entrega.proforma?.numero || entrega.venta?.numero || entrega.numero || `#${entrega.id}`);


    /* const handleGenerarReporte = async () => {
        setIsGeneratingReport(true);
        setReportError(null);

        try {
            const response = await fetch('/api/reportes-carga', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    entrega_id: entrega.id,
                    vehiculo_id: entrega.vehiculo_id,
                    peso_total_kg: entrega.peso_kg,
                    descripcion: `Reporte de carga para entrega #${entrega.id}`,
                }),
            });

            if (!response.ok) {
                let errorMsg = 'Error generando reporte';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    errorMsg = `Error del servidor (${response.status})`;
                }
                setReportError(errorMsg);
                throw new Error(errorMsg);
            }

            const result = await response.json();

            // Actualizar el estado de la entrega
            setEntrega((prev) => ({
                ...prev,
                reporte_carga_id: result.data?.id,
                estado: 'PREPARACION_CARGA',
            }));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error generando reporte:', msg);
            setReportError(msg);
        } finally {
            setIsGeneratingReport(false);
        }
    }; */

    /**
     * Descargar PDF del reporte
     */
    /* const handleDescargarPdf = async (reporteId: Id, detallado: boolean = false) => {
        try {
            const pdfLoadingState = detallado ? setLoadingPdfDetallado : setLoadingPdf;
            pdfLoadingState(reporteId);

            const endpoint = detallado
                ? `/api/reportes-carga/${reporteId}/pdf-detallado`
                : `/api/reportes-carga/${reporteId}/pdf`;

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Error descargando PDF (${response.status})`);
            }

            // Crear blob y descargar
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-${entrega.reportes?.[0]?.numero_reporte || 'carga'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando PDF:', error);
            alert('Error descargando PDF. Intenta de nuevo.');
        } finally {
            void (detallado ? setLoadingPdfDetallado(null) : setLoadingPdf(null));
        }
    }; */

    /**
     * Ver vista previa del PDF en navegador
     */
    /* const handleVerPdfPreview = async (reporteId: Id) => {
        try {
            window.open(
                `/api/reportes-carga/${reporteId}/pdf-preview`,
                '_blank',
                'width=1000,height=700'
            );
        } catch (error) {
            console.error('Error abriendo vista previa:', error);
            alert('Error abriendo vista previa. Intenta de nuevo.');
        }
    }; */

    /**
     * Imprimir reporte (abre diálogo de impresión del navegador)
     */
    /* const handleImprimirReporte = async (reporteId: Id) => {
        try {
            setLoadingPdf(reporteId);
            // Abre la vista previa y permite imprimir desde ahí
            const popup = window.open(
                `/api/reportes-carga/${reporteId}/pdf-preview`,
                'printWindow',
                'width=1000,height=700'
            );

            if (popup) {
                // Espera a que cargue el PDF
                setTimeout(() => {
                    popup.print();
                }, 1500);
            }
        } catch (error) {
            console.error('Error imprimiendo reporte:', error);
            alert('Error imprimiendo reporte. Intenta de nuevo.');
        } finally {
            setLoadingPdf(null);
        }
    }; */

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
    /* const estadoColors: Record<string, string> = {
        ...estadoBadgeColor,
        PREPARACION_CARGA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
        EN_CARGA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
        LISTO_PARA_ENTREGA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    }; */

    return (
        <AppLayout>
            <Head title={`Entrega ${numero}`} />

            <div className="space-y-6 p-6 max-w-4xl mx-auto bg-white dark:bg-slate-950 min-h-screen">
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
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entrega {numero} / {entrega.numero_entrega}</h1>
                            <p className="text-gray-500 dark:text-gray-400">Detalles de la entrega</p>
                        </div>
                    </div>

                    {/* Live Status Indicator */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-slate-800">
                            {isLive ? (
                                <>
                                    <Wifi className="w-4 h-4 text-green-500 animate-pulse" />
                                    <span className="text-xs font-medium text-green-600 dark:text-green-400">
                                        En vivo
                                    </span>
                                </>
                            ) : (
                                <>
                                    <WifiOff className="w-4 h-4 text-gray-400" />
                                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
                                        Desconectado
                                    </span>
                                </>
                            )}
                        </div>
                    </div>

                    <EstadoBadge entrega={entrega} />
                    {/* Selector de Formato de Impresión - Imprimir entrega en diferentes formatos */}
                    <FormatoSelector
                        documentoId={entrega.id as number | string}
                        tipoDocumento="entregas"
                        className="w-full sm:w-auto"
                    />
                </div>

                {/* Mapa de Tracking en Tiempo Real - Mostrar cuando está EN_TRANSITO */}
                {/* {entrega.estado_entrega_codigo === 'EN_TRANSITO' && (
                    <div className="pt-4">
                        <div className="mb-2">
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                                📍 Tracking en Tiempo Real
                            </h2>
                        </div>
                        <EstregaMap
                            entrega={entrega}
                            altura="500px"
                            mostrarPolilinea={true}
                            permitirSatellite={true}
                        />
                    </div>
                )} */}

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
                    />
                )}


                {/* Flujo de Carga - Mostrar si está en ese estado */}
                {isInCargoFlow && (
                    <div className="pt-4">
                        <EntregaFlujoCarga
                            entrega={entrega}
                            onStateChange={async (newState) => {
                                // Actualizar estado localmente
                                setEntrega((prev) => ({
                                    ...prev,
                                    estado: newState as EstadoEntrega,
                                }));

                                // Recargar datos del servidor para obtener coordenadas actualizadas
                                try {
                                    const response = await fetch(`/api/entregas/${entrega.id}`);
                                    if (response.ok) {
                                        const result = await response.json();
                                        if (result.data) {
                                            setEntrega(result.data);
                                            console.log('✅ [Show] Entrega recargada con datos actualizados:', result.data);
                                        }
                                    }
                                } catch (error) {
                                    console.warn('⚠️ [Show] Error recargando entrega:', error);
                                }
                            }}
                        />
                    </div>
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
