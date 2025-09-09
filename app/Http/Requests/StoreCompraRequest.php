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
            'numero' => 'required|string|unique:compras,numero',
            'fecha' => 'required|date',
            'numero_factura' => 'nullable|string',
            'subtotal' => 'required|numeric',
            'descuento' => 'nullable|numeric',
            'impuesto' => 'nullable|numeric',
            'total' => 'required|numeric',
            'observaciones' => 'nullable|string',
            'proveedor_id' => 'required|exists:proveedores,id',
            'usuario_id' => 'required|exists:users,id',
            'estado_documento_id' => 'required|exists:estados_documento,id',
            'moneda_id' => 'required|exists:monedas,id',
            'detalles' => 'required|array',
            'detalles.*.producto_id' => 'required|exists:productos,id',
            'detalles.*.cantidad' => 'required|integer',
            'detalles.*.precio_unitario' => 'required|numeric',
            'detalles.*.descuento' => 'nullable|numeric',
            'detalles.*.subtotal' => 'required|numeric',
            'detalles.*.lote' => 'nullable|string',
            'detalles.*.fecha_vencimiento' => 'nullable|date',
        ];
    }
}
