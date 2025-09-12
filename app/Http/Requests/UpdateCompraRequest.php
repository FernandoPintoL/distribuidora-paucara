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
            // Agregar validación de detalles para actualizaciones
            'detalles' => 'sometimes|array',
            'detalles.*.id' => 'nullable|exists:detalle_compras,id',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad' => 'required|integer|min:1',
            'detalles.*.precio_unitario' => 'required|numeric|min:0',
            'detalles.*.descuento' => 'nullable|numeric|min:0',
            'detalles.*.subtotal' => 'required|numeric|min:0',
            'detalles.*.lote' => 'nullable|string',
            'detalles.*.fecha_vencimiento' => 'nullable|date',
        ];
    }
}
