# 🔐 AUDIT DE SEGURIDAD: Roles y Permisos en Sidebar

## Resumen Ejecutivo

✅ **Estado General**: El control de acceso está **CORRECTAMENTE IMPLEMENTADO**

El sistema protege adecuadamente a roles restrictivos (Chofer, Cajero) de ver y acceder a módulos que no deberían usar. Sin embargo, hay **OPORTUNIDADES DE MEJORA** para hacerlo más granular y seguro.

---

## 1. CHOFER - Análisis Detallado

### Acceso Actual
✅ **CORRECTO**

| Módulo | Visible | Permisos | Acceso |
|--------|---------|----------|--------|
| **Logística** | ✅ SÍ | envios.index, envios.show, logistica.* | ✅ PERMITIDO |
| **Proformas** | ❌ NO | proformas.* | ❌ BLOQUEADO |
| **Ventas** | ❌ NO | ventas.* | ❌ BLOQUEADO |
| **Inventario** | ❌ NO | inventario.* | ❌ BLOQUEADO |
| **Cajas** | ❌ NO | cajas.* | ❌ BLOQUEADO |

### Análisis Crítico

**¿Qué VE?** Solo el módulo Logística
- ✓ Dashboard de logística
- ✓ Envíos
- ✓ Seguimiento de rutas

**¿Qué NO VE?** Todo lo demás
- ✓ Proformas (correcto - no es su tarea)
- ✓ Ventas (correcto - no vende)
- ✓ Inventario (correcto - no gestiona stock)
- ✓ Cajas (correcto - no maneja dinero)

**Problemas Identificados**: ⚠️ MINOR
- El chofer tiene permiso `empleados.show` - ¿Por qué? Debería solo ver su propio perfil
- El chofer NO puede ver "Entregas Asignadas" o "Entregas en Tránsito" en el menú

### Recomendaciones

```
🔧 MEJORA 1: Remover permiso "empleados.show"
   Razón: Un chofer no necesita ver datos de otros empleados
   Acción: DELETE FROM role_has_permissions WHERE role_id = chofer AND permission_id = empleados.show

🔧 MEJORA 2: Agregar módulos logísticos faltantes
   Módulos sugeridos:
   - "Entregas Asignadas" (/logistica/entregas-asignadas)
   - "Entregas en Tránsito" (/logistica/entregas-en-transito)
   - "Mi Perfil" (acceso a sus datos personales)
```

---

## 2. CAJERO - Análisis Detallado

### Acceso Actual
✅ **CORRECTO**

| Módulo | Visible | Permisos | Acceso |
|--------|---------|----------|--------|
| **Ventas** | ✅ SÍ | ventas.index, ventas.create, ventas.* | ✅ PERMITIDO |
| **Cajas** | ✅ SÍ | cajas.* (5 permisos) | ✅ PERMITIDO |
| **Clientes** | ✅ SÍ | clientes.manage | ✅ PERMITIDO |
| **Proformas** | ❌ NO | proformas.* | ❌ BLOQUEADO |
| **Inventario** | ❌ NO | inventario.* | ❌ BLOQUEADO |
| **Compras** | ❌ NO | compras.* | ❌ BLOQUEADO |

### Análisis Crítico

**¿Qué VE?**
- ✅ Módulo Ventas (correcto - es POS/vendedor)
- ✅ Módulo Cajas (correcto - gestiona dinero)
- ✅ Módulo Clientes (correcto - interactúa con clientes)

**¿Qué NO VE?** (Correcto que NO vea)
- ✅ Proformas (correcto - no las crea)
- ✅ Inventario (correcto - no gestiona stock)
- ✅ Compras (correcto - no compra)
- ✅ Reportes (correcto - no reportea)

**Problemas Identificados**: 🟢 NINGUNO CRÍTICOS

El cajero está bien configurado. ¡Buen trabajo!

### Recomendaciones

```
✅ ESTADO: Correcto
   El cajero tiene exactamente lo que necesita:
   - Crear/gestionar ventas
   - Gestionar cajas y dinero
   - Ver/crear clientes

⚠️ SUGERENCIA: Agregar submódulo
   - "Devoluciones" (/ventas/devoluciones) - sí puede procesar devoluciones
   - "Pagos Pendientes" (/cajas/pagos-pendientes) - para seguimiento

```

---

## 3. PREVENTISTA - Análisis Detallado

### Acceso Actual
⚠️ **PARCIALMENTE CORRECTO** (Tiene demasiado acceso)

