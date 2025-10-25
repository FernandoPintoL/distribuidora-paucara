# 📱 SISTEMA DE VENTAS CON APP EXTERNA Y LOGÍSTICA

## ✅ ESTADO DE IMPLEMENTACIÓN (Actualizado 2025-10-25 - VERIFICADO)

### 🔍 NOTAS IMPORTANTES

**Sistema de Pagos:**
- ✅ Tabla `pagos` YA EXISTE (migración de 2025-09-09)
- ✅ Modelo `Pago` YA EXISTE
- ⚠️ Parcialmente implementado (enfocado en CuentaPorPagar)
- ❌ Requiere extensión para Ventas desde App Flutter

**Notificaciones:**
- ✅ WebSocket funcional (para app abierta)
- ⏭️ FCM: NO será implementado (usando solo WebSocket)

---

## ✅ ESTADO DE IMPLEMENTACIÓN DETALLADO

### Integración WebSocket - Estado Actual

| Componente | Estado | Detalles |
|-----------|--------|----------|
| **Infraestructura WebSocket** | ✅ Implementado | Node.js + Socket.IO en puerto 3001 |
| **ProformaController** | ✅ Implementado | Notificaciones en: aprobar, rechazar, convertirAVenta |
| **VentaController** | ✅ Implementado | Notificaciones en: store (crear), destroy (cancelar) |
| **EnvioController** | ✅ Implementado | 7 métodos de notificación operativos |
| **ApiProformaController** | ✅ Implementado | Notificación de creación desde app externa |
| **Stock Service** | ✅ Implementado | Notificaciones de reserva y actualizaciones |
| **Modelo Pago** | ✅ Implementado | Tabla y modelo para pagos (CuentaPorPagar) |
| **Notificaciones Push (FCM)** | ⏭️ NO IMPLEMENTADO | Usando solo WebSocket (suficiente para app abierta) |
| **WebSocket Health Check** | ✅ Disponible | Método para verificar servidor |

### Eventos Transmitidos en Tiempo Real (WebSocket)

- ✅ Proforma creada, aprobada, rechazada, convertida
- ✅ Venta creada, cancelada
- ✅ Envío programado, preparación, en ruta, entregado, cancelado
- ✅ Actualización de ubicación GPS (cada 10 segundos)
- ✅ Stock reservado, actualizado, bajo
- ✅ Pagos recibidos
- ✅ Entregas rechazadas (con fotos y motivo)

---

## 🎯 ANÁLISIS DEL FLUJO REQUERIDO

### **📋 Proceso Completo:**

```mermaid
graph TD
    A[📱 Cliente App Flutter] --> B[🛒 Solicita Proforma]
    B --> C[📧 Notificación a Encargado]
    C --> D{🔍 Encargado Revisa}
    D -->|✅ Aprueba| E[📄 Genera Proforma]
    D -->|❌ Rechaza| F[🚫 Notifica Rechazo]
    E --> G{💳 Cliente Acepta?}
    G -->|✅ Sí| H[💰 Convierte a Venta]
    G -->|❌ No| I[📝 Queda como Proforma]
    H --> J[📦 Preparar Pedido]
    J --> K[🚛 Asignar Vehículo]
    K --> L[👨‍💼 Asignar Chofer]
    L --> M[🛣️ En Ruta]
    M --> N[📍 Entregado]
    N --> O[✅ Confirmar Entrega]
    O --> P[📊 Actualizar Stock]
```

## 🏗️ ARQUITECTURA DE LA SOLUCIÓN

### **📚 Nuevos Modelos Necesarios:**

#### **1. Proforma (Cotizaciones)**

```php
// app/Models/Proforma.php
class Proforma extends Model
{
    protected $fillable = [
        'numero',
        'fecha',
        'fecha_vencimiento',
        'subtotal',
        'descuento', 
        'impuesto',
        'total',
        'estado', // PENDIENTE, APROBADA, RECHAZADA, CONVERTIDA, VENCIDA
        'observaciones',
        'observaciones_rechazo',
        'cliente_id',
        'usuario_creador_id',
        'usuario_aprobador_id',
        'fecha_aprobacion',
        'moneda_id',
        'canal_origen', // APP_EXTERNA, WEB, PRESENCIAL
    ];

    // Estados
    const PENDIENTE = 'PENDIENTE';
    const APROBADA = 'APROBADA';
    const RECHAZADA = 'RECHAZADA';
    const CONVERTIDA = 'CONVERTIDA';
    const VENCIDA = 'VENCIDA';

    // Relaciones
    public function detalles() {
        return $this->hasMany(DetalleProforma::class);
    }
    
    public function cliente() {
        return $this->belongsTo(Cliente::class);
    }
    
    public function usuarioCreador() {
        return $this->belongsTo(User::class, 'usuario_creador_id');
    }
    
    public function usuarioAprobador() {
        return $this->belongsTo(User::class, 'usuario_aprobador_id');
    }
    
    public function venta() {
        return $this->hasOne(Venta::class);
    }
}
```

#### **2. Envío/Logística**

```php
// app/Models/Envio.php
class Envio extends Model
{
    protected $fillable = [
        'numero_envio',
        'venta_id',
        'vehiculo_id',
        'chofer_id',
        'fecha_programada',
        'fecha_salida',
        'fecha_entrega',
        'estado', // PROGRAMADO, EN_PREPARACION, EN_RUTA, ENTREGADO, CANCELADO
        'direccion_entrega',
        'coordenadas_lat',
        'coordenadas_lng',
        'observaciones',
        'foto_entrega',
        'firma_cliente',
        'receptor_nombre',
        'receptor_documento',
    ];

    // Estados
    const PROGRAMADO = 'PROGRAMADO';
    const EN_PREPARACION = 'EN_PREPARACION';
    const EN_RUTA = 'EN_RUTA';
    const ENTREGADO = 'ENTREGADO';
    const CANCELADO = 'CANCELADO';

    // Relaciones
    public function venta() {
        return $this->belongsTo(Venta::class);
    }
    
    public function vehiculo() {
        return $this->belongsTo(Vehiculo::class);
    }
    
    public function chofer() {
        return $this->belongsTo(User::class, 'chofer_id');
    }
    
    public function seguimientos() {
        return $this->hasMany(SeguimientoEnvio::class);
    }
}
```

#### **3. Vehículos**

```php
// app/Models/Vehiculo.php
class Vehiculo extends Model
{
    protected $fillable = [
        'placa',
        'marca',
        'modelo',
        'capacidad_kg',
        'capacidad_volumen',
        'estado', // DISPONIBLE, EN_RUTA, MANTENIMIENTO, FUERA_SERVICIO
        'chofer_asignado_id',
        'observaciones',
    ];

    // Estados
    const DISPONIBLE = 'DISPONIBLE';
    const EN_RUTA = 'EN_RUTA';
    const MANTENIMIENTO = 'MANTENIMIENTO';
    const FUERA_SERVICIO = 'FUERA_SERVICIO';
}
```

#### **4. Seguimiento en Tiempo Real**

```php
// app/Models/SeguimientoEnvio.php
class SeguimientoEnvio extends Model
{
    protected $fillable = [
        'envio_id',
        'estado',
        'coordenadas_lat',
        'coordenadas_lng',
        'fecha_hora',
        'observaciones',
        'foto',
        'user_id',
    ];
}
```

## 🔄 MODIFICACIONES AL SISTEMA ACTUAL

### **📝 Modelo Venta Extendido**

```php
// Agregar a app/Models/Venta.php
protected $fillable = [
    // ... campos existentes ...
    'proforma_id',        // NUEVO: Relación con proforma
    'requiere_envio',     // NUEVO: boolean
    'canal_origen',       // NUEVO: APP_EXTERNA, WEB, PRESENCIAL
    'estado_logistico',   // NUEVO: PENDIENTE_ENVIO, PREPARANDO, ENVIADO, ENTREGADO
];

// Nuevas relaciones
public function proforma() {
    return $this->belongsTo(Proforma::class);
}

public function envio() {
    return $this->hasOne(Envio::class);
}

// Nuevos métodos
public function puedeEnviarse(): bool
{
    return $this->requiere_envio && 
           $this->estado_logistico === 'PENDIENTE_ENVIO' &&
           $this->estado_documento_id === EstadoDocumento::CONFIRMADO;
}

public function programarEnvio(array $datos): Envio
{
    return Envio::create([
        'venta_id' => $this->id,
        'vehiculo_id' => $datos['vehiculo_id'],
        'chofer_id' => $datos['chofer_id'],
        'fecha_programada' => $datos['fecha_programada'],
        'direccion_entrega' => $this->cliente->direccion,
        'estado' => Envio::PROGRAMADO,
    ]);
}
```

### **🎮 Nuevos Controladores**

#### **1. ProformaController**

