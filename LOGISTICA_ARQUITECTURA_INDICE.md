# 📚 ÍNDICE DE ARQUITECTURA - MÓDULO LOGÍSTICA v2.0

**Fecha:** 31 de Octubre de 2025
**Versión:** 2.0 (Separada por Plataforma)
**Estado General:** ✅ Fase 1 completada, ⚠️ Fases 2-4 en plan

---

## 📖 DOCUMENTOS PRINCIPALES

Esta documentación está **separada por plataforma y responsabilidad** para que cada equipo trabaje de forma autónoma:

### 1. 🏢 **BACKEND_LOGISTICA.md**
**Responsable:** Gestor de Backend
**Plataforma:** Laravel 10+ / PHP
**Alcance:** API, Modelos, Migraciones, Eventos, Broadcasting

**Incluye:**
- Estado actual de implementación (Proforma ✅, Chofer ⚠️, Entrega ❌)
- Modelos de datos (cuáles existen, cuáles faltan crear)
- 3 Controladores faltantes a implementar (EntregaController, TrackingController, EncargadoController)
- Rutas API completas (GET, POST, PUT, DELETE)
- Eventos de Broadcasting (8 eventos a crear)
- Checklist de implementación por fase

**Próximos pasos Backend:**
1. Crear modelos: Entrega, UbicacionTracking, EntregaEstadoHistorial
2. Crear 3 controladores API
3. Crear 8 eventos para Broadcasting
4. Implementar rutas y servicios de negocio
5. Testing de endpoints

---

### 2. 🌐 **FRONTEND_REACT_LOGISTICA.md**
**Responsable:** Gestor de React
**Plataforma:** React 18+ (con Inertia.js)
**Alcance:** Web UI para Encargado de Logística

**Incluye:**
- 10+ páginas nuevas a crear (proformas, entregas, mapa, gestión)
- 8+ componentes reutilizables
- Hooks personalizados para estado
- Integración de mapas (Leaflet recomendado)
- Integración WebSocket para actualizaciones
- Checklist de implementación (7 fases)

**Rol del Encargado:**
- Verificar y aprobar proformas
- Asignar chofer y vehículo
- Procesar carga al vehículo
- Monitorear entregas en mapa (tracking)
- Confirmar entregas
- Reportes

**Próximos pasos React:**
1. Crear estructura de carpetas
2. Implementar páginas de proformas
3. Implementar páginas de entregas
4. Crear mapa con tracking
5. Integración WebSocket

---

### 3. 📱 **FRONTEND_FLUTTER_LOGISTICA.md**
**Responsable:** Gestor de Flutter
**Plataforma:** Flutter 3.x (iOS + Android)
**Alcance:** App móvil para Cliente y Chofer

**Incluye:**
- Estado actual: Fase 1 (Cliente) ✅ 98% listo, Fase 3 (Chofer) ❌ 0% iniciada
- Modelos de datos (falta: Entrega)
- Servicios y Providers (falta: ChoferService, GeolocationService)
- 9+ screens nuevas para rol Chofer
- Sistema de tracking GPS
- Firma digital y captura de fotos
- **NUEVO:** Chofer puede crear clientes en ruta
- Checklist por fase

**Roles:**
- **Cliente (Fase 1 ✅):** Carrito, Pedidos, Tracking
- **Chofer (Fase 3 ❌):** Entregas, Ubicación GPS, Confirmación, Crear clientes

**Próximos pasos Flutter:**
1. Crear modelo Entrega (CRÍTICO)
2. Crear ChoferService y ChoferProvider
3. Crear HomeChoferScreen
4. Crear screens de entregas (5 nuevas)
5. Integración de tracking GPS
6. Testing en dispositivo real

---

### 4. 🔌 **WEBSOCKET_ARCHITECTURE.md**
**Responsable:** Gestor de Backend / WebSocket
**Plataforma:** Node.js + Socket.IO
**Alcance:** Comunicación en tiempo real (transversal a todas las plataformas)

**Incluye:**
- Arquitectura general de WebSocket
- Servidor Node.js (./websocket/) - ✅ Implementado
- 9 eventos principales para logística
- Canales (pedido.{id}, entrega.{id}, chofer.{id}, admin.pedidos)
- Integración Backend (Laravel Broadcasting)
- Integración React (socket.io-client)
- Integración Flutter (laravel_echo)
- Flujo de mensajes con latencias
- Troubleshooting

