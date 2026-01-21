# Estados de Caja para el Usuario

## 📊 Los 3 Estados de Caja

Una caja tiene **3 estados posibles** que el usuario ve claramente en el sistema:

---

## 1️⃣ SIN ABRIR ⚠️

### Visual en UI
```
┌─────────────────────────────────┐
│ Mi Caja del Día                 │
│                   ⚠️ Sin abrir  │
├─────────────────────────────────┤
│                                 │
│           💰                    │
│   No tienes caja abierta        │
│   Debes abrir una caja para     │
│   comenzar a trabajar.          │
│                                 │
│   [💰 Abrir Caja]               │
└─────────────────────────────────┘
```

### Condición
- **No existe** `AperturaCaja` para hoy
- Usuario NO tiene caja abierta

### Color
- 🔴 **Rojo** - `bg-red-100 text-red-800` (advertencia)

### Acciones Disponibles
- ✅ **Abrir Caja** - Click abre modal para seleccionar caja e ingresar monto inicial

### Restricciones
- ❌ NO puede convertir proforma con ANTICIPADO_100 o MEDIO_MEDIO
- ❌ NO puede registrar movimientos en caja
- ✅ PUEDE convertir proforma con CONTRA_ENTREGA o CREDITO

### Componente
Archivo: `caja-estado-card.tsx` línea 27-59

---

## 2️⃣ ABIERTA ✅

### Visual en UI
```
┌──────────────────────────────────────┐
│ Mi Caja del Día        ✅ Abierta    │
├──────────────────────────────────────┤
│ Caja: Caja Principal                 │
│ Ubicación: Mostrador 1               │
│ Hora de Apertura: 09:30              │
│                                      │
│ Monto Inicial: Bs. 500.00            │
│ Movimientos del Día: Bs. 1,250.00    │
│ Total Esperado: Bs. 1,750.00         │
│                                      │
│         [🔒 Cerrar Caja]             │
└──────────────────────────────────────┘
```

### Condición
- **Existe** `AperturaCaja` para hoy
- **NO existe** `CierreCaja` asociada a esa apertura
- Usuario TIENE caja abierta

### Color
- 🟢 **Verde** - `bg-green-100 text-green-800` (activo)

### Información Mostrada
- **Nombre de caja:** "Caja Principal"
- **Ubicación:** "Mostrador 1"
- **Hora de apertura:** "09:30"
- **Monto inicial:** Bs. 500.00
- **Movimientos del día:** Total de movimientos registrados
- **Total esperado:** Monto inicial + movimientos

### Acciones Disponibles
- ✅ **Cerrar Caja** - Click abre modal para cierre de caja
- ✅ **Registrar movimientos**
- ✅ **Convertir proformas** (cualquier política)

### Duración
- ⏱️ Desde las ~09:30 (hora de apertura)
- Hasta que usuario presione "Cerrar Caja"
- O hasta que cierre sesión (caja sigue abierta)

### Componente
Archivo: `caja-estado-card.tsx` línea 62-163

---

## 3️⃣ CERRADA ❌

### Visual en UI
```
┌──────────────────────────────────────┐
│ Mi Caja del Día        ❌ Cerrada    │
├──────────────────────────────────────┤
│ Caja: Caja Principal                 │
│ Ubicación: Mostrador 1               │
│ Hora de Apertura: 09:30              │
│                                      │
│ Monto Inicial: Bs. 500.00            │
│ Movimientos del Día: Bs. 1,250.00    │
│ Total Esperado: Bs. 1,750.00         │
│                                      │
│   Caja cerrada a las 17:45           │
│   Diferencia: Bs. 50.00 ✅           │
└──────────────────────────────────────┘
```

### Condición
- **Existe** `AperturaCaja` para hoy
- **Existe** `CierreCaja` asociada a esa apertura
- Usuario CERRÓ la caja

### Color
- ⚫ **Gris** - `bg-gray-100 text-gray-800` (inactivo)

### Información Mostrada
- **Toda la información de apertura**
- **Hora de cierre:** "17:45"
- **Diferencia:** Monto esperado - Monto contado
  - 🟢 **Verde** si diferencia >= 0 (sobrante)
  - 🔴 **Rojo** si diferencia < 0 (faltante)

### Ejemplo de Diferencias
```
Monto Esperado: Bs. 1,750.00
Monto Contado: Bs. 1,800.00
Diferencia: Bs. 50.00 ✅ (Sobrante)
─────────────────────────────────

Monto Esperado: Bs. 1,750.00
Monto Contado: Bs. 1,700.00
Diferencia: Bs. -50.00 ⚠️ (Faltante)
```

