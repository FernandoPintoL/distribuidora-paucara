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
} from 'lucide-react';
import type { Entrega } from '@/domain/entities/entregas';

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
    const [gpsData, setGpsData] = useState({ latitud: 0, longitud: 0 });
    const [showGpsForm, setShowGpsForm] = useState(false);

    const flujoEstados = [
        /* {
            estado: 'PREPARACION_CARGA',
            label: 'Preparación de Carga',
            descripcion: 'Reporte generado, esperando carga física',
            icon: Package,
            color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
        }, */
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
            console.log('✅ [EntregaFlujoCarga] Listo para entrega:', result);
            if (result.success) {
                onStateChange?.('LISTO_PARA_ENTREGA');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ [EntregaFlujoCarga] Error capturado:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleIniciarTransito = async () => {
        if (gpsData.latitud === 0 || gpsData.longitud === 0) {
            setError('Ingrese coordenadas GPS válidas');
            return;
        }

        try {
            setError(null);
            setIsLoading(true);

            const response = await fetch(`/api/entregas/${entrega.id}/iniciar-transito`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    latitud: parseFloat(gpsData.latitud.toString()),
                    longitud: parseFloat(gpsData.longitud.toString()),
                }),
            });

            if (!response.ok) {
                let errorMsg = `Error iniciando tránsito (${response.status})`;
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                    console.error('❌ [EntregaFlujoCarga] Error iniciando tránsito:', {
                        status: response.status,
                        message: errorData.message,
                        errors: errorData.errors,
                    });
                } catch {
                    console.error('❌ [EntregaFlujoCarga] Error iniciando tránsito (no JSON):', response.statusText);
                }
                throw new Error(errorMsg);
            }

            const result = await response.json();
            console.log('✅ [EntregaFlujoCarga] Tránsito iniciado:', result);
            if (result.success) {
                setShowGpsForm(false);
                onStateChange?.('EN_TRANSITO');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
            setError(errorMessage);
            console.error('❌ [EntregaFlujoCarga] Error capturado:', errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

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
                                                        {!showGpsForm ? (
                                                            <Button
                                                                size="sm"
                                                                onClick={() => setShowGpsForm(true)}
                                                            >
                                                                <MapPin className="w-4 h-4 mr-2" />
                                                                Iniciar Tránsito
                                                            </Button>
                                                        ) : (
                                                            <div className="space-y-3 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg">
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        Latitud
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.000001"
                                                                        value={gpsData.latitud}
                                                                        onChange={(e) =>
                                                                            setGpsData((prev) => ({
                                                                                ...prev,
                                                                                latitud: parseFloat(e.target.value),
                                                                            }))
                                                                        }
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white"
                                                                        placeholder="Ej: -16.5023"
                                                                    />
                                                                </div>
                                                                <div>
                                                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                                                        Longitud
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        step="0.000001"
                                                                        value={gpsData.longitud}
                                                                        onChange={(e) =>
                                                                            setGpsData((prev) => ({
                                                                                ...prev,
                                                                                longitud: parseFloat(e.target.value),
                                                                            }))
                                                                        }
                                                                        className="w-full px-2 py-1 text-sm border border-gray-300 dark:border-slate-600 rounded dark:bg-slate-700 dark:text-white"
                                                                        placeholder="Ej: -68.1192"
                                                                    />
                                                                </div>
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        size="sm"
                                                                        onClick={handleIniciarTransito}

                                                                    >
                                                                        {isLoading && <Loader className="w-3 h-3 mr-1 animate-spin" />}
                                                                        Enviar
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => setShowGpsForm(false)}
                                                                    >
                                                                        Cancelar
                                                                    </Button>
                                                                </div>
                                                            </div>
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

            {/* Información GPS (si está en tránsito) */}
            {entrega.estado === 'EN_TRANSITO' && (
                <Card className="p-6 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <MapPin className="w-5 h-5 text-purple-600" />
                        Ubicación Actual
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Latitud</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {entrega.latitud?.toFixed(6) || 'N/A'}
                            </p>
                        </div>
                        <div>
                            <p className="text-gray-600 dark:text-gray-400">Longitud</p>
                            <p className="font-medium text-gray-900 dark:text-white">
                                {entrega.longitud?.toFixed(6) || 'N/A'}
                            </p>
                        </div>
                        {entrega.updated_at && (
                            <div className="col-span-2">
                                <p className="text-gray-600 dark:text-gray-400">Última actualización</p>
                                <p className="font-medium text-gray-900 dark:text-white text-sm">
                                    {new Date(entrega.updated_at).toLocaleString('es-ES')}
                                </p>
                            </div>
                        )}
                    </div>
                </Card>
            )}
        </div>
    );
}
