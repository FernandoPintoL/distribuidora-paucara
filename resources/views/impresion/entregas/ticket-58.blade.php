@extends('impresion.layouts.base-ticket')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('contenido')
{{-- Logo --}}
@if($logo_principal_base64)
<div style="text-align: center; margin-bottom: 2px;">
    <img src="{{ $logo_principal_base64 }}" style="max-width: 40px; max-height: 25px; object-fit: contain;">
</div>
@endif

<div class="documento-titulo" style="font-size: 9px; margin: 1px 0;">ENTREGA</div>
<div class="documento-numero" style="font-size: 10px; font-weight: bold;">#{{ $entrega->numero_entrega }}</div>
<div class="center" style="font-size: 5px; margin-bottom: 2px;">{{ $entrega->fecha_asignacion->format('d/m/y') }}</div>

<div class="separador"></div>

{{-- Detalles Compactos por Venta --}}
@forelse($entrega->ventas as $venta)
<div style="font-size: 5px; margin-bottom: 3px;">
    <p style="margin: 0.5px 0; font-weight: bold;">#{{ $venta->numero }}</p>
    <p style="margin: 0.5px 0;">{{ substr($venta->cliente->nombre, 0, 25) }}</p>
</div>

<table style="width: 100%; font-size: 5px; margin-bottom: 2px; border-collapse: collapse;">
    <tbody>
        @foreach($venta->detalles as $detalle)
        <tr>
            <td style="padding: 0.5px 0;">{{ substr($detalle->producto->nombre, 0, 18) }}</td>
            <td style="padding: 0.5px 0; text-align: center; width: 12%;">{{ number_format($detalle->cantidad, 0) }}</td>
            <td style="padding: 0.5px 0; text-align: right; width: 18%; font-weight: bold;">{{ number_format($detalle->subtotal, 2) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<div style="border-top: 1px dashed #000; padding-top: 1px; margin-bottom: 3px; font-size: 5px;">
    <div style="text-align: right;">Sub: {{ number_format($venta->detalles->sum('subtotal'), 2) }}</div>
</div>

@empty
<div style="text-align: center; font-size: 5px;">Sin ventas</div>
@endforelse

{{-- Resumen Chofer --}}
<div style="margin-top: 5px; padding-top: 2px; border-top: 2px solid #000;">
    <p style="font-size: 5px; font-weight: bold; text-align: center; margin: 1px 0;">RESUMEN</p>

    <table style="width: 100%; font-size: 5px; border-collapse: collapse;">
        <tbody>
            @php
            $totalGeneral = 0;
            $ventasCount = 0;
            @endphp
            @foreach($entrega->ventas as $venta)
            @php
            $subtotalVenta = $venta->detalles->sum('subtotal');
            $totalGeneral += $subtotalVenta;
            $ventasCount++;
            @endphp
            <tr style="border-bottom: 1px dotted #000;">
                <td style="padding: 1px;">#{{ $venta->numero }}</td>
                <td style="padding: 1px; text-align: right; font-weight: bold;">{{ number_format($subtotalVenta, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="border-top: 2px solid #000; margin-top: 1px; padding-top: 1px;">
        <p style="font-size: 5px; font-weight: bold; text-align: right; margin: 1px 0;">{{ number_format($totalGeneral, 2) }}</p>
        <p style="font-size: 4px; text-align: right; margin: 0.5px 0;">{{ $entrega->chofer?->nombre ?? 'S/A' }}</p>
    </div>
</div>

<div class="separador"></div>
<div class="center" style="font-size: 4px;">{{ $fecha_generacion }}</div>

@endsection
