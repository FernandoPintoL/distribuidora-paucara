# Análisis: Estado del WebSocket en React Frontend

**Fecha**: 2025-11-03
**Estado**: ⚠️ PARCIALMENTE IMPLEMENTADO

---

## Resumen Ejecutivo

El frontend React **tiene el código WebSocket implementado** pero **NO está conectando automáticamente** cuando el usuario hace login. El servicio y hooks existen, pero no se están utilizando en los puntos clave de la aplicación.

---

## ¿Qué Tiene Implementado React?

### ✅ Infraestructura WebSocket Completa

1. **WebSocketService** (`resources/js/infrastructure/services/websocket.service.ts`)
   - Clase singleton
   - Método `connect()` que recibe config con token y userId
   - Manejo de eventos ('connect', 'disconnect', 'error', 'auth_error')
   - Métodos para escuchar y emitir eventos
   - Suscripción a canales por nombre

2. **Hook useWebSocket** (`resources/js/application/hooks/use-websocket.ts`)
   - Conecta automáticamente si `autoConnect: true`
   - Obtiene token de `localStorage.getItem('auth_token')`
   - Maneja estado de conexión ('disconnected', 'connecting', 'connected', 'error')
   - Proporciona métodos para subscribir a canales
   - Emite eventos locales cuando conecta/desconecta

3. **Hook useTracking** (`resources/js/application/hooks/use-tracking.ts`)
   - Rastreo específico de entregas
   - Escucha ubicación en tiempo real
   - Gestiona novedades

4. **Hook useRealtimeNotifications** (`resources/js/application/hooks/use-realtime-notifications.ts`)
   - Notificaciones emergentes
   - Integración con NotificationService

### ✅ Configuración

- **VITE_WEBSOCKET_URL** en variables de entorno
- Axios configurado para manejar tokens
- localStorage para almacenar `auth_token`

---

## ¿Dónde NO Se Está Usando?

### ❌ En el Login (login.tsx)

El formulario de login **NO dispara** la conexión al WebSocket después de autenticarse.

```typescript
// ACTUAL (login.tsx) - NO hace nada con WebSocket
export default function Login({ status }: LoginProps) {
    return (
        <Form {...AuthenticatedSessionController.store.form()} ...>
            {/* Solo formulario, sin lógica de WebSocket */}
        </Form>
    );
}

// DEBERÍA hacer: Conectar al WebSocket después del login exitoso
```

### ❌ En el App Layout Principal

El layout principal **NO inicializa** la conexión WebSocket automáticamente.

```typescript
// ACTUAL (app-layout.tsx) - Solo muestra componentes
export default ({ children, breadcrumbs, ...props }: AppLayoutProps) => (
    <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
        {children}
        <Toaster ... />  {/* Solo Toaster, sin WebSocket */}
    </AppLayoutTemplate>
);

// DEBERÍA hacer: Conectar WebSocket en un useEffect
```

### ⚠️ En Componentes Específicos

Solo una página intenta usar WebSocket:

```typescript
// entregas-en-transito.tsx - usa variable pero no el hook
const [useWebSocketMode, setUseWebSocketMode] = useState(true);
// Esta es una VARIABLE local, no el hook useWebSocket()
```

---

## Flujo Actual vs Esperado

### 🔴 Flujo Actual (SIN WebSocket)

```
1. Usuario ingresa credenciales en /login
   ↓
2. POST al servidor Laravel
   ↓
3. Laravel autentica y genera auth_token
   ↓
4. Inertia redirige a /dashboard
   ↓
5. useAuth() obtiene datos de `props.auth`
   ↓
6. React renderiza dashboard
   ↓
7. ❌ SIN conexión WebSocket
   ↓
8. Si hay cambios en tiempo real:
   - El usuario NO ve actualizaciones
   - Debe hacer F5 (refresh) para ver cambios
```

### 🟢 Flujo Esperado (CON WebSocket)

```
1. Usuario ingresa credenciales en /login
   ↓
2. POST al servidor Laravel
   ↓
3. Laravel autentica y genera auth_token + lo guarda en localStorage
   ↓
4. Inertia redirige a /dashboard
   ↓
5. App layout monta useWebSocket({ autoConnect: true })
   ↓
6. useWebSocket obtiene token de localStorage
   ↓
7. WebSocketService.connect({ token, userId })
   ↓
8. Node.js valida token contra PostgreSQL
   ↓
9. ✅ Conexión establecida
   ↓
10. Componentes pueden suscribirse a canales y eventos
    ↓
11. Reciben actualizaciones en tiempo real sin refresh
```

