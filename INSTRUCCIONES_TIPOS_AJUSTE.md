# 📋 Instrucciones de Instalación - Tipos de Ajuste de Inventario

Este documento contiene los pasos necesarios para completar la migración del modal de Tipos de Ajuste a una pantalla separada en el menú lateral de Inventario.

## 🔧 Pasos a Ejecutar

### 1. **Ejecutar la Migración**

```bash
php artisan migrate
```

Esto creará la tabla `tipos_ajuste_inventario` en la base de datos.

### 2. **Ejecutar los Seeders (Permisos y Datos)**

Ejecuta primero el seeder de roles y permisos actualizado:

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

Esto:
- Crea los nuevos permisos: `inventario.tipos-ajuste.*`
- Asigna los permisos a los roles correspondientes:
  - ✅ Super Admin (todos)
  - ✅ Admin (todos)
  - ✅ Manager (todos)
  - ✅ Gestor de Inventario (todos)
  - ✅ Gestor de Almacén (index y manage)

Luego ejecuta el seeder de datos iniciales:

```bash
php artisan db:seed --class=TipoAjustInventarioSeeder
```

Esto crea los tipos de ajuste iniciales:
- Inventario Inicial
- Ajuste por Inventario Físico
- Donación
- Corrección de Error

Y actualiza el menú del sidebar:

```bash
php artisan db:seed --class=ModuloSidebarSeeder
```

Esto agrega el nuevo submódulo "Tipos de Ajuste" en el menú de Inventario.

### 3. **Limpiar Cache (Importante!)**

```bash
php artisan cache:clear
php artisan config:cache
php artisan view:clear
```

## ✨ Cambios Realizados

### 📁 Frontend

#### Nuevas carpetas y archivos:
- `/resources/js/presentation/pages/inventario/tipos-ajuste-inventario/`
  - `index.tsx` - Página de listado
  - `form.tsx` - Página de crear/editar

#### Nuevas configuraciones:
- `/resources/js/domain/entities/tipos-ajuste-inventario.ts`
- `/resources/js/config/tipoAjusteInventario.config.ts`
- `/resources/js/infrastructure/services/tipoAjusteInventario.service.ts`
- `/resources/js/routes/inventario/tipos-ajuste-inventario/index.ts`

#### Cambios en pantalla de Ajuste:
- Archivo: `/resources/js/presentation/pages/inventario/ajuste.tsx`
- Cambio: El botón "Tipos de Ajuste" ahora navega a `/inventario/tipos-ajuste-inventario`
- Removido: Modal `TipoAjustInventarioCrudModal`

### 🔧 Backend

#### Nuevos archivos:
- `/app/Models/TipoAjusteInventario.php` - Modelo Eloquent
- `/app/Http/Controllers/TipoAjusteInventarioController.php` - Controlador
- `/database/migrations/2025_10_29_create_tipos_ajuste_inventario_table.php` - Migración

#### Cambios en archivos existentes:
- `/routes/web.php` - Agregadas rutas resource
- `/database/seeders/RolesAndPermissionsSeeder.php` - Agregados nuevos permisos
- `/database/seeders/ModuloSidebarSeeder.php` - Agregado submódulo al menú

## 🔐 Permisos Creados

Los siguientes permisos han sido agregados y configurados:

```
inventario.tipos-ajuste.manage     - Permiso general de gestión
inventario.tipos-ajuste.index      - Ver listado
inventario.tipos-ajuste.create     - Crear nuevo
inventario.tipos-ajuste.store      - Guardar nuevo
inventario.tipos-ajuste.edit       - Editar existente
inventario.tipos-ajuste.update     - Guardar edición
inventario.tipos-ajuste.destroy    - Eliminar
```

## 👥 Roles con Acceso

| Rol | Acceso | Detalle |
|-----|--------|---------|
| Super Admin | ✅ Completo | Acceso total |
| Admin | ✅ Completo | Acceso total |
| Manager | ✅ Completo | Acceso total |
| Gestor de Inventario | ✅ Completo | Todos los permisos CRUD |
| Gestor de Almacén | ✅ Limitado | index + manage |
| Otros roles | ❌ No | Requiere asignación manual |

## 🧪 Verificación

Después de ejecutar todos los pasos, verifica que:

1. ✅ La tabla `tipos_ajuste_inventario` existe en la BD
2. ✅ Los permisos están en la tabla `permissions`
3. ✅ Los tipos de ajuste iniciales se crearon (4 registros)
4. ✅ El menú lateral muestra "Tipos de Ajuste" bajo Inventario
5. ✅ Puedes acceder a `/inventario/tipos-ajuste-inventario`
6. ✅ El rol Admin/Manager puede hacer CRUD completo
7. ✅ El botón en Ajuste lleva a la nueva pantalla

## 🚀 Uso

- **URL**: `/inventario/tipos-ajuste-inventario`
- **Menú**: Inventario → Tipos de Ajuste (orden 10)
- **Acciones disponibles**: Create, Read, Update, Delete (CRUD completo)
- **Desde Ajuste**: El botón "Tipos de Ajuste" navega automáticamente

## 📝 Notas

- El modal `TipoAjustInventarioCrudModal` aún existe pero no se usa más (puedes eliminarlo si lo deseas)
- El custom hook `useTipoAjustInventario` sigue siendo funcional para obtener tipos en otras pantallas
- Los estilos y componentes utilizan el patrón genérico similar a "Unidades"

---

**Fecha de creación**: 2025-10-29
**Última actualización**: 2025-10-29
