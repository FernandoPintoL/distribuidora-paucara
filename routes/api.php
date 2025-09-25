<?php

use App\Http\Controllers\Api\ApiProformaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EstadoMermaController;
use App\Http\Controllers\Api\TipoMermaController;
use App\Http\Controllers\AsientoContableController;
use App\Http\Controllers\CategoriaClienteController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\DireccionClienteApiController;
use App\Http\Controllers\EnvioController;
use App\Http\Controllers\InventarioController;
use App\Http\Controllers\LocalidadController;
use App\Http\Controllers\ProductoController;
use App\Http\Controllers\ProveedorController;
use App\Http\Controllers\ReporteInventarioApiController;
use App\Http\Controllers\VentaController;
use Illuminate\Support\Facades\Route;

// ==========================================
// 🔓 RUTAS API PÚBLICAS (sin autenticación)
// ==========================================

// Rutas de autenticación API
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Rutas API para módulos del sidebar (requiere autenticación)
Route::middleware(['auth'])->get('/modulos-sidebar', [App\Http\Controllers\ModuloSidebarController::class, 'apiIndex'])->name('api.modulos-sidebar');

// ==========================================
// 📱 RUTAS PARA APP EXTERNA (Flutter)
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {
    // Rutas de autenticación protegidas
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/refresh', [AuthController::class, 'refresh']);

    // Catálogos de mermas
    Route::apiResource('tipo-mermas', TipoMermaController::class);
    Route::apiResource('estado-mermas', EstadoMermaController::class);

    // Productos para la app
    Route::get('/app/productos', [ProductoController::class, 'indexApi']);
    Route::get('/app/productos/{producto}', [ProductoController::class, 'showApi']);
    Route::get('/app/productos/buscar', [ProductoController::class, 'buscarApi']);

    // Proformas desde app externa
    Route::prefix('app/proformas')->group(function () {
        Route::get('/', [ApiProformaController::class, 'index']);
        Route::post('/', [ApiProformaController::class, 'store']);
        Route::get('/{proforma}', [ApiProformaController::class, 'show']);
        Route::get('/{proforma}/estado', [ApiProformaController::class, 'verificarEstado']);
        Route::get('/{proforma}/reservas', [ApiProformaController::class, 'verificarReservas']);
        Route::post('/{proforma}/extender-reservas', [ApiProformaController::class, 'extenderReservas']);
    });

    // Verificación de stock
    Route::post('/app/verificar-stock', [ApiProformaController::class, 'verificarStock']);

    // Cliente puede ver sus datos desde la app
    Route::prefix('app/cliente')->group(function () {
        Route::get('/proformas', [ApiProformaController::class, 'index']);
        Route::get('/ventas', [VentaController::class, 'ventasCliente']);
        Route::get('/envios', [EnvioController::class, 'enviosCliente']);
    });

    // Seguimiento de envíos desde la app
    Route::prefix('app/envios')->group(function () {
        Route::get('/{envio}/seguimiento', [EnvioController::class, 'seguimientoApi']);
        Route::post('/{envio}/ubicacion', [EnvioController::class, 'actualizarUbicacion']);
    });

    // Catálogo de productos para la app
    Route::get('/app/productos-disponibles', [ApiProformaController::class, 'obtenerProductosDisponibles']);
});

// ==========================================
// 📊 RUTAS PARA DASHBOARD DE LOGÍSTICA
// ==========================================
Route::middleware(['auth:sanctum'])->group(function () {
    // Estadísticas del dashboard
    Route::get('/logistica/dashboard/stats', [EnvioController::class, 'dashboardStats']);

    // Gestión de proformas
    Route::get('/proformas', [ApiProformaController::class, 'listarParaDashboard']);
    Route::post('/proformas/{proforma}/aprobar', [ApiProformaController::class, 'aprobar']);
    Route::post('/proformas/{proforma}/rechazar', [ApiProformaController::class, 'rechazar']);

    // Gestión de envíos
    Route::get('/envios', [EnvioController::class, 'index']);
    Route::get('/envios/{envio}/seguimiento', [EnvioController::class, 'seguimiento']);
    Route::post('/envios/{envio}/estado', [EnvioController::class, 'actualizarEstado']);
});

// ==========================================
// RUTAS API EXISTENTES
// ==========================================

// Rutas API básicas con nombres únicos para evitar conflictos con rutas web
Route::apiResource('compras', CompraController::class)->names('api.compras');
Route::apiResource('ventas', VentaController::class)->names('api.ventas');

// Rutas adicionales para ventas
Route::group(['prefix' => 'ventas'], function () {
    Route::post('verificar-stock', [VentaController::class, 'verificarStock']);
    Route::get('{producto}/stock', [VentaController::class, 'obtenerStockProducto']);
    Route::get('productos/stock-bajo', [VentaController::class, 'productosStockBajo']);
    Route::get('{venta}/resumen-stock', [VentaController::class, 'obtenerResumenStock']);
});

// Rutas API para contabilidad
Route::group(['prefix' => 'contabilidad'], function () {
    Route::get('asientos', [AsientoContableController::class, 'indexApi']);
    Route::get('asientos/{asientoContable}', [AsientoContableController::class, 'showApi']);
});

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

// Rutas API para localidades
Route::middleware(['auth:sanctum'])->group(function () {
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

        // Cambio de credenciales para clientes autenticados
        Route::post('cambiar-credenciales', [ClienteController::class, 'cambiarCredenciales']);

        // Gestión de direcciones
        Route::get('{cliente}/direcciones', [DireccionClienteApiController::class, 'index']);
        Route::post('{cliente}/direcciones', [DireccionClienteApiController::class, 'store']);
        Route::put('{cliente}/direcciones/{direccion}', [DireccionClienteApiController::class, 'update']);
        Route::delete('{cliente}/direcciones/{direccion}', [DireccionClienteApiController::class, 'destroy']);
        Route::patch('{cliente}/direcciones/{direccion}/principal', [DireccionClienteApiController::class, 'establecerPrincipal']);
    });

    Route::group(['prefix' => 'localidades'], function () {
        Route::get('/', [LocalidadController::class, 'indexApi']);
        Route::post('/', [LocalidadController::class, 'storeApi']);
        Route::get('{localidad}', [LocalidadController::class, 'showApi']);
        Route::put('{localidad}', [LocalidadController::class, 'updateApi']);
        Route::delete('{localidad}', [LocalidadController::class, 'destroyApi']);
    });

    Route::group(['prefix' => 'categorias-cliente'], function () {
        Route::get('/', [CategoriaClienteController::class, 'indexApi']);
        Route::post('/', [CategoriaClienteController::class, 'storeApi']);
        Route::get('{categoria}', [CategoriaClienteController::class, 'showApi']);
        Route::put('{categoria}', [CategoriaClienteController::class, 'updateApi']);
        Route::delete('{categoria}', [CategoriaClienteController::class, 'destroyApi']);
    });
});

// Rutas API para proveedores
Route::group(['prefix' => 'proveedores'], function () {
    Route::post('/', [ProveedorController::class, 'storeApi']);
    Route::get('buscar', [ProveedorController::class, 'buscarApi']);
});