### Acciones Disponibles
- ❌ **NO** puede cerrar de nuevo
- ❌ **NO** puede registrar movimientos
- ❌ **NO** puede convertir proformas
- ✅ **PUEDE** abrir nueva caja mañana

### Duración
- ⏱️ Desde que usuario presionó "Cerrar Caja"
- Hasta las 23:59 (fin del día)
- Al siguiente día: vuelve a "SIN ABRIR"

### Componente
Archivo: `caja-estado-card.tsx` línea 70-78, 138-157

---

## 🔄 Transiciones de Estados

```
┌───────────────┐
│  SIN ABRIR    │ ⚠️
│      ⚠️       │
└───────┬───────┘
        │ click "Abrir Caja"
        │ + seleccionar caja
        │ + ingresar monto inicial
        │ + POST /cajas/abrir
        ↓
┌───────────────┐
│   ABIERTA     │ ✅
│      ✅       │
└───────┬───────┘
        │ realiza operaciones
        │ (7-8 horas típicamente)
        │
        │ click "Cerrar Caja"
        │ + ingresar monto contado
        │ + POST /cajas/cerrar
        ↓
┌───────────────┐
│   CERRADA     │ ❌
│      ❌       │
└───────┬───────┘
        │ espera hasta mañana
        │ (12+ horas)
        ↓
        (Siguiente día)
┌───────────────┐
│  SIN ABRIR    │ ⚠️
│      ⚠️       │
└───────────────┘
```

---

## 📊 Tabla Resumen

| Aspecto | SIN ABRIR | ABIERTA | CERRADA |
|---------|-----------|---------|---------|
| **Visual** | ⚠️ Rojo | ✅ Verde | ❌ Gris |
| **Existe Apertura** | ❌ NO | ✅ SÍ | ✅ SÍ |
| **Existe Cierre** | N/A | ❌ NO | ✅ SÍ |
| **Duración** | Todo el día | 7-10 horas | Hasta fin día |
| **Abrir Caja** | ✅ Sí | ❌ No | ❌ No |
| **Cerrar Caja** | ❌ No | ✅ Sí | ❌ No |
| **Convertir ANTICIPADO** | ❌ NO | ✅ Sí | ❌ No |
| **Convertir CONTRA_ENTREGA** | ✅ Sí | ✅ Sí | ❌ No |
| **Registrar movimientos** | ❌ No | ✅ Sí | ❌ No |
| **Ver información** | Mensaje | Completa | Completa |

---

## 💡 Casos de Uso

### Caso 1: Usuario inicia sesión a las 9:00 AM

```
9:00 AM: Login
├─ Estado: SIN ABRIR ⚠️
├─ Usuario abre caja
│  ├─ Click "Abrir Caja"
│  ├─ Selecciona "Caja Principal"
│  ├─ Ingresa monto inicial: Bs. 500
│  └─ POST /cajas/abrir
│
9:05 AM: Caja abierta
├─ Estado: ABIERTA ✅
├─ Muestra: Bs. 500 iniciales
└─ Puede convertir proformas con pago

16:00 hasta 17:00: Trabajo normal
├─ Convierte varias proformas
├─ Registra movimientos
├─ Total en caja: Bs. 1,750

17:30: Usuario cierra caja
├─ Click "Cerrar Caja"
├─ Ingresa monto contado: Bs. 1,750
├─ POST /cajas/cerrar
│
17:35: Caja cerrada
└─ Estado: CERRADA ❌
   └─ Diferencia: Bs. 0 ✅ (Perfecto)
```

### Caso 2: Usuario olvida abrir caja

```
9:00 AM: Login
├─ Estado: SIN ABRIR ⚠️
├─ Usuario intenta convertir proforma
│  ├─ Selecciona ANTICIPADO_100
│  ├─ Ingresa monto: Bs. 1000
│  ├─ Click "Aprobar y Convertir"
│  │
│  └─ ❌ ERROR HTTP 422
│     └─ Message: "No puede convertir sin caja abierta"
│
9:05 AM: Usuario abre caja
├─ Click "Abrir Caja"
├─ Abre caja correctamente
│
9:10 AM: Reintentar conversión
└─ ✅ ÉXITO
   └─ Proforma convertida a venta
   └─ MovimientoCaja registrado
```

### Caso 3: Usuario se va sin cerrar caja

