# 📋 Guía de Validación - FASE 3: Sistema de Créditos (React)

## ✅ Implementación Completada

Este documento cubre la validación de la integración completa del sistema de créditos entre backend (Laravel) y frontend (React).

---

## 🎯 Objetivos de Validación

1. ✅ Eventos WebSocket se emiten correctamente desde backend
2. ✅ Frontend recibe y procesa eventos en tiempo real
3. ✅ Notificaciones toast muestran información correcta
4. ✅ Browser notifications funcionan correctamente
5. ✅ Interfaz de usuario responde y se actualiza correctamente
6. ✅ Persistencia de datos en base de datos

---

## 🔧 BACKEND - Validación (Laravel)

### Paso 1: Ejecutar comando de procesamiento

```bash
# Ejecutar manualmente el comando
php artisan creditos:procesar

# Salida esperada:
# 🔄 Procesando créditos...
#
# 📅 Procesando cuentas vencidas...
#   ⚠️  Cuenta #123 - Cliente: Juan Pérez - Vencido hace 5 días
# ✅ 2 cuentas actualizadas
# 📢 2 eventos de vencimiento disparados
#
# 🔴 Detectando clientes con crédito crítico (>80%)...
#   🔴 Cliente: Pedro González - Utilización: 85% - Disponible: Bs 5000.00
# 📢 2 eventos de crédito crítico disparados
```

### Paso 2: Verificar que eventos están registrados

```bash
# Ver todos los eventos disponibles
php artisan event:list | grep -i credito

# Salida esperada:
# App\Events\CreditoVencido ......................... ✓
# App\Events\CreditoCritico ......................... ✓
# App\Events\CreditoPagoRegistrado ................. ✓
```

### Paso 3: Verificar logs en Laravel

```bash
# Ver logs recientes
tail -f storage/logs/laravel.log

# Buscar eventos de crédito
grep -i "credito" storage/logs/laravel.log

# Salida esperada:
# [2024-01-14 14:30:45] local.INFO: 📬 Enviando notificación de crédito vencido...
# [2024-01-14 14:30:46] local.INFO: ✅ Notificación de crédito vencido enviada exitosamente
```

---

## 💻 FRONTEND - Validación (React)

### Paso 1: Verificar conexión WebSocket

En la consola del navegador:

```javascript
// Verificar que WebSocket está conectado
console.log(websocketService.isSocketConnected()) // Debe ser true

// Revisar logs en consola:
// ✅ WebSocket conectado
// 🔔 Configurando listeners de notificaciones unificadas...
// ✅ Listeners de notificaciones configurados exitosamente
```

### Paso 2: Navegar a la página de créditos

```bash
# Acceder a
/creditos

# O si es cliente específico
/clientes/5/credito
```

### Paso 3: Ejecutar comando y monitorear React

En una terminal:
```bash
php artisan creditos:procesar
```

En la aplicación React, deberías ver:

**Toast 1: Crédito Vencido**
```
⚠️ Crédito Vencido - Juan Pérez
Deuda: Bs. 2500.00 | Vencido hace 5 días
```

**Toast 2: Crédito Crítico**
```
🔴 Crédito Crítico - Pedro González
Utilización: 85% | Disponible: Bs. 5000.00
```

**Toast 3: Pago Registrado**
```
✅ Pago Registrado - Juan Pérez
Monto: Bs. 1000.00 vía transferencia | Saldo restante: Bs. 1500.00
```

### Paso 4: Validar Notificaciones del Navegador

En el dispositivo, debería recibir **3 notificaciones del navegador** del sistema:

- **Notificación 1**: "⚠️ Crédito Vencido - Cliente Juan Pérez - Deuda: Bs. 2500.00"
- **Notificación 2**: "🔴 Crédito Crítico - Cliente Pedro González - Utilización: 85%"
- **Notificación 3**: "✅ Pago Registrado - Cliente Juan Pérez - Pagó: Bs. 1000.00"

### Paso 5: Verificar Página de Créditos

Navega a `/creditos` en la aplicación React:

