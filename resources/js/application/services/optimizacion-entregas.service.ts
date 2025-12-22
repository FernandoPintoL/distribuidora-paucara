/**
 * Servicio para creación en lote de entregas con optimización
 * PHASE 2: Integración con API de entregas masivas
 */

export interface CrearLoteRequest {
    venta_ids: number[];
    vehiculo_id: number;
    chofer_id: number;
    agrupar_por_zona?: boolean;
    optimizar?: boolean;
}

export interface EntregaCreada {
    id: number;
    venta_id: number;
    estado: string;
    peso_kg: number;
    direccion_entrega: string;
}

export interface EstadisticasLote {
    total_creadas: number;
    total_errores: number;
    peso_total: number;
    vehiculo: {
        id: number;
        placa: string;
        capacidad_kg: number;
    };
    chofer: {
        id: number;
        nombre: string;
    };
}

export interface OptimizacionRuta {
    rutas: Array<{
        ruta: Array<any>;
        distancia_total: number;
        distancia_regreso: number;
        tiempo_estimado: number;
        paradas: number;
        peso_total: number;
        bin_numero: number;
        porcentaje_uso: number;
    }>;
    estadisticas: {
        total_entregas: number;
        rutas_creadas: number;
        uso_promedio_capacidad: number;
        distancia_total: number;
        tiempo_total_minutos: number;
    };
}

export interface CrearLoteResponse {
    success: boolean;
    message: string;
    data: {
        entregas: EntregaCreada[];
        estadisticas: EstadisticasLote;
        optimizacion?: OptimizacionRuta;
        errores: Array<{ venta_id: number; error: string }>;
    };
    errors?: Record<string, string[]>;
}

export interface PreviewResponse {
    success: boolean;
    message: string;
    data: {
        ventas: number;
        optimizacion: OptimizacionRuta;
        vehiculo: {
            id: number;
            placa: string;
            capacidad_kg: number;
        };
        peso_total: number;
    };
}

class OptimizacionEntregasService {
    private readonly API_ENDPOINT = '/api/entregas/lote';

    /**
     * Obtener preview/simulación de creación en lote
     * Calcula optimización sin crear entregas aún
     */
    async obtenerPreview(request: CrearLoteRequest): Promise<PreviewResponse> {
        try {
            const response = await fetch(`${this.API_ENDPOINT}/preview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                throw new Error(`Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en obtenerPreview:', error);
            throw error;
        }
    }

    /**
     * Crear entregas en lote
     * Crea las entregas y retorna sugerencias de rutas
     */
    async crearLote(request: CrearLoteRequest): Promise<CrearLoteResponse> {
        try {
            const response = await fetch(this.API_ENDPOINT, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': this.getCsrfToken(),
                },
                body: JSON.stringify(request),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Error: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('Error en crearLote:', error);
            throw error;
        }
    }

    /**
     * Obtener el token CSRF del documento
     */
    private getCsrfToken(): string {
        const meta = document.querySelector('meta[name="csrf-token"]');
        return meta?.getAttribute('content') || '';
    }
}

export const optimizacionEntregasService = new OptimizacionEntregasService();
