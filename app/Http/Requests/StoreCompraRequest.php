<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreCompraRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'numero' => 'nullable|string|unique:compras,numero',
            'fecha' => 'required|date',
            'numero_factura' => 'nullable|string',
            'subtotal' => 'required|numeric|min:0',
            'descuento' => 'nullable|numeric|min:0',
            'impuesto' => 'nullable|numeric|min:0',
            'total' => 'required|numeric|min:0',
            'observaciones' => 'nullable|string',
            'proveedor_id' => 'required|exists:proveedores,id',
            'usuario_id' => 'required|exists:users,id',
            'estado_documento_id' => 'required|exists:estados_documento,id',
            'moneda_id' => 'required|exists:monedas,id',
            'tipo_pago_id' => 'nullable|exists:tipos_pago,id',
            'detalles' => 'required|array|min:1',
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