**Tab 1: Resumen**
```
┌─────────────────────────────────┐
│ Mi Crédito         [CRÍTICO]    │
├─────────────────────────────────┤
│ Disponible        Límite    Utilizado
│ Bs. 15,000        Bs.50,000 Bs.35,000
│                                  │
│ Utilización: 70%  [====== ]     │
├─────────────────────────────────┤
│ ⚠️ Tu crédito está al 80% o más.│
│    Por favor realiza un pago.   │
│                                  │
│ [Pendientes: 5] [Vencidas: 1]   │
├─────────────────────────────────┤
│     [Ver Detalles →]            │
└─────────────────────────────────┘
```

**Tab 2: Pendientes**
```
Muestra cada cuenta pendiente:
- Venta V-001: Bs. 5,000 | Pagado 50% | Vence en 10 días
- Venta V-002: Bs. 8,000 | Pagado 0%  | VENCIDA hace 5 días
```

**Tab 3: Historial de Pagos**
```
Muestra historial de pagos realizados:
- Bs. 2,500 | Efectivo | 15/01/2024 | Usuario: Carlos
- Bs. 1,000 | Transferencia | 10/01/2024 | Usuario: María
```

### Paso 6: Validar Dashboard

En el dashboard (`/dashboard`):

```
┌─────────────────────────────────────┐
│ 💳 Crédito de Clientes    [En vivo] │
├─────────────────────────────────────┤
│ [Actualizado hace 2s]               │
│                                      │
│ Total Clientes: 150                 │
│ Con Crédito: 120 (80%)              │
│ Límite Total: Bs. 5,000,000         │
│ Disponible: Bs. 800,000             │
│                                      │
│ Utilización de Crédito: 84%         │
│ [████████░░]                        │
│                                      │
│ ⚠️ 5 cliente(s) utilizando >80%    │
└─────────────────────────────────────┘
```

El widget debe actualizarse en tiempo real cuando se disparan eventos.

### Paso 7: Registrar un Pago

Navega a `/clientes/5/credito` y haz clic en "Registrar Pago":

1. Completa el formulario:
   - Monto: 1000
   - Tipo de Pago: Transferencia
   - Fecha: Hoy

2. Haz clic en "Registrar"

3. Deberías ver:
   - Toast de éxito con "Pago Registrado"
   - Actualización de saldo en tiempo real
   - Actualización del dashboard
   - Notificación del navegador

---

## 🧪 Test Scenarios

### Escenario 1: Crédito Normal (70% utilización)

**Backend:**
```php
Cliente::find(1)->update(['limite_credito' => 50000]);
CuentaPorCobrar::create([
    'cliente_id' => 1,
    'saldo_pendiente' => 35000,
    // ...
]);
php artisan creditos:procesar
```

**Esperado en Frontend:**
- ✅ Toast azul: "Crédito en uso"
- ✅ Card muestra estado: "EN_USO"
- ✅ Barra de progreso 70% en azul

---

### Escenario 2: Crédito Crítico (>80% utilización)

**Backend:**
```php
CuentaPorCobrar::find(1)->update(['saldo_pendiente' => 42000]);
php artisan creditos:procesar
```

**Esperado en Frontend:**
- 🔴 Toast rojo: "Crédito Crítico"
- 🔴 Card muestra estado: "CRÍTICO"
- 🔴 Barra de progreso 84% en rojo
- 🔴 Badge de alerta: "Tu crédito está al 80% o más"

---

### Escenario 3: Crédito Vencido

**Backend:**
```php
CuentaPorCobrar::create([
    'cliente_id' => 1,
    'fecha_vencimiento' => now()->subDays(5),
    // ...
]);
php artisan creditos:procesar
```

**Esperado en Frontend:**
- ⚠️ Toast naranja: "Crédito Vencido"
- ⚠️ Tab "Pendientes" muestra cuenta con badge rojo "VENCIDA"
- ⚠️ Dashboard muestra: "Tienes 1 cuenta vencida"

---

### Escenario 4: Pago Registrado

**Backend:**
```php
Pago::create([
    'cuenta_por_cobrar_id' => 1,
    'monto' => 5000,
    'tipo_pago' => 'transferencia',
]);

// Evento se dispara en ClienteController->registrarPagoApi()
```

**Esperado en Frontend:**
- ✅ Toast verde: "Pago Registrado"
- ✅ Notificación del navegador: muestra monto y método
- ✅ Tab "Historial de Pagos" actualizado con nuevo pago
- ✅ Balance actualizado en tiempo real

---

## 🚀 Checklist de Validación

