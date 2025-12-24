# WebSocket Integration para Entregas - Guía de Implementación

## Resumen Ejecutivo

El sistema ahora implementa notificaciones en tiempo real (WebSocket) para todos los cambios de estado en el flujo de carga de entregas. Las notificaciones se envían automáticamente a:

- **Choferes**: Notificaciones sobre confirmación de carga, listo para partida, inicio de tránsito
- **Clientes**: Notificaciones sobre preparación de entrega, inicio de viaje, actualizaciones de ubicación GPS
- **Equipo de Logística**: Notificaciones administrativas sobre cambios de estado

## Arquitectura Backend Implementada

### 1. EntregaWebSocketService (Nuevo)
**Ubicación**: `app/Services/WebSocket/EntregaWebSocketService.php`

Servicio especializado que maneja todas las notificaciones de entregas. Métodos:

#### Notificaciones de Estado:
```php
// PREPARACION_CARGA → EN_CARGA
notifyCargoConfirmado($entrega): bool

// EN_CARGA → LISTO_PARA_ENTREGA
notifyListoParaEntrega($entrega): bool

// LISTO_PARA_ENTREGA → EN_TRANSITO
notifyInicioTransito($entrega, float $latitud, float $longitud): bool

// Mientras está EN_TRANSITO
notifyActualizacionUbicacion($entrega, float $latitud, float $longitud): bool

// EN_TRANSITO → ENTREGADO
notifyEntregaCompletada($entrega, ?array $fotoUrl, ?array $firmaUrl): bool

// Cualquier estado → NOVEDAD
notifyNovedad($entrega, string $motivo, bool $requiereReintento): bool
```

#### Notificaciones de Reporte:
```php
// PROGRAMADO → PREPARACION_CARGA (al generar reporte)
notifyReporteCargoGenerado($entrega, $reporte): bool
```

#### Notificaciones de Equipo:
```php
notifyEquipoLogistica($entrega, string $tipo): bool
```

### 2. Integración en Servicios

#### EntregaService
Métodos actualizados para llamar a WebSocket:
- `confirmarCarga()` → llamada a `notifyCargoConfirmado()`
- `marcarListoParaEntrega()` → llamada a `notifyListoParaEntrega()`
- `iniciarTransito()` → llamada a `notifyInicioTransito()`
- `actualizarUbicacionGPS()` → llamada a `notifyActualizacionUbicacion()`

#### ReporteCargoService
- `generarReporteDesdeEntrega()` → llamada a `notifyReporteCargoGenerado()`

**Manejo de Errores**: Las notificaciones WebSocket se envían en bloques try-catch. Si fallan, se registran en logs pero NO interrumpen la operación principal.

### 3. Estructura de Payloads WebSocket

#### notify/entrega-reporte-generado
Enviado cuando se genera un reporte de carga (PROGRAMADO → PREPARACION_CARGA)
```json
{
  "entrega_id": 123,
  "reporte_carga_id": 456,
  "numero_reporte": "RC-2025-001",
  "estado_entrega": "PREPARACION_CARGA",
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez"
  },
  "cliente": {
    "id": 5,
    "nombre": "Empresa ABC"
  },
  "peso_total_kg": 500.50,
  "volumen_total_m3": 2.5,
  "fecha_generacion": "2025-12-23T10:30:00+00:00"
}
```

#### notify/entrega-carga-confirmada
Enviado cuando se confirma la carga (PREPARACION_CARGA → EN_CARGA)
```json
{
  "entrega_id": 123,
  "numero": "#E-123",
  "estado": "EN_CARGA",
  "estado_anterior": "PREPARACION_CARGA",
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "+591234567890"
  },
  "cliente": {
    "id": 5,
    "nombre": "Empresa ABC"
  },
  "confirmado_por": "Admin User",
  "confirmado_en": "2025-12-23T11:00:00+00:00",
  "mensaje": "La carga ha sido confirmada y se está iniciando el proceso de carga física"
}
```

#### notify/entrega-listo-para-entrega
Enviado cuando la carga está completa (EN_CARGA → LISTO_PARA_ENTREGA)
```json
{
  "entrega_id": 123,
  "numero": "#E-123",
  "estado": "LISTO_PARA_ENTREGA",
  "estado_anterior": "EN_CARGA",
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "+591234567890"
  },
  "cliente": {
    "id": 5,
    "nombre": "Empresa ABC"
  },
  "vehiculo": {
    "id": 10,
    "placa": "ABC-123",
    "marca": "Hino",
    "modelo": "2020"
  },
  "direccion_entrega": "Av. Prinicipal 100, La Paz",
  "fecha_listo": "2025-12-23T12:30:00+00:00",
  "mensaje": "Entrega completada y lista para que el chofer inicie viaje"
}
```