| Módulo | Visible | Permisos | Estado |
|--------|---------|----------|--------|
| **Proformas** | ✅ SÍ | 9 permisos completos | ✅ CORRECTO |
| **Clientes** | ✅ SÍ | 18 permisos | ⚠️ EXCESIVO |
| **Ventas** | ✅ SÍ | 7 permisos | ⚠️ EXCESIVO |
| **Cajas** | ✅ SÍ | 9 permisos | ⚠️ EXCESIVO |
| **Inventario** | ✅ SÍ | 3 permisos | ⚠️ BORDERLINE |
| **Productos** | ✅ SÍ | 1 permiso | ✅ OK |
| **Logística** | ✅ SÍ | 2 permisos | ⚠️ BORDERLINE |
| **Empleados** | ✅ SÍ | 2 permisos | ⚠️ EXCESIVO |
| **Localidades** | ✅ SÍ | 1 permiso | ✅ OK |

### Análisis Crítico

**¿Qué DEBERÍA ver?**
- ✅ Proformas (su función principal)
- ✅ Clientes (crea proformas para clientes)
- ✅ Productos (para armar proformas)
- ⚠️ Inventario (VER stock, NO modificar)

**¿Qué ACTUALMENTE VE?** (Demasiado)
- ❌ Ventas completas (por qué puede ver ventas de otros?)
- ❌ Cajas (por qué puede ver/gestionar dinero?)
- ❌ Empleados (por qué puede ver otros empleados?)
- ❌ Logística (por qué?)

**Problema Principal**: 🔴 PREVENTISTA TIENE ACCESO A CAJAS

```
Un preventista NO DEBERÍA:
- Ver saldos de caja
- Registrar movimientos de caja
- Gestionar dinero
- Ver ventas de otros preventistas
- Ver/gestionar otros empleados
```

### Problemas Identificados

| Problema | Severidad | Impacto |
|----------|-----------|--------|
| Acceso a Cajas | 🔴 ALTO | Podría ver/modificar dinero |
| Acceso a Ventas | 🟡 MEDIO | Podría ver comisiones de otros |
| Acceso a Empleados | 🟡 MEDIO | Podría ver datos sensibles |
| Acceso a Logística | 🟡 MEDIO | No es su rol |

### Recomendaciones

```
🔧 MEJORA CRÍTICA 1: Remover acceso a Cajas
   Permisos a remover:
   - cajas.index
   - cajas.create
   - cajas.show
   - cajas.update
   - cajas.delete
   - cajas.registrar-movimiento
   - cajas.aprobar-movimiento
   - cajas.rechazar-movimiento
   - cajas.cierre-diario

   Razón: Un preventista vende, no maneja dinero

🔧 MEJORA 2: Remover/Limitar acceso a Ventas
   Permisos a remover:
   - ventas.index (OK para ver propias, no todas)
   - ventas.create (OK, crea sus propias)
   - ventas.edit (OK para las suyas)
   - ventas.delete (NO debería poder borrar)
   - ventas.approve (NO, eso es admin)
   - ventas.export (OK)
   - ventas.report (NO)

   Razón: Debe ver solo sus propias ventas, no todas

🔧 MEJORA 3: Remover acceso a Empleados
   Permisos a remover:
   - empleados.index
   - empleados.show

   Razón: No necesita ver datos de otros empleados

🔧 MEJORA 4: Remover acceso a Logística
   Permisos a remover:
   - logistica.dashboard
   - logistica.envios.seguimiento

   Razón: El preventista no es responsable de logística

🔧 MEJORA 5: Limitar acceso a Clientes
   Cambiar:
   - clientes.* → clientes.show, clientes.create (solo lectura/creación)

   Razón: No debería poder editar/borrar clientes existentes
```

---

## 4. MATRIZ DE ACCESO CORRECTA (PROPUESTA)

### CHOFER - Acceso Mínimo
```
✅ Logística:
   - Dashboard
   - Ver entregas asignadas
   - Ver entregas en tránsito
   - Marcar como entregado

❌ NO:
   - Cajas
   - Proformas
   - Ventas
   - Inventario
   - Clientes
   - Empleados
```

### CAJERO - Acceso Mediano
```
✅ Ventas:
   - Crear venta (POS)
   - Ver historial de ventas propias
   - Procesar devoluciones

✅ Cajas:
   - Ver saldo
   - Registrar movimientos

✅ Clientes:
   - Crear cliente
   - Ver clientes

❌ NO:
   - Proformas
   - Inventario
   - Compras
   - Empleados
   - Reportes
```

### PREVENTISTA - Acceso Controlado
```
✅ Proformas:
   - Crear proforma (TODAS las acciones)

✅ Clientes:
   - Ver clientes (lectura)
   - Crear cliente
   - NO editar/borrar

✅ Productos:
   - Ver productos

✅ Inventario:
   - Ver stock (lectura)
   - NO modificar

❌ NO:
   - Cajas ⚠️ REMOVER URGENTE
   - Ventas ⚠️ REMOVER EXCEPTO PROPIAS
   - Empleados ⚠️ REMOVER
   - Logística ⚠️ REMOVER
```

