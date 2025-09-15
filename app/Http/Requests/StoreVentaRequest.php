<?php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreVentaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Ajustar según sistema de permisos
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'numero'                     => 'nullable|string|unique:ventas,numero',
            'fecha'                      => 'required|date',
            'subtotal'                   => 'required|numeric|min:0',
            'descuento'                  => 'nullable|numeric|min:0',
            'impuesto'                   => 'nullable|numeric|min:0',
            'total'                      => 'required|numeric|min:0',
            'observaciones'              => 'nullable|string|max:500',
            'cliente_id'                 => 'required|exists:clientes,id',
            'usuario_id'                 => 'required|exists:users,id',
            'estado_documento_id'        => 'required|exists:estados_documento,id',
            'moneda_id'                  => 'nullable|exists:monedas,id',
            'proforma_id'                => 'nullable|exists:proformas,id',
            'tipo_pago_id'               => 'nullable|exists:tipos_pago,id',
            'tipo_documento_id'          => 'nullable|exists:tipos_documento,id',
            'requiere_envio'             => 'nullable|boolean',
            'canal_origen'               => 'nullable|string|in:APP_EXTERNA,WEB,PRESENCIAL',
            'estado_logistico'           => 'nullable|string|in:PENDIENTE_ENVIO,PREPARANDO,ENVIADO,ENTREGADO',

            // Validación de detalles
            'detalles'                   => 'required|array|min:1',
            'detalles.*.producto_id'     => 'required|exists:productos,id',
            'detalles.*.cantidad'        => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.descuento'       => 'nullable|numeric|min:0',
            'detalles.*.subtotal'        => 'required|numeric|min:0',
        ];
    }

    /**
     * Get custom error messages for validator errors.
     */
    public function messages(): array
    {
        return [
            'numero.required'                     => 'El número de venta es requerido.',
            'numero.unique'                       => 'El número de venta ya existe.',
            'fecha.required'                      => 'La fecha es requerida.',
            'fecha.date'                          => 'La fecha debe ser válida.',
            'subtotal.required'                   => 'El subtotal es requerido.',
            'subtotal.numeric'                    => 'El subtotal debe ser numérico.',
            'subtotal.min'                        => 'El subtotal debe ser mayor a 0.',
            'total.required'                      => 'El total es requerido.',
            'total.numeric'                       => 'El total debe ser numérico.',
            'total.min'                           => 'El total debe ser mayor a 0.',
            'cliente_id.required'                 => 'El cliente es requerido.',
            'cliente_id.exists'                   => 'El cliente seleccionado no existe.',
            'usuario_id.required'                 => 'El usuario es requerido.',
            'usuario_id.exists'                   => 'El usuario seleccionado no existe.',
            'estado_documento_id.required'        => 'El estado del documento es requerido.',
            'estado_documento_id.exists'          => 'El estado del documento seleccionado no existe.',
            'moneda_id.required'                  => 'La moneda es requerida.',
            'moneda_id.exists'                    => 'La moneda seleccionada no existe.',

            'detalles.required'                   => 'Los detalles de venta son requeridos.',
            'detalles.array'                      => 'Los detalles deben ser un arreglo.',
            'detalles.min'                        => 'Debe incluir al menos un detalle de venta.',
            'detalles.*.producto_id.required'     => 'El producto es requerido en cada detalle.',
            'detalles.*.producto_id.exists'       => 'El producto seleccionado no existe.',
            'detalles.*.cantidad.required'        => 'La cantidad es requerida en cada detalle.',
            'detalles.*.cantidad.integer'         => 'La cantidad debe ser un número entero.',
            'detalles.*.cantidad.min'             => 'La cantidad debe ser mayor a 0.',
            'detalles.*.precio_unitario.required' => 'El precio unitario es requerido.',
            'detalles.*.precio_unitario.numeric'  => 'El precio unitario debe ser numérico.',
            'detalles.*.precio_unitario.min'      => 'El precio unitario debe ser mayor a 0.',
            'detalles.*.subtotal.required'        => 'El subtotal del detalle es requerido.',
            'detalles.*.subtotal.numeric'         => 'El subtotal del detalle debe ser numérico.',
            'detalles.*.subtotal.min'             => 'El subtotal del detalle debe ser mayor a 0.',
        ];
    }
}
