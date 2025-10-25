# 📢 NOTIFICACIONES PUSH CON FCM - EXPLICACIÓN COMPLETA

**Fecha:** 2025-10-25
**Scope:** Backend (Laravel) + Frontend (Flutter)
**Importancia:** ⭐ IMPORTANTE - Sin esto, cliente no recibe notificaciones cuando app está cerrada

---

## 🎯 EL PROBLEMA

Actualmente tenemos WebSocket:

```
┌─────────────────┐
│   App Flutter   │
│   (ABIERTA)     │
└────────┬────────┘
         │ WebSocket
         │ (tiempo real)
    ┌────▼────┐
    │ Laravel  │
    │ + Node   │
    └─────────┘
```

**PERO:** Si el usuario cierra la app o el teléfono se duerme, NO recibe notificaciones.

```
┌─────────────────┐
│   App Flutter   │
│   (CERRADA) ❌  │ ← No recibe nada
└─────────────────┘
         ↕ ❌ (WebSocket muere)
    ┌──────────┐
    │ Laravel  │
    │ + Node   │
    └──────────┘
```

---

## ✅ LA SOLUCIÓN: FCM (Firebase Cloud Messaging)

### ¿Cómo funciona FCM?

```
┌─────────────────┐
│   App Flutter   │
│   (CERRADA)     │
└────────┬────────┘
         │
    ┌────▼──────────────────┐
    │ Sistema Operativo     │
    │ (Android/iOS)         │
    │ Escucha FCM           │
    └────┬───────────────────┘
         │ (aunque app esté cerrada)
    ┌────▼──────────────────┐
    │ Google FCM Server     │
    │ (Servidores globales) │
    └────▲───────────────────┘
         │ HTTP POST
    ┌────┴──────────────────┐
    │ Laravel Backend       │
    │ (Tu servidor)         │
    │ Envía notificación    │
    └───────────────────────┘
```

**Ventaja:** La notificación **se entrega aunque la app esté cerrada**, porque Google FCM es un servicio independiente.

---

## 🔧 IMPLEMENTACIÓN

### PARTE 1: BACKEND (Laravel) - LO QUE HACES TÚ AHORA

#### Paso 1: Instalar paquete Laravel para FCM

```bash
composer require kreait/firebase-php
```

#### Paso 2: Configurar Firebase en Laravel

**Archivo: `config/firebase.php` (NUEVO)**

```php
<?php

return [
    'project_id' => env('FIREBASE_PROJECT_ID'),
    'api_key' => env('FIREBASE_API_KEY'),
    'credentials' => env('FIREBASE_CREDENTIALS_JSON'),
    'database_url' => env('FIREBASE_DATABASE_URL'),
];
```

**Archivo: `.env`**

```bash
# Firebase FCM
FIREBASE_PROJECT_ID=tu-proyecto-id
FIREBASE_API_KEY=tu-api-key
FIREBASE_CREDENTIALS_JSON=/path/to/serviceAccountKey.json
```

**¿Dónde obtener estas credenciales?**
1. Ve a https://console.firebase.google.com/
2. Crea un proyecto (o usa uno existente)
3. Ve a "Project Settings" → "Service Accounts"
4. Descarga el JSON (serviceAccountKey.json)
5. Guarda en `/storage/firebase/serviceAccountKey.json`

#### Paso 3: Crear Servicio FCM

**Archivo: `app/Services/FcmNotificationService.php` (NUEVO)**

