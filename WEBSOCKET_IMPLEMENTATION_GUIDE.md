# WebSocket Implementation Guide

Guía completa para usar WebSocket en tiempo real en la aplicación de logística (Distribuidora Paucara).

## 📋 Tabla de Contenidos

1. [Arquitectura General](#arquitectura-general)
2. [Backend - Laravel](#backend---laravel)
3. [Frontend - React](#frontend---react)
4. [Mobile - Flutter](#mobile---flutter)
5. [Testing](#testing)
6. [Solución de Problemas](#solución-de-problemas)

---

## 🏗️ Arquitectura General

```
┌─────────────────────────────────────────────────────────────┐
│                    WebSocket Server (Node.js)               │
│              Socket.IO 4.7.5 @ localhost:3001               │
├─────────────────────────────────────────────────────────────┤
│  • Maneja conexiones en tiempo real                          │
│  • Retransmite eventos de Laravel a clientes                │
│  • Gestiona canales privados                                │
└─────────────────────────────────────────────────────────────┘
         ↑         ↑                    ↑                ↑
         │         │                    │                │
         │    Laravel          React Web              Flutter App
         │   (Backend)      (Web Frontend)           (Mobile)
         │
    HTTP Broadcasting      Socket.IO Client      Socket.IO Client
```

### Canales Disponibles

- **`entrega.{id}`** - Eventos específicos de una entrega
  - `ubicacion.actualizada` - Nueva ubicación del chofer
  - `entrega.estado-cambio` - Cambio de estado
  - `chofer.en-camino` - Chofer en ruta
  - `chofer.llegada` - Chofer llegó
  - `pedido.entregado` - Entrega confirmada
  - `novedad.reportada` - Incidencia reportada

- **`pedido.{id}`** - Eventos de proformas/órdenes
  - `proforma.aprobada` - Proforma fue aprobada
  - `proforma.rechazada` - Proforma fue rechazada

- **`admin.pedidos`** - Canal de administrador
  - Todos los eventos de órdenes

---

## 🔧 Backend - Laravel

### Configuración

**Archivo:** `config/broadcasting.php`

```php
'socket-io' => [
    'driver' => 'pusher',
    'key' => env('PUSHER_APP_KEY', 'key'),
    'secret' => env('PUSHER_APP_SECRET', 'secret'),
    'app_id' => env('PUSHER_APP_ID', '1'),
    'options' => [
        'cluster' => env('PUSHER_APP_CLUSTER', 'mt1'),
        'scheme' => env('PUSHER_SCHEME', 'http'),
        'host' => env('PUSHER_HOST', 'localhost'),
        'port' => env('PUSHER_PORT', 3001),
        'path' => env('PUSHER_PATH', '/api/broadcast'),
    ],
],
```

**Archivo:** `.env`

```env
BROADCAST_DRIVER=socket-io
BROADCAST_CONNECTION=socket-io
WEBSOCKET_URL=http://localhost:3001
WEBSOCKET_ENABLED=true
WEBSOCKET_DEBUG=true
```

### Emitir Eventos desde Laravel

**Ejemplo:** Registrar ubicación de entrega

```php
// app/Http/Controllers/Api/EntregaController.php

use App\Events\UbicacionActualizada;

public function registrarUbicacion(Request $request, int $entregaId)
{
    // ... validar y guardar ubicación ...

    $ubicacion = UbicacionTracking::create([
        'entrega_id' => $entregaId,
        'latitud' => $request->latitud,
        'longitud' => $request->longitud,
        'velocidad' => $request->velocidad,
    ]);

    // Emitir evento para WebSocket
    UbicacionActualizada::dispatch($ubicacion);

    return response()->json(['success' => true, 'data' => $ubicacion]);
}
```

**Definir Evento:**

```php
// app/Events/UbicacionActualizada.php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;

class UbicacionActualizada implements ShouldBroadcast
{
    public $ubicacion;

    public function __construct($ubicacion)
    {
        $this->ubicacion = $ubicacion;
    }

    public function broadcastOn()
    {
        return new Channel("entrega.{$this->ubicacion->entrega_id}");
    }

    public function broadcastAs()
    {
        return 'ubicacion.actualizada';
    }

    public function broadcastWith()
    {
        return [
            'id' => $this->ubicacion->id,
            'entrega_id' => $this->ubicacion->entrega_id,
            'latitud' => $this->ubicacion->latitud,
            'longitud' => $this->ubicacion->longitud,
            'velocidad' => $this->ubicacion->velocidad,
            'timestamp' => $this->ubicacion->created_at->toIso8601String(),
        ];
    }
}
```

---

## ⚛️ Frontend - React

### 1. WebSocketService

**Ubicación:** `resources/js/infrastructure/services/websocket.service.ts`

Servicio singleton para manejar la conexión WebSocket con Socket.IO.

**Métodos principales:**
- `connect(config)` - Conectar al servidor
- `subscribeTo(channel)` - Suscribirse a un canal
- `unsubscribeFrom(channel)` - Desuscribirse
- `on(event, callback)` - Escuchar evento
- `off(event, callback)` - Dejar de escuchar
- `emit(event, data)` - Emitir evento al servidor

### 2. Hooks Personalizados

#### `useWebSocket()`

Hook genérico para manejar la conexión WebSocket.

```typescript
import { useWebSocket } from '@/application/hooks/use-websocket';

function MyComponent() {
    const {
        status,
        isConnected,
        socketId,
        error,
        connect,
        disconnect,
        subscribeTo,
        on,
        off,
        emit
    } = useWebSocket({
        autoConnect: true,
        channels: ['entrega.123']
    });

    return (
        <div>
            <p>Estado: {status}</p>
            {isConnected && <p>✓ Conectado: {socketId}</p>}
            {error && <p>❌ Error: {error}</p>}
        </div>
    );
}
```

#### `useTracking()`

Hook especializado para rastreo de entregas.

```typescript
import { useTracking } from '@/application/hooks/use-tracking';

function DeliveryMapComponent({ entregaId }) {
    const {
        ubicacion,
        estadoActual,
        novedades,
        isTracking,
        startTracking,
        stopTracking
    } = useTracking({
        entregaId,
        autoSubscribe: true
    });

    return (
        <div>
            {ubicacion && (
                <div>
                    <p>Lat: {ubicacion.latitud}, Lng: {ubicacion.longitud}</p>
                    {ubicacion.velocidad && <p>Velocidad: {ubicacion.velocidad} km/h</p>}
                </div>
            )}
            <p>Estado: {estadoActual}</p>
            {novedades.map((n, i) => (
                <div key={i}>{n.descripcion}</div>
            ))}
        </div>
    );
}
```

#### `useRealtimeNotifications()`

Hook para mostrar notificaciones en tiempo real.

```typescript
import { useRealtimeNotifications } from '@/application/hooks/use-realtime-notifications';

function NotificationBell() {
    const { notifications, unreadCount, markAsRead, clearNotifications } =
        useRealtimeNotifications({
            enableAutoNotify: true,
            autoSubscribeAdmin: true // Solo si es admin
        });

    return (
        <div>
            {unreadCount > 0 && (
                <span className="badge">{unreadCount} nuevas</span>
            )}
            {notifications.map(n => (
                <div
                    key={n.id}
                    onClick={() => markAsRead(n.id)}
                >
                    {n.title}: {n.message}
                </div>
            ))}
        </div>
    );
}
```

### 3. Componentes Reutilizables

#### `DeliveryTrackingCard`

Componente para mostrar el rastreo de una entrega.

```typescript
import { DeliveryTrackingCard } from '@/presentation/components/logistica/delivery-tracking-card';

<DeliveryTrackingCard
    entregaId={123}
    entregaNumero="ENT-001"
    clienteNombre="Acme Corp"
    onLocationUpdate={(location) => {
        // Actualizar mapa, base de datos, etc.
    }}
/>
```

### 4. Integración en Páginas Existentes

**Ejemplo:** Actualizar `entregas-en-transito.tsx`

```typescript
import { useTracking } from '@/application/hooks/use-tracking';
import { useRealtimeNotifications } from '@/application/hooks/use-realtime-notifications';

export default function EntregasEnTransito() {
    const { isConnected } = useTracking({ autoSubscribe: false });
    const { unreadCount } = useRealtimeNotifications({
        enableAutoNotify: true
    });

    return (
        <div>
            <div className="header">
                <h1>Entregas en Tránsito</h1>
                {isConnected ? (
                    <span className="badge-success">✓ WebSocket En Vivo</span>
                ) : (
                    <span className="badge-error">✗ WebSocket Desconectado</span>
                )}
                {unreadCount > 0 && (
                    <span className="badge-warning">🔔 {unreadCount} notificaciones</span>
                )}
            </div>
            {/* Resto del componente */}
        </div>
    );
}
```

---

## 📱 Mobile - Flutter

### 1. WebSocketService

**Ubicación:** `lib/services/websocket_service.dart`

Servicio singleton para manejar WebSocket con `web_socket_channel`.

### 2. TrackerProvider

**Ubicación:** `lib/providers/tracker_provider.dart`

Provider para gestionar el estado de rastreo en tiempo real.

```dart
class TrackerProvider with ChangeNotifier {
    bool get isConnected => _isConnected;
    LocationData? getLocation(int entregaId) => _currentLocations[entregaId];
    String? getDeliveryStatus(int entregaId) => _deliveryStatus[entregaId];
    List<LocationData> getLocationHistory(int entregaId) => _locationHistory[entregaId] ?? [];

    Future<void> initializeWebSocket({
        required String token,
        String? url,
        int? userId,
    }) async { ... }

    void subscribeToDelivery(int entregaId) { ... }
    void unsubscribeFromDelivery(int entregaId) { ... }
}
```

### 3. Configuración en la App

**Ejemplo:** `main.dart`

```dart
import 'package:provider/provider.dart';
import 'lib/providers/tracker_provider.dart';

void main() {
    runApp(
        MultiProvider(
            providers: [
                ChangeNotifierProvider(
                    create: (_) => TrackerProvider(),
                ),
            ],
            child: MyApp(),
        ),
    );
}
```

### 4. Usar en Screens

**Ejemplo:** Pantalla de rastreo de entrega

```dart
class DeliveryTrackingScreen extends StatefulWidget {
    final int entregaId;

    @override
    State<DeliveryTrackingScreen> createState() => _DeliveryTrackingScreenState();
}

class _DeliveryTrackingScreenState extends State<DeliveryTrackingScreen> {
    @override
    void initState() {
        super.initState();

        final trackerProvider = Provider.of<TrackerProvider>(
            context,
            listen: false,
        );

        // Suscribirse a esta entrega
        trackerProvider.subscribeToDelivery(widget.entregaId);
    }

    @override
    void dispose() {
        final trackerProvider = Provider.of<TrackerProvider>(
            context,
            listen: false,
        );

        // Desuscribirse al salir
        trackerProvider.unsubscribeFromDelivery(widget.entregaId);
        super.dispose();
    }

    @override
    Widget build(BuildContext context) {
        return Consumer<TrackerProvider>(
            builder: (context, tracker, _) {
                final location = tracker.getLocation(widget.entregaId);
                final status = tracker.getDeliveryStatus(widget.entregaId);

                return Column(
                    children: [
                        // Indicador de conexión
                        if (tracker.isConnected)
                            Container(
                                padding: EdgeInsets.all(8),
                                color: Colors.green,
                                child: Text('✓ En vivo'),
                            )
                        else
                            Container(
                                padding: EdgeInsets.all(8),
                                color: Colors.red,
                                child: Text('✗ Desconectado'),
                            ),

                        // Ubicación actual
                        if (location != null)
                            MapWidget(
                                latitude: location.latitud,
                                longitude: location.longitud,
                            ),

                        // Estado
                        if (status != null)
                            Text('Estado: $status'),

                        // Historial de ubicaciones
                        ListView.builder(
                            itemCount: tracker.getLocationHistory(widget.entregaId).length,
                            itemBuilder: (context, index) {
                                final loc = tracker.getLocationHistory(widget.entregaId)[index];
                                return ListTile(
                                    title: Text('${loc.latitud}, ${loc.longitud}'),
                                    subtitle: Text(loc.timestamp.toString()),
                                );
                            },
                        ),

                        // Notas
                        ListView.builder(
                            itemCount: tracker.getDeliveryNotes(widget.entregaId).length,
                            itemBuilder: (context, index) {
                                final note = tracker.getDeliveryNotes(widget.entregaId)[index];
                                return ListTile(
                                    title: Text(note),
                                );
                            },
                        ),
                    ],
                );
            },
        );
    }
}
```

---

## 🧪 Testing

### 1. Testing en Postman/Insomnia

**Simular evento de Laravel:**

```
POST http://localhost:3001/api/broadcast
Content-Type: application/json

{
    "channels": ["entrega.123"],
    "event": "ubicacion.actualizada",
    "data": {
        "entrega_id": 123,
        "latitud": -16.5,
        "longitud": -68.15,
        "velocidad": 45.5,
        "timestamp": "2025-01-15T10:30:00Z"
    }
}
```

**Respuesta esperada:**

```json
{
    "success": true,
    "message": "Evento retransmitido exitosamente",
    "channels": ["entrega.123"],
    "event": "ubicacion.actualizada",
    "timestamp": "2025-01-15T10:30:00Z"
}
```

### 2. Testing en el Navegador (React)

Abrir consola del navegador y verificar:

```javascript
// Verificar conexión
console.log(websocketService.isSocketConnected());

// Escuchar evento
websocketService.on('ubicacion.actualizada', (data) => {
    console.log('📍 Nueva ubicación:', data);
});

// Emitir evento de prueba
websocketService.emit('test-event', { test: true });
```

### 3. Testing en Flutter

```dart
// Inicializar WebSocket (en main o en un LoginScreen)
final tracker = Provider.of<TrackerProvider>(context, listen: false);
await tracker.initializeWebSocket(
    token: authToken,
    url: 'ws://192.168.1.100:3001',
);

// Suscribirse a una entrega
tracker.subscribeToDelivery(123);

// Monitorear cambios
print(tracker.getLocation(123)); // LocationData
print(tracker.getDeliveryStatus(123)); // "en_camino"
print(tracker.getDeliveryNotes(123)); // ["Nota 1", "Nota 2"]
```

---

## 🔍 Solución de Problemas

### WebSocket no se conecta

**Problema:** `Unable to connect to WebSocket server`

**Solución:**
1. Verificar que el servidor Node.js esté corriendo: `npm run dev` en `./websocket`
2. Verificar la URL en `.env`: `WEBSOCKET_URL=http://localhost:3001`
3. Verificar firewall/puertos
4. Check browser console para ver el error exacto

### No recibe eventos de Laravel

**Problema:** Broadcasting funciona pero el WebSocket no recibe eventos

**Solución:**
1. Verificar que `BROADCAST_DRIVER=socket-io` en `.env`
2. Verificar que el evento implementa `ShouldBroadcast`
3. Verificar que `broadcastAs()` retorna el nombre correcto
4. Probar manualmente con Postman al endpoint `/api/broadcast`

### Pérdida de conexión

**Problema:** Se desconecta frecuentemente

**Solución:**
1. Aumentar `reconnectionDelayMax` en la configuración
2. Verificar que el servidor Node.js tenga suficientes recursos
3. Usar "ping/pong" para mantener la conexión viva
4. Implementar reconexión automática (ya incluida en los servicios)

### Eventos retrasados

**Problema:** Los eventos llegan con retraso

**Solución:**
1. Reducir latencia de red
2. Verificar que no hay muchas suscripciones simultáneas
3. Optimizar el procesamiento de eventos en los listeners
4. Usar `debounce` si necesario en React

---

## 📚 Referencias

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Laravel Broadcasting](https://laravel.com/docs/broadcasting)
- [React Hooks Documentation](https://react.dev/reference/react)
- [Flutter Provider Pattern](https://pub.dev/packages/provider)

---

## ✅ Checklist de Implementación

### Backend (Laravel)
- [ ] Configurar `config/broadcasting.php` con conexión socket-io
- [ ] Configurar variables de ambiente en `.env`
- [ ] Crear eventos que implementan `ShouldBroadcast`
- [ ] Llamar a `Event::dispatch()` en los controladores
- [ ] Probar con Postman

### Frontend (React)
- [ ] Instalar dependencias: `npm install socket.io-client`
- [ ] Copiar `websocket.service.ts`
- [ ] Crear hooks: `use-websocket.ts`, `use-tracking.ts`, `use-realtime-notifications.ts`
- [ ] Integrar en componentes existentes
- [ ] Probar conexión en consola del navegador

### Mobile (Flutter)
- [ ] Agregar dependencia: `web_socket_channel`
- [ ] Copiar `websocket_service.dart`
- [ ] Crear `tracker_provider.dart`
- [ ] Agregar provider en `main.dart`
- [ ] Integrar en screens
- [ ] Probar en emulador/dispositivo

---

**Última actualización:** 2025-01-15
**Versión:** 1.0.0
