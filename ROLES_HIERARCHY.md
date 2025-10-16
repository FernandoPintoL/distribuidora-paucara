# Jerarquía de Roles del Sistema - Paucara

## Estructura de Roles

Este documento describe la jerarquía de roles implementada en el sistema de distribuidora Paucara, basada en Laravel Spatie Permission.

---

## Nivel 1: Super Admin 🔐

**Descripción:** Acceso total al sistema. Es el rol de más alto nivel.

**Características:**
- ✅ Acceso completo a todas las funcionalidades
- ✅ Único rol que puede crear otros Super Admins
- ✅ Manejo de configuraciones críticas del sistema (`admin.system`)
- ✅ Soporte técnico y resolución de errores del sistema
- ✅ Gestión total de permisos y roles
- ✅ Puede eliminar usuarios y realizar acciones irreversibles

**Casos de uso:**
- Desarrolladores del sistema
- Personal de soporte técnico
- Propietarios del negocio con conocimientos técnicos

**Comando para crear:**
```bash
php artisan admin:create-super-admin
```

---

## Nivel 2: Admin / Manager

### Admin 👨‍💼

**Descripción:** Administrador con casi todos los permisos del sistema.

**Características:**
- ✅ Casi todos los permisos (excepto `admin.system`)
- ❌ NO puede crear Super Admins
- ❌ NO puede acceder a configuraciones críticas del sistema
- ✅ Puede gestionar empleados, clientes, productos, ventas, compras
- ✅ Acceso a reportes y configuraciones del negocio
- ✅ Puede crear y gestionar usuarios normales

**Casos de uso:**
- Gerente general
- Administrador del negocio sin conocimientos técnicos
- Personal de confianza con responsabilidad administrativa

---

### Manager 📊

**Descripción:** Gestión operativa completa del negocio.

**Permisos incluidos:**

#### Operaciones Completas:
- **Ventas:** Crear, editar, eliminar, ver proformas, verificar stock
- **Compras:** Gestión completa de compras, pagos y cuentas por pagar
- **Inventario:** Dashboard, ajustes, transferencias, mermas, vehículos
- **Logística:** Envíos, seguimiento, asignación de choferes
- **Cajas:** Abrir, cerrar, consultar movimientos
- **Contabilidad:** Ver asientos, libro mayor, balance de comprobación

#### Gestión de Personal:
- ✅ Crear, editar, actualizar empleados
- ✅ Cambiar estados de empleados
- ✅ Gestionar acceso al sistema de empleados

#### Gestión de Usuarios (Limitada):
- ✅ Ver, crear, editar usuarios
- ✅ Asignar/remover roles a usuarios
- ❌ NO puede eliminar usuarios
- ❌ NO puede gestionar Super Admins

#### Maestros del Sistema:
- ✅ Gestión completa de: Categorías, Marcas, Almacenes, Proveedores, Clientes, Productos, Unidades, Tipos de precio, Tipos de pago, Monedas

#### Reportes:
- ✅ Todos los reportes disponibles (precios, ganancias, inventario, etc.)

#### Configuración:
- ✅ Configuración general del negocio (`admin.config`)
- ✅ Módulos del sidebar
- ❌ NO configuraciones críticas del sistema (`admin.system`)

**Casos de uso:**
- Gerente de operaciones
- Administrador operativo
- Encargado general del negocio

---

## Nivel 3: Roles Departamentales/Funcionales

### Gerente 📈

**Permisos:** Supervisión y reportes ejecutivos

- ✅ Ver ventas, compras, inventario (solo lectura)
- ✅ Ver empleados y su información
- ✅ Acceso completo a reportes
- ✅ Configuración de márgenes de ganancia

**Uso:** Roles de supervisión sin capacidad de modificación

---

### Vendedor 💰

**Permisos:** Gestión de ventas

- ✅ Crear, editar, eliminar ventas
- ✅ Gestionar proformas (crear, aprobar, convertir a venta)
- ✅ Verificar stock de productos
- ✅ Gestionar clientes
- ✅ Ver catálogo de productos

**Uso:** Personal de ventas en mostrador o campo

---

### Comprador / Compras 🛒

**Permisos:** Gestión de compras y proveedores

- ✅ Crear, editar compras
- ✅ Gestionar cuentas por pagar
- ✅ Registrar pagos a proveedores
- ✅ Gestionar lotes y vencimientos
- ✅ Gestionar proveedores
- ✅ Reportes de precios y compras

**Uso:** Personal encargado de compras e inventario de entrada

---

### Gestor de Almacén 📦

**Permisos:** Control de inventario físico

- ✅ Dashboard de inventario
- ✅ Ajustes de inventario
- ✅ Transferencias entre almacenes (crear, enviar, recibir)
- ✅ Registrar y gestionar mermas
- ✅ Gestionar almacenes
- ✅ Reportes de stock, vencimientos, movimientos

**Uso:** Almacenistas, encargados de bodega

---

### Cajero 💵

**Permisos:** Operación de caja

