# WebSocket Events Guide - Flutter Implementation

## Overview

El sistema ahora transmite eventos en tiempo real a través de WebSocket usando Socket.IO. Los eventos disponibles son:

| Evento | Canal | Datos | Uso |
|--------|-------|-------|-----|
| `ruta.planificada` | `rutas`, `chofer.{id}` | Ruta creada | Notificar chofer de nueva ruta |
| `ruta.modificada` | `rutas`, `chofer.{id}` | Estado de ruta | Cambios en hora/estado |
| `ruta.detalle.actualizado` | `rutas`, `ruta.{id}`, `chofer.{id}` | Detalle entrega | Actualizar parada en vivo |

---

## Instalación en Flutter

### 1. Agregar dependencia socket_io_client

```bash
flutter pub add socket_io_client
```

O en `pubspec.yaml`:

```yaml
dependencies:
  socket_io_client: ^2.0.1
```

---

## Estructura de Servicio WebSocket

### 1. Crear servicio de conexión

Crear archivo: `lib/services/websocket_service.dart`

```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;
import 'package:flutter/foundation.dart';

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  late IO.Socket socket;

  // Variables reactivas
  final ValueNotifier<bool> isConnected = ValueNotifier(false);
  final ValueNotifier<dynamic> lastEvent = ValueNotifier(null);

  // Constructor privado para singleton
  WebSocketService._internal();

  // Obtener instancia única
  factory WebSocketService() {
    return _instance;
  }

  /// Inicializar conexión WebSocket
  void connect({required String url, required String authToken}) {
    socket = IO.io(
      url,
      IO.OptionBuilder()
          .setTransports(['websocket'])
          .disableAutoConnect()
          .setExtraHeaders({
            'Authorization': 'Bearer $authToken',
            'Content-Type': 'application/json',
          })
          .build(),
    );

    // Eventos de conexión
    socket.onConnect((_) {
      print('✅ Conectado a WebSocket');
      isConnected.value = true;
      _setupListeners();
    });

    socket.onDisconnect((_) {
      print('❌ Desconectado de WebSocket');
      isConnected.value = false;
    });

    socket.onConnectError((error) {
      print('❌ Error de conexión: $error');
      isConnected.value = false;
    });

    socket.connect();
  }

  /// Configurar escuchadores de eventos
  void _setupListeners() {
    // Evento: Ruta planificada
    socket.on('ruta.planificada', (data) {
      print('📍 Nueva ruta planificada: ${data['codigo']}');
      _handleRutaPlanificada(data);
    });

    // Evento: Ruta modificada
    socket.on('ruta.modificada', (data) {
      print('📝 Ruta modificada: ${data['codigo']} - ${data['tipo_cambio']}');
      _handleRutaModificada(data);
    });

    // Evento: Detalle actualizado (parada)
    socket.on('ruta.detalle.actualizado', (data) {
      print('📦 Parada actualizada: ${data['cliente_nombre']}');
      _handleRutaDetalleActualizado(data);
    });
  }

  /// Suscribirse a canal privado (chofer)
  void subscribeToChoferChannel(int choferId, String authToken) {
    socket.emit('subscribe', {
      'channel': 'chofer.$choferId',
      'auth': authToken,
    });
  }

  /// Suscribirse a canal privado (localidad)
  void subscribeToLocalidadChannel(int localidadId, String authToken) {
    socket.emit('subscribe', {
      'channel': 'localidad.$localidadId',
      'auth': authToken,
    });
  }

  /// Desconectar
  void disconnect() {
    socket.disconnect();
    isConnected.value = false;
  }

  /// Handlers de eventos
  void _handleRutaPlanificada(dynamic data) {
    lastEvent.value = {
      'tipo': 'ruta_planificada',
      'datos': data,
      'timestamp': DateTime.now(),
    };
    // TODO: Actualizar UI, mostrar notificación
  }

  void _handleRutaModificada(dynamic data) {
    lastEvent.value = {
      'tipo': 'ruta_modificada',
      'datos': data,
      'timestamp': DateTime.now(),
    };
    // TODO: Actualizar estado de ruta
  }

  void _handleRutaDetalleActualizado(dynamic data) {
    lastEvent.value = {
      'tipo': 'ruta_detalle_actualizado',
      'datos': data,
      'timestamp': DateTime.now(),
    };
    // TODO: Actualizar estado de parada en mapa/lista
  }
}
```

---

## Integración en Flutter App

### 2. Conectar en main.dart o inicio de sesión

```dart
import 'services/websocket_service.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({Key? key}) : super(key: key);

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  @override
  void initState() {
    super.initState();
    _initializeWebSocket();
  }

  void _initializeWebSocket() {
    // Obtener token de autenticación (del SharedPreferences, etc.)
    String authToken = 'tu_token_jwt_aqui';
    String wsUrl = 'http://192.168.1.23:3001';

    // Conectar a WebSocket
    WebSocketService().connect(url: wsUrl, authToken: authToken);
  }

  @override
  void dispose() {
    WebSocketService().disconnect();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Distribuidora Paucara',
      home: const HomePage(),
    );
  }
}
```

---

## Ejemplo: Pantalla de Choferes

### 3. Widget que escucha eventos