```php
<?php

namespace App\Services;

use Kreait\Firebase\Factory;
use Kreait\Firebase\Messaging\CloudMessage;
use Kreait\Firebase\Messaging\Notification;
use Illuminate\Support\Facades\Log;

class FcmNotificationService
{
    private $messaging;

    public function __construct()
    {
        try {
            $factory = new Factory();
            $firebase = $factory->withServiceAccount(storage_path('firebase/serviceAccountKey.json'));
            $this->messaging = $firebase->createMessaging();
        } catch (\Exception $e) {
            Log::error('FCM Error', ['error' => $e->getMessage()]);
        }
    }

    /**
     * Enviar notificación a un dispositivo específico (por token)
     */
    public function enviarADispositivo(
        string $deviceToken,
        string $titulo,
        string $mensaje,
        array $datos = []
    ): bool {
        try {
            $message = CloudMessage::withTarget('token', $deviceToken)
                ->withNotification(Notification::create($titulo, $mensaje))
                ->withData($datos);

            $this->messaging->send($message);
            return true;
        } catch (\Exception $e) {
            Log::error('FCM Error enviando a dispositivo', [
                'token' => $deviceToken,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

    /**
     * Enviar notificación a múltiples dispositivos
     */
    public function enviarAMultiplesDispositivos(
        array $deviceTokens,
        string $titulo,
        string $mensaje,
        array $datos = []
    ): array {
        $resultados = [];

        foreach ($deviceTokens as $token) {
            $resultados[$token] = $this->enviarADispositivo(
                $token,
                $titulo,
                $mensaje,
                $datos
            );
        }

        return $resultados;
    }

    /**
     * Enviar a todos los dispositivos de un usuario
     */
    public function enviarAUsuario(
        int $userId,
        string $titulo,
        string $mensaje,
        array $datos = []
    ): bool {
        // Obtener todos los tokens FCM del usuario
        $tokens = \App\Models\UsuarioDispositivo::where('usuario_id', $userId)
            ->where('activo', true)
            ->pluck('fcm_token')
            ->toArray();

        if (empty($tokens)) {
            return false;
        }

        $resultados = $this->enviarAMultiplesDispositivos($tokens, $titulo, $mensaje, $datos);
        return count(array_filter($resultados)) > 0;
    }

    /**
     * Enviar a todos los managers
     */
    public function enviarAManagers(
        string $titulo,
        string $mensaje,
        array $datos = []
    ): bool {
        $managers = \App\Models\User::whereHas('roles', function ($query) {
            $query->where('nombre', 'manager');
        })->pluck('id')->toArray();

        $exito = false;
        foreach ($managers as $managerId) {
            if ($this->enviarAUsuario($managerId, $titulo, $mensaje, $datos)) {
                $exito = true;
            }
        }

        return $exito;
    }
}
```

#### Paso 4: Crear modelo para almacenar tokens de dispositivos

**Archivo: `app/Models/UsuarioDispositivo.php` (NUEVO)**

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class UsuarioDispositivo extends Model
{
    protected $table = 'usuario_dispositivos';

    protected $fillable = [
        'usuario_id',
        'fcm_token',
        'tipo_dispositivo',  // android, ios, web
        'nombre_dispositivo', // iPhone de Juan, Samsung de María, etc
        'activo',
    ];

    protected $casts = [
        'activo' => 'boolean',
    ];

    public function usuario()
    {
        return $this->belongsTo(User::class);
    }
}
```

#### Paso 5: Migración para tabla usuario_dispositivos

**Archivo: `database/migrations/2025_10_25_create_usuario_dispositivos_table.php`**

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('usuario_dispositivos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('usuario_id')->constrained('users')->cascadeOnDelete();
            $table->string('fcm_token')->unique();
            $table->string('tipo_dispositivo'); // android, ios, web
            $table->string('nombre_dispositivo')->nullable(); // "iPhone 12 Pro"
            $table->boolean('activo')->default(true);
            $table->dateTime('ultimo_uso')->nullable();
            $table->timestamps();

            $table->index('usuario_id');
            $table->index('fcm_token');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('usuario_dispositivos');
    }
};
```

#### Paso 6: Endpoint para registrar token FCM

**Endpoint: Cuando usuario abre app por primera vez**

```php
// En AuthController
public function registrarDispositivoFcm(Request $request)
{
    $request->validate([
        'fcm_token' => 'required|string',
        'tipo_dispositivo' => 'required|in:android,ios,web',
        'nombre_dispositivo' => 'nullable|string',
    ]);

    // Guardar o actualizar token
    UsuarioDispositivo::updateOrCreate(
        [
            'usuario_id' => auth()->id(),
            'fcm_token' => $request->fcm_token,
        ],
        [
            'tipo_dispositivo' => $request->tipo_dispositivo,
            'nombre_dispositivo' => $request->nombre_dispositivo,
            'activo' => true,
            'ultimo_uso' => now(),
        ]
    );

    return response()->json([
        'success' => true,
        'message' => 'Dispositivo registrado para notificaciones'
    ]);
}
```

**Ruta:**

```php
// En routes/api.php
Route::post('/registrar-dispositivo-fcm', [AuthController::class, 'registrarDispositivoFcm'])
    ->middleware('auth:sanctum');
```

#### Paso 7: Usar FCM en eventos importantes

