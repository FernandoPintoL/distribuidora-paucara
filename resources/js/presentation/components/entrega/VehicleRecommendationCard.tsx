import { useState, useMemo, useEffect } from 'react';
import { Card } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import SearchSelect from '@/presentation/components/ui/search-select';
import {
  Truck,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  TrendingUp,
  User,
} from 'lucide-react';
import type { VehiculoRecomendado } from '@/domain/entities/vehiculos';
import type { ChoferEntrega } from '@/domain/entities/entregas';
import type { Id } from '@/domain/entities/shared';

interface VehicleWithChofer extends VehiculoRecomendado {
  chofer_asignado_id?: Id | null;
}

interface VehicleRecommendationCardProps {
  recomendado: VehicleWithChofer | null;
  disponibles: VehicleWithChofer[];
  pesoTotal: number;
  isLoading: boolean;
  error: string | null;
  alerta: string | null;
  selectedVehiculoId?: Id;
  selectedChoferId?: Id | null;
  choferes?: ChoferEntrega[];
  onSelectVehiculo: (vehiculoId: Id) => void;
  onSelectChofer?: (choferId: Id) => void;
}

export function VehicleRecommendationCard({
  recomendado,
  disponibles,
  pesoTotal,
  isLoading,
  error,
  alerta,
  selectedVehiculoId,
  selectedChoferId,
  choferes = [],
  onSelectVehiculo,
  onSelectChofer,
}: VehicleRecommendationCardProps) {
  console.log('Renderizando VehicleRecommendationCard con props:', {
    recomendado,
    disponibles,
    pesoTotal,
  });
  const [showAllVehiculos, setShowAllVehiculos] = useState(false);
  const [seleccionarChoferManualmente, setSeleccionarChoferManualmente] = useState(false);

  // Determinar qué vehículo mostrar: recomendado o seleccionado
  const vehiculoActual = useMemo(() => {
    // Si hay un vehículo seleccionado y es diferente del recomendado, buscar en disponibles
    if (selectedVehiculoId && recomendado && selectedVehiculoId !== recomendado.id) {
      return disponibles.find((v) => v.id === selectedVehiculoId) || recomendado;
    }
    return recomendado;
  }, [selectedVehiculoId, recomendado, disponibles]);

  // Auto-seleccionar vehículo y chofer recomendado cuando se carga
  useEffect(() => {
    if (recomendado && !selectedVehiculoId) {
      // Auto-seleccionar el vehículo recomendado
      onSelectVehiculo(recomendado.id);

      // Auto-seleccionar el chofer asignado si existe
      if (recomendado.choferAsignado && onSelectChofer) {
        onSelectChofer(recomendado.choferAsignado.id);
        setSeleccionarChoferManualmente(false);
      }
    }
  }, [recomendado?.id, selectedVehiculoId]);

  // Generar opciones de choferes para SearchSelect
  const choferesOptions = useMemo(() => {
    return choferes.map((chofer) => ({
      value: chofer.id,
      label: chofer.nombre || chofer.name,
      description: chofer.telefono ? `Tel: ${chofer.telefono}` : undefined,
    }));
  }, [choferes]);

  // No mostrar nada si está cargando, hay error o no hay recomendación
  if (isLoading) {
    return (
      <Card className="p-6 bg-gradient-to-r from-blue-50 to-blue-50/50 dark:from-slate-900 dark:to-slate-900/50">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600"></div>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Calculando vehículo recomendado...
          </span>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="p-4 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800">
        <div className="flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-red-900 dark:text-red-200">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        </div>
      </Card>
    );
  }

  if (!recomendado && pesoTotal > 0 && alerta) {
    return (
      <Card className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-900 dark:text-yellow-200">{alerta}</p>
              <p className="text-sm text-yellow-700 dark:text-yellow-300">
                Carga total: <strong>{pesoTotal.toFixed(1)} kg</strong>
              </p>
            </div>
          </div>

          {/* Ver todos los vehículos */}
          <button
            onClick={() => setShowAllVehiculos(!showAllVehiculos)}
            className="text-sm font-medium text-yellow-700 dark:text-yellow-300 hover:text-yellow-900 dark:hover:text-yellow-200 flex items-center gap-1"
          >
            Ver todos los vehículos disponibles
            {showAllVehiculos ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>

          {/* Listado de vehículos */}
          {showAllVehiculos && disponibles.length > 0 && (
            <div className="space-y-2 mt-3 pt-3 border-t border-yellow-200 dark:border-yellow-700">
              {disponibles.map((vehiculo) => (
                <VehicleOption
                  key={vehiculo.id}
                  vehiculo={vehiculo}
                  isSelected={selectedVehiculoId === vehiculo.id}
                  onSelect={() => onSelectVehiculo(vehiculo.id)}
                  warning
                />
              ))}
            </div>
          )}
        </div>
      </Card>
    );
  }

  if (!recomendado) {
    return null;
  }

  // Calcular color según porcentaje de uso
  const getCapacityColor = (porcentaje: number) => {
    if (porcentaje <= 50) return 'bg-green-500';
    if (porcentaje <= 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getCapacityTextColor = (porcentaje: number) => {
    if (porcentaje <= 50)
      return 'text-green-600 dark:text-green-400';
    if (porcentaje <= 80)
      return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className="space-y-3">
      {/* Vehículo Recomendado */}
      <Card className="p-5 bg-gradient-to-r from-green-50 to-green-50/50 dark:from-slate-900 dark:to-slate-900/50 border-green-200 dark:border-green-800 border-2">
        <div className="space-y-4">
          {/* Encabezado */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                  ✨ {vehiculoActual?.id === recomendado?.id ? 'Vehículo Recomendado' : 'Vehículo Seleccionado'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Selecciona para continuar
                </p>
              </div>
            </div>
            <Badge className={`${vehiculoActual?.id === recomendado?.id ? 'bg-green-600 dark:bg-green-700' : 'bg-blue-600 dark:bg-blue-700'} hover:bg-opacity-90`}>
              {vehiculoActual?.id === recomendado?.id ? 'ÓPTIMO' : 'SELECCIONADO'}
            </Badge>
          </div>

          {/* Detalles del vehículo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Placa
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {vehiculoActual?.placa}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Modelo
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {vehiculoActual?.marca} {vehiculoActual?.modelo}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Capacidad
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {vehiculoActual?.capacidad_kg} kg
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">
                Carga Total
              </p>
              <p className="text-base font-bold text-gray-900 dark:text-white">
                {pesoTotal.toFixed(1)} kg
              </p>
            </div>
          </div>

          {/* Sección de Chofer */}
          <div className="space-y-3 pt-3 border-t border-green-200 dark:border-green-700">
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-gray-900 dark:text-white">Chofer Asignado</h4>
            </div>

            {/* Chofer por defecto */}
            {!seleccionarChoferManualmente && vehiculoActual?.choferAsignado && (
              <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-green-200 dark:border-green-700">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                  Chofer del vehículo:
                </p>
                <p className="font-semibold text-gray-900 dark:text-white">
                  {vehiculoActual.choferAsignado.nombre || vehiculoActual.choferAsignado.name}
                </p>
                {vehiculoActual.choferAsignado.telefono && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Tel: {vehiculoActual.choferAsignado.telefono}
                  </p>
                )}
              </div>
            )}

            {/* Checkbox para seleccionar manualmente */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seleccionarChoferManualmente}
                onChange={(e) => setSeleccionarChoferManualmente(e.target.checked)}
                className="w-4 h-4 rounded border-gray-300 dark:border-slate-600"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Seleccionar chofer manualmente
              </span>
            </label>

            {/* SearchSelect de choferes si está marcado */}
            {seleccionarChoferManualmente && (
              <SearchSelect
                placeholder="Busca y selecciona un chofer..."
                searchPlaceholder="Buscar por nombre o teléfono..."
                value={selectedChoferId || ''}
                options={choferesOptions}
                onChange={(value) => {
                  if (value && onSelectChofer) {
                    onSelectChofer(parseInt(String(value)));
                  }
                }}
                allowClear={true}
                emptyText="No se encontraron choferes"
              />
            )}
          </div>

          {/* Barra de capacidad */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                Uso de Capacidad
              </span>
              <span
                className={`text-sm font-bold ${getCapacityTextColor(
                  vehiculoActual?.porcentaje_uso_actual ?? 0
                )}`}
              >
                {vehiculoActual?.porcentaje_uso_actual}%
              </span>
            </div>
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${getCapacityColor(
                  vehiculoActual?.porcentaje_uso_actual ?? 0
                )}`}
                style={{ width: `${Math.min(vehiculoActual?.porcentaje_uso_actual ?? 0, 100)}%` }}
              ></div>
            </div>
          </div>

        </div>
      </Card>

      {/* Ver Todas las Opciones */}
      {disponibles.length > 0 && (
        <div className="space-y-2">
          <button
            onClick={() => setShowAllVehiculos(!showAllVehiculos)}
            className="w-full flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-slate-800 hover:bg-gray-100 dark:hover:bg-slate-700 border border-gray-200 dark:border-slate-700 transition-all"
          >
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Ver todas las opciones ({disponibles.length} vehículos)
              </span>
            </div>
            {showAllVehiculos ? (
              <ChevronUp className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Listado de todas las opciones */}
          {showAllVehiculos && (
            <div className="space-y-2 p-3 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700">
              {disponibles.map((vehiculo) => (
                <VehicleOption
                  key={vehiculo.id}
                  vehiculo={vehiculo}
                  isSelected={selectedVehiculoId === vehiculo.id}
                  isRecommended={vehiculo.id === recomendado?.id}
                  onSelect={() => {
                    onSelectVehiculo(vehiculo.id);
                    // Auto-seleccionar el chofer asignado del vehículo
                    if (vehiculo.choferAsignado && onSelectChofer) {
                      onSelectChofer(vehiculo.choferAsignado.id);
                      // Resetear el estado de "Seleccionar manualmente"
                      setSeleccionarChoferManualmente(false);
                    }
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * Componente para mostrar una opción de vehículo individual
 */
function VehicleOption({
  vehiculo,
  isSelected,
  onSelect,
  warning = false,
  isRecommended = false,
}: {
  vehiculo: VehiculoRecomendado;
  isSelected: boolean;
  onSelect: () => void;
  warning?: boolean;
  isRecommended?: boolean;
}) {
  const getStatusColor = () => {
    if (warning || vehiculo.estado === 'excede_capacidad')
      return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (isRecommended)
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    return 'bg-white dark:bg-slate-900 border-gray-200 dark:border-slate-700';
  };

  return (
    <button
      onClick={onSelect}
      className={`w-full p-3 rounded-lg border transition-all text-left ${getStatusColor()} ${isSelected ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''
        }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-gray-900 dark:text-white text-sm">
              {vehiculo.placa} • {vehiculo.marca} {vehiculo.modelo}
            </p>
            {isRecommended && (
              <Badge className="bg-green-600 dark:bg-green-700 text-xs">
                ⭐ RECOMENDADO
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>{vehiculo.capacidad_kg} kg</span>
            <span>•</span>
            <span
              className={
                vehiculo.porcentaje_uso_actual > 80
                  ? 'text-red-600 dark:text-red-400 font-semibold'
                  : ''
              }
            >
              {vehiculo.porcentaje_uso_actual}% uso
            </span>
          </div>
        </div>
        {isSelected && <Check className="h-5 w-5 text-blue-600 dark:text-blue-400" />}
      </div>
    </button>
  );
}
