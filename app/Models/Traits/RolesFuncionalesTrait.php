<?php
namespace App\Models\Traits;

use App\Enums\TipoEmpleado;
use Illuminate\Support\Facades\Log;

/**
 * Trait para manejar roles dinámicos en el modelo Empleado
 */
trait RolesFuncionalesTrait
{
    /**
     * Boot del trait para registrar eventos
     */
    public static function bootRolesFuncionalesTrait()
    {
        // Podríamos implementar eventos aquí si es necesario
    }

    /**
     * Verifica si el empleado tiene un rol específico
     */
    public function tieneRol(string $rol): bool
    {
        return $this->user && $this->user->hasRole($rol);
    }

    /**
     * Verifica dinámicamente si un empleado tiene un método específico
     * basado en sus roles y los traits asociados
     *
     * @param string $nombre Nombre del método
     * @param array $argumentos Argumentos del método
     * @return mixed
     * @throws \BadMethodCallException
     */
    public function __call($nombre, $argumentos)
    {
        // Primero verificar si el método existe en esta clase
        if (method_exists($this, $nombre)) {
            return $this->{$nombre}(...$argumentos);
        }

        // Si el usuario no tiene un modelo User asociado, no puede tener roles
        if (! $this->user) {
            return parent::__call($nombre, $argumentos);
        }

        // Obtener todos los roles del usuario
        $roles = $this->user->roles->pluck('name')->toArray();

        // Verificar cada rol si tiene un trait asociado
        foreach ($roles as $rol) {
            if (TipoEmpleado::tieneTrait($rol)) {
                $traitClass = TipoEmpleado::obtenerTrait($rol);

                // Verificar si el trait existe y tiene el método solicitado
                if (trait_exists($traitClass)) {
                    $traitReflection = new \ReflectionClass($traitClass);

                    if ($traitReflection->hasMethod($nombre)) {
                        // El trait tiene el método, intentar llamarlo
                        try {
                            // Crear una instancia temporal para invocar el método
                            $instance = new class($this)
                            {
                                private $empleado;

                                public function __construct($empleado)
                                {
                                    $this->empleado = $empleado;
                                }

                                public function callMethod($trait, $method, $args)
                                {
                                    // Usar Closure para preservar el contexto $this
                                    $closure = \Closure::bind(
                                        function ($args) use ($method) {
                                            return $this->{$method}(...$args);
                                        },
                                        $this->empleado,
                                        $trait
                                    );

                                    return $closure($args);
                                }
                            };

                            return $instance->callMethod($traitClass, $nombre, $argumentos);
                        } catch (\Exception $e) {
                            Log::warning("Error al llamar método dinámico $nombre: " . $e->getMessage());
                        }
                    }
                }
            }
        }

        // Si llegamos aquí, el método no existe en ningún trait
        return parent::__call($nombre, $argumentos);
    }

    /**
     * Verifica si el empleado puede ejecutar una función específica de un rol
     */
    public function puedeFuncion(string $nombreFuncion): bool
    {
        if (! $this->user) {
            return false;
        }

        $roles = $this->user->roles->pluck('name')->toArray();

        foreach ($roles as $rol) {
            if (TipoEmpleado::tieneTrait($rol)) {
                $traitClass = TipoEmpleado::obtenerTrait($rol);

                if (trait_exists($traitClass)) {
                    $traitReflection = new \ReflectionClass($traitClass);

                    if ($traitReflection->hasMethod($nombreFuncion)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    /**
     * Obtiene todos los roles funcionales del empleado (roles con traits asociados)
     */
    public function rolesFuncionales(): array
    {
        if (! $this->user) {
            return [];
        }

        $todosRoles       = $this->user->roles->pluck('name')->toArray();
        $rolesFuncionales = [];

        foreach ($todosRoles as $rol) {
            if (TipoEmpleado::tieneTrait($rol)) {
                $rolesFuncionales[] = $rol;
            }
        }

        return $rolesFuncionales;
    }
}
