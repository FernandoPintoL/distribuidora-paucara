@extends('impresion.layouts.base-ticket-58')

@section('titulo', 'Listado de Stock')

@section('contenido')
<div style="text-align: center; margin-bottom: 8px;">
    <h2 style="font-size: 12px; margin: 3px 0; color: #3498db;">STOCK</h2>
    <p style="font-size: 8px; margin: 1px 0;">{{ now()->format('d/m/Y H:i') }}</p>
</div>

<div style="border-top: 1px dashed #000; padding-top: 3px; margin-bottom: 3px;">
    <table style="width: 100%; font-size: 7px;">
        <tr>
            <td>Registros:</td>
            <td style="text-align: right;">{{ count($stock) }}</td>
        </tr>
        <tr>
            <td>Total:</td>
            <td style="text-align: right;">{{ number_format($stock->sum('cantidad'), 2) }}</td>
        </tr>
    </table>
</div>

<div style="border-top: 1px dashed #000; border-bottom: 1px dashed #000; padding: 2px 0; font-size: 7px;">
    @foreach($stock as $item)
    <div style="margin-bottom: 5px;">
        <p style="margin: 0; font-weight: bold; font-size: 6px;">{{ substr($item['producto_nombre'], 0, 20) }}</p>
        <div style="display: flex; justify-content: space-between;">
            <span>{{ $item['almacen_nombre'] }}</span>
            <span style="font-weight: bold;">{{ number_format($item['cantidad'], 2) }}</span>
        </div>
    </div>
    @endforeach
</div>

<div style="text-align: center; font-size: 6px; margin-top: 5px;">Referencia</div>
@endsection
