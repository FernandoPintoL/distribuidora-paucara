@extends('impresion.layouts.base-ticket')

@section('titulo', 'Reporte Stock Actual')

@section('contenido')
<div class="separador"></div>

<div class="center">
    <h2 style="margin: 0; font-size: 10px; font-weight: bold;">STOCK ACTUAL</h2>
    <p style="margin: 2px 0; font-size: 7px;">{{ now()->format('d/m/Y H:i') }}</p>
</div>

<div class="separador"></div>

<!-- Encabezados -->
<table style="width: 100%; font-size: 7px; border-collapse: collapse;">
    <tr style="border-bottom: 1px solid #000;">
        <td style="padding: 2px; font-weight: bold; width: 25%;">Almacén</td>
        <td style="padding: 2px; font-weight: bold; width: 15%;">Cód</td>
        <td style="padding: 2px; font-weight: bold; width: 20%;">Producto</td>
        <td style="padding: 2px; font-weight: bold; text-align: right; width: 12%;">Cant</td>
        <td style="padding: 2px; font-weight: bold; text-align: right; width: 18%;">Valor</td>
    </tr>
</table>

<div class="separador"></div>

<!-- Filas de datos -->
@forelse($datos as $item)
<table style="width: 100%; font-size: 6px; margin-bottom: 1px;">
    <tr>
        <td style="padding: 1px; width: 25%;">{{ substr($item['almacen'], 0, 12) }}</td>
        <td style="padding: 1px; width: 15%;">{{ $item['codigo_producto'] }}</td>
        <td style="padding: 1px; width: 20%;">{{ substr($item['nombre_producto'], 0, 15) }}</td>
        <td style="padding: 1px; text-align: right; width: 12%;">{{ $item['cantidad'] }}</td>
        <td style="padding: 1px; text-align: right; width: 18%;">{{ number_format($item['valor_compra'], 2) }}</td>
    </tr>
</table>
@empty
<p style="font-size: 7px; text-align: center; color: #666;">Sin datos</p>
@endforelse

<div class="separador"></div>

<div style="font-size: 7px; text-align: center;">
    <p style="margin: 1px 0;">{{ config('app.name') }}</p>
</div>

@endsection
