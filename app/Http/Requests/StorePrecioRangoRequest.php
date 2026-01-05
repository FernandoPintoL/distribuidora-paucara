<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StorePrecioRangoRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'cantidad_minima' => 'required|integer|min:1',
            'cantidad_maxima' => 'nullable|integer|min:1|gte:cantidad_minima',
            'tipo_precio_id' => 'required|integer|exists:tipos_precio,id',
            'fecha_vigencia_inicio' => 'nullable|date|date_format:Y-m-d',
            'fecha_vigencia_fin' => 'nullable|date|date_format:Y-m-d|after_or_equal:fecha_vigencia_inicio',
        ];
    }

    public function messages(): array
    {
        return [
            'cantidad_minima.required' => 'La cantidad mínima es requerida',
            'cantidad_minima.integer' => 'La cantidad mínima debe ser un número entero',
            'cantidad_minima.min' => 'La cantidad mínima debe ser mayor a 0',
            'cantidad_maxima.gte' => 'La cantidad máxima debe ser igual o mayor a la mínima',
            'tipo_precio_id.required' => 'El tipo de precio es requerido',
            'tipo_precio_id.exists' => 'El tipo de precio seleccionado no existe',
            'fecha_vigencia_fin.after_or_equal' => 'La fecha de fin debe ser posterior o igual a la de inicio',
        ];
    }
}
