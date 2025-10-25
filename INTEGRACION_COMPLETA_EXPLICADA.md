# 🔗 INTEGRACIÓN COMPLETA: WebSocket + FCM + Pagos Dinámicos

**Fecha:** 2025-10-25
**Objetivo:** Explicar cómo trabajan juntos todos los sistemas
**Audiencia:** Todo el equipo (Frontend, Backend, Flutter)

---

## 🎯 VISION GENERAL DEL SISTEMA

```
┌──────────────────────────────────────────────────────────────────┐
│                   CLIENTE USA APP FLUTTER                        │
│                  (Móvil - App abierta o cerrada)                 │
└──────────────────┬───────────────────────────────────────────────┘
                   │
         ┌─────────┴──────────┐
         │                    │
         ▼ (App abierta)      ▼ (App cerrada o pausada)
    ┌─────────────┐          ┌──────────────┐
    │ WebSocket   │          │ FCM Push     │
    │ (Tiempo     │          │ (Google      │
    │  real)      │          │  FCM)        │
    └──────┬──────┘          └────────┬─────┘
           │                         │
           └──────────────┬──────────┘
                          │
                          ▼
            ┌──────────────────────────┐
            │   LARAVEL BACKEND        │
            │ (Distribuida Paucara)    │
            │                          │
            │ - Procesa pedidos        │
            │ - Valida pagos           │
            │ - Registra entregas      │
            │ - Envía notificaciones   │
            └──────────────────────────┘
```

---

## 📱 EJEMPLO COMPLETO: Flujo de un Cliente desde App

### **PASO 1: Cliente inicia sesión**

```
Flutter App: POST /api/login
├─ Envía: email, password
└─ Recibe: token (Sanctum)

Backend: Autentica usuario
└─ Genera token único para Flutter

Flutter: Guarda token en storage
└─ Futuras requests usan este token

Flutter: Registra dispositivo para FCM
├─ Obtiene FCM token de Google
└─ POST /api/registrar-dispositivo-fcm
   {
     "fcm_token": "eEvMrYWs8qc:APA91bGg...",
     "tipo_dispositivo": "android",
     "nombre_dispositivo": "Samsung Galaxy S21"
   }

Backend: Guarda token en tabla usuario_dispositivos
└─ Ahora puede enviar notificaciones FCM a este dispositivo
```

### **PASO 2: Cliente ve catálogo de productos**

```
Flutter App: GET /api/app/productos
└─ Sin necesidad de token (pueden estar públicos)

Backend: Retorna lista de productos
{
  "success": true,
  "productos": [
    {
      "id": 1,
      "nombre": "Aceite Girasol 5L",
      "precio": 50.00,
      "stock": 100
    },
    ...
  ]
}

Flutter: Muestra lista en UI
└─ Usuario selecciona 5+ productos
```

### **PASO 3: Cliente solicita proforma (cotización)**

```
Flutter App: POST /api/app/proformas
Authorization: Bearer {token}
Body:
{
  "cliente_id": 15,
  "productos": [
    {"producto_id": 1, "cantidad": 10},
    {"producto_id": 2, "cantidad": 5},
    {"producto_id": 3, "cantidad": 8},
    {"producto_id": 4, "cantidad": 3},
    {"producto_id": 5, "cantidad": 2}
  ]
}

Backend: ApiProformaController::store()
├─ ✅ Valida: mínimo 5 productos ✓
├─ Calcula subtotal + impuestos
├─ Reserva stock por 7 días
├─ Crea proforma con estado = PENDIENTE
└─ Notifica a managers por WebSocket
   └─ broadcast(new NuevaProformaCreada($proforma))

Managers (React Web): Reciben evento WebSocket
└─ Ven nueva proforma en dashboard en tiempo real

Backend: Envía notificación FCM a managers
├─ FcmNotificationService::enviarAManagers()
├─ Título: "Nueva Proforma #PRO-2025-001"
├─ Cuerpo: "Cliente Tienda XYZ - Bs. 1500"
└─ Incluso si manager está fuera de web

Flutter: Muestra estado PENDIENTE al cliente
└─ "Tu proforma está siendo revisada..."
```

### **PASO 4: Manager aprueba la proforma (Desde React Web)**

