# FASE 1: REFACTORIZACIÓN DE BASE DE DATOS
**Fecha de ejecución:** 2025-12-27

## Resumen de cambios

### 1. NUEVA TABLA: `entrega_venta` (Pivot)
```sql
CREATE TABLE entrega_venta (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    entrega_id BIGINT NOT NULL (FK → entregas),
    venta_id BIGINT NOT NULL (FK → ventas),
    orden INT DEFAULT 1,
    confirmado_por BIGINT NULL (FK → users),
    fecha_confirmacion TIMESTAMP NULL,
    notas TEXT NULL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP,

    UNIQUE(entrega_id, venta_id),
    INDEX(entrega_id, orden),
    INDEX(venta_id, entrega_id)
);
```

**Propósito:** Vinculación clara de 1 Entrega → N Ventas

---

### 2. NUEVOS CAMPOS EN `entregas`
```sql
ALTER TABLE entregas ADD (
    zona_id BIGINT NULL,
    numero_entrega VARCHAR(50) UNIQUE NULL
);

CREATE INDEX idx_zona_id ON entregas(zona_id);
CREATE INDEX idx_numero_entrega ON entregas(numero_entrega);
```

**Propósito:**
- `zona_id`: Agrupar entregas por localidad/zona geográfica
- `numero_entrega`: Identificador legible (ENT-20251227-0001)

---

### 3. COLUMNAS ELIMINADAS DE `entregas`
```sql
ALTER TABLE entregas DROP COLUMN venta_id;
-- (La FK que vinculaba 1 Entrega → 1 Venta)
```

**Razón:** Ahora usamos `entrega_venta` pivot para N:N

---

### 4. `reporte_cargas.entrega_id` - Sin FK
```sql
-- Ya no es FK, solo columna opcional para compatibilidad
-- El pivot correcto es: reporte_carga_entregas
ALTER TABLE reporte_cargas DROP FOREIGN KEY reporte_cargas_entrega_id_foreign;

-- Mantener la columna nullable sin constraint
ALTER TABLE reporte_cargas
MODIFY COLUMN entrega_id BIGINT UNSIGNED NULL
COMMENT 'DEPRECATED - usar pivot reporte_carga_entregas';
```

**Razón:** La fuente de verdad es `reporte_carga_entregas` (N:N)

---

## Estructura Final

### Antes (Confuso)
```
Venta #1001
    ↓
Entrega #1 (venta_id=1001)
    ↓
ReporteCarga #100 (entrega_id=1) ← También vinculada via pivot

[Problema: Dos caminos para la misma relación]
```

### Después (Claro)
```
Entrega #100 (asignada a Vehículo ABC-123, Chofer Juan)
    ↓ (via entrega_venta pivot)
    ├─ Venta #1001 (orden=1, confirmada_por=user_5)
    ├─ Venta #1002 (orden=2, confirmada_por=user_5)
    └─ Venta #1003 (orden=3, pendiente confirmación)

ReporteCarga #REP20251227001
    ↓ (via reporte_carga_entregas pivot - FUENTE DE VERDAD)
    └─ Entrega #100

[Una sola fuente de verdad para cada relación]
```

---

## Datos Migrados
Cualquier registro existente donde `entregas.venta_id` estaba seteado se migró automáticamente a la tabla `entrega_venta` con:
- `orden = 1` (primer/único)
- `confirmado_por = NULL`
- `fecha_confirmacion = NULL`

**Verificar migrations:**
```bash
php artisan migrate
php artisan migrate:status

# Debe mostrar estas 3 nuevas migraciones como ✓:
# 2025_12_27_create_entrega_venta_pivot_table
# 2025_12_27_add_zona_id_and_numero_entrega_to_entregas_table
# 2025_12_27_refactor_entregas_remove_redundant_fks
```

---

## Próximos pasos (FASE 2-5)
1. **Modelos Eloquent** - Actualizar relaciones en Entrega.php
2. **Servicios** - CrearEntregaPorLocalidadService
3. **Controllers** - API endpoints para confirmar carga
4. **Frontend** - Componentes para almacenero

---

## Rollback (Si es necesario)
```bash
php artisan migrate:rollback

# ADVERTENCIA: Los datos migrados al pivot no se recuperan automáticamente
# Solo se restauran para entregas que tenían venta_id (toma la primera)
```

---

## Notas importantes

✅ **Compatibilidad:**
- `entregas.proforma_id` se mantiene para datos legacy
- `reporte_cargas.entrega_id` se mantiene nullable
- Las transacciones mantienen integridad

⚠️ **Validaciones por agregar (en Modelos):**
- Evitar agregar la misma venta a múltiples entregas simultáneamente
- Validar que zona_id es consistente
- Sincronizar ReporteCarga cuando cambien las ventas de una Entrega

🔒 **Restricciones creadas:**
- `entrega_venta(entrega_id, venta_id)` es UNIQUE
- `venta_id` en pivot usa `onDelete('restrict')` → No se puede eliminar venta si está en entrega

---

## Testing
Después de migrar, verificar:
```sql
-- 1. Tabla existe y tiene estructura correcta
SELECT * FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_NAME = 'entrega_venta';

-- 2. Datos migraron correctamente
SELECT e.id, e.numero_entrega, COUNT(ev.venta_id) as ventas_totales
FROM entregas e
LEFT JOIN entrega_venta ev ON e.id = ev.entrega_id
GROUP BY e.id
HAVING ventas_totales > 0;

-- 3. No hay conflictos en reporte_cargas
SELECT rc.id, rc.numero_reporte, rc.entrega_id, COUNT(rce.entrega_id) as entregas_via_pivot
FROM reporte_cargas rc
LEFT JOIN reporte_carga_entregas rce ON rc.id = rce.reporte_carga_id
GROUP BY rc.id;
```

---

## ✅ EJECUCIÓN COMPLETADA

**Ejecutado por:** Claude Code
**Fecha:** 2025-12-27
**Status:** ✅ COMPLETADO EXITOSAMENTE

### Resultados de la ejecución:
```
✓ 2025_12_27_add_zona_id_and_numero_entrega_to_entregas_table ......... DONE (11.93ms)
✓ 2025_12_27_create_entrega_venta_pivot_table ...................... DONE (12.71ms)
✓ 2025_12_27_refactor_entregas_remove_redundant_fks ................ DONE (15.17ms)

Tiempo total: ~40ms

Datos migridos:
├─ entregas: 29 registros
├─ entrega_venta: 29 registros (migrrados automáticamente)
├─ reporte_cargas: 4 registros
└─ reporte_carga_entregas: 0 registros (se llenará en Fase 4+)
```

### Verificaciones post-ejecución:
- ✅ Tabla `entrega_venta` creada correctamente
- ✅ Tabla `reporte_carga_entregas` existía y funciona bien
- ✅ Columna `venta_id` eliminada de `entregas`
- ✅ Columnas `zona_id` y `numero_entrega` agregadas a `entregas`
- ✅ Foreign key `reporte_cargas.entrega_id` sin constraint (opcional)
- ✅ 29 entregas migradas a la tabla pivot `entrega_venta`
- ✅ Integridad referencial mantenida