- ✅ Abrir y cerrar caja
- ✅ Crear ventas directas
- ✅ Ver movimientos de caja
- ✅ Gestionar clientes básicos

**Uso:** Personal de caja, punto de venta

---

### Chofer 🚚

**Permisos:** Gestión de entregas

- ✅ Ver envíos asignados
- ✅ Ver seguimiento de entregas
- ✅ Dashboard de logística
- ✅ Registrar clientes durante entregas
- ✅ Ver su perfil de empleado

**Uso:** Choferes, repartidores

---

### Inventario 📊

**Permisos:** Control de stock especializado

- ✅ Dashboard y reportes de inventario
- ✅ Ajustes de stock
- ✅ Gestión de mermas (registrar, aprobar/rechazar)
- ✅ Transferencias entre almacenes
- ✅ Gestión de productos y almacenes

**Uso:** Personal especializado en control de inventario

---

### Logística 🚛

**Permisos:** Coordinación de envíos

- ✅ Crear, programar, cancelar envíos
- ✅ Confirmar entregas y salidas
- ✅ Ver choferes y vehículos disponibles
- ✅ Dashboard de logística
- ✅ Seguimiento de envíos

**Uso:** Coordinadores de logística y distribución

---

### Contabilidad 💼

**Permisos:** Reportes contables y financieros

- ✅ Ver asientos contables
- ✅ Libro mayor
- ✅ Balance de comprobación
- ✅ Gestión contable general

**Uso:** Personal del área contable

---

### Reportes 📊

**Permisos:** Acceso a reportería completa

- ✅ Reportes de precios y exportación
- ✅ Reportes de ganancias
- ✅ Reportes de inventario (stock, vencimientos, rotación, movimientos)

**Uso:** Analistas, personal de reportería

---

## Nivel 4: Roles de Acceso Limitado

### Empleado 👤

**Permisos:** Acceso mínimo

- ✅ Ver su propio perfil de empleado
- ❌ Sin acceso a otras funcionalidades

**Uso:** Empleados sin rol específico asignado, empleados base

---

### Cliente 🛍️

**Permisos:** Acceso externo limitado

- ✅ Gestionar su propio perfil
- ❌ Sin acceso a funcionalidades internas

**Uso:** Clientes con acceso al portal (si aplica)

---

## Comparativa Rápida

| Rol | Puede crear usuarios | Puede eliminar | Acceso config sistema | Gestión completa |
|-----|---------------------|----------------|----------------------|------------------|
| **Super Admin** | ✅ Incluso Super Admins | ✅ Todo | ✅ Total | ✅ Total |
| **Admin** | ✅ Usuarios normales | ✅ Usuarios normales | ❌ | ✅ Casi todo |
| **Manager** | ✅ Limitado | ❌ | ❌ | ✅ Operacional |
| **Gerente** | ❌ | ❌ | ❌ | 👁️ Solo lectura |
| **Roles Dept.** | ❌ | ❌ | ❌ | 🔧 Su área |
| **Empleado** | ❌ | ❌ | ❌ | ❌ Mínimo |

---

## Gestión de Roles

### Crear Super Admin

Solo mediante comando de consola:

```bash
php artisan admin:create-super-admin --email=admin@paucara.com --name="Super Admin"
```

### Asignar Múltiples Roles a Empleados

Los empleados pueden tener múltiples roles simultáneamente mediante el sistema de multi-select:

```php
// Ejemplo: Un empleado puede ser Vendedor Y Chofer
$empleado->user->assignRole(['Vendedor', 'Chofer']);
```

### Verificar Permisos

```php
// Verificar si tiene permiso
if (auth()->user()->can('ventas.create')) {
    // Puede crear ventas
}

// Verificar si tiene rol
if (auth()->user()->hasRole('Super Admin')) {
    // Es Super Admin
}

// Verificar cualquiera de varios roles
if (auth()->user()->hasAnyRole(['Admin', 'Manager', 'Super Admin'])) {
    // Tiene rol administrativo
}
```

---

## Regenerar Roles y Permisos

Para actualizar los roles y permisos en la base de datos:

```bash
php artisan db:seed --class=RolesAndPermissionsSeeder
```

⚠️ **IMPORTANTE:** Esto sincronizará los permisos de cada rol. Los usuarios existentes mantendrán sus roles asignados.

---

## Notas de Seguridad

1. ⚠️ Solo debe haber 1-2 Super Admins en el sistema
2. ⚠️ Los Super Admins NO deben usarse para operaciones diarias
3. ✅ Use el rol Manager para administración operativa
4. ✅ Asigne el rol mínimo necesario a cada empleado
5. ✅ Revise periódicamente los permisos de usuarios
6. ✅ Los empleados pueden tener múltiples roles para flexibilidad

---

## Fecha de Actualización

**Última actualización:** 13 de Octubre, 2025

**Versión del documento:** 1.0

---

**Desarrollado para:** Distribuidora Paucara
**Framework:** Laravel 11 + Spatie Permission
**Documentación:** Claude Code Assistant
