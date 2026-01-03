# 🗺️ Configuración de Google Maps API para Producción

## Problema
La API Key de Google Maps funciona en local pero falla en producción con error de permisos.

## Causas Principales

### 1. **Restricciones de Dominio en Google Cloud Console** ⚠️ (MÁS PROBABLE)
La API Key está configurada solo para ciertos dominios, y tu dominio de producción no está en la lista.

### 2. **Variable de Entorno no Expuesta**
La variable `VITE_GOOGLE_MAPS_API_KEY` no está siendo expuesta al bundle de producción.

### 3. **API Key Expirada o Deshabilitada**
La clave ha sido revocada o deshabilitada en Google Cloud Console.

---

## ✅ Solución Paso a Paso

### **Paso 1: Verificar la Variable de Entorno en Producción**

En tu servidor de producción, verifica que el archivo `.env` tenga:

```bash
# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=AIzaSyD-IfcYlV2hEBqRd96CPseCmmSA-BExigE
```

**Nota:** La clave DEBE tener el prefijo `VITE_` para que Vite la exponga al frontend.

### **Paso 2: Configurar Restricciones de Dominio en Google Cloud Console**

Este es el paso más importante:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Selecciona tu proyecto
3. Ve a **APIs & Services** → **Credentials**
4. Encuentra tu API Key (busca por "Browser key")
5. Haz clic en la clave para editarla
6. En **Application restrictions**, asegúrate que esté configurado como:
   - **HTTP referrers (web sites)**
7. En el campo de restricción, agrega:
   ```
   https://tudominio.com/*
   https://www.tudominio.com/*
   https://192.168.5.44/*  (si necesitas local también)
   ```

8. En **API restrictions**, verifica que tenga estas APIs habilitadas:
   - ✅ Maps JavaScript API
   - ✅ Static Maps API (si lo usas)

9. Haz clic en **Save**

### **Paso 3: Habilitar la API en Google Cloud**

Verifica que la `Maps JavaScript API` esté habilitada:

1. En Google Cloud Console, ve a **APIs & Services** → **Enabled APIs & Services**
2. Busca **Maps JavaScript API**
3. Si no está habilitada, haz clic en **+ Enable APIs and Services** y búscala
4. Haz clic en **Enable**

### **Paso 4: Rebuild y Deploy en Producción**

```bash
# En tu servidor de producción
cd /ruta/a/distribuidora-paucara-web

# Asegúrate que .env tenga la API key
echo "VITE_GOOGLE_MAPS_API_KEY=AIzaSyD-IfcYlV2hEBqRd96CPseCmmSA-BExigE" >> .env

# Reinstala dependencias y rebuild
npm install
npm run build

# Reinicia el servidor (si es necesario)
# systemctl restart your-app-service
```

### **Paso 5: Verificar que Funciona**

1. Abre la página de proformas/show en producción
2. Abre DevTools (F12)
3. Ve a la pestaña **Console**
4. Busca logs que digan:
   ```
   [MapView] Environment Check: {
       hasApiKey: true,
       apiKeyLength: 39,
       ...
   }
   ```

Si `hasApiKey` es `true`, la variable se cargó correctamente.

---

## 🔧 Diagnóstico Avanzado

### Componente de Diagnóstico
Hemos agregado un componente `GoogleMapsEnvDiagnostic` que puedes usar en desarrollo para verificar variables:

```tsx
import GoogleMapsEnvDiagnostic from '@/presentation/components/maps/GoogleMapsEnvDiagnostic';

// En tu componente:
<GoogleMapsEnvDiagnostic />
```

Esto mostrará un panel flotante en la esquina inferior derecha con:
- Estado de la API Key
- Dominio actual
- Sugerencias de solución

### Revisar los Logs del Navegador

En la consola del navegador (F12), busca:

```javascript
// Debería mostrar esto si todo está bien:
[MapView] Environment Check: {
    hasApiKey: true,
    apiKeyLength: 39,
    apiKeyPrefix: "AIzaSyD-I...",
    environment: "production",
    url: "https://tudominio.com"
}

// Si falla, verás:
[MapView] Load Error Details: {
    error: Error,
    message: "Google Maps API error: RefererNotAllowedMapError"
}
```

---

## 🚨 Errores Comunes y Soluciones

| Error | Causa | Solución |
|-------|-------|----------|
| `RefererNotAllowedMapError` | Dominio no está en la lista blanca | Agrega tu dominio a restricciones en Google Cloud |
| `InvalidKeyMapError` | API Key inválida o deshabilitada | Verifica que la clave esté activa en Google Cloud |
| `PermissionDeniedMapError` | API Key sin permisos | Habilita "Maps JavaScript API" en Google Cloud |
| `API key not specified` | Variable de entorno no se expuso | Asegúrate que la variable tiene prefijo `VITE_` |

---

## 📝 Checklist de Configuración

- [ ] `.env` en producción tiene `VITE_GOOGLE_MAPS_API_KEY`
- [ ] API Key agregada a restricciones de dominio en Google Cloud
- [ ] `Maps JavaScript API` está habilitada
- [ ] Se ejecutó `npm run build` después de cambios
- [ ] Se redeployó la aplicación
- [ ] Se verifica en DevTools que `hasApiKey` es `true`

---

## 💡 Alternativa: Usar API Key del Backend

Si los problemas persisten, puedes mover la API Key al backend:

```php
// En Laravel Controller
public function show($id) {
    return inertia('proformas/Show', [
        'mapsApiKey' => config('services.google.maps_api_key'),
    ]);
}
```

```tsx
// En React
<MapView
    latitude={proforma.latitude}
    longitude={proforma.longitude}
    apiKey={mapsApiKey}  // Pasada desde el servidor
/>
```

Esto añade una capa de seguridad evitando exponer la clave al código frontend.

---

## 📞 Soporte

Si el problema persiste:
1. Revisa el archivo `.env.production` en el servidor
2. Verifica los logs en DevTools
3. Contacta al soporte de Google Cloud
4. Regenera una nueva API Key si es necesario
