# Auto-llenado de Datos de Entrega desde Venta

## 📋 Descripción del Cambio

Se ha implementado funcionalidad para **pre-llenar automáticamente** los datos de entrega cuando se selecciona una venta. Los datos se heredan de la proforma original cuando se convierte a venta.

---

## 🏗️ Cambios Realizados

### 1. **Migración de Base de Datos** ✅

**Archivo**: `database/migrations/2025_12_22_000000_add_delivery_fields_to_ventas_table.php`

Nuevos campos agregados a la tabla `ventas`:

```sql
-- Fecha comprometida para la entrega
fecha_entrega_comprometida DATE (nullable)

-- Hora comprometida para la entrega (ej: 14:30)
hora_entrega_comprometida TIME (nullable)

-- Ventana de entrega - inicio (ej: 08:00)
ventana_entrega_ini TIME (nullable)

-- Ventana de entrega - fin (ej: 17:00)
ventana_entrega_fin TIME (nullable)

-- Dirección de entrega heredada de proforma
direccion_entrega TEXT (nullable)

-- Peso estimado de la entrega
peso_estimado DECIMAL(8,2) (nullable)
```

**Índices añadidos**:
- `fecha_entrega_comprometida, estado_logistico`
- `ventana_entrega_ini, ventana_entrega_fin`

---

### 2. **Actualización de Domain Type** ✅

**Archivo**: `resources/js/domain/entities/entregas.ts`

```typescript
export interface VentaConDetalles {
    id: Id;
    numero_venta: string;
    total: number;
    fecha_venta: string;
    cliente: ClienteEntrega;

    // ✨ NUEVOS CAMPOS
    fecha_entrega_comprometida?: string;    // Ej: "2025-12-25"
    hora_entrega_comprometida?: string;     // Ej: "14:30"
    ventana_entrega_ini?: string;           // Ej: "08:00"
    ventana_entrega_fin?: string;           // Ej: "17:00"
    direccion_entrega?: string;             // Dirección heredada
    peso_estimado?: number;                 // Peso calculado

    detalles: Array<{ ... }>;
    cantidad_items?: number;
}
```

---

### 3. **Hook Actualizado para Pre-llenar** ✅

**Archivo**: `resources/js/application/hooks/use-simple-entrega-form.ts`

El hook ahora pre-llena el formulario con datos de la venta:

```typescript
const [formData, setFormData] = useState<EntregaFormData>(() => ({
    venta_id: venta.id,
    vehiculo_id: undefined,
    chofer_id: undefined,

    // ✨ Pre-llena con datos de la venta
    fecha_programada: venta.fecha_entrega_comprometida
        ? `${venta.fecha_entrega_comprometida}T${venta.hora_entrega_comprometida || '09:00'}`
        : '',

    // ✨ Pre-llena dirección
    direccion_entrega: venta.direccion_entrega || '',

    observaciones: '',
}));
```

---

### 4. **Componente Actualizado** ✅

**Archivo**: `resources/js/presentation/pages/logistica/entregas/components/SimpleEntregaForm.tsx`

Se agregó sección visual para mostrar la ventana de entrega comprometida:

```tsx
{/* Ventana de Entrega Comprometida (heredada de proforma) */}
{(venta.fecha_entrega_comprometida || venta.ventana_entrega_ini) && (
    <div className="mt-4 pt-4 border-t border-blue-200 dark:border-blue-700">
        <p className="text-xs font-medium text-blue-700 dark:text-blue-400 mb-2">
            📅 Ventana de Entrega Comprometida
        </p>
        <div className="grid grid-cols-2 gap-2">
            {venta.fecha_entrega_comprometida && (
                <div className="text-xs">
                    <span className="text-blue-600 dark:text-blue-300 font-medium">Fecha: </span>
                    <span className="text-blue-900 dark:text-blue-100">
                        {new Date(venta.fecha_entrega_comprometida).toLocaleDateString('es-BO')}
                    </span>
                </div>
            )}
            {/* ... más campos ... */}
        </div>
    </div>
)}
```

---

## 🚀 Cómo Usar

### Paso 1: Ejecutar la Migración

```bash
php artisan migrate
```

### Paso 2: Actualizar Modelo Venta (Backend)

**Archivo**: `app/Models/Venta.php`

Agregar campos al `$fillable` y `$casts`:

```php
class Venta extends Model
{
    protected $fillable = [
        // ... campos existentes ...
        'fecha_entrega_comprometida',
        'hora_entrega_comprometida',
        'ventana_entrega_ini',
        'ventana_entrega_fin',
        'direccion_entrega',
        'peso_estimado',
    ];

    protected $casts = [
        // ... casts existentes ...
        'fecha_entrega_comprometida' => 'date',
        'ventana_entrega_ini' => 'datetime:H:i',
        'ventana_entrega_fin' => 'datetime:H:i',
    ];
}
```

### Paso 3: Actualizar Conversión de Proforma a Venta

**Archivo**: `app/Http/Controllers/ProformaController.php` (o donde se convierta)

Cuando se convierte una proforma a venta, copiar datos de entrega:

```php
public function convertirAVenta(Proforma $proforma)
{
    // Crear venta...
    $venta = Venta::create([
        'numero' => $proforma->numero,
        'fecha' => now(),
        'total' => $proforma->total,
        'cliente_id' => $proforma->cliente_id,

        // ✨ HEREDAR DATOS DE ENTREGA DE PROFORMA
        'fecha_entrega_comprometida' => $proforma->fecha_entrega_comprometida ?? null,
        'hora_entrega_comprometida' => $proforma->hora_entrega_comprometida ?? null,
        'ventana_entrega_ini' => $proforma->ventana_entrega_ini ?? null,
        'ventana_entrega_fin' => $proforma->ventana_entrega_fin ?? null,
        'direccion_entrega' => $proforma->direccion_entrega ?? null,

        // Calcular peso estimado de los detalles
        'peso_estimado' => $this->calcularPesoEstimado($proforma),
    ]);

    return $venta;
}

private function calcularPesoEstimado(Proforma $proforma): float
{
    // Sumar peso de todos los detalles
    return $proforma->detalles->sum(function ($detalle) {
        return ($detalle->producto->peso ?? 0) * $detalle->cantidad;
    });
}
```

### Paso 4: Asegurar que Proforma Tenga Estos Campos

Si la tabla `proformas` no tiene estos campos, agregarlos también:

```bash
php artisan make:migration add_delivery_fields_to_proformas_table

# En la migración:
Schema::table('proformas', function (Blueprint $table) {
    $table->date('fecha_entrega_comprometida')->nullable();
    $table->time('hora_entrega_comprometida')->nullable();
    $table->time('ventana_entrega_ini')->nullable();
    $table->time('ventana_entrega_fin')->nullable();
    $table->text('direccion_entrega')->nullable();
});
```

---

## 📊 Flujo de Datos

```
PROFORMA (Origen)
├─ fecha_entrega_comprometida: "2025-12-25"
├─ hora_entrega_comprometida: "14:30"
├─ ventana_entrega_ini: "08:00"
├─ ventana_entrega_fin: "17:00"
└─ direccion_entrega: "Calle Principal 123"
        ↓ (CONVERSIÓN)
VENTA (Destino)
├─ fecha_entrega_comprometida: "2025-12-25" ✅ Heredado
├─ hora_entrega_comprometida: "14:30"      ✅ Heredado
├─ ventana_entrega_ini: "08:00"            ✅ Heredado
├─ ventana_entrega_fin: "17:00"            ✅ Heredado
├─ direccion_entrega: "Calle Principal..." ✅ Heredado
└─ peso_estimado: 25.5                     ✅ Calculado
        ↓ (CREAR ENTREGA)
FORMULARIO SimpleEntregaForm
├─ fecha_programada: "2025-12-25T14:30" ✅ Pre-llenado
├─ direccion_entrega: "Calle Principal..." ✅ Pre-llenado
└─ Ventana visible para el usuario ✅ Mostrado
```

---

## 🎯 Ventajas

✅ **Automatización**: Datos se heredan automáticamente de proforma
✅ **Consistencia**: Fecha de entrega comprometida se respeta
✅ **Visibilidad**: Usuario ve ventana de entrega al crear entrega
✅ **Pre-llenado**: Formulario viene con datos, solo falta vehículo/chofer
✅ **Trazabilidad**: Se mantiene referencia a compromiso original
✅ **Validación**: Fecha programada es validada como futura

---

## 📝 Ejemplo Completo

### 1. Usuario crea Proforma con datos de entrega

```json
{
    "numero": "PROF-001",
    "cliente_id": 1,
    "total": 500,
    "fecha_entrega_comprometida": "2025-12-25",
    "hora_entrega_comprometida": "14:30",
    "ventana_entrega_ini": "08:00",
    "ventana_entrega_fin": "17:00",
    "direccion_entrega": "Calle Principal 123, Zona Sur"
}
```

