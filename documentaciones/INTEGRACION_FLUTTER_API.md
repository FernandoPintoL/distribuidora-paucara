# Documentación: Integración de App Flutter con API de Distribuidora Paucara

## 📱 Introducción

Esta documentación explica cómo integrar una aplicación móvil desarrollada en Flutter con la API REST de la Distribuidora Paucara. Se cubre la autenticación, manejo de tokens, roles y permisos, y ejemplos de requests desde Flutter.

## 🔧 Configuración del Backend (Laravel)

### 1. Instalación de Laravel Sanctum

Primero, instala Laravel Sanctum para manejar la autenticación API:

```bash
composer require laravel/sanctum
php artisan vendor:publish --provider="Laravel\Sanctum\SanctumServiceProvider"
php artisan migrate
```

### 2. Configuración de Guards en `config/auth.php`

Agrega el guard 'sanctum' para autenticación API:

```php
'guards' => [
    'web' => [
        'driver' => 'session',
        'provider' => 'users',
    ],
    'sanctum' => [
        'driver' => 'sanctum',
        'provider' => null,
    ],
],
```

### 3. Middleware de Sanctum

Asegúrate de que el middleware de Sanctum esté configurado en `bootstrap/app.php`:

```php
return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->api(prepend: [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
        ]);
    })
    ->create();
```

### 4. Rutas de Autenticación API

Crea rutas API para login en `routes/api.php`:

```php
<?php
use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Rutas públicas de autenticación
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
Route::get('/user', [AuthController::class, 'user'])->middleware('auth:sanctum');
```

### 5. Controlador de Autenticación API

Crea `app/Http/Controllers/Api/AuthController.php`:

```php
<?php
namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function login(Request $request)
    {
        $request->validate([
            'login' => 'required|string', // Puede ser email o usernick
            'password' => 'required',
        ]);

        // Buscar usuario por email o usernick
        $user = User::where(function ($query) use ($request) {
            $query->where('email', $request->login)
                  ->orWhere('usernick', $request->login);
        })->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'login' => ['Las credenciales proporcionadas son incorrectas.'],
            ]);
        }

        // Verificar si el usuario está activo
        if (!$user->activo) {
            throw ValidationException::withMessages([
                'login' => ['Tu cuenta está desactivada. Contacta al administrador.'],
            ]);
        }

        // Revocar tokens anteriores (opcional)
        $user->tokens()->delete();

        // Crear nuevo token
        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'usernick' => $user->usernick,
                'email' => $user->email,
                'activo' => $user->activo,
            ],
            'token' => $token,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ]);
    }

    public function register(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'usernick' => 'required|string|max:255|unique:users',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $user = User::create([
            'name' => $request->name,
            'usernick' => $request->usernick,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'activo' => true,
        ]);

        // Asignar rol por defecto (opcional)
        $user->assignRole('cliente');

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'user' => $user,
            'token' => $token,
            'roles' => $user->roles->pluck('name'),
            'permissions' => $user->getAllPermissions()->pluck('name'),
        ], 201);
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Sesión cerrada exitosamente']);
    }

    public function user(Request $request)
    {
        return response()->json([
            'user' => $request->user(),
            'roles' => $request->user()->roles->pluck('name'),
            'permissions' => $request->user()->getAllPermissions()->pluck('name'),
        ]);
    }
}
```

## 🎯 Configuración de Flutter

### 1. Dependencias en `pubspec.yaml`

Agrega las dependencias necesarias:

```yaml
dependencies:
  flutter:
    sdk: flutter
  http: ^1.1.0
  shared_preferences: ^2.2.2
  provider: ^6.0.5
  json_annotation: ^4.8.1

dev_dependencies:
  build_runner: ^2.4.6
  json_serializable: ^6.7.1
```

### 2. Modelo de Usuario en Flutter

Crea `lib/models/user.dart`:

```dart
import 'package:json_annotation/json_annotation.dart';

part 'user.g.dart';

@JsonSerializable()
class User {
  final int id;
  final String name;
  final String usernick;
  final String email;
  final bool activo;
  final List<String> roles;
  final List<String> permissions;

  User({
    required this.id,
    required this.name,
    required this.usernick,
    required this.email,
    required this.activo,
    required this.roles,
    required this.permissions,
  });

  factory User.fromJson(Map<String, dynamic> json) => _$UserFromJson(json);
  Map<String, dynamic> toJson() => _$UserToJson(this);
}

@JsonSerializable()
class AuthResponse {
  final User user;
  final String token;

  AuthResponse({required this.user, required this.token});

  factory AuthResponse.fromJson(Map<String, dynamic> json) => _$AuthResponseFromJson(json);
  Map<String, dynamic> toJson() => _$AuthResponseToJson(this);
}
```

