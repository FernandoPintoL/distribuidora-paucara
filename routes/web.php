<?php

use App\Http\Controllers\CategoriaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (\Illuminate\Support\Facades\Auth::check()) {
        return Inertia::render('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('categorias', CategoriaController::class)->middleware('permission:categorias.manage');
    Route::resource('marcas', \App\Http\Controllers\MarcaController::class)->middleware('permission:marcas.manage');
    Route::resource('almacenes', \App\Http\Controllers\AlmacenController::class)->middleware('permission:almacenes.manage');

    // Incluir rutas de configuración global
    require __DIR__ . '/configuracion.php';

    Route::resource('proveedores', \App\Http\Controllers\ProveedorController::class)->middleware('permission:proveedores.manage');
    Route::resource('clientes', \App\Http\Controllers\ClienteController::class)->middleware('permission:clientes.manage');
    Route::resource('productos', \App\Http\Controllers\ProductoController::class)->except(['show'])->middleware('permission:productos.manage');
    Route::get('productos/{producto}/historial-precios', [\App\Http\Controllers\ProductoController::class, 'historialPrecios'])->middleware('permission:productos.manage')->name('productos.historial-precios');
    Route::resource('unidades', \App\Http\Controllers\UnidadMedidaController::class)->parameters(['unidades' => 'unidad'])->middleware('permission:unidades.manage');

    // Rutas para gestión de tipos de precio
    Route::resource('tipos-precio', \App\Http\Controllers\TipoPrecioController::class)->parameters(['tipos-precio' => 'tipoPrecio'])->middleware('permission:tipos-precio.manage');
    Route::patch('tipos-precio/{tipoPrecio}/toggle-activo', [\App\Http\Controllers\TipoPrecioController::class, 'toggleActivo'])->middleware('permission:tipos-precio.manage')->name('tipos-precio.toggle-activo');

    // Rutas para gestión de monedas
    Route::resource('monedas', \App\Http\Controllers\MonedaController::class)->middleware('permission:monedas.manage');
    Route::get('monedas/{moneda}/activas', [\App\Http\Controllers\MonedaController::class, 'activas'])->middleware('permission:monedas.manage')->name('monedas.activas');
    Route::post('monedas/convertir', [\App\Http\Controllers\MonedaController::class, 'convertir'])->middleware('permission:monedas.manage')->name('monedas.convertir');
    Route::patch('monedas/{moneda}/toggle-activo', [\App\Http\Controllers\MonedaController::class, 'toggleActivo'])->middleware('permission:monedas.manage')->name('monedas.toggle-activo');
    Route::patch('monedas/{moneda}/establecer-base', [\App\Http\Controllers\MonedaController::class, 'establecerBase'])->middleware('permission:monedas.manage')->name('monedas.establecer-base');

    // Rutas para gestión de tipos de pago
    Route::resource('tipos-pago', \App\Http\Controllers\TipoPagoController::class)->parameters(['tipos-pago' => 'tipoPago'])->middleware('permission:tipos-pago.manage');

    // Rutas para gestión de compras
    Route::resource('compras', \App\Http\Controllers\CompraController::class)->except(['destroy']);

    // Keep nested details routes
    Route::resource('compras.detalles', \App\Http\Controllers\DetalleCompraController::class)->shallow();

    // Rutas para gestión de ventas
    Route::resource('ventas', \App\Http\Controllers\VentaController::class);
    Route::get('ventas/stock/{producto}', [\App\Http\Controllers\VentaController::class, 'verificarStock'])->name('ventas.verificar-stock');

    // Rutas para contabilidad
    Route::prefix('contabilidad')->name('contabilidad.')->middleware('permission:contabilidad.manage')->group(function () {
        Route::get('asientos', [\App\Http\Controllers\AsientoContableController::class, 'index'])->name('asientos.index');
        Route::get('asientos/{asientoContable}', [\App\Http\Controllers\AsientoContableController::class, 'show'])->name('asientos.show');

        // Reportes contables
        Route::get('reportes/libro-mayor', [\App\Http\Controllers\AsientoContableController::class, 'libroMayor'])->name('reportes.libro-mayor');
        Route::get('reportes/balance-comprobacion', [\App\Http\Controllers\AsientoContableController::class, 'balanceComprobacion'])->name('reportes.balance-comprobacion');
    });
    Route::resource('ventas.detalles', \App\Http\Controllers\DetalleVentaController::class)->shallow();

    // Rutas para gestión de inventario
    Route::prefix('inventario')->name('inventario.')->group(function () {
        Route::get('/', [\App\Http\Controllers\InventarioController::class, 'dashboard'])->middleware('permission:inventario.dashboard')->name('dashboard');
        Route::get('stock-bajo', [\App\Http\Controllers\InventarioController::class, 'stockBajo'])->middleware('permission:inventario.stock-bajo')->name('stock-bajo');
        Route::get('proximos-vencer', [\App\Http\Controllers\InventarioController::class, 'proximosVencer'])->middleware('permission:inventario.proximos-vencer')->name('proximos-vencer');
        Route::get('vencidos', [\App\Http\Controllers\InventarioController::class, 'vencidos'])->middleware('permission:inventario.vencidos')->name('vencidos');
        Route::get('movimientos', [\App\Http\Controllers\InventarioController::class, 'movimientos'])->middleware('permission:inventario.movimientos')->name('movimientos');
        Route::get('ajuste', [\App\Http\Controllers\InventarioController::class, 'ajusteForm'])->middleware('permission:inventario.ajuste.form')->name('ajuste.form');
        Route::post('ajuste', [\App\Http\Controllers\InventarioController::class, 'procesarAjuste'])->middleware('permission:inventario.ajuste.procesar')->name('ajuste.procesar');
        Route::get('reportes', [\App\Http\Controllers\InventarioController::class, 'reportes'])->middleware('permission:inventario.reportes.index')->name('reportes');

        // API routes para inventario
        Route::get('api/buscar-productos', [\App\Http\Controllers\InventarioController::class, 'buscarProductos'])->middleware('permission:inventario.api.buscar-productos')->name('api.buscar-productos');
        Route::get('api/stock-producto/{producto}', [\App\Http\Controllers\InventarioController::class, 'stockProducto'])->middleware('permission:inventario.api.stock-producto')->name('api.stock-producto');
    });

    // Rutas para reportes de precios
    Route::prefix('reportes')->name('reportes.')->group(function () {
        Route::get('precios', [\App\Http\Controllers\ReportePreciosController::class, 'index'])->middleware('permission:reportes.precios.index')->name('precios.index');
        Route::get('precios/export', [\App\Http\Controllers\ReportePreciosController::class, 'export'])->name('precios.export');
        Route::get('ganancias', [\App\Http\Controllers\ReportePreciosController::class, 'ganancias'])->name('ganancias.index');
        Route::get('ganancias/export', [\App\Http\Controllers\ReportePreciosController::class, 'exportGanancias'])->name('ganancias.export');

        // Reportes de inventario
        Route::prefix('inventario')->name('inventario.')->group(function () {
            Route::get('stock-actual', [\App\Http\Controllers\ReporteInventarioController::class, 'stockActual'])->name('stock-actual');
            Route::get('vencimientos', [\App\Http\Controllers\ReporteInventarioController::class, 'vencimientos'])->name('vencimientos');
            Route::get('rotacion', [\App\Http\Controllers\ReporteInventarioController::class, 'rotacion'])->name('rotacion');
            Route::get('movimientos', [\App\Http\Controllers\ReporteInventarioController::class, 'movimientos'])->name('movimientos');
            Route::get('export', [\App\Http\Controllers\ReporteInventarioController::class, 'export'])->name('export');
        });
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