```
Manager (React): Click "Aprobar" en ProformaController
└─ PUT /proformas/{id}/aprobar

Backend: ProformaController::aprobar()
├─ Actualiza estado = APROBADA
├─ Notifica por WebSocket a cliente
│  └─ broadcast(new ProformaAprobada($proforma))
│
└─ Envía FCM al cliente
   ├─ FcmNotificationService::enviarAUsuario(cliente_id)
   ├─ Título: "¡Tu Proforma fue Aprobada! 🎉"
   ├─ Datos adicionales:
   │  {
   │    "tipo": "proforma_aprobada",
   │    "proforma_id": 5,
   │    "numero": "PRO-2025-001"
   │  }
   └─ Incluso si app está CERRADA

Flutter: Recibe FCM (aunque esté cerrada)
├─ Notificación aparece en bandeja del sistema
├─ Si usuario toca: Abre app en pantalla de proforma
└─ Si app estaba abierta: Recibe por WebSocket
```

### **PASO 5: Cliente confirma proforma (Pedido)**

```
Flutter App: POST /api/app/proformas/{id}/confirmar
Authorization: Bearer {token}
Body:
{
  "politica_pago": "MEDIO_MEDIO"  // 50% ahora, 50% después
}

Backend: ApiProformaController::confirmarProforma()
├─ ✅ Valida: proforma está APROBADA
├─ ✅ Valida: tiene 5+ productos
├─ Crea VENTA con:
│  {
│    "numero": "V-2025-00152",
│    "monto_total": 1500.00,
│    "monto_pagado": 0,
│    "estado_pago": "PENDIENTE",
│    "politica_pago": "MEDIO_MEDIO"
│  }
├─ Copia detalles de proforma a venta
├─ Marca proforma como CONVERTIDA
└─ Notifica por WebSocket (managers + cliente)

Flutter: Muestra estado de pago
└─ "Debes pagar: 50% = Bs. 750"
```

### **PASO 6: Cliente registra pago**

```
Flutter App: POST /api/app/ventas/{id}/registrar-pago
Authorization: Bearer {token}
Body:
{
  "monto": 750.00,
  "tipo_pago": "TRANSFERENCIA",
  "numero_referencia": "TRF-20251025-1234"
}

Backend: VentaController::registrarPago()
├─ Crea registro en tabla PAGOS
├─ Actualiza venta:
│  {
│    "monto_pagado": 750.00,
│    "monto_pendiente": 750.00,
│    "estado_pago": "PARCIALMENTE_PAGADO"
│  }
├─ Notifica por WebSocket al manager
└─ Envía FCM al cliente
   └─ "Pago registrado: Bs. 750 ✓"

Flutter: Actualiza visualización del pago
└─ Barra de progreso: 50% completado
```

### **PASO 7: Manager programa envío (Desde React Web)**

```
Manager (React): Click "Programar Envío"
└─ POST /envios/programar
   {
     "venta_id": 42,
     "vehiculo_id": 3,
     "chofer_id": 5,
     "fecha_programada": "2025-10-26 10:00"
   }

Backend: EnvioController::programar()
├─ ✅ Valida: estado_pago = PAGADO (o 50% si es MEDIO_MEDIO)
├─ Crea ENVIO con:
│  {
│    "numero_envio": "ENV-20251024-0001",
│    "estado": "PROGRAMADO",
│    "chofer": "Carlos López"
│  }
├─ Notifica por WebSocket
└─ Envía FCM al cliente
   ├─ Título: "Tu pedido está programado"
   ├─ Cuerpo: "Será entregado el 26 de octubre a las 10:00"
   └─ Incluso si app está CERRADA

Flutter: Recibe notificación
└─ Cliente ve: "Tu pedido será entregado mañana"
```

### **PASO 8: Chofer inicia preparación en almacén**

```
Manager (React): "Iniciar Preparación"
└─ POST /envios/{id}/iniciar-preparacion

Backend: EnvioController::iniciarPreparacion()
├─ Actualiza estado = EN_PREPARACION
├─ AQUÍ se reduce el stock (cambio importante)
├─ Notifica por WebSocket
└─ Envía FCM al cliente
   └─ "Tu pedido está siendo preparado"
```

### **PASO 9: Chofer confirma salida**

