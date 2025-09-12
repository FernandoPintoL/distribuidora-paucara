<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $compraId = $this->route('compra');

        return [
            'numero' => 'sometimes|string|unique:compras,numero,'.$compraId,
            'fecha' => 'sometimes|date',
            'numero_factura' => 'nullable|string',
            'subtotal' => 'sometimes|numeric',
            'descuento' => 'nullable|numeric',
            'impuesto' => 'nullable|numeric',
            'total' => 'sometimes|numeric',
            'observaciones' => 'nullable|string',
            'proveedor_id' => 'sometimes|exists:proveedores,id',
            'usuario_id' => 'sometimes|exists:users,id',
            'estado_documento_id' => 'sometimes|exists:estados_documento,id',
            'moneda_id' => 'sometimes|exists:monedas,id',
            'tipo_pago_id' => 'nullable|exists:tipos_pago,id',
        ];
    }
}