### Backend ✓
- [ ] Comando `php artisan creditos:procesar` ejecuta sin errores
- [ ] Se detectan cuentas vencidas correctamente
- [ ] Se detectan clientes con crédito crítico (>80%)
- [ ] Se disparan eventos para cada caso
- [ ] Listeners reciben eventos correctamente
- [ ] WebSocketService envía notificaciones al servidor Node.js
- [ ] Base de datos registra notificaciones en tabla `notifications`
- [ ] Logs muestran ejecución correcta

### Frontend React ✓
- [ ] WebSocket conecta exitosamente al servidor
- [ ] Toasts muestran información correcta y con colores apropiados
- [ ] Notificaciones del navegador se envían
- [ ] Página de créditos carga datos correctamente
- [ ] Dashboard widget se actualiza en tiempo real
- [ ] Colores de estados son consistentes (rojo=crítico, naranja=vencido, verde=disponible)
- [ ] El formulario de registro de pago funciona
- [ ] Permisos de notificación se solicitan correctamente

### Integración ✓
- [ ] Comando backend → WebSocket → Frontend (latencia < 2s)
- [ ] Notificaciones se replican correctamente en BD y app
- [ ] Estadísticas se actualizan sin necesidad de refresh
- [ ] Múltiples eventos se procesan sin conflictos
- [ ] Los datos son sincronizados entre Flutter y React

---

## 📊 Métricas de Éxito

| Métrica | Esperado | Resultado |
|---------|----------|-----------|
| Latencia WebSocket | < 2 segundos | |
| Notificaciones recibidas | 3 eventos | |
| Toasts mostrados | 3 (vencido, crítico, pago) | |
| Notificaciones navegador | 3 push notifications | |
| Página Créditos funciona | Sí | |
| Dashboard se actualiza | Tiempo real | |
| Datos en BD | Registrados | |

---

## 🐛 Troubleshooting

### WebSocket no conecta

**Causa**: Servidor Node.js no está corriendo o URL incorrecta

**Solución:**
```bash
# Verificar que Node.js está corriendo
ps aux | grep node

# O desde websocket folder
npm start

# Actualizar .env con URL correcta
NODE_WEBSOCKET_URL=http://localhost:3000
```

### No recibo eventos en React

**Causa**: Evento no se dispara en backend o WebSocket cerrada

**Solución:**
```bash
# 1. Ejecutar comando con verbose
php artisan creditos:procesar -v

# 2. Verificar logs en tiempo real
tail -f storage/logs/laravel.log | grep credito

# 3. Recargar página React
# Presionar F5 o Cmd+R
```

### Toasts no aparecen

**Causa**: ToastContainer no está renderizado o estilos CSS no cargados

**Solución:**
```bash
# 1. Verificar que ToastContainer está en el layout principal
# En app-layout.tsx o en la raíz del app

# 2. Verificar que react-toastify esté importado
import { ToastContainer } from 'react-toastify';

# 3. Limpiar caché del navegador (Ctrl+Shift+Del)
```

### Notificaciones del navegador no funcionan

**Causa**: Permisos no otorgados o navegador no soporta

**Solución:**
```javascript
// Solicitar permisos de notificación manualmente
Notification.requestPermission().then((permission) => {
  if (permission === 'granted') {
    console.log('Notificaciones habilitadas');
  }
});
```

---

## 📝 Notas Importantes

1. **Permisos**: El navegador debe permitir notificaciones (popup inicial)

2. **Scheduling**: El comando debe ejecutarse diariamente. Configurar en Laravel Scheduler:
   ```php
   // app/Console/Kernel.php
   protected function schedule(Schedule $schedule)
   {
       $schedule->command('creditos:procesar')
                ->dailyAt('01:00');
   }
   ```

3. **Sincronización**: Ambos frontends (Flutter y React) reciben los mismos eventos en paralelo

4. **Estadísticas**: El dashboard puede tardar hasta 5 segundos en actualizar después del evento

5. **Auditoría**: Todos los pagos se registran con usuario_id y fecha exacta

---

## ✅ Validación Exitosa

Si todos los puntos del checklist están marcados, el sistema **está listo para producción**.

La integración de la **FASE 3** está completa y operativa para ambas plataformas:
- ✅ Backend (Laravel)
- ✅ Frontend Flutter
- ✅ Frontend React

---

**Última actualización**: 2024-01-14
**Versión**: 1.0
**Estado**: ✅ COMPLETADA
