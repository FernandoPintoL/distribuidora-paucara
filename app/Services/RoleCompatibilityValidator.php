<?php

namespace App\Services;

use Exception;

/**
 * Valida la compatibilidad entre roles
 * Previene asignaciones de roles conflictivos a un mismo usuario
 */
class RoleCompatibilityValidator
{
    /**
     * Matriz de roles incompatibles
     * Si un rol está en una clave, NO puede tener ninguno de los roles en su array de valores
     */
    private array $incompatibilidadRoles = [
        // Preventista: Gestor de cartera de clientes por zona
        'Preventista' => [
            'Comprador',
            'Compras',
            'Admin',
            'Super Admin',
            'Chofer', // No puede ser operativo de transporte
        ],

        // Chofer: Solo operativo de transporte
        'Chofer' => [
            'Preventista',
            'Comprador',
            'Compras',
            'Cajero',
            'Admin',
            'Super Admin',
            'Manager',
        ],

        // Cajero: Operador de punto de venta (aprobar proformas, gestionar crédito, caja)
        'Cajero' => [
            'Chofer',
            'Preventista', // Aunque puede ver historial cliente, no gestiona cartera
            'Comprador',
            'Compras',
            'Admin',
            'Super Admin',
        ],

        // Comprador no puede ser preventista o vendedor
        'Comprador' => [
            'Preventista',
            'Vendedor',
            'Cajero',
            'Admin',
            'Super Admin',
        ],

        // Vendedor (tradicional si existe) no puede ser comprador
        'Vendedor' => [
            'Comprador',
            'Compras',
            'Admin',
            'Super Admin',
        ],

        // Gestores no pueden tener roles administrativos superiores
        'Gestor de Almacén' => [
            'Admin',
            'Super Admin',
            'Chofer',
            'Preventista',
        ],

        'Gestor de Inventario' => [
            'Admin',
            'Super Admin',
            'Chofer',
            'Preventista',
        ],

        'Logística' => [
            'Admin',
            'Super Admin',
            'Preventista',
        ],

        // Contabilidad no puede combinar con compras/ventas
        'Contabilidad' => [
            'Comprador',
            'Compras',
            'Preventista',
            'Cajero',
            'Admin',
            'Super Admin',
        ],

        // Admin no puede ser operativo
        'Admin' => [
            'Chofer',
            'Cajero',
            'Vendedor',
            'Comprador',
            'Preventista',
        ],
    ];

    /**
     * Roles que NUNCA deben combinarse con otros (excepto Empleado)
     */
    private array $rolesExclusivos = [
        'Super Admin', // Debe ser único
        'Admin',       // No debe combinarse con operativos
    ];

    /**
     * Valida que los roles asignados sean compatibles entre sí
     *
     * @param array $roles Array de nombres de roles a validar
     * @param ?string $usuarioActualRol Rol actual del usuario (para transiciones)
     * @throws Exception Si encuentra roles incompatibles
     */
    public function validar(array $roles, ?string $usuarioActualRol = null): void
    {
        // Filtrar roles vacíos
        $roles = array_filter(array_map('trim', $roles));

        if (empty($roles)) {
            return;
        }

        // Validación 1: Roles exclusivos
        $this->validarRolesExclusivos($roles);

        // Validación 2: Incompatibilidades
        $this->validarIncompatibilidades($roles);

        // Validación 3: Validar transición de rol (si se está cambiando)
        if ($usuarioActualRol && !in_array($usuarioActualRol, $roles)) {
            $this->validarTransicion($usuarioActualRol, $roles);
        }
    }

    /**
     * Valida que roles exclusivos no se asignen con otros
     */
    private function validarRolesExclusivos(array $roles): void
    {
        foreach ($this->rolesExclusivos as $rolExclusivo) {
            if (in_array($rolExclusivo, $roles) && count($roles) > 1) {
                throw new Exception(
                    "El rol '{$rolExclusivo}' es exclusivo y no puede combinarse con otros roles. "
                    . "El usuario debe tener SOLO el rol '{$rolExclusivo}'."
                );
            }
        }
    }

    /**
     * Valida incompatibilidades entre roles
     */
    private function validarIncompatibilidades(array $roles): void
    {
        foreach ($roles as $rolActual) {
            // Verificar si este rol tiene incompatibilidades
            if (!isset($this->incompatibilidadRoles[$rolActual])) {
                continue;
            }

            $rolesIncompatibles = $this->incompatibilidadRoles[$rolActual];

            // Buscar conflictos
            foreach ($roles as $otroRol) {
                if ($rolActual === $otroRol) {
                    continue; // No comparar consigo mismo
                }

                if (in_array($otroRol, $rolesIncompatibles)) {
                    throw new Exception(
                        "El rol '{$rolActual}' es incompatible con '{$otroRol}'. "
                        . "Un empleado no puede tener ambos roles simultáneamente."
                    );
                }
            }
        }
    }

    /**
     * Valida transiciones de roles (cambios de rol)
     * Por ejemplo: De Chofer a Manager está permitido, pero no de Super Admin a otro
     */
    private function validarTransicion(string $rolAnterior, array $rolesNuevos): void
    {
        // Super Admin no debe cambiar a otro rol sin confirmación explícita
        if ($rolAnterior === 'Super Admin' && !in_array('Super Admin', $rolesNuevos)) {
            throw new Exception(
                "No se puede remover el rol 'Super Admin' a través de esta acción. "
                . "Use la función específica de administración de Super Admin."
            );
        }

        // Admin no debe cambiar a roles operativos sin confirmación
        if ($rolAnterior === 'Admin' && count($rolesNuevos) > 0) {
            $rolesOperativos = ['Chofer', 'Cajero', 'Vendedor', 'Comprador'];
            foreach ($rolesNuevos as $nuevoRol) {
                if (in_array($nuevoRol, $rolesOperativos) && !in_array('Admin', $rolesNuevos)) {
                    throw new Exception(
                        "Un Admin no puede cambiar a un rol operativo exclusivamente. "
                        . "Mantenga el rol Admin o use la administración de permisos explícitamente."
                    );
                }
            }
        }
    }

    /**
     * Obtiene la lista de roles incompatibles con un rol específico
     *
     * @param string $rol
     * @return array
     */
    public function obtenerIncompatibles(string $rol): array
    {
        return $this->incompatibilidadRoles[$rol] ?? [];
    }

    /**
     * Obtiene la matriz completa de incompatibilidades
     */
    public function obtenerMatrizCompleta(): array
    {
        return $this->incompatibilidadRoles;
    }

    /**
     * Verifica si dos roles son compatibles
     */
    public function sonCompatibles(string $rol1, string $rol2): bool
    {
        if ($rol1 === $rol2) {
            return true;
        }

        // Verificar en ambas direcciones
        $incompatibles = $this->incompatibilidadRoles[$rol1] ?? [];
        return !in_array($rol2, $incompatibles);
    }

    /**
     * Obtiene los roles que SÍ son compatibles con un rol dado
     */
    public function obtenerCompatibles(string $rol, array $rolesDisponibles): array
    {
        $incompatibles = $this->obtenerIncompatibles($rol);

        return array_filter($rolesDisponibles, function ($nuevoRol) use ($incompatibles, $rol) {
            return $nuevoRol !== $rol && !in_array($nuevoRol, $incompatibles);
        });
    }
}
