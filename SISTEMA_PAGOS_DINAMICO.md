# 💰 SISTEMA DE PAGOS DINÁMICO (Sin Pasarela)

**Fecha:** 2025-10-25
**Estado:** Parcialmente Implementado - Requiere extensión para Ventas desde App
**Scope:** Backend (Laravel) + Frontend (Flutter)

---

## 📊 ESTADO ACTUAL

### ✅ YA IMPLEMENTADO
- Tabla `pagos` existe (creada 2025-09-09)
- Modelo `Pago` completamente funcional
- Sistema de tipos de pago (TipoPago)
- Integración con CuentaPorPagar

### ❌ NECESITA IMPLEMENTACIÓN (Para App Flutter)
- Campos en tabla `ventas` (monto_pagado, estado_pago, politica_pago)
- Endpoints API para pagos de ventas
- Validación de 5 productos mínimo en proforma
- Validación de pago para programar envío

---

## 📋 RESUMEN EJECUTIVO

El sistema de pagos es **dinámico y flexible** según el acuerdo con cada cliente:

- **Pago Anticipado 100%**: Cliente paga todo antes del envío
- **Pago 50/50**: Cliente paga 50% al confirmar, 50% después de entrega
- **Pago Contra Entrega**: Cliente paga 100% cuando recibe el producto
- **Pago Después de Entrega**: Cliente paga después de recibido (clientes de confianza)

**Requisito Adicional**: Para hacer un pedido, cliente debe solicitar **mínimo 5 productos diferentes**.

---

## 🏗️ ESTRUCTURA DE BASE DE DATOS

### 1. Tabla `ventas` (Modificada)

```sql
ALTER TABLE ventas ADD COLUMN (
    monto_total DECIMAL(12, 2),              -- Monto total de la venta
    monto_pagado DECIMAL(12, 2) DEFAULT 0,  -- Lo que ya pagó
    monto_pendiente DECIMAL(12, 2),          -- Lo que falta pagar
    politica_pago VARCHAR(50),               -- ANTICIPADO_100, MEDIO_MEDIO, CONTRA_ENTREGA, DESPUES_ENTREGA
    estado_pago VARCHAR(50),                 -- PENDIENTE, PARCIALMENTE_PAGADO, PAGADO, ATRASADO
    observaciones_pago TEXT,                 -- Notas sobre el pago
    fecha_pago_esperada DATE,                -- Cuándo se espera el pago (si es plazo)
    recordatorio_pagos_enviados INT DEFAULT 0
);

-- Crear índice para consultas frecuentes
CREATE INDEX idx_ventas_estado_pago ON ventas(estado_pago);
CREATE INDEX idx_ventas_cliente_estado_pago ON ventas(cliente_id, estado_pago);
```

### 2. Nueva Tabla `pagos`

```sql
CREATE TABLE pagos (
    id BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
    venta_id BIGINT UNSIGNED NOT NULL,
    monto DECIMAL(12, 2) NOT NULL,
    tipo_pago VARCHAR(50), -- EFECTIVO, TRANSFERENCIA, CHEQUE, OTRO
    fecha_pago DATETIME,
    numero_referencia VARCHAR(100), -- Para transferencias
    observaciones TEXT,
    registrado_por BIGINT UNSIGNED, -- Usuario que registró el pago
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    FOREIGN KEY (venta_id) REFERENCES ventas(id),
    FOREIGN KEY (registrado_por) REFERENCES users(id)
);

CREATE INDEX idx_pagos_venta ON pagos(venta_id);
CREATE INDEX idx_pagos_fecha ON pagos(fecha_pago);
```

---

## 🔄 FLUJO DE PAGOS - PASO A PASO

### **Ejemplo 1: Cliente Paga 100% Anticipado**

```
1. Cliente confirma proforma con 5+ productos
   ↓
2. Venta se crea con estado_pago = PENDIENTE
   ↓
3. Manager envía invoice al cliente
   ↓
4. Cliente paga 100% (por banco, efectivo, cheque)
   ↓
5. Manager registra pago en sistema → Pago registrado
   ↓
6. Sistema actualiza:
   - monto_pagado = monto_total
   - estado_pago = PAGADO
   ↓
7. Manager puede programar envío
```

### **Ejemplo 2: Cliente Paga 50/50 (Mitad Ahora, Mitad Después)**

```
1. Cliente confirma proforma
   ↓
2. Venta se crea:
   - monto_total = 1000 Bs
   - estado_pago = PENDIENTE
   ↓
3. Cliente paga 500 Bs (50%)
   ↓
4. Sistema actualiza:
   - monto_pagado = 500
   - monto_pendiente = 500
   - estado_pago = PARCIALMENTE_PAGADO
   ↓
5. Manager programa envío (porque cumple requisito de 50% pagado)
   ↓
6. Chofer entrega pedido
   ↓
7. Cliente paga los otros 500 Bs
   ↓
8. Sistema marca como PAGADO
```

