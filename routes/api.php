<?php

use App\Http\Controllers\Api\ApiProformaController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EmpleadoApiController;
use App\Http\Controllers\Api\EntregaController;
use App\Http\Controllers\Api\EncargadoController;
use App\Http\Controllers\Api\EstadoMermaController;
use App\Http\Controllers\Api\NotificationController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\TipoAjusteInventarioController;
use App\Http\Controllers\Api\TipoMermaController;
use App\Http\Controllers\Api\TipoOperacionController;
use App\Http\Controllers\Api\TrackingController;
use App\Http\Controllers\AsientoContableController;
use App\Http\Controllers\CategoriaClienteController;
use App\Http\Controllers\ClienteController;
use App\Http\Controllers\CompraController;
use App\Http\Controllers\DireccionClienteApiController;
use App\Http\Controllers\EnvioController;
use App\Http\Controllers\ImageBackupController;
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

// Rutas para empleados
Route::get('/empleados/determinar-rol', [EmpleadoApiController::class, 'determinarRol']);

// Catálogos públicos - GET only (para cargar datos en selects/dropdowns)
// Nota: El control de acceso se hace a nivel de página web con permisos
Route::get('/tipos-ajuste-inventario', [TipoAjusteInventarioController::class, 'index']);
Route::get('/tipo-operaciones', function () {
    return \App\Models\TipoOperacion::activos()->get();
});

// Procesar ajustes masivos (requiere autenticación)
// ✅ ACTUALIZADO: Agregado middleware 'platform' para validar acceso a plataforma
Route::middleware(['auth:sanctum,web', 'platform'])->group(function () {
    Route::post('/inventario/ajustes-masivos', [InventarioController::class, 'importarAjustesMasivos']);

    // Historial de cargas CSV
    Route::get('/inventario/cargos-csv', [InventarioController::class, 'listarCargosCsv']);
    Route::get('/inventario/cargos-csv/{cargo}', [InventarioController::class, 'obtenerDetalleCargo']);
    Route::post('/inventario/cargos-csv/{cargo}/revertir', [InventarioController::class, 'revertirCargo']);
});

// ==========================================
// 📋 RUTAS PARA GESTIÓN DE ROLES
// ==========================================
// Obtener roles con detalles, categorías y descripciones
Route::get('/roles/details', [RoleController::class, 'getRolesWithDetails']);

// Validar combinación de roles
Route::post('/roles/validate-combination', [RoleController::class, 'validateRoleCombination']);

// Rutas API para módulos del sidebar (requiere autenticación)
Route::middleware(['auth'])->get('/modulos-sidebar', [App\Http\Controllers\ModuloSidebarController::class, 'apiIndex'])->name('api.modulos-sidebar');

// ✅ NUEVA: Ruta API para obtener la redirección del dashboard según el rol
Route::middleware(['auth'])->get('/dashboard-redirect', [App\Http\Controllers\Auth\DashboardRedirectController::class, 'getRedirectApi'])->name('api.dashboard-redirect');

