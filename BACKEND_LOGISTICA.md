# 🏢 ARQUITECTURA BACKEND - MÓDULO LOGÍSTICA

**Versión:** 2.0
**Fecha de actualización:** 31 de Octubre de 2025
**Plataforma:** Laravel 10+ / PHP
**Gestor:** Gestor de Backend
**Estado:** ⚠️ Parcialmente implementado

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Modelos de Datos](#modelos-de-datos)
3. [Migraciones Necesarias](#migraciones-necesarias)
4. [Controladores API](#controladores-api)
5. [Eventos y Broadcasting](#eventos-y-broadcasting)
6. [Servicios de Negocio](#servicios-de-negocio)
7. [Rutas API](#rutas-api)
8. [Seguridad y Autorización](#seguridad-y-autorización)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## 1. VISIÓN GENERAL

### 1.1 Responsabilidades del Backend

El backend gestiona el **flujo completo de logística** para:

1. **Clientes (Flutter):**
   - Crear proformas/pedidos
   - Ver historial de pedidos
   - Tracking en tiempo real
   - Notificaciones de estado

2. **Choferes (Flutter):**
   - Ver entregas asignadas
   - Actualizar estado de entrega
   - Enviar ubicación GPS
   - Confirmar entregas con firma

3. **Encargados (React):**
   - Aprobar/rechazar proformas
   - Asignar chofer y vehículo
   - Procesar carga al vehículo
   - Verificar llegadas de entregas
   - Dashboard de logística

### 1.2 Estado Actual (Octubre 31, 2025)

✅ **IMPLEMENTADO:**
- Model `Proforma` (completo con muchos métodos)
- Model `Chofer` (básico)
- Model `DetalleProforma`
- Model `ReservaProforma`
- Controller `ProformaController` (para web)
- API Controller `ApiProformaController` (para Flutter) - 59KB
- 8 migraciones de logística
- Estados de proforma: PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA, VENCIDA

❌ **FALTA IMPLEMENTAR:**
- Model `Entrega` (CRÍTICO)
- Model `UbicacionTracking` (CRÍTICO)
- Model `Ruta` (importante)
- Controller de `Entregas` (CRÍTICO)
- Controller de `Tracking` (CRÍTICO)
- Eventos de Broadcasting (importante)
- Endpoints para chofer (CRÍTICO)
- Endpoints para encargado (CRÍTICO)

---

## 2. MODELOS DE DATOS

### 2.1 Modelos Existentes

#### Proforma Model ✅
```php
// app/Models/Proforma.php

class Proforma extends Model {
    // Relaciones
    - belongsTo(Client)
    - belongsTo(User, 'usuario_creador_id')
    - belongsTo(User, 'usuario_aprobador_id')
    - belongsTo(Moneda)
    - hasMany(DetalleProforma)
    - hasOne(Venta)
    - hasMany(ReservaProforma)
    - hasMany(PedidoEstadoHistorial)

    // Estados
    - PENDIENTE
    - APROBADA
    - RECHAZADA
    - CONVERTIDA
    - VENCIDA

    // Métodos importantes
    - aprobar(User, observaciones)
    - rechazar(User, motivo)
    - marcarComoConvertida()
    - reservarStock()
    - liberarReservas()
    - consumirReservas()
    - extenderReservas(horas)
    - verificarDisponibilidadStock()
    - esDeAppExterna()
    - puedeAprobarse()
    - puedeRechazarse()
    - estaVencida()
}
```

**Campos principales:**
```
- id, numero (PRO-20251031-001)
- cliente_id, usuario_creador_id, usuario_aprobador_id
- estado (enum: PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA, VENCIDA)
- subtotal, impuesto, total
- observaciones
- canal_origen (APP_EXTERNA, CALL_CENTER, etc.)
- fecha_creacion, fecha_aprobacion, fecha_vencimiento
- metadata (JSON para datos adicionales)
```

#### Chofer Model ✅
```php
// app/Models/Chofer.php

class Chofer extends Model {
    - belongsTo(User)
    - hasMany(Entrega) // RELACIÓN PENDIENTE: Modelo falta

    // Campos
    - id, user_id
    - nombres, apellidos
    - ci, telefono
    - licencia_conducir, categoria_licencia
    - fecha_vencimiento_licencia
    - foto_url
    - activo (bool)
    - fecha_contratacion
}
```

#### DetalleProforma Model ✅
```php
// app/Models/DetalleProforma.php

class DetalleProforma {
    - proforma_id, producto_id
    - cantidad, precio_unitario
    - subtotal, observaciones
}
```

#### ReservaProforma Model ✅
```php
// app/Models/ReservaProforma.php

class ReservaProforma {
    - proforma_id, producto_id
    - cantidad
    - estado (ACTIVA, CONFIRMADA, LIBERADA, VENCIDA)
    - fecha_creacion, fecha_expiracion, fecha_liberacion
}
```

### 2.2 Modelos Faltantes (CRÍTICOS)

#### Entrega Model ❌ CREAR

```php
// app/Models/Entrega.php

class Entrega extends Model {
    // Relaciones
    protected $fillable = ['proforma_id', 'chofer_id', 'camion_id', 'estado'];

    public function proforma(): BelongsTo {
        return $this->belongsTo(Proforma::class);
    }

    public function chofer(): BelongsTo {
        return $this->belongsTo(Chofer::class);
    }

    public function camion(): BelongsTo {
        return $this->belongsTo(Camion::class); // PENDIENTE: Crear modelo Camion
    }

    public function direccionEntrega(): BelongsTo {
        return $this->belongsTo(ClientAddress::class, 'direccion_entrega_id');
    }

    public function ubicaciones(): HasMany {
        return $this->hasMany(UbicacionTracking::class);
    }

    public function historialEstados(): HasMany {
        return $this->hasMany(EntregaEstadoHistorial::class);
    }

    // Estados
    const ESTADO_ASIGNADA = 'ASIGNADA';
    const ESTADO_EN_CAMINO = 'EN_CAMINO';
    const ESTADO_LLEGO = 'LLEGO';
    const ESTADO_ENTREGADO = 'ENTREGADO';
    const ESTADO_NOVEDAD = 'NOVEDAD';
    const ESTADO_CANCELADA = 'CANCELADA';

    // Campos en tabla
    - id
    - proforma_id (FK)
    - chofer_id (FK, nullable)
    - camion_id (FK, nullable)
    - direccion_entrega_id (FK)
    - estado (enum: ASIGNADA, EN_CAMINO, LLEGO, ENTREGADO, NOVEDAD, CANCELADA)
    - fecha_asignacion, fecha_inicio, fecha_llegada, fecha_entrega
    - observaciones, motivo_novedad
    - firma_digital_url, foto_entrega_url
    - fecha_firma_entrega
    - created_at, updated_at
}
```

#### UbicacionTracking Model ❌ CREAR

```php
// app/Models/UbicacionTracking.php

class UbicacionTracking extends Model {
    // Relaciones
    public function entrega(): BelongsTo {
        return $this->belongsTo(Entrega::class);
    }

    public function chofer(): BelongsTo {
        return $this->belongsTo(Chofer::class, 'chofer_id');
    }

    // Campos
    - id
    - entrega_id (FK)
    - chofer_id (FK, nullable)
    - latitud, longitud
    - altitud (nullable), precision (nullable)
    - velocidad (nullable, km/h), rumbo (nullable, grados)
    - timestamp (datetime)
    - evento (enum: null, 'inicio_ruta', 'llegada', 'entrega')
    - created_at, updated_at
}
```

#### Camion Model ✅ EXISTS (Verificar)

```php
// app/Models/Camion.php

class Camion extends Model {
    - id, placa (UNIQUE)
    - marca, modelo, anio
    - color, capacidad_kg, capacidad_m3
    - foto_url
    - activo (bool)
    - fecha_revision_tecnica
    - observaciones
}
```

#### EntregaEstadoHistorial Model ❌ CREAR

```php
// app/Models/EntregaEstadoHistorial.php

class EntregaEstadoHistorial extends Model {
    - entrega_id, usuario_id
    - estado_anterior, estado_nuevo
    - comentario, metadata (JSON)
    - timestamp
}
```

---

## 3. MIGRACIONES NECESARIAS

### 3.1 Migraciones Existentes ✅

```
2025_09_09_025449_create_proformas_table
2025_09_09_042239_create_detalle_proformas_table
2025_09_11_062602_create_chofers_table
2025_09_11_190529_create_reservas_proforma_table
2025_09_24_160000_create_ventanas_entrega_cliente_table
2025_09_24_160100_add_hora_entrega_requerida_to_pedidos_table
2025_10_13_173500_add_chofer_fields_to_empleados_table
2025_10_13_174500_rename_choferes_table
```

### 3.2 Migraciones Faltantes ❌ CREAR

```bash
php artisan make:migration create_entregas_table
php artisan make:migration create_ubicaciones_tracking_table
php artisan make:migration create_entrega_estado_historial_table
php artisan make:migration create_camiones_table (si no existe)
```

**Schema para tabla `entregas`:**

```php
Schema::create('entregas', function (Blueprint $table) {
    $table->id();
    $table->foreignId('proforma_id')->constrained('proformas');
    $table->foreignId('chofer_id')->nullable()->constrained('choferes');
    $table->foreignId('camion_id')->nullable()->constrained('camiones');
    $table->foreignId('direccion_entrega_id')->nullable()->constrained('client_addresses');

    $table->enum('estado', [
        'ASIGNADA',
        'EN_CAMINO',
        'LLEGO',
        'ENTREGADO',
        'NOVEDAD',
        'CANCELADA'
    ])->default('ASIGNADA');

    $table->timestamp('fecha_asignacion')->nullable();
    $table->timestamp('fecha_inicio')->nullable();      // Cuando chofer inicia ruta
    $table->timestamp('fecha_llegada')->nullable();     // Cuando chofer llega
    $table->timestamp('fecha_entrega')->nullable();     // Cuando se entrega

    $table->text('observaciones')->nullable();
    $table->string('motivo_novedad')->nullable();

    // Comprobantes
    $table->string('firma_digital_url')->nullable();
    $table->string('foto_entrega_url')->nullable();
    $table->timestamp('fecha_firma_entrega')->nullable();

    $table->timestamps();

    // Índices para performance
    $table->index('estado');
    $table->index('chofer_id');
    $table->index('fecha_asignacion');
});
```

**Schema para tabla `ubicaciones_tracking`:**

```php
Schema::create('ubicaciones_tracking', function (Blueprint $table) {
    $table->id();
    $table->foreignId('entrega_id')->constrained('entregas')->onDelete('cascade');
    $table->foreignId('chofer_id')->nullable()->constrained('choferes');

    $table->decimal('latitud', 10, 7);
    $table->decimal('longitud', 10, 7);
    $table->decimal('altitud', 8, 2)->nullable();
    $table->decimal('precision', 8, 2)->nullable();    // metros
    $table->decimal('velocidad', 6, 2)->nullable();    // km/h
    $table->decimal('rumbo', 6, 2)->nullable();        // grados

    $table->timestamp('timestamp');
    $table->enum('evento', ['inicio_ruta', 'llegada', 'entrega'])->nullable();

    $table->timestamps();

    // Índices
    $table->index('entrega_id');
    $table->index('timestamp');
});
```

---

## 4. CONTROLADORES API

### 4.1 Controladores Existentes ✅

- **ApiProformaController** (59KB) - Muy completo
  - `store()` - Crear proforma desde app
  - `index()` - Listar proformas
  - `show()` - Detalle de proforma
  - `aprobar()` - Aprobar proforma
  - `rechazar()` - Rechazar proforma
  - `convertirAVenta()` - Convertir a venta
  - `verificarStock()` - Verificar disponibilidad
  - `extenderReservas()` - Extender reserva
  - `crearPedidoDesdeApp()` - Crear pedido desde Flutter
  - `obtenerHistorialPedidos()` - Historial del cliente
  - `obtenerDetallePedido()` - Detalle de pedido
  - `obtenerEstadoPedido()` - Solo estado (lightweight)
  - `listarParaDashboard()` - Para React admin

### 4.2 Controladores Faltantes ❌ CREAR

#### EntregaController

```php
// app/Http/Controllers/Api/EntregaController.php

class EntregaController extends Controller {

    // PARA CHOFER (Flutter)

    /** GET /api/chofer/entregas */
    public function entrerasAsignadas(Request $request) {
        // Entregas del chofer autenticado
        // Filtrar por: estado, fecha
        // Retornar con: cliente, dirección, productos, total
    }

    /** GET /api/chofer/entregas/{id} */
    public function showEntrega(Entrega $entrega) {
        // Detalle completo de entrega
        // Incluir: cliente, dirección, productos, camión
    }

    /** POST /api/chofer/entregas/{id}/iniciar-ruta */
    public function iniciarRuta(Entrega $entrega) {
        // Marcar entrega como EN_CAMINO
        // Iniciar tracking GPS
        // Disparar evento UbicacionActualizada
    }

    /** POST /api/chofer/entregas/{id}/actualizar-estado */
    public function actualizarEstado(Request $request, Entrega $entrega) {
        // Actualizar estado: EN_CAMINO, LLEGO, ENTREGADO, NOVEDAD
        // Validar transiciones de estado
        // Disparar eventos de broadcast
    }

    /** POST /api/chofer/entregas/{id}/marcar-llegada */
    public function marcarLlegada(Entrega $entrega) {
        // Cambiar a LLEGO
    }

    /** POST /api/chofer/entregas/{id}/confirmar-entrega */
    public function confirmarEntrega(Request $request, Entrega $entrega) {
        // Firma + fotos
        // Cambiar a ENTREGADO
        // Guardar comprobantes
    }

    /** POST /api/chofer/entregas/{id}/reportar-novedad */
    public function reportarNovedad(Request $request, Entrega $entrega) {
        // Cambiar a NOVEDAD
        // Guardar motivo
        // Notificar admin
    }

    /** POST /api/chofer/entregas/{id}/ubicacion */
    public function registrarUbicacion(Request $request, Entrega $entrega) {
        // Recibir: lat, lng, velocidad, rumbo, etc.
        // Guardar en UbicacionTracking
        // Disparar evento broadcast
    }

    /** GET /api/chofer/historial */
    public function historialEntregas(Request $request) {
        // Entregas completadas del chofer
    }

    // PARA CLIENTE (Flutter)

    /** GET /api/cliente/pedidos/{id}/tracking */
    public function obtenerTracking(Proforma $proforma) {
        // Entrega asociada, ubicación actual, ETA
    }

    // PARA ADMIN (React)

    /** GET /api/admin/entregas */
    public function indexAdmin(Request $request) {
        // Todas las entregas
        // Filtros: estado, chofer, cliente, fecha
    }

    /** POST /api/admin/entregas/{id}/asignar */
    public function asignarEntrega(Request $request, Entrega $entrega) {
        // Asignar chofer y camión
    }

    /** GET /api/admin/entregas/activas */
    public function entregasActivas() {
        // Entregas en ruta (para mapa)
        // Incluir ubicación actual
    }
}
```

#### TrackingController

```php
// app/Http/Controllers/Api/TrackingController.php

class TrackingController extends Controller {

    /** GET /api/tracking/entregas/{id}/ubicaciones */
    public function obtenerUbicaciones(Entrega $entrega) {
        // Retornar últimas N ubicaciones
    }

    /** GET /api/tracking/entregas/{id}/ultima-ubicacion */
    public function ultimaUbicacion(Entrega $entrega) {
        // Ubicación más reciente
    }

    /** POST /api/tracking/entregas/{id}/calcular-eta */
    public function calcularETA(Request $request, Entrega $entrega) {
        // Recibir: lat_destino, lng_destino
        // Retornar: distancia, tiempo estimado
        // Usar Google Maps API o similar
    }
}
```

#### EncargadoController (Nuevo)

```php
// app/Http/Controllers/Api/EncargadoController.php

class EncargadoController extends Controller {

    /** GET /api/encargado/proformas/pendientes */
    public function proformasPendientes() {
        // Proformas esperando aprobación
    }

    /** POST /api/encargado/proformas/{id}/aprobar */
    public function aprobarProforma(Request $request, Proforma $proforma) {
        // Validar stock
        // Aprobar y crear reserva
    }

    /** POST /api/encargado/proformas/{id}/rechazar */
    public function rechazarProforma(Request $request, Proforma $proforma) {
        // Rechazar con motivo
    }

    /** GET /api/encargado/entregas/asignadas */
    public function entregasAsignadas() {
        // Entregas listas para procesar
    }

    /** POST /api/encargado/entregas/{id}/procesar-carga */
    public function procesarCargaVehiculo(Request $request, Entrega $entrega) {
        // Marcar como PREPARANDO -> EN_CAMION
        // Validar camión y chofer
    }

    /** GET /api/encargado/dashboard */
    public function dashboard() {
        // Estadísticas para React
        - proformas_pendientes_count
        - entregas_en_preparacion_count
        - entregas_en_transito_count
        - entregas_entregadas_hoy_count
    }
}
```

---

## 5. EVENTOS Y BROADCASTING

### 5.1 Eventos a Implementar ❌

Estos eventos disparan notificaciones en tiempo real vía WebSocket.

```php
// app/Events/

// 1. ProformaAprobada
Event::dispatch(new ProformaAprobada($proforma, $usuario));
// Canales: pedido.{proforma_id}, admin.pedidos
// Datos: número de proforma, estado, observaciones

// 2. ProformaRechazada
Event::dispatch(new ProformaRechazada($proforma, $motivo));
// Canales: pedido.{proforma_id}
// Datos: número de proforma, motivo

// 3. EntregaAsignada
Event::dispatch(new EntregaAsignada($entrega));
// Canales: entrega.{entrega_id}, chofer.{chofer_id}
// Datos: chofer, camión, dirección, cliente

// 4. ChoferEnCamino
Event::dispatch(new ChoferEnCamino($entrega));
// Canales: pedido.{proforma_id}
// Datos: nombre chofer, placa, ETA

// 5. UbicacionActualizada
Event::dispatch(new UbicacionActualizada($ubicacion));
// Canales: entrega.{entrega_id}
// Datos: latitud, longitud, velocidad, ETA actualizado

// 6. ChoferLlego
Event::dispatch(new ChoferLlego($entrega));
// Canales: pedido.{proforma_id}

// 7. PedidoEntregado
Event::dispatch(new PedidoEntregado($entrega));
// Canales: pedido.{proforma_id}, admin.pedidos
// Datos: firma, fotos, observaciones

// 8. NovedadReportada
Event::dispatch(new NovedadReportada($entrega, $motivo));
// Canales: pedido.{proforma_id}, admin.pedidos
// Datos: motivo, descripción, fotos
```

### 5.2 Configuración de Channels

```php
// routes/channels.php

// Canales privados autenticados
Broadcast::channel('pedido.{proformaId}', function ($user, $proformaId) {
    // Usuario es cliente de la proforma
    return Auth::check() && $user->id === Proforma::find($proformaId)->cliente_id;
});

Broadcast::channel('entrega.{entregaId}', function ($user, $entregaId) {
    // Usuario es cliente o chofer
    $entrega = Entrega::find($entregaId);
    return Auth::check() && (
        $user->id === $entrega->proforma->cliente_id ||
        $user->id === $entrega->chofer->user_id
    );
});

Broadcast::channel('chofer.{choferId}', function ($user, $choferId) {
    // Usuario es el chofer
    $chofer = Chofer::find($choferId);
    return Auth::check() && $user->id === $chofer->user_id;
});

Broadcast::channel('admin.pedidos', function ($user) {
    // Usuario es admin/encargado
    return Auth::check() && $user->hasRole(['admin', 'encargado']);
});
```

---

## 6. SERVICIOS DE NEGOCIO

### 6.1 EntregaService (Crear)

```php
// app/Services/EntregaService.php

class EntregaService {

    public function crearEntregaDesdeProforma(
        Proforma $proforma,
        Chofer $chofer,
        Camion $camion,
        ClientAddress $direccion,
        ?Carbon $fechaProgramada = null
    ): Entrega {
        // Crear entrega
        // Reservar stock
        // Disparar evento EntregaCreada
    }

    public function asignarChoferYCamion(
        Entrega $entrega,
        Chofer $chofer,
        Camion $camion
    ): void {
        // Asignar chofer y camión
        // Cambiar estado a ASIGNADA
        // Disparar evento EntregaAsignada
    }

    public function actualizarEstado(
        Entrega $entrega,
        string $nuevoEstado,
        ?User $usuario = null
    ): void {
        // Validar transición de estado
        // Guardar en historial
        // Disparar evento correspondiente
    }

    public function confirmarEntrega(
        Entrega $entrega,
        string $firmaBase64,
        array $fotosBase64 = [],
        ?string $observaciones = null
    ): void {
        // Guardar firma y fotos
        // Marcar como ENTREGADO
        // Consumir reservas
        // Disparar evento PedidoEntregado
    }
}
```

### 6.2 UbicacionService (Crear)

```php
// app/Services/UbicacionService.php

class UbicacionService {

    public function registrarUbicacion(
        Entrega $entrega,
        float $latitud,
        float $longitud,
        array $datosAdicionales = []
    ): UbicacionTracking {
        // Crear registro
        // Disparar evento UbicacionActualizada
        // Retornar ubicación creada
    }

    public function calcularETA(
        Entrega $entrega,
        float $latDestino,
        float $lngDestino
    ): array {
        // Usar Google Maps Distance Matrix API
        // Retornar: distancia_metros, tiempo_minutos
    }

    public function obtenerRutaReciente(Entrega $entrega, int $limitar = 50): Collection {
        // Últimas N ubicaciones de la entrega
    }
}
```

---

## 7. RUTAS API

### 7.1 Rutas Existentes (Verificar)

```php
// routes/api.php

// De ApiProformaController (actualmente funcionando)
POST   /api/app/pedidos                           → store()
GET    /api/app/cliente/pedidos                   → obtenerHistorialPedidos()
GET    /api/app/pedidos/{id}                      → obtenerDetallePedido()
GET    /api/app/pedidos/{id}/estado               → obtenerEstadoPedido()
GET    /api/app/productos                         → obtenerProductosDisponibles()
POST   /api/app/verificar-stock                   → verificarStock()
POST   /api/app/pedidos/{id}/extender-reservas   → extenderReservas()
GET    /api/admin/proformas                       → listarParaDashboard() (para React admin)
POST   /api/admin/proformas/{id}/aprobar          → aprobar()
POST   /api/admin/proformas/{id}/rechazar         → rechazar()
```

### 7.2 Rutas Faltantes ❌ CREAR

```php
// routes/api.php

// CHOFER (Entregas)
Route::middleware(['auth:sanctum', 'role:chofer'])->prefix('chofer')->group(function () {
    GET    /api/chofer/entregas                    → EntregaController@entregasAsignadas
    GET    /api/chofer/entregas/{id}               → EntregaController@showEntrega
    POST   /api/chofer/entregas/{id}/iniciar-ruta → EntregaController@iniciarRuta
    POST   /api/chofer/entregas/{id}/actualizar-estado → EntregaController@actualizarEstado
    POST   /api/chofer/entregas/{id}/marcar-llegada → EntregaController@marcarLlegada
    POST   /api/chofer/entregas/{id}/confirmar-entrega → EntregaController@confirmarEntrega
    POST   /api/chofer/entregas/{id}/reportar-novedad → EntregaController@reportarNovedad
    POST   /api/chofer/entregas/{id}/ubicacion    → EntregaController@registrarUbicacion
    GET    /api/chofer/historial                  → EntregaController@historialEntregas
});

// CLIENTE (Tracking)
Route::middleware(['auth:sanctum', 'role:cliente'])->group(function () {
    GET    /api/cliente/pedidos/{id}/tracking     → EntregaController@obtenerTracking
});

// TRACKING (Público pero autenticado)
Route::middleware(['auth:sanctum'])->prefix('tracking')->group(function () {
    GET    /api/tracking/entregas/{id}/ubicaciones → TrackingController@obtenerUbicaciones
    GET    /api/tracking/entregas/{id}/ultima-ubicacion → TrackingController@ultimaUbicacion
    POST   /api/tracking/entregas/{id}/calcular-eta → TrackingController@calcularETA
});

// ENCARGADO (React Admin)
Route::middleware(['auth:sanctum', 'role:encargado|admin'])->prefix('encargado')->group(function () {
    GET    /api/encargado/dashboard                → EncargadoController@dashboard
    GET    /api/encargado/proformas/pendientes     → EncargadoController@proformasPendientes
    POST   /api/encargado/proformas/{id}/aprobar   → EncargadoController@aprobarProforma
    POST   /api/encargado/proformas/{id}/rechazar  → EncargadoController@rechazarProforma
    GET    /api/encargado/entregas/asignadas      → EncargadoController@entregasAsignadas
    POST   /api/encargado/entregas/{id}/procesar-carga → EncargadoController@procesarCargaVehiculo
    GET    /api/encargado/entregas                 → EncargadoController@indexAdmin
    POST   /api/encargado/entregas/{id}/asignar    → EncargadoController@asignarEntrega
    GET    /api/encargado/entregas/activas         → EncargadoController@entregasActivas
});
```

---

## 8. SEGURIDAD Y AUTORIZACIÓN

### 8.1 Políticas (Policies)

```php
// app/Policies/EntregaPolicy.php

class EntregaPolicy {

    public function view(User $user, Entrega $entrega): bool {
        return $user->id === $entrega->proforma->cliente_id ||     // Cliente
               $user->id === $entrega->chofer->user_id ||          // Chofer
               $user->hasRole(['admin', 'encargado']);             // Admin/Encargado
    }

    public function update(User $user, Entrega $entrega): bool {
        return $user->id === $entrega->chofer->user_id ||          // Solo chofer puede actualizar
               $user->hasRole('encargado');                         // O encargado
    }

    public function registrarUbicacion(User $user, Entrega $entrega): bool {
        return $user->id === $entrega->chofer->user_id;            // Solo chofer
    }
}
```

### 8.2 Rate Limiting

```php
// Registrar ubicaciones: máximo cada 10 segundos
RateLimiter::for('tracking', function (Request $request) {
    return Limit::perMinute(6)->by($request->user()->id);
});
```

---

## 9. CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: MODELOS Y MIGRACIONES

- [ ] Crear Model `Entrega`
- [ ] Crear Model `UbicacionTracking`
- [ ] Crear Model `EntregaEstadoHistorial`
- [ ] Verificar/Crear Model `Camion`
- [ ] Crear Migration `create_entregas_table`
- [ ] Crear Migration `create_ubicaciones_tracking_table`
- [ ] Crear Migration `create_entrega_estado_historial_table`
- [ ] Crear Migration `create_camiones_table` (si falta)
- [ ] Ejecutar migraciones
- [ ] Crear relaciones en todos los modelos

### FASE 2: CONTROLADORES Y RUTAS

- [ ] Crear `EntregaController` (API)
- [ ] Crear `TrackingController`
- [ ] Crear `EncargadoController`
- [ ] Registrar todas las rutas en `routes/api.php`
- [ ] Agregar middleware de autenticación y autorización
- [ ] Testing básico de endpoints

### FASE 3: SERVICIOS Y LÓGICA DE NEGOCIO

- [ ] Crear `EntregaService`
- [ ] Crear `UbicacionService`
- [ ] Implementar validaciones de estado
- [ ] Implementar cálculo de ETA
- [ ] Testing de servicios

### FASE 4: EVENTOS Y BROADCASTING

- [ ] Crear eventos: ProformaAprobada, ProformaRechazada, etc. (8 eventos)
- [ ] Configurar Broadcasting en `config/broadcasting.php`
- [ ] Definir canales en `routes/channels.php`
- [ ] Disparar eventos en controladores
- [ ] Testing de broadcasting

### FASE 5: NOTIFICACIONES

- [ ] Integrar Firebase Cloud Messaging (FCM)
- [ ] Crear `NotificationService`
- [ ] Guardar FCM tokens en BD
- [ ] Enviar notificaciones push en eventos importantes
- [ ] Testing de notificaciones

### FASE 6: TESTING Y DOCUMENTACIÓN

- [ ] Tests unitarios para modelos
- [ ] Tests de API (Feature tests)
- [ ] Tests de autenticación y autorización
- [ ] Documentación de API (Swagger/OpenAPI)
- [ ] Tests de performance
- [ ] Tests en staging

---

## 10. CONSIDERACIONES TÉCNICAS

### 10.1 Performance

- Usar `eager loading` para relaciones (with)
- Paginar resultados largos
- Indexar columnas de búsqueda y filtrado
- Cache de ubicaciones geográficas
- Usar websocket para cambios en tiempo real (no polling)

### 10.2 Validaciones

- Validar transiciones de estado permitidas
- Validar permisos antes de actualizar
- Validar datos GPS (rango válido de coordenadas)
- Validar tokens JWT
- Validar integridad de firmas digitales

### 10.3 Manejo de Errores

- Retornar HTTP 404 si recurso no existe
- Retornar HTTP 403 si sin autorización
- Retornar HTTP 422 si validación falla
- Logs detallados para debugging
- Reportar a Sentry en producción

---

## 11. PRÓXIMOS PASOS

**Antes de que Frontend comience:**

1. ✅ Backend debe tener TODOS los modelos creados
2. ✅ Backend debe tener TODOS los endpoints implementados
3. ✅ Backend debe tener eventos de broadcasting funcionando
4. ✅ WebSocket debe estar escuchando y broadcast debe estar funcionando
5. ✅ Testing básico de endpoints
6. ✅ Documentación de API (qué espera cada endpoint, qué retorna)

**Responsable Backend:**
- Implementar checklist completo
- Proporcionar documentación de endpoints
- Proporcionar ejemplos de requests/responses
- Asegurar que WebSocket está funcionando
- Testing de todos los endpoints

---

**Versión:** 2.0
**Última actualización:** 31 de Octubre de 2025
**Siguiente revisión:** Cuando todos los controladores estén implementados