#### notify/entrega-inicio-transito
Enviado cuando el chofer inicia tránsito (LISTO_PARA_ENTREGA → EN_TRANSITO)
```json
{
  "entrega_id": 123,
  "numero": "#E-123",
  "estado": "EN_TRANSITO",
  "estado_anterior": "LISTO_PARA_ENTREGA",
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "+591234567890"
  },
  "cliente": {
    "id": 5,
    "nombre": "Empresa ABC",
    "telefono": "+591234567801"
  },
  "ubicacion_inicial": {
    "latitud": -16.5023,
    "longitud": -68.1192,
    "timestamp": "2025-12-23T13:00:00+00:00"
  },
  "direccion_destino": "Av. Prinicipal 100, La Paz",
  "vehiculo": {
    "placa": "ABC-123",
    "marca": "Hino"
  },
  "mensaje": "Chofer ha iniciado el viaje - GPS activo"
}
```

#### notify/entrega-ubicacion-actualizada
Enviado continuamente mientras está EN_TRANSITO
```json
{
  "entrega_id": 123,
  "numero": "#E-123",
  "estado": "EN_TRANSITO",
  "ubicacion_actual": {
    "latitud": -16.5045,
    "longitud": -68.1234,
    "timestamp": "2025-12-23T13:15:00+00:00"
  },
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez"
  },
  "cliente_id": 5,
  "direccion_destino": "Av. Prinicipal 100, La Paz"
}
```

#### notify/entrega-completada
Enviado cuando se entrega exitosamente (EN_TRANSITO → ENTREGADO)
```json
{
  "entrega_id": 123,
  "numero": "#E-123",
  "estado": "ENTREGADO",
  "estado_anterior": "EN_TRANSITO",
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez"
  },
  "cliente": {
    "id": 5,
    "nombre": "Empresa ABC",
    "telefono": "+591234567801"
  },
  "fecha_entrega": "2025-12-23T14:30:00+00:00",
  "ubicacion_final": {
    "latitud": -16.5067,
    "longitud": -68.1198
  },
  "evidencia": {
    "foto_entrega": "https://...",
    "firma_digital": "https://..."
  },
  "mensaje": "Entrega completada exitosamente"
}
```

#### notify/entrega-novedad
Enviado cuando hay problemas (cualquier estado → NOVEDAD)
```json
{
  "entrega_id": 123,
  "numero": "#E-123",
  "estado": "NOVEDAD",
  "motivo_novedad": "Cliente no disponible",
  "requiere_reintento": true,
  "chofer": {
    "id": 1,
    "nombre": "Juan Pérez",
    "telefono": "+591234567890"
  },
  "cliente": {
    "id": 5,
    "nombre": "Empresa ABC",
    "telefono": "+591234567801"
  },
  "fecha_novedad": "2025-12-23T14:15:00+00:00",
  "ubicacion": {
    "latitud": -16.5067,
    "longitud": -68.1198
  }
}
```

## Implementación en Flutter (distribuidora-app)

### Arquitectura Recomendada

#### 1. WebSocket Client Service
```dart
// services/websocket_entrega_service.dart
class WebSocketEntregaService {
  late WebSocketChannel _channel;

  void connect(String url) {
    _channel = WebSocketChannel.connect(url);
    _channel.stream.listen((event) {
      _handleMessage(jsonDecode(event));
    });
  }

  void _handleMessage(Map<String, dynamic> data) {
    String tipo = data['type'];

    switch (tipo) {
      case 'notify/entrega-reporte-generado':
        _handleReporteGenerado(data);
        break;
      case 'notify/entrega-carga-confirmada':
        _handleCargoConfirmado(data);
        break;
      case 'notify/entrega-listo-para-entrega':
        _handleListoParaEntrega(data);
        break;
      case 'notify/entrega-inicio-transito':
        _handleInicioTransito(data);
        break;
      case 'notify/entrega-ubicacion-actualizada':
        _handleUbicacionActualizada(data);
        break;
      case 'notify/entrega-completada':
        _handleEntregaCompletada(data);
        break;
      case 'notify/entrega-novedad':
        _handleNovedad(data);
        break;
    }
  }
}
```

#### 2. State Management Integration
Usar BLoC, Provider, o Riverpod para:
- Mantener estado de entregas en tiempo real
- Notificar cambios a la UI
- Gestionar actualizaciones de GPS

