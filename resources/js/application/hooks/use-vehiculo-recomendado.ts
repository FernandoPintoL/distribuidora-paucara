import { useState, useEffect } from 'react';
import type { VentaConDetalles } from '@/domain/entities/entregas';
import type { VehicleRecommendationResponse, VehiculoRecomendado } from '@/domain/entities/vehiculos';
import type { Id } from '@/domain/entities/shared';

interface UseVehiculoRecomendadoState {
  recomendado: VehiculoRecomendado | null;
  disponibles: VehiculoRecomendado[];
  pesoTotal: number;
  isLoading: boolean;
  error: string | null;
  alerta: string | null;
}

/**
 * Hook para obtener recomendación de vehículo basado en ventas seleccionadas
 *
 * @param selectedVentaIds IDs de ventas seleccionadas
 * @param ventas Lista de ventas disponibles (para calcular peso total)
 * @param autoSelect Si es true, auto-selecciona el vehículo recomendado
 * @param onVehiculoSelected Callback cuando se selecciona un vehículo
 */
export function useVehiculoRecomendado(
  selectedVentaIds: Id[],
  ventas: VentaConDetalles[],
  autoSelect?: boolean,
  onVehiculoSelected?: (vehiculoId: Id) => void
) {
  const [state, setState] = useState<UseVehiculoRecomendadoState>({
    recomendado: null,
    disponibles: [],
    pesoTotal: 0,
    isLoading: false,
    error: null,
    alerta: null,
  });

  useEffect(() => {
    // Si no hay ventas seleccionadas, limpiar recomendación
    if (selectedVentaIds.length === 0) {
      setState({
        recomendado: null,
        disponibles: [],
        pesoTotal: 0,
        isLoading: false,
        error: null,
        alerta: null,
      });
      return;
    }

    // Calcular peso total
    const selectedVentas = ventas.filter((v) => selectedVentaIds.includes(v.id));
    const pesoTotal = selectedVentas.reduce((sum, v) => sum + (v.peso_estimado ?? 0), 0);

    if (pesoTotal <= 0) {
      console.log('[useVehiculoRecomendado] Peso total <= 0');
      setState((prev) => ({
        ...prev,
        error: 'No se pudo calcular el peso total',
      }));
      return;
    }

    // Fetch recomendación
    console.log('[useVehiculoRecomendado] Llamando a fetchRecomendacion con peso:', pesoTotal);
    fetchRecomendacion(pesoTotal);
  }, [selectedVentaIds, ventas]);

  const fetchRecomendacion = async (pesoTotal: number) => {
    setState((prev) => ({
      ...prev,
      isLoading: true,
      error: null,
      alerta: null,
    }));

    try {
      console.log('[useVehiculoRecomendado] Iniciando fetch a /api/vehiculos/sugerir', { peso_total: pesoTotal, venta_ids: selectedVentaIds });
      const response = await fetch('/api/vehiculos/sugerir', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': getCsrfToken(),
        },
        body: JSON.stringify({
          peso_total: pesoTotal,
          venta_ids: selectedVentaIds,
        }),
      });

      console.log('[useVehiculoRecomendado] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[useVehiculoRecomendado] Response error:', errorText);
        throw new Error(`Error: ${response.status}`);
      }

      const data: VehicleRecommendationResponse = await response.json();
      console.log('[useVehiculoRecomendado] Response data:', data);

      setState((prev) => ({
        ...prev,
        recomendado: data.data.recomendado,
        disponibles: data.data.disponibles || [],
        pesoTotal: data.data.peso_total,
        isLoading: false,
        error: null,
        alerta: data.data.alerta || null,
      }));

      // Auto-seleccionar si existe recomendado y autoSelect es true
      if (autoSelect && data.data.recomendado && onVehiculoSelected) {
        onVehiculoSelected(data.data.recomendado.id);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error al obtener recomendación';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      console.error('Error en useVehiculoRecomendado:', err);
    }
  };

  const getCsrfToken = (): string => {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta?.getAttribute('content') || '';
  };

  return {
    recomendado: state.recomendado,
    disponibles: state.disponibles,
    pesoTotal: state.pesoTotal,
    isLoading: state.isLoading,
    error: state.error,
    alerta: state.alerta,
  };
}
