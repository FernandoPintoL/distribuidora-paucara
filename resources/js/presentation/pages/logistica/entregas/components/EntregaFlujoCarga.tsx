/**
 * Presentación: EntregaFlujoCarga
 *
 * Componente para gestionar el flujo de carga de una entrega:
 * PREPARACION_CARGA → EN_CARGA → LISTO_PARA_ENTREGA → EN_TRANSITO → ENTREGADO
 *
 * ARQUITECTURA LIMPIA:
 * ✅ Solo renderiza UI
 * ✅ Maneja transiciones de estado
 */

import { useState } from 'react';
import { Card } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import {
    CheckCircle,
    AlertCircle,
    MapPin,
    Truck,
    Loader,
    Package,
} from 'lucide-react';
import type { Entrega } from '@/domain/entities/entregas';
import UbicacionMapa from './UbicacionMapa';

interface EntregaFlujoCargoProps {
    entrega: Entrega;
    onStateChange?: (newState: string) => void;
}

export default function EntregaFlujoCarga({
    entrega,
    onStateChange,
}: EntregaFlujoCargoProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isAutoGeolocating, setIsAutoGeolocating] = useState(false);

    const flujoEstados = [
        {
            estado: 'PREPARACION_CARGA',
            label: 'Preparación de Carga',
            descripcion: 'Reporte generado, esperando carga física',
            icon: Package,
            color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
        },
        {
            estado: 'EN_CARGA',
            label: 'En Carga',
            descripcion: 'Carga física en progreso',
            icon: Truck,
            color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/30 dark:text-cyan-200',
        },
        {
            estado: 'LISTO_PARA_ENTREGA',
            label: 'Listo para Entrega',
            descripcion: 'Carga completada, listo para partir',
            icon: CheckCircle,
            color: 'bg-lime-100 text-lime-800 dark:bg-lime-900/30 dark:text-lime-200',
        },
        {
            estado: 'EN_TRANSITO',
            label: 'En Tránsito',
            descripcion: 'En ruta con seguimiento GPS',
            icon: MapPin,
            color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
        },
        {
            estado: 'ENTREGADO',
            label: 'Entregado',
            descripcion: 'Entrega completada',
            icon: CheckCircle,
            color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        },
    ];

    const currentStateIndex = flujoEstados.findIndex((e) => e.estado === entrega.estado);
    const currentState = flujoEstados[currentStateIndex];

    const handleConfirmarCarga = async () => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await fetch(`/api/entregas/${entrega.id}/confirmar-carga`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                let errorMsg = `Error confirmando carga (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                    console.error('❌ [EntregaFlujoCarga] Error confirmando carga:', {
                        status: response.status,
                        message: errorData.message,
                        errors: errorData.errors,
                        fullResponse: errorData,
                    });
                } catch {
                    console.error('❌ [EntregaFlujoCarga] Error confirmando carga (no JSON):', response.statusText);
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            console.log('✅ [EntregaFlujoCarga] Carga confirmada exitosamente:', result);
            if (result.success) {
                onStateChange?.('EN_CARGA');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ [EntregaFlujoCarga] Error capturado:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const obtenerGeolocalización = (): Promise<{ latitud: number; longitud: number }> => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocalización no disponible en tu navegador'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude,
                    });
                    console.log('✅ [EntregaFlujoCarga] Geolocalización obtenida:', {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                    });
                },
                (error) => {
                    console.warn('⚠️ [EntregaFlujoCarga] Error obteniendo geolocalización:', error.message);
                    // Usar ubicación por defecto si falla
                    resolve({
                        latitud: 0,
                        longitud: 0,
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0,
                }
            );
        });
    };

    // Ejecutar flujo automático: obtener ubicación e iniciar tránsito sin pasar por LISTO_PARA_ENTREGA
    const ejecutarFlujoAutomatico = async () => {
        setIsAutoGeolocating(true);
        setError(null);
        console.log('🔍 [EntregaFlujoCarga] Iniciando flujo automático: obteniendo geolocalización...');
        try {
            const geoLocation = await obtenerGeolocalización();
            console.log('📍 [EntregaFlujoCarga] Ubicación obtenida:', geoLocation);
            console.log('🚀 [EntregaFlujoCarga] Iniciando tránsito automáticamente...');
            await iniciarTransitoAutomatico(geoLocation);
        } catch (geoError) {
            console.warn('⚠️ [EntregaFlujoCarga] Error obteniendo geolocalización, usando 0,0:', geoError);
            // Iniciar tránsito incluso sin ubicación válida
            await iniciarTransitoAutomatico({ latitud: 0, longitud: 0 });
        } finally {
            setIsAutoGeolocating(false);
        }
    };

    const handleMarcarListoParaEntrega = async () => {
        try {
            setError(null);
            setIsLoading(true);

            const response = await fetch(`/api/entregas/${entrega.id}/listo-para-entrega`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            if (!response.ok) {
                let errorMsg = `Error marcando como listo (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                    console.error('❌ [EntregaFlujoCarga] Error marcando como listo:', {
                        status: response.status,
                        message: errorData.message,
                        errors: errorData.errors,
                    });
                } catch {
                    console.error('❌ [EntregaFlujoCarga] Error marcando como listo (no JSON):', response.statusText);
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            console.log('✅ [EntregaFlujoCarga] Marcado como LISTO_PARA_ENTREGA');
            if (result.success) {
                onStateChange?.('LISTO_PARA_ENTREGA');
                // Ejecutar flujo automático después de marcar como listo
                await ejecutarFlujoAutomatico();
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ [EntregaFlujoCarga] Error:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const iniciarTransitoAutomatico = async (geoLocation: { latitud: number; longitud: number }) => {
        try {
            const response = await fetch(`/api/entregas/${entrega.id}/iniciar-transito`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    latitud: geoLocation.latitud,
                    longitud: geoLocation.longitud,
                }),
            });

            if (!response.ok) {
                let errorMsg = `Error iniciando tránsito (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    // Sin error message
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            console.log('✅ [EntregaFlujoCarga] Tránsito iniciado automáticamente:', result);
            if (result.success) {
                // Actualizar ubicación inmediatamente en el objeto entrega
                entrega.latitud = geoLocation.latitud;
                entrega.longitud = geoLocation.longitud;
                console.log('📍 [EntregaFlujoCarga] Ubicación actualizada en entrega:', { latitud: geoLocation.latitud, longitud: geoLocation.longitud });
                onStateChange?.('EN_TRANSITO');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ [EntregaFlujoCarga] Error iniciando tránsito automático:', errorMessage);
        }
    };

    /* const handleIniciarTransito = async () => {
        if (gpsData.latitud === 0 || gpsData.longitud === 0) {
            setError('Ingrese coordenadas GPS válidas');
            return;
        }

        try {
            setError(null);
            setIsLoading(true);
            await iniciarTransitoAutomatico(gpsData);
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ [EntregaFlujoCarga] Error capturado:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    }; */

    if (!currentState) {
        return (
            <Card className="p-6">
                <p className="text-gray-500 dark:text-gray-400">Estado no soportado en este flujo</p>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Estado Actual */}
            <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
                    Estado Actual de la Entrega
                </h3>
                <div className="flex items-center gap-4">
                    <currentState.icon className="w-8 h-8 text-gray-600 dark:text-gray-400" />
                    <div>
                        <Badge className={currentState.color}>
                            {currentState.label}
                        </Badge>
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {currentState.descripcion}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Errores */}
            {error && (
                <Card className="bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 p-4">
                    <div className="flex gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <p className="text-red-700 dark:text-red-300">{error}</p>
                    </div>
                </Card>
            )}

            {/* Timeline de Flujo */}
            <Card className="p-6">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-6">
                    Flujo de Carga
                </h3>

                <div className="relative">
                    {/* Línea de progreso */}
                    <div className="absolute left-4 top-0 bottom-0 w-1 bg-gray-200 dark:bg-slate-700" />

                    {/* Pasos */}
                    <div className="space-y-6 relative z-10">
                        {flujoEstados.map((paso, index) => {
                            const isCompleted = index < currentStateIndex;
                            const isCurrent = index === currentStateIndex;
                            const isPending = index > currentStateIndex;
                            const PasoIcon = paso.icon;

                            return (
                                <div key={paso.estado} className="flex gap-4">
                                    {/* Indicador */}
                                    <div
                                        className={`relative z-10 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${isCompleted
                                            ? 'bg-green-500'
                                            : isCurrent
                                                ? 'bg-blue-500 ring-4 ring-blue-200 dark:ring-blue-900'
                                                : 'bg-gray-300 dark:bg-slate-600'
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle className="w-5 h-5 text-white" />
                                        ) : (
                                            <PasoIcon className="w-4 h-4 text-white" />
                                        )}
                                    </div>

                                    {/* Contenido */}
                                    <div className="flex-1 pb-6">
                                        <h4
                                            className={`font-medium ${isCurrent
                                                ? 'text-blue-600 dark:text-blue-400'
                                                : isCompleted
                                                    ? 'text-green-600 dark:text-green-400'
                                                    : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            {paso.label}
                                        </h4>
                                        <p
                                            className={`text-sm mt-1 ${isPending
                                                ? 'text-gray-400 dark:text-gray-500'
                                                : 'text-gray-600 dark:text-gray-400'
                                                }`}
                                        >
                                            {paso.descripcion}
                                        </p>

                                        {/* Acciones para estado actual */}
                                        {isCurrent && (
                                            <div className="mt-4">
                                                {paso.estado === 'PREPARACION_CARGA' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={handleConfirmarCarga}

                                                    >
                                                        Confirmar Carga
                                                    </Button>
                                                )}

                                                {paso.estado === 'EN_CARGA' && (
                                                    <Button
                                                        size="sm"
                                                        onClick={handleMarcarListoParaEntrega}

                                                    >
                                                        Marcar Listo
                                                    </Button>
                                                )}

                                                {paso.estado === 'LISTO_PARA_ENTREGA' && (
                                                    <>
                                                        {isAutoGeolocating ? (
                                                            <div className="flex items-center gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                                <Loader className="w-4 h-4 animate-spin text-blue-600 dark:text-blue-400" />
                                                                <span className="text-sm text-blue-600 dark:text-blue-400">
                                                                    Obteniendo ubicación e iniciando tránsito automáticamente...
                                                                </span>
                                                            </div>
                                                        ) : (
                                                            <Button
                                                                size="sm"
                                                                onClick={ejecutarFlujoAutomatico}
                                                                disabled={isAutoGeolocating}
                                                            >
                                                                <MapPin className="w-4 h-4 mr-2" />
                                                                Reintentar Flujo Automático
                                                            </Button>
                                                        )}
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </Card>

            {/* Mapa de ubicación en tiempo real (si está en tránsito) */}
            {entrega.estado === 'EN_TRANSITO' && (
                <Card className="p-6">
                    <UbicacionMapa
                        latitud={entrega.latitud || 0}
                        longitud={entrega.longitud || 0}
                        nombreChofer={entrega.chofer?.nombre}
                        placa={entrega.vehiculo?.placa}
                        entregaId={entrega.id as number}
                    />
                </Card>
            )}
        </div>
    );
}
