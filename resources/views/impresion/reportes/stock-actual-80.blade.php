@extends('impresion.layouts.base-ticket')

@section('titulo', 'Reporte Stock Actual')

@section('contenido')
<div class="separador-doble"></div>

<div class="center">
    <h2 style="margin: 0; font-size: 12px; font-weight: bold;">REPORTE DE STOCK ACTUAL</h2>
    <p style="margin: 2px 0; font-size: 9px;">{{ now()->format('d/m/Y H:i') }}</p>
</div>

<div class="separador-doble"></div>

<!-- Encabezados -->
<table style="width: 100%; font-size: 8px; border-collapse: collapse;">
    <tr style="border-bottom: 1px solid #000;">
        <td style="padding: 3px; font-weight: bold; width: 20%;">Almacén</td>
        <td style="padding: 3px; font-weight: bold; width: 15%;">Código</td>
        <td style="padding: 3px; font-weight: bold; width: 20%;">Producto</td>
        <td style="padding: 3px; font-weight: bold; text-align: right; width: 10%;">Cant</td>
        <td style="padding: 3px; font-weight: bold; text-align: right; width: 15%;">P.Comp</td>
        <td style="padding: 3px; font-weight: bold; text-align: right; width: 20%;">V.Total</td>
    </tr>
</table>

<div class="separador"></div>

<!-- Filas de datos -->
@forelse($datos as $item)
<table style="width: 100%; font-size: 7px; margin-bottom: 1px;">
    <tr>
        <td style="padding: 2px; width: 20%;">{{ substr($item['almacen'], 0, 15) }}</td>
        <td style="padding: 2px; width: 15%;">{{ $item['codigo_producto'] }}</td>
        <td style="padding: 2px; width: 20%;">{{ substr($item['nombre_producto'], 0, 18) }}</td>
        <td style="padding: 2px; text-align: right; width: 10%;">{{ $item['cantidad'] }}</td>
        <td style="padding: 2px; text-align: right; width: 15%;">{{ number_format($item['precio_compra'], 2) }}</td>
        <td style="padding: 2px; text-align: right; width: 20%;">{{ number_format($item['valor_compra'], 2) }}</td>
    </tr>
</table>
@empty
<p style="font-size: 9px; text-align: center; color: #666;">No hay datos para mostrar</p>
@endforelse

<div class="separador-doble"></div>

<div style="font-size: 8px; text-align: center;">
    <p style="margin: 2px 0;">Reporte generado automáticamente</p>
    <p style="margin: 2px 0;">{{ config('app.name') }}</p>
</div>

@endsection
