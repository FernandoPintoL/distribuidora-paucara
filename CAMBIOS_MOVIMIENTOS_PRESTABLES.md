# 📈 Sistema de Movimientos de Prestables

## Descripción General
Se ha implementado un sistema completo de registro de movimientos para prestables, similar al que existe para `movimientos_inventario` en productos. Este sistema captura todos los cambios en el stock de prestables, permitiendo un auditaje detallado y trazabilidad completa.

## Archivos Creados

### 1. **Migración Database**
- **Archivo:** `database/migrations/2026_04_13_000000_create_movimientos_prestables_table.php`
- **Tabla:** `movimientos_prestables`
- **Características:**
  - Registra cada movimiento de stock de prestables
  - Captura estados ANTES y DESPUÉS para todas las categorías
  - Soporta 7 tipos de movimientos: AJUSTE_DIRECTO, AJUSTE_RELATIVO, ENTRADA, SALIDA, CONSUMO_RESERVA, DISTRIBUCION_RESERVA, LIBERACION_RESERVA
  - Incluye auditoría completa: IP, User Agent, usuario
  - Soporte para anulación de movimientos con motivo y fecha
  - Soft deletes para recuperación de datos
  - Índices optimizados para búsquedas rápidas

### 2. **Modelo Eloquent**
- **Archivo:** `app/Models/MovimientoPrestable.php`
- **Relaciones:**
  - `belongsTo PrestableStock`
  - `belongsTo Almacen`
  - `belongsTo User` (usuario que registra)
  - `belongsTo User` (usuario que anula)
- **Atributos Calculados:**
  - `total_anterior` - Suma de todos los valores antes
  - `total_posterior` - Suma de todos los valores después
  - `cambio` - Diferencia neta
  - `cambios_por_categoria` - Array de cambios por categoría
- **Scopes Útiles:**
  - `porTipo()` - Filtrar por tipo de movimiento
  - `porAlmacen()` - Filtrar por almacén
  - `porPrestable()` - Filtrar por prestable
  - `porUsuario()` - Filtrar por usuario
  - `activos()` - Solo movimientos no anulados
  - `anulados()` - Solo movimientos anulados
  - `porFecha()` - Filtrar por rango de fechas

### 3. **Servicio de Movimientos**
- **Archivo:** `app/Services/MovimientoPrestableService.php`
- **Métodos:**
  - `registrarMovimiento()` - Registra un movimiento genérico
  - `registrarAjusteDirecto()` - Registra ajuste directo
  - `registrarAjusteRelativo()` - Registra ajuste relativo
  - `anularMovimiento()` - Anula un movimiento existente
  - `obtenerMovimientos()` - Obtiene movimientos con filtros

### 4. **Página React - Movimientos**
- **Archivo:** `resources/js/presentation/pages/prestamos/ajustes/movimientos.tsx`
- **Características:**
  - Tabla responsiva de movimientos
  - Filtros por: prestable (búsqueda), tipo de movimiento
  - Muestra estados ANTES y DESPUÉS con notación compacta
  - Código de colores para cada tipo de movimiento
  - Indicación visual de movimientos anulados
  - Paginación
  - Dark mode support
  - Responsive design (mobile, tablet, desktop)

## Cambios en Archivos Existentes

### 1. **PrestableController** (`app/Http/Controllers/PrestableController.php`)
- **Agregado:** Import de `MovimientoPrestable`
- **Modificado:** Método `ajustarStock()`
  - Ahora registra un movimiento en `movimientos_prestables` al ajustar stock
  - El movimiento incluye referencia al ajuste creado
- **Nuevo método:** `movimientos(Request $request)`
  - Endpoint API para obtener movimientos filtrados
  - Soporta filtros: tipo, almacén, usuario, fechas, búsqueda
  - Retorna datos paginados

### 2. **Rutas API** (`routes/api.php`)
- **Nueva ruta:** `GET /api/prestables/movimientos`
  - Obtiene movimientos con paginación y filtros
  - Accesible desde la página de movimientos

### 3. **Rutas Web** (`routes/web.php`)
- **Nueva ruta:** `GET /prestamos/ajustes/movimientos`
  - Renderiza la página React de movimientos
  - Nombre: `prestamos.ajustes.movimientos`

## Flujo de Integración