```php
// app/Http/Controllers/ProformaController.php
class ProformaController extends Controller
{
    public function index()
    {
        $proformas = Proforma::with(['cliente', 'usuarioCreador'])
            ->orderBy('created_at', 'desc')
            ->paginate(20);
            
        return Inertia::render('Proformas/Index', compact('proformas'));
    }

    public function store(Request $request)
    {
        // Crear proforma desde app externa
        DB::beginTransaction();
        try {
            $proforma = Proforma::create([
                'numero' => $this->generarNumeroProforma(),
                'fecha' => now(),
                'fecha_vencimiento' => now()->addDays(7),
                'cliente_id' => $request->cliente_id,
                'usuario_creador_id' => $request->usuario_creador_id ?? null,
                'estado' => Proforma::PENDIENTE,
                'canal_origen' => 'APP_EXTERNA',
                'subtotal' => $request->subtotal,
                'descuento' => $request->descuento ?? 0,
                'impuesto' => $request->impuesto ?? 0,
                'total' => $request->total,
                'moneda_id' => $request->moneda_id,
            ]);

            foreach ($request->detalles as $detalle) {
                $proforma->detalles()->create($detalle);
            }

            // Notificar a encargados
            $this->notificarNuevaProforma($proforma);

            DB::commit();
            return response()->json(['proforma' => $proforma], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function aprobar(Proforma $proforma, Request $request)
    {
        $request->validate([
            'observaciones' => 'nullable|string|max:500'
        ]);

        $proforma->update([
            'estado' => Proforma::APROBADA,
            'usuario_aprobador_id' => auth()->id(),
            'fecha_aprobacion' => now(),
            'observaciones' => $request->observaciones,
        ]);

        // Notificar al cliente via app
        $this->notificarProformaAprobada($proforma);

        return back()->with('success', 'Proforma aprobada exitosamente');
    }

    public function rechazar(Proforma $proforma, Request $request)
    {
        $request->validate([
            'observaciones_rechazo' => 'required|string|max:500'
        ]);

        $proforma->update([
            'estado' => Proforma::RECHAZADA,
            'usuario_aprobador_id' => auth()->id(),
            'fecha_aprobacion' => now(),
            'observaciones_rechazo' => $request->observaciones_rechazo,
        ]);

        // Notificar al cliente via app
        $this->notificarProformaRechazada($proforma);

        return back()->with('success', 'Proforma rechazada');
    }

    public function convertirAVenta(Proforma $proforma, Request $request)
    {
        if ($proforma->estado !== Proforma::APROBADA) {
            return back()->withErrors(['error' => 'Solo se pueden convertir proformas aprobadas']);
        }

        DB::beginTransaction();
        try {
            // Crear venta basada en proforma
            $venta = Venta::create([
                'numero' => $this->generarNumeroVenta(),
                'fecha' => now(),
                'proforma_id' => $proforma->id,
                'cliente_id' => $proforma->cliente_id,
                'usuario_id' => auth()->id(),
                'subtotal' => $proforma->subtotal,
                'descuento' => $proforma->descuento,
                'impuesto' => $proforma->impuesto,
                'total' => $proforma->total,
                'moneda_id' => $proforma->moneda_id,
                'canal_origen' => 'APP_EXTERNA',
                'requiere_envio' => $request->requiere_envio ?? true,
                'estado_logistico' => 'PENDIENTE_ENVIO',
                'tipo_pago_id' => $request->tipo_pago_id,
                'estado_documento_id' => EstadoDocumento::CONFIRMADO,
            ]);

            // Copiar detalles
            foreach ($proforma->detalles as $detalleProforma) {
                $venta->detalles()->create([
                    'producto_id' => $detalleProforma->producto_id,
                    'cantidad' => $detalleProforma->cantidad,
                    'precio_unitario' => $detalleProforma->precio_unitario,
                    'subtotal' => $detalleProforma->subtotal,
                ]);
            }

            // Actualizar proforma
            $proforma->update(['estado' => Proforma::CONVERTIDA]);

            // Generar automatizaciones
            $venta->generarAsientoContable();
            $venta->generarMovimientoCaja();

            // ⚠️ IMPORTANTE: NO reducir stock aún
            // Stock se reduce al confirmar envío

            DB::commit();

            // Notificar al cliente
            $this->notificarVentaCreada($venta);

            return redirect()->route('ventas.show', $venta)
                ->with('success', 'Venta creada exitosamente desde proforma');
        } catch (\Exception $e) {
            DB::rollBack();
            return back()->withErrors(['error' => $e->getMessage()]);
        }
    }
}
```

#### **2. EnvioController**

```php
// app/Http/Controllers/EnvioController.php
class EnvioController extends Controller
{
    public function index()
    {
        $envios = Envio::with(['venta.cliente', 'vehiculo', 'chofer'])
            ->orderBy('fecha_programada', 'desc')
            ->paginate(20);
            
        return Inertia::render('Envios/Index', compact('envios'));
    }

    public function programar(Venta $venta, Request $request)
    {
        $request->validate([
            'vehiculo_id' => 'required|exists:vehiculos,id',
            'chofer_id' => 'required|exists:users,id',
            'fecha_programada' => 'required|date|after:now',
        ]);

        if (!$venta->puedeEnviarse()) {
            return back()->withErrors(['error' => 'Esta venta no puede enviarse']);
        }

        $envio = $venta->programarEnvio($request->all());

        // Actualizar estado de venta
        $venta->update(['estado_logistico' => 'PREPARANDO']);

        return back()->with('success', 'Envío programado exitosamente');
    }

    public function iniciarPreparacion(Envio $envio)
    {
        $envio->update(['estado' => Envio::EN_PREPARACION]);
        
        // Aquí es donde se reduce el stock
        $this->reducirStockParaEnvio($envio);

        return back()->with('success', 'Preparación iniciada');
    }

    public function confirmarSalida(Envio $envio, Request $request)
    {
        $envio->update([
            'estado' => Envio::EN_RUTA,
            'fecha_salida' => now(),
        ]);

        $envio->venta->update(['estado_logistico' => 'ENVIADO']);

        // Crear seguimiento inicial
        $envio->seguimientos()->create([
            'estado' => 'SALIO_ALMACEN',
            'fecha_hora' => now(),
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Envío confirmado en ruta');
    }

    public function confirmarEntrega(Envio $envio, Request $request)
    {
        $request->validate([
            'receptor_nombre' => 'required|string|max:255',
            'receptor_documento' => 'nullable|string|max:20',
            'foto_entrega' => 'nullable|image|max:2048',
            'firma_cliente' => 'nullable|string', // Base64 de firma
        ]);

        $fotoPath = null;
        if ($request->hasFile('foto_entrega')) {
            $fotoPath = $request->file('foto_entrega')->store('entregas', 'public');
        }

        $envio->update([
            'estado' => Envio::ENTREGADO,
            'fecha_entrega' => now(),
            'receptor_nombre' => $request->receptor_nombre,
            'receptor_documento' => $request->receptor_documento,
            'foto_entrega' => $fotoPath,
            'firma_cliente' => $request->firma_cliente,
        ]);

        $envio->venta->update(['estado_logistico' => 'ENTREGADO']);

        // Crear seguimiento final
        $envio->seguimientos()->create([
            'estado' => 'ENTREGADO',
            'fecha_hora' => now(),
            'observaciones' => 'Entregado a: ' . $request->receptor_nombre,
            'user_id' => auth()->id(),
        ]);

        return back()->with('success', 'Entrega confirmada exitosamente');
    }

    private function reducirStockParaEnvio(Envio $envio)
    {
        $stockService = app(StockService::class);
        
        foreach ($envio->venta->detalles as $detalle) {
            $stockService->reducirStock(
                $detalle->producto_id,
                $detalle->cantidad,
                'ENVIO',
                "Envío #{$envio->numero_envio}"
            );
        }
    }
}
```

## 📱 API PARA APP EXTERNA (Flutter)

### **🔗 Rutas API**

```php
// routes/api.php
Route::middleware(['auth:sanctum'])->group(function () {
    // Productos para la app
    Route::get('/productos', [ApiProductoController::class, 'index']);
    Route::get('/productos/{producto}', [ApiProductoController::class, 'show']);
    
    // Proformas
    Route::post('/proformas', [ApiProformaController::class, 'store']);
    Route::get('/proformas/{proforma}', [ApiProformaController::class, 'show']);
    
    // Cliente puede ver sus proformas y ventas
    Route::get('/cliente/proformas', [ApiClienteController::class, 'proformas']);
    Route::get('/cliente/ventas', [ApiClienteController::class, 'ventas']);
    Route::get('/cliente/envios', [ApiClienteController::class, 'envios']);
    
    // Seguimiento de envíos
    Route::get('/envios/{envio}/seguimiento', [ApiEnvioController::class, 'seguimiento']);
    Route::post('/envios/{envio}/ubicacion', [ApiEnvioController::class, 'actualizarUbicacion']);
});
```