// ==========================================
// 📱 RUTAS PARA APP EXTERNA (Flutter)
// ==========================================
// ✅ ACTUALIZADO: Agregado middleware 'platform' para validar acceso a plataforma
Route::middleware(['auth:sanctum,web', 'platform'])->group(function () {
    // Rutas de autenticación protegidas
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/refresh', [AuthController::class, 'refresh']);
    // ✅ NUEVO: Refrescar permisos sin logout
    Route::get('/auth/refresh-permissions', [AuthController::class, 'refreshPermissions']);

    // ✅ NUEVO: API DE PERMISOS (para mobile o admin panel)
    Route::prefix('permisos')->group(function () {
        // Obtener estructura de permisos
        Route::get('/estructura', [\App\Http\Controllers\PermissionController::class, 'getStructure'])
            ->middleware('permission:permissions.index');

        // Obtener permisos agrupados
        Route::get('/agrupados', [\App\Http\Controllers\PermissionController::class, 'getGrouped'])
            ->middleware('permission:permissions.index');

        // Gestionar permisos de usuarios
        Route::get('usuario/{user}', [\App\Http\Controllers\PermissionController::class, 'editarUsuario'])
            ->middleware('permission:usuarios.assign-permission');
        Route::patch('usuario/{user}', [\App\Http\Controllers\PermissionController::class, 'actualizarUsuario'])
            ->middleware('permission:usuarios.assign-permission');

        // Gestionar permisos de roles
        Route::get('rol/{role}', [\App\Http\Controllers\PermissionController::class, 'editarRol'])
            ->middleware('permission:roles.assign-permission');
        Route::patch('rol/{role}', [\App\Http\Controllers\PermissionController::class, 'actualizarRol'])
            ->middleware('permission:roles.assign-permission');
    });

    // ✅ NUEVO: Lista de usuarios y roles para panel central
    Route::get('/usuarios', [\App\Http\Controllers\PermissionController::class, 'getUsuarios'])
        ->middleware('permission:permissions.index');
    Route::get('/roles', [\App\Http\Controllers\PermissionController::class, 'getRoles'])
        ->middleware('permission:permissions.index');

    // ✅ NUEVO: Historial de auditoría
    Route::get('/permisos/historial', [\App\Http\Controllers\PermissionController::class, 'getHistorial'])
        ->middleware('permission:permissions.index');

    // ✅ NUEVO: Bulk edit de permisos
    Route::post('/permisos/bulk-edit', [\App\Http\Controllers\PermissionController::class, 'bulkEdit'])
        ->middleware('permission:permissions.index');

    // ==========================================
    // 🎯 FASE 2: GESTIÓN DE CAPACIDADES
    // ==========================================
    Route::prefix('capacidades')->group(function () {
        // Obtener todas las capacidades con sus permisos
        Route::get('/', [\App\Http\Controllers\PermissionController::class, 'getCapabilities'])
            ->middleware('permission:permissions.index');

        // Obtener plantillas predefinidas
        Route::get('/plantillas', [\App\Http\Controllers\PermissionController::class, 'getCapabilityTemplates'])
            ->middleware('permission:permissions.index');

        // Capacidades de usuario
        Route::get('/usuario/{user}', [\App\Http\Controllers\PermissionController::class, 'getUserCapabilities'])
            ->middleware('permission:permissions.index');
        Route::post('/usuario/{user}/asignar', [\App\Http\Controllers\PermissionController::class, 'assignCapabilityToUser'])
            ->middleware('permission:usuarios.assign-permission');
        Route::post('/usuario/{user}/remover', [\App\Http\Controllers\PermissionController::class, 'removeCapabilityFromUser'])
            ->middleware('permission:usuarios.remove-permission');
        Route::post('/usuario/{user}/aplicar-plantilla', [\App\Http\Controllers\PermissionController::class, 'applyTemplateToUser'])
            ->middleware('permission:usuarios.assign-permission');

        // Capacidades de rol
        Route::get('/rol/{role}', [\App\Http\Controllers\PermissionController::class, 'getRoleCapabilities'])
            ->middleware('permission:permissions.index');
        Route::post('/rol/{role}/asignar', [\App\Http\Controllers\PermissionController::class, 'assignCapabilityToRole'])
            ->middleware('permission:roles.assign-permission');
        Route::post('/rol/{role}/remover', [\App\Http\Controllers\PermissionController::class, 'removeCapabilityFromRole'])
            ->middleware('permission:roles.remove-permission');
        Route::post('/rol/{role}/aplicar-plantilla', [\App\Http\Controllers\PermissionController::class, 'applyTemplateToRole'])
            ->middleware('permission:roles.assign-permission');
    });

    // ==========================================
    // 🔔 GESTIÓN DE NOTIFICACIONES
    // ==========================================
    Route::prefix('notificaciones')->group(function () {
        // Listar todas las notificaciones del usuario
        Route::get('/', [NotificationController::class, 'index']);

        // Listar solo notificaciones no leídas
        Route::get('/no-leidas', [NotificationController::class, 'unread']);

        // Obtener estadísticas de notificaciones
        Route::get('/estadisticas', [NotificationController::class, 'stats']);

        // Obtener notificaciones por tipo
        Route::get('/por-tipo/{type}', [NotificationController::class, 'byType']);

        // Marcar todas las notificaciones como leídas
        Route::post('/marcar-todas-leidas', [NotificationController::class, 'markAllAsRead']);

        // Eliminar todas las notificaciones
        Route::delete('/eliminar-todas', [NotificationController::class, 'destroyAll']);

        // Operaciones sobre notificación específica
        Route::get('/{notification}', [NotificationController::class, 'show']);
        Route::post('/{notification}/marcar-leida', [NotificationController::class, 'markAsRead']);
        Route::post('/{notification}/marcar-no-leida', [NotificationController::class, 'markAsUnread']);
        Route::delete('/{notification}', [NotificationController::class, 'destroy']);
    });

    // Catálogos de mermas
    Route::apiResource('tipo-mermas', TipoMermaController::class);
    Route::apiResource('estado-mermas', EstadoMermaController::class);

    // Catálogos de inventario - Operaciones que modifican datos (POST, PUT, DELETE)
    // El GET está en la ruta pública para que cualquier usuario autenticado pueda obtener los datos
    Route::apiResource('tipos-ajuste-inventario', TipoAjusteInventarioController::class, [
        'only' => ['store', 'update', 'destroy', 'show']
    ]);

    // Productos para la app
    Route::get('/app/productos', [ProductoController::class, 'indexApi']);
    Route::get('/app/productos/{producto}', [ProductoController::class, 'showApi']);
    Route::get('/app/productos/buscar', [ProductoController::class, 'buscarApi']);

    // ==========================================
    // 🛒 PROFORMAS - API UNIFICADA
    // ==========================================
    // Una sola fuente de verdad para todas las operaciones de proformas
    // El método index() filtra automáticamente según el rol del usuario

    // CRUD básico
    Route::get('/proformas', [ApiProformaController::class, 'index']);                    // Lista (inteligente por rol)
    Route::get('/proformas/estadisticas', [ApiProformaController::class, 'stats']);       // Estadísticas (debe ir antes de {proforma})
    Route::post('/proformas', [ApiProformaController::class, 'store']);                   // Crear
    Route::get('/proformas/{proforma}', [ApiProformaController::class, 'show']);          // Ver detalle

    // Acciones sobre proforma
    Route::post('/proformas/{proforma}/aprobar', [ApiProformaController::class, 'aprobar']);
    Route::post('/proformas/{proforma}/rechazar', [ApiProformaController::class, 'rechazar']);
    Route::post('/proformas/{proforma}/convertir-venta', [ApiProformaController::class, 'convertirAVenta']);
    Route::post('/proformas/{proforma}/confirmar', [ApiProformaController::class, 'confirmarProforma'])->name('api.proformas.confirmar');
    Route::post('/proformas/{proforma}/extender-vencimiento', [ApiProformaController::class, 'extenderVencimiento']);
    Route::post('/proformas/{proforma}/coordinar', [ApiProformaController::class, 'coordinarEntrega'])->name('api.proformas.coordinar');

    // Estado y verificaciones
    Route::get('/proformas/{proforma}/estado', [ApiProformaController::class, 'verificarEstado']);
    Route::get('/proformas/{proforma}/reservas', [ApiProformaController::class, 'verificarReservas']);
    Route::post('/proformas/{proforma}/extender-reservas', [ApiProformaController::class, 'extenderReservas']);

    // Utilidades
    Route::post('/proformas/verificar-stock', [ApiProformaController::class, 'verificarStock']);
    Route::get('/proformas/productos-disponibles', [ApiProformaController::class, 'obtenerProductosDisponibles']);

    // 🛒 ENDPOINTS LEGACY PARA APP MÓVIL (mantener por compatibilidad)
    // TODO: Migrar app móvil para usar /proformas en lugar de /app/pedidos
    Route::post('app/pedidos', [ApiProformaController::class, 'crearPedidoDesdeApp']);
    Route::get('app/pedidos/{id}', [ApiProformaController::class, 'obtenerDetallePedido']);
    Route::get('app/pedidos/{id}/estado', [ApiProformaController::class, 'obtenerEstadoPedido']);
    Route::get('carritos/usuario/{usuarioId}/ultimo', [ApiProformaController::class, 'obtenerUltimoCarrito']);

    // Cliente puede ver sus datos desde la app
    Route::prefix('app/cliente')->group(function () {
        Route::get('/ventas', [VentaController::class, 'ventasCliente']);
        Route::get('/envios', [EnvioController::class, 'enviosCliente']);
    });

    // 💳 GESTIÓN DE PAGOS EN VENTAS
    Route::prefix('app/ventas')->group(function () {
        Route::post('/{venta}/pagos', [VentaController::class, 'registrarPago'])->name('api.ventas.registrar-pago');
    });

    // Seguimiento de envíos desde la app
    Route::prefix('app/envios')->group(function () {
        Route::get('/{envio}/seguimiento', [EnvioController::class, 'seguimientoApi']);
        Route::post('/{envio}/ubicacion', [EnvioController::class, 'actualizarUbicacion']);

        // ✅ NUEVO: Rechazar entrega desde app (chofer reporta problema)
        Route::put('/{envio}/rechazar', [EnvioController::class, 'rechazarEntrega'])
            ->name('api.envios.rechazar');
    });
});

