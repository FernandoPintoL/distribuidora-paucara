<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

/**
 * Request para crear una nueva proforma
 *
 * Valida:
 * - Datos básicos (cliente, fechas)
 * - Detalles (productos y cantidades)
 * - Cálculos (subtotal, impuesto, total)
 */
class StoreProformaRequest extends FormRequest
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
        return [
            // Cliente
            'cliente_id' => ['required', 'integer', 'exists:clientes,id'],

            // Fechas
            'fecha' => ['required', 'date_format:Y-m-d'],
            'fecha_vencimiento' => ['required', 'date_format:Y-m-d', 'after_or_equal:fecha'],

            // Almacén (opcional, por defecto 2)
            'almacen_id' => ['nullable', 'integer', 'exists:almacenes,id'],

            // Detalles (array de productos)
            'detalles' => ['required', 'array', 'min:1'],
            'detalles.*.producto_id' => ['required', 'integer', 'exists:productos,id'],
            'detalles.*.cantidad' => ['required', 'numeric', 'min:0.01'],
            'detalles.*.precio_unitario' => ['nullable', 'numeric', 'min:0'],

            // Cálculos
            'subtotal' => ['required', 'numeric', 'min:0'],
            'impuesto' => ['required', 'numeric', 'min:0'],
            'total' => ['required', 'numeric', 'min:0'],

            // Opcionales
            'observaciones' => ['nullable', 'string', 'max:1000'],
            'canal' => ['nullable', 'string', 'in:PRESENCIAL,ONLINE,TELEFONO'],
        ];
    }

    /**
     * Get custom error messages.
     */
    public function messages(): array
    {
        return [
            'cliente_id.required' => 'El cliente es requerido',
            'cliente_id.exists' => 'El cliente seleccionado no existe',

            'fecha.required' => 'La fecha es requerida',
            'fecha.date_format' => 'La fecha debe tener el formato YYYY-MM-DD',

            'fecha_vencimiento.required' => 'La fecha de vencimiento es requerida',
            'fecha_vencimiento.after_or_equal' => 'La fecha de vencimiento debe ser igual o posterior a la fecha',

            'detalles.required' => 'Debe incluir al menos un producto',
            'detalles.min' => 'Debe incluir al menos un producto',

            'detalles.*.producto_id.required' => 'Cada detalle debe tener un producto',
            'detalles.*.producto_id.exists' => 'El producto seleccionado no existe',

            'detalles.*.cantidad.required' => 'La cantidad es requerida',
            'detalles.*.cantidad.min' => 'La cantidad debe ser mayor a 0',

            'subtotal.required' => 'El subtotal es requerido',
            'impuesto.required' => 'El impuesto es requerido',
            'total.required' => 'El total es requerido',
        ];
    }
}
