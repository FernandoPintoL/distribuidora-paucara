# Plan: Arquitectura Dinámica de Operaciones en Carga Masiva

## 🎯 Objetivo
Permitir carga masiva de múltiples tipos de operaciones (Ajustes, Compras, Ventas, Mermas) con tipos de motivos dinámicos.

## 📋 Estructura Propuesta

### Antes (Actual - Solo Ajustes)
```
| Producto | Cantidad | Tipo Ajuste | Almacén |
| PRD001   | 10       | DONACION    | Almacén1 |
→ Genera: ENTRADA_AJUSTE o SALIDA_AJUSTE (según signo)
```

### Después (Propuesto - Dinámico)
```
| Producto | Cantidad | Tipo Operación | Tipo Motivo | Almacén |
| PRD001   | 10       | ENTRADA_AJUSTE | DONACION    | Almacén1 |
| PRD002   | 50       | ENTRADA_COMPRA | Compra      | Almacén1 |
| PRD003   | 5        | SALIDA_VENTA   | Venta       | Almacén1 |
| PRD004   | 2        | SALIDA_MERMA   | Merma       | Almacén1 |
```

## 🔄 Tipos de Operaciones Soportadas

| Tipo Operación | Dirección | Tipo Motivo Requerido | Descripción |
|---|---|---|---|
| ENTRADA_AJUSTE | + | TipoAjuste | Entrada por ajuste físico |
| SALIDA_AJUSTE | - | TipoAjuste | Salida por ajuste |
| ENTRADA_COMPRA | + | Proveedor/Ref | Entrada por compra |
| SALIDA_VENTA | - | Cliente/Ref | Salida por venta |
| SALIDA_MERMA | - | TipoMerma | Salida por merma |

## 📊 Cambios Técnicos Requeridos

### 1. Crear Modelo/Config de TipoOperacion
**Archivo:** `app/Models/TipoOperacion.php` o configuración en `config/operaciones.php`

**Opciones de Implementación:**
- **A) Tabla en BD** - Más flexible, permitir CRUD en panel admin
- **B) Config PHP** - Más simple, menos queries
- **C) Constantes** - Más rápido, pero menos flexible

**Recomendación:** Tabla en BD (Opción A) para máxima flexibilidad

### 2. Actualizar Servicio CSV

**Archivo:** `resources/js/infrastructure/services/ajustesCSV.service.ts`

**Cambios:**
```typescript
interface FilaAjusteCSV {
  producto: string;
  cantidad: string | number;          // Cambio: sin signo
  tipo_operacion: string;              // NUEVO
  tipo_motivo: string;                 // Cambio: dinámico según operación
  almacen: string;
  observacion: string;
}

// Nuevos métodos:
private obtenerTiposMotivoPorOperacion(tipoOperacion: string)
private validarSegunTipoOperacion(fila, tipoOperacion)
```

### 3. Nuevo Componente InstruccionesOperaciones

**Archivo:** `resources/js/presentation/components/Inventario/InstruccionesOperaciones.tsx`

**Características:**
- Mostrar tipos de operación disponibles
- Mostrar tipos de motivo según operación seleccionada
- Ejemplos por tipo de operación
- Validaciones específicas

### 4. Actualizar TablaAjustesPreview

**Cambios:**
```typescript
// Nuevas columnas:
| Producto | Cantidad | Tipo Operación (Select) | Tipo Motivo (Select Dinámico) | Almacén |

// El select de "Tipo Motivo" se actualiza dinámicamente según "Tipo Operación"
```

### 5. Actualizar Controlador

**Archivo:** `app/Http/Controllers/InventarioController.php`

**Cambios en `importarAjustesMasivos()`:**
```php
// Para cada fila:
1. Validar tipo_operacion
2. Obtener tipo_motivo según operación
3. Crear MovimientoInventario con tipo_operacion correcto
4. Actualizar stock según dirección de operación:
   - ENTRADA_* → stock += cantidad
   - SALIDA_* → stock -= cantidad
   - TRANSFERENCIA → verificar almacén origen/destino
```

### 6. Plantilla CSV Mejorada

**Nueva estructura:**
```csv
producto,cantidad,tipo_operacion,tipo_motivo,almacen,observacion
PRD001,10,ENTRADA_AJUSTE,AJUSTE_FISICO,Almacén Principal,Recuento físico
PRD002,50,ENTRADA_COMPRA,Proveedor A,Almacén Principal,Compra a Proveedor A
PRD003,5,SALIDA_VENTA,Cliente B,Almacén Principal,Venta a Cliente B
PRD004,2,SALIDA_MERMA,MERMA_VENCIMIENTO,Almacén Principal,Producto vencido
```