**Ejemplo 1: Cuando se aprueba una proforma**

```php
// En ProformaController::aprobar()
public function aprobar(Proforma $proforma, Request $request)
{
    $proforma->update([
        'estado' => Proforma::APROBADA,
        'usuario_aprobador_id' => auth()->id(),
        'fecha_aprobacion' => now(),
    ]);

    // ✅ Enviar notificación FCM al cliente
    $fcmService = app(FcmNotificationService::class);
    $fcmService->enviarAUsuario(
        $proforma->cliente->usuario_id,
        '¡Proforma Aprobada! 🎉',
        'Tu proforma #' . $proforma->numero . ' fue aprobada. Puedes confirmar tu pedido ahora.',
        [
            'tipo' => 'proforma_aprobada',
            'proforma_id' => $proforma->id,
            'numero_proforma' => $proforma->numero,
            'accion' => 'ver_proforma'
        ]
    );

    return back()->with('success', 'Proforma aprobada');
}
```

**Ejemplo 2: Cuando sale el envío**

```php
// En EnvioController::confirmarSalida()
public function confirmarSalida(Envio $envio, Request $request)
{
    $envio->update([
        'estado' => Envio::EN_RUTA,
        'fecha_salida' => now(),
    ]);

    // ✅ Notificar al cliente
    $fcmService = app(FcmNotificationService::class);
    $fcmService->enviarAUsuario(
        $envio->venta->cliente->usuario_id,
        '¡Tu pedido está en camino! 🚚',
        'El chofer ' . $envio->chofer->name . ' está llevando tu pedido. Número de envío: ' . $envio->numero_envio,
        [
            'tipo' => 'envio_en_ruta',
            'envio_id' => $envio->id,
            'chofer_nombre' => $envio->chofer->name,
            'chofer_telefono' => $envio->chofer->telefono ?? null,
            'accion' => 'ver_envio'
        ]
    );

    return back();
}
```

**Ejemplo 3: Cuando hay rechazo de entrega**

```php
// En EnvioController::rechazarEntrega()
public function rechazarEntrega(Envio $envio, Request $request)
{
    // ... procesar rechazo ...

    // ✅ Notificar al cliente
    $fcmService = app(FcmNotificationService::class);
    $fcmService->enviarAUsuario(
        $envio->venta->cliente->usuario_id,
        '⚠️ Problema en la entrega',
        'Hubo un problema: ' . $envio->motivo_rechazo . '. El equipo se contactará pronto.',
        [
            'tipo' => 'entrega_rechazada',
            'envio_id' => $envio->id,
            'motivo' => $envio->motivo_rechazo,
        ]
    );

    // ✅ Notificar a managers
    $fcmService->enviarAManagers(
        '🚨 Entrega Rechazada',
        'Envío ' . $envio->numero_envio . ' - ' . $envio->motivo_rechazo,
        [
            'tipo' => 'entrega_rechazada',
            'envio_id' => $envio->id,
            'accion' => 'ver_detalles'
        ]
    );
}
```

---

### PARTE 2: FRONTEND (Flutter) - LO QUE HACE EL EQUIPO FLUTTER

#### Paso 1: Instalar paquete Firebase

```bash
# En pubspec.yaml
dependencies:
  firebase_core: ^2.24.0
  firebase_messaging: ^14.6.0
```

#### Paso 2: Inicializar Firebase en Flutter

```dart
import 'package:firebase_core/firebase_core.dart';
import 'firebase_options.dart'; // Generado por Firebase CLI

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp(
    options: DefaultFirebaseOptions.currentPlatform,
  );

  runApp(MyApp());
}
```

#### Paso 3: Obtener token FCM y registrarlo

