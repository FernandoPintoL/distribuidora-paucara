# 🏗️ ARQUITECTURA: Dashboard Dinámico por Roles

## 📋 Resumen

El sistema ahora redirecciona a cada usuario a su dashboard específico basado **100% en decisiones del backend**.

```
Login Usuario
    ↓
Backend valida credenciales
    ↓
Token SANCTUM generado
    ↓
Redirecciona a /dashboard-redirect
    ↓
DashboardRedirectController pregunta a DashboardRouterService:
"¿A dónde debe ir este usuario basado en sus roles?"
    ↓
DashboardRouterService responde:
"Este usuario tiene rol 'Cajero' → Envíalo a /vendedor/dashboard"
    ↓
Frontend SOLO obedece y redirige a esa URL
    ↓
Usuario ve su dashboard específico
```

---

## 🔧 Componentes

### **1. DashboardRouterService** (`app/Services/DashboardRouterService.php`)

**Responsabilidad:** Decidir a qué dashboard va cada usuario

```php
// Ejemplo de uso:
$router = app(DashboardRouterService::class);
$user = Auth::user();

// Obtener la ruta correcta
$ruta = $router->getDashboardRoute($user);
// Retorna: "/vendedor/dashboard"

// Información de debug
$info = $router->getRedirectInfo($user);
// Retorna: array con roles, dashboard_url, etc.
```

**Mapeo de Roles → Dashboards:**
```php
'super_admin' => '/admin/dashboard',
'admin' => '/admin/dashboard',
'comprador' => '/compras/dashboard',
'preventista' => '/preventista/dashboard',
'chofer' => '/chofer/dashboard',
'logistica' => '/logistica/dashboard',
'gestor_almacen' => '/almacen/dashboard',
'vendedor' => '/vendedor/dashboard',
'cajero' => '/vendedor/dashboard',          // Mismo que vendedor
'contabilidad' => '/contabilidad/dashboard',
```

**Lógica de Prioridad:**
Si un usuario tiene múltiples roles, usa el de mayor prioridad:
1. Super Admin (100)
2. Admin (99)
3. Comprador (50)
4. Logística (48)
5. Gestor Almacén (47)
6. Contabilidad (46)
7. Preventista (45)
8. Vendedor/Cajero (40)
9. Chofer (30)

### **2. DashboardRedirectController** (`app/Http/Controllers/Auth/DashboardRedirectController.php`)

**Responsabilidad:** Ejecutar la redirección usando la decisión del backend

```php
// GET /dashboard-redirect
// 1. Obtiene usuario autenticado
// 2. Pregunta a DashboardRouterService dónde debe ir
// 3. Redirige a esa URL
// 4. Frontend NO tiene lógica, solo obedece

return redirect()->to($dashboardUrl);
```

### **3. AuthenticatedSessionController** (Actualizado)

**Cambio importante:**
```php
// ANTES:
return redirect()->intended(route('dashboard'));

// AHORA:
return redirect()->intended(route('dashboard-redirect'));
```

Después de login exitoso, el usuario es redirigido a `/dashboard-redirect` donde el backend decide a dónde debe ir realmente.

---

## 📡 Flujo Completo

