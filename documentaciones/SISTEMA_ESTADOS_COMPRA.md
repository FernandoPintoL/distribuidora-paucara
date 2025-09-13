# 📊 Sistema de Estados de Compra - Guía Completa

## 🎯 Visión General

El sistema de compras maneja diferentes estados que reflejan el ciclo de vida completo de una compra, desde su creación hasta el pago final. El manejo de crédito se realiza automáticamente mediante observers y cuentas por pagar.

## 📋 Estados Disponibles

| ID | Código | Nombre | Color | Descripción |
|---|---|---|---|---|
| 1 | BORRADOR | Borrador | #6B7280 | Compra en proceso de creación |
| 2 | PENDIENTE | Pendiente | #6B7280 | Esperando aprobación |
| 3 | APROBADO | Aprobado | #6B7280 | Autorizada para proceder |
| 8 | RECIBIDO | Recibido | #10B981 | Mercancía recibida |
| 9 | PAGADO | Pagado | #059669 | Completamente pagada |
| 4 | RECHAZADO | Rechazado | #EF4444 | No autorizada |
| 10 | ANULADO | Anulado | #DC2626 | Cancelada |

## 🔄 Flujo de Estados

### **Flujo Normal - Compra al Contado:**

```
BORRADOR → PENDIENTE → APROBADO → RECIBIDO → PAGADO ✅
```

### **Flujo Normal - Compra a Crédito:**

```
BORRADOR → PENDIENTE → APROBADO → RECIBIDO → [Genera CuentaPorPagar] → PAGADO ✅
```

### **Flujos Alternativos:**

```
BORRADOR → [ELIMINAR] ❌
PENDIENTE → RECHAZADO → [Editar] → PENDIENTE
APROBADO → ANULADO ❌
RECIBIDO → ANULADO ❌ (con justificación)
```

## 💳 Manejo de Tipos de Pago

### **EFECTIVO/TRANSFERENCIA/TARJETA:**

- Estado RECIBIDO → PAGADO inmediatamente
- No genera cuenta por pagar
- Transacción completada en el momento

### **CRÉDITO:**

- Estado RECIBIDO → Genera CuentaPorPagar automáticamente
- Estado permanece RECIBIDO hasta pago completo
- Sistema de seguimiento de pagos parciales
- Cuando saldo_pendiente = 0 → Estado PAGADO

## 🏗️ Arquitectura del Sistema

### **Observer Pattern:**

```php
CompraObserver::updated() {
    if (estado_cambió_a_RECIBIDO && tipo_pago == CREDITO) {
        CuentaPorPagar::create([
            'monto_original' => compra.total,
            'saldo_pendiente' => compra.total,
            'fecha_vencimiento' => +30_días,
            'estado' => 'PENDIENTE'
        ]);
    }
}
```

### **Estados de CuentaPorPagar:**

- **PENDIENTE**: Saldo completo pendiente
- **PARCIAL**: Pagos parciales realizados
- **VENCIDO**: Pasó la fecha de vencimiento
- **PAGADO**: Saldo = 0

## 🛠️ Comandos de Mantenimiento

### **Actualización Automática:**

```bash
php artisan cuentas:actualizar-vencidas
```

- Actualiza estados vencidos diariamente
- Calcula días de vencimiento
- Marca cuentas como PAGADO cuando saldo = 0

### **Programación en Cron:**

```php
// En App\Console\Kernel.php
protected function schedule(Schedule $schedule) {
    $schedule->command('cuentas:actualizar-vencidas')
             ->dailyAt('06:00');
}
```

## 📊 Casos de Uso Prácticos

### **Caso 1: Compra Contado $1,000**

1. BORRADOR → Usuario carga productos
2. PENDIENTE → Envía para aprobación
3. APROBADO → Gerente autoriza
4. RECIBIDO → Almacén recibe mercancía + Stock actualizado
5. PAGADO → Pago inmediato + Movimiento de caja

### **Caso 2: Compra Crédito $5,000**

1. BORRADOR → Usuario carga productos
2. PENDIENTE → Envía para aprobación (monto alto)
3. APROBADO → Gerente autoriza
4. RECIBIDO → Almacén recibe + CuentaPorPagar creada
5. [30 días después] → VENCIDO (si no se paga)
6. [Pago parcial $2,000] → PARCIAL
7. [Pago final $3,000] → PAGADO

### **Caso 3: Compra Rechazada**

1. BORRADOR → Usuario carga productos caros
2. PENDIENTE → Envía para aprobación
3. RECHAZADO → Gerente no autoriza (presupuesto)
4. [Usuario ajusta] → PENDIENTE → APROBADO → ...

## 🚨 Validaciones y Reglas de Negocio

### **Transiciones Permitidas:**

| Estado Actual | Estados Siguientes Permitidos |
|---|---|
| BORRADOR | PENDIENTE, [ELIMINAR] |
| PENDIENTE | APROBADO, RECHAZADO |
| APROBADO | RECIBIDO, ANULADO |
| RECIBIDO | PAGADO, ANULADO |
| RECHAZADO | PENDIENTE (después de editar) |
| PAGADO | ✅ Estado final |
| ANULADO | ✅ Estado final |

### **Permisos por Rol:**

- **Empleado**: BORRADOR → PENDIENTE
- **Supervisor**: PENDIENTE → APROBADO/RECHAZADO
- **Almacén**: APROBADO → RECIBIDO
- **Contador**: RECIBIDO → PAGADO
- **Gerente**: Puede ANULAR en cualquier momento

## 📈 Reportes y Métricas

### **Dashboard de Compras:**

- Compras pendientes de aprobación
- Compras recibidas sin pagar
- Cuentas por pagar vencidas
- Total comprometido en crédito

### **Alertas Automáticas:**

- Cuentas próximas a vencer (7 días)
- Cuentas vencidas sin gestión
- Compras en BORRADOR más de 24h
- Compras APROBADAS sin recibir por más de 7 días

Este sistema proporciona trazabilidad completa, control de flujo y gestión automatizada del crédito, asegurando que todas las compras sigan el proceso establecido y se mantenga control financiero total.
