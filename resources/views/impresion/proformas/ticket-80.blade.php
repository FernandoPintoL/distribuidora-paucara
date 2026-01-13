@extends('impresion.layouts.base-ticket')

@section('titulo', 'Proforma #' . $documento->numero)

@section('contenido')
<div class="separador"></div>

{{-- Info del documento --}}
<div class="documento-titulo">PROFORMA (COTIZACIÓN)</div>
<div class="documento-numero">#{{ $documento->numero }}</div>
<div class="center" style="margin-top: 3px; font-size: 7px;">
    {{ $documento->fecha->format('d/m/Y') }}
</div>
<div class="center" style="font-size: 6px;">
    Válida hasta: {{ $documento->fecha_vencimiento ? $documento->fecha_vencimiento->format('d/m/Y') : 'N/A' }}
</div>

<div class="separador"></div>

{{-- Info del cliente --}}
<div class="documento-info">
    <p><strong>Cliente:</strong> {{ $documento->cliente->nombre }}</p>
    @if($documento->cliente->nit)
    <p><strong>NIT/CI:</strong> {{ $documento->cliente->nit }}</p>
    @endif
    <p><strong>Estado:</strong> {{ $documento->estado }}</p>
</div>

<div class="separador"></div>

{{-- Items --}}
<table class="items">
    @foreach($documento->detalles as $detalle)
    <tr>
        <td colspan="3" class="item-nombre">{{ $detalle->producto->nombre }}</td>
    </tr>
    @if($detalle->producto->codigo)
    <tr>
        <td colspan="3" class="item-detalle">Código: {{ $detalle->producto->codigo }}</td>
    </tr>
    @endif
    <tr>
        <td style="width: 50%;">
            {{ number_format($detalle->cantidad, 2) }} x {{ number_format($detalle->precio_unitario, 2) }}
        </td>
        <td style="width: 10%;"></td>
        <td style="width: 40%; text-align: right;">
            <strong>{{ number_format($detalle->subtotal, 2) }}</strong>
        </td>
    </tr>
    <tr>
        <td colspan="3" style="height: 3px;"></td>
    </tr>
    @endforeach
</table>

<div class="separador-doble"></div>

{{-- Totales --}}
<div class="totales">
    <table>
        {{-- <tr>
            <td>Subtotal:</td>
            <td class="right">{{ number_format($documento->subtotal, 2) }}</td>
        </tr> --}}
        {{-- @if($documento->descuento > 0)
        <tr>
            <td>Descuento:</td>
            <td class="right">-{{ number_format($documento->descuento, 2) }}</td>
        </tr>
        @endif --}}
        {{-- @if($documento->impuesto > 0)
        <tr>
            <td>Impuesto:</td>
            <td class="right">{{ number_format($documento->impuesto, 2) }}</td>
        </tr>
        @endif --}}
        <tr class="total-final">
            <td><strong>TOTAL {{ $documento->moneda->codigo ?? 'BOB' }}:</strong></td>
            <td class="right"><strong>{{ number_format($documento->subtotal, 2) }}</strong></td>
        </tr>
    </table>
</div>

<div class="separador"></div>

{{-- Nota --}}
<div class="center" style="font-size: 6px; margin-top: 5px;">
    <p style="margin: 2px 0;">Esta es una cotización</p>
    <p>No constituye documento fiscal</p>
</div>

{{-- Observaciones --}}
@if($documento->observaciones)
<div class="observaciones">
    <strong>Obs:</strong>
    {{ Str::limit($documento->observaciones, 100) }}
</div>
@endif
@endsection
