# Configuración de Clientes en Railway

Esta documentación explica cómo configurar múltiples clientes en Railway usando el mismo código base con branding dinámico (logos y favicons diferentes por cliente).

## Estructura de Carpetas

```
public/
├── favicons/
│   ├── DistribuidoraPaucara/
│   │   ├── favicon.ico
│   │   ├── favicon.svg
│   │   └── apple-touch-icon.png
│   └── GestorLP/
│       ├── favicon.ico
│       ├── favicon.svg
│       └── apple-touch-icon.png
└── logos/
    ├── DistribuidoraPaucara/
    │   ├── logo.svg
    │   └── logo.png
    └── GestorLP/
        ├── logo.svg
        └── logo.png
```

## Variables de Entorno por Cliente

Cada cliente en Railway debe tener estas variables de entorno configuradas:

### Cliente: DistribuidoraPaucara

```env
# Logos
VITE_LOGO_SVG=/logos/DistribuidoraPaucara/logo.svg
VITE_LOGO_PNG=/logos/DistribuidoraPaucara/logo.png
VITE_LOGO_ALT=Distribuidora Paucara

# Favicons
FAVICON_ICO=/favicons/DistribuidoraPaucara/favicon.ico
FAVICON_SVG=/favicons/DistribuidoraPaucara/favicon.svg
APPLE_TOUCH_ICON=/favicons/DistribuidoraPaucara/apple-touch-icon.png
```

### Cliente: GestorLP

```env
# Logos
VITE_LOGO_SVG=/logos/GestorLP/logo.svg
VITE_LOGO_PNG=/logos/GestorLP/logo.png
VITE_LOGO_ALT=GestorLP

# Favicons
FAVICON_ICO=/favicons/GestorLP/favicon.ico
FAVICON_SVG=/favicons/GestorLP/favicon.svg
APPLE_TOUCH_ICON=/favicons/GestorLP/apple-touch-icon.png
```

## Pasos para Configurar en Railway

1. **Crear un nuevo proyecto en Railway** (si no existe)
2. **Conectar el repositorio** a ese proyecto
3. **En la sección de Variables** agregar las 3 variables de entorno correspondientes al cliente
4. **Deployar** normalmente

## Cómo Agregar un Nuevo Cliente

1. **Crear carpetas de assets**:
   ```bash
   mkdir public/favicons/NombreCliente
   mkdir public/logos/NombreCliente
   ```

2. **Colocar archivos**:
   - Favicons: `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`
   - Logos: `logo.svg`, `logo.png`

3. **Agregar variables de entorno** en Railway:
   ```env
   # Logos
   VITE_LOGO_SVG=/logos/NombreCliente/logo.svg
   VITE_LOGO_PNG=/logos/NombreCliente/logo.png
   VITE_LOGO_ALT=Nombre Cliente

   # Favicons
   FAVICON_ICO=/favicons/NombreCliente/favicon.ico
   FAVICON_SVG=/favicons/NombreCliente/favicon.svg
   APPLE_TOUCH_ICON=/favicons/NombreCliente/apple-touch-icon.png
   ```

4. **Deployar** con Railway

## Valores por Defecto

Si no se especifican las variables de entorno, se usan los valores predeterminados:

**Logos:**
- `VITE_LOGO_SVG`: `/logo.svg`
- `VITE_LOGO_PNG`: `/logo.png`
- `VITE_LOGO_ALT`: `Distribuidora Paucara`

**Favicons:**
- `FAVICON_ICO`: `/favicon.ico`
- `FAVICON_SVG`: `/favicon.svg`
- `APPLE_TOUCH_ICON`: `/apple-touch-icon.png`

## Archivos Templates Dinámicos

### Backend - `resources/views/app.blade.php` (Favicons)

```blade
<link rel="icon" href="{{ env('FAVICON_ICO', '/favicon.ico') }}" sizes="any">
<link rel="icon" href="{{ env('FAVICON_SVG', '/favicon.svg') }}" type="image/svg+xml">
<link rel="apple-touch-icon" href="{{ env('APPLE_TOUCH_ICON', '/apple-touch-icon.png') }}">
```

### Frontend - Componentes React (Logos)

**`resources/js/presentation/components/app-logo.tsx`** (Menú Lateral):
```typescript
const logoSvg = import.meta.env.VITE_LOGO_SVG || '/logo.svg';
const logoAlt = import.meta.env.VITE_LOGO_ALT || 'Distribuidora Paucara';

<img src={logoSvg} alt={logoAlt} className="h-12 w-auto" />
```

**`resources/js/layouts/auth/auth-simple-layout.tsx`** (Login):
```typescript
const logoSvg = import.meta.env.VITE_LOGO_SVG || '/logo.svg';
const logoAlt = import.meta.env.VITE_LOGO_ALT || 'Distribuidora Paucara';

<img src={logoSvg} alt={logoAlt} className="h-12 w-auto" />
```

## Resumen de Cambios Implementados

✅ **Favicons dinámicos** - Backend (Laravel/Blade)
✅ **Logos dinámicos** - Frontend (React via Vite env vars)
✅ **Nombre de empresa dinámico** - Sidebar y Login
✅ **Estructura de carpetas** - `public/favicons/` y `public/logos/`
✅ **Config centralizada** - `config/branding.php`
✅ **Variables de entorno** - `.env.example` con ejemplos

---

**Ventajas de esta solución:**
✅ Un solo código base para múltiples clientes
✅ Logos y favicons independientes por cliente
✅ Nombres de empresa dinámicos en UI
✅ Fácil de escalar a nuevos clientes
✅ Sin cambios de código en el repositorio
✅ Solo configuración de variables de entorno en Railway
✅ Valores por defecto para desarrollo local
