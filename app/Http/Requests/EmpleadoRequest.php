<?php
namespace App\Http\Requests;

use App\Enums\TipoEmpleado;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EmpleadoRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        $rules = [
            'nombre'                => 'required|string|max:255',
            'ci'                    => 'required|string|max:20',
            'telefono'              => 'nullable|string|max:20',
            'direccion'             => 'nullable|string|max:255',
            'genero'                => 'nullable|in:Masculino,Femenino,Otro',
            'fecha_nacimiento'      => 'nullable|date|before:today',
            'cargo'                 => 'nullable|string|max:100',
            'departamento'          => 'nullable|string|max:100',
            'fecha_ingreso'         => 'required|date',
            'supervisor_id'         => 'nullable|exists:empleados,id',
            'estado'                => 'nullable|in:Activo,Inactivo,Suspendido,Vacaciones,activo,inactivo,vacaciones,licencia',
            'crear_usuario'         => 'boolean',
            'puede_acceder_sistema' => 'boolean',
            'rol'                   => 'nullable|string',
            'usernick'              => 'nullable|string|max:100|unique:users,usernick',
            'email'                 => 'nullable|email|max:255|unique:users,email', // Email es siempre opcional
        ];

        // Verificar si estamos editando un empleado o creando uno nuevo
        if ($this->route('empleado')) {
            // Edición de empleado
            $rules['codigo_empleado'] = [
                'nullable',
                'string',
                'max:20',
                Rule::unique('empleados')->ignore($this->route('empleado')->id),
            ];

            // Si estamos editando, permitir actualizar email y usernick del usuario relacionado
            if ($this->route('empleado')->user_id) {
                $rules['email'] = [
                    'nullable',
                    'email',
                    'max:255',
                    Rule::unique('users')->ignore($this->route('empleado')->user_id),
                ];

                $rules['usernick'] = [
                    'nullable',
                    'string',
                    'max:100',
                    Rule::unique('users')->ignore($this->route('empleado')->user_id),
                ];
            }
        } else {
            // Creación de empleado
            $rules['codigo_empleado'] = 'nullable|string|max:20|unique:empleados,codigo_empleado';
        }

        // Obtener el rol seleccionado o determinarlo por cargo
        $rol = $this->input('rol') ?? TipoEmpleado::determinarRolPorCargo($this->input('cargo'));

        // Añadir reglas específicas según el tipo de empleado/rol
        if (TipoEmpleado::requiereCamposAdicionales($rol)) {
            $reglasAdicionales = TipoEmpleado::reglasValidacion($rol);
            $rules             = array_merge($rules, $reglasAdicionales);
        }

        return $rules;
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        $mensajesBase = [
            'nombre.required'         => 'El nombre es obligatorio.',
            'ci.required'             => 'El número de documento de identidad es obligatorio.',
            'telefono.required'       => 'El número de teléfono es obligatorio.',
            'genero.in'               => 'El género debe ser Masculino, Femenino u Otro.',
            'fecha_nacimiento.before' => 'La fecha de nacimiento debe ser anterior a hoy.',
            'estado.in'               => 'El estado del empleado no es válido.',
            'email.required_if'       => 'El email es obligatorio cuando se crea un usuario.',
            'email.unique'            => 'Este email ya está en uso por otro usuario.',
            'usernick.unique'         => 'Este nombre de usuario ya está en uso.',
        ];

        // Obtener el rol seleccionado o determinarlo por cargo
        $rol = $this->input('rol') ?? TipoEmpleado::determinarRolPorCargo($this->input('cargo'));

        // Añadir mensajes específicos según el rol
        if (TipoEmpleado::requiereCamposAdicionales($rol)) {
            $mensajesEspecificos = TipoEmpleado::mensajesError($rol);
            return array_merge($mensajesBase, $mensajesEspecificos);
        }

        return $mensajesBase;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        if (! $this->has('rol') && $this->has('cargo')) {
            $rol = TipoEmpleado::determinarRolPorCargo($this->cargo);
            $this->merge(['rol' => $rol]);
        }
    }
}
