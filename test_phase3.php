<?php
// Test script for Phase 3 Services

require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(\Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Venta;
use App\Models\Vehiculo;
use App\Models\Empleado;
use App\Models\Entrega;
use App\Services\Logistica\CrearEntregaPorLocalidadService;
use App\Services\Logistica\SincronizacionVentaEntregaService;

echo "\n=== FASE 3: PRUEBA INTEGRAL DE SERVICIOS DE LOGISTICA ===\n\n";

$testsPassed = 0;
$totalTests = 8;

try {
    // 1. Get sample data
    echo "TEST 1: Obtener datos de prueba...\n";
    $ventas = Venta::where('requiere_envio', true)
        ->where('estado_documento_id', 3)
        ->take(3)
        ->get();

    if ($ventas->count() < 3) {
        echo "ERROR: No hay 3 ventas válidas. Encontradas: " . $ventas->count() . "\n";
        exit(1);
    }

    $vehiculo = Vehiculo::first();
    $chofer = Empleado::first();

    if (!$vehiculo || !$chofer) {
        echo "ERROR: No hay vehículo o chofer\n";
        exit(1);
    }

    echo "  OK - Ventas: " . $ventas->pluck('numero')->implode(', ') . "\n";
    echo "  OK - Vehículo: " . $vehiculo->placa . ", Chofer: " . $chofer->nombre . "\n\n";
    $testsPassed++;

    // 2. Test CrearEntregaPorLocalidadService
    echo "TEST 2: CrearEntregaPorLocalidadService::crearEntregaConsolidada()...\n";

    $service = app(CrearEntregaPorLocalidadService::class);

    $entrega = $service->crearEntregaConsolidada(
        ventaIds: $ventas->pluck('id')->toArray(),
        vehiculoId: $vehiculo->id,
        choferId: $chofer->id,
        zonaId: $ventas->first()->cliente->zona_id ?? 1,
        datos: ['observaciones' => 'Prueba Phase 3']
    );

    echo "  OK - Entrega #" . $entrega->numero_entrega . " creada (ID: " . $entrega->id . ")\n";
    echo "  OK - Estado: " . $entrega->estado . ", Peso: " . $entrega->peso_kg . " kg\n\n";
    $testsPassed++;

    // 3. Verify pivot relationships
    echo "TEST 3: Verificar relaciones via pivot entrega_venta...\n";

    $entregaFresh = Entrega::with('ventasAsociadas')->find($entrega->id);
    $ventasEnPivot = $entregaFresh->ventasAsociadas;

    if ($ventasEnPivot->count() != $ventas->count()) {
        throw new Exception("Se esperaban " . $ventas->count() . " ventas en pivot, encontradas: " . $ventasEnPivot->count());
    }

    echo "  OK - " . $ventasEnPivot->count() . " ventas en pivot:\n";
    foreach ($ventasEnPivot as $ev) {
        $confirmado = $ev->fecha_confirmacion ? 'SI' : 'NO';
        echo "      - Venta #" . $ev->venta_id . ": orden=" . $ev->orden . ", confirmado=" . $confirmado . "\n";
    }
    echo "\n";
    $testsPassed++;

    // 4. Test relationship loading
    echo "TEST 4: Cargar relaciones belongsToMany...\n";

    $ventasRelation = $entrega->ventas;
    if ($ventasRelation->count() != $ventas->count()) {
        throw new Exception("Esperadas " . $ventas->count() . " ventas, encontradas: " . $ventasRelation->count());
    }

    echo "  OK - " . $ventasRelation->count() . " ventas cargadas via belongsToMany\n";
    foreach ($ventasRelation as $venta) {
        echo "      - Venta #" . $venta->numero . ": orden=" . $venta->pivot->orden . "\n";
    }
    echo "\n";
    $testsPassed++;

    // 5. Test confirmation workflow
    echo "TEST 5: Flujo de confirmacion de carga...\n";

    $usuario = \App\Models\User::first();
    if ($usuario) {
        $ventaAConfirmar = $ventasRelation->first();
        $entrega->confirmarVentaCargada($ventaAConfirmar, $usuario, 'Test confirmacion');

        $progreso = $entrega->obtenerProgresoConfirmacion();
        if ($progreso['confirmadas'] != 1 || $progreso['total'] != 3) {
            throw new Exception("Progreso incorrecto: " . json_encode($progreso));
        }

        echo "  OK - Progreso despues confirmar 1 venta:\n";
        echo "      - Confirmadas: " . $progreso['confirmadas'] . "/" . $progreso['total'] . "\n";
        echo "      - Porcentaje: " . $progreso['porcentaje'] . "%\n";
        echo "      - Completado: " . ($progreso['completado'] ? 'SI' : 'NO') . "\n\n";
        $testsPassed++;
    } else {
        echo "  WARNING: No hay usuarios para confirmar (skip este test)\n\n";
    }

    // 6. Test synchronization
    echo "TEST 6: Sincronizacion de estados logisticos...\n";

    $sincronizador = app(SincronizacionVentaEntregaService::class);

    $estadosOk = true;
    foreach ($ventasRelation as $venta) {
        $venta->refresh();
        echo "      - Venta #" . $venta->numero . ": estado_logistico=" . $venta->estado_logistico . "\n";
        if (empty($venta->estado_logistico)) {
            $estadosOk = false;
        }
    }

    if (!$estadosOk) {
        throw new Exception("Algunos estados logisticos no fueron sincronizados");
    }
    echo "  OK\n\n";
    $testsPassed++;

    // 7. Test metrics
    echo "TEST 7: Calculos de metricas...\n";

    $pesoTotal = $entrega->obtenerPesoTotal();
    $volumenTotal = $entrega->obtenerVolumenTotal();
    $utilizacion = $entrega->obtenerPorcentajeUtilizacion();
    $cabe = $entrega->cabe_en_vehiculo();

    if ($pesoTotal < 0) {
        throw new Exception("Peso total inválido: " . $pesoTotal);
    }

    echo "  OK - Metricas calculadas:\n";
    echo "      - Peso: " . number_format($pesoTotal, 2) . " kg\n";
    echo "      - Volumen: " . number_format($volumenTotal, 2) . " m3\n";
    echo "      - Utilizacion: " . number_format($utilizacion, 2) . "%\n";
    echo "      - Cabe en vehiculo: " . ($cabe ? 'SI' : 'NO') . "\n\n";
    $testsPassed++;

    // 8. Test detail method
    echo "TEST 8: Metodo obtenerDetalleEntregas()...\n";

    $primeraVenta = $ventasRelation->first();
    $detalles = $sincronizador->obtenerDetalleEntregas($primeraVenta);

    if ($detalles['total_entregas'] < 1) {
        throw new Exception("No se encontraron entregas en detalles");
    }

    echo "  OK - Detalles de entregas para Venta #" . $primeraVenta->numero . ":\n";
    echo "      - Total de entregas: " . $detalles['total_entregas'] . "\n";
    echo "      - Estado actual: " . $detalles['estado_logistico_actual'] . "\n";
    echo "      - Estado calculado: " . $detalles['estado_logistico_calculado'] . "\n";
    if (count($detalles['entregas']) > 0) {
        echo "      - Entregas:\n";
        foreach ($detalles['entregas'] as $ent) {
            echo "          * #" . $ent['numero_entrega'] . ": " . $ent['estado'] . "\n";
        }
    }
    echo "\n";
    $testsPassed++;

    echo "===================================================================\n";
    echo "RESULTADO: " . $testsPassed . "/" . $totalTests . " TESTS PASADOS\n";
    echo "===================================================================\n\n";

    if ($testsPassed == $totalTests) {
        echo "FASE 3 COMPLETADA: Todos los servicios funcionan correctamente\n\n";
        echo "RESUMEN:\n";
        echo "  [X] CrearEntregaPorLocalidadService funciona completo\n";
        echo "  [X] Relaciones N:M via pivot entrega_venta funcionan\n";
        echo "  [X] Confirmacion de carga funciona\n";
        echo "  [X] Sincronizacion automática funciona\n";
        echo "  [X] Calculos de metricas funcionan\n";
        echo "  [X] Obtención de detalles funciona\n\n";
        echo "PROXIMA FASE: Crear API Controllers (FASE 4)\n";
    } else {
        echo "ERROR: " . ($totalTests - $testsPassed) . " tests fallaron\n";
        exit(1);
    }

} catch (\Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "Archivo: " . $e->getFile() . ":" . $e->getLine() . "\n";
    exit(1);
}
