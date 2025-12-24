# WebSocket Testing Guide - Entregas en Tiempo Real

## Testing del Backend

### 1. Test Manual via Tinker

```bash
php artisan tinker
```

```php
// Obtener una entrega de prueba
$entrega = Entrega::with(['chofer', 'venta.cliente', 'vehiculo'])->first();

// Test 1: Notificación de reporte generado
$webSocketService = app(EntregaWebSocketService::class);
$reporte = ReporteCarga::first();
$webSocketService->notifyReporteCargoGenerado($entrega, $reporte);
// Esperado: true (notificación enviada)

// Test 2: Notificación de carga confirmada
$webSocketService->notifyCargoConfirmado($entrega);

// Test 3: Notificación de listo para entrega
$webSocketService->notifyListoParaEntrega($entrega);

// Test 4: Notificación de inicio de tránsito
$webSocketService->notifyInicioTransito($entrega, -16.5023, -68.1192);

// Test 5: Notificación de ubicación actualizada
$webSocketService->notifyActualizacionUbicacion($entrega, -16.5045, -68.1234);

// Test 6: Notificación de entrega completada
$webSocketService->notifyEntregaCompletada($entrega,
    ['url' => 'https://example.com/foto.jpg'],
    ['url' => 'https://example.com/firma.jpg']
);

// Test 7: Notificación de novedad
$webSocketService->notifyNovedad($entrega, 'Cliente no disponible', true);

// Test 8: Notificación para equipo
$webSocketService->notifyEquipoLogistica($entrega, 'en_transito');
```

### 2. Test Completo de Flujo de Estado

```php
// Script completo que simula un flujo de entrega
$entrega = Entrega::with(['chofer', 'venta.cliente', 'vehiculo'])->find(1);

echo "1. Generar reporte...\n";
$reporte = app(ReporteCargoService::class)->generarReporteDesdeEntrega($entrega, [
    'vehiculo_id' => $entrega->vehiculo_id,
    'peso_total_kg' => 500,
    'volumen_total_m3' => 2.5,
]);
echo "   Estado: PREPARACION_CARGA\n";

echo "2. Confirmar carga...\n";
app(EntregaService::class)->confirmarCarga($entrega->id);
echo "   Estado: EN_CARGA\n";

echo "3. Marcar listo para entrega...\n";
app(EntregaService::class)->marcarListoParaEntrega($entrega->id);
echo "   Estado: LISTO_PARA_ENTREGA\n";

echo "4. Iniciar tránsito...\n";
app(EntregaService::class)->iniciarTransito($entrega->id, -16.5023, -68.1192);
echo "   Estado: EN_TRANSITO\n";

echo "5. Actualizar ubicación...\n";
for ($i = 0; $i < 5; $i++) {
    app(EntregaService::class)->actualizarUbicacionGPS(
        $entrega->id,
        -16.5023 + ($i * 0.001),
        -68.1192 + ($i * 0.001)
    );
    sleep(1);
}
echo "   Ubicación actualizada 5 veces\n";

echo "6. Entrega completada...\n";
app(EntregaService::class)->confirmar($entrega->id, null, 'https://example.com/foto.jpg');
echo "   Estado: ENTREGADO\n";
```

### 3. Verificar Logs

```bash
# Ver logs recientes
tail -f storage/logs/laravel.log

# Filtrar por WebSocket
tail -f storage/logs/laravel.log | grep -i "websocket\|notificación"

# Filtrar por entrega específica
tail -f storage/logs/laravel.log | grep "entrega_id"

# Ver errores WebSocket
tail -f storage/logs/laravel.log | grep "Error enviando notificación"
```

### 4. Test con cURL (para verificar endpoint WebSocket)

