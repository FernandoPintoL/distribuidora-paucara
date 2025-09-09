<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\VentaController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\ReporteInventarioApiController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\DireccionClienteApiController;

// Rutas API básicas con nombres únicos para evitar conflictos con rutas web
Route::apiResource('compras', CompraController::class)->names('api.compras');
Route::apiResource('ventas', VentaController::class)->names('api.ventas');

// Rutas API para inventario
Route::group(['prefix' => 'inventario'], function () {
    Route::get('buscar-productos', [InventarioController::class, 'buscarProductos']);
    Route::get('stock-producto/{producto}', [InventarioController::class, 'stockProducto']);
    Route::post('ajustes', [InventarioController::class, 'procesarAjusteApi']);
    Route::get('movimientos', [InventarioController::class, 'movimientosApi']);
    Route::post('movimientos', [InventarioController::class, 'crearMovimiento']);
    
    // Reportes
    Route::group(['prefix' => 'reportes'], function () {
        Route::get('estadisticas', [ReporteInventarioApiController::class, 'estadisticasGenerales']);
        Route::get('stock-bajo', [ReporteInventarioApiController::class, 'stockBajo']);
        Route::get('proximos-vencer', [ReporteInventarioApiController::class, 'proximosVencer']);
        Route::get('vencidos', [ReporteInventarioApiController::class, 'vencidos']);
        Route::get('movimientos-periodo', [ReporteInventarioApiController::class, 'movimientosPorPeriodo']);
        Route::get('productos-mas-movidos', [ReporteInventarioApiController::class, 'productosMasMovidos']);
        Route::get('valorizacion', [ReporteInventarioApiController::class, 'valorizacionInventario']);
    });
});

// Rutas API para productos
Route::group(['prefix' => 'productos'], function () {
    Route::get('/', [ProductoController::class, 'indexApi']);
    Route::post('/', [ProductoController::class, 'storeApi']);
    Route::get('buscar', [ProductoController::class, 'buscarApi']);
    Route::get('{producto}', [ProductoController::class, 'showApi']);
    Route::put('{producto}', [ProductoController::class, 'updateApi']);
    Route::delete('{producto}', [ProductoController::class, 'destroyApi']);
    Route::get('{producto}/historial-precios', [ProductoController::class, 'historialPrecios']);
});

// Rutas API para clientes
Route::group(['prefix' => 'clientes'], function () {
    Route::get('/', [ClienteController::class, 'indexApi']);
    Route::post('/', [ClienteController::class, 'storeApi']);
    Route::get('buscar', [ClienteController::class, 'buscarApi']);
    Route::get('{cliente}', [ClienteController::class, 'showApi']);
    Route::put('{cliente}', [ClienteController::class, 'updateApi']);
    Route::delete('{cliente}', [ClienteController::class, 'destroyApi']);
    Route::get('{cliente}/saldo-cuentas', [ClienteController::class, 'saldoCuentasPorCobrar']);
    Route::get('{cliente}/historial-ventas', [ClienteController::class, 'historialVentas']);
    
    // Gestión de direcciones
    Route::get('{cliente}/direcciones', [DireccionClienteApiController::class, 'index']);
    Route::post('{cliente}/direcciones', [DireccionClienteApiController::class, 'store']);
    Route::put('{cliente}/direcciones/{direccion}', [DireccionClienteApiController::class, 'update']);
    Route::delete('{cliente}/direcciones/{direccion}', [DireccionClienteApiController::class, 'destroy']);
    Route::patch('{cliente}/direcciones/{direccion}/principal', [DireccionClienteApiController::class, 'establecerPrincipal']);
});
