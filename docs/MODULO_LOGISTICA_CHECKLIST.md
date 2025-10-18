# 📦 MÓDULO DE LOGÍSTICA - GESTIÓN DE COMPRAS VÍA APP

## 📊 ARQUITECTURA DE COMUNICACIÓN

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUJO DE COMUNICACIÓN                        │
└─────────────────────────────────────────────────────────────────┘

    FLUTTER APP (Cliente)
         ║
         ║ ① HTTP REST API
         ║ (POST/GET/PUT/DELETE)
         ▼
    LARAVEL BACKEND
         ║
         ║ ② Procesa lógica de negocio
         ║    - Validaciones
         ║    - BD (MySQL)
         ║    - Reglas de negocio
         ║
         ║ ③ Emite evento HTTP
         ║
         ▼
    WEBSOCKET SERVER (Node.js + Socket.IO)
         ║
         ║ ④ Broadcast/Emit
         ║    - Eventos en tiempo real
         ║    - Notificaciones push
         ║
         ▼
    FLUTTER APP (Cliente)
         ║
         ║ ⑤ Actualiza UI
         ║
         ▼
    USUARIO VE NOTIFICACIÓN
```

### ✅ Ventajas de este flujo:

1. **Separación de responsabilidades:**
   - Laravel = Lógica de negocio + Base de datos
   - WebSocket = Comunicación en tiempo real
   - Flutter = UI/UX + Estado local

2. **Escalabilidad:**
   - WebSocket server independiente
   - Puede escalar horizontalmente

3. **Confiabilidad:**
   - Laravel es la única fuente de verdad
   - WebSocket solo para notificaciones (no crítico)

4. **Offline-first:**
   - Flutter maneja carrito localmente
   - Sincroniza cuando tiene conexión

---

## 🎯 FASES DE IMPLEMENTACIÓN

### 📋 FASE 1: BACKEND - API PARA PEDIDOS (CRÍTICO)

#### 1.1 Endpoint de Creación de Pedidos desde App
- [ ] Crear endpoint `POST /api/app/pedidos`
  - [ ] Validaciones de items (stock disponible)
  - [ ] Validación de dirección de entrega
  - [ ] Crear proforma automáticamente
  - [ ] Reservar stock de productos
  - [ ] Retornar proforma creada con código de seguimiento

- [ ] Modificar `ApiProformaController` o crear nuevo controlador
  - [ ] Método `crearPedidoDesdeApp(Request $request)`
  - [ ] Usar `DB::transaction()` para atomicidad
  - [ ] Emitir evento a WebSocket al crear pedido

**Archivo:** `app/Http/Controllers/Api/ApiProformaController.php`

#### 1.2 Validación de Roles y Autenticación
- [ ] Middleware para verificar rol Cliente
  - [ ] Crear `app/Http/Middleware/EnsureUserIsCliente.php`
  - [ ] Registrar middleware en `bootstrap/app.php`

- [ ] Modificar `AuthController::login`
  - [ ] Validar que cliente esté activo
  - [ ] Retornar datos del cliente al login
  - [ ] Incluir direcciones en respuesta

**Archivos:**
- `app/Http/Middleware/EnsureUserIsCliente.php` (nuevo)
- `app/Http/Controllers/Api/AuthController.php`

#### 1.3 Endpoint de Historial de Pedidos
- [ ] `GET /api/app/cliente/pedidos` (alias de proformas)
  - [ ] Filtrar solo pedidos del cliente autenticado
  - [ ] Incluir estado de aprobación
  - [ ] Incluir datos de envío si existe
  - [ ] Paginación

**Archivo:** `app/Http/Controllers/Api/ApiProformaController.php`

---

### 📋 FASE 2: BACKEND - INTEGRACIÓN CON WEBSOCKET

#### 2.1 Servicio de Notificaciones WebSocket
- [ ] Crear `app/Services/WebSocketNotificationService.php`
  - [ ] Método `notifyPedidoCreado($pedido, $cliente)`
  - [ ] Método `notifyPedidoAprobado($pedido, $cliente)`
  - [ ] Método `notifyPedidoRechazado($pedido, $cliente, $motivo)`
  - [ ] Método `notifyEnvioEnRuta($envio, $cliente)`
  - [ ] Método `notifyEnvioEntregado($envio, $cliente)`
  - [ ] Usar HTTP client para llamar a WebSocket server

**Archivo:** `app/Services/WebSocketNotificationService.php` (nuevo)

**Ejemplo de implementación:**
```php
<?php
namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WebSocketNotificationService
{
    private string $websocketUrl;

    public function __construct()
    {
        $this->websocketUrl = config('services.websocket.url', 'http://localhost:3000');
    }

    public function notifyPedidoCreado($pedido, $cliente): void
    {
        $this->sendNotification([
            'event' => 'pedido:creado',
            'cliente_id' => $cliente->id,
            'data' => [
                'pedido_id' => $pedido->id,
                'codigo' => $pedido->codigo,
                'total' => $pedido->total,
                'mensaje' => 'Tu pedido ha sido creado y está pendiente de aprobación',
            ],
        ]);
    }

    private function sendNotification(array $payload): void
    {
        try {
            Http::timeout(5)->post("{$this->websocketUrl}/api/notify", $payload);
        } catch (\Exception $e) {
            Log::error('Error enviando notificación WebSocket', [
                'error' => $e->getMessage(),
                'payload' => $payload,
            ]);
        }
    }
}
```

#### 2.2 Eventos de Laravel
- [ ] Crear eventos de dominio
  - [ ] `app/Events/PedidoCreado.php`
  - [ ] `app/Events/PedidoAprobado.php`
  - [ ] `app/Events/EnvioActualizado.php`

- [ ] Crear listeners
  - [ ] `app/Listeners/NotificarPedidoViaWebSocket.php`
  - [ ] `app/Listeners/NotificarEnvioViaWebSocket.php`

- [ ] Registrar en `app/Providers/EventServiceProvider.php`

**Archivos:**
- `app/Events/PedidoCreado.php` (nuevo)
- `app/Listeners/NotificarPedidoViaWebSocket.php` (nuevo)
- `app/Providers/EventServiceProvider.php`

#### 2.3 Integrar notificaciones en controladores
- [ ] `ApiProformaController::aprobar()` - emitir evento
- [ ] `ApiProformaController::rechazar()` - emitir evento
- [ ] `EnvioController::confirmarSalida()` - emitir evento
- [ ] `EnvioController::confirmarEntrega()` - emitir evento

---

### 📋 FASE 3: WEBSOCKET SERVER - ENDPOINTS Y EVENTOS

#### 3.1 Endpoint para recibir notificaciones de Laravel
- [ ] Crear ruta `POST /api/notify` en WebSocket server
  - [ ] Archivo: `websocket/src/routes/notification.routes.js`
  - [ ] Validar payload recibido
  - [ ] Emitir a room específico del cliente

**Archivo:** `websocket/src/routes/notification.routes.js` (nuevo)

**Ejemplo:**
```javascript
import express from 'express';
import socketRepository from '../repositories/socket.repository.js';