### **📲 Controlador API**

```php
// app/Http/Controllers/Api/ApiProformaController.php
class ApiProformaController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'cliente_id' => 'required|exists:clientes,id',
            'productos' => 'required|array|min:1',
            'productos.*.producto_id' => 'required|exists:productos,id',
            'productos.*.cantidad' => 'required|numeric|min:1',
        ]);

        DB::beginTransaction();
        try {
            // Calcular totales
            $subtotal = 0;
            $productosValidados = [];

            foreach ($request->productos as $item) {
                $producto = Producto::findOrFail($item['producto_id']);
                $cantidad = $item['cantidad'];
                $precio = $producto->precio_venta;
                $subtotalItem = $cantidad * $precio;
                
                $subtotal += $subtotalItem;
                
                $productosValidados[] = [
                    'producto_id' => $producto->id,
                    'cantidad' => $cantidad,
                    'precio_unitario' => $precio,
                    'subtotal' => $subtotalItem,
                ];
            }

            $impuesto = $subtotal * 0.13; // 13% IVA
            $total = $subtotal + $impuesto;

            // Crear proforma
            $proforma = Proforma::create([
                'numero' => $this->generarNumeroProforma(),
                'fecha' => now(),
                'fecha_vencimiento' => now()->addDays(7),
                'cliente_id' => $request->cliente_id,
                'estado' => Proforma::PENDIENTE,
                'canal_origen' => 'APP_EXTERNA',
                'subtotal' => $subtotal,
                'impuesto' => $impuesto,
                'total' => $total,
                'moneda_id' => 1, // Bolivianos por defecto
            ]);

            // Crear detalles
            foreach ($productosValidados as $detalle) {
                $proforma->detalles()->create($detalle);
            }

            // Notificar a encargados
            event(new NuevaProformaCreada($proforma));

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Proforma creada exitosamente',
                'data' => $proforma->load(['detalles.producto', 'cliente'])
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creando proforma',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
```

## 🔄 IMPACTO EN CONTROL DE STOCK

### **⚠️ CAMBIO CRÍTICO: Momento de Reducción de Stock**

#### **🔴 ANTES (Sistema actual):**

```php
// Stock se reduce inmediatamente al crear venta
Venta::created(function($venta) {
    $venta->reducirStock(); // ❌ Inmediato
});
```

#### **🟢 DESPUÉS (Nuevo sistema):**

```php
// Stock se reduce cuando se confirma el envío
class EnvioController 
{
    public function iniciarPreparacion(Envio $envio)
    {
        // ✅ Aquí se reduce el stock
        $this->reducirStockParaEnvio($envio);
        
        $envio->update(['estado' => Envio::EN_PREPARACION]);
    }
}
```

### **📊 Nuevo Flujo de Stock:**

1. **🛒 Cliente pide proforma** → No afecta stock
2. **📄 Se crea proforma** → No afecta stock  
3. **✅ Se aprueba proforma** → No afecta stock
4. **💰 Se convierte a venta** → No afecta stock (¡CAMBIO!)
5. **📦 Se programa envío** → No afecta stock
6. **🚛 Se inicia preparación** → ✅ **SE REDUCE STOCK AQUÍ**
7. **🛣️ Sale del almacén** → Stock ya reducido
8. **📍 Se entrega** → Stock ya reducido

### **🎯 Ventajas del Nuevo Flujo:**

- ✅ **Stock real:** Refleja lo que físicamente está en almacén
- ✅ **No bloqueo prematuro:** Productos disponibles hasta preparación
- ✅ **Cancelaciones sin problemas:** Fácil cancelar antes de preparar
- ✅ **Inventario preciso:** Stock = lo que está físicamente disponible

## 📈 TRACKING PARA EL CLIENTE

### **📱 Vista en App Flutter:**

```dart
// Ejemplo de seguimiento en Flutter
class SeguimientoEnvio extends StatelessWidget {
  final Envio envio;

  Widget build(BuildContext context) {
    return Column(
      children: [
        // Timeline visual
        Timeline(
          children: [
            TimelineItem(
              title: "Proforma Aprobada",
              subtitle: envio.venta.proforma.fecha_aprobacion,
              status: TimelineStatus.completed,
              icon: Icons.check_circle,
            ),
            TimelineItem(
              title: "Venta Confirmada", 
              subtitle: envio.venta.created_at,
              status: TimelineStatus.completed,
              icon: Icons.shopping_cart,
            ),
            TimelineItem(
              title: "Preparando Pedido",
              subtitle: envio.estado == 'EN_PREPARACION' ? 'En proceso...' : 'Completado',
              status: envio.estado == 'PROGRAMADO' ? TimelineStatus.pending : TimelineStatus.completed,
              icon: Icons.inventory,
            ),
            TimelineItem(
              title: "En Ruta",
              subtitle: envio.fecha_salida ?? 'Pendiente',
              status: envio.estado == 'EN_RUTA' ? TimelineStatus.active : 
                     envio.estado == 'ENTREGADO' ? TimelineStatus.completed : TimelineStatus.pending,
              icon: Icons.local_shipping,
            ),
            TimelineItem(
              title: "Entregado",
              subtitle: envio.fecha_entrega ?? 'Pendiente',
              status: envio.estado == 'ENTREGADO' ? TimelineStatus.completed : TimelineStatus.pending,
              icon: Icons.check_circle_outline,
            ),
          ],
        ),
        
        // Mapa en tiempo real
        if (envio.estado == 'EN_RUTA')
          MapaEnTiempoReal(envioId: envio.id),
          
        // Información del envío
        InfoEnvio(envio: envio),
      ],
    );
  }
}
```

## 🔌 INTEGRACIÓN WEBSOCKET DETALLADA

### **Arquitectura de Comunicación Real-Time**

```
┌─────────────────────────┐
│   App Externa (Flutter) │
│   Cliente Web (React)   │
└────────────┬────────────┘
             │ Socket.IO
             ▼
┌──────────────────────────────────────┐
│  Node.js WebSocket Server            │
│  (Puerto 3001)                       │
│  - Socket.IO v4.7.5                  │
│  - Express.js                        │
│  - Salas por usuario/rol             │
└────────────┬─────────────────────────┘
             ▲ HTTP POST
             │
┌────────────┴─────────────────────────┐
│  Laravel Backend                     │
│  WebSocketNotificationService        │
│  - notifyProformaApproved()          │
│  - notifyProformaConverted()         │
│  - notifyProformaRejected()          │
│  - notifyEnvioProgramado()           │
│  - notifyEnvioEnRuta()               │
│  - notifyEnvioEntregado()            │
│  - notifyVentaCreada()               │
│  - notifyVentaCancelada()            │
└──────────────────────────────────────┘
```

### **Cambios Implementados (2025-10-25)**

#### 1. **ProformaController** (`app/Http/Controllers/ProformaController.php`)

**Métodos Actualizados:**

```php
// ✅ NUEVO: Notificación en aprobación
public function aprobar(Proforma $proforma)
{
    $proforma->update([...]);

    try {
        $webSocketService = app(WebSocketNotificationService::class);
        $webSocketService->notifyProformaApproved($proforma);
    } catch (\Exception $e) {
        Log::warning('Error WebSocket', [...]);
    }

    return back()->with('success', '...');
}

// ✅ NUEVO: Notificación en rechazo
public function rechazar(Proforma $proforma)
{
    $proforma->update([...]);

    try {
        $webSocketService = app(WebSocketNotificationService::class);
        $webSocketService->notifyProformaRejected($proforma);
    } catch (\Exception $e) {
        Log::warning('Error WebSocket', [...]);
    }

    return back()->with('success', '...');
}

// ✅ NUEVO: Notificación en conversión a venta
public function convertirAVenta(Proforma $proforma)
{
    // ... lógica de conversión ...

    try {
        $webSocketService = app(WebSocketNotificationService::class);
        $webSocketService->notifyProformaConverted($proforma, $venta);
    } catch (\Exception $e) {
        Log::warning('Error WebSocket', [...]);
    }

    return redirect()->route('ventas.show', $venta->id)->with('success', '...');
}
```

#### 2. **VentaController** (`app/Http/Controllers/VentaController.php`)

**Métodos Actualizados:**