Genera el código con: `flutter pub run build_runner build`

### 3. Servicio de Autenticación

Crea `lib/services/auth_service.dart`:

```dart
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/user.dart';

class AuthService {
  static const String baseUrl = 'https://tu-dominio.com/api';
  static const String tokenKey = 'auth_token';

  // Login (acepta email o usernick)
  static Future<AuthResponse> login(String login, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'login': login, // Puede ser email o usernick
        'password': password,
      }),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final authResponse = AuthResponse.fromJson(data);

      // Guardar token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(tokenKey, authResponse.token);

      return authResponse;
    } else {
      throw Exception('Error de login: ${response.body}');
    }
  }

  // Register
  static Future<AuthResponse> register({
    required String name,
    required String usernick,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    final response = await http.post(
      Uri.parse('$baseUrl/register'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({
        'name': name,
        'usernick': usernick,
        'email': email,
        'password': password,
        'password_confirmation': password_confirmation,
      }),
    );

    if (response.statusCode == 201) {
      final data = jsonDecode(response.body);
      final authResponse = AuthResponse.fromJson(data);

      // Guardar token
      final prefs = await SharedPreferences.getInstance();
      await prefs.setString(tokenKey, authResponse.token);

      return authResponse;
    } else {
      throw Exception('Error de registro: ${response.body}');
    }
  }

  // Logout
  static Future<void> logout() async {
    final token = await getToken();
    if (token != null) {
      await http.post(
        Uri.parse('$baseUrl/logout'),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer $token',
        },
      );
    }

    // Limpiar token local
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(tokenKey);
  }

  // Obtener usuario actual
  static Future<User> getCurrentUser() async {
    final token = await getToken();
    if (token == null) throw Exception('No autenticado');

    final response = await http.get(
      Uri.parse('$baseUrl/user'),
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer $token',
      },
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return User.fromJson(data['user']);
    } else {
      throw Exception('Error al obtener usuario: ${response.body}');
    }
  }

  // Obtener token guardado
  static Future<String?> getToken() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getString(tokenKey);
  }

  // Verificar si está autenticado
  static Future<bool> isAuthenticated() async {
    final token = await getToken();
    return token != null;
  }

  // Headers con token para requests autenticados
  static Future<Map<String, String>> getAuthHeaders() async {
    final token = await getToken();
    return {
      'Content-Type': 'application/json',
      if (token != null) 'Authorization': 'Bearer $token',
    };
  }
}
```

### 4. Provider de Autenticación

Crea `lib/providers/auth_provider.dart`:

```dart
import 'package:flutter/foundation.dart';
import '../models/user.dart';
import '../services/auth_service.dart';

class AuthProvider with ChangeNotifier {
  User? _user;
  bool _isLoading = false;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _user != null;

  // Login (acepta email o usernick)
  Future<void> login(String login, String password) async {
    _isLoading = true;
    notifyListeners();

    try {
      final authResponse = await AuthService.login(login, password);
      _user = authResponse.user;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Register
  Future<void> register({
    required String name,
    required String usernick,
    required String email,
    required String password,
    required String passwordConfirmation,
  }) async {
    _isLoading = true;
    notifyListeners();

    try {
      final authResponse = await AuthService.register(
        name: name,
        usernick: usernick,
        email: email,
        password: password,
        passwordConfirmation: passwordConfirmation,
      );
      _user = authResponse.user;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // Logout
  Future<void> logout() async {
    await AuthService.logout();
    _user = null;
    notifyListeners();
  }

  // Cargar usuario al iniciar app
  Future<void> loadUser() async {
    if (await AuthService.isAuthenticated()) {
      try {
        _user = await AuthService.getCurrentUser();
      } catch (e) {
        // Token inválido, hacer logout
        await logout();
      }
    }
    notifyListeners();
  }

  // Verificar permisos
  bool hasRole(String role) {
    return _user?.roles.contains(role) ?? false;
  }

  bool hasPermission(String permission) {
    return _user?.permissions.contains(permission) ?? false;
  }
}
```

### 5. Ejemplo de Uso en Widget

```dart
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/auth_provider.dart';

class LoginScreen extends StatefulWidget {
  @override
  _LoginScreenState createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _loginController = TextEditingController(); // Puede ser email o usernick
  final _passwordController = TextEditingController();

  Future<void> _login() async {
    try {
      await context.read<AuthProvider>().login(
        _loginController.text,
        _passwordController.text,
      );
      // Navegar a pantalla principal
      Navigator.pushReplacementNamed(context, '/home');
    } catch (e) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(content: Text('Error: $e')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final authProvider = context.watch<AuthProvider>();

    return Scaffold(
      appBar: AppBar(title: Text('Login')),
      body: Padding(
        padding: EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _loginController,
              decoration: InputDecoration(labelText: 'Email o Usuario'),
            ),
            TextField(
              controller: _passwordController,
              decoration: InputDecoration(labelText: 'Password'),
              obscureText: true,
            ),
            SizedBox(height: 20),
            if (authProvider.isLoading)
              CircularProgressIndicator()
            else
              ElevatedButton(
                onPressed: _login,
                child: Text('Login'),
              ),
          ],
        ),
      ),
    );
  }
}
```

