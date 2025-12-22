@extends('impresion.layouts.base-ticket')

@section('titulo', 'Ticket #' . $documento->numero)

@section('contenido')
<div class="separador"></div>

{{-- Info del documento --}}
<div class="documento-titulo">{{ $documento->tipoDocumento->nombre ?? 'FACTURA' }}</div>
<div class="documento-numero">#{{ $documento->numero }}</div>
<div class="center" style="margin-top: 3px; font-size: 7px;">
    {{ $documento->fecha->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- Info del cliente --}}
<div class="documento-info">
    <p><strong>Cliente:</strong> {{ $documento->cliente->nombre }}</p>
    @if($documento->cliente->nit)
        <p><strong>NIT/CI:</strong> {{ $documento->cliente->nit }}</p>
    @endif
    @if($documento->usuario)
        <p><strong>Vendedor:</strong> {{ $documento->usuario->name }}</p>
    @endif
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
    <tr><td colspan="3" style="height: 3px;"></td></tr>
    @endforeach
</table>

<div class="separador-doble"></div>

{{-- Totales --}}
<div class="totales">
    <table>
        <tr>
            <td>Subtotal:</td>
            <td class="right">{{ number_format($documento->subtotal, 2) }}</td>
        </tr>
        @if($documento->descuento > 0)
        <tr>
            <td>Descuento:</td>
            <td class="right">-{{ number_format($documento->descuento, 2) }}</td>
        </tr>
        @endif
        @if($documento->impuesto > 0)
        <tr>
            <td>Impuesto:</td>
            <td class="right">{{ number_format($documento->impuesto, 2) }}</td>
        </tr>
        @endif
        <tr class="total-final">
            <td><strong>TOTAL {{ $documento->moneda->codigo ?? 'BOB' }}:</strong></td>
            <td class="right"><strong>{{ number_format($documento->total, 2) }}</strong></td>
        </tr>
    </table>
</div>

<div class="separador-doble"></div>

{{-- Info de pago --}}
<div class="center bold" style="font-size: 8px;">
    {{ $documento->tipoPago->nombre ?? 'Contado' }}
</div>

@if($documento->tipoPago && $documento->tipoPago->codigo !== 'CONTADO')
<div class="center" style="font-size: 7px; margin-top: 3px;">
    Pendiente: {{ number_format($documento->monto_pendiente ?? $documento->total, 2) }}
</div>
@endif

{{-- Observaciones --}}
@if($documento->observaciones)
<div class="observaciones">
    <strong>Obs:</strong>
    {{ Str::limit($documento->observaciones, 100) }}
</div>
@endif
@endsection
