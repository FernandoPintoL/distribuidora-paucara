# 📁 Estructura del Directorio `resources/`

Este documento explica el propósito de cada directorio en la carpeta `resources/`.

---

## 🎨 `resources/css/`

**Propósito**: Estilos globales y hojas de estilo de la aplicación.

```
resources/css/
├── app.css              ← Estilos globales principales
└── ... (otros estilos)
```

**Contiene**:
- Estilos Tailwind CSS
- Variables CSS globales
- Temas (dark mode, light mode)
- Estilos base

**Ejemplo**:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

---

## 💻 `resources/js/`

**Propósito**: Todo el código JavaScript/React de la aplicación frontend.

### 📂 Subdirectorios de `resources/js/`:

#### **`actions/`**
**Propósito**: Acciones de estado (Redux, Context) y lógica de lado del servidor.

```
actions/
├── App/
│   └── Http/Controllers/    ← Tipos/interfaces de controladores del backend
└── ...
```

**Uso**:
- Sincronizar tipos TypeScript con controladores PHP
- Acciones de Redux/Context (si lo usas)
- Lógica de estado compartido

---

#### **`application/`**
**Propósito**: Configuración global de la aplicación y punto de entrada.

```
application/
├── app.tsx              ← Componente raíz de React
├── entrypoint.ts        ← Punto de entrada (index)
└── ...
```

**Contiene**:
- Configuración global de React
- Providers (Context, Redux, etc.)
- Inicialización de librerías

---

#### **`config/`**
**Propósito**: Archivos de configuración constantes de la aplicación.

```
config/
├── app.ts               ← Configuración general
├── api.ts               ← Configuración de API
├── auth.ts              ← Configuración de autenticación
└── ...
```

**Ejemplo**:
```typescript
// config/api.ts
export const API_BASE_URL = process.env.VITE_API_URL;
export const API_TIMEOUT = 30000;
export const API_HEADERS = { 'Content-Type': 'application/json' };
```

---

#### **`domain/`** ⭐
**Propósito**: Lógica de negocio específica de cada dominio.

```
domain/
├── modulos/                 ← Dominio de Módulos Sidebar
│   ├── types.ts            ← Interfaces del dominio
│   ├── services.ts         ← Lógica de negocio
│   ├── hooks.ts            ← Custom hooks
│   ├── config.ts           ← Constantes del dominio
│   └── README.md           ← Documentación
├── usuarios/                ← Dominio de Usuarios
│   ├── types.ts
│   ├── services.ts
│   └── ...
├── productos/               ← Dominio de Productos
│   ├── types.ts
│   ├── services.ts
│   └── ...
└── ... (otros dominios)
```

**Propósito**:
- Cada dominio es un área de negocio independiente
- Encapsula tipos, lógica y configuración de esa área
- Reutilizable en múltiples componentes
- Seguir arquitectura de 3 capas

**Ejemplo**:
- Dominio `modulos`: Todo lo relacionado con módulos del sidebar
- Dominio `usuarios`: Todo lo relacionado con gestión de usuarios
- Dominio `productos`: Todo lo relacionado con productos

---

#### **`infrastructure/`**
**Propósito**: Código de infraestructura y utilidades técnicas.

```
infrastructure/
├── http/                    ← Cliente HTTP
├── storage/                 ← Local storage, sesión
├── logger/                  ← Sistema de logs
└── ...
```

**Contiene**:
- Cliente HTTP/Axios configurado
- Sistema de caché
- Sistema de logs
- Utilidades de almacenamiento

---

#### **`layouts/`**
**Propósito**: Componentes de diseño (layouts) reutilizables.

```
layouts/
├── app-layout.tsx           ← Layout principal de la app
├── auth-layout.tsx          ← Layout para páginas de auth
├── admin-layout.tsx         ← Layout para admin
└── ...
```

**Uso**:
- Estructura común de páginas
- Header, sidebar, footer
- Estilos compartidos de layout

**Ejemplo**:
```typescript
// layouts/app-layout.tsx
export default function AppLayout({ children }) {
    return (
        <div className="flex">
            <Sidebar />
            <main>{children}</main>
        </div>
    );
}
```

---

#### **`lib/`**
**Propósito**: Utilidades y helpers generales de la aplicación.

```
lib/
├── utils.ts                 ← Funciones utilitarias
├── cn.ts                    ← Merge de clases CSS
├── format.ts                ← Formateo de datos
└── ...
```