```php
// ✅ NUEVO: Notificación al crear venta
public function store(StoreVentaRequest $request)
{
    return DB::transaction(function () use ($data, $request) {
        $venta = Venta::create($data);

        // Nuevos detalles...

        try {
            $webSocketService = app(WebSocketNotificationService::class);

            // Notificar al usuario creador
            $webSocketService->notifyUser(
                $venta->usuario_id,
                'venta_creada',
                [
                    'venta_numero' => $venta->numero,
                    'cliente_nombre' => $venta->cliente?->nombre,
                    'total' => $venta->total,
                    'timestamp' => now(),
                    // ... más datos
                ]
            );

            // Notificar a managers
            $webSocketService->notifyRole(
                'manager',
                'nueva_venta_registrada',
                [...]
            );
        } catch (\Exception $e) {
            Log::warning('Error WebSocket', [...]);
        }

        return redirect()->route('ventas.index')->with('success', '...');
    });
}

// ✅ NUEVO: Notificación al cancelar venta
public function destroy($id)
{
    $venta = Venta::findOrFail($id);

    return DB::transaction(function () use ($venta) {
        // Validaciones...

        $ventaData = [
            'venta_numero' => $venta->numero,
            'cliente_nombre' => $venta->cliente?->nombre,
            'total' => $venta->total,
        ];

        $venta->delete();

        try {
            $webSocketService = app(WebSocketNotificationService::class);

            // Notificar usuario
            $webSocketService->notifyUser(
                $venta->usuario_id,
                'venta_eliminada',
                array_merge($ventaData, [
                    'motivo' => 'Venta cancelada por usuario',
                ])
            );

            // Notificar managers
            $webSocketService->notifyRole(
                'manager',
                'venta_cancelada',
                array_merge($ventaData, [
                    'usuario_que_cancelo' => auth()->user()?->name,
                ])
            );
        } catch (\Exception $e) {
            Log::warning('Error WebSocket', [...]);
        }

        return redirect()->route('ventas.index')->with('success', '...');
    });
}
```

### **Características de la Implementación**

✅ **Error Handling Robusto**
- Try-catch en todas las llamadas WebSocket
- No afecta la respuesta si el servidor WebSocket está caído
- Logs de warning para debugging

✅ **Usuarios Notificados**
- Usuarios individuales por ID
- Roles (managers, drivers, etc.)
- Broadcast general si es necesario

✅ **Datos Transmitidos**
- Información completa de la entidad
- Timestamps de eventos
- Contexto de usuario
- Detalles de cambios

✅ **Cobertura Completa**
- Ciclo de vida de proformas
- Ciclo de vida de ventas
- Ciclo de vida de envíos (ya existente)
- Stock updates (ya existente)

### **Flujo de Notificación WebSocket**

#### **Ejemplo: Aprobación de Proforma**

```
1. Manager Click "Aprobar" en Dashboard Web
   ↓
2. ProformaController::aprobar() se ejecuta
   ↓
3. Proforma se marca como APROBADA en DB
   ↓
4. WebSocketNotificationService::notifyProformaApproved()
   ↓
5. HTTP POST a http://localhost:3001/notify/proforma-approved
   {
       "id": 5,
       "numero": "PRO-2025-001",
       "estado": "APROBADA",
       "cliente": {...},
       "detalles": [...],
       "fecha_aprobacion": "2025-10-24T15:30:00Z"
   }
   ↓
6. Node.js recibe evento en /notify/proforma-approved
   ↓
7. ProformaApiController relaya a Socket.IO
   ↓
8. Emite a sala "user_<cliente_id>" y "managers"
   ↓
9. Cliente y Managers reciben notificación en tiempo real
   ✅ Actualización instantánea en UI
   ✅ Timeline se actualiza
   ✅ Notificación push (opcional)
```

#### **Ejemplo: Creación de Venta**

```
1. Usuario Click "Guardar Venta" en Formulario
   ↓
2. VentaController::store() se ejecuta
   ↓
3. Venta se crea en DB (con stock reservado/consumido)
   ↓
4. WebSocketNotificationService::notifyUser() y notifyRole()
   ↓
5. HTTP POST a http://localhost:3001/notify/user y /notify/role
   ↓
6. Socket.IO emite a salas:
   - user_<usuario_id> (creador)
   - role_manager (all managers)
   ↓
7. Receptores reciben eventos:
   - "venta_creada"
   - "nueva_venta_registrada"
   ↓
8. Dashboard se actualiza en tiempo real
   ✅ Nueva venta aparece en listado
   ✅ Totales de ventas se recalculan
   ✅ Managers son notificados
```

### **Configuración WebSocket**

**Archivo: `config/websocket.php`**

```php
return [
    'enabled' => env('WEBSOCKET_ENABLED', true),
    'url' => env('WEBSOCKET_URL', 'http://localhost:3001'),
    'timeout' => env('WEBSOCKET_TIMEOUT', 5),
    'debug' => env('WEBSOCKET_DEBUG', false),
    'retry' => [
        'enabled' => env('WEBSOCKET_RETRY_ENABLED', true),
        'attempts' => env('WEBSOCKET_RETRY_ATTEMPTS', 2),
        'delay' => env('WEBSOCKET_RETRY_DELAY', 1),
    ],
];
```

**Archivo: `.env`**

```bash
BROADCAST_CONNECTION=reverb
WEBSOCKET_ENABLED=true
WEBSOCKET_URL=http://localhost:3001
WEBSOCKET_TIMEOUT=5
WEBSOCKET_DEBUG=true
WEBSOCKET_RETRY_ENABLED=true
WEBSOCKET_RETRY_ATTEMPTS=2
```

### **Iniciar Servidor WebSocket**

```bash
# Terminal 1: Laravel
php artisan serve

# Terminal 2: Node.js WebSocket
cd websocket
npm start

# El servidor WebSocket estará en http://localhost:3001
```

### **Health Check**

```php
// En cualquier controlador o artisan command
$webSocketService = app(WebSocketNotificationService::class);
$health = $webSocketService->checkHealth();

if ($health['status'] === 'success') {
    echo "✅ WebSocket Server OK";
} else {
    echo "❌ WebSocket Server DOWN: {$health['error']}";
}
```

---

## 📱 CANALES WEBSOCKET PARA APP FLUTTER

### **Arquitectura de Conexión Flutter**

```
Flutter App (Cliente)
    ↓
Socket.IO Client Connection
    ↓
ws://localhost:3001 (o IP servidor)
    ↓
Autentica con token JWT/Sanctum
    ↓
Se suscribe a canales específicos
    ↓
Recibe eventos en tiempo real
```

### **Eventos que Flutter DEBE Escuchar**

#### **1. PROFORMAS (Cliente)**

```dart
// Conectarse al WebSocket
socket.on('proforma-creada', (data) {
  // Proforma fue creada
  // data: { numero, estado, fecha, total, detalles[], cliente }
  updateProformasList();
  showNotification('Nueva proforma #${data['numero']}');
});

socket.on('proforma-aprobada', (data) {
  // Gerente aprobó la proforma
  // data: { numero, estado: APROBADA, fecha_aprobacion, usuario_aprobador }
  updateProformaStatus('APROBADA');
  showNotification('¡Proforma aprobada! Ya puede confirmar su pedido');
});

socket.on('proforma-rechazada', (data) {
  // Gerente rechazó la proforma
  // data: { numero, estado: RECHAZADA, motivo_rechazo }
  updateProformaStatus('RECHAZADA');
  showNotification('Proforma rechazada: ${data['motivo_rechazo']}');
});

socket.on('proforma-convertida', (data) {
  // Proforma fue convertida a venta (cliente confirmó pedido)
  // data: { proforma_numero, venta_numero, venta_id, total }
  navigateToVentaDetails(data['venta_id']);
  showNotification('¡Pedido confirmado! Número: ${data['venta_numero']}');
});
```

#### **2. VENTAS Y ENVÍOS (Cliente)**

```dart
// Escuchar confirmación de envío programado
socket.on('envio-programado', (data) {
  // Envío fue programado
  // data: { numero_envio, fecha_programada, vehiculo, chofer, direccion }
  showNotification('Tu pedido fue programado para ${data['fecha_programada']}');
  updateDeliverySchedule(data);
});

// Escuchar salida del almacén
socket.on('envio-en-ruta', (data) {
  // Envío salió del almacén
  // data: { numero_envio, fecha_salida, vehiculo: { placa }, chofer: { name, telefono } }
  updateDeliveryStatus('EN_RUTA');
  showNotification('Tu pedido está en camino');
  showDriverInfo(data['chofer']);
});

// Escuchar ubicación GPS en tiempo real
socket.on('ubicacion-actualizada', (data) {
  // Actualizar posición en mapa
  // data: { envio_id, numero_envio, coordenadas: { lat, lng }, timestamp }
  updateMapLocation(data['coordenadas']);
  updateDeliveryETA(data);
});

// Escuchar llegada del envío (está próximo)
socket.on('envio-proximo', (data) {
  // Chofer está cerca
  // data: { numero_envio, distancia_km, tiempo_estimado_min }
  showNotification('¡Tu pedido está próximo a llegar!');
  showArrivingSoonAlert(data);
});

// Escuchar confirmación de entrega
socket.on('envio-entregado', (data) {
  // Pedido fue entregado exitosamente
  // data: { numero_envio, fecha_entrega, receptor_nombre, foto_entrega }
  updateDeliveryStatus('ENTREGADO');
  showNotification('¡Tu pedido fue entregado!');
  showCompletionScreen(data);
});

// Escuchar rechazo de entrega
socket.on('entrega-rechazada', (data) {
  // Chofer no pudo entregar
  // data: { numero_envio, tipo_rechazo, motivo, fotos[], chofer, timestamp }
  updateDeliveryStatus('INTENTO_FALLIDO');
  showNotification('Problema con la entrega: ${data['motivo']}');
  showDeliveryProblemDetails(data);
});
```