### Cuando se ajusta stock de prestables:
1. `stock.tsx` envía datos al endpoint `POST /api/prestables/{id}/stock/ajustar`
2. `PrestableController::ajustarStock()` procesa la solicitud:
   - Actualiza `prestable_stock` con nuevos valores
   - Crea registro en `ajustes_stock_prestables` (auditoría)
   - **Crea registro en `movimientos_prestables`** ← NUEVO
   - Retorna éxito
3. El frontend recibe confirmación y puede generar PDF

### Para ver el historial de movimientos:
1. Usuario navega a `/prestamos/ajustes/movimientos`
2. Página carga datos del endpoint `GET /api/prestables/movimientos`
3. Tabla muestra todos los movimientos con filtros disponibles
4. Puede filtrar por tipo, prestable, almacén, rango de fechas

## Tipos de Movimientos Soportados

| Tipo | Código | Descripción | Color |
|------|--------|-------------|-------|
| Ajuste Directo | AJUSTE_DIRECTO | Edición directa de valores | Azul |
| Ajuste Relativo | AJUSTE_RELATIVO | Incremento/decremento | Ámbar |
| Entrada | ENTRADA | Entrada de stock | Verde |
| Salida | SALIDA | Salida de stock | Rojo |
| Consumo de Reserva | CONSUMO_RESERVA | Consumo de reserva | Púrpura |
| Distribución de Reserva | DISTRIBUCION_RESERVA | Distribución de reserva | Índigo |
| Liberación de Reserva | LIBERACION_RESERVA | Liberación de reserva | Cian |

## Campos Capturados en Cada Movimiento

### Estados Anteriores:
- `disponible_anterior`
- `prestamo_cliente_anterior`
- `prestamo_proveedor_anterior`
- `vendida_anterior`

### Estados Posteriores:
- `disponible_posterior`
- `prestamo_cliente_posterior`
- `prestamo_proveedor_posterior`
- `vendida_posterior`

### Información del Movimiento:
- `tipo` - Tipo de movimiento
- `cantidad` - Cambio total en cantidad
- `categoria_afectada` - Categoría específica afectada
- `motivo` - Motivo del movimiento
- `observaciones` - Notas adicionales
- `numero_referencia` - Referencia externa (ej: AJUSTE-42)
- `referencia_tipo` - Tipo de referencia (AJUSTE, VENTA, etc.)
- `referencia_id` - ID de la referencia

### Auditoría:
- `usuario_id` - Usuario que realizó el movimiento
- `ip_usuario` - IP desde donde se realizó
- `user_agent` - Navegador/dispositivo
- `created_at` - Fecha y hora del movimiento

### Anulación:
- `anulado` - Boolean indicando si está anulado
- `motivo_anulacion` - Razón de la anulación
- `usuario_anulacion_id` - Usuario que anuló
- `fecha_anulacion` - Fecha de anulación

## Próximas Mejoras Sugeridas

1. **Exportación de Movimientos**
   - Agregar botón para exportar a CSV/Excel
   - Filtros aplicados a la exportación

2. **Reportes Analíticos**
   - Gráficos de movimientos por tipo
   - Análisis de tendencias por prestable
   - Comparativas por almacén

3. **Alertas Automáticas**
   - Notificación cuando stock baja de mínimo
   - Validación de integridad de datos

4. **Integración con Reservas**
   - Registrar automáticamente movimientos de consumo de reservas
   - Registrar movimientos de distribución y liberación

5. **API Publica**
   - Endpoint para obtener movimientos de un prestable específico
   - Webhook para cambios de stock

## Ejecución de Migración

```bash
php artisan migrate
```

La migración creará la tabla `movimientos_prestables` con todos los índices necesarios.

## Testing

Para verificar la implementación:

1. **Ajustar stock de un prestable**
   - Ir a `/prestamos/stock`
   - Editar stock de un prestable
   - Verificar que se crea ajuste en auditoría

2. **Ver movimientos**
   - Ir a `/prestamos/ajustes/movimientos`
   - Verificar que aparezca el movimiento registrado
   - Probar filtros por tipo, prestable, etc.

3. **API directamente**
   ```bash
   curl http://localhost:8000/api/prestables/movimientos
   ```

## Notas de Implementación

- El servicio `MovimientoPrestableService` puede utilizarse desde cualquier parte del código para registrar movimientos
- Los movimientos son independientes de los ajustes (tabla separada) para máxima flexibilidad
- La tabla usa soft deletes para preservar datos históricos incluso si se "elimina" un movimiento
- Los atributos calculados en el modelo facilitan operaciones comunes

---

**Fecha de Implementación:** 2026-04-13
**Versión:** 1.0