### **Ejemplo 3: Pago Contra Entrega**

```
1. Cliente confirma proforma
   ↓
2. Venta se crea:
   - estado_pago = PENDIENTE (pero OK para envío)
   - politica_pago = CONTRA_ENTREGA
   ↓
3. Manager programa envío (sin necesidad de pago previo)
   ↓
4. Chofer entrega y cobra
   ↓
5. Manager registra pago de lo que cobra el chofer
   ↓
6. Sistema marca como PAGADO
```

---

## 📝 MIGRACIONES NECESARIAS

### Migración 1: Agregar campos a tabla ventas

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->decimal('monto_total', 12, 2)->default(0);
            $table->decimal('monto_pagado', 12, 2)->default(0);
            $table->decimal('monto_pendiente', 12, 2)->default(0);
            $table->string('politica_pago')->default('CONTRA_ENTREGA');
            $table->string('estado_pago')->default('PENDIENTE');
            $table->text('observaciones_pago')->nullable();
            $table->date('fecha_pago_esperada')->nullable();
            $table->integer('recordatorio_pagos_enviados')->default(0);

            // Índices
            $table->index('estado_pago');
            $table->index(['cliente_id', 'estado_pago']);
        });
    }

    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropIndex(['estado_pago']);
            $table->dropIndex(['cliente_id', 'estado_pago']);
            $table->dropColumn([
                'monto_total',
                'monto_pagado',
                'monto_pendiente',
                'politica_pago',
                'estado_pago',
                'observaciones_pago',
                'fecha_pago_esperada',
                'recordatorio_pagos_enviados'
            ]);
        });
    }
};
```

### Migración 2: Crear tabla pagos

```php
<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('pagos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('venta_id')->constrained('ventas')->cascadeOnDelete();
            $table->decimal('monto', 12, 2);
            $table->string('tipo_pago')->default('EFECTIVO');
            $table->dateTime('fecha_pago')->nullable();
            $table->string('numero_referencia')->nullable();
            $table->text('observaciones')->nullable();
            $table->foreignId('registrado_por')->nullable()->constrained('users');
            $table->timestamps();

            $table->index('venta_id');
            $table->index('fecha_pago');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pagos');
    }
};
```

---

## 🎯 VALIDACIONES EN BACKEND

### 1. Validación: Mínimo 5 Productos

**En ApiProformaController::confirmarProforma()**

```php
public function confirmarProforma(Request $request, Proforma $proforma)
{
    // Validación 1: Mínimo 5 productos
    if ($proforma->detalles()->count() < 5) {
        return response()->json([
            'success' => false,
            'error' => 'Debe solicitar mínimo 5 productos diferentes',
            'productos_solicitados' => $proforma->detalles()->count(),
            'productos_requeridos' => 5
        ], 422);
    }

    // Validación 2: Proforma debe estar APROBADA
    if ($proforma->estado !== Proforma::APROBADA) {
        return response()->json([
            'success' => false,
            'error' => 'La proforma aún no ha sido aprobada'
        ], 422);
    }

    // Crear venta
    DB::beginTransaction();
    try {
        $venta = Venta::create([
            'numero' => $this->generarNumeroVenta(),
            'fecha' => now(),
            'proforma_id' => $proforma->id,
            'cliente_id' => $proforma->cliente_id,
            'subtotal' => $proforma->subtotal,
            'impuesto' => $proforma->impuesto,
            'total' => $proforma->total,
            'monto_total' => $proforma->total,
            'monto_pagado' => 0,
            'monto_pendiente' => $proforma->total,
            'estado_documento_id' => EstadoDocumento::CONFIRMADO,
            'politica_pago' => $request->politica_pago ?? 'CONTRA_ENTREGA',
            'estado_pago' => 'PENDIENTE',
        ]);

        // Copiar detalles
        foreach ($proforma->detalles as $detalle) {
            $venta->detalles()->create([
                'producto_id' => $detalle->producto_id,
                'cantidad' => $detalle->cantidad,
                'precio_unitario' => $detalle->precio_unitario,
                'subtotal' => $detalle->subtotal,
            ]);
        }

        $proforma->update(['estado' => Proforma::CONVERTIDA]);

        DB::commit();

        // WebSocket: Notificar confirmación
        broadcast(new VentaCreada($venta))->toOthers();

        return response()->json([
            'success' => true,
            'message' => 'Pedido confirmado exitosamente',
            'venta' => $venta->load(['detalles', 'cliente']),
            'estado_pago' => $venta->estado_pago,
            'monto_total' => $venta->monto_total,
            'politica_pago' => $venta->politica_pago
        ], 201);

    } catch (\Exception $e) {
        DB::rollBack();
        return response()->json([
            'success' => false,
            'error' => 'Error confirmando pedido: ' . $e->getMessage()
        ], 500);
    }
}
```

### 2. Validación: Puede Programarse Envío

**En EnvioController::programar()**

```php
public function programar(Venta $venta, Request $request)
{
    // Validación de pago
    if ($venta->politica_pago === 'ANTICIPADO_100') {
        // Requiere 100% pagado
        if ($venta->estado_pago !== 'PAGADO') {
            return response()->json([
                'success' => false,
                'error' => 'Esta venta requiere pago 100% anticipado',
                'pagado' => $venta->monto_pagado,
                'total' => $venta->monto_total
            ], 422);
        }
    } elseif ($venta->politica_pago === 'MEDIO_MEDIO') {
        // Requiere 50% pagado
        $minimo_requerido = $venta->monto_total / 2;
        if ($venta->monto_pagado < $minimo_requerido) {
            return response()->json([
                'success' => false,
                'error' => 'Esta venta requiere mínimo 50% pagado',
                'pagado' => $venta->monto_pagado,
                'requerido' => $minimo_requerido
            ], 422);
        }
    }
    // CONTRA_ENTREGA no requiere validación de pago

    // Programar envío
    // ... resto del código
}
```

---

## 🔌 ENDPOINTS API NECESARIOS

### 1. Confirmar Proforma (MÁS CRÍTICO)

```
POST /api/app/proformas/{proforma_id}/confirmar
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
    "politica_pago": "CONTRA_ENTREGA" // o "ANTICIPADO_100", "MEDIO_MEDIO", "DESPUES_ENTREGA"
}

