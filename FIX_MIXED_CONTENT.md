# 🔒 Solución: Mixed Content Error en Producción

## Problema
```
Mixed Content: The page at 'https://paucara.up.railway.app/productos'
was loaded over HTTPS, but requested an insecure XMLHttpRequest endpoint
'http://paucara.up.railway.app/productos?page=3'
```

## ✅ Soluciones Implementadas

### 1. Frontend - Normalización de URLs (IMPLEMENTADA)

Se agregó normalización automática en dos lugares:

#### **A. En axios.config.ts**
```typescript
// Convierte http:// a URLs relativas si están en el mismo dominio
if (config.url && config.url.startsWith('http://')) {
    const url = new URL(config.url);
    const currentUrl = new URL(window.location.href);
    if (url.hostname === currentUrl.hostname) {
        config.url = url.pathname + url.search + url.hash;
    }
}
```

#### **B. En generic-pagination.tsx**
```typescript
// Normaliza URLs antes de navegar
const normalizeUrl = (url: string): string => {
    if (url.startsWith('http://')) {
        const parsedUrl = new URL(url);
        const currentUrl = new URL(window.location.href);
        if (parsedUrl.hostname === currentUrl.hostname) {
            return parsedUrl.pathname + parsedUrl.search + parsedUrl.hash;
        }
    }
    return url;
};
```

**Beneficio:** Permite que funcione aunque el backend envíe URLs con `http://`

---

### 2. Backend - Solución Definitiva (PENDIENTE)

Para una solución permanente y correcta, configura el archivo `.env` en producción:

#### **Railway.app Configuration**

En tu **Panel de Control de Railway.app**, establece las variables de entorno:

```env
# ✅ CORRECTO para producción con HTTPS
APP_URL=https://paucara.up.railway.app

# Configurar confianza en proxies (si está detrás de nginx/reverse proxy)
LARAVEL_TRUSTED_PROXIES=*
LARAVEL_TRUSTED_HOSTS=paucara.up.railway.app
```

#### **O en config/app.php (alternativa)**

Si no puedes modificar `.env`, edita `config/app.php`:

```php
// ✅ CORRECTO
'url' => env('APP_URL', 'https://paucara.up.railway.app'),

// Cambiar de:
'url' => env('APP_URL', 'http://localhost'),
```

#### **Middleware para confiar en Proxies (config/trustedproxy.php)**

Si Railway.app está detrás de un proxy reverso:

```php
// En bootstrap/app.php o config/trustedproxy.php
\Illuminate\Http\Middleware\TrustProxies::class,

// Configurar:
'proxies' => '*',
'headers' => \Illuminate\Http\Middleware\TrustProxies::HEADER_CF_CONNECTING_IP
```

---

## 📊 Prioridad de Soluciones

| # | Solución | Estado | Prioridad | Permanencia |
|---|----------|--------|-----------|------------|
| 1 | Frontend - Axios interceptor | ✅ Hecho | Alta | Temporal |
| 2 | Frontend - Pagination normalization | ✅ Hecho | Alta | Temporal |
| 3 | Backend - .env APP_URL | ⏳ Manual | Crítica | Permanente |
| 4 | Backend - Middleware TrustProxies | ⏳ Manual | Media | Permanente |

---

## 🚀 Pasos para Fijar Permanentemente

### Opción A: Railway.app Dashboard (Recomendado)

1. Ve a tu aplicación en railway.app
2. Variables → Environment Variables
3. Cambia:
   ```
   APP_URL=http://localhost  →  APP_URL=https://paucara.up.railway.app
   ```
4. Redeploy la aplicación
5. Limpia el cache: `php artisan config:clear` (se ejecuta automáticamente)

### Opción B: Git Push con .env.production

1. Crear `.env.production`:
   ```env
   APP_URL=https://paucara.up.railway.app
   LARAVEL_TRUSTED_PROXIES=*
   ```

2. Configurar Railway para usar `.env.production` en deployment

### Opción C: GitHub Secrets

Si usas GitHub Actions:

```yaml
- name: Deploy to Railway
  env:
    APP_URL: https://paucara.up.railway.app
    LARAVEL_TRUSTED_PROXIES: '*'
```

---

## ✔️ Verificación

Después de aplicar la solución permanente:

```bash
# En local
php artisan tinker
> config('app.url')
# Debería devolver: "https://paucara.up.railway.app"

# En producción, verificar en la consola del navegador
# No debería haber warnings de Mixed Content
```

---

## 📝 Archivos Modificados (Frontend)

- ✅ `resources/js/infrastructure/config/axios.config.ts`
- ✅ `resources/js/presentation/components/generic/generic-pagination.tsx`

## 📝 Archivos a Modificar (Backend)

- ⏳ `.env` (en Railway.app variables)
- ⏳ `config/app.php` (si es necesario override)
- ⏳ `bootstrap/app.php` (si hay proxy)

---

## 🔍 Debug

Si sigue habiendo problemas, ejecuta en la consola del navegador:

```javascript
// Ver las URLs que se están intentando cargar
fetch('/productos?page=2')
  .then(r => r.text())
  .then(console.log)
  .catch(e => console.error('Error:', e.message));
```

Debería devolver HTML sin errores de Mixed Content.

---

## 📞 Soporte Railway.app

- Documentación: https://docs.railway.app
- Configuración de variables: https://docs.railway.app/build/variables
- HTTPS automático: Railway automáticamente redirige HTTP → HTTPS

---

**Status:** ✅ Frontend Implementado | ⏳ Backend Pendiente Configuración

**Próximo Paso:** Actualizar `APP_URL` en Railway.app dashboard