**Por qué WebSocket:**
- Tracking en tiempo real (< 500ms)
- Notificaciones instantáneas
- Eficiencia (vs polling cada 5s)
- Baja latencia, menos batería

**Próximos pasos WebSocket:**
1. Backend: Configurar Broadcasting (Pusher/Reverb)
2. Backend: Crear 8 eventos
3. React: Integrar WebSocket en TrackingMapa
4. Flutter: Expandir WebSocketService
5. Testing end-to-end

---

## 🎯 RELACIÓN ENTRE DOCUMENTOS

```
┌─────────────────────────────────────────────────────────────┐
│              BACKEND_LOGISTICA.md                           │
│  - API REST: /api/chofer, /api/encargado, /api/tracking     │
│  - Eventos: UbicacionActualizada, ChoferLlego, etc.         │
│  - Broadcasting: Laravel → WebSocket                        │
└────────────┬──────────────────────────────────────────────┬─┘
             │                                              │
             │ Consume API                        Dispara eventos
             │                                              │
             ▼                                              ▼
┌────────────────────────────┐              ┌──────────────────────────┐
│ FRONTEND_REACT.md          │              │ WEBSOCKET_ARCHITECTURE   │
│ (Encargado - Dashboard)    │◄─────────────►  (Socket.IO Server)     │
│                            │   Escucha      (/websocket/)           │
│ - Proformas                │   eventos      ├─ 9 eventos            │
│ - Entregas                 │               ├─ 4 canales             │
│ - Mapa + Tracking          │               └─ Broadcasting          │
│ - Gestión Choferes/Camiones│                                        │
└────────────────────────────┘              └──────────────────────────┘
                                                     ▲
                                                     │
                                                     │
                                            Escucha eventos
                                                     │
            ┌────────────────────────────────────────┘
            │
            ▼
┌────────────────────────────┐
│ FRONTEND_FLUTTER.md        │
│ (Cliente + Chofer)         │
├────────────────────────────┤
│ CLIENTE (Fase 1 ✅):       │
│ - Carrito → Pedidos        │
│ - Tracking en Mapa         │
│ - Recibe eventos           │
├────────────────────────────┤
│ CHOFER (Fase 3 ❌):        │
│ - Entregas Diarias         │
│ - Ubicación GPS (cada 15s) │
│ - Firma Digital + Fotos    │
│ - Crear Clientes           │
│ - Envía eventos (GPS)      │
└────────────────────────────┘
```

---

## 📊 ESTADO GENERAL DE IMPLEMENTACIÓN

### Fase 1: CLIENTE - PEDIDOS ✅ 98% LISTO
```
BACKEND:        ✅ Completado (ApiProformaController)
FRONTEND REACT: ⚠️  Parcial (dashboard existente, falta páginas)
FRONTEND FLUTTER: ✅ Completado
WEBSOCKET:      ⚠️  Configurado pero no fully integrated
STATUS:         🟢 LISTO PARA QA EN FLUTTER, espera React
```

### Fase 2: NOTIFICACIONES ❌ NO INICIADA
```
BACKEND:        ⚠️  Eventos creados, FCM no integrado
FRONTEND REACT: ❌ No iniciado
FRONTEND FLUTTER: ❌ Firebase Messaging no instalado
WEBSOCKET:      ✅ Escucha eventos
STATUS:         🔴 BLOQUEADO: Espera Backend crear eventos
```

### Fase 3: CHOFER - ENTREGAS ❌ NO INICIADA
```
BACKEND:        ❌ Falta: 3 Controllers, Model Entrega
FRONTEND REACT: ❌ No iniciado (opcional, principalmente Flutter)
FRONTEND FLUTTER: ❌ 0% - Crítico para logística
WEBSOCKET:      ✅ Escucha eventos
STATUS:         🔴 BLOQUEADO: Espera Backend crear modelos/API
```

### Fase 4: ADMIN ❌ NO INICIADA
```
BACKEND:        ❌ Falta: EncargadoController
FRONTEND REACT: ❌ Depende de Backend
WEBSOCKET:      ✅ Canal admin.pedidos existe
STATUS:         🔴 BLOQUEADO: Espera Backend
```