**Contiene**:
- Funciones helper reutilizables
- Utilidades de fecha, número, string
- Funciones de validación

**Ejemplo**:
```typescript
// lib/utils.ts
export function cn(...classes) {
    return classes.filter(Boolean).join(' ');
}

export function formatDate(date: Date) {
    return new Intl.DateTimeFormat('es-ES').format(date);
}
```

---

#### **`presentation/`** ⭐
**Propósito**: Componentes de interfaz de usuario (UI).

```
presentation/
├── components/              ← Componentes React reutilizables
│   ├── ui/                  ← Componentes primitivos (Button, Input, etc.)
│   ├── forms/               ← Componentes de formularios
│   ├── modulos/             ← Componentes específicos del dominio
│   └── ...
├── pages/                   ← Páginas/vistas de la aplicación
│   ├── ModulosSidebar/
│   │   ├── Index.tsx        ← Página principal
│   │   ├── ModuloForm.tsx   ← Componente de formulario
│   │   └── ...
│   ├── Dashboard/
│   │   └── Index.tsx
│   └── ...
└── ... (otros)
```

**Componentes UI Primitivos** (`components/ui/`):
- Button, Input, Select, Dialog
- Card, Badge, Alert
- Table, Dropdown

Son componentes "tontos" (dumb) sin lógica de negocio.

**Componentes de Dominio** (`components/`):
- PermisosMultiSelect
- MatrizAccesoRol
- ModulosFiltros

Son componentes que usan lógica de negocio específica del dominio.

**Páginas** (`pages/`):
- Componentes inteligentes (smart components)
- Manejan estado
- Coordinan múltiples componentes
- Típicamente una página por ruta

---

#### **`routes/`**
**Propósito**: Definición de rutas (enrutamiento) de la aplicación.

```
routes/
├── index.ts                 ← Ruta raíz
├── admin/
│   └── index.ts
├── modulos-sidebar/
│   └── index.ts
├── api/
│   ├── usuarios/
│   ├── productos/
│   └── ...
└── ...
```

**Contiene**:
- Definición de rutas públicas
- Definición de rutas privadas (protegidas)
- Definición de rutas API
- Middleware de autenticación

**Ejemplo**:
```typescript
// routes/modulos-sidebar/index.ts
export default {
    path: '/modulos-sidebar',
    component: ModulosSidebar,
    meta: { requiresAuth: true }
};
```

---

#### **`services/`**
**Propósito**: Servicios de API y comunicación con backend.

```
services/
├── csrf.ts                  ← Gestión de CSRF token
├── modulos-api.ts           ← API calls de módulos
├── usuarios-api.ts          ← API calls de usuarios
└── ...
```

**Contiene**:
- Funciones de API (fetch, axios)
- Interceptores
- Gestión de errores
- Transformación de datos

**Nota**: Diferencia con `domain/modulos/services.ts`:
- `services/modulos-api.ts`: Llamadas HTTP (Capa de Datos)
- `domain/modulos/services.ts`: Lógica de negocio (Capa de Negocio)

---

#### **`stores/`**
**Propósito**: Gestión de estado global (Pinia, Redux, Context).

```
stores/
├── auth.store.ts            ← Estado de autenticación
├── app.store.ts             ← Estado de la app
└── ...
```

**Contiene**:
- State management
- Actions
- Getters/Selectors
- Mutations

---

#### **`types/`**
**Propósito**: Tipos TypeScript globales y compartidos.

```
types/
├── index.ts                 ← Tipos generales
├── api.ts                   ← Tipos de respuestas API
├── common.ts                ← Tipos comunes
└── ...
```

**Uso**:
- Tipos compartidos por múltiples dominios
- Tipos de respuestas del backend
- Tipos globales que no pertenecen a ningún dominio específico

**Diferencia con `domain/modulos/types.ts`**:
- `types/`: Tipos globales
- `domain/modulos/types.ts`: Tipos específicos del dominio

---

#### **`wayfinder/`**
**Propósito**: Sistema de navegación y rutas dinámicas.

```
wayfinder/
├── index.ts                 ← Punto de entrada
├── routes.ts                ← Definición de rutas
└── ...
```

**Contiene**:
- Generador de rutas
- Sistema de navegación
- Rutas tipadas

---

## 📄 `resources/lang/`

**Propósito**: Archivos de internacionalización (i18n) - traducciones.

```
resources/lang/
├── es/                      ← Español
│   ├── messages.json
│   ├── validation.json
│   └── ...
├── en/                      ← English
│   └── ...
└── ...
```