#### **3. STOCK Y DISPONIBILIDAD**

```dart
// Stock reservado para proforma
socket.on('stock-reservado', (data) {
  // data: { proforma_numero, productos[], fecha_vencimiento_reserva }
  showNotification('Stock reservado hasta ${data['fecha_vencimiento_reserva']}');
});

// Stock actualizado (otro cliente compró, cambió disponibilidad)
socket.on('stock-actualizado', (data) {
  // data: { producto_id, cantidad_nueva, fecha }
  if (isProductoEnProforma(data['producto_id'])) {
    showWarningAlert('Stock disponible cambió, verifique');
  }
});

// Reserva está por vencer
socket.on('reserva-por-vencer', (data) {
  // data: { proforma_numero, horas_restantes }
  showNotification('Reserva vence en ${data['horas_restantes']} horas. Confirme su pedido');
});
```

#### **4. PAGOS**

```dart
// Pago recibido
socket.on('pago-recibido', (data) {
  // data: { venta_numero, monto, tipo_pago, fecha }
  showNotification('Pago registrado: Bs. ${data['monto']}');
  updatePaymentStatus('PAGADO');
});
```

### **Estructura de Datos - Ejemplo Completo**

#### **Evento: envio-entregado**

```json
{
  "numero_envio": "ENV-20251024-0001",
  "venta_numero": "V-2025-00152",
  "venta_id": 42,
  "cliente_id": 15,
  "cliente_nombre": "Tienda XYZ",
  "fecha_entrega": "2025-10-24T15:45:30Z",
  "receptor_nombre": "Juan Perez",
  "receptor_documento": "1234567",
  "foto_entrega": "entregas/ENV-20251024-0001-foto.jpg",
  "chofer": {
    "id": 5,
    "nombre": "Carlos López",
    "telefono": "+59172345678"
  },
  "vehiculo": {
    "placa": "ABC123",
    "marca": "Toyota",
    "modelo": "Hilux"
  },
  "estado_entrega": "EXITOSA",
  "timestamp": "2025-10-24T15:45:30Z"
}
```

#### **Evento: entrega-rechazada**

```json
{
  "numero_envio": "ENV-20251024-0002",
  "venta_numero": "V-2025-00153",
  "tipo_rechazo": "cliente_ausente",
  "motivo": "Cliente no se encontraba en el lugar",
  "fotos_cantidad": 2,
  "fotos": [
    "rechazos-entregas/ENV-20251024-0002-foto1.jpg",
    "rechazos-entregas/ENV-20251024-0002-foto2.jpg"
  ],
  "fecha_intento": "2025-10-24T15:30:00Z",
  "chofer": {
    "id": 5,
    "nombre": "Carlos López"
  },
  "cliente_nombre": "Tienda XYZ",
  "estado_entrega": "CLIENTE_AUSENTE",
  "timestamp": "2025-10-24T15:30:00Z"
}
```

#### **Evento: ubicacion-actualizada**

```json
{
  "envio_id": 42,
  "numero_envio": "ENV-20251024-0001",
  "coordenadas": {
    "lat": -17.3932,
    "lng": -66.1593
  },
  "direccion_actual": "Calle Murillo esq. Ayacucho",
  "velocidad_kmh": 35,
  "timestamp": "2025-10-24T15:20:45Z",
  "eta_minutos": 8,
  "distancia_km": 2.5
}
```

### **Flujo Completo: Seguimiento de Envío en Flutter**

```
1. Cliente obtiene Proforma
   ↓
   Socket.on('proforma-creada')

2. Gerente aprueba Proforma
   ↓
   Socket.on('proforma-aprobada')

3. Cliente confirma pedido (Proforma → Venta)
   ↓
   Socket.on('proforma-convertida')

4. Empresa programa envío
   ↓
   Socket.on('envio-programado')

5. Chofer inicia preparación
   ↓
   (Sin evento aún, puede consultarse via API)

6. Chofer sale del almacén
   ↓
   Socket.on('envio-en-ruta')

7. Chofer viaja (cada 10-15 segundos)
   ↓
   Socket.on('ubicacion-actualizada')
   [Actualizar posición en mapa]

8. Chofer se acerca
   ↓
   Socket.on('envio-proximo')

9. Chofer intenta entrega:

   ✅ ÉXITO: Cliente recibe
   ↓
   Socket.on('envio-entregado')

   ❌ FALLO: Cliente ausente/tienda cerrada/otro problema
   ↓
   Socket.on('entrega-rechazada')
   ↓
   Empresa programa reintento
   ↓
   Vuelve a paso 4
```

### **Inicializar Socket en Flutter**

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebSocketService {
  late IO.Socket socket;

  void connect() {
    // Conectar al servidor
    socket = IO.io(
      'http://IP_SERVIDOR:3001',
      IO.SocketIoClientOption(
        reconnection: true,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
        reconnectionAttempts: 5,
        transports: ['websocket'],
      ),
    );

    socket.onConnect((_) {
      print('✅ Conectado al WebSocket');

      // Autenticar
      socket.emit('authenticate', {
        'token': getUserToken(), // Token JWT de Sanctum
      });
    });

    socket.onDisconnect((_) {
      print('❌ Desconectado del WebSocket');
    });

    // Escuchar eventos
    setupListeners();
  }

  void setupListeners() {
    // Proformas
    socket.on('proforma-creada', onProformaCreada);
    socket.on('proforma-aprobada', onProformaAprobada);
    socket.on('proforma-convertida', onProformaConvertida);

    // Envíos
    socket.on('envio-programado', onEnvioProgramado);
    socket.on('envio-en-ruta', onEnvioEnRuta);
    socket.on('ubicacion-actualizada', onUbicacionActualizada);
    socket.on('envio-proximo', onEnvioProximo);
    socket.on('envio-entregado', onEnvioEntregado);
    socket.on('entrega-rechazada', onEntregaRechazada);

    // Stock
    socket.on('stock-reservado', onStockReservado);
    socket.on('stock-actualizado', onStockActualizado);
    socket.on('reserva-por-vencer', onReservaPorVencer);

    // Pagos
    socket.on('pago-recibido', onPagoRecibido);
  }

  void onProformaCreada(dynamic data) {
    print('Nueva proforma: ${data['numero']}');
    // Actualizar UI
  }

  void onEnvioProgramado(dynamic data) {
    print('Envío programado: ${data['numero_envio']}');
    // Actualizar UI
  }

  void onUbicacionActualizada(dynamic data) {
    print('Ubicación: ${data['coordenadas']}');
    // Actualizar mapa
  }

  // ... más listeners
}
```

---

## 🚫 FLUJO DE RECHAZOS Y PROBLEMAS DE ENTREGA

### **Escenarios Posibles**

Cuando el chofer llega a la ubicación del cliente, puede ocurrir:

#### **1. ENTREGA EXITOSA** ✅

```
Chofer llega → Confirma entrega → Cliente recibe → Foto + Firma
              ↓
       WebSocket: envio-entregado
              ↓
       estado = ENTREGADO
       estado_entrega = EXITOSA
```

#### **2. CLIENTE AUSENTE** 🚷

```
Chofer llega → Cliente no está → Toma fotos como evidencia
            ↓
     WebSocket: entrega-rechazada
            ↓
   estado_entrega = CLIENTE_AUSENTE
   fotos_rechazo = [foto1, foto2]
   motivo = "Cliente no se encontraba en el lugar"
```

#### **3. TIENDA CERRADA** 🔒

```
Chofer llega → Tienda cerrada → Toma fotos (puerta cerrada, letrero)
            ↓
     WebSocket: entrega-rechazada
            ↓
   estado_entrega = TIENDA_CERRADA
   fotos_rechazo = [foto1, foto2]
   motivo = "Tienda cerrada"
```

#### **4. OTRO PROBLEMA** ⚠️

```
Chofer llega → Surge problema (dirección incorrecta, cliente se rehúsa, etc)
            ↓
     WebSocket: entrega-rechazada
            ↓
   estado_entrega = OTRO_PROBLEMA
   fotos_rechazo = [foto1, foto2]
   motivo = "Descripción del problema"
```

### **Estructura de Base de Datos - Tabla Envios (ACTUALIZADA)**

```php
// En migración de envios, agregar nuevos campos:

