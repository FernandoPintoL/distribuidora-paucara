# Permisos para Flujo de Carga - Nuevo Workflow

## Permisos Agregados

### Entregas (Flujo de Carga)
- `entregas.index` - Listar entregas
- `entregas.create` - Crear entregas
- `entregas.store` - Guardar entregas
- `entregas.show` - Ver detalles de entrega
- `entregas.view` - Ver entregas (alias)
- `entregas.edit` - Editar entregas
- `entregas.update` - Actualizar entregas
- `entregas.delete` - Eliminar entregas
- `entregas.destroy` - Destruir entregas
- `entregas.confirmar-carga` - Confirmar carga (cambiar a EN_CARGA)
- `entregas.listo-para-entrega` - Marcar como listo para entrega (cambiar a LISTO_PARA_ENTREGA)
- `entregas.iniciar-transito` - Iniciar tránsito con GPS (cambiar a EN_TRANSITO)
- `entregas.actualizar-ubicacion` - Actualizar ubicación GPS durante tránsito

### Reportes de Carga
- `reportes-carga.crear` - Crear nuevos reportes de carga
- `reportes-carga.show` - Ver detalles de reporte
- `reportes-carga.view` - Ver reportes (alias)
- `reportes-carga.actualizar-detalle` - Actualizar cantidades cargadas
- `reportes-carga.verificar-detalle` - Verificar productos cargados
- `reportes-carga.confirmar` - Confirmar carga completa
- `reportes-carga.listo-para-entrega` - Marcar reporte como listo para entrega
- `reportes-carga.cancelar` - Cancelar reporte de carga
- `reportes-carga.delete` - Eliminar reporte

## Asignación por Rol

### Gestor de Logística (Encargado de Logística)
**Permisos Completos del Flujo de Carga:**
- Crear reportes de carga
- Ver entregas y reportes
- Actualizar cantidades y verificar productos
- Confirmar cargas
- Marcar entregas como listas para partida
- Actualizar ubicaciones GPS

**Permisos Asignados:**
```php
// Entregas
'entregas.index', 'entregas.create', 'entregas.store', 'entregas.show',
'entregas.view', 'entregas.edit', 'entregas.update',
'entregas.confirmar-carga', 'entregas.listo-para-entrega',
'entregas.iniciar-transito', 'entregas.actualizar-ubicacion',

// Reportes de Carga
'reportes-carga.crear', 'reportes-carga.show', 'reportes-carga.view',
'reportes-carga.actualizar-detalle', 'reportes-carga.verificar-detalle',
'reportes-carga.confirmar', 'reportes-carga.listo-para-entrega',
```

### Chofer (Conductor)
**Permisos del Flujo de Carga:**
- Ver sus entregas asignadas
- Ver reportes de carga
- Actualizar cantidades si es necesario durante carga
- Verificar productos cargados
- Marcar entregas como listas para partir
- Iniciar tránsito y actualizar ubicación GPS

**Permisos Asignados:**
```php
// Entregas
'entregas.index', 'entregas.show', 'entregas.view',
'entregas.listo-para-entrega', 'entregas.iniciar-transito',
'entregas.actualizar-ubicacion',

// Reportes de Carga
'reportes-carga.show', 'reportes-carga.view',
'reportes-carga.actualizar-detalle', 'reportes-carga.verificar-detalle',
```

### Admin
**Acceso Completo** - A través del permiso `Permission::all()`

### Super Admin
**Acceso Total** - A través del permiso `Permission::all()`

## Flujo de Aprobaciones y Responsabilidades

1. **Gestor de Logística (Encargado)**
   - Genera el reporte de carga desde la entrega
   - Especifica vehículo y detalles de la carga
   - Supervisión general del flujo

2. **Chofer (durante preparación)**
   - Actualiza cantidades cargadas reales
   - Verifica que los productos sean correctos
   - Confirma que está listo para partir

3. **Chofer (durante tránsito)**
   - Inicia el tránsito con coordenadas GPS iniciales
   - Actualiza ubicación en tiempo real
   - Sistema de tracking activo

## Notas de Seguridad

- Solo el Gestor de Logística puede crear reportes de carga
- Los choferes no pueden cancelar reportes (solo Gestor de Logística)
- Todos los cambios de estado se registran en el historial
- Las actualizaciones de ubicación GPS se guardan con timestamp
- Los permisos se verifican en cada endpoint API

## Ejecución del Seeder

Para actualizar los permisos en la base de datos:

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

Este seeder:
1. Crea/actualiza todos los permisos
2. Asigna permisos a los roles existentes
3. Mantiene la jerarquía de roles intacta