---

## ¿Cómo Funciona Actualmente?

### Token Guardado

Después del login, Laravel SET el token en **localStorage**:

```typescript
// En respuesta de /login, el frontend lo recibe y lo guarda automáticamente
localStorage.setItem('auth_token', response.token);
```

### Axios Usa el Token

En cada request HTTP, Axios agrega el header:

```typescript
// axios.config.ts - configuración de interceptores
headers.Authorization = `Bearer ${localStorage.getItem('auth_token')}`;
```

### El Problema

**El WebSocket NO se inicializa** aunque el token esté disponible.

```typescript
// El código existe pero nadie lo llama:

// WebSocketService está definido
class WebSocketService { /* ... */ }

// useWebSocket existe
export function useWebSocket(options: UseWebSocketOptions) { /* ... */ }

// Pero nadie hace esto:
const { isConnected } = useWebSocket({ autoConnect: true });
```

---

## Solución: Hacer que React Conecte al WebSocket

### Opción 1: Conectar en App Layout (RECOMENDADO)

Modifica `resources/js/layouts/app-layout.tsx`:

```typescript
'use client';

import { useEffect } from 'react';
import AppLayoutTemplate from '@/layouts/app/app-sidebar-layout';
import { useWebSocket } from '@/application/hooks/use-websocket';
import { useAuth } from '@/application/hooks/use-auth';
import { type BreadcrumbItem } from '@/types';
import { type ReactNode } from 'react';
import { Toaster } from 'react-hot-toast';

interface AppLayoutProps {
    children: ReactNode;
    breadcrumbs?: BreadcrumbItem[];
}

export default function AppLayout({ children, breadcrumbs, ...props }: AppLayoutProps) {
    const { user } = useAuth();

    // Conectar al WebSocket cuando el usuario esté autenticado
    const { isConnected, error } = useWebSocket({
        autoConnect: true  // Conecta automáticamente si hay token
    });

    useEffect(() => {
        if (isConnected && user) {
            console.log(`✅ WebSocket conectado para usuario ${user.name}`);
        }
        if (error && user) {
            console.error(`❌ Error WebSocket: ${error}`);
        }
    }, [isConnected, error, user]);

    return (
        <AppLayoutTemplate breadcrumbs={breadcrumbs} {...props}>
            {children}
            <Toaster
                position="top-right"
                reverseOrder={false}
                gutter={8}
                containerClassName=""
                containerStyle={{}}
                toastOptions={{
                    className: '',
                    duration: 4000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        style: { background: 'green' },
                    },
                    error: {
                        duration: 5000,
                        style: { background: 'red' },
                    },
                }}
            />
        </AppLayoutTemplate>
    );
}
```

**Ventajas:**
- Se ejecuta una sola vez (en el layout principal)
- Todas las páginas lo heredan
- Automático para todos los usuarios autenticados

### Opción 2: Conectar en Componentes Específicos

En páginas que necesiten datos en tiempo real:

```typescript
// resources/js/presentation/pages/logistica/entregas-en-transito.tsx
import { useWebSocket } from '@/application/hooks/use-websocket';
import { useTracking } from '@/application/hooks/use-tracking';

export default function EntregasEnTransito() {
    const { isConnected, subscribeTo } = useWebSocket({
        autoConnect: true
    });

    const { ubicacion, estadoActual } = useTracking({
        autoSubscribe: true  // Se suscribe automáticamente
    });

    useEffect(() => {
        if (isConnected) {
            // Suscribirse a eventos específicos
            subscribeTo('entrega.events');
        }
    }, [isConnected, subscribeTo]);

    return (
        // Renderizar con datos en tiempo real
    );
}
```

**Ventajas:**
- Control granular
- Solo cuando se necesita
- Menos overhead en páginas simples

### Opción 3: Conectar en el Login (ALTERNATIVA)

Conectar inmediatamente después de autenticar en el cliente:

```typescript
// resources/js/presentation/pages/auth/login.tsx
import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import websocketService from '@/infrastructure/services/websocket.service';

export default function Login() {
    const navigateRef = useRef(null);

    const handleLoginSuccess = async (user: any, token: string) => {
        // Guardar token
        localStorage.setItem('auth_token', token);

        // Conectar al WebSocket
        try {
            await websocketService.connect({
                auth: {
                    token,
                    userId: user.id,
                },
            });
            console.log('✅ WebSocket conectado en login');
        } catch (error) {
            console.warn('⚠️ WebSocket no conectó, continuando:', error);
        }

        // Navegar al dashboard
        window.location.href = '/dashboard';
    };

    return (
        // Formulario de login...
    );
}
```

---

## Estado de Variables de Entorno

### En `.env` de Laravel

```env
WEBSOCKET_URL=http://localhost:3000
WEBSOCKET_ENABLED=true
```

### En `.env.local` (si existe) o Vite

```env
VITE_WEBSOCKET_URL=http://192.168.5.239:3001  # ← Debe apuntar al servidor Node.js
VITE_API_URL=http://192.168.5.239:8000/api
```

**⚠️ Importante:**
- `VITE_WEBSOCKET_URL` debe ser la URL del servidor Node.js (puerto 3001)
- No la del servidor Laravel

---

## Cómo Verificar si Funciona

### 1. Verificar que el Token se Guarda

En la consola del navegador después de login:

```javascript
localStorage.getItem('auth_token')
// Debería retornar algo como: "1|abc123token..."
```

### 2. Verificar que WebSocket Intenta Conectar

Si implementas la solución, verás en consola:

```
✅ WebSocket conectado para usuario Juan Pérez
```

O si hay error:

```
❌ Error WebSocket: No authentication token found
```

### 3. Verificar en DevTools

Abre DevTools → Network → WS (WebSocket)

Deberías ver una conexión a:
```
ws://192.168.5.239:3001/socket.io/?...
```

### 4. Verificar en Servidor Node.js

El log del servidor debería mostrar:

```
🔌 Nueva conexión:
   Socket ID: xxxxx
   IP Cliente: 192.168.1.100

✅ Usuario autenticado (Token Sanctum):
   Nombre: Juan Pérez
   Email: juan@email.com
   Tipo: client
```

---

## Recomendación Final

### Implementar en Orden:

1. **PRIMERO:** Modifica `app-layout.tsx` (Opción 1)
   - Es el lugar más lógico
   - Beneficia a toda la app
   - Tiempo: 5 minutos

2. **SEGUNDO:** Verifica que conecta
   - Revisa consola del navegador
   - Revisa logs del servidor Node.js
   - Prueba escuchando un evento

3. **TERCERO:** Actualiza componentes específicos
   - `entregas-en-transito.tsx`
   - `seguimiento.tsx`
   - Otros que necesiten datos en tiempo real

4. **CUARTO (Opcional):** Implementa sincronización bidireccional
   - Cuando el usuario actualiza datos
   - Otros usuarios ven cambios en tiempo real

---

## Checklist de Implementación

- [ ] Modificar `app-layout.tsx` para usar `useWebSocket`
- [ ] Verificar que el hook obtiene token de localStorage
- [ ] Revisar consola del navegador: "✅ WebSocket conectado"
- [ ] Revisar logs del servidor Node.js
- [ ] Configurar `VITE_WEBSOCKET_URL` en `.env.local`
- [ ] Probar que se reciben eventos en tiempo real
- [ ] Actualizar componentes para usar hooks WebSocket
- [ ] Implementar re-render en tiempo real en tablas
- [ ] Agregar visual feedback cuando WebSocket desconecta
- [ ] Manejar reconexión automática

---

## Información de Debugging

### Si no conecta:

1. **Verificar que el servidor Node.js está activo:**
   ```bash
   node server.js
   ```

2. **Verificar que el token existe:**
   ```javascript
   localStorage.getItem('auth_token')
   ```

3. **Verificar URL del WebSocket:**
   ```javascript
   import.meta.env.VITE_WEBSOCKET_URL
   // Debe retornar: http://192.168.5.239:3001
   ```

4. **Verificar logs del navegador:**
   ```
   DevTools → Console → Filtrar por "WebSocket"
   ```

5. **Verificar logs del servidor:**
   ```
   Terminal donde corre: node server.js
   ```

---

**Conclusión:**

React **ya tiene toda la infraestructura** para conectarse al WebSocket. Solo **necesita inicializar la conexión** en un lugar apropiado (app-layout es ideal). Una vez hecho, funcionará automáticamente para todos los usuarios autenticados.

**Tiempo estimado de implementación: 10-15 minutos** ⏱️
