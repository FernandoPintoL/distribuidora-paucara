# Integración de Google Maps en Distribuidora Paucara

## 📍 Descripción General

Este documento describe la integración de Google Maps API en la aplicación para:
- **Registro de coordenadas** de clientes, proveedores y empleados
- **Visualización de rutas** para logística y entregas
- **Geocodificación** (dirección ↔ coordenadas)
- **Cálculo de distancias** y tiempos de viaje

---

## 🔧 Configuración Inicial

### 1. Variables de Entorno

Ya está configurado en tu `.env`:

```env
# Google Maps API
GOOGLE_MAPS_API_KEY=AIzaSyBfD5uDkc4vJcd7on1yFBJVdgmYV5XTrHA
VITE_GOOGLE_MAPS_API_KEY="${GOOGLE_MAPS_API_KEY}"
```

### 2. Librería Instalada

```bash
npm install @vis.gl/react-google-maps
```

Esta es la librería oficial y moderna de Google para React.

---

## 📦 Componentes Disponibles

### 1. **MapPicker** - Selector de Coordenadas

Permite seleccionar ubicaciones en el mapa mediante:
- Clic directo en el mapa
- Búsqueda de direcciones
- Geocodificación inversa (coordenadas → dirección)

**Ubicación:** `resources/js/presentation/components/maps/MapPicker.tsx`

**Características:**
- ✅ Búsqueda de direcciones con autocompletado
- ✅ Geocodificación inversa automática
- ✅ Validación de coordenadas
- ✅ Soporte para modo disabled
- ✅ Personalización de altura y estilo
- ✅ Manejo de errores

**Ejemplo de uso:**

```tsx
import MapPicker from '@/presentation/components/maps/MapPicker';

<MapPicker
    latitude={-17.78629}
    longitude={-63.18117}
    onLocationSelect={(lat, lng, address) => {
        console.log('Coordenadas:', lat, lng);
        console.log('Dirección:', address);
    }}
    label="Ubicación del cliente"
    description="Selecciona la ubicación exacta"
    disabled={false}
    height="400px"
/>
```

### 2. **RouteMap** - Visualización de Rutas

Muestra rutas optimizadas entre múltiples puntos con información de distancia y duración.

**Ubicación:** `resources/js/presentation/components/maps/RouteMap.tsx`

**Características:**
- ✅ Cálculo automático de rutas
- ✅ Optimización de puntos intermedios
- ✅ Distancia y tiempo estimado
- ✅ Marcadores personalizados por tipo
- ✅ Soporte para múltiples waypoints
- ✅ Información detallada de cada punto

**Ejemplo de uso:**

```tsx
import RouteMap, { RoutePoint } from '@/presentation/components/maps/RouteMap';

const puntos: RoutePoint[] = [
    {
        id: 1,
        name: 'Distribuidora Paucara',
        latitude: -17.78629,
        longitude: -63.18117,
        type: 'origin',
        description: 'Punto de partida'
    },
    {
        id: 2,
        name: 'Cliente A',
        latitude: -17.79000,
        longitude: -63.19000,
        type: 'waypoint',
        description: 'Primera parada'
    },
    {
        id: 3,
        name: 'Cliente B',
        latitude: -17.80000,
        longitude: -63.20000,
        type: 'destination',
        description: 'Destino final'
    }
];

<RouteMap
    points={puntos}
    showRoute={true}
    showDistance={true}
    showDuration={true}
    optimizeRoute={true}
    height="600px"
    onRouteCalculated={(distance, duration) => {
        console.log('Distancia total:', distance, 'metros');
        console.log('Duración total:', duration, 'segundos');
    }}
/>
```

---

## 🪝 Hook Personalizado

### **useGoogleMaps**

Hook que facilita operaciones comunes con Google Maps.

**Ubicación:** `resources/js/hooks/use-google-maps.ts`

**Funciones disponibles:**

```tsx
import { useGoogleMaps } from '@/hooks/use-google-maps';

const {
    // Estados
    isLoading,
    error,

    // Funciones
    geocodeAddress,        // Dirección → Coordenadas
    reverseGeocode,        // Coordenadas → Dirección
    calculateDistance,     // Distancia entre 2 puntos
    calculateRoute,        // Ruta completa con waypoints
    getCurrentLocation,    // Ubicación actual del navegador
    validateCoordinates,   // Validar coordenadas
    formatCoordinates     // Formatear para display
} = useGoogleMaps();
```

