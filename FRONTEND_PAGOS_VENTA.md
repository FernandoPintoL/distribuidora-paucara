# Frontend: Formulario de Múltiples Pagos

## 📍 Ubicación

Archivo: `resources/js/presentation/components/FormularioPagosVenta.tsx`

Se integra en: `/resources/js/presentation/pages/ventas/create.tsx` (sección de Resumen)

## 🎯 Interfaz

```
┌─────────────────────────────────────────────────────────┐
│                  DESGLOSE DE PAGOS                      │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Tipo de Pago: [Seleccionar ▼]    Monto: [0.00]        │
│                                                          │
│  [🔵 Agregar]                                            │
│                                                          │
│  ✓ Efectivo                      500.00  [🗑️]          │
│  ✓ Transferencia                 300.00  [🗑️]          │
│                                                          │
│  ─────────────────────────────────────────────          │
│  Total a pagar:                  800.00                 │
│  Total pagado:                   800.00 ✅              │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## 📊 Características

### 1. **Agregar Pagos**
- Selector de Tipo de Pago (dropdown con todos los tipos configurados)
- Campo de Monto (input numérico)
- Botón "Agregar" para registrar el pago

### 2. **Validaciones en Tiempo Real**
- ✓ Tipo de pago requerido
- ✓ Monto debe ser > 0
- ✓ Suma de pagos ≤ Total de venta
- ✓ Permite hasta 10% de excedente (para cambio)
- ✓ Muestra mensaje de error si algo falla

### 3. **Tabla de Pagos**
- Fila por cada pago agregado
- Columnas: Tipo de Pago | Monto | Botón Eliminar
- Permite scroll si hay muchos pagos
- Botón X para remover pagos

### 4. **Resumen Automático**
```
Total a pagar:    800.00
Total pagado:     800.00 (color verde si es exacto)
Pendiente:        0.00   (color rojo si hay pendiente)
Cambio:           0.00   (color verde si hay cambio)
```

## 🔧 Uso en create.tsx

```typescript
// 1. Importar componente
import FormularioPagosVenta from '@/presentation/components/FormularioPagosVenta';

// 2. Estado para guardar pagos
const [pagos, setPagos] = useState<Pago[]>([]);

// 3. En el formulario (dentro del resumen):
<FormularioPagosVenta
    tiposPago={tiposPagoSeguro}
    totalVenta={data.total}
    pagosRegistrados={pagos}
    onPagosChange={setPagos}
    disabled={isSubmitting}
/>

// 4. Al enviar (handleConfirmSubmit):
if (pagos.length > 0) {
    submitData.pagos = pagos.map(p => ({
        tipo_pago_id: p.tipo_pago_id,
        monto: p.monto
    }));
}
```

## 📋 Props del Componente

```typescript
interface FormularioPagosVentaProps {
    // Array de tipos de pago disponibles
    tiposPago: Array<{ id: number; nombre: string }>;
    
    // Monto total de la venta (para validar suma)
    totalVenta: number;
    
    // Array de pagos agregados
    pagosRegistrados: Pago[];
    
    // Callback para actualizar pagos cuando el usuario agrega/elimina
    onPagosChange: (pagos: Pago[]) => void;
    
    // Deshabilitar inputs mientras se envía (opcional)
    disabled?: boolean;
}
```

## 🎨 Estilos

- **Tema**: Soporta Light/Dark mode con clases `dark:`
- **Colores**:
  - Botones: Azul (agregar), Rojo (eliminar)
  - Texto: Verde para saldos positivos, Rojo para negativos
  - Fondo: Gris claro en light, Zinc en dark

## 📤 Datos Enviados al Backend

Cuando el usuario hace click en "Crear venta":

```json
{
  "numero": "VEN20260421000001",
  "cliente_id": 5,
  "total": 800,
  "detalles": [...],
  "pagos": [
    { "tipo_pago_id": 1, "monto": 500 },
    { "tipo_pago_id": 2, "monto": 300 }
  ]
}
```

El backend procesa:
1. Crea la venta normalmente
2. Llama a `PagoVentaService::registrarPagos($venta, $pagos)`
3. Registra cada pago en `detalles_pago_venta`
4. Actualiza `venta.monto_pagado = 800`

## ⚙️ Flujo Completo

```
Usuario en /ventas/create
    │
    ├─ Agrega productos
    │
    ├─ Llena datos de cliente, tipo documento, etc
    │
    ├─ En sección de RESUMEN:
    │   ├─ Selecciona "Efectivo" → Ingresa 500 → Agrega ✓
    │   ├─ Selecciona "Transferencia" → Ingresa 300 → Agrega ✓
    │   └─ Muestra tabla: Efectivo (500), Transferencia (300)
    │   └─ Resumen: Total 800, Pagado 800, Pendiente 0
    │
    ├─ Hace clic en "Crear venta"
    │
    ├─ Modal de vista previa muestra resumen
    │
    ├─ Confirma en modal
    │
    ├─ Frontend envía POST /ventas con:
    │   {
    │     detalles: [...],
    │     pagos: [{tipo_pago_id:1, monto:500}, {tipo_pago_id:2, monto:300}]
    │   }
    │
    ├─ Backend procesa venta + pagos
    │
    ├─ Crea registros en detalles_pago_venta
    │
    └─ Responde con venta creada exitosamente
       └─ Frontend muestra modal de salida (Imprimir/Excel/PDF)
```

## ✅ Estado del Componente

- ✅ Componente creado
- ✅ Validaciones implementadas
- ✅ Integrado en create.tsx
- ✅ Pagos enviados al backend
- ⏳ Backend: Procesar pagos en VentaController (PENDIENTE)

## 🎓 Ejemplo Completo de Uso

### Escenario: Venta de $1000

1. **Productos**: Se agrega mercancía que suma $1000
2. **Datos de venta**: Cliente, fecha, tipo documento, etc
3. **Desglose de pagos**:
   - Efectivo: $600
   - Transferencia: $400
4. **Resumen**:
   - Total: $1000
   - Pagado: $1000 ✅
   - Pendiente: $0
5. **Guardar**: Se crea venta y se registran 2 pagos separados

### Más tarde - Reporte de Caja (GET /api/ventas/pagos/reporte-caja)

```json
{
  "por_tipo_pago": {
    "EFECTIVO": { "total": 2500, "cantidad_transacciones": 5 },
    "TRANSFERENCIA": { "total": 1500, "cantidad_transacciones": 3 }
  }
}
```

---

**Documentación generada**: 21/04/2026  
**Componente**: FormularioPagosVenta.tsx  
**Estado**: ✅ Listo para usar