```
Chofer (App Flutter): "Salí del almacén"
└─ PUT /api/app/envios/{id}/confirmar-salida

Backend: EnvioController::confirmarSalida()
├─ Actualiza estado = EN_RUTA
├─ Registra fecha_salida = ahora()
├─ Notifica por WebSocket
└─ Envía FCM al cliente
   ├─ Título: "¡Tu pedido está en camino! 🚚"
   ├─ Cuerpo: "Chofer: Carlos López | Tel: +591234567"
   └─ Datos: {chofer_id, telefono, vehiculo_placa}

Flutter: Recibe notificación
├─ Si app abierta: Muestra mapa con ubicación en tiempo real
└─ Si app cerrada: Guarda y muestra cuando abre
```

### **PASO 10: Chofer actualiza ubicación GPS (CADA 10 SEGUNDOS)**

```
Chofer App (Flutter): POST /api/app/envios/{id}/ubicacion
{
  "lat": -17.3932,
  "lng": -66.1593,
  "velocidad": 35
}

Backend: EnvioController::actualizarUbicacion()
├─ Guarda en tabla SeguimientoEnvio
└─ Notifica por WebSocket DIRECTAMENTE
   └─ socket.broadcast('ubicacion-actualizada', {...})

Cliente App (Flutter): Escucha WebSocket
├─ Recibe ubicación cada 10 segundos
└─ Actualiza mapa en TIEMPO REAL
   └─ ESTO NO PASA POR FCM (es muy frecuente)

⚠️ IMPORTANTE: Ubicaciones van por WebSocket
💡 Razón: Son actualizaciones frecuentes, FCM es para
   eventos puntuales (aprobación, entrega, rechazo)
```

### **PASO 11: Chofer llega al cliente**

**ESCENARIO A: ENTREGA EXITOSA** ✅

```
Chofer App: Confirma entrega
├─ Toma foto del cliente
├─ Obtiene firma digital
└─ PUT /api/app/envios/{id}/confirmar-entrega

Backend: EnvioController::confirmarEntrega()
├─ Actualiza estado = ENTREGADO
├─ Registra foto + firma
├─ Notifica por WebSocket
└─ Envía FCM al cliente
   ├─ Título: "¡Tu pedido fue entregado! ✅"
   ├─ Cuerpo: "Recibido por: Juan Pérez"
   └─ Si politica_pago = MEDIO_MEDIO:
      └─ "Aún debes: Bs. 750"

Flutter: Muestra confirmación
├─ Permite registrar el pago restante
└─ Acceso a factura/boleta
```

**ESCENARIO B: PROBLEMA EN ENTREGA** ❌

```
Chofer App: Cliente ausente
├─ Toma 2-5 fotos (puerta cerrada, etc)
├─ Selecciona tipo:
│  - Cliente Ausente
│  - Tienda Cerrada
│  - Otro Problema
└─ PUT /api/app/envios/{id}/rechazar
   {
     "tipo_rechazo": "cliente_ausente",
     "fotos": [file1.jpg, file2.jpg]
   }

Backend: EnvioController::rechazarEntrega()
├─ Actualiza:
│  {
│    "estado_entrega": "CLIENTE_AUSENTE",
│    "fotos_rechazo": ["ruta/foto1.jpg", "ruta/foto2.jpg"],
│    "motivo": "Cliente no se encontraba en el lugar"
│  }
├─ Notifica por WebSocket
└─ Envía FCM a MANAGERS
   ├─ FcmNotificationService::enviarAManagers()
   ├─ Título: "🚨 Entrega Rechazada"
   ├─ Cuerpo: "ENV-20251024-0001 - Cliente Ausente"
   └─ Incluso si están en aplicaciones externas

Flutter (Cliente): Recibe notificación
├─ "Hubo un problema en tu entrega"
├─ Muestra motivo
└─ Espera a que manager reprograme

React Web (Managers): Reciben notificación FCM
├─ Ven modal con fotos del rechazo
├─ Pueden reprogar inmediatamente
└─ O contactar al cliente
```

---

## 📊 TABLA RESUMEN: QUÉ SISTEMA USA CADA SITUACIÓN