**Ejemplos de uso:**

```tsx
// 1. Geocodificar una dirección
const coords = await geocodeAddress('Av. Cristo Redentor, Santa Cruz');
// Retorna: { latitude: -17.78629, longitude: -63.18117 }

// 2. Geocodificación inversa
const address = await reverseGeocode(-17.78629, -63.18117);
// Retorna: { formattedAddress: 'Av. Cristo Redentor...', city: 'Santa Cruz', ... }

// 3. Calcular distancia
const distancia = calculateDistance(
    { latitude: -17.78629, longitude: -63.18117 },
    { latitude: -17.79000, longitude: -63.19000 }
);
// Retorna: 1234.56 (metros)

// 4. Calcular ruta completa
const ruta = await calculateRoute(
    { latitude: -17.78629, longitude: -63.18117 }, // origen
    { latitude: -17.80000, longitude: -63.20000 }, // destino
    [
        { latitude: -17.79000, longitude: -63.19000 }, // waypoint 1
    ],
    true // optimizar
);
// Retorna: { distance: 5432, duration: 780, distanceText: '5.43 km', durationText: '13 min' }

// 5. Obtener ubicación actual
const ubicacion = await getCurrentLocation();
// Retorna: { latitude: -17.78629, longitude: -63.18117 }
```

---

## 🎯 Integración en Formularios

El MapPicker ya está integrado en los formularios de:
- ✅ **Clientes** (`resources/js/config/clientes.config.ts`)
- ✅ **Proveedores** (`resources/js/config/proveedores.config.ts`)
- ✅ **Empleados** (`resources/js/config/empleados.config.ts`)

### Cómo funciona

Cuando creas o editas un cliente, proveedor o empleado, encontrarás un campo **"Ubicación en el mapa"** que:

1. Muestra un mapa interactivo
2. Permite buscar direcciones
3. Permite hacer clic en el mapa para seleccionar
4. Guarda automáticamente `latitud` y `longitud` en la base de datos

**Nota importante:** Los campos `latitud` y `longitud` se manejan automáticamente. El componente `MapPicker` actualiza ambos campos cuando seleccionas una ubicación.

---

## 💼 Casos de Uso para Logística

### 1. Planificación de Rutas de Entrega

```tsx
import RouteMap from '@/presentation/components/maps/RouteMap';

// En tu componente de planificación de entregas
const entregas = [
    { id: 'origen', name: 'Distribuidora', lat: -17.78, lng: -63.18, type: 'origin' },
    ...clientesDelDia.map(c => ({
        id: c.id,
        name: c.nombre,
        latitude: c.latitud,
        longitude: c.longitud,
        type: 'waypoint',
        description: c.direccion
    })),
    { id: 'destino', name: 'Retorno', lat: -17.78, lng: -63.18, type: 'destination' }
];

<RouteMap
    points={entregas}
    optimizeRoute={true}
    onRouteCalculated={(distance, duration) => {
        // Guardar información de la ruta
        setDistanciaTotal(distance);
        setTiempoEstimado(duration);
    }}
/>
```

### 2. Asignación de Clientes por Zona

```tsx
import { useGoogleMaps } from '@/hooks/use-google-maps';

const { calculateDistance } = useGoogleMaps();

// Asignar clientes al repartidor más cercano
const asignarRepartidor = (cliente) => {
    const distancias = repartidores.map(r => ({
        repartidor: r,
        distancia: calculateDistance(
            { latitude: r.latitud, longitude: r.longitud },
            { latitude: cliente.latitud, longitude: cliente.longitud }
        )
    }));

    // Ordenar por distancia y asignar al más cercano
    const masCercano = distancias.sort((a, b) => a.distancia - b.distancia)[0];
    return masCercano.repartidor;
};
```

### 3. Cálculo de Costos por Distancia

```tsx
const { calculateRoute } = useGoogleMaps();

const calcularCostoEntrega = async (origen, destino) => {
    const ruta = await calculateRoute(origen, destino);

    if (ruta) {
        const kmRecorridos = ruta.distance / 1000; // metros a km
        const costoPorKm = 5; // Bs. por km
        const costoTotal = kmRecorridos * costoPorKm;

        return {
            distancia: ruta.distanceText,
            tiempo: ruta.durationText,
            costo: costoTotal.toFixed(2) + ' Bs.'
        };
    }
};
```

