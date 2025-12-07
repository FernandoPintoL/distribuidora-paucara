# 📊 GUÍA DE IMPLEMENTACIÓN: DASHBOARD DINÁMICO POR ROLES

## 🎯 Objetivo
Convertir el dashboard de una página genérica que muestra lo mismo para todos los usuarios a un **dashboard dinámico que se personaliza según los roles y permisos** de cada usuario.

## ✅ Archivos Creados

### Backend (PHP/Laravel)
1. **`config/dashboard-widgets.php`** ✅
   - Configuración centralizada de módulos y widgets
   - Mapeo de roles a módulos permitidos
   - Define qué widgets ve cada rol

2. **`app/Services/DashboardWidgetsService.php`** ✅
   - Determina qué módulos ve un usuario
   - Obtiene widgets permitidos
   - Valida permisos
   - Caché para optimizar performance

3. **`app/Services/DashboardService.php`** (Actualizado) ✅
   - Nuevo método: `getDataForAllowedModules()`
   - Carga datos solo para módulos permitidos
   - Métodos adicionales para widgets específicos

4. **`app/Http/Controllers/DashboardController.php`** (Actualizado) ✅
   - Inyecta `DashboardWidgetsService`
   - Obtiene módulos permitidos del usuario
   - Retorna estructura de widgets en props de Inertia

### Frontend (React/TypeScript)
1. **`resources/js/application/hooks/use-dashboard-widgets.ts`** ✅
   - Hook para renderizar widgets dinámicamente
   - Mapeo de IDs de widget a componentes
   - Helpers para grid CSS

2. **`resources/js/presentation/pages/dashboard-nuevo.tsx`** ✅
   - Ejemplo de dashboard refactorizado
   - Renderiza widgets dinámicamente
   - Tiene fallback al dashboard anterior

## 📋 PASOS PARA IMPLEMENTACIÓN COMPLETA

### FASE 1: Validar cambios backend (30 minutos)

```bash
# 1. Validar que no hay errores PHP
php artisan tinker
# Probar: (new \App\Services\DashboardWidgetsService())->getDashboardStructure(auth()->user())

# 2. Limpiar caché
php artisan cache:clear
php artisan config:cache

# 3. Probar login con diferentes roles
# - Super Admin
# - Comprador
# - Logística
# etc.
```

### FASE 2: Extraer componentes de widgets del dashboard actual (1-2 horas)

El dashboard actual tiene estos componentes que necesitan extractuarse:

```
Componentes actuales en dashboard.tsx:
├── MetricCard (ya existe)
├── ChartWrapper (ya existe)
├── AlertasStock (ya existe)
└── ProductosMasVendidos (ya existe)

Componentes a crear:
├── MetricasPrincipales (agrupa MetricCard x4)
├── MetricasSecundarias (agrupa MetricCard x3)
├── GraficoVentas (usa ChartWrapper)
├── VentasPorCanal (usa ChartWrapper)
└── ... (ver lista completa en dashboard-nuevo.tsx)
```

**Ejemplo de refactorización:**

Antes:
```tsx
<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
    <MetricCard title="Ventas Totales" value={safeMetricas.ventas.total} ... />
    <MetricCard title="Compras Totales" value={safeMetricas.compras.total} ... />
    // ... más tarjetas
</div>
```

Después (componente `metricas-principales.tsx`):
```tsx
export function MetricasPrincipales({ data, loading }) {
    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <MetricCard title="Ventas Totales" value={data.ventas.total} loading={loading} ... />
            <MetricCard title="Compras Totales" value={data.compras.total} loading={loading} ... />
            // ...
        </div>
    );
}
```

### FASE 3: Refactorizar dashboard.tsx (45 minutos)

```tsx
// Opción A: Reemplazar completamente (recomendado)
// Copiar lógica de dashboard-nuevo.tsx al dashboard.tsx

// Opción B: Gradual
// 1. Mantener dashboard.tsx como está
// 2. Crear dashboard-nuevo.tsx en paralelo
// 3. Cuando esté listo, reemplazar
```

**Pasos específicos:**

1. Reemplazar imports en `dashboard.tsx`
2. Cambiar estructura de props
3. Usar hook `useDashboardWidgets`
4. Renderizar widgets dinámicamente
5. Probar con diferentes roles

### FASE 4: Ajustar configuración de módulos (1 hora)

La configuración actual en `config/dashboard-widgets.php` asume ciertos datos. Ajustar:

1. **Verificar permisos existentes:**
```bash
# En Laravel
SELECT DISTINCT name FROM permissions;
```

2. **Verificar roles:**
```bash
SELECT DISTINCT name FROM roles;
```

3. **Actualizar mapeo en `config/dashboard-widgets.php`:**
```php
'role_modules' => [
    'tu_rol_actual' => ['general', 'tus_modulos'],
    // ...
]
```

4. **Asegurarse que tabla `modulos_sidebar` está actualizada:**
```bash
# Debe existir y tener registros con permisos configurados
SELECT * FROM modulos_sidebar;
```

### FASE 5: Pruebas (1 hora)

```bash
# 1. Login con cada rol diferente
# 2. Verificar qué widgets se muestran
# 3. Cambiar período y verificar actualización
# 4. Verificar que carga datos correctos
# 5. Revisar console del navegador (no debe haber errores)
```