| Evento | WebSocket | FCM | HTTP Request |
|--------|-----------|-----|--------------|
| **App abierta** | ✅ (Tiempo real) | ✅ (Recibe) | ❌ (No necesita) |
| **App cerrada** | ❌ (Sin conexión) | ✅ (Notificación) | ✅ (Al abrir) |
| **Ubicación GPS** | ✅ (Cada 10s) | ❌ (Muy frecuente) | ❌ |
| **Aprobación proforma** | ✅ (Avisó en web) | ✅ (Al cliente) | ❌ |
| **Rechazo entrega** | ✅ (Avisó en web) | ✅ (A managers) | ❌ |
| **Pago registrado** | ✅ (Avisó en web) | ✅ (A managers) | ❌ |
| **Proforma solicitud** | ✅ (Avisó managers) | ✅ (A managers) | ✅ (POST) |
| **Pago parcial** | ❌ | ✅ (Confirmación) | ✅ (POST) |

---

## 🔐 SEGURIDAD EN NOTIFICACIONES

### FCM + Datos Sensibles

```php
// ❌ NO hagas esto:
$fcmService->enviarAUsuario(
    $usuario_id,
    'Número de tarjeta: 1234-5678-9012-3456'  // ¡INSEGURO!
);

// ✅ HAZ ESTO:
$fcmService->enviarAUsuario(
    $usuario_id,
    'Pago registrado: Bs. 750',  // Solo info genérica
    [
        'tipo' => 'pago_registrado',
        'venta_id' => 42,  // Para que cliente busque detalles
    ]
);

// Flutter abre la app y obtiene datos sensibles por API
GET /api/app/ventas/42/pago (con token seguro)
```

---

## 🚀 CHECKLIST: QUÉ IMPLEMENTAR POR PRIORIDAD

### 🔴 CRÍTICO (Debe estar listo AHORA):

- [ ] Sistema de pagos dinámicos (migraciones + modelo)
- [ ] Endpoint confirmar proforma (POST /api/proformas/{id}/confirmar)
- [ ] Validación de 5 productos mínimo
- [ ] WebSocket funcionando (ya está)

### 🟡 IMPORTANTE (Antes de presentar a Flutter):

- [ ] FCM integrado (FcmNotificationService)
- [ ] Endpoint registrar token (POST /api/registrar-dispositivo-fcm)
- [ ] Notificaciones en eventos clave (aprobación, rechazo, etc)

### 🟢 PUEDE ESPERAR (Durante desarrollo Flutter):

- [ ] Recordatorios automáticos de pagos
- [ ] Dashboard de analytics de rechazos
- [ ] Exportación a PDF de factura

---

## 📱 FLUJO VISUAL COMPLETO

```
DÍA 1: Cliente abre app
  ├─ 1. Login → Backend
  ├─ 2. Registra FCM token
  └─ 3. Descarga catálogo

DÍA 2: Cliente solicita proforma
  ├─ 1. POST proforma (5+ productos)
  ├─ 2. Manager recibe notificación
  └─ 3. WebSocket avisó en panel manager

DÍA 3: Manager aprueba
  ├─ 1. Cliente recibe notificación FCM
  ├─ 2. Abre app y ve: "Proforma Aprobada"
  └─ 3. Confirma pedido

DÍA 4: Cliente paga 50%
  ├─ 1. POST /registrar-pago
  ├─ 2. Manager recibe notificación FCM
  └─ 3. Puede programar envío

DÍA 5: Chofer inicia preparación
  ├─ 1. Cliente recibe FCM
  └─ 2. Espera entrega

DÍA 6: Chofer está en ruta
  ├─ 1. WebSocket: Ubicación cada 10s
  ├─ 2. Cliente ve mapa con ubicación real
  └─ 3. Tiene teléfono del chofer

DÍA 7: Entrega
  ├─ CASO A: Éxito
  │  ├─ 1. Cliente recibe FCM "Entregado"
  │  └─ 2. Paga los 750 restantes
  │
  └─ CASO B: Rechazo
     ├─ 1. Manager recibe FCM con fotos
     ├─ 2. Reprograma automáticamente
     └─ 3. Cliente recibe nueva fecha por FCM
```

---

**Conclusión:** Todos los sistemas (WebSocket, FCM, HTTP, pagos) trabajan juntos de forma coordinada para dar una experiencia fluida al cliente.

¿Empiezo con la implementación?
