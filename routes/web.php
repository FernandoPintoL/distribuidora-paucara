<?php

use App\Http\Controllers\CategoriaController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return Inertia::render('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::resource('categorias', CategoriaController::class);
    Route::resource('marcas', \App\Http\Controllers\MarcaController::class);
    Route::resource('almacenes', \App\Http\Controllers\AlmacenController::class);

    // Incluir rutas de configuración global
    require __DIR__.'/configuracion.php';

    Route::resource('proveedores', \App\Http\Controllers\ProveedorController::class);
    Route::resource('clientes', \App\Http\Controllers\ClienteController::class);
    Route::resource('productos', \App\Http\Controllers\ProductoController::class)->except(['show']);
    Route::get('productos/{producto}/historial-precios', [\App\Http\Controllers\ProductoController::class, 'historialPrecios'])->name('productos.historial-precios');
    Route::resource('unidades', \App\Http\Controllers\UnidadMedidaController::class)->parameters(['unidades' => 'unidad']);

    // Rutas para gestión de tipos de precio
    Route::resource('tipos-precio', \App\Http\Controllers\TipoPrecioController::class)->parameters(['tipos-precio' => 'tipoPrecio']);
    Route::patch('tipos-precio/{tipoPrecio}/toggle-activo', [\App\Http\Controllers\TipoPrecioController::class, 'toggleActivo'])->name('tipos-precio.toggle-activo');

    // Rutas para gestión de monedas
    Route::resource('monedas', \App\Http\Controllers\MonedaController::class);
    Route::get('monedas/{moneda}/activas', [\App\Http\Controllers\MonedaController::class, 'activas'])->name('monedas.activas');
    Route::post('monedas/convertir', [\App\Http\Controllers\MonedaController::class, 'convertir'])->name('monedas.convertir');
    Route::patch('monedas/{moneda}/toggle-activo', [\App\Http\Controllers\MonedaController::class, 'toggleActivo'])->name('monedas.toggle-activo');
    Route::patch('monedas/{moneda}/establecer-base', [\App\Http\Controllers\MonedaController::class, 'establecerBase'])->name('monedas.establecer-base');

    // Rutas para gestión de tipos de pago
    Route::resource('tipos-pago', \App\Http\Controllers\TipoPagoController::class)->parameters(['tipos-pago' => 'tipoPago']);

    // Rutas para gestión de compras
    Route::resource('compras', \App\Http\Controllers\CompraController::class);
    Route::resource('compras.detalles', \App\Http\Controllers\DetalleCompraController::class)->shallow();

    // Rutas para gestión de inventario
    Route::prefix('inventario')->name('inventario.')->group(function () {
        Route::get('/', [\App\Http\Controllers\InventarioController::class, 'dashboard'])->name('dashboard');
        Route::get('stock-bajo', [\App\Http\Controllers\InventarioController::class, 'stockBajo'])->name('stock-bajo');
        Route::get('proximos-vencer', [\App\Http\Controllers\InventarioController::class, 'proximosVencer'])->name('proximos-vencer');
        Route::get('vencidos', [\App\Http\Controllers\InventarioController::class, 'vencidos'])->name('vencidos');
        Route::get('movimientos', [\App\Http\Controllers\InventarioController::class, 'movimientos'])->name('movimientos');
        Route::get('ajuste', [\App\Http\Controllers\InventarioController::class, 'ajusteForm'])->name('ajuste.form');
        Route::post('ajuste', [\App\Http\Controllers\InventarioController::class, 'procesarAjuste'])->name('ajuste.procesar');
        
        // API routes para inventario
        Route::get('api/buscar-productos', [\App\Http\Controllers\InventarioController::class, 'buscarProductos'])->name('api.buscar-productos');
        Route::get('api/stock-producto/{producto}', [\App\Http\Controllers\InventarioController::class, 'stockProducto'])->name('api.stock-producto');
    });

    // Rutas para reportes de precios
    Route::prefix('reportes')->name('reportes.')->group(function () {
        Route::get('precios', [\App\Http\Controllers\ReportePreciosController::class, 'index'])->name('precios.index');
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

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