## 🔐 Manejo de Roles y Permisos

### Roles Disponibles

- `admin`: Acceso completo al sistema
- `gerente`: Gestión de ventas, compras e inventario
- `vendedor`: Gestión de ventas y clientes
- `cliente`: Acceso limitado a sus propios datos

### Verificación de Permisos en Flutter

```dart
// Verificar rol
if (authProvider.hasRole('admin')) {
  // Mostrar opciones de admin
}

// Verificar permiso específico
if (authProvider.hasPermission('ver_reportes')) {
  // Mostrar botón de reportes
}
```

### Middleware de Permisos en Laravel

Para proteger rutas API con permisos específicos:

```php
// En routes/api.php
Route::middleware(['auth:sanctum', 'permission:ver_reportes'])->group(function () {
    Route::get('/reportes', [ReporteController::class, 'index']);
});
```

## 📡 Ejemplos de Requests API

### Obtener Productos (requiere autenticación)

```dart
Future<List<Product>> getProducts() async {
  final headers = await AuthService.getAuthHeaders();
  final response = await http.get(
    Uri.parse('$baseUrl/app/productos'),
    headers: headers,
  );

  if (response.statusCode == 200) {
    final data = jsonDecode(response.body);
    return (data['data'] as List).map((json) => Product.fromJson(json)).toList();
  } else {
    throw Exception('Error al obtener productos');
  }
}
```

### Crear Proforma

```dart
Future<void> createProforma(List<ProformaItem> items) async {
  final headers = await AuthService.getAuthHeaders();
  final response = await http.post(
    Uri.parse('$baseUrl/app/proformas'),
    headers: headers,
    body: jsonEncode({
      'items': items.map((item) => item.toJson()).toList(),
    }),
  );

  if (response.statusCode != 201) {
    throw Exception('Error al crear proforma');
  }
}
```

## ⚠️ Consideraciones de Seguridad

1. **HTTPS Obligatorio**: Siempre usar HTTPS en producción
2. **Validación de Tokens**: Verificar expiración de tokens
3. **Refresh Tokens**: Implementar renovación automática de tokens
4. **Almacenamiento Seguro**: Usar secure storage para tokens en dispositivos
5. **Rate Limiting**: Implementar límites de requests en el backend

## � Ejemplos de Requests API

### Login (acepta email o usernick)

```bash
# Login con email
POST /api/login
{
  "login": "admin@paucara.test",
  "password": "password123"
}

# Login con usernick
POST /api/login
{
  "login": "admin",
  "password": "password123"
}

# Respuesta exitosa
{
  "user": {
    "id": 1,
    "name": "Administrador",
    "usernick": "admin",
    "email": "admin@paucara.test",
    "activo": true
  },
  "token": "1|abc123...",
  "roles": ["Admin"],
  "permissions": ["ver_reportes", "gestionar_usuarios"]
}
```

### Usar token en requests autenticados

```bash
GET /api/app/productos
Authorization: Bearer 1|abc123...
```

## �🐛 Manejo de Errores

```dart
try {
  await AuthService.login(login, password); // login puede ser email o usernick
} on http.ClientException catch (e) {
  // Error de conexión
  showDialog(context: context, builder: (_) => AlertDialog(
    title: Text('Error de Conexión'),
    content: Text('Verifica tu conexión a internet'),
  ));
} catch (e) {
  // Error de autenticación u otro
  showDialog(context: context, builder: (_) => AlertDialog(
    title: Text('Error'),
    content: Text(e.toString()),
  ));
}
```

## 📋 Checklist de Implementación

- [ ] Instalar Laravel Sanctum
- [ ] Configurar guards de autenticación
- [ ] Crear controlador de API de autenticación
- [ ] Definir rutas API de auth
- [ ] Configurar dependencias en Flutter
- [ ] Crear modelos de datos
- [ ] Implementar servicio de autenticación
- [ ] Crear provider de estado
- [ ] Implementar manejo de roles y permisos
- [ ] Probar login y logout
- [ ] Implementar renovación de tokens
- [ ] Configurar HTTPS en producción

Esta documentación proporciona una base sólida para integrar tu app Flutter con la API de Distribuidora Paucara. Asegúrate de adaptar los endpoints y la lógica según tus necesidades específicas.