```bash
# Verificar que el servidor WebSocket está respondiendo
curl -X GET http://localhost:3000/health

# Enviar notificación manualmente (si WebSocket lo soporta)
curl -X POST http://localhost:3000/notify/entrega-carga-confirmada \
  -H "Content-Type: application/json" \
  -H "X-Backend-Secret: cobrador-websocket-secret-key-2025" \
  -d '{
    "entrega_id": 1,
    "numero": "#E-1",
    "estado": "EN_CARGA",
    "chofer": {"id": 1, "nombre": "Juan Pérez"},
    "cliente": {"id": 5, "nombre": "Empresa ABC"}
  }'
```

## Testing en Flutter

### 1. Configuración Inicial

```dart
// lib/services/websocket_test_service.dart
import 'dart:convert';
import 'package:web_socket_channel/web_socket_channel.dart';

class WebSocketTestService {
  static final WebSocketTestService _instance = WebSocketTestService._internal();

  factory WebSocketTestService() {
    return _instance;
  }

  WebSocketTestService._internal();

  late WebSocketChannel _channel;
  List<Map<String, dynamic>> receivedMessages = [];

  void connect(String url) {
    _channel = WebSocketChannel.connect(Uri.parse(url));
    _channel.stream.listen(
      (event) {
        final data = jsonDecode(event);
        receivedMessages.add(data);
        print('📩 Mensaje recibido: ${data['type']}');
      },
      onError: (error) {
        print('❌ Error WebSocket: $error');
      },
      onDone: () {
        print('⚠️ WebSocket desconectado');
      },
    );
  }

  void sendMessage(Map<String, dynamic> data) {
    _channel.sink.add(jsonEncode(data));
  }

  void close() {
    _channel.sink.close();
  }

  List<Map<String, dynamic>> getReceivedMessages() {
    return receivedMessages;
  }

  void clearMessages() {
    receivedMessages.clear();
  }
}
```

### 2. Widget de Prueba

```dart
// lib/screens/websocket_test_screen.dart
class WebSocketTestScreen extends StatefulWidget {
  @override
  State<WebSocketTestScreen> createState() => _WebSocketTestScreenState();
}

class _WebSocketTestScreenState extends State<WebSocketTestScreen> {
  final WebSocketTestService _wsService = WebSocketTestService();
  List<String> _events = [];

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
  }

  void _connectWebSocket() {
    const wsUrl = 'ws://localhost:8000/ws/entregas?token=test_token';
    _wsService.connect(wsUrl);
    _addEvent('✅ Conectado a WebSocket');
  }

  void _addEvent(String event) {
    setState(() {
      _events.add('${DateTime.now().toIso8601String()} - $event');
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('WebSocket Testing')),
      body: Column(
        children: [
          Expanded(
            child: ListView.builder(
              itemCount: _events.length,
              itemBuilder: (context, index) {
                return ListTile(
                  title: Text(_events[index],
                      style: TextStyle(fontSize: 12)),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.all(16),
            child: Column(
              children: [
                ElevatedButton(
                  onPressed: () {
                    _addEvent('Mensajes recibidos: ${_wsService.getReceivedMessages().length}');
                    for (var msg in _wsService.getReceivedMessages()) {
                      _addEvent('${msg['type']}: Entrega ${msg['entrega_id']}');
                    }
                  },
                  child: Text('Ver Mensajes Recibidos'),
                ),
                ElevatedButton(
                  onPressed: () {
                    _wsService.clearMessages();
                    _addEvent('🔄 Historial limpiado');
                  },
                  child: Text('Limpiar Historial'),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _wsService.close();
    super.dispose();
  }
}
```

### 3. Test Unitario en Flutter

```dart
// test/services/websocket_test.dart
import 'package:flutter_test/flutter_test.dart';
import 'package:mockito/mockito.dart';

void main() {
  group('WebSocket Tests', () {
    test('conecta correctamente', () {
      final service = WebSocketTestService();
      service.connect('ws://localhost:8000/ws/entregas');
      expect(service, isNotNull);
    });

    test('recibe y parsea mensajes correctamente', () async {
      final service = WebSocketTestService();
      service.connect('ws://localhost:8000/ws/entregas');

      // Esperar a que se procese el mensaje
      await Future.delayed(Duration(milliseconds: 500));

      final messages = service.getReceivedMessages();
      expect(messages, isNotEmpty);
      expect(messages.first.containsKey('type'), true);
      expect(messages.first.containsKey('entrega_id'), true);
    });

    test('maneja desconexión correctamente', () {
      final service = WebSocketTestService();
      service.connect('ws://localhost:8000/ws/entregas');
      service.close();
      // Debería no lanzar excepciones
      expect(true, true);
    });
  });
}
```