### Fase 5: PULIDO Y RELEASE ⏳ PENDIENTE
```
BACKEND:        Depende de fases 2-4
FRONTEND:       Depende de backend
TESTING:        End-to-end en ambas plataformas
STATUS:         ⏳ Espera completar fases anteriores
```

---

## 🚀 ORDEN RECOMENDADO DE TRABAJO

### SEMANA 1: BACKEND (Bloqueante para todo lo demás)

1. **Gestor Backend:**
   - [ ] Crear Model `Entrega`
   - [ ] Crear Model `UbicacionTracking`
   - [ ] Crear Model `EntregaEstadoHistorial`
   - [ ] Crear migration para `entregas` table
   - [ ] Crear migration para `ubicaciones_tracking` table
   - [ ] Migrations: `php artisan migrate`
   - **Timeline:** 2-3 días

2. **Gestor Backend:**
   - [ ] Crear `EntregaController` (API) con 8+ métodos
   - [ ] Crear `TrackingController` (API)
   - [ ] Registrar rutas en `routes/api.php`
   - [ ] Testing básico de endpoints (Postman)
   - **Timeline:** 2-3 días

3. **Gestor Backend:**
   - [ ] Crear 8 eventos (ProformaAprobada, UbicacionActualizada, etc.)
   - [ ] Configurar Broadcasting en `config/broadcasting.php`
   - [ ] Definir canales en `routes/channels.php`
   - [ ] Disparar eventos en controladores
   - [ ] Testing: verificar eventos llegan al WebSocket
   - **Timeline:** 2-3 días

**Deliverable semana 1:** Backend completamente funcional + documentación de API

---

### SEMANA 2: REACT Y FLUTTER (En paralelo)

**Gestor React:**
- [ ] Crear estructura de carpetas
- [ ] Implementar `useLogistica()` hook
- [ ] Crear página ProformasPendientes + ProformaDetalle
- [ ] Crear página EntregasPreparacion
- [ ] Crear página EntregasTransitoMapa (con Leaflet)
- [ ] Integrar WebSocket en mapa
- **Timeline:** 4-5 días

**Gestor Flutter:**
- [ ] Crear Model `Entrega`
- [ ] Crear `ChoferService` con todos los métodos
- [ ] Crear `ChoferProvider`
- [ ] Crear `HomeChoferScreen` (principal)
- [ ] Crear `EntregasAsignadasScreen`
- [ ] Testing básico
- **Timeline:** 4-5 días

---

### SEMANA 3: CHOFERES Y TRACKING

**Gestor Flutter (continuación):**
- [ ] Crear `EntregaDetalleScreen`
- [ ] Crear `FirmaDigitalScreen` (con signature)
- [ ] Crear `GeolocationService` (GPS)
- [ ] Implementar tracking GPS (enviar ubicación cada 15s)
- [ ] Integrar WebSocket para recibir eventos
- [ ] Testing en dispositivo real (no emulador)
- **Timeline:** 3-4 días

**Gestor React (continuación):**
- [ ] Crear página ReportarNovedad
- [ ] Crear páginas de Gestión (Choferes, Camiones)
- [ ] Crear página de Reportes
- [ ] Pulir UI/UX
- **Timeline:** 3-4 días

---

### SEMANA 4: QA Y RELEASE

- [ ] Testing end-to-end (Cliente + Chofer + Admin simultáneamente)
- [ ] Testing WebSocket en tiempo real
- [ ] Performance testing (múltiples entregas)
- [ ] Bug fixes
- [ ] Preparar release v2.0

---

## 💡 CONSIDERACIONES IMPORTANTES

### 1. WebSocket es CRÍTICO
- Sin WebSocket, no hay tracking en tiempo real
- Debe estar funcionando antes de hacer testing real
- Servidor Node.js debe estar corriendo en producción

### 2. Backend bloquea a Frontend
- Frontend no puede empezar hasta que Backend tenga endpoints
- Usar mocks/stubs si Backend atrasa

### 3. Fases son secuenciales
- No se puede hacer Fase 4 sin Fase 3
- No se puede hacer Fase 3 sin modelos Backend