```dart
class FirebaseNotificationService {
  static final _messaging = FirebaseMessaging.instance;

  static Future<void> inicializarNotificaciones() async {
    // Solicitar permiso al usuario
    await _messaging.requestPermission();

    // Obtener token
    final token = await _messaging.getToken();
    print('📱 FCM Token: $token');

    // Enviar al backend
    await registrarTokenEnBackend(token);

    // Escuchar mensajes en primer plano
    FirebaseMessaging.onMessage.listen((message) {
      mostrarNotificacionEnPantalla(message);
    });

    // Escuchar cuando usuario toca la notificación
    FirebaseMessaging.onMessageOpenedApp.listen((message) {
      navegarSegunNotificacion(message);
    });
  }

  static Future<void> registrarTokenEnBackend(String token) async {
    final response = await http.post(
      Uri.parse('http://tu-backend.com/api/registrar-dispositivo-fcm'),
      headers: {
        'Authorization': 'Bearer $tokenUsuario',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({
        'fcm_token': token,
        'tipo_dispositivo': Platform.isAndroid ? 'android' : 'ios',
        'nombre_dispositivo': 'Mi dispositivo',
      }),
    );

    if (response.statusCode == 200) {
      print('✅ Token registrado en backend');
    }
  }

  static void mostrarNotificacionEnPantalla(RemoteMessage message) {
    // Mostrar en app si está abierta
    showDialog(
      context: navigatorKey.currentContext!,
      builder: (context) => AlertDialog(
        title: Text(message.notification?.title ?? 'Notificación'),
        content: Text(message.notification?.body ?? ''),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: Text('OK'),
          ),
          if (message.data['accion'] != null)
            TextButton(
              onPressed: () {
                Navigator.pop(context);
                navegarSegunNotificacion(message);
              },
              child: Text('Ver Detalles'),
            ),
        ],
      ),
    );
  }

  static void navegarSegunNotificacion(RemoteMessage message) {
    final tipo = message.data['tipo'];

    switch (tipo) {
      case 'proforma_aprobada':
        // Navegar a pantalla de proforma
        navigatorKey.currentState?.pushNamed(
          '/proforma/${message.data['proforma_id']}',
        );
        break;

      case 'envio_en_ruta':
        // Navegar a pantalla de tracking
        navigatorKey.currentState?.pushNamed(
          '/envio/${message.data['envio_id']}/rastrear',
        );
        break;

      case 'entrega_rechazada':
        // Mostrar detalles del rechazo
        navigatorKey.currentState?.pushNamed(
          '/envio/${message.data['envio_id']}/rechazo',
        );
        break;

      default:
        // Ir a inicio
        navigatorKey.currentState?.pushNamed('/inicio');
    }
  }
}
```

#### Paso 4: Llamar en main()

```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  await Firebase.initializeApp();
  await FirebaseNotificationService.inicializarNotificaciones();

  runApp(MyApp());
}
```

---

## 📊 COMPARATIVA: WebSocket vs FCM

| Feature | WebSocket | FCM |
|---------|-----------|-----|
| App abierta | ✅ Funciona | ✅ Funciona |
| App cerrada | ❌ NO funciona | ✅ Funciona |
| Tiempo real | ✅ Inmediato | ⚠️ 1-5 segundos |
| Datos | ✅ Cualquier formato | ⚠️ JSON limitado |
| Implementación | Fácil | Media |
| Costo | Gratis | Gratis (Google) |

**Recomendación:** Usar AMBOS:
- **WebSocket**: Para actualizaciones en tiempo real cuando app está abierta (ubicación GPS, etc)
- **FCM**: Para notificaciones importantes cuando app está cerrada (rechazo, aprobación, etc)

---

## 🚀 RESUMEN BACKEND NECESARIO

1. ✅ Instalar `kreait/firebase-php`
2. ✅ Crear `FcmNotificationService.php`
3. ✅ Crear modelo `UsuarioDispositivo`
4. ✅ Crear migración `usuario_dispositivos`
5. ✅ Crear endpoint `POST /api/registrar-dispositivo-fcm`
6. ✅ Usar FCM en eventos importantes

---

## ❓ PREGUNTAS FRECUENTES

**P: ¿Necesito obtener credenciales especiales?**
R: Sí, necesitas Firebase Console. Es gratis. Toma 5 minutos.

**P: ¿Las notificaciones se envían a todos los dispositivos del usuario?**
R: Sí, si guardaste múltiples tokens. Un usuario puede tener app en móvil, tablet y web.

**P: ¿Qué pasa si el usuario desactiva notificaciones?**
R: FCM aún intenta enviar, pero el SO (Android/iOS) las bloquea en el dispositivo.

**P: ¿Esto cuesta dinero?**
R: No. Firebase FCM es completamente gratis.

**P: ¿Puedo probar sin la app real?**
R: Sí. Puedes enviar notificaciones de prueba desde Firebase Console.

---

**Conclusión:**
- **Backend**: Implementa FcmNotificationService ahora
- **Flutter**: Integra Firebase Messaging cuando comience el desarrollo

¿Debo implementar el FcmNotificationService ahora?
