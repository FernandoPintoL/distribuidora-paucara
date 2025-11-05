<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ProgramarEnvioRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'vehiculo_id'       => 'required|exists:vehiculos,id',
            'chofer_id'         => 'required|exists:users,id',
            'fecha_programada'  => 'required|date|after:now',
            'direccion_entrega' => 'nullable|string|max:500',
            'observaciones'     => 'nullable|string|max:1000',
        ];
    }

    /**
     * Validaciones adicionales después de las reglas básicas
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            // 1. Validar que el vehículo esté activo y disponible
            $this->validarVehiculoDisponible($validator);

            // 2. Validar que el chofer esté activo
            $this->validarChoferActivo($validator);
        });
    }

    private function validarVehiculoDisponible(Validator $validator): void
    {
        $vehiculoId = $this->input('vehiculo_id');

        if ($vehiculoId) {
            $vehiculo = \App\Models\Vehiculo::find($vehiculoId);

            if ($vehiculo) {
                if (!$vehiculo->activo) {
                    $validator->errors()->add('vehiculo_id',
                        "El vehículo '{$vehiculo->placa}' está desactivado. Active el vehículo antes de continuar."
                    );
                }

                if ($vehiculo->estado !== \App\Models\Vehiculo::DISPONIBLE) {
                    $validator->errors()->add('vehiculo_id',
                        "El vehículo '{$vehiculo->placa}' no está disponible (estado: {$vehiculo->estado})."
                    );
                }
            }
        }
    }

    private function validarChoferActivo(Validator $validator): void
    {
        $choferId = $this->input('chofer_id');

        if ($choferId) {
            $chofer = \App\Models\User::find($choferId);

            if ($chofer && !$chofer->activo) {
                $validator->errors()->add('chofer_id',
                    "El chofer '{$chofer->name}' está desactivado. Active el chofer antes de continuar."
                );
            }
        }
    }

    public function messages(): array
    {
        return [
            'vehiculo_id.required'       => 'El vehículo es requerido.',
            'vehiculo_id.exists'         => 'El vehículo seleccionado no existe.',
            'chofer_id.required'         => 'El chofer es requerido.',
            'chofer_id.exists'           => 'El chofer seleccionado no existe.',
            'fecha_programada.required'  => 'La fecha programada es requerida.',
            'fecha_programada.date'      => 'La fecha programada debe ser válida.',
            'fecha_programada.after'     => 'La fecha programada debe ser posterior a ahora.',
            'direccion_entrega.max'      => 'La dirección de entrega no puede exceder 500 caracteres.',
            'observaciones.max'          => 'Las observaciones no pueden exceder 1000 caracteres.',
        ];
    }
}
