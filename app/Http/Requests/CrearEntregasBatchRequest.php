<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CrearEntregasBatchRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return auth()->check() && auth()->user()->can('entregas.create');
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'venta_ids' => 'required|array|min:1|max:50',
            'venta_ids.*' => 'required|integer|exists:ventas,id',
            'vehiculo_id' => 'required|integer|exists:vehiculos,id',
            'chofer_id' => 'required|integer|exists:empleados,id',
            'agrupar_por_zona' => 'boolean|default:true',
            'optimizar' => 'boolean|default:true',
        ];
    }

    /**
     * Get custom messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'venta_ids.required' => 'Debe seleccionar al menos una venta',
            'venta_ids.min' => 'Debe seleccionar al menos una venta',
            'venta_ids.max' => 'No puede seleccionar más de 50 ventas a la vez',
            'venta_ids.*.exists' => 'Una o más ventas no existen',
            'vehiculo_id.required' => 'Debe asignar un vehículo',
            'vehiculo_id.exists' => 'El vehículo seleccionado no existe',
            'chofer_id.required' => 'Debe asignar un chofer',
            'chofer_id.exists' => 'El chofer seleccionado no existe',
        ];
    }
}
