# 🔌 ARQUITECTURA WEBSOCKET - COMUNICACIÓN EN TIEMPO REAL

**Versión:** 2.0
**Fecha de actualización:** 31 de Octubre de 2025
**Plataforma:** Node.js + Socket.IO (./websocket/)
**Tecnologías:** Laravel Broadcasting, Echo (Flutter/React)
**Estado:** ⚠️ Servidor implementado, integración parcial

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Arquitectura de WebSocket](#arquitectura-de-websocket)
3. [Servidor Node.js (./websocket/)](#servidor-nodejs)
4. [Eventos y Canales](#eventos-y-canales)
5. [Integración Backend (Laravel)](#integración-backend)
6. [Integración Frontend (React)](#integración-frontend)
7. [Integración Frontend (Flutter)](#integración-frontend-flutter)
8. [Flujo de Mensajes](#flujo-de-mensajes)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## 1. VISIÓN GENERAL

### 1.1 ¿Por qué WebSocket?

**Sin WebSocket (Polling):**
```
Cliente         Backend
   │               │
   ├─ Cada 5s ────→ ¿Cambio de estado?
   │               │
   │ ← Sí/No ──────┤
   │               │
   │ (ineficiente, lento, consume batería)
```

**Con WebSocket:**
```
Cliente         Backend
   │               │
   ├─ Conectar ────→ │
   │               │
   │ ← Evento ─────┤ (instáneo, bidireccional)
   │ ← Evento ─────┤
   │ ← Evento ─────┤
```

### 1.2 Beneficios en Logística

- **Tracking en tiempo real:** Chofer se mueve → Cliente ve actualizado en <2 segundos
- **Notificaciones instantáneas:** "Chofer llegó" aparece al instante
- **Baja latencia:** Sin delays de polling
- **Eficiencia:** Menos requests a servidor, menos batería en móvil

### 1.3 Componentes

```
┌─────────────────────────────────────────────────────┐
│          SERVIDOR WEBSOCKET (Node.js)               │
│     ./websocket/server.js con Socket.IO             │
│  - Escucha conexiones de clientes                   │
│  - Maneja canales (pedido.123, entrega.456, etc.)   │
│  - Retransmite eventos a suscriptores               │
└─────────────────────────────────────────────────────┘
        ↑                                   ↑
        │                                   │
        │                                   │
┌───────┴──────────┐          ┌────────────┴──────────┐
│  BACKEND LARAVEL │          │  FRONTEND (React/Flutter)  │
│  Broadcasting    │          │  WebSocket Client         │
│  (API + Eventos) │          │  (Escucha eventos)        │
└──────────────────┘          └───────────────────────────┘
```

---

## 2. ARQUITECTURA DE WEBSOCKET

### 2.1 Flujo General

```
1. Cliente conecta a WebSocket
2. Envía: { auth: token }
3. Servidor valida token
4. Si válido: autorizar y mantener conexión
5. Cliente se suscribe a canales: pedido.123, entrega.456
6. Servidor recibe request de:
   POST /api/chofer/entregas/123/ubicacion
7. Backend Laravel dispara evento: new UbicacionActualizada()
8. Laravel Broadcasting envía evento al servidor WebSocket
9. WebSocket entrega evento a todos los suscritos en canal: entrega.123
10. React y Flutter reciben evento simultáneamente
11. UI se actualiza en tiempo real
```

### 2.2 Canales (Channels)

Los **canales** son grupos de conexiones que reciben ciertos eventos:

```
pedido.{proformaId}
├─ Cliente que creó la proforma
└─ Eventos: ProformaAprobada, EstadoCambiado, ChoferEnCamino, etc.

entrega.{entregaId}
├─ Cliente
├─ Chofer
├─ Admin (React)
└─ Eventos: UbicacionActualizada, ChoferLlego, PedidoEntregado

chofer.{choferId}
├─ Solo el chofer
└─ Eventos: EntregaAsignada, nuevas notificaciones

admin.pedidos
├─ Todos los admins/encargados
└─ Eventos: NuevaProforma, ProformaAprobada, NovedadReportada
```

### 2.3 Tipos de Canales

| Tipo | Privacidad | Uso | Ejemplo |
|------|-----------|-----|---------|
| **Public** | Cualquiera | No usar en logística | broadcast('mi-canal') |
| **Private** | Solo autenticados | Datos sensibles | broadcast(new Event())->toOthers() |
| **Presence** | + tracking de usuarios | Chat, colaboración | presence-channel |

---

## 3. SERVIDOR NODE.JS (./websocket/)

### 3.1 Estado Actual ✅

**Ubicación:** `/d/paucara/distribuidora-paucara/websocket/`

**Archivos:**
```
websocket/
├── server.js ✅
├── package.json ✅
├── .env ✅
├── src/
│   ├── config/
│   │   ├── cors.config.js ✅
│   │   └── socket.config.js ✅
│   ├── controllers/
│   │   └── socket.controller.js ✅
│   ├── repositories/
│   │   └── socket.repository.js ✅
│   ├── routes/
│   │   └── index.js ✅
│   └── utils/
│       └── network-utils.js ✅
└── documentacion/ ✅ (existe)
```

**Stack:**
- Node.js 16+
- Express.js
- Socket.IO 4.7.5
- CORS

### 3.2 Configuración

```bash
# ./websocket/.env

PORT=3001
WEBSOCKET_PORT=3001
WEBSOCKET_HOST=0.0.0.0

# Para desarrollo local
WEBSOCKET_URL=http://localhost:3001

# Para producción
# WEBSOCKET_URL=https://tu-dominio.com

# Tiempos
SOCKET_PING_TIMEOUT=30000
SOCKET_PING_INTERVAL=10000
```

### 3.3 Iniciar Servidor

```bash
# Instalación
cd websocket/
npm install

# Desarrollo (con auto-reload)
npm run dev

# Producción
npm start

# El servidor escucha en http://localhost:3001
```

### 3.4 Eventos del Servidor

```javascript
// server.js - Ya implementado

io.on('connection', (socket) => {
  console.log(`Cliente conectado: ${socket.id}`);

  // Evento: Cliente se suscribe a canal
  socket.on('subscribe', (data) => {
    const { channel, auth_token } = data;
    // Validar token
    // Agregar socket a room del canal
    socket.join(`${channel}`);
  });

  // Evento: Cliente se desuscribe
  socket.on('unsubscribe', (data) => {
    const { channel } = data;
    socket.leave(channel);
  });

  // Evento: Disconnect
  socket.on('disconnect', () => {
    console.log(`Cliente desconectado: ${socket.id}`);
  });
});
```

### 3.5 Broadcasting desde Laravel

```php
// Backend Laravel dispara evento

// 1. En cualquier controller
Event::dispatch(new UbicacionActualizada($ubicacion));

// 2. El evento implementa ShouldBroadcast
class UbicacionActualizada implements ShouldBroadcast {
    public function broadcastOn() {
        return new PrivateChannel('entrega.' . $this->entrega->id);
    }

    public function broadcastAs() {
        return 'ubicacion.actualizada';
    }

    public function broadcastWith() {
        return [
            'latitud' => $this->ubicacion->latitud,
            'longitud' => $this->ubicacion->longitud,
            'velocidad' => $this->ubicacion->velocidad,
            'timestamp' => $this->ubicacion->timestamp,
        ];
    }
}

// 3. Laravel Broadcasting envía al servidor WebSocket
// (Reverb o Pusher configurado en config/broadcasting.php)

// 4. WebSocket retransmite a todos los suscriptores del canal
```

---

## 4. EVENTOS Y CANALES

### 4.1 Mapa Completo de Eventos

| # | Evento | Canal | Origen | Destino | Datos |
|---|--------|-------|--------|---------|-------|
| 1 | `proforma.aprobada` | `pedido.{id}` | Backend | Cliente + Admin | número, estado |
| 2 | `proforma.rechazada` | `pedido.{id}` | Backend | Cliente | motivo |
| 3 | `entrega.asignada` | `entrega.{id}` + `chofer.{id}` | Backend | Cliente + Chofer | chofer, camión |
| 4 | `chofer.en_camino` | `pedido.{id}` | Backend | Cliente | ETA |
| 5 | `ubicacion.actualizada` | `entrega.{id}` | Backend | Cliente + Admin | lat, lng, velocidad |
| 6 | `chofer.llego` | `pedido.{id}` | Backend | Cliente | timestamp |
| 7 | `pedido.entregado` | `pedido.{id}` + `admin.pedidos` | Backend | Cliente + Admin | firma, fotos |
| 8 | `novedad.reportada` | `pedido.{id}` + `admin.pedidos` | Backend | Cliente + Admin | motivo, descripción |
| 9 | `proforma.nueva` | `admin.pedidos` | Backend | Admin | número, cliente, total |

### 4.2 Ejemplo: Evento `ubicacion.actualizada`

**Backend (Laravel):**
```php
// app/Events/UbicacionActualizada.php

class UbicacionActualizada implements ShouldBroadcast {
    public $ubicacion;
    public $entrega;

    public function __construct(UbicacionTracking $ubicacion) {
        $this->ubicacion = $ubicacion;
        $this->entrega = $ubicacion->entrega;
    }

    public function broadcastOn() {
        return new PrivateChannel('entrega.' . $this->entrega->id);
    }

    public function broadcastAs() {
        return 'ubicacion.actualizada';
    }

    public function broadcastWith() {
        return [
            'entrega_id' => $this->entrega->id,
            'latitud' => $this->ubicacion->latitud,
            'longitud' => $this->ubicacion->longitud,
            'velocidad' => $this->ubicacion->velocidad,
            'rumbo' => $this->ubicacion->rumbo,
            'timestamp' => $this->ubicacion->timestamp,
            'evento' => $this->ubicacion->evento,
        ];
    }
}

// En ChoferController
public function registrarUbicacion(Request $request, Entrega $entrega) {
    $ubicacion = UbicacionTracking::create([
        'entrega_id' => $entrega->id,
        'chofer_id' => auth()->user()->chofer->id,
        'latitud' => $request->latitud,
        'longitud' => $request->longitud,
        // ... resto de campos
    ]);

    // Dispara el evento
    Event::dispatch(new UbicacionActualizada($ubicacion));

    return response()->json(['success' => true]);
}
```

**Frontend (Cliente recibe):**
```dart
// lib/providers/tracking_provider.dart

void suscribirseATracking(int entregaId) {
  final wsService = WebSocketService();
  wsService.conectar();

  // Escuchar evento
  wsService.on('ubicacion.actualizada', (data) {
    print('Ubicación actualizada: ${data['latitud']}, ${data['longitud']}');

    // Actualizar estado
    _ubicacionActual = UbicacionTracking.fromJson(data);
    _distanciaEstimada = _calcularDistancia(
      data['latitud'],
      data['longitud'],
      widget.destinoLatitud,
      widget.destinoLongitud,
    );

    notifyListeners(); // Rebuilds widget
  });
}
```

---

## 5. INTEGRACIÓN BACKEND (Laravel)

### 5.1 Configuración Broadcasting

```php
// config/broadcasting.php

'default' => env('BROADCAST_DRIVER', 'pusher'),

'connections' => [
    'pusher' => [
        'driver' => 'pusher',
        'key' => env('PUSHER_APP_KEY'),
        'secret' => env('PUSHER_APP_SECRET'),
        'app_id' => env('PUSHER_APP_ID'),
    ],

    // O usar Laravel Reverb (alternativa local)
    'reverb' => [
        'driver' => 'reverb',
        'host' => env('REVERB_HOST', 'localhost'),
        'port' => env('REVERB_PORT', 8080),
    ],
],
```

### 5.2 Definir Canales

```php
// routes/channels.php

use Illuminate\Support\Facades\Broadcast;
use Illuminate\Support\Facades\Auth;

// Canal privado para cada pedido
Broadcast::channel('pedido.{proformaId}', function ($user, $proformaId) {
    $proforma = Proforma::find($proformaId);
    return Auth::check() && (
        $user->id === $proforma->cliente_id ||  // Cliente que creó
        $user->hasRole(['admin', 'encargado'])   // Admins
    );
});

// Canal privado para cada entrega
Broadcast::channel('entrega.{entregaId}', function ($user, $entregaId) {
    $entrega = Entrega::find($entregaId);
    return Auth::check() && (
        $user->id === $entrega->proforma->cliente_id ||     // Cliente
        $user->id === $entrega->chofer->user_id ||          // Chofer
        $user->hasRole(['admin', 'encargado'])              // Admin
    );
});

// Canal privado para el chofer
Broadcast::channel('chofer.{choferId}', function ($user, $choferId) {
    $chofer = Chofer::find($choferId);
    return Auth::check() && $user->id === $chofer->user_id;
});

// Canal para admin
Broadcast::channel('admin.pedidos', function ($user) {
    return Auth::check() && $user->hasRole(['admin', 'encargado']);
});
```

### 5.3 Crear Eventos

```bash
# Generar evento
php artisan make:event UbicacionActualizada
php artisan make:event ProformaAprobada
php artisan make:event ChoferEnCamino
# ... más eventos
```

### 5.4 Disparar Eventos en Controllers

```php
// En app/Http/Controllers/Api/EntregaController.php o ChoferController.php

use App\Events\UbicacionActualizada;
use App\Events\ChoferEnCamino;
use Illuminate\Support\Facades\Event;

class ChoferController extends Controller {

    public function registrarUbicacion(Request $request, Entrega $entrega) {
        $ubicacion = UbicacionTracking::create([
            'entrega_id' => $entrega->id,
            'chofer_id' => auth()->user()->chofer->id,
            'latitud' => $request->latitud,
            'longitud' => $request->longitud,
            // ...
        ]);

        // ✨ ESTO DISPARA EL EVENTO AL WEBSOCKET
        Event::dispatch(new UbicacionActualizada($ubicacion));

        return response()->json(['success' => true]);
    }

    public function iniciarRuta(Request $request, Entrega $entrega) {
        $entrega->update(['estado' => 'EN_CAMINO', 'fecha_inicio' => now()]);

        // ✨ DISPARA EVENTO
        Event::dispatch(new ChoferEnCamino($entrega));

        return response()->json(['success' => true]);
    }
}
```

---

## 6. INTEGRACIÓN FRONTEND (React)

### 6.1 Conectar WebSocket en React

```tsx
// lib/services/websocketService.ts

import { io } from 'socket.io-client';

class WebSocketService {
  private socket: any;
  private url: string;
  private token: string | null = null;

  constructor(url: string = 'http://localhost:3001') {
    this.url = url;
  }

  connect(token: string) {
    this.token = token;

    this.socket = io(this.url, {
      auth: {
        token: token,
      },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      reconnectionDelayMax: 5000,
    });

    this.socket.on('connect', () => {
      console.log('Conectado al WebSocket');
    });

    this.socket.on('disconnect', () => {
      console.log('Desconectado del WebSocket');
    });

    this.socket.on('error', (error: any) => {
      console.error('Error WebSocket:', error);
    });
  }

  subscribir(canal: string) {
    this.socket?.emit('subscribe', {
      channel: canal,
      auth_token: this.token,
    });
  }

  desuscribir(canal: string) {
    this.socket?.emit('unsubscribe', {
      channel: canal,
    });
  }

  on(evento: string, callback: (data: any) => void) {
    this.socket?.on(evento, callback);
  }

  disconnect() {
    this.socket?.disconnect();
  }
}

export default WebSocketService;
```

### 6.2 Hook Personalizado (React)

```tsx
// lib/hooks/useTracking.ts

import { useEffect, useState } from 'react';
import WebSocketService from '@/services/websocketService';

export function useTracking(entregaId: number) {
  const [ubicacion, setUbicacion] = useState(null);
  const [conectado, setConectado] = useState(false);
  const wsService = new WebSocketService();

  useEffect(() => {
    // Conectar al montar
    wsService.connect(localStorage.getItem('auth_token') || '');

    // Suscribirse al canal
    wsService.subscribir(`entrega.${entregaId}`);

    // Escuchar evento
    wsService.on('ubicacion.actualizada', (data) => {
      console.log('Ubicación actualizada:', data);
      setUbicacion(data);
    });

    setConectado(true);

    // Limpiar al desmontar
    return () => {
      wsService.desuscribir(`entrega.${entregaId}`);
      wsService.disconnect();
    };
  }, [entregaId]);

  return { ubicacion, conectado };
}
```

### 6.3 Usar en Componente

```tsx
// pages/logistica/entregas-transito-mapa.tsx

import { useTracking } from '@/hooks/useTracking';

export function EntregasTransitoMapa({ entregas }: Props) {
  const { ubicacion, conectado } = useTracking(entregaId);

  useEffect(() => {
    if (ubicacion) {
      // Actualizar pin del camión en el mapa
      actualizarPinEnMapa(ubicacion.latitud, ubicacion.longitud);
    }
  }, [ubicacion]);

  return (
    <div>
      {conectado ? <span>🟢 En vivo</span> : <span>🔴 Offline</span>}
      <MapContainer>
        {/* Pins, etc */}
      </MapContainer>
    </div>
  );
}
```

---

## 7. INTEGRACIÓN FRONTEND (Flutter)

### 7.1 WebSocketService (Existente) ✅

```dart
// lib/services/websocket_service.dart

class WebSocketService {
  late Echo echo;
  final String url;
  final String token;

  WebSocketService({
    required this.url,
    required this.token,
  });

  Future<void> connect() async {
    echo = Echo(
      broadcaster: 'pusher',
      client: PusherClient(
        'app-key',
        AuthProvider.to.user!.email,
        authEndpoint: 'http://localhost:8000/broadcasting/auth',
        cluster: 'mt1',
      ),
    );
  }

  void escucharPedido(int pedidoId, Function(dynamic) callback) {
    echo.private('pedido.$pedidoId').listen('.*', (event) {
      callback(event);
    });
  }

  void escucharEntrega(int entregaId, Function(dynamic) callback) {
    echo.private('entrega.$entregaId').listen('.*', (event) {
      callback(event);
    });
  }

  void desuscribirse(int id) {
    echo.leave('pedido.$id');
    echo.leave('entrega.$id');
  }
}
```

### 7.2 Usar en Provider

```dart
// lib/providers/tracking_provider.dart

class TrackingProvider extends ChangeNotifier {
  late WebSocketService _wsService;
  UbicacionTracking? _ubicacionActual;

  void suscribirseATracking(int entregaId) {
    _wsService.escucharEntrega(entregaId, _onUbicacionActualizada);
  }

  void _onUbicacionActualizada(dynamic event) {
    // Recibir evento del WebSocket
    _ubicacionActual = UbicacionTracking.fromJson(event.data);
    notifyListeners(); // Rebuild widgets
  }

  void desuscribirse(int entregaId) {
    _wsService.desuscribirse(entregaId);
  }
}
```

### 7.3 Usar en Screen

```dart
// lib/screens/cliente/pedidos/pedido_tracking_screen.dart

class PedidoTrackingScreen extends StatefulWidget {
  @override
  _PedidoTrackingScreenState createState() => _PedidoTrackingScreenState();
}

class _PedidoTrackingScreenState extends State<PedidoTrackingScreen> {
  @override
  void initState() {
    super.initState();

    // Suscribirse a tracking
    Provider.of<TrackingProvider>(context, listen: false)
        .suscribirseATracking(widget.pedido.id);
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<TrackingProvider>(
      builder: (context, tracking, _) {
        final ubicacion = tracking.ubicacionActual;

        if (ubicacion == null) {
          return Center(child: CircularProgressIndicator());
        }

        return GoogleMap(
          // Actualizar mapa con nueva ubicación
          markers: {
            Marker(
              position: LatLng(ubicacion.latitud, ubicacion.longitud),
              infoWindow: InfoWindow(
                title: 'Camión en ruta',
                snippet: '${ubicacion.velocidad} km/h',
              ),
            ),
          },
        );
      },
    );
  }

  @override
  void dispose() {
    Provider.of<TrackingProvider>(context, listen: false)
        .desuscribirse(widget.pedido.id);
    super.dispose();
  }
}
```

---

## 8. FLUJO DE MENSAJES

### 8.1 Flujo Completo: Ubicación en Tiempo Real

```
1. CHOFER ENVÍA UBICACIÓN
   ├─ POST /api/chofer/entregas/123/ubicacion
   │  Datos: { latitud: -16.5, longitud: -68.1, velocidad: 45 }
   │
   └─ Backend Laravel (ChoferController::registrarUbicacion)
      ├─ Crea: UbicacionTracking::create(...)
      ├─ Dispara evento:
      │  Event::dispatch(new UbicacionActualizada($ubicacion))
      │
      └─ Laravel Broadcasting
         ├─ Serializa evento
         ├─ Envía a configurador (Pusher/Reverb/Socket.IO)
         │
         └─ SERVIDOR WEBSOCKET (Node.js)
            ├─ Recibe evento
            ├─ Identifica canal: entrega.123
            ├─ Busca clients suscriptores
            │  ├─ Cliente (Socket conexión React)
            │  ├─ Cliente (Socket conexión Flutter)
            │  └─ Admin (Socket conexión React)
            │
            └─ Retransmite a TODOS:
               {
                 "type": "ubicacion.actualizada",
                 "data": {
                   "entrega_id": 123,
                   "latitud": -16.5,
                   "longitud": -68.1,
                   "velocidad": 45,
                   "timestamp": "2025-10-31T14:30:00Z"
                 }
               }

2. REACT CLIENTE RECIBE
   ├─ io.on('ubicacion.actualizada', (data) => {
   │    setUbicacion(data);
   │  })
   │
   ├─ Component rebuilds
   └─ Mapa actualiza pin del camión

3. FLUTTER CLIENTE RECIBE
   ├─ _wsService.escucharEntrega(123, (event) => {
   │    _ubicacionActual = UbicacionTracking.fromJson(event);
   │    notifyListeners();
   │  })
   │
   ├─ Provider notifica
   └─ GoogleMap rebuilds y actualiza pin
```

### 8.2 Latencia Esperada

```
Chofer envía ubicación
         ↓ (< 100ms)
Backend procesa
         ↓ (< 50ms)
Evento broadcast
         ↓ (< 200ms)
Clientes reciben
         ↓ (< 100ms - renovar de UI)
Usuario ve cambio

TOTAL: < 500ms en condiciones óptimas
```

---

## 9. CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Backend Setup ✅ PARCIAL

- [x] Servidor WebSocket Node.js corriendo
- [ ] Configurar Broadcasting en Laravel (config/broadcasting.php)
- [ ] Definir todos los canales en routes/channels.php
- [ ] Crear 8 eventos (ProformaAprobada, UbicacionActualizada, etc.)
- [ ] Testing: Enviar evento y verificar que se recibe
- [ ] Documentar eventos en OpenAPI/Swagger

### FASE 2: Frontend React Integration

- [ ] Instalar socket.io-client
- [ ] Crear WebSocketService
- [ ] Crear hook useTracking()
- [ ] Integrar en TrackingMapa component
- [ ] Testing: Escuchar eventos en tiempo real
- [ ] Verificar que mapa actualiza sin refresh

### FASE 3: Frontend Flutter Integration

- [ ] Instalar laravel_echo y pusher_channels_flutter
- [ ] Expandir WebSocketService (ya existe)
- [ ] Integrar en TrackingProvider
- [ ] Integrar en PedidoTrackingScreen
- [ ] Testing en dispositivo real (no emulador)
- [ ] Verificar que mapa actualiza en tiempo real

### FASE 4: Testing Integral

- [ ] Test: Cliente y chofer en tiempo real
- [ ] Test: Múltiples entregas simultáneas
- [ ] Test: Desconexión y reconexión
- [ ] Test: Rendimiento con 100+ ubicaciones/segundo
- [ ] Test: Batería en móvil (no drenar)

### FASE 5: Productividad

- [ ] Monitoreo de conexiones WebSocket
- [ ] Logs detallados
- [ ] Alertas si servidor WebSocket cae
- [ ] Plan de recuperación ante desconexiones

---

## 10. TROUBLESHOOTING

### Problema: "No se reciben eventos"

**Checklist:**
1. ¿Servidor WebSocket está corriendo? `npm start` en ./websocket/
2. ¿Cliente está conectado? Verificar en consola del navegador
3. ¿Cliente se suscribió al canal correcto? `subscribir('entrega.123')`
4. ¿Token es válido? Verificar autenticación
5. ¿Laravel Broadcasting está configurado? Revisar config/broadcasting.php

### Problema: "Solo algunos eventos llegan"

1. Verificar que evento implementa `ShouldBroadcast`
2. Revisar `broadcastOn()` retorna canal correcto
3. Verificar permisos en routes/channels.php
4. Verificar que evento se dispara en el lugar correcto

### Problema: "WebSocket tarda mucho"

1. Reducir PING_INTERVAL en socket.config.js
2. Verificar latencia de red (WebSocket debería ser < 100ms)
3. Revisar logs del servidor: `/websocket/logs` (si existen)
4. Aumentar concurrencia del servidor si hay muchos clientes

---

## 11. CONFIGURACIONES POR AMBIENTE

### Desarrollo

```env
# .env (Laravel)
BROADCAST_DRIVER=log  # O pusher/reverb

# ./websocket/.env
WEBSOCKET_URL=http://localhost:3001
NODE_ENV=development
```

### Staging

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_KEY=...
PUSHER_APP_SECRET=...

WEBSOCKET_URL=https://staging-websocket.tu-dominio.com
NODE_ENV=production
```

### Producción

```env
BROADCAST_DRIVER=pusher
PUSHER_APP_KEY=...

WEBSOCKET_URL=https://websocket.tu-dominio.com
NODE_ENV=production
LOG_LEVEL=error
```

---

## 12. PRÓXIMOS PASOS

**Inmediatos (esta semana):**
1. Backend: Configurar Broadcasting completo
2. Backend: Crear todos los eventos (8 eventos)
3. React: Integrar WebSocket en TrackingMapa
4. Testing: Verificar que funciona end-to-end

**Semana siguiente:**
5. Flutter: Expandir WebSocketService
6. Flutter: Integrar en providers
7. Testing completo en ambas plataformas
8. Monitoring y logs

---

## 13. REFERENCIAS

- [Socket.IO Docs](https://socket.io/docs/)
- [Laravel Broadcasting](https://laravel.com/docs/broadcasting)
- [Laravel Echo](https://github.com/laravel/echo)
- [Pusher Channels](https://pusher.com/channels/)

---

**Versión:** 2.0
**Última actualización:** 31 de Octubre de 2025
**Responsable:** Gestor de WebSocket / Backend
**Siguiente revisión:** Cuando todos los eventos estén implementados
