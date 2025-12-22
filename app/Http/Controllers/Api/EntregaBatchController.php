<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\CrearEntregasBatchRequest;
use App\Services\Logistica\EntregaService;
use App\Services\Logistica\AdvancedVRPService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

class EntregaBatchController extends Controller
{
    public function __construct(
        private EntregaService $entregaService,
        private AdvancedVRPService $advancedVRPService,
    ) {}

    /**
     * Crear múltiples entregas en lote
     *
     * FASE 2: Endpoint para creación masiva optimizada
     *
     * Flujo:
     * 1. Validar request (venta_ids, vehiculo_id, chofer_id)
     * 2. Validar capacidad del vehículo
     * 3. Crear entregas para cada venta
     * 4. Asignar chofer y vehículo automáticamente
     * 5. Opcionalmente calcular optimización de rutas
     * 6. Retornar entregas creadas + sugerencias
     *
     * @param CrearEntregasBatchRequest $request
     * @return JsonResponse
     */
    public function store(CrearEntregasBatchRequest $request): JsonResponse
    {
        try {
            Log::info('Iniciando creación de entregas en lote', [
                'venta_count' => count($request->input('venta_ids')),
                'vehiculo_id' => $request->input('vehiculo_id'),
                'chofer_id' => $request->input('chofer_id'),
                'user_id' => auth()->id(),
            ]);

            // ✅ NUEVO: Validar capacidad del vehículo antes de crear entregas
            $pesoTotal = \App\Models\Venta::whereIn('id', $request->input('venta_ids'))
                ->with('detalles')
                ->get()
                ->sum(fn($v) => $v->detalles?->sum(fn($det) => $det->cantidad * 2) ?? 10);

            $vehiculo = \App\Models\Vehiculo::findOrFail($request->input('vehiculo_id'));

            if ($pesoTotal > $vehiculo->capacidad_kg) {
                Log::warning('Capacidad insuficiente para lote de entregas', [
                    'peso_total' => $pesoTotal,
                    'capacidad' => $vehiculo->capacidad_kg,
                    'venta_count' => count($request->input('venta_ids')),
                ]);

                return response()->json([
                    'success' => false,
                    'message' => "Peso total ({$pesoTotal} kg) excede la capacidad del vehículo ({$vehiculo->capacidad_kg} kg)",
                    'data' => null,
                ], 422);
            }

            // Crear entregas en lote
            $resultado = $this->entregaService->crearLote(
                ventaIds: $request->input('venta_ids'),
                vehiculoId: $request->input('vehiculo_id'),
                choferId: $request->input('chofer_id'),
                optimizar: $request->boolean('optimizar', true)
            );

            Log::info('Entregas en lote creadas exitosamente', [
                'total_creadas' => $resultado['estadisticas']['total_creadas'],
                'total_errores' => $resultado['estadisticas']['total_errores'],
                'vehiculo_id' => $request->input('vehiculo_id'),
            ]);

            return response()->json([
                'success' => true,
                'message' => "Se crearon {$resultado['estadisticas']['total_creadas']} entregas exitosamente",
                'data' => [
                    'entregas' => $resultado['entregas'],
                    'estadisticas' => $resultado['estadisticas'],
                    'optimizacion' => $resultado['optimizacion'] ?? null,
                    'errores' => $resultado['errores'],
                ],
            ], 201);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Error de validación en creación de lote', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error creando entregas en lote', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al crear entregas en lote',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Obtener preview/simulación de creación en lote
     *
     * FASE 3: Usa AdvancedVRPService para mostrar:
     * ✓ Clustering geográfico de entregas
     * ✓ Predicción de tiempos
     * ✓ Detección de desequilibrios
     * ✓ Sugerencias de rebalanceo
     *
     * Calcula optimización sin crear entregas aún
     *
     * @param CrearEntregasBatchRequest $request
     * @return JsonResponse
     */
    public function preview(CrearEntregasBatchRequest $request): JsonResponse
    {
        try {
            Log::info('Generando preview de entregas en lote', [
                'venta_count' => count($request->input('venta_ids')),
                'vehiculo_id' => $request->input('vehiculo_id'),
                'user_id' => auth()->id(),
            ]);

            // Obtener datos de las ventas
            $ventas = \App\Models\Venta::whereIn('id', $request->input('venta_ids'))
                ->with(['cliente', 'detalles'])
                ->get();

            // Preparar datos para optimización (con GPS si existe)
            $entregasParaOptimizar = $ventas->map(function ($venta) {
                $cliente = $venta->cliente;
                $direccion = $cliente?->direcciones?->first();

                return [
                    'id' => $venta->id,
                    'venta_id' => $venta->id,
                    'cliente_id' => $venta->cliente_id,
                    'cliente_nombre' => $cliente?->nombre ?? 'Sin cliente',
                    'peso' => $venta->peso_estimado ?? ($venta->detalles->sum(fn($det) => $det->cantidad * 2) ?? 10),
                    'lat' => $direccion?->latitud ?? $cliente?->latitud ?? -17.3895,
                    'lon' => $direccion?->longitud ?? $cliente?->longitud ?? -66.1568,
                    'direccion' => $venta->direccion_entrega ?? $direccion?->direccion ?? 'Sin dirección',
                ];
            })->toArray();

            // Obtener datos de vehiculos y choferes
            $vehiculo = \App\Models\Vehiculo::findOrFail($request->input('vehiculo_id'));
            $vehiculos = [\App\Models\Vehiculo::findOrFail($request->input('vehiculo_id'))]->map(fn($v) => [
                'id' => $v->id,
                'placa' => $v->placa,
                'capacidad_kg' => $v->capacidad_kg,
            ])->toArray();

            $choferes = [\App\Models\Empleado::findOrFail($request->input('chofer_id'))]->map(fn($c) => [
                'id' => $c->id,
                'nombre' => $c->nombre,
            ])->toArray();

            // FASE 3: Usar AdvancedVRPService para optimización avanzada
            $resultadoOptimizacion = $this->advancedVRPService->optimizarEntregasMasivas(
                entregas: $entregasParaOptimizar,
                vehiculos: $vehiculos,
                choferes: $choferes,
                radioClusterKm: 2.0
            );

            // Obtener sugerencias
            $sugerencias = $this->advancedVRPService->obtenerSugerencias($resultadoOptimizacion);

            // Preparar rutas para respuesta
            $rutasFormato = array_map(function ($ruta, $idx) {
                return [
                    'numero' => $idx + 1,
                    'cluster_id' => $ruta['cluster_id'],
                    'paradas' => $ruta['paradas'],
                    'entregas_ids' => $ruta['entregas'],
                    'ruta' => $ruta['ruta'],
                    'distancia_total' => $ruta['distancia_total'],
                    'peso_total' => $ruta['peso_total'],
                    'tiempo_estimado' => $ruta['tiempo_estimado'],
                    'porcentaje_uso' => $ruta['porcentaje_uso'],
                ];
            }, $resultadoOptimizacion['rutas'], array_keys($resultadoOptimizacion['rutas']));

            $pesoTotal = round(array_sum(array_column($entregasParaOptimizar, 'peso')), 2);

            Log::info('Preview de entregas en lote generado exitosamente', [
                'venta_count' => $ventas->count(),
                'peso_total' => $pesoTotal,
                'capacidad_vehiculo' => $vehiculo->capacidad_kg,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Preview generado exitosamente',
                'data' => [
                    'ventas' => $ventas->count(),
                    'peso_total' => $pesoTotal,
                    'vehiculo' => [
                        'id' => $vehiculo->id,
                        'placa' => $vehiculo->placa,
                        'capacidad_kg' => $vehiculo->capacidad_kg,
                    ],
                    'optimizacion' => [
                        'rutas' => $rutasFormato,
                        'estadisticas' => $resultadoOptimizacion['estadisticas'],
                        'clustering_stats' => $resultadoOptimizacion['clustering'],
                        'problemas' => $resultadoOptimizacion['problemas'],
                        'sugerencias' => $sugerencias,
                    ],
                ],
            ]);

        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Error de validación en preview de lote', [
                'errors' => $e->errors(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error de validación',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            Log::error('Error generando preview de entregas en lote', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Error al obtener preview',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