```
┌─────────────────────────────────────────────────────────────────┐
│ Usuario intenta login                                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ POST /login (LoginRequest)                                      │
│ - Valida email/usernick + password                              │
│ - Verifica usuario activo                                       │
│ - Genera token SANCTUM                                          │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ AuthenticatedSessionController::store()                         │
│ - Autentica usuario (Auth::attempt)                             │
│ - Regenera sesión                                               │
│ - Crea token SANCTUM para WebSocket                             │
│ - REDIRIGE A: /dashboard-redirect ✅ (CAMBIO CLAVE)             │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ GET /dashboard-redirect                                         │
│ DashboardRedirectController::redirect()                         │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ DashboardRouterService::getDashboardRoute($user)                │
│ - Obtiene roles del usuario                                     │
│ - Busca rol de mayor prioridad                                  │
│ - Consulta mapeo: rol → URL                                     │
│ - RETORNA: "/vendedor/dashboard" (por ejemplo)                  │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ DashboardRedirectController redirige                            │
│ redirect()->to("/vendedor/dashboard")                           │
└──────────────────────┬──────────────────────────────────────────┘
                       │
                       ↓
┌─────────────────────────────────────────────────────────────────┐
│ Frontend: Usuario llega a /vendedor/dashboard                   │
│ - Ve solo datos de vendedor/caja                                │
│ - Sidebar muestra solo módulos permitidos                       │
│ - Todo controlado por backend ✅                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Ejemplo: Dos Usuarios Diferentes

### Usuario 1: Admin
```
Login: admin@paucara.test / password
Roles: Admin, Super Admin
DashboardRouterService decide: "Admin" (prioridad 99)
Redirige a: /admin/dashboard
Ve: Dashboard administrativo completo
```

### Usuario 2: Cajero
```
Login: cajero@paucara.test / password123
Roles: Cajero
DashboardRouterService decide: "Cajero" (prioridad 40)
Redirige a: /vendedor/dashboard
Ve: Dashboard de vendedor/caja
```

### Usuario 3: Chofer
```
Login: chofer@paucara.test / password
Roles: Chofer
DashboardRouterService decide: "Chofer" (prioridad 30)
Redirige a: /chofer/dashboard
Ve: Dashboard de rutas/logística
```

### Usuario 4: Preventista (múltiples roles)
```
Login: preventista@test.com / password
Roles: Preventista, Logística
DashboardRouterService compara prioridades:
  - Preventista: 45
  - Logística: 48 ← Mayor, se elige
Redirige a: /logistica/dashboard
Ve: Dashboard de logística
```

---

## 🔐 Principios Arquitectónicos

✅ **Backend es la única fuente de verdad**
- Solo el backend decide dónde puede ir cada usuario
- Frontend NO tiene lógica de negocios

✅ **Frontend es "tonto"**
- Solo muestra lo que el backend le dice
- No toma decisiones, solo obedece

✅ **Escalabilidad**
- Añadir nuevo rol: solo actualizar mapeo en `DashboardRouterService`
- No requiere cambios en frontend

✅ **Seguridad**
- Si frontend intenta ir a `/admin/dashboard` pero no tiene rol Admin
- Backend lo redirige automáticamente a su dashboard correcto

---

## 📝 Cómo Modificar la Redirección

### Cambiar a dónde va un rol:
```php
// En DashboardRouterService::__construct() o en tiempo de ejecución

$this->roleRoutes['vendedor'] = '/nuevo/dashboard';

// O dinámicamente:
$router->updateRoleRoute('vendedor', '/nuevo/dashboard');
```

### Cambiar prioridad entre roles:
```php
// En DashboardRouterService::getDashboardRoute()

$prioridad = [
    'super_admin' => 100,
    'admin' => 99,
    'comprador' => 50,    // Aumentar esta si quieres más prioridad
    // ...
];
```

---

## 🧪 Pruebas

Prueba login con cada usuario y verifica que va al lugar correcto:

```bash
# Terminal: Ver logs de redirección
tail -f storage/logs/laravel.log | grep "Dashboard redirect"
```

### Test Checklist:
- [ ] Login Admin → Va a /admin/dashboard
- [ ] Login Chofer → Va a /chofer/dashboard
- [ ] Login Preventista → Va a /logistica/dashboard (mayor prioridad)
- [ ] Login Cajero → Va a /vendedor/dashboard
- [ ] Login Comprador → Va a /compras/dashboard

---

## 🚀 Próximos Pasos

1. **Probar redirección** con cada rol
2. **Verificar que dashboards existan** (algunos ya existen, otros necesitan ser creados)
3. **Personalizar cada dashboard** con datos relevantes al rol
4. **Actualizar prioridades** si es necesario

---

## 📚 Archivos Clave

- `app/Services/DashboardRouterService.php` - Lógica de ruteo
- `app/Http/Controllers/Auth/DashboardRedirectController.php` - Ejecución
- `app/Http/Controllers/Auth/AuthenticatedSessionController.php` - Redirect post-login
- `routes/auth.php` - Ruta `/dashboard-redirect`

---

**Fecha:** 2025-12-07
**Versión:** 1.0
**Estado:** Listo para probar
