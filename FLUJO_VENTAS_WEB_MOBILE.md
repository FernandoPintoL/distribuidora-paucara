# Flujo de Trabajo: Ventas Web y Mobile

Basado en el modelo de ventas de Distribuidora Paucara, aquí está el flujo completo de trabajo para ventas tanto en plataforma web como mobile.

## 📋 **Modelo de Datos - Campos Clave**

```php
Schema::create('ventas', function (Blueprint $table) {
    $table->id();
    $table->string('numero')->unique();           // Generado automáticamente: VEN202509150001
    $table->date('fecha');
    $table->decimal('subtotal', 15, 2);
    $table->decimal('descuento', 15, 2)->default(0);
    $table->decimal('impuesto', 15, 2)->default(0);
    $table->decimal('total', 15, 2);
    $table->text('observaciones')->nullable();

    // Relaciones principales
    $table->foreignId('cliente_id')->constrained('clientes');
    $table->foreignId('usuario_id')->constrained('users');
    $table->foreignId('estado_documento_id')->constrained('estados_documento');
    $table->foreignId('moneda_id')->constrained('monedas');  // BOB por defecto
    $table->foreignId('tipo_pago_id')->nullable()->constrained('tipos_pago');
    $table->foreignId('proforma_id')->nullable()->constrained('proformas');

    // Campos para logística y multi-canal
    $table->boolean('requiere_envio')->default(false);
    $table->enum('canal_origen', ['APP_EXTERNA', 'WEB', 'PRESENCIAL'])->default('WEB');
    $table->enum('estado_logistico', ['PENDIENTE_ENVIO', 'PREPARANDO', 'ENVIADO', 'ENTREGADO'])->nullable();

    $table->timestamps();
});
```

## 🚀 **Flujo de Trabajo Completo**

### **FASE 1: Creación de Proforma (Opcional)**

#### **Desde App Mobile (APP_EXTERNA)**

```
Cliente → App Mobile → API Proforma
       ↓
   Crear Proforma
       ↓
  Estado: PENDIENTE
       ↓
  Reservar Stock (24h)
```

#### **Desde Web Admin**

```
Admin → Web → Proformas → Crear
       ↓
   Crear Proforma
       ↓
  Estado: PENDIENTE
       ↓
  Reservar Stock (48h para app externa)
```

### **FASE 2: Aprobación de Proforma**

#### **Flujo de Aprobación**

```
Proforma PENDIENTE
       ↓
¿Requiere aprobación?
       ↓
   SÍ → Admin aprueba/rechaza
       ↓
   NO → Auto-aprobada
       ↓
Estado: APROBADA/RECHAZADA
```

### **FASE 3: Conversión a Venta**

#### **Desde Proforma Aprobada**

```
Proforma APROBADA
       ↓
¿Puede convertirse?
       ↓
   SÍ → Convertir a Venta
       ↓
  Consumir Reservas
       ↓
Estado Proforma: CONVERTIDA
```

#### **Venta Directa (Sin Proforma)**

```
Cliente/Productos → Crear Venta
       ↓
  Generar Número: VEN202509150001
       ↓
  Moneda: BOB (automático)
       ↓
  Validar Stock Disponible
```

### **FASE 4: Procesamiento de Venta**

#### **Lógica de Stock**

```
¿Requiere Envío?
       ↓
   SÍ → Solo reservar stock
       ↓
   NO → Procesar salida inmediata
       ↓
Generar Movimientos de Inventario
```

#### **Estados Logísticos**

```
PENDIENTE_ENVIO → PREPARANDO → ENVIADO → ENTREGADO
```

### **FASE 5: Pago y Finalización**

#### **Tipos de Pago**

```
- Efectivo
- Transferencia
- Cheque
- Tarjeta
- Crédito (cuenta por cobrar)
```

## 📱 **Flujos Específicos por Canal**

### **🌐 Canal WEB**