```
17:00: Usuario se va
├─ Estado: ABIERTA ✅
├─ Caja sigue abierta (no cerró)
└─ Total en caja: Bs. 1,750

18:00 a 23:59: Caja abierta
├─ Usuario desconectado
├─ Caja sigue abierta
└─ PROBLEMA: Cajas sin reconciliar

Siguiente día 9:00 AM: Usuario inicia sesión
├─ Estado: ABIERTA ✅ (TODAVÍA)
├─ Muestra apertura de ayer
├─ Usuario cierra caja
│  ├─ Click "Cerrar Caja"
│  ├─ Ingresa monto contado: Bs. 1,750
│  └─ POST /cajas/cerrar
│
└─ ✅ Caja cerrada de ayer
   └─ Ahora puede abrir nueva caja de hoy
```

---

## 🔧 Datos BD Relacionados

### AperturaCaja
```sql
SELECT * FROM aperturas_caja
WHERE DATE(fecha) = CURDATE()
AND user_id = 5
-- Retorna NULL si SIN ABRIR
-- Retorna registro si ABIERTA o CERRADA
```

### CierreCaja
```sql
SELECT * FROM cierres_caja
WHERE apertura_caja_id = {id}
-- Retorna NULL si ABIERTA
-- Retorna registro si CERRADA
```

### Método en Modelo
```php
$apertura = $empleado->cajaAbierta();

// SIN ABRIR
if (!$apertura) { /* ... */ }

// ABIERTA
if ($apertura && !$apertura->cierre) { /* ... */ }

// CERRADA
if ($apertura && $apertura->cierre) { /* ... */ }
```

---

## 📱 Transiciones de Interfaz

### Estado SIN ABRIR
Muestra:
```
💰
No tienes caja abierta
Debes abrir una caja para comenzar a trabajar

[💰 Abrir Caja] ← Click aquí
```

Flujo:
```
Click [Abrir Caja]
      ↓
Modal: "Abrir Caja"
├─ Seleccionar caja
├─ Ingresar monto inicial
└─ [Abrir]
      ↓
POST /cajas/abrir
      ↓
Estado ABIERTA ✅
```

### Estado ABIERTA
Muestra:
```
Caja Principal (Mostrador 1)
Hora de Apertura: 09:30
Monto Inicial: Bs. 500.00
Movimientos del Día: Bs. 1,250.00
Total Esperado: Bs. 1,750.00

[🔒 Cerrar Caja] ← Click aquí
```

Flujo:
```
Click [Cerrar Caja]
      ↓
Modal: "Cerrar Caja"
├─ Mostrar monto esperado
├─ Ingresar monto contado
└─ [Cerrar]
      ↓
POST /cajas/cerrar
      ↓
Estado CERRADA ❌
```

### Estado CERRADA
Muestra:
```
Caja Principal (Mostrador 1)
Hora de Apertura: 09:30
Monto Inicial: Bs. 500.00
Movimientos del Día: Bs. 1,250.00
Total Esperado: Bs. 1,750.00

Caja cerrada a las 17:45
Diferencia: Bs. 0.00 ✅
```

No hay botones de acción. Solo lectura hasta mañana.

---

## 🎯 Reglas de Negocio

### Regla 1: Solo 1 Caja Abierta por Usuario por Día
```
Si estado = ABIERTA:
  └─ User solo puede cerrar
  └─ No puede abrir otra

Si estado = CERRADA:
  └─ User puede abrir nueva (si es siguiente día)

Si estado = SIN ABRIR:
  └─ User debe abrir antes de trabajar
```

### Regla 2: Conversión de Proformas
```
ANTICIPADO_100 o MEDIO_MEDIO:
  ├─ Si estado = SIN ABRIR: ❌ BLOQUEA
  ├─ Si estado = ABIERTA: ✅ PERMITE
  └─ Si estado = CERRADA: ❌ BLOQUEA

CONTRA_ENTREGA o CREDITO:
  ├─ Si estado = SIN ABRIR: ✅ PERMITE
  ├─ Si estado = ABIERTA: ✅ PERMITE
  └─ Si estado = CERRADA: ❌ BLOQUEA
```

### Regla 3: Duración Diaria
```
Cada estado es diario:
  ├─ Caja abierta a las 09:00
  ├─ Caja cerrada a las 17:00-18:00
  ├─ Caja "muere" a las 23:59
  └─ Mañana vuelve a SIN ABRIR
```

---

## ✅ Resumen

El usuario ve **3 estados claramente**:

1. **⚠️ SIN ABRIR** - Necesita abrir caja
2. **✅ ABIERTA** - Puede trabajar, convertir, registrar
3. **❌ CERRADA** - Fin del día, solo ver info

Cada estado tiene:
- Visual diferente (color badge)
- Información específica
- Acciones disponibles
- Restricciones claras

---

**Última actualización:** 2026-01-21
**Estado:** ✅ Documentado y Claro
