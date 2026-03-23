<?php

namespace App\Http\Controllers;

use App\Models\Prestable;
use App\Models\Proveedor;
use App\Models\Producto;
use App\Services\Prestamos\PrestableStockService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PrestableController extends Controller
{
    public function __construct(private PrestableStockService $stockService)
    {
    }

    /**
     * GET /api/prestables
     * Listar todas las canastillas/embases activas
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $almacenCanastillasEmbases = 3; // Almacén fijo para prestables

            $query = Prestable::with(['producto:id,nombre,sku', 'proveedor:id,nombre', 'precios', 'condiciones', 'stocks', 'prestablePadre:id,nombre,codigo'])
                ->whereHas('stocks', function ($q) use ($almacenCanastillasEmbases) {
                    $q->where('almacen_id', $almacenCanastillasEmbases);
                });

            // Filtro por tipo
            if ($request->has('tipo')) {
                $query->where('tipo', $request->string('tipo'));
            }

            // Filtro por proveedor
            if ($request->has('proveedor_id')) {
                $query->where('proveedor_id', $request->integer('proveedor_id'));
            }

            // Búsqueda
            if ($request->has('q')) {
                $searchTerm = $request->string('q');
                $query->where(function ($q) use ($searchTerm) {
                    $q->where('nombre', 'like', "%{$searchTerm}%")
                        ->orWhere('codigo', 'like', "%{$searchTerm}%")
                        ->orWhere('descripcion', 'like', "%{$searchTerm}%");
                });
            }

            $prestables = $query->paginate($request->integer('per_page', 15));

            // Agregar totales a cada prestable
            $prestables->getCollection()->transform(function ($prestable) {
                $totalCanastillas = 0;
                $totalEmbases = 0;

                foreach ($prestable->stocks as $stock) {
                    $cantidadTotal = $stock->cantidad_disponible
                        + $stock->cantidad_en_prestamo_cliente
                        + $stock->cantidad_en_prestamo_proveedor
                        + $stock->cantidad_vendida;

                    $totalCanastillas += $cantidadTotal;

                    if ($prestable->capacidad) {
                        $totalEmbases += $cantidadTotal * $prestable->capacidad;
                    }
                }

                $prestable->total_canastillas = $totalCanastillas;
                $prestable->total_embases = $totalEmbases;

                return $prestable;
            });

            return response()->json([
                'success' => true,
                'data' => $prestables,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error listando prestables', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error listando prestables'], 500);
        }
    }

    /**
     * POST /api/prestables
     * Crear nueva canastilla/embases
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('🚀🚀🚀 ¡¡STORE METHOD CALLED!!! 🚀🚀🚀');
        Log::info('📋 PRESTABLE STORE - Datos recibidos:', $request->all());

        try {

            $validated = $request->validate([
                'nombre' => 'required|string|max:255',
                'codigo' => 'required|string|unique:prestables,codigo',
                'tipo' => 'required|in:CANASTILLA,EMBASES,OTRO',
                'capacidad' => 'nullable|integer|min:1',
                'producto_id' => 'nullable|exists:productos,id',
                'proveedor_id' => 'nullable|exists:proveedores,id',
                'prestable_relacionado_id' => 'nullable|exists:prestables,id',
                'descripcion' => 'nullable|string',
                'precios' => 'nullable|array',
                'precios.*.tipo_precio' => 'nullable|in:VENTA,PRESTAMO',
                'precios.*.valor' => 'nullable|numeric|min:0',
                'condiciones' => 'nullable|array',
                'condiciones.monto_garantia' => 'nullable|numeric|min:0',
                'condiciones.monto_daño_parcial' => 'nullable|numeric|min:0',
                'condiciones.monto_daño_total' => 'nullable|numeric|min:0',
            ]);

            Log::info('✅ PRESTABLE VALIDADO:', $validated);
            Log::info('📍 Precios:', ['precios' => $validated['precios'] ?? 'NO ENVIADO']);
            Log::info('📍 Condiciones:', ['condiciones' => $validated['condiciones'] ?? 'NO ENVIADO']);

            $prestable = DB::transaction(function () use ($validated) {
                // Crear prestable
                $prestable = Prestable::create([
                    'nombre' => $validated['nombre'],
                    'codigo' => $validated['codigo'],
                    'tipo' => $validated['tipo'],
                    'capacidad' => $validated['capacidad'] ?? null,
                    'producto_id' => $validated['producto_id'] ?? null,
                    'proveedor_id' => $validated['proveedor_id'] ?? null,
                    'prestable_relacionado_id' => $validated['prestable_relacionado_id'] ?? null,
                    'descripcion' => $validated['descripcion'] ?? null,
                    'activo' => true,
                ]);

                // Crear precios
                if (isset($validated['precios']) && is_array($validated['precios'])) {
                    Log::info('💰 Procesando precios:', $validated['precios']);
                    foreach ($validated['precios'] as $precio) {
                        if (!empty($precio['tipo_precio']) && $precio['valor'] !== null) {
                            Log::info('💾 Guardando precio:', [
                                'tipo_precio' => $precio['tipo_precio'],
                                'valor' => $precio['valor'] ?? 0,
                            ]);
                            $prestable->precios()->create([
                                'tipo_precio' => $precio['tipo_precio'],
                                'valor' => $precio['valor'] ?? 0,
                                'activo' => true,
                            ]);
                        } else {
                            Log::warning('⚠️ Precio descartado por valores vacíos:', $precio);
                        }
                    }
                } else {
                    Log::warning('⚠️ No hay precios para procesar');
                }

                // Crear condiciones
                if (isset($validated['condiciones']) && is_array($validated['condiciones'])) {
                    Log::info('🔒 Procesando condiciones:', $validated['condiciones']);
                    $tieneCondiciones = !empty($validated['condiciones']['monto_garantia'])
                        || !empty($validated['condiciones']['monto_daño_parcial'])
                        || !empty($validated['condiciones']['monto_daño_total']);

                    if ($tieneCondiciones) {
                        Log::info('💾 Guardando condiciones:', [
                            'monto_garantia' => $validated['condiciones']['monto_garantia'] ?? 0,
                            'monto_daño_parcial' => $validated['condiciones']['monto_daño_parcial'] ?? 0,
                            'monto_daño_total' => $validated['condiciones']['monto_daño_total'] ?? 0,
                        ]);
                        $prestable->condiciones()->create([
                            'monto_garantia' => $validated['condiciones']['monto_garantia'] ?? 0,
                            'monto_daño_parcial' => $validated['condiciones']['monto_daño_parcial'] ?? 0,
                            'monto_daño_total' => $validated['condiciones']['monto_daño_total'] ?? 0,
                            'activo' => true,
                        ]);
                    } else {
                        Log::warning('⚠️ Condiciones descartadas por ser todas 0');
                    }
                } else {
                    Log::warning('⚠️ No hay condiciones para procesar');
                }

                return $prestable;
            });

            Log::info('✅ Prestable creado', ['prestable_id' => $prestable->id, 'nombre' => $prestable->nombre]);

            $prestableWithRelations = $prestable->load(['precios', 'condiciones']);
            Log::info('📤 RESPUESTA DEL BACKEND:', [
                'prestable_id' => $prestableWithRelations->id,
                'precios_count' => count($prestableWithRelations->precios),
                'precios' => $prestableWithRelations->precios,
                'condiciones' => $prestableWithRelations->condiciones,
            ]);

            return response()->json([
                'success' => true,
                'data' => $prestableWithRelations,
                'message' => 'Prestable creado exitosamente',
            ], 201);
        } catch (\Exception $e) {
            Log::error('❌❌❌ ERROR CREANDO PRESTABLE ❌❌❌', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error_type' => class_basename($e),
            ], 422);
        }
    }

    /**
     * GET /api/prestables/{prestable}
     * Ver detalles de una canastilla
     */
    public function show(Prestable $prestable): JsonResponse
    {
        try {
            $prestable->load(['producto', 'proveedor', 'precios', 'condiciones', 'stocks.almacen', 'prestablePadre:id,nombre,codigo,capacidad']);

            // Calcular totales de stock
            $totalCanastillas = 0;
            $totalEmbases = 0;

            foreach ($prestable->stocks as $stock) {
                $cantidadTotal = $stock->cantidad_disponible
                    + $stock->cantidad_en_prestamo_cliente
                    + $stock->cantidad_en_prestamo_proveedor
                    + $stock->cantidad_vendida;

                $totalCanastillas += $cantidadTotal;

                if ($prestable->capacidad) {
                    $totalEmbases += $cantidadTotal * $prestable->capacidad;
                }
            }

            $prestable->total_canastillas = $totalCanastillas;
            $prestable->total_embases = $totalEmbases;

            // Calcular stock resumido
            $almacenId = auth()->user()->empresa->almacen_id ?? 1;
            $resumenStock = $this->stockService->obtenerResumen($prestable->id, $almacenId);

            return response()->json([
                'success' => true,
                'data' => $prestable,
                'stock_resumen' => $resumenStock,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo prestable', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo prestable'], 500);
        }
    }

    /**
     * PUT /api/prestables/{prestable}
     * Actualizar canastilla
     */
    public function update(Request $request, Prestable $prestable): JsonResponse
    {
        Log::info('🔄 UPDATE PRESTABLE - Datos recibidos:', $request->all());

        try {
            $validated = $request->validate([
                'nombre' => 'sometimes|string|max:255',
                'tipo' => 'sometimes|in:CANASTILLA,EMBASES,OTRO',
                'capacidad' => 'nullable|integer|min:1',
                'producto_id' => 'nullable|exists:productos,id',
                'proveedor_id' => 'nullable|exists:proveedores,id',
                'prestable_relacionado_id' => 'nullable|exists:prestables,id',
                'descripcion' => 'nullable|string',
                'activo' => 'sometimes|boolean',
                'precios' => 'nullable|array',
                'precios.*.tipo_precio' => 'nullable|in:VENTA,PRESTAMO',
                'precios.*.valor' => 'nullable|numeric|min:0',
                'condiciones' => 'nullable|array',
                'condiciones.monto_garantia' => 'nullable|numeric|min:0',
                'condiciones.monto_daño_parcial' => 'nullable|numeric|min:0',
                'condiciones.monto_daño_total' => 'nullable|numeric|min:0',
            ]);

            Log::info('✅ DATOS VALIDADOS:', $validated);

            DB::transaction(function () use ($validated, $prestable) {
                // Actualizar campos básicos
                $prestable->update([
                    'nombre' => $validated['nombre'] ?? $prestable->nombre,
                    'tipo' => $validated['tipo'] ?? $prestable->tipo,
                    'capacidad' => $validated['capacidad'] ?? $prestable->capacidad,
                    'producto_id' => $validated['producto_id'] ?? $prestable->producto_id,
                    'proveedor_id' => $validated['proveedor_id'] ?? $prestable->proveedor_id,
                    'prestable_relacionado_id' => $validated['prestable_relacionado_id'] ?? $prestable->prestable_relacionado_id,
                    'descripcion' => $validated['descripcion'] ?? $prestable->descripcion,
                    'activo' => $validated['activo'] ?? $prestable->activo,
                ]);

                // Actualizar/Crear precios
                if (isset($validated['precios']) && is_array($validated['precios'])) {
                    Log::info('💰 Procesando precios para actualización:', $validated['precios']);

                    foreach ($validated['precios'] as $precio) {
                        if (!empty($precio['tipo_precio']) && $precio['valor'] !== null) {
                            // Buscar si existe precio con este tipo
                            $precioExistente = $prestable->precios()
                                ->where('tipo_precio', $precio['tipo_precio'])
                                ->first();

                            if ($precioExistente) {
                                Log::info('🔄 Actualizando precio existente:', [
                                    'tipo_precio' => $precio['tipo_precio'],
                                    'valor' => $precio['valor'],
                                ]);
                                $precioExistente->update([
                                    'valor' => $precio['valor'] ?? 0,
                                ]);
                            } else {
                                Log::info('➕ Creando nuevo precio:', [
                                    'tipo_precio' => $precio['tipo_precio'],
                                    'valor' => $precio['valor'],
                                ]);
                                $prestable->precios()->create([
                                    'tipo_precio' => $precio['tipo_precio'],
                                    'valor' => $precio['valor'] ?? 0,
                                    'activo' => true,
                                ]);
                            }
                        }
                    }
                }

                // Actualizar/Crear condiciones
                if (isset($validated['condiciones']) && is_array($validated['condiciones'])) {
                    Log::info('🔒 Procesando condiciones:', $validated['condiciones']);

                    $tieneCondiciones = !empty($validated['condiciones']['monto_garantia'])
                        || !empty($validated['condiciones']['monto_daño_parcial'])
                        || !empty($validated['condiciones']['monto_daño_total']);

                    if ($tieneCondiciones) {
                        $condicionExistente = $prestable->condiciones()->first();

                        if ($condicionExistente) {
                            Log::info('🔄 Actualizando condición existente');
                            $condicionExistente->update([
                                'monto_garantia' => $validated['condiciones']['monto_garantia'] ?? 0,
                                'monto_daño_parcial' => $validated['condiciones']['monto_daño_parcial'] ?? 0,
                                'monto_daño_total' => $validated['condiciones']['monto_daño_total'] ?? 0,
                            ]);
                        } else {
                            Log::info('➕ Creando nueva condición');
                            $prestable->condiciones()->create([
                                'monto_garantia' => $validated['condiciones']['monto_garantia'] ?? 0,
                                'monto_daño_parcial' => $validated['condiciones']['monto_daño_parcial'] ?? 0,
                                'monto_daño_total' => $validated['condiciones']['monto_daño_total'] ?? 0,
                                'activo' => true,
                            ]);
                        }
                    }
                }
            });

            Log::info('✅ Prestable actualizado', ['prestable_id' => $prestable->id]);

            return response()->json([
                'success' => true,
                'data' => $prestable->load(['precios', 'condiciones']),
                'message' => 'Prestable actualizado exitosamente',
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error actualizando prestable', [
                'message' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
            ]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }

    /**
     * DELETE /api/prestables/{prestable}
     * Eliminar canastilla de la BD
     */
    public function destroy(Prestable $prestable): JsonResponse
    {
        try {
            $prestableId = $prestable->id;
            $prestableName = $prestable->nombre;

            $prestable->delete();

            Log::info('✅ Prestable eliminado', ['prestable_id' => $prestableId, 'nombre' => $prestableName]);

            return response()->json([
                'success' => true,
                'message' => 'Prestable eliminado exitosamente',
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error eliminando prestable', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error eliminando prestable'], 500);
        }
    }

    /**
     * GET /api/prestables/{prestable}/stock
     * Obtener stock por almacén
     */
    public function obtenerStock(Prestable $prestable): JsonResponse
    {
        try {
            $stocks = $prestable->stocks()->with('almacen')->get();

            return response()->json([
                'success' => true,
                'data' => $stocks,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo stock', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo stock'], 500);
        }
    }

    /**
     * GET /api/prestables/{prestable}/disponibilidad
     * Obtener disponibilidad total del prestable (suma de todos los almacenes)
     */
    public function obtenerDisponibilidad(Prestable $prestable): JsonResponse
    {
        try {
            $prestable->load(['stocks.almacen', 'prestablePadre:id,nombre,codigo,capacidad']);

            // Calcular totales sumando todos los almacenes
            $totalDisponible = 0;
            $totalEnPrestamocliente = 0;
            $totalEnPrestamoproveedor = 0;
            $totalVendida = 0;
            $totalGeneral = 0;

            foreach ($prestable->stocks as $stock) {
                $totalDisponible += $stock->cantidad_disponible;
                $totalEnPrestamocliente += $stock->cantidad_en_prestamo_cliente;
                $totalEnPrestamoproveedor += $stock->cantidad_en_prestamo_proveedor;
                $totalVendida += $stock->cantidad_vendida;
            }

            $totalGeneral = $totalDisponible + $totalEnPrestamocliente + $totalEnPrestamoproveedor + $totalVendida;

            // Calcular embases si aplica
            $totalDisponibleEmbases = $prestable->capacidad ? $totalDisponible * $prestable->capacidad : null;
            $totalEnPrestamoclienteEmbases = $prestable->capacidad ? $totalEnPrestamocliente * $prestable->capacidad : null;
            $totalEnPrestamoproveedorEmbases = $prestable->capacidad ? $totalEnPrestamoproveedor * $prestable->capacidad : null;
            $totalVendidaEmbases = $prestable->capacidad ? $totalVendida * $prestable->capacidad : null;
            $totalGeneralEmbases = $prestable->capacidad ? $totalGeneral * $prestable->capacidad : null;

            return response()->json([
                'success' => true,
                'data' => [
                    'prestable' => [
                        'id' => $prestable->id,
                        'nombre' => $prestable->nombre,
                        'codigo' => $prestable->codigo,
                        'tipo' => $prestable->tipo,
                        'capacidad' => $prestable->capacidad,
                        'prestablePadre' => $prestable->prestablePadre,
                    ],
                    'stock' => [
                        'canastillas' => [
                            'disponible' => $totalDisponible,
                            'en_prestamo_cliente' => $totalEnPrestamocliente,
                            'en_prestamo_proveedor' => $totalEnPrestamoproveedor,
                            'vendida' => $totalVendida,
                            'total' => $totalGeneral,
                        ],
                        'embases' => $prestable->capacidad ? [
                            'disponible' => $totalDisponibleEmbases,
                            'en_prestamo_cliente' => $totalEnPrestamoclienteEmbases,
                            'en_prestamo_proveedor' => $totalEnPrestamoproveedorEmbases,
                            'vendida' => $totalVendidaEmbases,
                            'total' => $totalGeneralEmbases,
                        ] : null,
                    ],
                ],
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error obteniendo disponibilidad', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => 'Error obteniendo disponibilidad'], 500);
        }
    }

    /**
     * POST /api/prestables/{prestable}/stock/incrementar
     * Incrementar stock (compra inicial)
     */
    public function incrementarStock(Request $request, Prestable $prestable): JsonResponse
    {
        try {
            $validated = $request->validate([
                'almacen_id' => 'required|exists:almacenes,id',
                'cantidad' => 'required|integer|min:1',
            ]);

            $this->stockService->incrementarStockInicial(
                $prestable->id,
                $validated['almacen_id'],
                $validated['cantidad']
            );

            $resumen = $this->stockService->obtenerResumen($prestable->id, $validated['almacen_id']);

            return response()->json([
                'success' => true,
                'message' => 'Stock incrementado',
                'stock_resumen' => $resumen,
            ]);
        } catch (\Exception $e) {
            Log::error('❌ Error incrementando stock', ['error' => $e->getMessage()]);
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        }
    }
}