```
Usuario Admin → Login → Dashboard
       ↓
   Módulo Ventas
       ↓
Crear Venta / Gestionar Proformas
       ↓
Formulario simplificado:
- Cliente (búsqueda)
- Productos (búsqueda + scanner)
- Fecha (automática)
- Número (oculto - auto)
- Moneda (oculto - BOB)
       ↓
Validar Stock → Procesar → Confirmar
```

### **📱 Canal APP_EXTERNA**

```
Cliente → App Mobile → Catálogo
       ↓
   Seleccionar Productos
       ↓
   Crear Proforma
       ↓
Estado: PENDIENTE (espera aprobación)
       ↓
Notificación push al cliente
       ↓
Admin aprueba → Convertir a Venta
```

### **🏪 Canal PRESENCIAL**

```
Cliente → Punto de Venta
       ↓
   Vendedor registra
       ↓
Crear Venta Directa
       ↓
Pago inmediato → Entrega
```

## 🔄 **Estados y Transiciones**

### **Estados de Proforma**

```
PENDIENTE → APROBADA → CONVERTIDA
    ↓         ↓
RECHAZADA   (expirada)
```

### **Estados de Venta**

```
CONFIRMADO → ¿Requiere envío?
       ↓
   SÍ → PENDIENTE_ENVIO → PREPARANDO → ENVIADO → ENTREGADO
       ↓
   NO → COMPLETADA
```

### **Estados de Envío**

```
PROGRAMADO → EN_PREPARACION → EN_RUTA → ENTREGADO
    ↓
CANCELADO
```

## 🎯 **Puntos Críticos del Flujo**

### **1. Gestión de Stock**

- **Proformas**: Reservan stock por tiempo limitado
- **Ventas**: Consumen stock inmediatamente (si no requieren envío)
- **Validación**: Siempre antes de confirmar venta

### **2. Conversión Proforma → Venta**

```php
// Lógica actual (en desarrollo)
public function convertirAVenta(Proforma $proforma)
{
    if (!$proforma->puedeConvertirseAVenta()) {
        return false;
    }

    // Crear venta desde proforma
    $venta = Venta::create([
        'numero' => Venta::generarNumero(),
        'cliente_id' => $proforma->cliente_id,
        'moneda_id' => $proforma->moneda_id,
        // ... otros campos
        'proforma_id' => $proforma->id,
        'canal_origen' => $proforma->canal_origen,
    ]);

    // Convertir detalles
    foreach ($proforma->detalles as $detalle) {
        $venta->detalles()->create($detalle->toArray());
    }

    // Marcar proforma como convertida
    $proforma->marcarComoConvertida();

    return $venta;
}
```

### **3. Automatización Implementada**

- ✅ **Número**: `VEN202509150001` (auto-generado)
- ✅ **Moneda**: BOB por defecto (ID 1)
- ✅ **Campos ocultos**: Número y moneda no visibles en formulario
- ✅ **Validación**: Ambos campos opcionales en request

## 📊 **Dashboard y Reportes**

### **Métricas por Canal**

- Ventas por canal (WEB, APP_EXTERNA, PRESENCIAL)
- Tasa de conversión de proformas
- Estados logísticos
- Stock disponible vs reservado

### **Alertas del Sistema**

- Proformas próximas a vencer
- Stock bajo en productos
- Ventas pendientes de envío
- Pagos pendientes

## 🔧 **APIs y Endpoints**

### **Endpoints Principales**

```
POST   /api/ventas              # Crear venta
GET    /api/ventas              # Listar ventas
POST   /api/proformas           # Crear proforma
PUT    /api/proformas/{id}/aprobar    # Aprobar proforma
POST   /api/proformas/{id}/convertir-venta  # Convertir a venta
GET    /api/stock/verificar     # Verificar stock
```

Este flujo permite una experiencia fluida tanto para usuarios web como mobile, manteniendo consistencia en el proceso de ventas mientras se adapta a diferentes canales de origen.