const router = express.Router();

router.post('/notify', (req, res) => {
    const { event, cliente_id, data } = req.body;

    // Validar payload
    if (!event || !cliente_id) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    // Emitir a la room del cliente
    const room = `cliente_${cliente_id}`;
    socketRepository.emitToRoom(room, event, data);

    res.json({ success: true, message: 'Notification sent' });
});

export default router;
```

#### 3.2 Gestión de Rooms por Cliente
- [ ] Modificar `websocket/src/controllers/socket.controller.js`
  - [ ] Al conectar, unir socket a room `cliente_{id}`
  - [ ] Autenticar conexión con token
  - [ ] Desconectar de room al cerrar conexión

**Archivo:** `websocket/src/controllers/socket.controller.js`

#### 3.3 Tipos de eventos WebSocket
- [ ] Definir eventos en `websocket/src/constants/events.js`
  ```javascript
  export const EVENTS = {
      // Pedidos
      PEDIDO_CREADO: 'pedido:creado',
      PEDIDO_APROBADO: 'pedido:aprobado',
      PEDIDO_RECHAZADO: 'pedido:rechazado',

      // Envíos
      ENVIO_PROGRAMADO: 'envio:programado',
      ENVIO_EN_RUTA: 'envio:en_ruta',
      ENVIO_ENTREGADO: 'envio:entregado',

      // General
      NOTIFICATION: 'notification',
  };
  ```

**Archivo:** `websocket/src/constants/events.js` (nuevo)

---

### 📋 FASE 4: FLUTTER - INTEGRACIÓN API

#### 4.1 Configuración de servicios HTTP
- [ ] Crear `lib/core/services/api_service.dart`
  - [ ] BaseURL configurable
  - [ ] Interceptores para token
  - [ ] Manejo de errores HTTP

- [ ] Crear `lib/core/services/auth_service.dart`
  - [ ] Login/Logout
  - [ ] Almacenar token en secure storage
  - [ ] Refresh token si es necesario

**Archivos Flutter:**
- `lib/core/services/api_service.dart`
- `lib/core/services/auth_service.dart`

#### 4.2 Modelos de datos
- [ ] `lib/models/pedido_model.dart`
- [ ] `lib/models/producto_model.dart`
- [ ] `lib/models/direccion_model.dart`
- [ ] `lib/models/envio_model.dart`

#### 4.3 Repositorios
- [ ] `lib/repositories/pedido_repository.dart`
  - [ ] `crearPedido(List<ItemCarrito> items, int direccionId)`
  - [ ] `obtenerHistorial()`
  - [ ] `obtenerDetallePedido(int id)`

- [ ] `lib/repositories/producto_repository.dart`
  - [ ] `obtenerCatalogo()`
  - [ ] `buscarProductos(String query)`

---

### 📋 FASE 5: FLUTTER - WEBSOCKET CLIENT

#### 5.1 Configuración de Socket.IO Client
- [ ] Agregar dependencia `socket_io_client` en `pubspec.yaml`
- [ ] Crear `lib/core/services/websocket_service.dart`
  - [ ] Conectar al WebSocket server
  - [ ] Autenticación con token
  - [ ] Unirse a room del cliente
  - [ ] Reconexión automática

**Ejemplo:**
```dart
import 'package:socket_io_client/socket_io_client.dart' as IO;