---

## 🎨 Personalización

### Cambiar Centro del Mapa por Defecto

Edita en `MapPicker.tsx` o `RouteMap.tsx`:

```tsx
const DEFAULT_CENTER = { lat: -17.78629, lng: -63.18117 }; // Santa Cruz
const DEFAULT_ZOOM = 13;
```

### Estilos de Marcadores

En `RouteMap.tsx`, función `getPinColor`:

```tsx
const getPinColor = (type?: string) => {
    switch (type) {
        case 'origin': return { background: '#22c55e', borderColor: '#16a34a' }; // Verde
        case 'destination': return { background: '#ef4444', borderColor: '#dc2626' }; // Rojo
        case 'waypoint': return { background: '#f59e0b', borderColor: '#d97706' }; // Amarillo
        default: return { background: '#2563eb', borderColor: '#1e40af' }; // Azul
    }
};
```

---

## 📊 Migraciones Necesarias

Asegúrate de que las tablas tengan los campos necesarios:

```sql
-- Para clientes
ALTER TABLE clientes ADD COLUMN latitud DECIMAL(10, 8) NULL;
ALTER TABLE clientes ADD COLUMN longitud DECIMAL(11, 8) NULL;

-- Para proveedores
ALTER TABLE proveedores ADD COLUMN latitud DECIMAL(10, 8) NULL;
ALTER TABLE proveedores ADD COLUMN longitud DECIMAL(11, 8) NULL;

-- Para empleados
ALTER TABLE empleados ADD COLUMN latitud DECIMAL(10, 8) NULL;
ALTER TABLE empleados ADD COLUMN longitud DECIMAL(11, 8) NULL;
```

---

## 🚀 Próximas Mejoras Sugeridas

1. **Geocerca (Geofencing)**: Alertas cuando empleados entran/salen de zonas
2. **Tracking en Tiempo Real**: Seguimiento de vehículos con GPS
3. **Heatmap de Ventas**: Mapa de calor con zonas más vendidas
4. **Cluster de Marcadores**: Agrupar clientes cercanos
5. **Integración con Waze/Google Maps**: Abrir rutas en app nativa

---

## 🔐 Seguridad

**Restricciones de API Key:**

Es importante que configures restricciones en tu Google Cloud Console:

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. API & Services → Credentials
3. Edita tu API Key
4. En "Application restrictions" → selecciona "HTTP referrers"
5. Agrega tus dominios permitidos:
   - `http://localhost:*`
   - `http://192.168.1.23:*`
   - `https://tupucara.com/*` (cuando vayas a producción)

---

## 📝 Notas Importantes

1. **Límites de la API gratuita**:
   - 28,000 cargas de mapa por mes gratis
   - $200 USD de crédito mensual

2. **APIs habilitadas requeridas**:
   - Maps JavaScript API
   - Geocoding API
   - Directions API
   - Places API (opcional)

3. **Performance**:
   - Los componentes están optimizados con memoización
   - La librería `@vis.gl/react-google-maps` es muy eficiente

---

## 🐛 Troubleshooting

### Error: "Google Maps API key no configurada"

**Solución:** Verifica que `VITE_GOOGLE_MAPS_API_KEY` esté en tu `.env` y reinicia el servidor de desarrollo (`npm run dev`).

### Error: "This API project is not authorized to use this API"

**Solución:** Habilita las APIs necesarias en Google Cloud Console (Maps JavaScript API, Geocoding API, Directions API).

### El mapa se muestra gris

**Solución:** Revisa la consola del navegador. Puede ser:
- API Key inválida
- Restricciones de dominio muy estrictas
- Billing no configurado en Google Cloud

---

## 📚 Recursos Adicionales

- [Documentación oficial de @vis.gl/react-google-maps](https://visgl.github.io/react-google-maps/)
- [Google Maps Platform](https://developers.google.com/maps)
- [Geocoding API Docs](https://developers.google.com/maps/documentation/geocoding)
- [Directions API Docs](https://developers.google.com/maps/documentation/directions)

---

**Creado para Distribuidora Paucara**
**Fecha:** $(date)
**Versión:** 1.0.0
