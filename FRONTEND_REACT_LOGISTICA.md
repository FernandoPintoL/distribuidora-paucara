# 🌐 ARQUITECTURA FRONTEND REACT - MÓDULO LOGÍSTICA

**Versión:** 2.0
**Fecha de actualización:** 31 de Octubre de 2025
**Plataforma:** React + Inertia.js + TypeScript
**Gestor:** Gestor de React
**Estado:** ⚠️ Parcialmente implementado (estructura base existe)

---

## 📋 ÍNDICE

1. [Visión General](#visión-general)
2. [Estructura de Directorios](#estructura-de-directorios)
3. [Páginas Requeridas](#páginas-requeridas)
4. [Componentes Reutilizables](#componentes-reutilizables)
5. [Manejo de Estado](#manejo-de-estado)
6. [Integración de WebSocket](#integración-de-websocket)
7. [Flujo de Datos](#flujo-de-datos)
8. [Mapas e Integración Geográfica](#mapas-e-integración-geográfica)
9. [Checklist de Implementación](#checklist-de-implementación)

---

## 1. VISIÓN GENERAL

### 1.1 Rol del Encargado (React)

El encargado es la **persona responsable de logística** que:

1. **Verifica y aprueba** proformas/pedidos creados por clientes
2. **Procesa carga** de vehículos (validar stock, preparar)
3. **Asigna choferes y vehículos** a entregas
4. **Monitorea entregas** en tiempo real (mapa con tracking)
5. **Confirma llegadas** de entregas
6. **Genera reportes** de logística

### 1.2 Personas Clave

- **Frontend Lead:** Gestor de React
- **Usuarios Finales:** Encargados de logística (1-3 personas por empresa)
- **Backend Lead:** Gestor de Backend (para APIs)

### 1.3 Navegación Esperada

```
Dashboard Logística
├── Proformas Pendientes
│   ├── Aprobar/Rechazar
│   └── Asignar Chofer + Vehículo
├── Entregas en Preparación
│   ├── Procesar Carga
│   └── Validar Stock
├── Entregas en Tránsito (Mapa)
│   ├── Ver Ubicación GPS
│   ├── Ver ETA
│   └── Chat/Contacto con Chofer
├── Entregas Completadas
│   └── Ver Comprobantes (firma + fotos)
└── Reportes
    ├── Por Fecha
    ├── Por Chofer
    └── Por Cliente
```

---

## 2. ESTRUCTURA DE DIRECTORIOS

### 2.1 Estructura Existente ✅

```
resources/
├── js/
│   ├── presentation/
│   │   ├── pages/
│   │   │   ├── logistica/
│   │   │   │   ├── dashboard.tsx ✅
│   │   │   │   └── seguimiento.tsx ✅
│   │   │   └── Proformas/
│   │   │       ├── Index.tsx ✅
│   │   │       └── Show.tsx ✅
│   │   ├── components/
│   │   │   ├── logistica/        ❌ FALTA (crear)
│   │   │   ├── maps/             ✅ (existe)
│   │   │   ├── ui/               ✅ (shadcn components)
│   │   │   └── ...
│   │   └── layouts/
│   │       └── app-layout.tsx ✅
```

### 2.2 Estructura Propuesta

```
resources/
├── js/
│   ├── presentation/
│   │   ├── pages/
│   │   │   └── logistica/
│   │   │       ├── dashboard.tsx                    ✅
│   │   │       ├── seguimiento.tsx                  ✅
│   │   │       ├── proformas-pendientes.tsx         ❌ CREAR
│   │   │       ├── proforma-detalle.tsx             ❌ CREAR
│   │   │       ├── entregas-preparacion.tsx         ❌ CREAR
│   │   │       ├── entregas-transito-mapa.tsx       ❌ CREAR
│   │   │       ├── entrega-detalle.tsx              ❌ CREAR
│   │   │       ├── entregas-completadas.tsx         ❌ CREAR
│   │   │       ├── reportes-logistica.tsx           ❌ CREAR
│   │   │       ├── gestionar-choferes.tsx           ❌ CREAR
│   │   │       ├── gestionar-camiones.tsx           ❌ CREAR
│   │   │       └── index.tsx (router)               ❌ CREAR
│   │   │
│   │   ├── components/
│   │   │   └── logistica/
│   │   │       ├── ProformaCard.tsx                 ❌ CREAR
│   │   │       ├── EntregaCard.tsx                  ❌ CREAR
│   │   │       ├── EstadoBadge.tsx                  ✅ (probablemente existe)
│   │   │       ├── AsignarChoferModal.tsx           ❌ CREAR
│   │   │       ├── ConfirmarEntregaModal.tsx        ❌ CREAR
│   │   │       ├── TrackingMapa.tsx                 ❌ CREAR
│   │   │       ├── ChoferCard.tsx                   ❌ CREAR
│   │   │       ├── CamionCard.tsx                   ❌ CREAR
│   │   │       ├── FormProforma.tsx                 ❌ CREAR
│   │   │       ├── FormChofer.tsx                   ❌ CREAR
│   │   │       ├── FormCamion.tsx                   ❌ CREAR
│   │   │       └── TimelineEntrega.tsx              ❌ CREAR
│   │   │
│   │   ├── hooks/
│   │   │   ├── useLogistica.ts                      ❌ CREAR
│   │   │   ├── useTracking.ts                       ❌ CREAR
│   │   │   ├── useWebSocket.ts                      ❌ CREAR
│   │   │   └── useProformas.ts                      ❌ CREAR
│   │   │
│   │   └── services/
│   │       ├── logisticaService.ts                  ❌ CREAR
│   │       ├── trackingService.ts                   ❌ CREAR
│   │       ├── websocketService.ts                  ❌ CREAR
│   │       └── proformaService.ts (verificar)       ⚠️
```

---

## 3. PÁGINAS REQUERIDAS

### 3.1 Dashboard Logística (Existente pero mejorar) ✅

**Ubicación:** `pages/logistica/dashboard.tsx`

**Componentes:**
- 4 KPI Cards: Proformas pendientes, Entregas en preparación, En tránsito, Completadas hoy
- Tabla: Últimas 10 proformas pendientes (con botones Aprobar/Rechazar)
- Tabla: Últimas 10 entregas en proceso (con botones de acción)
- Mini Mapa: Ubicaciones de camiones activos
- Notificaciones en tiempo real

**Datos necesarios:**
```json
{
  "estadisticas": {
    "proformas_pendientes": 15,
    "entregas_en_preparacion": 8,
    "entregas_en_transito": 12,
    "entregas_completadas_hoy": 25
  },
  "proformasRecientes": [...],
  "entregasActivas": [...]
}
```

### 3.2 Proformas Pendientes ❌ CREAR

**Ubicación:** `pages/logistica/proformas-pendientes.tsx`

**Funcionalidad:**
- Listar todas las proformas en estado PENDIENTE
- Filtros: cliente, fecha, monto, canal origen
- Búsqueda: número de proforma
- Click en proforma → abre detalle
- Botones: Aprobar, Rechazar, Ver Detalle

**Componentes:**
- DataTable con sorting y paginación
- FilterBar
- ProformaCard (versión compacta)

```tsx
interface ProformasPendientesProps {
  proformas: Paginated<Proforma>;
}

export default function ProformasPendientes({ proformas }: ProformasPendientesProps) {
  const [filters, setFilters] = useState({});
  const [page, setPage] = useState(1);

  return (
    <div>
      <h1>Proformas Pendientes de Aprobación</h1>
      <FilterBar />
      <DataTable
        data={proformas.data}
        columns={columns}
        onRowClick={handleProformaClick}
      />
    </div>
  );
}
```

### 3.3 Detalle de Proforma ❌ CREAR

**Ubicación:** `pages/logistica/proforma-detalle.tsx`

**Funcionalidad:**
- Ver detalle completo de proforma
- Mostrar: cliente, dirección, productos, total, fecha, ventana de entrega
- Mostrar historial de cambios de estado
- Acciones: Aprobar con observaciones, Rechazar con motivo
- Si está aprobada: mostrar botón "Crear Entrega" y "Asignar Chofer"

**Modal: Aprobar Proforma**
```tsx
interface AprobarProformaModalProps {
  proforma: Proforma;
  onSuccess: () => void;
}

// Campos:
- Observaciones (texto)
- Validar disponibilidad de stock (automático)
- Botón: Aprobar
```

**Modal: Rechazar Proforma**
```tsx
// Campos:
- Motivo (select: "Stock insuficiente", "Cliente sin saldo", "Datos incorrectos", "Otro")
- Descripción (texto)
- Botón: Rechazar
```

### 3.4 Entregas en Preparación ❌ CREAR

**Ubicación:** `pages/logistica/entregas-preparacion.tsx`

**Funcionalidad:**
- Listar entregas con estado ASIGNADA o EN_PREPARACION
- Mostrar: cliente, dirección, chofer asignado, vehículo, productos
- Validar disponibilidad de stock
- Procesar carga: cambiar estado a EN_CAMION
- Validar que chofer y vehículo estén disponibles

**Componentes:**
- EntregaCard (mostrar estado actual)
- Modal: ProcesarCargaModal

```tsx
interface ProcesarCargaModalProps {
  entrega: Entrega;
  onSuccess: () => void;
}

// Validaciones:
- Stock disponible de todos los productos
- Chofer asignado
- Vehículo asignado
- Dirección válida
// Acciones:
- Cambiar estado a EN_CAMION
- Notificar al chofer
```

### 3.5 Entregas en Tránsito (Mapa) ❌ CREAR - CRÍTICO

**Ubicación:** `pages/logistica/entregas-transito-mapa.tsx`

**Funcionalidad:**
- **Mapa interactivo** con Leaflet/Mapbox
- Mostrar **múltiples camiones** en ruta (pins con colores)
- Click en pin → mostrar detalles de entrega
- Mostrar: cliente, dirección destino, chofer, ETA actualizado
- Actualizar en tiempo real vía WebSocket
- Filtros: por chofer, por estado, por cliente

**Componentes:**
- TrackingMapa (componente principal)
- EntregaInfoWindow (popup)
- FilterBar
- ListaEntregasLaterales (vista de lista + mapa)

```tsx
interface TrackingMapaProps {
  entregasActivas: Entrega[];
}

// Hook personalizado
const { entregasActivas, subscribir, desuscribir } = useTracking();

// Comportamiento:
- Conectar a WebSocket al montar
- Escuchar eventos: UbicacionActualizada, ChoferLlego, etc.
- Actualizar pins en tiempo real
- Mostrar línea de ruta (polyline)
```

### 3.6 Detalle de Entrega ❌ CREAR

**Ubicación:** `pages/logistica/entrega-detalle.tsx`

**Funcionalidad:**
- Ver información completa de entrega
- Timeline del estado (ASIGNADA → EN_CAMINO → LLEGO → ENTREGADO)
- Mostrar ubicación actual en mapa
- Mostrar ETA
- Botones de acción según estado:
  - Si EN_CAMINO: "Marcar Llegada"
  - Si LLEGO: "Confirmar Entrega"
  - Si ENTREGADO: "Ver Comprobantes"
- Chat/contacto con chofer (futuro)

### 3.7 Entregas Completadas ❌ CREAR

**Ubicación:** `pages/logistica/entregas-completadas.tsx`

**Funcionalidad:**
- Listar entregas con estado ENTREGADO
- Filtros: fecha, cliente, chofer
- Click en entrega → ver comprobantes (firma + fotos)
- Exportar a Excel/PDF

### 3.8 Gestionar Choferes ❌ CREAR

**Ubicación:** `pages/logistica/gestionar-choferes.tsx`

**Funcionalidad:**
- Tabla de choferes activos
- Columnas: nombre, ci, licencia, teléfono, estado, acciones
- Botones: Editar, Desactivar, Ver Historial
- Crear nuevo chofer (modal o página)
- Filtros: estado, búsqueda por nombre

**Modal: Crear/Editar Chofer**
```tsx
// Campos:
- Nombres, Apellidos
- CI
- Teléfono
- Licencia de conducir
- Categoría de licencia
- Fecha vencimiento licencia
- Foto
- Activo (toggle)
```

### 3.9 Gestionar Camiones ❌ CREAR

**Ubicación:** `pages/logistica/gestionar-camiones.tsx`

**Funcionalidad:**
- Tabla de camiones activos
- Columnas: placa, marca, modelo, capacidad, año, estado, acciones
- Botones: Editar, Desactivar, Ver Historial
- Crear nuevo camión
- Filtros: estado, marca, capacidad

### 3.10 Reportes de Logística ❌ CREAR

**Ubicación:** `pages/logistica/reportes-logistica.tsx`

**Funcionalidad:**
- Filtros: rango de fechas, chofer, cliente, estado
- Reportes:
  1. Entregas por estado
  2. Entregas por chofer
  3. Entregas por cliente
  4. Entregas por zona/ciudad
  5. Tiempos de entrega promedio
  6. Problemas/novedades reportadas
- Exportar a Excel/PDF

---

## 4. COMPONENTES REUTILIZABLES

### 4.1 ProformaCard

```tsx
interface ProformaCardProps {
  proforma: Proforma;
  onClick?: () => void;
  actions?: 'approve' | 'none'; // botones de acción
}

export function ProformaCard({ proforma, onClick, actions }: ProformaCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{proforma.numero}</CardTitle>
        <EstadoBadge estado={proforma.estado} />
      </CardHeader>
      <CardContent>
        <p>Cliente: {proforma.cliente.nombre}</p>
        <p>Total: ${proforma.total}</p>
        <p>Fecha: {formatDate(proforma.created_at)}</p>
      </CardContent>
      <CardFooter>
        {actions === 'approve' && (
          <>
            <Button onClick={handleApprobar}>Aprobar</Button>
            <Button variant="destructive" onClick={handleRechazar}>Rechazar</Button>
          </>
        )}
      </CardFooter>
    </Card>
  );
}
```

### 4.2 EntregaCard

```tsx
interface EntregaCardProps {
  entrega: Entrega;
  onClick?: () => void;
  mostrarAcciones?: boolean;
}

// Mostrar: cliente, dirección, estado, chofer, vehículo
// Estados: color diferente para cada estado
```

### 4.3 EstadoBadge

```tsx
interface EstadoBadgeProps {
  estado: EstadoProforma | EstadoEntrega;
  size?: 'sm' | 'md' | 'lg';
}

// Colores predefinidos para cada estado:
// PENDIENTE: yellow
// APROBADA: blue
// RECHAZADA: red
// ENTREGADO: green
// EN_CAMINO: orange
```

### 4.4 TrackingMapa

```tsx
interface TrackingMapaProps {
  entregasActivas: Entrega[];
  onEntregaClick?: (entrega: Entrega) => void;
}

// Usar Leaflet o Mapbox
// Mostrar pins con distintos colores por estado
// Actualizar en tiempo real vía WebSocket
// Mostrar línea de ruta (polyline)
```

### 4.5 AsignarChoferModal

```tsx
interface AsignarChoferModalProps {
  entrega: Entrega;
  choferes: Chofer[];
  camiones: Camion[];
  onSuccess: () => void;
}

// Campos:
// - Select de chofer (mostrar disponibles)
// - Select de camión (mostrar disponibles)
// - Fecha/hora programada (opcional)
// - Botón: Asignar
```

### 4.6 TimelineEntrega

```tsx
interface TimelineEntregaProps {
  entrega: Entrega;
  historial: EntregaEstadoHistorial[];
}

// Mostrar timeline visual de estados
// Usar componente de timeline de shadcn o custom
// Mostrar: fecha, estado, usuario, observaciones
```

### 4.7 FormChofer

```tsx
interface FormChoferProps {
  chofer?: Chofer;
  onSubmit: (data: Chofer) => void;
  loading?: boolean;
}

// Formulario: Nombres, Apellidos, CI, Teléfono, Licencia, etc.
// Validaciones: CI único, teléfono válido, etc.
```

### 4.8 FormCamion

```tsx
interface FormCamionProps {
  camion?: Camion;
  onSubmit: (data: Camion) => void;
  loading?: boolean;
}

// Formulario: Placa, Marca, Modelo, Capacidad, etc.
// Validaciones: Placa única, capacidad válida
```

---

## 5. MANEJO DE ESTADO

### 5.1 Hooks Personalizados

#### useLogistica()

```tsx
// Manejo de estado general de logística
const {
  proformasPendientes,
  entregasEnPreparacion,
  entregasEnTransito,
  entregasCompletadas,

  // Métodos
  cargarProformas,
  cargarEntregas,
  aprobarProforma,
  rechazarProforma,
  asignarEntrega,
  procesarCarga,
  confirmarEntrega,

  // Loading states
  loading,
  error
} = useLogistica();
```

#### useTracking()

```tsx
// Manejo de tracking en tiempo real
const {
  entregasActivas,
  ubicacionesActuales,

  subscribirATracking,
  desuscribir,

  loading
} = useTracking();
```

#### useWebSocket()

```tsx
// Hook para WebSocket (reutilizable)
const {
  conectado,
  conectar,
  desconectar,
  subscribirse,
  desuscribirse,
  enviar
} = useWebSocket();
```

### 5.2 Context API (Opcional pero recomendado)

```tsx
// contexts/LogisticaContext.tsx
interface LogisticaContextType {
  entregasActivas: Entrega[];
  proformasPendientes: Proforma[];
  actualizarEntrega: (entrega: Entrega) => void;
}

export const LogisticaContext = createContext<LogisticaContextType | undefined>(undefined);
```

---

## 6. INTEGRACIÓN DE WEBSOCKET

### 6.1 Cliente WebSocket en React

```tsx
// services/websocketService.ts

class WebSocketService {
  private socket: any;
  private url: string;

  constructor(url: string) {
    this.url = url;
  }

  connect(token: string) {
    this.socket = io(this.url, {
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.setupListeners();
  }

  private setupListeners() {
    // Escuchar eventos del servidor
    this.socket.on('UbicacionActualizada', (data) => {
      // Actualizar ubicación en el estado
    });

    this.socket.on('ChoferLlego', (data) => {
      // Mostrar notificación
    });

    this.socket.on('PedidoEntregado', (data) => {
      // Refrescar entregas
    });
  }

  subscribirAEntrega(entregaId: number) {
    this.socket.emit('subscribir', {
      canal: `entrega.${entregaId}`
    });
  }

  desuscribirse(entregaId: number) {
    this.socket.emit('desuscribirse', {
      canal: `entrega.${entregaId}`
    });
  }
}
```

### 6.2 Eventos a Escuchar

```tsx
// Desde servidor a cliente React (Encargado)

io.on('UbicacionActualizada', (data) => {
  // Actualizar ubicación del pin en el mapa
  // Recalcular ETA
});

io.on('ChoferEnCamino', (data) => {
  // Cambiar estado de entrega en UI
  // Mostrar notificación
});

io.on('ChoferLlego', (data) => {
  // Notificación
  // Cambiar estado
});

io.on('PedidoEntregado', (data) => {
  // Mostrar comprobantes
  // Actualizar dashboard
  // Refrescar lista
});

io.on('NovedadReportada', (data) => {
  // Alert rojo
  // Notificación importante
  // Mostrar detalles de la novedad
});
```

---

## 7. FLUJO DE DATOS

### 7.1 Flujo: Aprobar Proforma

```
Usuario hace click "Aprobar"
         ↓
Modal abre (componente AprobarProformaModal)
         ↓
Usuario ingresa observaciones
         ↓
Click botón "Aprobar"
         ↓
Llamar: proformaService.aprobar(proformaId, observaciones)
         ↓
POST /api/encargado/proformas/{id}/aprobar
         ↓
Backend: validar stock, crear reserva, cambiar estado
         ↓
Backend dispara evento: ProformaAprobada
         ↓
WebSocket broadcast a canal: pedido.{proformaId}
         ↓
React recibe evento en useTracking hook
         ↓
Actualizar estado local
         ↓
UI se actualiza (tabla, badge, etc.)
         ↓
Mostrar toast: "Proforma aprobada exitosamente"
```

### 7.2 Flujo: Procesar Carga al Vehículo

```
Usuario selecciona entrega en estado ASIGNADA
         ↓
Click botón "Procesar Carga"
         ↓
Modal ProcesarCargaModal abre
         ↓
Frontend valida:
  - Stock disponible
  - Chofer asignado
  - Vehículo asignado
         ↓
Click botón "Procesar"
         ↓
POST /api/encargado/entregas/{id}/procesar-carga
         ↓
Backend: cambiar estado a EN_CAMION
         ↓
Backend dispara evento: EntregaEnCamino
         ↓
WebSocket broadcast
         ↓
React actualiza estado
         ↓
Notificación al chofer (en su app Flutter)
```

### 7.3 Flujo: Tracking en Tiempo Real

```
Encargado abre página "Entregas en Tránsito (Mapa)"
         ↓
useTracking hook se ejecuta
         ↓
WebSocket se conecta
         ↓
Suscribirse a canal: admin.pedidos
         ↓
Cada 10-30 segundos:
  Chofer envía: POST /api/chofer/entregas/{id}/ubicacion
         ↓
Backend crea UbicacionTracking en BD
         ↓
Backend dispara evento: UbicacionActualizada
         ↓
WebSocket broadcast a canal: entrega.{id}
         ↓
React recibe evento
         ↓
Actualizar pin en el mapa
         ↓
Recalcular ETA y mostrar
         ↓
Mostrar en tiempo real (sin refresh)
```

---

## 8. MAPAS E INTEGRACIÓN GEOGRÁFICA

### 8.1 Librería de Mapas

**Opciones:**
- **Leaflet** (libre, ligero, recomendado para this project)
- Mapbox (más potente pero de pago)
- Google Maps

**Recomendación:** Leaflet + OpenStreetMap

```bash
npm install leaflet react-leaflet leaflet-routing-machine
```

### 8.2 Componente TrackingMapa

```tsx
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';

interface TrackingMapaProps {
  entregas: Entrega[];
  onEntregaSelect?: (entrega: Entrega) => void;
}

export function TrackingMapa({ entregas, onEntregaSelect }: TrackingMapaProps) {
  const [mapRef, setMapRef] = useState(null);

  // Colores por estado
  const colorPorEstado = {
    'EN_CAMINO': 'blue',
    'LLEGO': 'orange',
    'ENTREGADO': 'green'
  };

  return (
    <MapContainer center={[-16.5, -68.1]} zoom={12} style={{ height: '600px' }}>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {entregas.map(entrega => (
        <Marker
          key={entrega.id}
          position={[entrega.ubicacion_actual.latitud, entrega.ubicacion_actual.longitud]}
          icon={createCustomIcon(colorPorEstado[entrega.estado])}
          onClick={() => onEntregaSelect?.(entrega)}
        >
          <Popup>
            <div>
              <h3>{entrega.cliente.nombre}</h3>
              <p>Estado: {entrega.estado}</p>
              <p>Chofer: {entrega.chofer.nombres}</p>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
```

### 8.3 Cálculo de ETA

```tsx
// Usar Google Maps Distance Matrix API o Mapbox
// Función que Backend proporciona
async function calcularETA(
  latActual: number,
  lngActual: number,
  latDestino: number,
  lngDestino: number
): Promise<{ distancia: number; tiempo: number }> {
  const response = await axios.post('/api/tracking/entregas/{id}/calcular-eta', {
    lat_destino: latDestino,
    lng_destino: lngDestino
  });
  return response.data.data;
}
```

---

## 9. CHECKLIST DE IMPLEMENTACIÓN

### FASE 1: Estructura y Componentes Base

- [ ] Crear carpeta `components/logistica/` con componentes base
  - [ ] ProformaCard
  - [ ] EntregaCard
  - [ ] EstadoBadge
  - [ ] TimelineEntrega
- [ ] Crear carpeta `pages/logistica/` con rutas
  - [ ] Index (router)
  - [ ] Dashboard (mejorar existente)
- [ ] Crear carpeta `hooks/` con hooks personalizados
  - [ ] useLogistica()
  - [ ] useTracking()
  - [ ] useWebSocket()
- [ ] Crear carpeta `services/` con servicios API
  - [ ] logisticaService.ts
  - [ ] trackingService.ts
  - [ ] websocketService.ts

### FASE 2: Páginas de Proformas

- [ ] Crear `pages/logistica/proformas-pendientes.tsx`
- [ ] Crear `pages/logistica/proforma-detalle.tsx`
- [ ] Crear componente `AprobarProformaModal`
- [ ] Crear componente `RechazarProformaModal`
- [ ] Integrar con API `/api/encargado/proformas/*`
- [ ] Testing de flujo aprobar/rechazar

### FASE 3: Páginas de Entregas

- [ ] Crear `pages/logistica/entregas-preparacion.tsx`
- [ ] Crear `pages/logistica/entregas-transito-mapa.tsx`
- [ ] Crear `pages/logistica/entrega-detalle.tsx`
- [ ] Crear `pages/logistica/entregas-completadas.tsx`
- [ ] Crear componente `AsignarChoferModal`
- [ ] Crear componente `ProcesarCargaModal`
- [ ] Crear componente `ConfirmarEntregaModal`
- [ ] Integrar con API `/api/encargado/entregas/*`

### FASE 4: Tracking en Mapa

- [ ] Instalar Leaflet y react-leaflet
- [ ] Implementar componente `TrackingMapa`
- [ ] Conectar WebSocket para actualizaciones en tiempo real
- [ ] Implementar cálculo de ETA
- [ ] Testing de actualización de pins en tiempo real

### FASE 5: Gestión de Recursos

- [ ] Crear `pages/logistica/gestionar-choferes.tsx`
- [ ] Crear `pages/logistica/gestionar-camiones.tsx`
- [ ] Crear componentes de formulario: `FormChofer`, `FormCamion`
- [ ] CRUD de choferes
- [ ] CRUD de camiones
- [ ] Integrar con API

### FASE 6: Reportes

- [ ] Crear `pages/logistica/reportes-logistica.tsx`
- [ ] Implementar filtros
- [ ] Integrar con servicios de export (Excel, PDF)
- [ ] Testing de reportes

### FASE 7: Pulido y Optimización

- [ ] Styles y theming consistente
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Performance: lazy loading, memoización
- [ ] Error handling y validaciones
- [ ] Notificaciones toast
- [ ] Tests unitarios y de integración

---

## 10. DEPENDENCIAS NECESARIAS

```json
{
  "dependencies": {
    "@inertiajs/react": "^2.1.0",
    "react": "^18.x",
    "typescript": "^5.x",
    "leaflet": "^1.9.x",
    "react-leaflet": "^4.x",
    "socket.io-client": "^4.x",
    "axios": "^1.x",
    "react-toastify": "^9.x",
    "@radix-ui/*": "latest",
    "tailwindcss": "^3.x"
  }
}
```

---

## 11. CONSIDERACIONES TÉCNICAS

### 11.1 Performance

- Lazy load de páginas con React.lazy()
- Memoización de componentes pesados (memo)
- Paginación en tablas
- Caché de datos con SWR o React Query
- Evitar renders innecesarios

### 11.2 Seguridad

- Validar autorización: solo encargados pueden ver logística
- Validar datos del servidor antes de usar
- CSRF protection (ya en Laravel)
- Rate limiting en API
- Logs de acciones importantes

### 11.3 UX/Experiencia

- Toast notifications para feedback inmediato
- Loading spinners para operaciones largas
- Confirmación antes de acciones destructivas
- Breadcrumbs para navegación
- Busca y filtros intuitivos

---

## 12. PRÓXIMOS PASOS

**Antes de empezar desarrollo:**

1. ✅ Backend debe tener TODOS los endpoints funcionando
2. ✅ WebSocket debe estar corriendo y testado
3. ✅ Documentación de API (request/response)
4. ✅ Gestores acordar en routing y estructura

**Orden de implementación recomendado:**
1. Componentes base (ProformaCard, etc.)
2. Páginas de proformas (aprobar/rechazar)
3. Páginas de entregas (preparación)
4. Mapa con tracking
5. Gestión de choferes/camiones
6. Reportes

---

**Versión:** 2.0
**Última actualización:** 31 de Octubre de 2025
**Gestor:** Gestor de React
**Siguiente revisión:** Cuando Backend haya completado todos los endpoints