```dart
// bloc/entrega_bloc.dart
class EntregaBLoC {
  final _entregaStateController = StreamController<EntregaState>();

  Stream<EntregaState> get entregaState => _entregaStateController.stream;

  void updateEntregaState(Entrega entrega) {
    _entregaStateController.add(EntregaUpdatedState(entrega));
  }

  void updateUbicacion(double lat, double lng) {
    _entregaStateController.add(UbicacionActualizadaState(lat, lng));
  }
}
```

#### 3. UI Components para Entregas

**Pantalla de Detalles de Entrega** - Debe:
- Escuchar cambios de estado en tiempo real
- Mostrar progreso visual del flujo de estados
- Actualizar ubicación GPS en mapa
- Mostrar notificaciones cuando cambia el estado

**Mapa de Tracking** - Debe:
- Conectarse a WebSocket para actualizaciones de GPS
- Mostrar ruta en tiempo real
- Actualizar marcador de chofer continuamente
- Calcular ETA basado en ubicación actual

### Flujo de Datos WebSocket

```
Backend (EntregaService)
    ↓
EntregaWebSocketService.notify*()
    ↓
WebSocket Server (config/websocket.php)
    ↓
Flutter App (WebSocketEntregaService)
    ↓
BLoC / Provider
    ↓
UI Widgets (real-time updates)
```

### Autenticación WebSocket

El sistema WebSocket requiere autenticación. En Flutter:

```dart
// Incluir token en la conexión
final token = await getAuthToken();
final url = 'ws://localhost:8000/ws/entregas?token=$token';
_channel = WebSocketChannel.connect(url);
```

### Manejo de Desconexiones

```dart
_channel.stream.handleError((error) {
  print('WebSocket error: $error');
  _reconnect(); // Reconectar automáticamente
});
```

### Filtrado de Notificaciones

Solo mostrar notificaciones relevantes al usuario actual:

```dart
// En el handler de mensajes
void _handleMessage(Map<String, dynamic> data) {
  // Solo procesar si la entrega es del usuario/chofer actual
  if (isRelevantToCurrentUser(data['entrega_id'])) {
    updateUI(data);
  }
}
```

## Testing

### Tests Backend

```bash
# Test de notificación WebSocket
php artisan test --filter=WebSocketEntregaNotificationTest
```

### Tests en Flutter

```dart
// Test de conexión WebSocket
test('conecta a WebSocket y recibe mensaje', () async {
  final mockChannel = MockWebSocketChannel();
  final service = WebSocketEntregaService(mockChannel);

  service.connect('ws://localhost:8000');

  final testData = {
    'type': 'notify/entrega-carga-confirmada',
    'entrega_id': 123,
    'estado': 'EN_CARGA'
  };

  expect(service.entregaState, emits(...));
});
```

## Monitoreo y Debugging

### Logs Disponibles

- **Backend**: `/storage/logs/laravel.log`
  - Filtrar por: "notificación WebSocket"
  - Buscar errores: "Error enviando notificación"

- **WebSocket Server**: Configurado en `config/websocket.php`

### Verificación de Conectividad

```bash
# Verificar WebSocket server está corriendo
php artisan websocket:status

# Ver conexiones activas
php artisan websocket:connections
```

## Próximos Pasos

1. **Implementar listeners en Flutter**
   - Crear WebSocketEntregaService
   - Conectar BLoC para state management
   - Actualizar UI components

2. **Implementar Real-time GPS Tracking**
   - Mapa interactivo con ubicación en vivo
   - Actualización continua desde `notifyActualizacionUbicacion`

3. **Implementar Notificaciones Push (Opcional)**
   - Usar Firebase Cloud Messaging
   - Enviar también desde `EntregaWebSocketService` cuando sea crítico

4. **Testing E2E**
   - Simular cambios de estado en backend
   - Verificar que Flutter recibe notificaciones
   - Validar actualización de UI

## Troubleshooting

| Problema | Causa | Solución |
|----------|-------|----------|
| No recibe notificaciones | WebSocket no conectado | Verificar URL y token de autenticación |
| Conexión se desconecta | Red inestable | Implementar reconexión automática con backoff |
| Notificaciones atrasadas | Carga de servidor alta | Optimizar procesamiento de mensajes |
| Duplicadas notificaciones | Cliente procesa dos veces | Agregar deduplicación por timestamp |

## Referencias

- **Backend**: `app/Services/WebSocket/EntregaWebSocketService.php`
- **Eventos Laravel**: `app/Events/Entrega*.php`
- **Configuración**: `config/websocket.php`
- **Documentación WebSocket**: Ver `LOADING_WORKFLOW_PERMISOS.md`