## 🗂️ Archivos a Crear/Modificar

### Crear (Nuevos)
- [ ] `app/Models/TipoOperacion.php`
- [ ] `database/migrations/create_tipo_operaciones_table.php`
- [ ] `database/seeders/TipoOperacionSeeder.php`
- [ ] `resources/js/presentation/components/Inventario/InstruccionesOperaciones.tsx`

### Modificar (Existentes)
- [ ] `resources/js/infrastructure/services/ajustesCSV.service.ts`
- [ ] `resources/js/presentation/components/Inventario/TablaAjustesPreview.tsx`
- [ ] `resources/js/presentation/components/Inventario/CargaMasivaAjustes.tsx`
- [ ] `app/Http/Controllers/InventarioController.php` (método importarAjustesMasivos)
- [ ] `database/migrations/...create_cargo_csv_inventarios_table.php` (actualizar si es necesario)

## 📅 Plan de Implementación

### Fase 1: Backend (Modelos y Migraciones)
1. Crear modelo TipoOperacion
2. Crear seeder con tipos de operación
3. Ejecutar migración

### Fase 2: Servicio de Validación
1. Actualizar ajustesCSV.service.ts
2. Agregar métodos de validación dinámica
3. Agregar búsqueda de tipos motivo según operación

### Fase 3: Frontend (UI)
1. Crear InstruccionesOperaciones
2. Actualizar TablaAjustesPreview
3. Actualizar CargaMasivaAjustes
4. Actualizar plantilla CSV

### Fase 4: Controlador
1. Actualizar importarAjustesMasivos
2. Agregar lógica según tipo de operación
3. Pruebas de validación

## 🔐 Validaciones Especiales

### ENTRADA_AJUSTE / SALIDA_AJUSTE
- Requiere: `tipo_ajuste` (AJUSTE_FISICO, DONACION, CORRECCION, etc.)
- Cantidad: siempre positiva
- Stock: se suma (+) o resta (-) según tipo

### ENTRADA_COMPRA
- Requiere: referencia de compra o proveedor
- Cantidad: siempre positiva
- Stock: siempre suma (+)

### SALIDA_VENTA
- Requiere: referencia de venta o cliente
- Cantidad: siempre positiva
- Stock: siempre resta (-)
- Validar: stock disponible >= cantidad

### SALIDA_MERMA
- Requiere: tipo_merma (VENCIMIENTO, DAÑO, ROBO, etc.)
- Cantidad: siempre positiva
- Stock: siempre resta (-)

## 💾 Ejemplo Base de Datos

### Tabla: tipo_operaciones
```sql
CREATE TABLE tipo_operaciones (
    id BIGINT PRIMARY KEY,
    clave VARCHAR(50) UNIQUE,           -- ENTRADA_AJUSTE, SALIDA_VENTA, etc
    label VARCHAR(150),                  -- "Entrada por Ajuste", "Salida por Venta"
    direccion ENUM('entrada', 'salida'), -- entrada o salida
    requiere_motivo VARCHAR(50),        -- tipo_ajuste, tipo_venta, tipo_merma, null
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

### Datos Iniciales
```sql
INSERT INTO tipo_operaciones VALUES
(1, 'ENTRADA_AJUSTE', 'Entrada por Ajuste', 'entrada', 'tipo_ajuste', 'Ajuste de inventario con entrada', true, NOW(), NOW()),
(2, 'SALIDA_AJUSTE', 'Salida por Ajuste', 'salida', 'tipo_ajuste', 'Ajuste de inventario con salida', true, NOW(), NOW()),
(3, 'ENTRADA_COMPRA', 'Entrada por Compra', 'entrada', NULL, 'Compra de productos', true, NOW(), NOW()),
(4, 'SALIDA_VENTA', 'Salida por Venta', 'salida', NULL, 'Venta de productos', true, NOW(), NOW()),
(5, 'SALIDA_MERMA', 'Salida por Merma', 'salida', 'tipo_merma', 'Merma de productos', true, NOW(), NOW());
```

## ✅ Beneficios

- ✅ Sistema completamente dinámico
- ✅ Soporta múltiples tipos de operaciones
- ✅ Validaciones específicas por tipo
- ✅ Fácil de extender a nuevas operaciones
- ✅ Cantidad siempre positiva (más intuitivo)
- ✅ Arquitectura más limpia y profesional

---

**Estado:** Listo para implementar cuando apruebes el plan