// ==========================================
// 📊 RUTAS PARA DASHBOARD DE LOGÍSTICA
// ==========================================
// ✅ ACTUALIZADO: Agregado middleware 'platform' para validar acceso a plataforma
Route::middleware(['auth:sanctum,web', 'platform'])->group(function () {
    // Estadísticas del dashboard
    Route::get('/logistica/dashboard/stats', [EnvioController::class, 'dashboardStats']);

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

    // ✅ NUEVO: Tipos de Operación para ajustes masivos
    Route::get('tipos-operacion', [TipoOperacionController::class, 'index']);
    Route::get('tipos-operacion/{tipoOperacion}', [TipoOperacionController::class, 'show']);
    Route::get('tipos-operacion/por-direccion/{direccion}', [TipoOperacionController::class, 'porDireccion']);
    Route::get('tipos-operacion/con-requisitos', [TipoOperacionController::class, 'conRequisitos']);

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
Route::middleware(['auth:sanctum,web', 'platform'])->group(function () {
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
        Route::get('/', [ClienteController::class, 'index']);
        Route::post('/', [ClienteController::class, 'store']);
        Route::get('buscar', [ClienteController::class, 'buscarApi']);

        // Ruta especial para obtener el perfil del cliente autenticado (debe ir antes de {cliente})
        Route::get('mi-perfil', [ClienteController::class, 'miPerfil']);

        Route::get('{cliente}', [ClienteController::class, 'showApi']);
        Route::put('{cliente}', [ClienteController::class, 'update']);
        Route::delete('{cliente}', [ClienteController::class, 'destroy']);
        Route::get('{cliente}/saldo-cuentas', [ClienteController::class, 'saldoCuentasPorCobrar']);
        Route::get('{cliente}/historial-ventas', [ClienteController::class, 'historialVentas']);

        // Cambio de credenciales para clientes autenticados
        Route::post('cambiar-credenciales', [ClienteController::class, 'cambiarCredenciales']);

        // Gestión de direcciones
        Route::get('{cliente}/direcciones', [DireccionClienteApiController::class, 'index']);
        Route::post('{cliente}/direcciones', [DireccionClienteApiController::class, 'store']);
        Route::put('{cliente}/direcciones/{direccion}', [DireccionClienteApiController::class, 'update']);

        // Gestión de fotos de lugar
        Route::get('{cliente}/fotos', [\App\Http\Controllers\FotoLugarClienteController::class, 'index']);
        Route::post('{cliente}/fotos', [\App\Http\Controllers\FotoLugarClienteController::class, 'store']);
        Route::post('{cliente}/fotos/multiple', [\App\Http\Controllers\FotoLugarClienteController::class, 'uploadMultiple']);
        Route::get('{cliente}/fotos/{foto}', [\App\Http\Controllers\FotoLugarClienteController::class, 'show']);
        Route::put('{cliente}/fotos/{foto}', [\App\Http\Controllers\FotoLugarClienteController::class, 'update']);
        Route::delete('{cliente}/fotos/{foto}', [\App\Http\Controllers\FotoLugarClienteController::class, 'destroy']);
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

// ==========================================
// 📦 RUTAS API PARA LOGÍSTICA
// ==========================================

// RUTAS - Planificación y gestión
Route::middleware(['auth:sanctum', 'platform'])->group(function () {
    Route::prefix('rutas')->group(function () {
        Route::get('/', [\App\Http\Controllers\Api\RutaApiController::class, 'index']);
        Route::post('/planificar', [\App\Http\Controllers\Api\RutaApiController::class, 'planificar']);
        Route::get('/{ruta}', [\App\Http\Controllers\Api\RutaApiController::class, 'show']);
        Route::patch('/{ruta}/estado', [\App\Http\Controllers\Api\RutaApiController::class, 'actualizarEstado']);
        Route::get('/{ruta}/detalles', [\App\Http\Controllers\Api\RutaApiController::class, 'obtenerDetalles']);
        Route::post('/{ruta}/detalles/{detalle}/completar', [\App\Http\Controllers\Api\RutaApiController::class, 'completarDetalle']);
    });
});

// CHOFER - Entregas y tracking
Route::middleware(['auth:sanctum', 'platform'])->group(function () {
    Route::prefix('chofer')->group(function () {
        // Nuevo endpoint que combina entregas + envios
        Route::get('/trabajos', [EntregaController::class, 'misTrabjos']);

        // Endpoints legacy (mantener para compatibilidad)
        Route::get('/entregas', [EntregaController::class, 'entregasAsignadas']);
        Route::get('/entregas/{id}', [EntregaController::class, 'showEntrega']);
        Route::post('/entregas/{id}/iniciar-ruta', [EntregaController::class, 'iniciarRuta']);
        Route::post('/entregas/{id}/actualizar-estado', [EntregaController::class, 'actualizarEstado']);
        Route::post('/entregas/{id}/marcar-llegada', [EntregaController::class, 'marcarLlegada']);
        Route::post('/entregas/{id}/confirmar-entrega', [EntregaController::class, 'confirmarEntrega']);
        Route::post('/entregas/{id}/reportar-novedad', [EntregaController::class, 'reportarNovedad']);
        Route::post('/entregas/{id}/ubicacion', [EntregaController::class, 'registrarUbicacion']);
        Route::get('/historial', [EntregaController::class, 'historialEntregas']);
    });

    // CLIENTE - Tracking de pedidos
    Route::prefix('cliente')->group(function () {
        Route::get('/pedidos/{proformaId}/tracking', [EntregaController::class, 'obtenerTracking']);
    });

    // TRACKING - Información de ubicación y ETA
    Route::prefix('tracking')->group(function () {
        Route::get('/entregas/{id}/ubicaciones', [TrackingController::class, 'obtenerUbicaciones']);
        Route::get('/entregas/{id}/ultima-ubicacion', [TrackingController::class, 'ultimaUbicacion']);
        Route::post('/entregas/{id}/calcular-eta', [TrackingController::class, 'calcularETA']);
    });

    // ENCARGADO - Gestión de entregas
    Route::prefix('encargado')->group(function () {
        Route::get('/dashboard', [EncargadoController::class, 'dashboard']);
        Route::get('/dashboard/stats', [EncargadoController::class, 'dashboard']); // Alias para obtener estadísticas

        // ✅ Entregas (mantener en EncargadoController - lógica específica)
        Route::get('/entregas/asignadas', [EncargadoController::class, 'entregasAsignadas']);
        Route::post('/entregas/{id}/procesar-carga', [EncargadoController::class, 'procesarCargaVehiculo']);
        Route::get('/entregas', [EncargadoController::class, 'indexAdmin']);
        Route::post('/entregas/{id}/asignar', [EncargadoController::class, 'asignarEntrega']);
        Route::get('/entregas/activas', [EncargadoController::class, 'entregasActivas']);
    });

    // RECURSOS - Vehículos y Choferes disponibles
    Route::prefix('recursos')->group(function () {
        Route::get('/vehiculos/disponibles', [EnvioController::class, 'obtenerVehiculosDisponibles']);
        Route::get('/choferes/disponibles', [EnvioController::class, 'obtenerChoferesDisponibles']);
    });

    // Alias sin prefijo para compatibilidad con service
    Route::get('/vehiculos/disponibles', [EnvioController::class, 'obtenerVehiculosDisponibles']);
    Route::get('/choferes/disponibles', [EnvioController::class, 'obtenerChoferesDisponibles']);

    // ADMIN - Gestión completa de entregas
    Route::prefix('admin')->group(function () {
        Route::get('/entregas', [EntregaController::class, 'indexAdmin']);
        Route::post('/entregas/{id}/asignar', [EntregaController::class, 'asignarEntrega']);
        Route::get('/entregas/activas', [EntregaController::class, 'entregasActivas']);
    });
});

// Rutas API para proveedores
Route::group(['prefix' => 'proveedores'], function () {
    Route::post('/', [ProveedorController::class, 'storeApi']);
    Route::get('buscar', [ProveedorController::class, 'buscarApi']);
});

// ==========================================
// 🖼️ RUTAS API PARA BACKUP DE IMÁGENES
// ==========================================
Route::middleware(['auth:sanctum,web', 'platform'])->group(function () {
    Route::prefix('image-backup')->group(function () {
        // ========== BACKUPS COMPLETOS ==========
        // Crear backup (completo o selectivo)
        Route::post('/create', [ImageBackupController::class, 'createBackup']);

        // Restaurar backup completo
        Route::post('/restore', [ImageBackupController::class, 'restoreBackup']);

        // Listar backups disponibles (DEBE ser antes que /{backupName})
        Route::get('/list', [ImageBackupController::class, 'listBackups']);

        // Descargar un backup (DEBE ser antes que /{backupName})
        Route::get('/{backupName}/download', [ImageBackupController::class, 'downloadBackup']);

        // ========== BACKUPS POR CARPETA ==========
        // Obtener tamaños de carpetas
        Route::get('/folder/sizes', [ImageBackupController::class, 'getFolderSizes']);

        // Crear backup de una carpeta específica
        Route::post('/folder/backup', [ImageBackupController::class, 'createFolderBackup']);

        // Descargar backup de una carpeta (crea uno temporal)
        Route::post('/folder/download', [ImageBackupController::class, 'downloadFolderBackup']);

        // Restaurar una carpeta desde un backup
        Route::post('/folder/restore', [ImageBackupController::class, 'restoreFolderBackup']);

        // ========== SUBIR ARCHIVOS ==========
        // Subir un archivo ZIP de backup (método antiguo, para compatibilidad)
        Route::post('/upload', [ImageBackupController::class, 'uploadBackup']);

        // ========== SUBIDA POR PARTES (CHUNKED UPLOAD) ==========
        // Obtener información del espacio en disco
        Route::get('/disk-space', [ImageBackupController::class, 'getDiskSpace']);

        // Iniciar subida por partes
        Route::post('/chunked/start', [ImageBackupController::class, 'startChunkedUpload']);

        // Subir un chunk
        Route::post('/chunked/upload', [ImageBackupController::class, 'uploadChunk']);

        // Finalizar subida y ensamblar
        Route::post('/chunked/finish', [ImageBackupController::class, 'finishChunkedUpload']);

        // Obtener estado de upload
        Route::get('/chunked/status', [ImageBackupController::class, 'getChunkedUploadStatus']);

        // Cancelar upload
        Route::post('/chunked/cancel', [ImageBackupController::class, 'cancelChunkedUpload']);

        // ========== RUTAS CON PARÁMETROS (DEBEN IR AL FINAL) ==========
        // Obtener información de un backup específico (GET)
        Route::get('/{backupName}', [ImageBackupController::class, 'getBackupInfo']);

        // Eliminar un backup (DELETE)
        Route::delete('/{backupName}', [ImageBackupController::class, 'deleteBackup']);
    });
});

// ✅ Rutas API de auditoría de cajas (Sprint 4)
Route::middleware(['auth', 'permission:admin.auditoria'])->prefix('cajas/auditoria')->group(function () {
    Route::get('/estadisticas', [\App\Http\Controllers\AuditoriaCajaController::class, 'estadisticas'])->name('api.cajas.auditoria.estadisticas');
});