**Test checklist:**

- [ ] Super Admin ve todos los módulos
- [ ] Comprador ve solo compras y general
- [ ] Logística ve solo logística y general
- [ ] Chofer ve solo chofer y general
- [ ] Selector de período funciona
- [ ] No hay errores en console
- [ ] Performance es bueno (sin "hacotazos")
- [ ] Datos son correctos para cada rol

## 🔧 CÓMO AÑADIR NUEVO MÓDULO

**Ejemplo: Agregar módulo "Recursos Humanos"**

### 1. Actualizar configuración (`config/dashboard-widgets.php`):

```php
'modules' => [
    // ... otros módulos
    'rrhh' => [
        'widgets' => [
            'empleados_activos',
            'asistencias_hoy',
            'nominas_pendientes',
        ],
        'required_permissions' => ['rrhh.manage', 'rrhh.view'],
        'services' => ['metricas_rrhh', 'asistencias', 'nominas'],
    ],
],

'role_modules' => [
    // ...
    'rrhh_manager' => ['general', 'rrhh'],
]
```

### 2. Crear widgets en hook (`use-dashboard-widgets.ts`):

```typescript
'empleados_activos': {
    id: 'empleados_activos',
    titulo: 'Empleados Activos',
    modulo: 'rrhh',
    componente: 'EmpleadosActivos',
    gridSize: '1/2',
    orden: 1,
},
// ... más widgets
```

### 3. Crear componentes:

```tsx
// recursos/js/presentation/components/dashboard/widgets/empleados-activos.tsx
export function EmpleadosActivos({ data, loading }) {
    return (
        <div>
            {/* Renderizar empleados activos */}
        </div>
    );
}
```

### 4. Actualizar DashboardService:

```php
public function getDataForAllowedModules(array $modulosPermitidos, ...) {
    // Agregar en $modulosData:
    'rrhh' => function () {
        return [
            'empleados_activos' => $this->getEmpleadosActivos(),
            'asistencias_hoy' => $this->getAsistenciasHoy(),
            'nominas_pendientes' => $this->getNominasPendientes(),
        ];
    },
}
```

**¡Listo!** El nuevo módulo aparecerá automáticamente en el dashboard de quien tenga asignado el rol.

## 📊 FLUJO ACTUAL

```
Usuario login
    ↓
DashboardController::index()
    ↓
DashboardWidgetsService::getModulosPermitidos()
    → Lee roles del usuario
    → Consulta config/dashboard-widgets.php
    → Retorna ['general', 'compras', 'logistica']
    ↓
DashboardService::getDataForAllowedModules($modulos)
    → Carga datos SOLO para esos módulos
    → Retorna array optimizado
    ↓
Inertia::render('dashboard', [
    'datosModulos' => [...],
    'modulosPermitidos' => [...],
    'widgetsAMostrar' => [...]
])
    ↓
Frontend: useDashboardWidgets()
    → Lee props
    → Mapea widgets a componentes
    → Renderiza dinámicamente
    ↓
Usuario ve dashboard personalizado
```

## 🚀 BENEFICIOS FINALES

| Aspecto | Antes | Después |
|---------|-------|---------|
| Dashboard | Mismo para todos | Personalizado por rol |
| Escalabilidad | Hardcodeado por rol | Configuración centralizada |
| Nuevo módulo | Modificar código | Solo config |
| Performance | Carga todos los datos | Solo datos necesarios |
| UX | Confuso y lento | Limpio y rápido |
| Mantenibilidad | Difícil | Fácil |

## 🐛 TROUBLESHOOTING

### "Veo el dashboard pero sin datos"
- [ ] Verificar que DashboardService tenga los métodos necesarios
- [ ] Revisar console.log en dashboard-nuevo.tsx
- [ ] Comprobar que servicios retornan datos

### "No veo ningún widget"
- [ ] Verificar que `modulosPermitidos` no esté vacío
- [ ] Comprobar permisos del usuario en BD
- [ ] Revisar `DashboardWidgetsService::getModulosPermitidos()`

### "Error: Componente no encontrado"
- [ ] Verificar que existe archivo del componente
- [ ] Asegurarse que está importado en `dashboard-nuevo.tsx`
- [ ] Revisar nombre en `WIDGET_COMPONENT_MAP`

### "Datos lentos/erráticos"
- [ ] Ejecutar `php artisan cache:clear`
- [ ] Verificar queries en BD
- [ ] Usar Laravel Debugbar para profiling

## 📚 REFERENCIAS

- Hook custom: `resources/js/application/hooks/use-dashboard-widgets.ts`
- Configuración: `config/dashboard-widgets.php`
- Service: `app/Services/DashboardWidgetsService.php`
- Controlador: `app/Http/Controllers/DashboardController.php`
- Dashboard ejemplo: `resources/js/presentation/pages/dashboard-nuevo.tsx`

## ✨ PRÓXIMOS PASOS

1. **Completar FASE 1-5** de implementación
2. **Crear componentes** de widgets
3. **Pruebas** con diferentes roles
4. **Deploy** a producción
5. **Monitoreo** de performance

---

**Creado**: 2025-12-06
**Versión**: 1.0
**Estado**: Estructura implementada, pendiente refactorización frontend