Response (201):
{
    "success": true,
    "message": "Pedido confirmado exitosamente",
    "venta": {
        "id": 42,
        "numero": "V-2025-00152",
        "monto_total": 1500.00,
        "monto_pagado": 0,
        "estado_pago": "PENDIENTE",
        "politica_pago": "CONTRA_ENTREGA"
    }
}
```

### 2. Registrar Pago (CRÍTICO)

```
POST /api/app/ventas/{venta_id}/registrar-pago
Authorization: Bearer {token}
Content-Type: application/json

Body:
{
    "monto": 750.00,
    "tipo_pago": "TRANSFERENCIA",
    "numero_referencia": "TRF-20251025-1234",
    "observaciones": "Pago parcial 50%"
}

Response (201):
{
    "success": true,
    "message": "Pago registrado correctamente",
    "pago": {
        "id": 5,
        "venta_id": 42,
        "monto": 750.00,
        "fecha_pago": "2025-10-25T15:30:00Z"
    },
    "venta_actualizada": {
        "monto_pagado": 750.00,
        "monto_pendiente": 750.00,
        "estado_pago": "PARCIALMENTE_PAGADO"
    }
}
```

### 3. Ver Estado de Pago

```
GET /api/app/ventas/{venta_id}/pago
Authorization: Bearer {token}

Response (200):
{
    "venta_id": 42,
    "monto_total": 1500.00,
    "monto_pagado": 750.00,
    "monto_pendiente": 750.00,
    "estado_pago": "PARCIALMENTE_PAGADO",
    "politica_pago": "MEDIO_MEDIO",
    "pagos_realizados": [
        {
            "id": 5,
            "monto": 750.00,
            "tipo_pago": "TRANSFERENCIA",
            "fecha": "2025-10-25T15:30:00Z"
        }
    ],
    "puede_programar_envio": true  // Validación automática
}
```

### 4. Historial de Pagos de Cliente

```
GET /api/app/cliente/pagos?estado=PENDIENTE
Authorization: Bearer {token}

