<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdatePrecioRangoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cantidad_minima' => 'sometimes|integer|min:1',
            'cantidad_maxima' => 'nullable|integer|min:1|gte:cantidad_minima',
            'tipo_precio_id' => 'sometimes|integer|exists:tipos_precio,id',
            'fecha_vigencia_inicio' => 'nullable|date|date_format:Y-m-d',
            'fecha_vigencia_fin' => 'nullable|date|date_format:Y-m-d|after_or_equal:fecha_vigencia_inicio',
            'activo' => 'sometimes|boolean',
            'orden' => 'sometimes|integer|min:0',
        ];
    }

    public function messages(): array
    {
        return [
            'cantidad_minima.integer' => 'La cantidad mínima debe ser un número entero',
            'cantidad_minima.min' => 'La cantidad mínima debe ser mayor a 0',
            'cantidad_maxima.gte' => 'La cantidad máxima debe ser igual o mayor a la mínima',
            'tipo_precio_id.exists' => 'El tipo de precio seleccionado no existe',
            'fecha_vigencia_fin.after_or_equal' => 'La fecha de fin debe ser posterior o igual a la de inicio',
        ];
    }
}