class WebSocketService {
  IO.Socket? socket;
  final String wsUrl;

  Future<void> connect(String token, int clienteId) async {
    socket = IO.io(wsUrl, <String, dynamic>{
      'transports': ['websocket'],
      'auth': {'token': token},
    });

    socket?.onConnect((_) {
      socket?.emit('join_room', 'cliente_$clienteId');
    });

    socket?.on('pedido:aprobado', _handlePedidoAprobado);
    socket?.on('envio:en_ruta', _handleEnvioEnRuta);
  }

  void _handlePedidoAprobado(dynamic data) {
    // Mostrar notificación
    // Actualizar estado de la app
  }
}
```

#### 5.2 Gestión de notificaciones locales
- [ ] Agregar dependencia `flutter_local_notifications`
- [ ] Crear `lib/core/services/notification_service.dart`
  - [ ] Mostrar notificación cuando llega evento WebSocket
  - [ ] Solicitar permisos de notificaciones
  - [ ] Manejo de tap en notificación

---

### 📋 FASE 6: FLUTTER - UI/UX

#### 6.1 Carrito de compras local
- [ ] Provider/Riverpod para estado del carrito
  - [ ] `lib/providers/cart_provider.dart`
  - [ ] Agregar/quitar productos
  - [ ] Calcular totales
  - [ ] Persistir en local storage

- [ ] Pantalla de carrito
  - [ ] Lista de productos
  - [ ] Cantidad ajustable
  - [ ] Botón de checkout

#### 6.2 Pantalla de checkout
- [ ] Seleccionar dirección de entrega
- [ ] Agregar observaciones
- [ ] Confirmar pedido
- [ ] Mostrar código de seguimiento al crear

#### 6.3 Historial de pedidos
- [ ] Lista de pedidos con estados
  - [ ] PENDIENTE (amarillo)
  - [ ] APROBADO (verde)
  - [ ] RECHAZADO (rojo)
  - [ ] EN_RUTA (azul)
  - [ ] ENTREGADO (verde oscuro)

- [ ] Detalle de pedido
  - [ ] Items comprados
  - [ ] Tracking de envío

#### 6.4 Seguimiento en tiempo real
- [ ] Pantalla de seguimiento de envío
  - [ ] Mapa con ubicación del vehículo
  - [ ] Timeline de estados
  - [ ] ETA estimado

---

### 📋 FASE 7: VALIDACIONES Y REGLAS DE NEGOCIO

#### 7.1 Validación de cobertura de entrega
- [ ] Crear servicio `app/Services/CoberturaEntregaService.php`
  - [ ] Validar si dirección está en zona de cobertura
  - [ ] Calcular costo de envío por zona
  - [ ] Validar disponibilidad de vehículos

**Archivo:** `app/Services/CoberturaEntregaService.php` (nuevo)

#### 7.2 Validación de stock en tiempo real
- [ ] Al crear pedido, validar stock disponible
- [ ] Considerar reservas de otras proformas activas
- [ ] Liberar stock de proformas expiradas

#### 7.3 Ventanas de entrega
- [ ] Al crear pedido, sugerir ventana de entrega
- [ ] Basado en `ventanas_entrega_cliente`
- [ ] Validar capacidad de vehículos por día

---

### 📋 FASE 8: PORTAL WEB DEL CLIENTE (OPCIONAL)

#### 8.1 Autenticación web para clientes
- [ ] Ruta `/cliente/login`
- [ ] Componente `resources/js/presentation/pages/cliente/login.tsx`
- [ ] Middleware que redirija a dashboard de cliente

#### 8.2 Dashboard del cliente
- [ ] `resources/js/presentation/pages/cliente/dashboard.tsx`
  - [ ] Resumen de pedidos
  - [ ] Envíos activos
  - [ ] Cuentas por cobrar

#### 8.3 Historial de pedidos web
- [ ] `resources/js/presentation/pages/cliente/pedidos/index.tsx`
- [ ] `resources/js/presentation/pages/cliente/pedidos/detalle.tsx`

#### 8.4 Perfil y direcciones
- [ ] `resources/js/presentation/pages/cliente/perfil.tsx`
- [ ] CRUD de direcciones con mapa

---

## 🔧 CONFIGURACIÓN NECESARIA

### Laravel (`config/services.php`)
```php
'websocket' => [
    'url' => env('WEBSOCKET_URL', 'http://localhost:3000'),
],
```

### WebSocket Server (`.env`)
```env
NODE_ENV=production
PORT=3000
CLIENT_URL=https://tu-app.com
LARAVEL_API_URL=https://api.tu-app.com
```

### Flutter (`lib/core/config/api_config.dart`)
```dart
class ApiConfig {
  static const String baseUrl = 'https://api.tu-app.com';
  static const String wsUrl = 'https://ws.tu-app.com';
}
```

---

## 📝 ORDEN RECOMENDADO DE IMPLEMENTACIÓN

1. ✅ **FASE 1** - Backend API para pedidos (2-3 días)
2. ✅ **FASE 2** - Integración con WebSocket en Laravel (1-2 días)
3. ✅ **FASE 3** - WebSocket Server endpoints (1 día)
4. ✅ **FASE 4** - Flutter integración API (2-3 días)
5. ✅ **FASE 5** - Flutter WebSocket client (1-2 días)
6. ✅ **FASE 6** - Flutter UI/UX (3-4 días)
7. ✅ **FASE 7** - Validaciones y reglas (2-3 días)
8. ⏸️ **FASE 8** - Portal web (opcional, 3-5 días)

**TOTAL ESTIMADO:** 12-18 días de desarrollo

---

## ✅ CHECKLIST RÁPIDO DE PRE-REQUISITOS

- [x] Laravel Sanctum instalado y configurado
- [x] WebSocket server corriendo (Node.js + Socket.IO)
- [x] Modelos de Cliente, Proforma, Envío implementados
- [x] API de direcciones del cliente funcionando
- [x] API de productos disponibles
- [ ] Tests de endpoints existentes
- [ ] Documentación de API (Postman/Swagger)

---

## 🧪 TESTING

### Backend
- [ ] Tests unitarios para `WebSocketNotificationService`
- [ ] Tests de integración para `POST /api/app/pedidos`
- [ ] Tests de validación de stock
- [ ] Tests de eventos y listeners

### WebSocket
- [ ] Test de conexión
- [ ] Test de autenticación con token
- [ ] Test de emisión a rooms
- [ ] Test de reconexión

### Flutter
- [ ] Tests unitarios de modelos
- [ ] Tests de repositorios (mocking API)
- [ ] Tests de widgets críticos (carrito, checkout)
- [ ] Tests de integración E2E

---

## 📊 MÉTRICAS DE ÉXITO

- [ ] Cliente puede hacer pedido desde app en < 2 minutos
- [ ] Notificación de aprobación llega en < 5 segundos
- [ ] Tracking en tiempo real con latencia < 10 segundos
- [ ] 99% uptime del WebSocket server
- [ ] Tasa de error de API < 1%

---

## 🚀 PRÓXIMOS PASOS

1. Validar esta documentación con el equipo
2. Configurar entorno de desarrollo
3. Comenzar con FASE 1.1 (Endpoint de pedidos)
4. Crear branch `feature/modulo-logistica-app`
5. Commits atómicos por cada checkbox completado

---

**Última actualización:** 2025-10-17
**Versión:** 1.0
**Responsable:** Equipo de desarrollo
