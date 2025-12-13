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

// Ruta de prueba para verificar CSRF token
Route::post('/test-csrf', function () {
    return response()->json(['message' => 'CSRF token is valid', 'success' => true]);
})->name('test.csrf');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', [App\Http\Controllers\DashboardController::class, 'index'])->name('dashboard');

    // API routes para el dashboard
    Route::prefix('api/dashboard')->group(function () {
        Route::get('metricas', [App\Http\Controllers\DashboardController::class, 'metricas'])->name('api.dashboard.metricas');
        Route::get('graficos', [App\Http\Controllers\DashboardController::class, 'graficos'])->name('api.dashboard.graficos');
        Route::get('productos-mas-vendidos', [App\Http\Controllers\DashboardController::class, 'productosMasVendidos'])->name('api.dashboard.productos-mas-vendidos');
        Route::get('alertas-stock', [App\Http\Controllers\DashboardController::class, 'alertasStock'])->name('api.dashboard.alertas-stock');
        Route::get('ventas-por-canal', [App\Http\Controllers\DashboardController::class, 'ventasPorCanal'])->name('api.dashboard.ventas-por-canal');
    });

    // Incluir rutas de roles
    require __DIR__ . '/roles.php';

    Route::resource('categorias', CategoriaController::class)->middleware('permission:categorias.manage');
    Route::resource('marcas', \App\Http\Controllers\MarcaController::class)->middleware('permission:marcas.manage');
    Route::resource('almacenes', \App\Http\Controllers\AlmacenController::class)->middleware('permission:almacenes.manage');
    Route::resource('localidades', \App\Http\Controllers\LocalidadController::class)->middleware('permission:localidades.manage');
    Route::get('localidades/api/active', [\App\Http\Controllers\LocalidadController::class, 'getActiveLocalidades'])->name('localidades.api.active');

    // Incluir rutas de configuración global
    require __DIR__ . '/configuracion.php';

    Route::resource('proveedores', \App\Http\Controllers\ProveedorController::class)->middleware('permission:proveedores.manage');
    Route::resource('clientes', \App\Http\Controllers\ClienteController::class)->middleware('permission:clientes.manage');

    // Rutas para fotos de lugar de clientes
    Route::middleware(['permission:clientes.manage'])->group(function () {
        Route::get('clientes/{cliente}/fotos', [\App\Http\Controllers\FotoLugarClienteController::class, 'index'])->name('clientes.fotos.index');
        Route::get('clientes/{cliente}/fotos/create', [\App\Http\Controllers\FotoLugarClienteController::class, 'create'])->name('clientes.fotos.create');
        Route::post('clientes/{cliente}/fotos', [\App\Http\Controllers\FotoLugarClienteController::class, 'store'])->name('clientes.fotos.store');
        Route::get('clientes/{cliente}/fotos/{foto}', [\App\Http\Controllers\FotoLugarClienteController::class, 'show'])->name('clientes.fotos.show');
        Route::get('clientes/{cliente}/fotos/{foto}/edit', [\App\Http\Controllers\FotoLugarClienteController::class, 'edit'])->name('clientes.fotos.edit');
        Route::put('clientes/{cliente}/fotos/{foto}', [\App\Http\Controllers\FotoLugarClienteController::class, 'update'])->name('clientes.fotos.update');
        Route::delete('clientes/{cliente}/fotos/{foto}', [\App\Http\Controllers\FotoLugarClienteController::class, 'destroy'])->name('clientes.fotos.destroy');
    });

    Route::resource('productos', \App\Http\Controllers\ProductoController::class)->except(['show'])->middleware('permission:productos.manage');
    Route::get('productos/crear/moderno', [\App\Http\Controllers\ProductoController::class, 'createModerno'])->middleware('permission:productos.manage')->name('productos.create.moderno');
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

    // Rutas para backup de imágenes
    Route::get('admin/image-backup', fn() => \Inertia\Inertia::render('admin/image-backup'))->middleware('permission:admin.image-backup.manage')->name('admin.image-backup');

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
    Route::post('usuarios/{usuario}/assign-role', [\App\Http\Controllers\UserController::class, 'assignRole'])->name('usuarios.assign-role');
    Route::delete('usuarios/{usuario}/remove-role', [\App\Http\Controllers\UserController::class, 'removeRole'])->name('usuarios.remove-role');
    Route::post('usuarios/{usuario}/assign-permission', [\App\Http\Controllers\UserController::class, 'assignPermission'])->name('usuarios.assign-permission');
    Route::delete('usuarios/{usuario}/remove-permission', [\App\Http\Controllers\UserController::class, 'removePermission'])->name('usuarios.remove-permission');
    Route::patch('usuarios/{usuario}/toggle-status', [\App\Http\Controllers\UserController::class, 'toggleStatus'])->name('usuarios.toggle-status');

    Route::resource('roles', \App\Http\Controllers\RoleController::class);
    Route::post('roles/{role}/assign-permission', [\App\Http\Controllers\RoleController::class, 'assignPermission'])->name('roles.assign-permission');
    Route::delete('roles/{role}/remove-permission', [\App\Http\Controllers\RoleController::class, 'removePermission'])->name('roles.remove-permission');

    // Rutas avanzadas de Roles - Sistema C
    Route::get('roles-data/templates', [\App\Http\Controllers\RoleController::class, 'getTemplates'])->name('roles.templates');
    Route::post('roles-data/templates', [\App\Http\Controllers\RoleController::class, 'createTemplate'])->name('roles.create-template');
    Route::post('roles/{role}/apply-template', [\App\Http\Controllers\RoleController::class, 'applyTemplate'])->name('roles.apply-template');
    Route::post('roles/{role}/copy-from', [\App\Http\Controllers\RoleController::class, 'copyFromRole'])->name('roles.copy-from');
    Route::post('roles-data/compare', [\App\Http\Controllers\RoleController::class, 'compareRoles'])->name('roles.compare');
    Route::get('roles/{role}/audit', [\App\Http\Controllers\RoleController::class, 'getAudit'])->name('roles.audit');
    Route::get('roles-data/permissions-grouped', [\App\Http\Controllers\RoleController::class, 'getPermissionsGrouped'])->name('roles.permissions-grouped');

    // ✅ PANEL DE GESTIÓN DE PERMISOS
    Route::prefix('permisos')->name('permisos.')->group(function () {
        // Ver todos los permisos
        Route::get('/', [\App\Http\Controllers\PermissionController::class, 'index'])
            ->middleware('permission:permissions.index')
            ->name('index');

        // Editar permisos de usuario
        Route::get('usuario/{user}/editar', [\App\Http\Controllers\PermissionController::class, 'editarUsuario'])
            ->middleware('permission:usuarios.assign-permission')
            ->name('usuario.editar');
        Route::patch('usuario/{user}', [\App\Http\Controllers\PermissionController::class, 'actualizarUsuario'])
            ->middleware('permission:usuarios.assign-permission')
            ->name('usuario.actualizar');

        // Editar permisos de rol
        Route::get('rol/{role}/editar', [\App\Http\Controllers\PermissionController::class, 'editarRol'])
            ->middleware('permission:roles.assign-permission')
            ->name('rol.editar');
        Route::patch('rol/{role}', [\App\Http\Controllers\PermissionController::class, 'actualizarRol'])
            ->middleware('permission:roles.assign-permission')
            ->name('rol.actualizar');
    });

    // Rutas para gestión de empleados
    Route::resource('empleados', \App\Http\Controllers\EmpleadoController::class);
    Route::patch('empleados/{empleado}/toggle-estado', [\App\Http\Controllers\EmpleadoController::class, 'toggleEstado'])->name('empleados.toggle-estado');
    Route::patch('empleados/{empleado}/toggle-acceso-sistema', [\App\Http\Controllers\EmpleadoController::class, 'toggleAccesoSistema'])->name('empleados.toggle-acceso-sistema');
    Route::post('empleados/crear-rapido', [\App\Http\Controllers\EmpleadoController::class, 'crearEmpleadoRapido'])->name('empleados.crear-rapido');

    // Rutas para datos de selects en formularios de empleados
    Route::get('empleados-data/departamentos', [\App\Http\Controllers\EmpleadoController::class, 'getDepartamentos'])->name('empleados.data.departamentos');
    Route::get('empleados-data/tipos-contrato', [\App\Http\Controllers\EmpleadoController::class, 'getTiposContrato'])->name('empleados.data.tipos-contrato');
    Route::get('empleados-data/estados', [\App\Http\Controllers\EmpleadoController::class, 'getEstados'])->name('empleados.data.estados');
    Route::get('empleados-data/supervisores', [\App\Http\Controllers\EmpleadoController::class, 'getSupervisores'])->name('empleados.data.supervisores');
    Route::get('empleados-data/roles', [\App\Http\Controllers\EmpleadoController::class, 'getRoles'])->name('empleados.data.roles');
    Route::post('empleados-data/rol-sugerido', [\App\Http\Controllers\EmpleadoController::class, 'getRolSugeridoPorCargo'])->name('empleados.data.rol-sugerido');

    // Rutas adicionales para módulo de compras (ANTES de resource para evitar conflictos)
    Route::prefix('compras')->name('compras.')->group(function () {
        // Gestión de Cuentas por Pagar
        Route::get('cuentas-por-pagar', [\App\Http\Controllers\CuentaPorPagarController::class, 'index'])->name('cuentas-por-pagar.index');
        Route::get('cuentas-por-pagar/export', [\App\Http\Controllers\CuentaPorPagarController::class, 'export'])->name('cuentas-por-pagar.export');
        Route::get('cuentas-por-pagar/{cuenta}/show', [\App\Http\Controllers\CuentaPorPagarController::class, 'show'])->name('cuentas-por-pagar.show');
        Route::patch('cuentas-por-pagar/{cuenta}/estado', [\App\Http\Controllers\CuentaPorPagarController::class, 'actualizarEstado'])->name('cuentas-por-pagar.actualizar-estado');

        // Sistema de Pagos
        Route::get('pagos', [\App\Http\Controllers\PagoController::class, 'index'])->name('pagos.index');
        Route::get('pagos/create', [\App\Http\Controllers\PagoController::class, 'create'])->name('pagos.create');
        Route::post('pagos', [\App\Http\Controllers\PagoController::class, 'store'])->name('pagos.store');
        Route::get('pagos/{pago}', [\App\Http\Controllers\PagoController::class, 'show'])->name('pagos.show');
        Route::delete('pagos/{pago}', [\App\Http\Controllers\PagoController::class, 'destroy'])->name('pagos.destroy');
        Route::get('pagos/export', [\App\Http\Controllers\PagoController::class, 'export'])->name('pagos.export');

        // Gestión de Lotes y Vencimientos
        Route::get('lotes-vencimientos', [\App\Http\Controllers\LoteVencimientoController::class, 'index'])->name('lotes-vencimientos.index');
        Route::patch('lotes-vencimientos/{lote}/actualizar-estado', [\App\Http\Controllers\LoteVencimientoController::class, 'actualizarEstado'])->name('lotes-vencimientos.actualizar-estado');
        Route::patch('lotes-vencimientos/{lote}/cantidad', [\App\Http\Controllers\LoteVencimientoController::class, 'actualizarCantidad'])->name('lotes-vencimientos.actualizar-cantidad');
        Route::get('lotes-vencimientos/export', [\App\Http\Controllers\LoteVencimientoController::class, 'export'])->name('lotes-vencimientos.export');

        // Reportes Específicos
        Route::get('reportes', [\App\Http\Controllers\ReporteComprasController::class, 'index'])->name('reportes.index');
        Route::get('reportes/export', [\App\Http\Controllers\ReporteComprasController::class, 'export'])->name('reportes.export');
        Route::get('reportes/export-pdf', [\App\Http\Controllers\ReporteComprasController::class, 'exportPdf'])->name('reportes.export-pdf');
    });

    // Rutas para gestión de compras (después de rutas específicas para evitar conflictos)
    Route::resource('compras', \App\Http\Controllers\CompraController::class)->except(['destroy']);

    // Keep nested details routes
    Route::resource('compras.detalles', \App\Http\Controllers\DetalleCompraController::class)->shallow();

    // Rutas para gestión de ventas
    Route::resource('ventas', \App\Http\Controllers\VentaController::class);

    // Rutas para gestión de stock en ventas
    Route::prefix('ventas/stock')->name('ventas.stock.')->group(function () {
        Route::post('verificar', [\App\Http\Controllers\VentaController::class, 'verificarStock'])->name('verificar');
        Route::get('producto/{producto}', [\App\Http\Controllers\VentaController::class, 'obtenerStockProducto'])->name('producto');
        Route::get('bajo', [\App\Http\Controllers\VentaController::class, 'productosStockBajo'])->name('bajo');
    });

    // Ruta para resumen de stock de una venta específica
    Route::get('ventas/{venta}/stock/resumen', [\App\Http\Controllers\VentaController::class, 'obtenerResumenStock'])->name('ventas.stock.resumen');

    // ==========================================
    // PROFORMAS - VISTAS INERTIA (usan ApiProformaController)
    // ==========================================
    // Vistas Inertia que reciben datos desde ApiProformaController
    // Todas las acciones (aprobar, rechazar, convertir) van a /api/proformas/*
    Route::prefix('proformas')->name('proformas.')->group(function () {
        // Vista: Lista de proformas (usa ApiProformaController::index)
        Route::get('/', [\App\Http\Controllers\ProformaController::class, 'index'])->name('index');

        // Vista: Detalle de proforma (usa ApiProformaController::show)
        Route::get('/{proforma}', [\App\Http\Controllers\ProformaController::class, 'show'])->name('show');

        // NOTA: Las acciones POST usan las rutas API (definidas en routes/api.php):
        // - POST /api/proformas/{id}/aprobar → ApiProformaController::aprobar()
        // - POST /api/proformas/{id}/rechazar → ApiProformaController::rechazar()
        // - POST /api/proformas/{id}/convertir-venta → ApiProformaController::convertirAVenta()
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
        Route::get('ajuste-masivo', [\App\Http\Controllers\InventarioController::class, 'ajusteMasivoForm'])->middleware('permission:inventario.ajuste.form')->name('ajuste-masivo.form');
        Route::get('historial-cargas', [\App\Http\Controllers\InventarioController::class, 'historialCargasForm'])->middleware('permission:inventario.ajuste.form')->name('historial-cargas.form');
        Route::get('reportes', [\App\Http\Controllers\InventarioController::class, 'reportes'])->middleware('permission:inventario.reportes')->name('reportes');

        // Rutas para gestión de tipos de ajuste de inventario
        Route::resource('tipos-ajuste-inventario', \App\Http\Controllers\TipoAjusteInventarioController::class)->parameters(['tipos-ajuste-inventario' => 'tipoAjusteInventario'])->middleware('permission:inventario.tipos-ajuste.manage');

        // Rutas para gestión de vehículos desde inventario
        Route::prefix('vehiculos')->name('vehiculos.')->group(function () {
            Route::get('/', [\App\Http\Controllers\VehiculoController::class, 'index'])->middleware('permission:inventario.vehiculos.manage')->name('index');
            Route::get('create', [\App\Http\Controllers\VehiculoController::class, 'create'])->middleware('permission:inventario.vehiculos.manage')->name('create');
            Route::post('/', [\App\Http\Controllers\VehiculoController::class, 'store'])->middleware('permission:inventario.vehiculos.manage')->name('store');
            Route::get('{vehiculo}/edit', [\App\Http\Controllers\VehiculoController::class, 'edit'])->middleware('permission:inventario.vehiculos.manage')->name('edit');
            Route::put('{vehiculo}', [\App\Http\Controllers\VehiculoController::class, 'update'])->middleware('permission:inventario.vehiculos.manage')->name('update');
            Route::delete('{vehiculo}', [\App\Http\Controllers\VehiculoController::class, 'destroy'])->middleware('permission:inventario.vehiculos.manage')->name('destroy');
        });

        // Rutas para transferencias de inventario
        Route::prefix('transferencias')->name('transferencias.')->group(function () {
            Route::get('/', [\App\Http\Controllers\InventarioController::class, 'transferencias'])->middleware('permission:inventario.transferencias.index')->name('index');
            Route::get('crear', [\App\Http\Controllers\InventarioController::class, 'formularioCrearTransferencia'])->middleware('permission:inventario.transferencias.crear')->name('crear');
            Route::post('crear', [\App\Http\Controllers\InventarioController::class, 'crearTransferencia'])->middleware('permission:inventario.transferencias.crear')->name('store');
            Route::get('{transferencia}', [\App\Http\Controllers\InventarioController::class, 'verTransferencia'])->middleware('permission:inventario.transferencias.ver')->name('show');
            Route::get('{transferencia}/edit', [\App\Http\Controllers\InventarioController::class, 'editarTransferencia'])->middleware('permission:inventario.transferencias.edit')->name('edit');
            Route::put('{transferencia}', [\App\Http\Controllers\InventarioController::class, 'actualizarTransferencia'])->middleware('permission:inventario.transferencias.edit')->name('update');
            Route::post('{transferencia}/enviar', [\App\Http\Controllers\InventarioController::class, 'enviarTransferencia'])->middleware('permission:inventario.transferencias.enviar')->name('enviar');
            Route::post('{transferencia}/recibir', [\App\Http\Controllers\InventarioController::class, 'recibirTransferencia'])->middleware('permission:inventario.transferencias.recibir')->name('recibir');
            Route::post('{transferencia}/cancelar', [\App\Http\Controllers\InventarioController::class, 'cancelarTransferencia'])->middleware('permission:inventario.transferencias.cancelar')->name('cancelar');
        });

        // Rutas para manejo de mermas
        Route::prefix('mermas')->name('mermas.')->group(function () {
            Route::get('/', [\App\Http\Controllers\InventarioController::class, 'mermas'])->middleware('permission:inventario.mermas.index')->name('index');
            Route::get('registrar', [\App\Http\Controllers\InventarioController::class, 'formularioRegistrarMerma'])->middleware('permission:inventario.mermas.registrar')->name('registrar');
            Route::post('registrar', [\App\Http\Controllers\InventarioController::class, 'registrarMerma'])->middleware('permission:inventario.mermas.registrar')->name('store');
            Route::get('{merma}', [\App\Http\Controllers\InventarioController::class, 'verMerma'])->middleware('permission:inventario.mermas.ver')->name('show');
            Route::post('{merma}/aprobar', [\App\Http\Controllers\InventarioController::class, 'aprobarMerma'])->middleware('permission:inventario.mermas.aprobar')->name('aprobar');
            Route::post('{merma}/rechazar', [\App\Http\Controllers\InventarioController::class, 'rechazarMerma'])->middleware('permission:inventario.mermas.rechazar')->name('rechazar');
        });

        // Rutas para carga masiva de inventario inicial
        Route::get('inventario-inicial', [\App\Http\Controllers\InventarioInicialController::class, 'index'])->middleware('permission:inventario.ajuste.form')->name('inicial.index');
        Route::post('inventario-inicial', [\App\Http\Controllers\InventarioInicialController::class, 'store'])->middleware('permission:inventario.ajuste.procesar')->name('inicial.store');
    });

    // Rutas para logística y envíos
    Route::prefix('logistica')->name('logistica.')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\Web\LogisticaController::class, 'dashboard'])->name('dashboard');
        Route::get('entregas-asignadas', fn() => Inertia::render('logistica/entregas-asignadas'))->name('entregas-asignadas');
        Route::get('entregas-en-transito', fn() => Inertia::render('logistica/entregas-en-transito'))->name('entregas-en-transito');
        Route::get('proformas-pendientes', fn() => Inertia::render('logistica/proformas-pendientes'))->name('proformas-pendientes');
        Route::get('envios/{envio}/seguimiento', [App\Http\Controllers\Web\LogisticaController::class, 'seguimiento'])->name('envios.seguimiento');
    });

    // ✅ NUEVO: Dashboard para Vendedor/Cajero
    Route::prefix('vendedor')->name('vendedor.')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\VendedorController::class, 'dashboard'])->name('dashboard');
    });

    // ✅ NUEVO: Dashboard para Chofer
    Route::prefix('chofer')->name('chofer.')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\ChoferController::class, 'dashboard'])->name('dashboard');
    });

    // ✅ NUEVO: Dashboard para Preventista
    Route::prefix('preventista')->name('preventista.')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\PreventistController::class, 'dashboard'])->name('dashboard');
    });

    // ✅ NUEVO: Dashboard para Admin
    Route::prefix('admin')->name('admin.')->group(function () {
        Route::get('dashboard', [App\Http\Controllers\AdminController::class, 'dashboard'])->name('dashboard');
    });

    // Rutas para gestión de rutas (planificación y seguimiento)
    Route::prefix('rutas')->name('rutas.')->middleware('permission:envios.manage')->group(function () {
        Route::get('/', [\App\Http\Controllers\RutaController::class, 'index'])->name('index');
        Route::get('create', [\App\Http\Controllers\RutaController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\RutaController::class, 'store'])->name('store');
        Route::post('/planificar', [\App\Http\Controllers\RutaController::class, 'planificar'])->name('planificar');
        Route::get('{ruta}', [\App\Http\Controllers\RutaController::class, 'show'])->name('show');
        Route::post('{ruta}/iniciar', [\App\Http\Controllers\RutaController::class, 'iniciar'])->name('iniciar');
        Route::post('{ruta}/completar', [\App\Http\Controllers\RutaController::class, 'completar'])->name('completar');
        Route::post('{ruta}/cancelar', [\App\Http\Controllers\RutaController::class, 'cancelar'])->name('cancelar');
        Route::post('detalles/{detalle}/registrar-entrega', [\App\Http\Controllers\RutaController::class, 'registrarEntrega'])->name('registrar-entrega');
    });

    // Rutas de envíos - todas en un grupo para evitar conflictos
    Route::prefix('envios')->name('envios.')->group(function () {
        // API para obtener datos - DEBEN IR ANTES de las rutas con parámetros
        Route::get('api/vehiculos-disponibles', [EnvioController::class, 'obtenerVehiculosDisponibles'])->name('vehiculos-disponibles');
        Route::get('api/choferes-disponibles', [EnvioController::class, 'obtenerChoferesDisponibles'])->name('choferes-disponibles');

        // ✅ NUEVO: Rutas de exportación
        Route::get('export/pdf', [EnvioController::class, 'exportPdf'])->name('export-pdf');
        Route::get('export/excel', [EnvioController::class, 'exportExcel'])->name('export-excel');
        Route::get('export/rechazadas', [EnvioController::class, 'exportEntregasRechazadas'])->name('export-rechazadas');

        // Rutas básicas de resource
        Route::get('/', [EnvioController::class, 'index'])->name('index');
        Route::get('create', [EnvioController::class, 'create'])->name('create');
        Route::post('/', [EnvioController::class, 'store'])->name('store');

        // Rutas para acciones específicas de envíos
        Route::post('ventas/{venta}/programar', [EnvioController::class, 'programar'])->name('programar');
        Route::post('{envio}/iniciar-preparacion', [EnvioController::class, 'iniciarPreparacion'])->name('iniciar-preparacion');
        Route::post('{envio}/confirmar-salida', [EnvioController::class, 'confirmarSalida'])->name('confirmar-salida');
        Route::post('{envio}/confirmar-entrega', [EnvioController::class, 'confirmarEntrega'])->name('confirmar-entrega');
        Route::post('{envio}/cancelar', [EnvioController::class, 'cancelar'])->name('cancelar');

        // Esta ruta DEBE ser la última porque captura cualquier cosa
        Route::get('{envio}', [EnvioController::class, 'show'])->name('show');
    });

    // API routes para autocompletado (NOTA: Estas rutas deberían moverse a routes/api.php eventualmente)
    Route::get('api/proveedores/buscar', [\App\Http\Controllers\ProveedorController::class, 'buscarApi'])->name('api.proveedores.buscar');
    Route::get('api/productos/buscar', [\App\Http\Controllers\ProductoController::class, 'buscarApi'])->name('api.productos.buscar');

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

    // ==========================================
    // RUTAS PARA SISTEMAS AVANZADOS DE INVENTARIO
    // ==========================================

    // Rutas para Reservas de Stock
    Route::prefix('inventario/reservas')->name('reservas-stock.')->middleware('permission:inventario.reservas.manage')->group(function () {
        Route::get('/', [\App\Http\Controllers\ReservaStockController::class, 'index'])->name('index');
        Route::get('dashboard', [\App\Http\Controllers\ReservaStockController::class, 'dashboard'])->name('dashboard');
        Route::get('create', [\App\Http\Controllers\ReservaStockController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\ReservaStockController::class, 'store'])->name('store');
        Route::get('{reservaStock}', [\App\Http\Controllers\ReservaStockController::class, 'show'])->name('show');
        Route::get('{reservaStock}/edit', [\App\Http\Controllers\ReservaStockController::class, 'edit'])->name('edit');
        Route::put('{reservaStock}', [\App\Http\Controllers\ReservaStockController::class, 'update'])->name('update');
        Route::delete('{reservaStock}', [\App\Http\Controllers\ReservaStockController::class, 'destroy'])->name('destroy');

        // Acciones específicas
        Route::post('{reservaStock}/utilizar', [\App\Http\Controllers\ReservaStockController::class, 'utilizar'])->name('utilizar');
        Route::post('{reservaStock}/liberar', [\App\Http\Controllers\ReservaStockController::class, 'liberar'])->name('liberar');

        // APIs
        Route::prefix('api')->name('api.')->group(function () {
            Route::get('stock-disponible', [\App\Http\Controllers\ReservaStockController::class, 'apiStockDisponible'])->name('stock-disponible');
            Route::get('reservas-por-producto', [\App\Http\Controllers\ReservaStockController::class, 'apiReservasPorProducto'])->name('reservas-por-producto');
            Route::post('liberar-vencidas', [\App\Http\Controllers\ReservaStockController::class, 'apiLiberarVencidas'])->name('liberar-vencidas');
        });
    });

    // Rutas para Conteos Físicos
    Route::prefix('inventario/conteos-fisicos')->name('conteos-fisicos.')->middleware('permission:inventario.conteos.manage')->group(function () {
        Route::get('/', [\App\Http\Controllers\ConteoFisicoController::class, 'index'])->name('index');
        Route::get('dashboard', [\App\Http\Controllers\ConteoFisicoController::class, 'dashboard'])->name('dashboard');
        Route::get('create', [\App\Http\Controllers\ConteoFisicoController::class, 'create'])->name('create');
        Route::post('/', [\App\Http\Controllers\ConteoFisicoController::class, 'store'])->name('store');
        Route::get('{conteoFisico}', [\App\Http\Controllers\ConteoFisicoController::class, 'show'])->name('show');

        // Acciones de flujo de conteo
        Route::post('{conteoFisico}/iniciar', [\App\Http\Controllers\ConteoFisicoController::class, 'iniciar'])->name('iniciar');
        Route::post('{conteoFisico}/finalizar', [\App\Http\Controllers\ConteoFisicoController::class, 'finalizar'])->name('finalizar');
        Route::post('{conteoFisico}/aprobar', [\App\Http\Controllers\ConteoFisicoController::class, 'aprobar'])->name('aprobar');
        Route::post('{conteoFisico}/cancelar', [\App\Http\Controllers\ConteoFisicoController::class, 'cancelar'])->name('cancelar');

        // Acciones de conteo de items
        Route::post('{conteoFisico}/items/{detalle}/contar', [\App\Http\Controllers\ConteoFisicoController::class, 'contarItem'])->name('contar-item');
        Route::post('{conteoFisico}/items/{detalle}/recontar', [\App\Http\Controllers\ConteoFisicoController::class, 'recontarItem'])->name('recontar-item');
        Route::post('{conteoFisico}/items/{detalle}/marcar-reconteo', [\App\Http\Controllers\ConteoFisicoController::class, 'marcarParaReconteo'])->name('marcar-reconteo');

        // APIs
        Route::prefix('api')->name('api.')->group(function () {
            Route::get('conteos', [\App\Http\Controllers\ConteoFisicoController::class, 'apiConteos'])->name('conteos');
            Route::get('{conteoFisico}/detalle', [\App\Http\Controllers\ConteoFisicoController::class, 'apiDetalleConteo'])->name('detalle-conteo');
            Route::post('programar-ciclicos', [\App\Http\Controllers\ConteoFisicoController::class, 'apiProgramarConteosCiclicos'])->name('programar-ciclicos');
        });
    });

    // Rutas para Análisis ABC
    Route::prefix('inventario/analisis-abc')->name('analisis-abc.')->middleware('permission:inventario.analisis.manage')->group(function () {
        Route::get('/', [\App\Http\Controllers\AnalisisAbcController::class, 'index'])->name('index');
        Route::get('dashboard', [\App\Http\Controllers\AnalisisAbcController::class, 'dashboard'])->name('dashboard');
        Route::get('{analisisAbc}', [\App\Http\Controllers\AnalisisAbcController::class, 'show'])->name('show');

        // Acciones de cálculo
        Route::post('calcular', [\App\Http\Controllers\AnalisisAbcController::class, 'calcular'])->name('calcular');
        Route::get('export', [\App\Http\Controllers\AnalisisAbcController::class, 'export'])->name('export');

        // Reportes especializados
        Route::get('reportes/rotacion', [\App\Http\Controllers\AnalisisAbcController::class, 'reporteRotacion'])->name('reporte-rotacion');
        Route::get('reportes/obsoletos', [\App\Http\Controllers\AnalisisAbcController::class, 'reporteObsoletos'])->name('reporte-obsoletos');

        // APIs
        Route::prefix('api')->name('api.')->group(function () {
            Route::post('calcular-analisis', [\App\Http\Controllers\AnalisisAbcController::class, 'apiCalcularAnalisis'])->name('calcular-analisis');
            Route::get('recomendaciones', [\App\Http\Controllers\AnalisisAbcController::class, 'apiRecomendaciones'])->name('recomendaciones');
        });
    });
});

require __DIR__ . '/settings.php';
require __DIR__ . '/auth.php';
require __DIR__ . '/test.php';
