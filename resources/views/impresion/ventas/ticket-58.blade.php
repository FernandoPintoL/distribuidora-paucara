@extends('impresion.layouts.base-ticket')

@section('titulo', 'Ticket #' . $documento->numero)

@section('estilos-adicionales')
<style>
    /* Estilos más compactos para 58mm */
    body {
        font-size: 7px;
    }
    .empresa-nombre {
        font-size: 10px;
    }
    .documento-titulo {
        font-size: 9px;
    }
    table.items {
        font-size: 6px;
    }
    .totales {
        font-size: 7px;
    }
    .totales .total-final {
        font-size: 9px;
    }
</style>
@endsection

@section('contenido')
<div class="separador"></div>

{{-- Info del documento (compacta) --}}
<div class="documento-titulo">{{ $documento->tipoDocumento->nombre ?? 'VENTA' }}</div>
<div class="center bold">#{{ $documento->numero }}</div>
<div class="center" style="font-size: 6px;">{{ $documento->fecha->format('d/m/Y H:i') }}</div>

<div class="separador"></div>

{{-- Cliente (muy compacto) --}}
<div style="font-size: 6px;">
    <p><strong>{{ $documento->cliente->nombre }}</strong></p>
    @if($documento->cliente->nit)
        <p>{{ $documento->cliente->nit }}</p>
    @endif
</div>

<div class="separador-simple"></div>

{{-- Items (compactos) --}}
<table class="items">
    @foreach($documento->detalles as $detalle)
    <tr>
        <td colspan="2" style="font-weight: bold;">{{ Str::limit($detalle->producto->nombre, 25) }}</td>
    </tr>
    <tr>
        <td style="width: 60%;">
            {{ number_format($detalle->cantidad, 0) }} x {{ number_format($detalle->precio_unitario, 2) }}
        </td>
        <td style="width: 40%; text-align: right;">
            <strong>{{ number_format($detalle->subtotal, 2) }}</strong>
        </td>
    </tr>
    <tr><td colspan="2" style="height: 2px;"></td></tr>
    @endforeach
</table>

<div class="separador-doble"></div>

{{-- Totales (compactos) --}}
<div class="totales">
    <table>
        @if($documento->descuento > 0)
        <tr>
            <td>Subtotal:</td>
            <td class="right">{{ number_format($documento->subtotal + $documento->descuento, 2) }}</td>
        </tr>
        <tr>
            <td>Desc.:</td>
            <td class="right">-{{ number_format($documento->descuento, 2) }}</td>
        </tr>
        @endif
        {{-- @if($documento->impuesto > 0)
        <tr>
            <td>Imp.:</td>
            <td class="right">{{ number_format($documento->impuesto, 2) }}</td>
        </tr>
        @endif --}}
        <tr class="total-final">
            <td><strong>TOTAL:</strong></td>
            <td class="right"><strong>{{ number_format($documento->subtotal, 2) }}</strong></td>
        </tr>
    </table>
</div>

<div class="separador"></div>

<div class="center bold" style="font-size: 7px;">
    {{ $documento->tipoPago->nombre ?? 'Contado' }}
</div>
@endsection