### 4. Testing en Dispositivo Real
- Emulador NO simula GPS correctamente
- Emulador NO simula conexión de fondo
- **IMPORTANTE:** Hacer testing en Android/iOS físicos

---

## 🛠️ COMANDOS ÚTILES

### Backend Laravel
```bash
# Crear modelo y migration
php artisan make:model Entrega -m

# Crear controller
php artisan make:controller Api/EntregaController

# Crear evento
php artisan make:event UbicacionActualizada

# Run migrations
php artisan migrate

# Test API
php artisan tinker
>>> Entrega::all()
```

### Flutter
```bash
# Instalar dependencias
flutter pub get

# Instalar package específico
flutter pub add signature

# Run en dispositivo
flutter run

# Build APK
flutter build apk

# Build IPA
flutter build ios
```

### WebSocket
```bash
# Iniciar servidor
cd websocket
npm install
npm start

# Verificar que está corriendo
curl http://localhost:3001
```

---

## 📞 CONTACTO Y ESCALAMIENTO

**Si hay bloqueadores:**

1. **Bloqueador Frontend React:** Contactar Gestor Backend
   - Falta endpoint → crear endpoint
   - Falta evento → crear evento
   - WebSocket no funciona → revisar server

2. **Bloqueador Frontend Flutter:** Contactar Gestor Backend (mismo)
   - Falta API → crear API
   - Falta modelo → crear modelo
   - Permisos fallando → revisar autorizaciones

3. **Bloqueador WebSocket:** Contactar Gestor Backend + WebSocket
   - Servidor no responde → restart server
   - Eventos no llegan → revisar Broadcasting config
   - Latencia alta → revisar network

---

## 📋 CHECKLIST FINAL

Antes de release v2.0:

- [ ] Backend: Todos los modelos creados y migraciones ejecutadas
- [ ] Backend: Todos los endpoints funcionando
- [ ] Backend: Todos los eventos disparándose correctamente
- [ ] React: Todas las páginas de logística implementadas
- [ ] React: Mapa con tracking en tiempo real funcionando
- [ ] Flutter: Modelo Entrega implementado
- [ ] Flutter: ChoferProvider con state management completo
- [ ] Flutter: 9+ screens para chofer implementadas
- [ ] Flutter: GPS tracking funcionando en dispositivo real
- [ ] WebSocket: Servidor corriendo y estable
- [ ] Testing: End-to-end con múltiples usuarios
- [ ] Testing: WebSocket con 50+ ubicaciones/segundo
- [ ] Documentación: APIs documentadas en Swagger
- [ ] Documentación: Guías de deployment por ambiente
- [ ] Performance: App Flutter sin memory leaks
- [ ] Performance: Mapa React fluido con 100+ pins
- [ ] Seguridad: Autorizaciones verificadas en todos los endpoints
- [ ] Monitoreo: Logs de errores configurados (Sentry)
- [ ] Release: v2.0 publicada en App Store / Google Play

---

## 📚 REFERENCIAS ÚTILES

**Documentación:**
- [Laravel Broadcasting](https://laravel.com/docs/broadcasting)
- [Socket.IO](https://socket.io/docs/)
- [React Leaflet](https://react-leaflet.js.org/)
- [Flutter Geolocator](https://pub.dev/packages/geolocator)

**Ejemplos en el proyecto:**
- Backend: `app/Models/Proforma.php` (referencia de modelo completo)
- React: `resources/js/presentation/pages/logistica/dashboard.tsx` (referencia UI)
- Flutter: `lib/screens/cliente/pedidos/pedido_tracking_screen.dart` (referencia)

---

## 📝 HISTORIAL DE VERSIONES

| Versión | Fecha | Cambios |
|---------|-------|---------|
| 1.0 | 2025-10-18 | Documento único sin separación por plataforma |
| 2.0 | 2025-10-31 | **Separado en 4 docs** (Backend, React, Flutter, WebSocket) + Índice |

**Próxima versión:** 2.1 (después de completar Fase 3)

---

**Responsables globales:**
- 🏢 Backend: Gestor de Backend
- 🌐 React: Gestor de React
- 📱 Flutter: Gestor de Flutter
- 🔌 WebSocket: Gestor de Backend + WebSocket

**Última actualización:** 31 de Octubre de 2025
**Estado:** Activo - En desarrollo Fase 2+