**Contiene**:
- Traducciones de mensajes
- Traducciones de validaciones
- Textos en múltiples idiomas

---

## 🎬 `resources/views/`

**Propósito**: Plantillas Blade de Laravel (para renderizado del lado del servidor).

```
resources/views/
├── app.blade.php            ← Plantilla principal (SPA)
├── exports/                 ← Vistas para exportación
└── ...
```

**Nota**: En aplicaciones SPA (Single Page Application), `app.blade.php` es la única vista que se renderiza, el resto es React.

---

## 📊 Diagrama de Relaciones

```
resources/
│
├── css/                 ← Estilos globales
│
├── js/
│   ├── config/          ← Configuración global
│   ├── types/           ← Tipos globales
│   ├── lib/             ← Utilidades generales
│   │
│   ├── domain/          ← LÓGICA DE NEGOCIO (por dominio)
│   │   ├── modulos/
│   │   │   ├── types.ts        (Tipos del dominio)
│   │   │   ├── services.ts     (Lógica de negocio)
│   │   │   └── hooks.ts        (Custom hooks)
│   │   └── ... (otros dominios)
│   │
│   ├── services/        ← API / CAPA DE DATOS
│   │   ├── modulos-api.ts
│   │   └── ...
│   │
│   ├── presentation/    ← INTERFAZ DE USUARIO
│   │   ├── components/  (Componentes reutilizables)
│   │   └── pages/       (Páginas/vistas)
│   │
│   ├── layouts/         ← Layouts compartidos
│   ├── routes/          ← Enrutamiento
│   ├── stores/          ← Estado global
│   ├── actions/         ← Acciones compartidas
│   ├── infrastructure/  ← Código técnico
│   ├── application/     ← Configuración app
│   └── wayfinder/       ← Sistema de navegación
│
├── lang/                ← Traducciones (i18n)
│
└── views/               ← Plantillas Blade
```

---

## 🏗️ Arquitectura: 3 Capas

Los directorios `domain/`, `services/`, y `presentation/` implementan la arquitectura 3 capas:

```
presentation/       ← CAPA 1: Interfaz de Usuario
    ↓
domain/            ← CAPA 2: Lógica de Negocio
    ↓
services/          ← CAPA 3: Capa de Datos (API)
    ↓
Backend (Laravel)
```

---

## 📚 Resumen Rápido

| Directorio | Propósito | Ejemplo |
|-----------|-----------|---------|
| `css/` | Estilos globales | Tailwind, temas |
| `config/` | Configuración global | API URL, timeouts |
| `types/` | Tipos globales | Respuestas API genéricas |
| `lib/` | Utilidades | formatDate(), cn() |
| **`domain/`** | **Lógica de negocio** | **modulos/services.ts** |
| **`services/`** | **Llamadas a API** | **modulos-api.ts** |
| **`presentation/`** | **Componentes UI** | **Pages, Components** |
| `layouts/` | Layouts compartidos | AppLayout |
| `routes/` | Enrutamiento | Definición de rutas |
| `stores/` | Estado global | Pinia, Redux |
| `actions/` | Acciones compartidas | Tipos de backend |
| `infrastructure/` | Código técnico | HTTP client, logs |
| `application/` | Configuración app | App root |
| `wayfinder/` | Sistema de navegación | Rutas tipadas |
| `lang/` | Traducciones | i18n, mensajes |
| `views/` | Plantillas Blade | app.blade.php |

---

## ✅ Buenas Prácticas

1. **Coloca lógica de negocio en `domain/`** (no en componentes)
2. **Coloca llamadas a API en `services/`** (no en componentes)
3. **Coloca solo UI en `presentation/`** (componentes puros)
4. **Usa tipos específicos en `domain/tipos.ts`**
5. **Mantén constantes globales en `config/`**
6. **Reutiliza componentes base de `presentation/components/ui/`**

---

## 🎯 Cuando crear un nuevo directorio

- **¿Nuevo dominio de negocio?** → Crea en `domain/nuevo-dominio/`
- **¿Nuevas utilidades?** → Agrega a `lib/`
- **¿Nueva llamada API?** → Agrega a `services/nuevo-api.ts`
- **¿Nuevo componente reutilizable?** → Agrega a `presentation/components/`
- **¿Nueva página?** → Agrega a `presentation/pages/nueva-pagina/`
- **¿Nueva configuración?** → Agrega a `config/`
