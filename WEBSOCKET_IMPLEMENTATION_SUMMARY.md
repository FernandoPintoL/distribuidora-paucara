# WebSocket Implementation Summary - Notificaciones de Entregas en Tiempo Real

## 📋 Lo Implementado

### ✅ Backend - Servicio WebSocket para Entregas

**Archivo Creado:**
- `app/Services/WebSocket/EntregaWebSocketService.php` (280+ líneas)

**Métodos Implementados:**
```php
// Notificaciones de cambio de estado
notifyCreated()                    // Nueva entrega creada
notifyReporteCargoGenerado()       // Reporte generado (PROGRAMADO → PREPARACION_CARGA)
notifyCargoConfirmado()            // Carga confirmada (PREPARACION_CARGA → EN_CARGA)
notifyListoParaEntrega()           // Listo para partir (EN_CARGA → LISTO_PARA_ENTREGA)
notifyInicioTransito()             // Iniciando viaje (LISTO_PARA_ENTREGA → EN_TRANSITO)
notifyActualizacionUbicacion()     // GPS actualizado (mientras EN_TRANSITO)
notifyEntregaCompletada()          // Entrega finalizada (EN_TRANSITO → ENTREGADO)
notifyNovedad()                    // Problema reportado (cualquier estado → NOVEDAD)
notifyEquipoLogistica()            // Notificación al equipo de logística
```

**Cada notificación incluye:**
- Datos de entrega (id, número, estado)
- Datos de chofer (id, nombre, teléfono)
- Datos de cliente (id, nombre, apellido, teléfono)
- Datos adicionales relevantes (GPS, vehículo, reporte, etc.)
- Timestamp de cuando ocurrió

### ✅ Integración en Servicios

**EntregaService** (`app/Services/Logistica/EntregaService.php`)
- ✅ Inyección de `EntregaWebSocketService` en constructor
- ✅ Llamada a `notifyCargoConfirmado()` en `confirmarCarga()`
- ✅ Llamada a `notifyListoParaEntrega()` en `marcarListoParaEntrega()`
- ✅ Llamada a `notifyInicioTransito()` en `iniciarTransito()`
- ✅ Llamada a `notifyActualizacionUbicacion()` en `actualizarUbicacionGPS()`

**ReporteCargoService** (`app/Services/Logistica/ReporteCargoService.php`)
- ✅ Inyección de `EntregaWebSocketService` en constructor
- ✅ Llamada a `notifyReporteCargoGenerado()` en `generarReporteDesdeEntrega()`

**Manejo de Errores:**
- Todas las notificaciones envueltas en try-catch
- Si falla WebSocket, se registra en logs pero NO interrumpe la operación
- Las operaciones de base de datos siempre se completan exitosamente

### ✅ Flujo de Datos Completo

```
1. Usuario/Sistema -> Cambio de estado en EntregaService
2. EntregaService -> Actualiza BD y llama a WebSocket
3. EntregaWebSocketService -> Prepara payload con todos los datos
4. BaseWebSocketService -> Envía HTTP POST a servidor WebSocket
5. Servidor WebSocket -> Distribuye a clientes conectados
6. Flutter App -> Recibe JSON con tipo y datos
7. BLoC/Provider -> Actualiza estado de entrega
8. UI -> Renderiza cambios en tiempo real
```

## 📦 Payloads WebSocket Definidos

7 tipos de eventos implementados:

| Evento | Disparo | Datos Clave |
|--------|---------|------------|
| `entrega-reporte-generado` | Crear reporte | `reporte_id`, `peso_total_kg`, `volumen_total_m3` |
| `entrega-carga-confirmada` | Confirmar carga | `confirmado_por`, `fecha_confirmacion_carga` |
| `entrega-listo-para-entrega` | Marcar listo | `vehiculo`, `direccion_entrega` |
| `entrega-inicio-transito` | Iniciar viaje | `ubicacion_inicial` (lat/lng), `timestamp` |
| `entrega-ubicacion-actualizada` | GPS updates | `ubicacion_actual` (lat/lng), actualizaciones continuas |
| `entrega-completada` | Finalizar entrega | `fecha_entrega`, `evidencia` (foto/firma), `ubicacion_final` |
| `entrega-novedad` | Reportar problema | `motivo_novedad`, `requiere_reintento` |

## 🎯 Destinatarios de Notificaciones

### Por Tipo de Evento:

| Evento | Chofer | Cliente | Logística |
|--------|--------|---------|-----------|
| Reporte Generado | ✅ | ✅ | ✅ |
| Carga Confirmada | ✅ | ✅ | ✅ |
| Listo para Entrega | ✅ | - | ✅ |
| Inicio Tránsito | ✅ | ✅ | ✅ |
| Ubicación GPS | - | ✅ | - |
| Entrega Completada | ✅ | ✅ | ✅ |
| Novedad/Problema | ✅ | ✅ | ✅ |

## 🔧 Configuración Requerida

**Ya existe en el proyecto:**
- `config/websocket.php` - Configuración de servidor WebSocket
- `app/Services/WebSocket/BaseWebSocketService.php` - Base para todos los servicios
- Headers HTTP para autenticación (X-Backend-Secret)

**No requiere cambios en rutas:**
- El flujo WebSocket es transparente a las rutas web
- Las APIs REST existentes funcionan sin cambios

## 📱 Lo que el Flutter App Debe Implementar

### 1. WebSocket Client
```dart
// Conectar a WebSocket
final url = 'ws://localhost:8000/ws/entregas?token=$token';
_channel = WebSocketChannel.connect(url);
```

