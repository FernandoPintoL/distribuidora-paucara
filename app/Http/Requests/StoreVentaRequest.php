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
            'detalles.*.precio_unitario' => 'required|numeric|min:0.01|max:999999.99', // Problema #10: > 0 y razonable
            'detalles.*.descuento'       => 'nullable|numeric|min:0',
            'detalles.*.subtotal'        => 'required|numeric|min:0.01',
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

    /**
     * Configure el validador para agregar validaciones personalizadas
     *
     * Problema #9: Validar coherencia de cálculos
     * Problema #11: Validar que cliente esté activo
     * Problema #14: Validar que moneda esté activa
     */
    public function withValidator($validator)
    {
        $validator->after(function ($validator) {
            $data = $validator->getData();

            // Validar coherencia de cálculos de detalles
            if (isset($data['detalles']) && is_array($data['detalles'])) {
                $subtotalCalculado = 0;

                foreach ($data['detalles'] as $index => $detalle) {
                    // Validar que subtotal del detalle sea correcto
                    $cantidad = $detalle['cantidad'] ?? 0;
                    $precioUnitario = $detalle['precio_unitario'] ?? 0;
                    $descuentoDetalle = $detalle['descuento'] ?? 0;

                    $subtotalEsperado = ($cantidad * $precioUnitario) - $descuentoDetalle;
                    $subtotalRecibido = $detalle['subtotal'] ?? 0;

                    // Usar tolerancia para decimales (0.01)
                    if (abs($subtotalEsperado - $subtotalRecibido) > 0.01) {
                        $validator->errors()->add(
                            "detalles.{$index}.subtotal",
                            "El subtotal del detalle no coincide. Esperado: " . number_format($subtotalEsperado, 2) .
                            ", Recibido: " . number_format($subtotalRecibido, 2)
                        );
                    }

                    $subtotalCalculado += $subtotalRecibido;
                }

                // Validar que subtotal de la venta coincida con suma de detalles
                $subtotalVenta = $data['subtotal'] ?? 0;
                if (abs($subtotalCalculado - $subtotalVenta) > 0.01) {
                    $validator->errors()->add(
                        'subtotal',
                        "El subtotal no coincide con la suma de los detalles. Esperado: " .
                        number_format($subtotalCalculado, 2) . ", Recibido: " . number_format($subtotalVenta, 2)
                    );
                }

                // Validar que total sea correcto (subtotal - descuento + impuesto)
                $descuento = $data['descuento'] ?? 0;
                $impuesto = $data['impuesto'] ?? 0;
                $totalCalculado = $subtotalVenta - $descuento + $impuesto;
                $totalRecibido = $data['total'] ?? 0;

                if (abs($totalCalculado - $totalRecibido) > 0.01) {
                    $validator->errors()->add(
                        'total',
                        "El total no coincide con el cálculo. Esperado: " . number_format($totalCalculado, 2) .
                        ", Recibido: " . number_format($totalRecibido, 2)
                    );
                }
            }

            // Validar que el cliente esté activo
            if (isset($data['cliente_id'])) {
                $cliente = \App\Models\Cliente::find($data['cliente_id']);
                if ($cliente && !$cliente->activo) {
                    $validator->errors()->add(
                        'cliente_id',
                        "El cliente '{$cliente->nombre}' está desactivado. Active el cliente antes de continuar."
                    );
                }
            }

            // Validar que la moneda esté activa
            if (isset($data['moneda_id'])) {
                $moneda = \App\Models\Moneda::find($data['moneda_id']);
                if ($moneda && !$moneda->activo) {
                    $validator->errors()->add(
                        'moneda_id',
                        "La moneda '{$moneda->nombre}' está desactivada. Active la moneda antes de continuar."
                    );
                }
            }
        });
    }
}