```dart
import 'package:flutter/material.dart';
import 'services/websocket_service.dart';

class MisRutasScreen extends StatefulWidget {
  final int choferId;

  const MisRutasScreen({Key? key, required this.choferId}) : super(key: key);

  @override
  State<MisRutasScreen> createState() => _MisRutasScreenState();
}

class _MisRutasScreenState extends State<MisRutasScreen> {
  final wsService = WebSocketService();
  List<Map<String, dynamic>> misRutas = [];

  @override
  void initState() {
    super.initState();
    // Suscribirse al canal privado del chofer
    String authToken = 'tu_token_aqui';
    wsService.subscribeToChoferChannel(widget.choferId, authToken);

    // Escuchar cambios
    wsService.lastEvent.addListener(_onWebSocketEvent);

    // Cargar rutas existentes del API
    _loadRutas();
  }

  void _loadRutas() async {
    // Llamar a API para obtener rutas del chofer
    // TODO: Implementar
  }

  void _onWebSocketEvent() {
    final event = wsService.lastEvent.value;

    if (event == null) return;

    if (event['tipo'] == 'ruta_planificada') {
      // Nueva ruta asignada
      final rutaData = event['datos'];
      _mostrarNotificacionRutaNueva(rutaData);
      _agregarRutaALista(rutaData);
    } else if (event['tipo'] == 'ruta_modificada') {
      // Ruta modificada
      final rutaData = event['datos'];
      _actualizarRutaEnLista(rutaData);
    }
  }

  void _mostrarNotificacionRutaNueva(dynamic rutaData) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(
          '📍 Nueva ruta: ${rutaData['codigo']} '
          '(${rutaData['cantidad_paradas']} paradas)',
        ),
        backgroundColor: Colors.green,
        duration: const Duration(seconds: 5),
      ),
    );
  }

  void _agregarRutaALista(dynamic rutaData) {
    setState(() {
      misRutas.add({
        'id': rutaData['ruta_id'],
        'codigo': rutaData['codigo'],
        'paradas': rutaData['cantidad_paradas'],
        'distancia': rutaData['distancia_km'],
        'estado': rutaData['estado'],
        'timestamp': DateTime.now(),
      });
    });
  }

  void _actualizarRutaEnLista(dynamic rutaData) {
    setState(() {
      final index = misRutas.indexWhere((r) => r['id'] == rutaData['ruta_id']);
      if (index != -1) {
        misRutas[index]['estado'] = rutaData['estado'];
        misRutas[index]['timestamp'] = DateTime.now();
      }
    });
  }

  @override
  void dispose() {
    wsService.lastEvent.removeListener(_onWebSocketEvent);
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Mis Rutas'),
        actions: [
          // Indicador de conexión
          ValueListenableBuilder<bool>(
            valueListenable: wsService.isConnected,
            builder: (context, isConnected, _) {
              return Padding(
                padding: const EdgeInsets.all(16.0),
                child: Center(
                  child: Row(
                    children: [
                      Container(
                        width: 12,
                        height: 12,
                        decoration: BoxDecoration(
                          color: isConnected ? Colors.green : Colors.red,
                          shape: BoxShape.circle,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Text(
                        isConnected ? 'Conectado' : 'Desconectado',
                        style: TextStyle(
                          color: isConnected ? Colors.green : Colors.red,
                          fontSize: 12,
                        ),
                      ),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
      body: misRutas.isEmpty
          ? const Center(
              child: Text('No hay rutas asignadas'),
            )
          : ListView.builder(
              itemCount: misRutas.length,
              itemBuilder: (context, index) {
                final ruta = misRutas[index];
                return Card(
                  margin: const EdgeInsets.all(8),
                  child: ListTile(
                    title: Text(ruta['codigo']),
                    subtitle: Text(
                      '${ruta['paradas']} paradas | ${ruta['distancia']} km | '
                      'Estado: ${ruta['estado']}',
                    ),
                    trailing: Icon(
                      ruta['estado'] == 'completada'
                          ? Icons.check_circle
                          : Icons.info,
                      color: ruta['estado'] == 'completada'
                          ? Colors.green
                          : Colors.blue,
                    ),
                    onTap: () {
                      // Abrir detalle de ruta
                      // TODO: Navegar a RutaDetalleScreen(rutaId: ruta['id'])
                    },
                  ),
                );
              },
            ),
    );
  }
}
```

---

## Notificaciones Push

Para notificaciones push cuando la app está cerrada:

### 4. Integrar firebase_messaging

```bash
flutter pub add firebase_messaging
```

En servidor Laravel, cuando se crea una ruta:

```dart
// En RutaService.php - después de RutaPlanificada::dispatch($ruta)
$chofer = $ruta->chofer;
if ($chofer->fcm_token) {
    SendPushNotificationJob::dispatch(
        $chofer->fcm_token,
        'Nueva ruta asignada',
        "Ruta {$ruta->codigo} con {$ruta->cantidad_paradas} paradas"
    );
}
```

---

## Testing

### Probar eventos en tiempo real

```dart
// En un botón de prueba
ElevatedButton(
  onPressed: () {
    // Emitir evento de prueba
    wsService.socket.emit('test', {
      'mensaje': 'Evento de prueba',
      'timestamp': DateTime.now().toIso8601String(),
    });
  },
  child: const Text('Enviar evento de prueba'),
)
```

---

## Troubleshooting

| Problema | Solución |
|----------|----------|
| `Connection refused` | Verificar que el servidor Node.js esté corriendo en puerto 3001 |
| `No listeners` | Asegurar que `_setupListeners()` se ejecute después de conectar |
| `Eventos no llegan` | Verificar que el `BROADCAST_DRIVER` esté habilitado en `.env` |
| `Token inválido` | Asegurar que el token JWT sea válido y no esté expirado |

---

## Resumen

✅ **Backend (Laravel)**
- [x] Eventos Broadcast creados
- [x] Observers configurados
- [x] RutaService dispara eventos

⏳ **Frontend (Flutter)**
- [ ] Implementar WebSocketService
- [ ] Conectar en login/initState
- [ ] Mostrar notificaciones
- [ ] Actualizar mapa/lista en tiempo real
- [ ] Agregar indicador de conexión