### 2. Listeners por Tipo de Evento
```dart
_channel.stream.listen((event) {
  final data = jsonDecode(event);

  switch(data['type']) {
    case 'notify/entrega-listo-para-entrega':
      // Mostrar notificación al chofer
      showNotification('Tu entrega está lista para partir');
      break;
    case 'notify/entrega-ubicacion-actualizada':
      // Actualizar mapa con nueva ubicación
      updateMarkerOnMap(data['ubicacion_actual']);
      break;
    // ... más casos
  }
});
```

### 3. Real-time UI Updates
- Actualizar estado visual de entregas
- Mostrar mapa con GPS en tiempo real
- Mostrar notificaciones push
- Actualizar ETA/ruta

## 📊 Arquitectura Implementada

```
┌─────────────────────────────────────────────────────────┐
│ Laravel Backend (Distribuidora Web)                     │
│                                                          │
│ ┌──────────────────────────────────────────────────┐   │
│ │ EntregaService / ReporteCargoService            │   │
│ │ (Cambios de estado)                             │   │
│ └──────────────────┬───────────────────────────────┘   │
│                    │                                      │
│ ┌──────────────────▼───────────────────────────────┐   │
│ │ EntregaWebSocketService                         │   │
│ │ (Prepara payloads con todos los datos)          │   │
│ └──────────────────┬───────────────────────────────┘   │
│                    │                                      │
│ ┌──────────────────▼───────────────────────────────┐   │
│ │ BaseWebSocketService                            │   │
│ │ (HTTP POST al servidor WebSocket)               │   │
│ └──────────────────┬───────────────────────────────┘   │
└─────────────────────┼────────────────────────────────────┘
                      │
                ┌─────▼──────┐
                │   WebSocket │
                │    Server    │
                └─────┬───────┘
                      │
            ┌─────────┴─────────┐
            ▼                   ▼
      ┌──────────────┐    ┌──────────────┐
      │  Flutter App │    │   Web Admin  │
      │ (Chofer App) │    │   Dashboard  │
      └──────────────┘    └──────────────┘
```

## 🚀 Deployment Notes

### Backend Requiere:
1. WebSocket server corriendo (Ratchet/Socket.io)
2. Tabla de configuración `websocket` en BD
3. Secret token para autenticación

### Flutter Requiere:
1. Dependencia `web_socket_channel`
2. Implementación de listeners
3. Manejo de reconexión automática
4. Persistencia de notificaciones

## 📝 Ejemplos de Uso

### Desde el Backend (Ya Automatizado):
```php
// En EntregaService::confirmarCarga()
$this->webSocketService->notifyCargoConfirmado($entrega);

// En ReporteCargoService::generarReporteDesdeEntrega()
$this->webSocketService->notifyReporteCargoGenerado($entrega, $reporte);
```

### Desde Flutter (A Implementar):
```dart
class EntregaMapScreen extends StatefulWidget {
  @override
  State<EntregaMapScreen> createState() => _EntregaMapScreenState();
}

class _EntregaMapScreenState extends State<EntregaMapScreen> {
  late WebSocketChannel _channel;

  @override
  void initState() {
    super.initState();
    _connectWebSocket();
  }

  void _connectWebSocket() {
    _channel = WebSocketChannel.connect(
      Uri.parse('ws://localhost:8000/ws/entregas?token=$token'),
    );

    _channel.stream.listen(
      (event) {
        final data = jsonDecode(event);
        _handleWebSocketMessage(data);
      },
      onError: (error) => _reconnect(),
      onDone: () => _reconnect(),
    );
  }

  void _handleWebSocketMessage(Map<String, dynamic> data) {
    switch (data['type']) {
      case 'notify/entrega-ubicacion-actualizada':
        setState(() {
          _currentLat = data['ubicacion_actual']['latitud'];
          _currentLng = data['ubicacion_actual']['longitud'];
          _updateMarker();
        });
        break;
      // ... más eventos
    }
  }

  @override
  void dispose() {
    _channel.sink.close();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return GoogleMap(/* ... */);
  }
}
```

## ✨ Beneficios Implementados

1. **Real-time**: Clientes y choferes ven cambios instantáneamente
2. **Escalable**: Soporta múltiples usuarios simultáneamente
3. **Robusto**: Manejo de errores sin perder datos
4. **Eficiente**: Solo envía datos necesarios en cada notificación
5. **Seguro**: Requiere autenticación y validación
6. **Auditable**: Todos los cambios quedan registrados en BD

## 📚 Documentación Completa

Ver `WEBSOCKET_INTEGRATION_ENTREGAS.md` para:
- Guía de implementación en Flutter
- Estructura detallada de payloads
- Ejemplos de código
- Testing y debugging
- Troubleshooting

## ✅ Testing Backend

```bash
# Ver logs de WebSocket
tail -f storage/logs/laravel.log | grep "WebSocket\|notificación"

# Test manual desde artisan tinker
php artisan tinker
>>> $entrega = Entrega::find(1);
>>> app(EntregaWebSocketService::class)->notifyCargoConfirmado($entrega);
```

## 🔄 Próximos Pasos

1. **Implementar en Flutter**:
   - Crear WebSocketEntregaService
   - Integrar con BLoC
   - Actualizar pantallas de seguimiento

2. **Testing E2E**:
   - Simular cambios de estado
   - Verificar notificaciones en Flutter
   - Validar actualización de UI

3. **Monitoreo**:
   - Configurar alertas WebSocket
   - Monitorear conexiones activas
   - Registrar errores de notificación

4. **Optimización**:
   - Implementar compresión de mensajes
   - Batching de actualizaciones de GPS
   - Caché de últimas notificaciones