Schema::create('envios', function (Blueprint $table) {
    // Campos originales...
    $table->id();
    $table->string('numero_envio')->unique();
    $table->foreignId('venta_id')->constrained();
    $table->foreignId('vehiculo_id')->nullable()->constrained();
    $table->foreignId('chofer_id')->nullable()->constrained('users');
    $table->dateTime('fecha_programada');
    $table->dateTime('fecha_salida')->nullable();
    $table->dateTime('fecha_entrega')->nullable();
    $table->string('estado'); // PROGRAMADO, EN_PREPARACION, EN_RUTA, ENTREGADO, CANCELADO
    $table->string('direccion_entrega');
    $table->decimal('coordenadas_lat', 10, 8)->nullable();
    $table->decimal('coordenadas_lng', 10, 8)->nullable();
    $table->text('observaciones')->nullable();
    $table->string('foto_entrega')->nullable();
    $table->text('firma_cliente')->nullable();
    $table->string('receptor_nombre')->nullable();
    $table->string('receptor_documento')->nullable();

    // ✅ NUEVOS CAMPOS PARA RECHAZOS
    $table->string('estado_entrega')->nullable(); // EXITOSA, RECHAZADA, CLIENTE_AUSENTE, TIENDA_CERRADA, OTRO_PROBLEMA
    $table->text('motivo_rechazo')->nullable();
    $table->json('fotos_rechazo')->nullable(); // Array de paths a fotos
    $table->dateTime('fecha_intento_entrega')->nullable();

    $table->timestamps();
});
```

### **API Endpoint para Rechazar Entrega**

**Desde Flutter (PUT):**

```
PUT /api/app/envios/{envio_id}/rechazar
Content-Type: multipart/form-data
Authorization: Bearer {token}

Parámetros:
- tipo_rechazo: "cliente_ausente" | "tienda_cerrada" | "otro_problema"
- motivo_detallado: "Descripción adicional" (opcional, requerido si otro_problema)
- fotos[]: archivo 1, archivo 2, etc. (hasta 5 fotos, máx 5MB cada)
```

**⚠️ IMPORTANTE**: El prefijo `/app` es obligatorio (para diferenciarlo de las rutas web).

**Respuesta exitosa (200):**

```json
{
  "success": true,
  "message": "Rechazo de entrega registrado",
  "envio": {
    "id": 42,
    "numero_envio": "ENV-20251024-0002",
    "estado": "EN_RUTA",
    "estado_entrega": "CLIENTE_AUSENTE",
    "fotos_rechazo": [
      "rechazos-entregas/ENV-20251024-0002-foto1.jpg",
      "rechazos-entregas/ENV-20251024-0002-foto2.jpg"
    ],
    "motivo_rechazo": "Cliente no se encontraba en el lugar",
    "fecha_intento_entrega": "2025-10-24T15:30:00Z"
  }
}
```

### **WebSocket Notification Enviada a Managers**

Cuando se rechaza una entrega, el servidor notifica a todos los managers:

**Canal:** `role_manager`
**Evento:** `entrega-rechazada`

```json
{
  "envio_id": 42,
  "envio_numero": "ENV-20251024-0002",
  "venta_numero": "V-2025-00153",
  "tipo_rechazo": "cliente_ausente",
  "motivo": "Cliente no se encontraba en el lugar",
  "fotos_cantidad": 2,
  "fotos": [
    "rechazos-entregas/ENV-20251024-0002-foto1.jpg",
    "rechazos-entregas/ENV-20251024-0002-foto2.jpg"
  ],
  "chofer": "Carlos López",
  "cliente": "Tienda XYZ",
  "timestamp": "2025-10-24T15:30:00Z"
}
```

### **Flujo en React Web (Manager)**

```jsx
// El manager ve el evento en tiempo real

useEffect(() => {
  socket.on('entrega-rechazada', (data) => {
    // 1. Mostrar notificación visual
    showNotification({
      title: "Entrega Rechazada",
      message: `${data['cliente']} - ${data['motivo']}`,
      type: "warning",
      action: () => verDetalles(data['envio_id'])
    });

    // 2. Actualizar lista de envíos
    updateEnviosList(data['envio_id']);

    // 3. Mostrar modal con detalles
    displayRejectionDetails({
      envio_numero: data['envio_numero'],
      cliente: data['cliente'],
      chofer: data['chofer'],
      tipo_rechazo: data['tipo_rechazo'],
      motivo: data['motivo'],
      fotos: data['fotos'],
      timestamp: data['timestamp']
    });
  });

  return () => socket.off('entrega-rechazada');
}, []);
```

### **Acciones Disponibles para Manager**

Cuando recibe un rechazo de entrega:

```
┌─────────────────────────────────┐
│  ENTREGA RECHAZADA              │
│  Cliente: Tienda XYZ            │
│  Motivo: Cliente ausente        │
│  Fotos: 2 adjuntas              │
│  Chofer: Carlos López           │
│  Hora: 15:30                    │
├─────────────────────────────────┤
│ [Botones de Acción]             │
│                                 │
│ [Ver Fotos]  [Programar Reintento] │
│ [Contactar Cliente]  [Más opciones] │
└─────────────────────────────────┘
```

### **Reintento de Entrega**

Si el manager decide reintentar:

```php
// Backend: Re-programar envío

PUT /api/envios/{envio_id}/reintentar
{
  "fecha_programada": "2025-10-25T10:00:00Z",
  "observaciones": "Reintento - cliente no estaba en ubicación anterior"
}

// Resultado:
- Envío vuelve a estado PROGRAMADO
- Se notifica nuevamente al chofer
- Se envía notificación WebSocket a cliente
```

### **Almacenamiento de Fotos**

Las fotos se almacenan en:
```
storage/app/public/rechazos-entregas/
  - ENV-20251024-0002-foto1.jpg
  - ENV-20251024-0002-foto2.jpg
  - ENV-20251024-0003-foto1.jpg
  ...
```

Acceso público via:
```
https://API_URL/storage/rechazos-entregas/ENV-20251024-0002-foto1.jpg
```

### **Auditoría y Reportes**

Se registra todo en tabla `seguimiento_envios`:

```json
{
  "envio_id": 42,
  "estado": "INTENTO_ENTREGA_FALLIDO",
  "fecha_hora": "2025-10-24T15:30:00Z",
  "observaciones": "Intento fallido - Cliente no se encontraba en el lugar. Fotos: 2",
  "user_id": 5,
  "coordenadas_lat": -17.3932,
  "coordenadas_lng": -66.1593
}
```

---

## ⚙️ INSTRUCCIONES PARA ACTIVAR AHORA

### **1. Ejecutar Migración de BD**

```bash
cd D:\paucara\distribuidora-paucara
php artisan migrate
```

**Resultado:** Se agregan 4 columnas a tabla `envios`:
- `estado_entrega` (nullable string)
- `motivo_rechazo` (nullable text)
- `fotos_rechazo` (nullable json)
- `fecha_intento_entrega` (nullable datetime)

**Ubicación archivo:** `database/migrations/2025_10_25_030126_add_rejection_fields_to_envios_table.php`

### **2. Verificar Rutas API**

✅ **YA IMPLEMENTADO** en `routes/api.php` (línea 98-100):

```php
// ✅ Rechazar entrega desde app (chofer reporta problema)
Route::put('/{envio}/rechazar', [EnvioController::class, 'rechazarEntrega'])
    ->name('api.envios.rechazar');
```

El endpoint está dentro del grupo `prefix('app/envios')`, por lo que la ruta completa es:
- **`PUT /api/app/envios/{envio}/rechazar`**

### **3. Verificar que la Ruta está Registrada**

```bash
php artisan route:list | findstr rechazar
```

Debería mostrar:
```
PUT       /api/app/envios/{envio}/rechazar       api.envios.rechazar
```

### **4. Verificar Archivos Modificados**

| Archivo | Estado | Cambios |
|---------|--------|---------|
| `app/Models/Envio.php` | ✅ Modificado | +60 líneas (métodos de rechazo) |
| `app/Http/Controllers/EnvioController.php` | ✅ Modificado | +80 líneas (método rechazarEntrega) |
| `database/migrations/2025_10_25_030126_add_rejection_fields_to_envios_table.php` | ✅ Creado | Migración completa |

### **5. Testear Endpoint (con Postman/Insomnia)**

```http
PUT /api/app/envios/42/rechazar
Authorization: Bearer {token}
Content-Type: multipart/form-data