---

## 5. PROBLEMAS DE SEGURIDAD ENCONTRADOS

### 🔴 CRÍTICOS (Remover inmediatamente)

1. **Preventista accede a Cajas**
   ```sql
   -- Remover estos permisos:
   DELETE FROM role_has_permissions
   WHERE role_id = (SELECT id FROM roles WHERE name = 'Preventista')
   AND permission_id IN (
     SELECT id FROM permissions WHERE name LIKE 'cajas.%'
   );
   ```

### 🟡 MEDIANOS (Revisar y remover)

2. **Preventista accede a Empleados**
   ```sql
   DELETE FROM role_has_permissions
   WHERE role_id = (SELECT id FROM roles WHERE name = 'Preventista')
   AND permission_id IN (
     SELECT id FROM permissions WHERE name = 'empleados.show'
     OR name = 'empleados.index'
   );
   ```

3. **Preventista accede a Logística**
   ```sql
   DELETE FROM role_has_permissions
   WHERE role_id = (SELECT id FROM roles WHERE name = 'Preventista')
   AND permission_id IN (
     SELECT id FROM permissions WHERE name LIKE 'logistica.%'
   );
   ```

---

## 6. VERIFICACIÓN DE RUTAS

| Ruta | Permiso Requerido | Chofer | Cajero | Preventista |
|------|-------------------|--------|--------|-------------|
| `/proformas` | proformas.index | ❌ | ❌ | ✅ |
| `/ventas` | ventas.index | ❌ | ✅ | ❌ |
| `/cajas` | cajas.index | ❌ | ✅ | ❌ (debería) |
| `/logistica/dashboard` | envios.index | ✅ | ❌ | ❌ (debería) |
| `/inventario/dashboard` | inventario.dashboard | ❌ | ❌ | ⚠️ (solo lectura) |

---

## 7. CONCLUSIONES

### ✅ Está Bien
- Chofer está correctamente restringido a Logística
- Cajero tiene acceso apropiado a Ventas/Cajas
- El sistema de permisos basado en roles funciona correctamente
- Las rutas están protegidas por middleware de permisos

### ⚠️ Necesita Mejora
- Preventista tiene **DEMASIADOS permisos**
- Preventista puede ver cajas (CRÍTICO)
- Preventista puede ver todos los empleados
- Preventista puede ver logística

### 🔧 Acciones Recomendadas

**Inmediato (Hoy)**:
1. Remover permisos de cajas para Preventista
2. Remover permisos de empleados para Preventista
3. Remover permisos de logística para Preventista

**Corto plazo (Esta semana)**:
4. Limitar acceso a ventas (solo propias)
5. Limitar acceso a clientes (lectura solamente)
6. Agregar módulos faltantes para Chofer

**Mediano plazo (Este mes)**:
7. Implementar row-level security (ver solo datos propios)
8. Auditoría de acceso a base de datos
9. Logging de acciones sensibles

---

## 8. SQL PARA LIMPIAR PERMISOS (USA CON CUIDADO)

```sql
-- 1. Remover acceso a Cajas para Preventista
DELETE FROM role_has_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'Preventista')
AND permission_id IN (SELECT id FROM permissions WHERE name LIKE 'cajas.%');

-- 2. Remover acceso a Empleados para Preventista
DELETE FROM role_has_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'Preventista')
AND permission_id IN (SELECT id FROM permissions WHERE name LIKE 'empleados.%');

-- 3. Remover acceso a Logística para Preventista
DELETE FROM role_has_permissions
WHERE role_id = (SELECT id FROM roles WHERE name = 'Preventista')
AND permission_id IN (SELECT id FROM permissions WHERE name LIKE 'logistica.%');

-- Verificar cambios:
SELECT r.name, p.name
FROM role_has_permissions rhp
JOIN roles r ON rhp.role_id = r.id
JOIN permissions p ON rhp.permission_id = p.id
WHERE r.name = 'Preventista'
ORDER BY p.name;
```

---

## Resumen Final

| Rol | Estado | Acción |
|-----|--------|--------|
| **Chofer** | ✅ Bien | Agregar módulos logísticos faltantes |
| **Cajero** | ✅ Excelente | Verificar módulos sugeridos |
| **Preventista** | ⚠️ REVISAR | Remover acceso a Cajas/Empleados/Logística |

**Próximo paso**: Ejecutar limpieza de permisos para Preventista y testear todos los roles.