Response (200):
{
    "deudas": [
        {
            "venta_numero": "V-2025-00152",
            "monto_total": 1500.00,
            "monto_pagado": 750.00,
            "monto_pendiente": 750.00,
            "fecha_vencimiento": "2025-11-25",
            "dias_atraso": 0
        }
    ],
    "total_deuda": 750.00
}
```

---

## 📊 MODELO VENTA (Actualizado)

```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venta extends Model
{
    protected $fillable = [
        // ... campos existentes ...
        'monto_total',
        'monto_pagado',
        'monto_pendiente',
        'politica_pago',      // ANTICIPADO_100, MEDIO_MEDIO, CONTRA_ENTREGA, DESPUES_ENTREGA
        'estado_pago',        // PENDIENTE, PARCIALMENTE_PAGADO, PAGADO, ATRASADO
        'observaciones_pago',
        'fecha_pago_esperada',
        'recordatorio_pagos_enviados',
    ];

    // Relación con pagos
    public function pagos(): HasMany
    {
        return $this->hasMany(Pago::class);
    }

    // Métodos útiles
    public function registrarPago(float $monto, string $tipo_pago = 'EFECTIVO', ?string $referencia = null): Pago
    {
        $pago = $this->pagos()->create([
            'monto' => $monto,
            'tipo_pago' => $tipo_pago,
            'numero_referencia' => $referencia,
            'fecha_pago' => now(),
            'registrado_por' => auth()->id(),
        ]);

        // Actualizar montos
        $this->monto_pagado += $monto;
        $this->monto_pendiente = $this->monto_total - $this->monto_pagado;

        // Determinar estado de pago
        if ($this->monto_pendiente <= 0) {
            $this->estado_pago = 'PAGADO';
        } elseif ($this->monto_pagado > 0) {
            $this->estado_pago = 'PARCIALMENTE_PAGADO';
        } else {
            $this->estado_pago = 'PENDIENTE';
        }

        $this->save();

        // WebSocket: Notificar pago registrado
        broadcast(new PagoRegistrado($this))->toOthers();

        return $pago;
    }

    public function puedeProgramarseEnvio(): bool
    {
        return match($this->politica_pago) {
            'ANTICIPADO_100' => $this->estado_pago === 'PAGADO',
            'MEDIO_MEDIO' => $this->monto_pagado >= ($this->monto_total / 2),
            default => true, // CONTRA_ENTREGA y DESPUES_ENTREGA
        };
    }

    public function estaAtrasada(): bool
    {
        return $this->estado_pago !== 'PAGADO' &&
               $this->fecha_pago_esperada &&
               now()->isAfter($this->fecha_pago_esperada);
    }
}
```

---

## 📱 FLUJO EN APP FLUTTER

### Cliente ve estado de pago en tiempo real

```dart
// En la pantalla de detalle de pedido
Widget build(BuildContext context) {
  return Column(
    children: [
      // 1. Estado del pedido
      Card(
        child: Column(
          children: [
            Text('Pedido: ${venta.numero}'),
            Text('Total: Bs. ${venta.monto_total}'),
          ],
        ),
      ),

      // 2. Estado de pago
      Card(
        color: venta.estado_pago == 'PAGADO' ? Colors.green : Colors.orange,
        child: Column(
          children: [
            Text('Estado de Pago: ${venta.estado_pago}'),
            LinearProgressIndicator(
              value: venta.monto_pagado / venta.monto_total,
            ),
            Text('Pagado: Bs. ${venta.monto_pagado}'),
            Text('Pendiente: Bs. ${venta.monto_pendiente}'),
          ],
        ),
      ),

      // 3. Historial de pagos
      if (venta.pagos.isNotEmpty)
        ListView.builder(
          itemCount: venta.pagos.length,
          itemBuilder: (context, index) {
            final pago = venta.pagos[index];
            return ListTile(
              title: Text('${pago.tipo_pago}: Bs. ${pago.monto}'),
              subtitle: Text(pago.fecha_pago),
            );
          },
        ),
    ],
  );
}
```

---

## 🚨 CASOS ESPECIALES

### Cliente con Atraso en Pago

```php
// En EnvioController
if ($venta->estaAtrasada()) {
    return response()->json([
        'success' => false,
        'error' => 'Esta venta tiene pagos atrasados',
        'fecha_vencimiento' => $venta->fecha_pago_esperada,
        'dias_atraso' => now()->diffInDays($venta->fecha_pago_esperada)
    ], 422);
}
```

### Recordatorio de Pagos

```php
// Artisan Command para ejecutar diariamente
php artisan pagos:enviar-recordatorios

// Notifica por WebSocket y Push cuando hay pagos pendientes
```

---

## ✅ CHECKLIST IMPLEMENTACIÓN

- [ ] Crear migraciones (ventas + pagos)
- [ ] Actualizar modelo Venta
- [ ] Crear modelo Pago
- [ ] Implementar ApiProformaController::confirmarProforma()
- [ ] Implementar VentaController::registrarPago()
- [ ] Implementar VentaController::obtenerEstadoPago()
- [ ] Registrar rutas en routes/api.php
- [ ] Crear seeders con datos de prueba
- [ ] Testear con Postman
- [ ] Documentar en Postman Collection
- [ ] Exportar para equipo Flutter

---

**Próximo paso:** ¿Debo implementar ahora estos endpoints de pago?
