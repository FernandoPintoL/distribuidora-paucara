-- ============================================================================
-- SETUP PERMISSIONS FOR INVENTORY RESERVATIONS
-- Execute this SQL to create the required permissions
-- ============================================================================

-- Insert permissions for reserva management
INSERT INTO permissions (name, guard_name, created_at, updated_at) VALUES
('inventario.reservas.index', 'web', NOW(), NOW()),
('inventario.reservas.liberar', 'web', NOW(), NOW()),
('inventario.reservas.liberar-masivo', 'web', NOW(), NOW()),
('inventario.reservas.extender', 'web', NOW(), NOW())
ON CONFLICT (name) DO NOTHING;  -- Skip if already exists

-- ============================================================================
-- ASSIGN PERMISSIONS TO ADMIN ROLE (Example - adjust as needed)
-- ============================================================================

-- Option 1: If your system uses Spatie/Laravel-Permission
-- (Run this in: php artisan tinker)
/*
> $role = \App\Models\Role::where('name', 'admin')->first();
> $role->givePermissionTo([
    'inventario.reservas.index',
    'inventario.reservas.liberar',
    'inventario.reservas.liberar-masivo',
    'inventario.reservas.extender'
  ]);
> exit
*/

-- Option 2: Raw SQL (if using role_has_permissions table)
/*
-- Get the role IDs first
SELECT id, name FROM roles WHERE name IN ('admin', 'gerente', 'supervisor');

-- Insert role-permission assignments (replace role_id with actual ID)
INSERT INTO role_has_permissions (role_id, permission_id) SELECT
  (SELECT id FROM roles WHERE name = 'admin'),
  id
FROM permissions
WHERE name IN (
  'inventario.reservas.index',
  'inventario.reservas.liberar',
  'inventario.reservas.liberar-masivo',
  'inventario.reservas.extender'
)
ON CONFLICT DO NOTHING;
*/

-- ============================================================================
-- VERIFY PERMISSIONS WERE CREATED
-- ============================================================================

SELECT * FROM permissions
WHERE name LIKE 'inventario.reservas.%'
ORDER BY created_at DESC;

-- ============================================================================
-- VERIFY ROLE HAS PERMISSIONS
-- ============================================================================

-- For admin role with Spatie Laravel-Permission
SELECT
  r.name as role,
  p.name as permission
FROM role_has_permissions rhp
JOIN roles r ON rhp.role_id = r.id
JOIN permissions p ON rhp.permission_id = p.id
WHERE r.name = 'admin'
  AND p.name LIKE 'inventario.reservas.%'
ORDER BY p.name;
