<?php

use App\Http\Controllers\CategoriaController;
use App\Http\Controllers\EnvioController;
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

    // Rutas para gestión de módulos del sidebar
    Route::get('modulos-sidebar', [\App\Http\Controllers\ModuloSidebarController::class, 'index'])->name('modulos-sidebar.index');
    Route::get('modulos-sidebar/create', [\App\Http\Controllers\ModuloSidebarController::class, 'create'])->middleware('permission:admin.config')->name('modulos-sidebar.create');
    Route::post('modulos-sidebar', [\App\Http\Controllers\ModuloSidebarController::class, 'store'])->middleware('permission:admin.config')->name('modulos-sidebar.store');
    Route::get('modulos-sidebar/{moduloSidebar}', [\App\Http\Controllers\ModuloSidebarController::class, 'show'])->name('modulos-sidebar.show');
    Route::get('modulos-sidebar/{moduloSidebar}/edit', [\App\Http\Controllers\ModuloSidebarController::class, 'edit'])->middleware('permission:admin.config')->name('modulos-sidebar.edit');
    Route::match(['PUT', 'PATCH'], 'modulos-sidebar/{moduloSidebar}', [\App\Http\Controllers\ModuloSidebarController::class, 'update'])->middleware('permission:admin.config')->name('modulos-sidebar.update');
    Route::delete('modulos-sidebar/{moduloSidebar}', [\App\Http\Controllers\ModuloSidebarController::class, 'destroy'])->middleware('permission:admin.config')->name('modulos-sidebar.destroy');
    Route::get('api/modulos-sidebar', [\App\Http\Controllers\ModuloSidebarController::class, 'obtenerParaSidebar'])->name('api.modulos-sidebar');
    Route::post('modulos-sidebar/actualizar-orden', [\App\Http\Controllers\ModuloSidebarController::class, 'actualizarOrden'])->middleware('permission:admin.config')->name('modulos-sidebar.actualizar-orden');
    Route::patch('modulos-sidebar/{moduloSidebar}/toggle-activo', [\App\Http\Controllers\ModuloSidebarController::class, 'toggleActivo'])->middleware('permission:admin.config')->name('modulos-sidebar.toggle-activo');

    // Rutas para gestión de usuarios, roles y permisos
    Route::resource('usuarios', \App\Http\Controllers\UserController::class);
    Route::post('usuarios/{user}/assign-role', [\App\Http\Controllers\UserController::class, 'assignRole'])->name('usuarios.assign-role');
    Route::delete('usuarios/{user}/remove-role', [\App\Http\Controllers\UserController::class, 'removeRole'])->name('usuarios.remove-role');
    Route::post('usuarios/{user}/assign-permission', [\App\Http\Controllers\UserController::class, 'assignPermission'])->name('usuarios.assign-permission');
    Route::delete('usuarios/{user}/remove-permission', [\App\Http\Controllers\UserController::class, 'removePermission'])->name('usuarios.remove-permission');

    Route::resource('roles', \App\Http\Controllers\RoleController::class);
    Route::post('roles/{role}/assign-permission', [\App\Http\Controllers\RoleController::class, 'assignPermission'])->name('roles.assign-permission');
    Route::delete('roles/{role}/remove-permission', [\App\Http\Controllers\RoleController::class, 'removePermission'])->name('roles.remove-permission');

    Route::resource('permissions', \App\Http\Controllers\PermissionController::class);

    // Rutas para gestión de empleados
    Route::resource('empleados', \App\Http\Controllers\EmpleadoController::class);
    Route::patch('empleados/{empleado}/toggle-estado', [\App\Http\Controllers\EmpleadoController::class, 'toggleEstado'])->name('empleados.toggle-estado');
    Route::patch('empleados/{empleado}/toggle-acceso-sistema', [\App\Http\Controllers\EmpleadoController::class, 'toggleAccesoSistema'])->name('empleados.toggle-acceso-sistema');

    // Rutas para gestión de compras
    Route::resource('compras', \App\Http\Controllers\CompraController::class)->except(['destroy']);

    // Keep nested details routes
    Route::resource('compras.detalles', \App\Http\Controllers\DetalleCompraController::class)->shallow();

    // Rutas para gestión de ventas
    Route::resource('ventas', \App\Http\Controllers\VentaController::class);
    Route::get('ventas/stock/{producto}', [\App\Http\Controllers\VentaController::class, 'verificarStock'])->name('ventas.verificar-stock');

    // Rutas para gestión de proformas con app externa
    Route::prefix('proformas')->name('proformas.')->group(function () {
        Route::get('/', [\App\Http\Controllers\ProformaController::class, 'index'])->name('index');
        Route::get('/{proforma}', [\App\Http\Controllers\ProformaController::class, 'show'])->name('show');
        Route::post('/{proforma}/aprobar', [\App\Http\Controllers\ProformaController::class, 'aprobar'])->name('aprobar');
        Route::post('/{proforma}/rechazar', [\App\Http\Controllers\ProformaController::class, 'rechazar'])->name('rechazar');
        Route::post('/{proforma}/convertir-venta', [\App\Http\Controllers\ProformaController::class, 'convertirAVenta'])->name('convertir-venta');
    });

    // Rutas para gestión de envíos y logística
    Route::prefix('envios')->name('envios.')->group(function () {
        Route::get('/', [EnvioController::class, 'index'])->name('index');
        Route::get('/{envio}', [EnvioController::class, 'show'])->name('show');
        Route::post('/ventas/{venta}/programar', [EnvioController::class, 'programar'])->name('programar');
        Route::post('/{envio}/iniciar-preparacion', [EnvioController::class, 'iniciarPreparacion'])->name('iniciar-preparacion');
        Route::post('/{envio}/confirmar-salida', [EnvioController::class, 'confirmarSalida'])->name('confirmar-salida');
        Route::post('/{envio}/confirmar-entrega', [EnvioController::class, 'confirmarEntrega'])->name('confirmar-entrega');
        Route::post('/{envio}/cancelar', [EnvioController::class, 'cancelar'])->name('cancelar');

        // API para obtener datos
        Route::get('/api/vehiculos-disponibles', [EnvioController::class, 'obtenerVehiculosDisponibles'])->name('vehiculos-disponibles');
        Route::get('/api/choferes-disponibles', [EnvioController::class, 'obtenerChoferesDisponibles'])->name('choferes-disponibles');
    });

    // Rutas para gestión de cajas
    Route::prefix('cajas')->name('cajas.')->group(function () {
        Route::get('/', [\App\Http\Controllers\CajaController::class, 'index'])->name('index');
        Route::post('/abrir', [\App\Http\Controllers\CajaController::class, 'abrirCaja'])->name('abrir');
        Route::post('/cerrar', [\App\Http\Controllers\CajaController::class, 'cerrarCaja'])->name('cerrar');
        Route::get('/estado', [\App\Http\Controllers\CajaController::class, 'estadoCajas'])->name('estado');
        Route::get('/movimientos', [\App\Http\Controllers\CajaController::class, 'movimientosDia'])->name('movimientos');
    });

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
        Route::get('/', [\App\Http\Controllers\InventarioController::class, 'dashboard'])->middleware('permission:inventario.dashboard')->name('index');
        Route::get('/dashboard', [\App\Http\Controllers\InventarioController::class, 'dashboard'])->middleware('permission:inventario.dashboard')->name('dashboard');
        Route::get('stock-bajo', [\App\Http\Controllers\InventarioController::class, 'stockBajo'])->middleware('permission:inventario.stock-bajo')->name('stock-bajo');
        Route::get('proximos-vencer', [\App\Http\Controllers\InventarioController::class, 'proximosVencer'])->middleware('permission:inventario.proximos-vencer')->name('proximos-vencer');
        Route::get('vencidos', [\App\Http\Controllers\InventarioController::class, 'vencidos'])->middleware('permission:inventario.vencidos')->name('vencidos');
        Route::get('movimientos', [\App\Http\Controllers\InventarioController::class, 'movimientos'])->middleware('permission:inventario.movimientos')->name('movimientos');
        Route::get('ajuste', [\App\Http\Controllers\InventarioController::class, 'ajusteForm'])->middleware('permission:inventario.ajuste.form')->name('ajuste.form');
        Route::post('ajuste', [\App\Http\Controllers\InventarioController::class, 'procesarAjuste'])->middleware('permission:inventario.ajuste.procesar')->name('ajuste.procesar');
        Route::get('reportes', [\App\Http\Controllers\InventarioController::class, 'reportes'])->middleware('permission:inventario.reportes.index')->name('reportes');

        // Rutas para transferencias de inventario
        Route::prefix('transferencias')->name('transferencias.')->group(function () {
            Route::get('/', [\App\Http\Controllers\InventarioController::class, 'transferencias'])->middleware('permission:inventario.transferencias.index')->name('index');
            Route::get('crear', [\App\Http\Controllers\InventarioController::class, 'formularioCrearTransferencia'])->middleware('permission:inventario.transferencias.crear')->name('crear');
            Route::post('crear', [\App\Http\Controllers\InventarioController::class, 'crearTransferencia'])->middleware('permission:inventario.transferencias.crear')->name('store');
            Route::get('{transferencia}', [\App\Http\Controllers\InventarioController::class, 'verTransferencia'])->middleware('permission:inventario.transferencias.ver')->name('show');
            Route::post('{transferencia}/enviar', [\App\Http\Controllers\InventarioController::class, 'enviarTransferencia'])->middleware('permission:inventario.transferencias.enviar')->name('enviar');
            Route::post('{transferencia}/recibir', [\App\Http\Controllers\InventarioController::class, 'recibirTransferencia'])->middleware('permission:inventario.transferencias.recibir')->name('recibir');
            Route::post('{transferencia}/cancelar', [\App\Http\Controllers\InventarioController::class, 'cancelarTransferencia'])->middleware('permission:inventario.transferencias.cancelar')->name('cancelar');
        });

        // Rutas para manejo de mermas
        Route::prefix('mermas')->name('mermas.')->group(function () {
            Route::get('/', [\App\Http\Controllers\InventarioController::class, 'mermas'])->middleware('permission:inventario.mermas.index')->name('index');
            Route::get('registrar', [\App\Http\Controllers\InventarioController::class, 'formularioRegistrarMerma'])->middleware('permission:inventario.mermas.registrar')->name('registrar');
            Route::post('registrar', [\App\Http\Controllers\InventarioController::class, 'registrarMerma'])->middleware('permission:inventario.mermas.registrar')->name('store');
        });
    });

    // Rutas para logística y envíos
    Route::prefix('logistica')->name('logistica.')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\Web\LogisticaController::class, 'dashboard'])->name('dashboard');
        Route::get('envios/{envio}/seguimiento', [App\Http\Controllers\Web\LogisticaController::class, 'seguimiento'])->name('envios.seguimiento');
    });

    // Rutas de envíos (evitar duplicación con las de arriba)
    Route::resource('envios', EnvioController::class);
    Route::post('envios/{envio}/iniciar-preparacion', [EnvioController::class, 'iniciarPreparacion'])->name('envios.iniciar-preparacion');
    Route::post('envios/{envio}/confirmar-salida', [EnvioController::class, 'confirmarSalida'])->name('envios.confirmar-salida');
    Route::post('envios/{envio}/confirmar-entrega', [EnvioController::class, 'confirmarEntrega'])->name('envios.confirmar-entrega');

    // API routes para inventario
    Route::get('api/buscar-productos', [\App\Http\Controllers\InventarioController::class, 'buscarProductos'])->middleware('permission:inventario.api.buscar-productos')->name('api.buscar-productos');
    Route::get('api/stock-producto/{producto}', [\App\Http\Controllers\InventarioController::class, 'stockProducto'])->middleware('permission:inventario.api.stock-producto')->name('api.stock-producto');
    Route::get('api/vehiculos', [\App\Http\Controllers\InventarioController::class, 'apiVehiculos'])->middleware('permission:inventario.api.vehiculos')->name('api.vehiculos');
    Route::get('api/choferes', [\App\Http\Controllers\InventarioController::class, 'apiChoferes'])->middleware('permission:inventario.api.choferes')->name('api.choferes');

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