Form Data:
- tipo_rechazo: cliente_ausente
- motivo_detallado: (vacío si cliente_ausente)
- fotos: [archivo1.jpg, archivo2.jpg]
```

**Respuesta esperada (200):**
```json
{
  "success": true,
  "message": "Rechazo de entrega registrado",
  "envio": {
    "id": 42,
    "numero_envio": "ENV-20251024-0002",
    "estado_entrega": "CLIENTE_AUSENTE",
    "fotos_rechazo": ["rechazos-entregas/...jpg", "...jpg"],
    "motivo_rechazo": "Cliente no se encontraba en el lugar"
  }
}
```

---

## ⚠️ PENDIENTES DE IMPLEMENTACIÓN PARA APP FLUTTER

### 🔴 CRÍTICO - Debe estar listo antes de Flutter

1. **Campos en tabla `ventas`** (Migración)
   ```sql
   ALTER TABLE ventas ADD (
       monto_pagado DECIMAL(12,2) DEFAULT 0,
       monto_pendiente DECIMAL(12,2),
       politica_pago VARCHAR(50),        -- ANTICIPADO_100, MEDIO_MEDIO, CONTRA_ENTREGA
       estado_pago VARCHAR(50)           -- PENDIENTE, PARCIALMENTE_PAGADO, PAGADO
   );
   ```

2. **Endpoint: POST /api/app/proformas/{id}/confirmar**
   - Validar: mínimo 5 productos
   - Crear venta desde proforma aprobada
   - Retornar estado de pago

3. **Endpoint: POST /api/app/ventas/{id}/pagos**
   - Registrar pago parcial o total
   - Actualizar estado_pago

4. **Validación: 5 productos mínimo**
   - En `ApiProformaController::confirmarProforma()`
   - Retornar error 422 si menos de 5

5. **Validación de pago para envío**
   - En `EnvioController::programar()`
   - Según politica_pago

---

## 📊 REPORTES Y EXPORTACIONES DE ENTREGAS RECHAZADAS

### **Servicio Centralizado: ReportService**

Se ha implementado un **servicio centralizado** (`app/Services/ReportService.php`) que proporciona métodos para generar reportes y exportaciones en múltiples formatos.

#### **Métodos Disponibles**

**1. Obtener Entregas Rechazadas con Filtros**

```php
$reportService = app(ReportService::class);

$filtros = [
    'fecha_desde' => '2025-10-01',
    'fecha_hasta' => '2025-10-31',
    'tipo_rechazo' => 'CLIENTE_AUSENTE', // opcional
    'chofer_id' => 5, // opcional
];

$envios = $reportService->obtenerEnviosRechazados($filtros);
```

**2. Obtener Estadísticas de Rechazos**

```php
$stats = $reportService->estadisticasEntregasRechazadas();

// Retorna:
[
    'total_rechazadas' => 45,
    'cliente_ausente' => 20,
    'tienda_cerrada' => 15,
    'otro_problema' => 10,
    'tasa_rechazo_porcentaje' => 12.5,
    'ultimas_24_horas' => 3,
]
```

**3. Top Choferes con Más Rechazos**

```php
$topChoferes = $reportService->topChoforesRechazos(5); // Top 5

// Retorna Collection con: chofer_id, chofer_nombre, total_rechazos
```

**4. Exportar Entregas Rechazadas a Excel**

```php
// Con filtros
$filtros = [
    'fecha_desde' => '2025-10-01',
    'fecha_hasta' => '2025-10-31',
    'tipo_rechazo' => 'CLIENTE_AUSENTE',
];

$envios = $reportService->obtenerEnviosRechazados($filtros);
return $reportService->exportarEntregasRechazadasExcel($envios);
```

**Columnas en el Excel:**
- N° Envío
- Venta
- Cliente
- Chofer
- Tipo de Rechazo
- Motivo
- Fotos
- Fecha Intento
- Fecha Creación
- Observaciones

#### **Rutas Web para Reportes**

```php
// Todas las rutas están en routes/web.php con protección middleware

GET  /envios/export/pdf            - Exportar envios a PDF
GET  /envios/export/excel          - Exportar envios a Excel
GET  /envios/export/rechazadas     - Exportar solo entregas rechazadas
```

**Ejemplo de uso desde frontend:**

```html
<!-- Descargar reporte de rechazos en Excel -->
<a href="{{ route('envios.export-rechazadas', ['fecha_desde' => '2025-10-01', 'tipo_rechazo' => 'CLIENTE_AUSENTE']) }}"
   class="btn btn-danger">
   Descargar Entregas Rechazadas
