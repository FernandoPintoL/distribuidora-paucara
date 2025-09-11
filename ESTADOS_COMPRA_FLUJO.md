# Flujo de Estados de Compra

## 📋 Estados y Transiciones

### 1. **BORRADOR**

- **Cuándo:** Compra en creación, datos incompletos
- **Acciones permitidas:** Editar, eliminar, enviar a pendiente
- **Siguiente estado:** PENDIENTE
- **Ejemplo:** Empleado está cargando productos pero no ha terminado

### 2. **PENDIENTE**

- **Cuándo:** Compra completa esperando aprobación
- **Acciones permitidas:** Aprobar, rechazar, editar (solo supervisor)
- **Siguiente estado:** APROBADO, RECHAZADO
- **Ejemplo:** Compra de $10,000 necesita autorización del gerente

### 3. **APROBADO**

- **Cuándo:** Compra autorizada, esperando recepción de mercancía
- **Acciones permitidas:** Recibir mercancía, anular (con justificación)
- **Siguiente estado:** RECIBIDO, ANULADO
- **Ejemplo:** Se ordenaron 100 cajas, esperando que llegue el camión

### 4. **RECIBIDO**

- **Cuándo:** Mercancía recibida y verificada físicamente
- **Acciones permitidas:** Registrar pago, generar cuenta por pagar
- **Siguiente estado:** PAGADO (si es contado), mantiene RECIBIDO (si es crédito)
- **Ejemplo:** Se recibieron 98 cajas (ajuste de cantidad), actualiza inventario

### 5. **PAGADO**

- **Cuándo:** Compra totalmente pagada
- **Acciones permitidas:** Solo consulta, reportes
- **Estado final:** ✅
- **Ejemplo:** Se pagó con transferencia bancaria

### 6. **ANULADO**

- **Cuándo:** Compra cancelada por cualquier motivo
- **Acciones permitidas:** Solo consulta
- **Estado final:** ❌
- **Ejemplo:** Proveedor no puede entregar, cambio de estrategia

### 7. **RECHAZADO**

- **Cuándo:** Compra no autorizada por supervisor
- **Acciones permitidas:** Editar y reenviar, eliminar
- **Siguiente estado:** PENDIENTE (si se reenvía)
- **Ejemplo:** Presupuesto insuficiente, proveedor no autorizado

## 🔄 Flujo Completo

```
BORRADOR → PENDIENTE → APROBADO → RECIBIDO → PAGADO
    ↓           ↓           ↓         ↓
  DELETE    RECHAZADO   ANULADO   ANULADO
```

## 💳 Manejo de Compras a Crédito

### **Compra CONTADO:**

- RECIBIDO → PAGADO (inmediato)
- No genera cuenta por pagar

### **Compra CRÉDITO:**

- RECIBIDO → Genera CuentaPorPagar
- Estado permanece RECIBIDO hasta pago completo
- Cuando se paga completamente → PAGADO

### **Compra CRÉDITO con pagos parciales:**

- RECIBIDO → Múltiples registros de Pago
- CuentaPorPagar.saldoPendiente se actualiza
- Cuando saldoPendiente = 0 → Estado PAGADO