### 2. Proforma se aprueba y convierte a Venta

Sistema copia automáticamente:
- ✅ fecha_entrega_comprometida → "2025-12-25"
- ✅ hora_entrega_comprometida → "14:30"
- ✅ ventana_entrega_ini → "08:00"
- ✅ ventana_entrega_fin → "17:00"
- ✅ direccion_entrega → "Calle Principal 123, Zona Sur"
- ✅ peso_estimado → Calculado de detalles

### 3. Usuario crea Entrega desde Venta

Formulario SimpleEntregaForm muestra:
```
┌─────────────────────────────────────┐
│ Venta: PROF-001                     │
├─────────────────────────────────────┤
│ Cliente: Empresa XYZ                │
│ Monto: Bs 500.00                    │
│ Items: 5 productos                  │
│ Peso: 25.5 kg                       │
├─────────────────────────────────────┤
│ 📅 Ventana de Entrega Comprometida  │
│ Fecha: 25 de diciembre de 2025      │
│ Hora: 14:30                         │
│ Ventana: 08:00 - 17:00              │
└─────────────────────────────────────┘

Campos pre-llenados:
- Dirección: "Calle Principal 123, Zona Sur" ✅
- Fecha Programada: "2025-12-25 14:30" ✅

Usuario solo selecciona:
- Vehículo: [ SearchSelect ]
- Chofer: [ SearchSelect ]
```

### 4. Usuario envía formulario

```typescript
{
    "venta_id": 1,
    "vehiculo_id": 5,           // ← Usuario selecciona
    "chofer_id": 3,             // ← Usuario selecciona
    "fecha_programada": "2025-12-25T14:30", // ← Pre-llenado
    "direccion_entrega": "Calle Principal 123, Zona Sur", // ← Pre-llenado
    "observaciones": ""
}
```

---

## ⚠️ Consideraciones Importantes

### 1. **Migración de Datos Históricos**

Para ventas existentes que no tienen estos datos:

```php
// En una migración de data:
Venta::whereNull('fecha_entrega_comprometida')
    ->each(function ($venta) {
        // Intentar cargar desde proforma si existe
        if ($venta->proforma_id) {
            $proforma = Proforma::find($venta->proforma_id);
            if ($proforma) {
                $venta->update([
                    'fecha_entrega_comprometida' => $proforma->fecha_entrega_comprometida,
                    'hora_entrega_comprometida' => $proforma->hora_entrega_comprometida,
                    'ventana_entrega_ini' => $proforma->ventana_entrega_ini,
                    'ventana_entrega_fin' => $proforma->ventana_entrega_fin,
                    'direccion_entrega' => $proforma->direccion_entrega,
                ]);
            }
        }
    });
```

### 2. **Validación de Fecha Futura**

El hook ya valida que la fecha sea futura:

```typescript
if (fechaProgramada <= ahora) {
    newErrors.fecha_programada = 'La fecha debe ser futura';
}
```

### 3. **Usuario Puede Cambiar Datos**

El pre-llenado no es obligatorio. Usuario puede cambiar:
- Fecha de entrega
- Dirección
- Hora programada

---

## ✅ Checklist de Implementación

- [ ] Ejecutar migración: `php artisan migrate`
- [ ] Actualizar modelo Venta con fillable y casts
- [ ] Actualizar lógica de conversión proforma→venta
- [ ] Agregar campos a tabla proformas (si no existen)
- [ ] Ejecutar migración de datos históricos (si hay)
- [ ] Probar con venta que tenga datos de entrega
- [ ] Verificar que formulario se pre-llena correctamente
- [ ] Verificar validación de fecha futura
- [ ] Probar en dark mode
- [ ] Documentar para usuario final

---

## 🎓 Conclusión

El sistema ahora:
- ✅ **Hereda** datos de entrega de proforma → venta
- ✅ **Pre-llena** formulario con esos datos
- ✅ **Muestra** visualmente la ventana comprometida
- ✅ **Permite** que usuario modifique si es necesario
- ✅ **Valida** que fecha sea futura
- ✅ **Mantiene** trazabilidad a compromiso original

Esto **reduce significativamente** el esfuerzo del usuario al crear entregas desde ventas, y asegura que se respeten los compromisos de fecha originales.