</a>
```

#### **Documentación Completa**

Ver archivo: `DOCUMENTACION_REPORT_SERVICE.md` para:
- Ejemplos detallados de cada método
- Guía de extensión a otros módulos
- Testing con Postman
- Troubleshooting

---

## 🚀 IMPLEMENTACIÓN PASO A PASO

### **Fase 1: Modelos y Migraciones**

1. ✅ Crear migraciones para proformas, envíos, vehículos
2. ✅ Crear modelos con relaciones
3. ✅ Actualizar modelo Venta
4. ✅ Seeders para datos de prueba

### **Fase 2: Backend Core**

1. ✅ ProformaController completo (con WebSocket)
2. ✅ VentaController completo (con WebSocket)
3. ✅ EnvioController completo (con WebSocket)
4. ✅ API para app externa
5. ✅ Modificar flujo de stock
6. ✅ WebSocketNotificationService (CENTRAL)

### **Fase 3: Frontend Web**

1. ✅ Páginas de gestión de proformas
2. ✅ Dashboard de envíos
3. ✅ Panel de seguimiento
4. ⏳ Integración con módulo ventas (escuchar eventos WebSocket)
5. ⏳ Actualización en tiempo real de listados
6. ⏳ Notificaciones push en navegador

### **Fase 4: App Externa (Flutter)**

1. ✅ API endpoints completos
2. ✅ Documentación API
3. ✅ Testing de integración
4. ✅ Integración WebSocket para seguimiento en tiempo real
5. ⏳ Notificaciones push en dispositivo

### **Fase 5: Funciones Avanzadas**

1. ✅ Infraestructura WebSocket implementada
2. ⏳ Notificaciones push desde Node.js
3. ✅ Tracking GPS en tiempo real (ruta de envío)
4. ⏳ Reportes de logística
5. ⏳ Dashboard gerencial en tiempo real

---

## 📊 RESUMEN DE CAMBIOS

### Cambios Realizados (2025-10-25)

| Archivo | Cambios | Líneas |
|---------|---------|--------|
| `app/Http/Controllers/ProformaController.php` | ✅ Agregadas notificaciones WebSocket en aprobar(), rechazar(), convertirAVenta() | +40 |
| `app/Http/Controllers/VentaController.php` | ✅ Agregadas notificaciones WebSocket en store() y destroy() | +85 |
| `app/Http/Controllers/EnvioController.php` | ✅ Agregado método rechazarEntrega() para problemas de entrega con fotos | +80 |
| `app/Models/Envio.php` | ✅ Agregados campos y métodos para rechazos (estado_entrega, fotos_rechazo, motivo_rechazo) | +60 |
| `app/Services/ReportService.php` | ✅ **NUEVO** - Servicio centralizado con 8+ métodos para reportes y exportaciones | +250 |
| `app/Exports/EntregasRechazadasExport.php` | ✅ **NUEVO** - Export class especializada para entregas rechazadas con headers rojos | +137 |
| `routes/web.php` | ✅ Agregadas 3 rutas para exportar envios (PDF, Excel, Rechazadas) | +3 |
| `routes/api.php` | ✅ Verificado endpoint `/api/app/envios/{envio}/rechazar` | +1 |
| `documentaciones/SISTEMA_VENTAS_APP_EXTERNA.md` | ✅ Actualizada con canales Flutter, flujo rechazos, ejemplos JSON completos, reportes | +1900 |
| `DOCUMENTACION_REPORT_SERVICE.md` | ✅ **NUEVO** - Documentación completa del servicio de reportes | +400 |

### Métodos WebSocket Implementados

**ProformaController:**
- `notifyProformaApproved()` - Al aprobar proforma
- `notifyProformaRejected()` - Al rechazar proforma
- `notifyProformaConverted()` - Al convertir a venta

**VentaController:**
- `notifyUser()` - Notificación individual al crear venta
- `notifyRole()` - Notificación a managers sobre nueva venta
- `notifyUser()` - Notificación al cancelar venta
- `notifyRole()` - Notificación a managers sobre venta cancelada

**EnvioController (Actual):**
- ✅ 7 métodos de notificación ya existentes
- ✅ **NUEVO:** `rechazarEntrega()` - Maneja rechazos con fotos y motivos
  - Cliente ausente
  - Tienda cerrada
  - Otro problema
- ✅ Notificación a managers cuando se rechaza entrega
- ✅ **NUEVO:** `exportEntregasRechazadas()` - Exporta entregas rechazadas usando ReportService

**Modelo Envio (Nuevos Métodos):**
- `puedeRechazarEntrega()` - Validar si puede rechazarse
- `marcarClienteAusente()` - Marcar como cliente no presente
- `marcarTiendaCerrada()` - Marcar como tienda cerrada
- `marcarConProblema()` - Marcar con motivo personalizado
- `marcarComoEntregada()` - Marcar como entrega exitosa

### Servicio ReportService (Nuevos Métodos)

**Métodos de Exportación:**
- `exportarEnviosPdf()` - Exportar envios a PDF con filtros
- `exportarEnviosExcel()` - Exportar envios a Excel
- `exportarEntregasRechazadasExcel()` - Exportar solo entregas rechazadas con headers rojos

**Métodos de Consulta:**
- `obtenerEnviosRechazados()` - Obtener rechazos con filtros avanzados
- `estadisticasEntregasRechazadas()` - Estadísticas globales de rechazos
- `enviosPorEstado()` - Agrupado por todos los estados
- `topChoforesRechazos()` - Top N choferes con más rechazos

**Métodos Agregados:**
- `generarReporteCompleto()` - Reporte completo con todas las métricas

### Próximos Pasos Recomendados

1. **Frontend React (Dashboard Manager)**: Escuchar eventos WebSocket
   - ✅ Evento `entrega-rechazada` - Mostrar alerta con fotos y motivo
   - ✅ Ver fotos del rechazo en modal
   - ✅ Botón "Programar Reintento" para re-agendar entrega
   - ✅ Botón "Contactar Cliente" para comunicarse
   - Actualizar listado de envíos en tiempo real
   - Estadísticas de entregas rechazadas

2. **App Flutter (Chofer)**: Implementar captura de fotos y rechazo
   - ✅ Interfaz para tomar fotos (hasta 5)
   - ✅ Seleccionar tipo de rechazo (cliente ausente, tienda cerrada, otro)
   - ✅ Campo de motivo detallado si es "otro problema"
   - ✅ Enviar PUT `/api/envios/{id}/rechazar` con fotos y motivo
   - Confirmación de envío exitoso
   - Mostrar ubicación GPS en mapa durante ruta

3. **Migración de Base de Datos**: Agregar nuevos campos
   - ✅ **YA CREADA**: `database/migrations/2025_10_25_030126_add_rejection_fields_to_envios_table.php`
   - Campos agregados:
     - `estado_entrega` (varchar) - EXITOSA, CLIENTE_AUSENTE, TIENDA_CERRADA, OTRO_PROBLEMA
     - `motivo_rechazo` (text) - Descripción del problema
     - `fotos_rechazo` (json) - Array de rutas a fotos
     - `fecha_intento_entrega` (datetime) - Cuándo se intentó entregar
   - **Ejecutar ahora**: `php artisan migrate`

4. **Testing**: Verificar extremo a extremo
   - Probar rechazo de entrega desde Flutter con fotos
   - Verificar WebSocket notifica a managers
   - Verificar fotos se guardan correctamente
   - Testing de reintento de envío
   - Error handling si no hay conectividad

5. **Monitoreo y Reportes**: Implementar analytics
   - Dashboard de entregas rechazadas por día/semana/mes
   - Motivos más frecuentes de rechazo
   - Tasas de reintento exitoso
   - Tiempo promedio entre intento fallido y reintento
   - Logs de eventos para auditoría

---

## ✅ CHECKLIST DE VERIFICACIÓN PARA EQUIPO FLUTTER

### **Antes de Usar la API**

- [ ] **Servidor Backend activo**
  - [ ] Laravel está corriendo: `php artisan serve`
  - [ ] Node.js WebSocket está activo en puerto 3001

- [ ] **Base de datos actualizada**
  - [ ] Migración ejecutada: `php artisan migrate`
  - [ ] Tabla `envios` tiene columnas: `estado_entrega`, `fotos_rechazo`, `motivo_rechazo`, `fecha_intento_entrega`
  - [ ] **PENDIENTE:** Tabla `ventas` con campos de pago (monto_pagado, estado_pago, politica_pago)

- [ ] **Rutas API verificadas**
  - [ ] `PUT /api/app/envios/{envio}/rechazar` ✅ Existe
  - [ ] `GET /api/app/envios/{envio}/seguimiento` ✅ Existe
  - [ ] `GET /api/app/cliente/envios` ✅ Existe
  - [ ] **PENDIENTE:** `POST /api/app/proformas/{id}/confirmar`
  - [ ] **PENDIENTE:** `POST /api/app/ventas/{id}/pagos`

### **Integración WebSocket (App)**

- [ ] Dependencia `socket_io_client` instalada
- [ ] Conexión establece token Sanctum
- [ ] Reconexión automática configurada
- [ ] Listeners configurados para eventos:
  - [ ] `proforma-creada`
  - [ ] `proforma-aprobada`
  - [ ] `proforma-rechazada`
  - [ ] `proforma-convertida`
  - [ ] `envio-programado`
  - [ ] `envio-en-ruta`
  - [ ] `ubicacion-actualizada`
  - [ ] `envio-entregado`
  - [ ] `entrega-rechazada`
  - [ ] `stock-actualizado`
  - [ ] `pago-recibido`

### **Funcionalidad de Rechazo** ✅ (Implementado en Backend)

- [ ] UI para capturar tipo de rechazo (cliente_ausente / tienda_cerrada / otro_problema)
- [ ] Cámara para tomar hasta 5 fotos (máx 5MB cada)
- [ ] Campo de motivo personalizado si es "otro_problema"
- [ ] Validación de que envío está EN_RUTA antes de rechazar
- [ ] Envío del PUT `/api/app/envios/{envio}/rechazar` con multipart/form-data
- [ ] Manejo de respuesta exitosa (200)
- [ ] Manejo de errores (validación, permisos, etc)
- [ ] Feedback visual durante la carga
- [ ] Recibir notificación WebSocket cuando se registra

### **Funcionalidad de Pagos** ⏳ (Pendiente Backend)

- [ ] UI para solicitar proforma (5+ productos)
- [ ] Confirmar proforma aprobada (POST `/api/app/proformas/{id}/confirmar`)
- [ ] Ver estado de pago (monto_pagado, monto_pendiente)
- [ ] Registrar pago parcial (POST `/api/app/ventas/{id}/pagos`)
- [ ] Historial de pagos realizados
- [ ] Validación: No puede programar envío si no cumple política de pago

### **Seguimiento en Tiempo Real** ✅ (WebSocket)

- [ ] Escuchar `ubicacion-actualizada` cada 10 segundos
- [ ] Mapa actualiza ubicación en tiempo real
- [ ] Timestamp de última actualización mostrado
- [ ] ETA calculado correctamente
- [ ] Timeline de estado actualiza sin recargar
- [ ] Escuchar `entrega-rechazada` para alertar problemas
- [ ] Escuchar `envio-entregado` para confirmar

### **Testing Recomendado**

**Test 1: Rechazo por Cliente Ausente**
```
1. Obtener envío en estado EN_RUTA
2. Tomar 2 fotos
3. Seleccionar "Cliente Ausente"
4. Enviar PUT request
5. Verificar respuesta 200
6. Verificar WebSocket recibe "entrega-rechazada"
7. Verificar fotos se guardaron
```

**Test 2: Rechazo con Motivo Personalizado**
```
1. Obtener envío en estado EN_RUTA
2. Tomar 3 fotos
3. Seleccionar "Otro Problema"
4. Ingresar motivo: "Dirección no encontrada"
5. Enviar PUT request
6. Verificar respuesta 200
7. Verificar motivo se guardó
```

**Test 3: WebSocket Eventos**
```
1. Conectar a WebSocket
2. Emitir autenticación
3. Escuchar "ubicacion-actualizada"
4. Verificar datos cada 10 segundos
5. Desconectar y verificar reconexión automática
```

---

---

## 📋 RESUMEN EJECUTIVO - ESTADO FINAL

### ✅ COMPLETADO Y FUNCIONANDO

**Backend:**
- ✅ WebSocket real-time (Node.js + Socket.IO)
- ✅ API endpoints para proformas
- ✅ API endpoints para envíos con tracking
- ✅ Sistema de rechazo de entregas con fotos
- ✅ ReportService para reportes y exportaciones
- ✅ Modelo Pago base implementado

**Frontend (React Web):**
- ✅ Notificaciones WebSocket en tiempo real
- ✅ Dashboard de gestión de entregas
- ✅ Visualización de rechazos con fotos

### 🔄 EN PROCESO - Extensión para App Flutter

- ⏳ Campos en tabla `ventas` para pagos
- ⏳ Endpoint confirmar proforma
- ⏳ Endpoint registrar pagos
- ⏳ Validación de 5 productos mínimo

### ⏭️ NO SERÁ IMPLEMENTADO

- ❌ FCM (Notificaciones Push) - Usando solo WebSocket

---

**Última Actualización:** 2025-10-25
**Versión:** 2.0 (Con Sistema de Rechazo, ReportService y Guía Completa)
**Mantenedor:** Equipo Backend
**Estado:** ✅ 80% Completo - Listo para Presentación, Falta Extensión de Pagos para Flutter