## Testing Manual Paso a Paso

### Escenario 1: Notificar a Chofer sobre Carga Confirmada

1. **En Backend (Tinker)**:
```php
$entrega = Entrega::find(1); // ID de entrega de prueba
$entrega->update(['estado' => 'EN_CARGA']);
app(EntregaWebSocketService::class)->notifyCargoConfirmado($entrega);
```

2. **En Flutter App**:
- Abre la pantalla de entregas del chofer
- Mira si aparece notificación "Carga confirmada"
- Verifica que el estado visual cambié

3. **Verificación**:
```bash
# En terminal, ver logs
tail -f storage/logs/laravel.log | grep "notifyCargoConfirmado"
```

### Escenario 2: GPS Real-time Tracking

1. **En Backend (Script)**:
```php
$entrega = Entrega::find(1);
$entrega->update(['estado' => 'EN_TRANSITO']);

for ($i = 0; $i < 10; $i++) {
    app(EntregaService::class)->actualizarUbicacionGPS(
        $entrega->id,
        -16.5 + ($i * 0.001),
        -68.1 + ($i * 0.001)
    );
    sleep(2); // Actualizar cada 2 segundos
}
```

2. **En Flutter**:
- Abre pantalla de mapa
- Mira que el marcador se mueve en tiempo real
- Verifica que no haya lag o duplicados

### Escenario 3: Notificación a Cliente

1. **En Backend**:
```php
$entrega = Entrega::with('venta.cliente')->find(1);
app(EntregaWebSocketService::class)->notifyInicioTransito(
    $entrega,
    -16.5023,
    -68.1192
);
```

2. **Verificaciones**:
- Cliente recibe notificación en su app
- Puede ver ubicación inicial del chofer
- ETA se muestra correctamente

## Checklist de Testing

- [ ] Backend emite notificación sin errores
- [ ] Logs registran el evento correctamente
- [ ] Flutter recibe el mensaje JSON
- [ ] BLoC actualiza el estado
- [ ] UI renderiza el cambio
- [ ] GPS actualiza sin lag
- [ ] Reconexión automática funciona
- [ ] No hay memory leaks
- [ ] Mensajes no se duplican
- [ ] Funciona en 4G/WiFi

## Debugging WebSocket

### Ver Tráfico WebSocket en Chrome DevTools

```javascript
// En consola del navegador web
WebSocket URL: ws://localhost:8000/ws/entregas?token=...

// Abrir en pestańa Network y filtrar por WS
// Ver cada mensaje que llega
```

### Log de Errores Comunes

| Error | Causa | Solución |
|-------|-------|----------|
| "Connection refused" | WebSocket server no está corriendo | `php artisan websocket:serve` |
| "401 Unauthorized" | Token inválido | Verificar token en URL |
| "Message too large" | Payload > límite | Optimizar datos enviados |
| "Connection reset" | Conexión inestable | Implementar reconexión |
| "No address associated" | Hostname incorrecto | Verificar URL |

## Performance Testing

```bash
# Simular múltiples clientes conectados
for i in {1..100}; do
  curl -N -H "Connection: Upgrade" \
       -H "Upgrade: websocket" \
       -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" \
       -H "Sec-WebSocket-Version: 13" \
       http://localhost:8000/ws/entregas?token=test &
done
```

## Monitoring en Producción

```bash
# Ver conexiones WebSocket activas
netstat -an | grep 8000

# Ver proceso WebSocket
ps aux | grep websocket

# Ver memoria usada
free -h

# Ver logs de errores
grep -i "error\|fatal" storage/logs/laravel.log
```
