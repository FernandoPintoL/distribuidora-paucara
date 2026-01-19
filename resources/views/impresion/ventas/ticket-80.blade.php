@extends('impresion.layouts.base-ticket')

@section('titulo', 'Ticket #' . $documento->numero)

@section('contenido')

<div class="separador"></div>

{{-- ==================== INFO DEL DOCUMENTO ==================== --}}
<div class="documento-titulo">{{ $documento->tipoDocumento->nombre ?? 'FACTURA' }}</div>
<div class="documento-numero">#{{ $documento->numero }}</div>
<div class="center" style="margin-top: 3px; font-size: 7px;">
    {{ $documento->fecha->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- ==================== INFO DEL CLIENTE ==================== --}}
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

{{-- ==================== ITEMS ==================== --}}
@include('impresion.ventas.partials._items', ['formato' => 'ticket-80'])

<div class="separador-doble"></div>

{{-- ==================== TOTALES ==================== --}}
@include('impresion.ventas.partials._totales')

<div class="separador-doble"></div>

{{-- ==================== INFORMACIÓN DE PAGO ==================== --}}
<div class="center bold" style="font-size: 8px;">
    {{ $documento->politica_pago ?? 'CONTRA_ENTREGA' }}
</div>

@if($documento->estado_pago === 'PARCIAL' || $documento->estado_pago === 'PENDIENTE')
<div class="center" style="font-size: 7px; margin-top: 3px;">
    Estado: {{ $documento->estado_pago }}<br>
    Pendiente: {{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->monto_pendiente ?? $documento->subtotal, 2) }}
</div>
@elseif($documento->estado_pago === 'PAGADA')
<div class="center" style="font-size: 7px; margin-top: 3px; color: green;">
    ✓ PAGADA
</div>
@endif

{{-- ==================== OBSERVACIONES ==================== --}}
@if($documento->observaciones)
<div class="observaciones">
    <strong>Obs:</strong>
    {{ Str::limit($documento->observaciones, 100) }}
</div>
@endif

<div class="separador"></div>

{{-- ==================== QR CODE ==================== --}}
<div class="center">
    @include('impresion.ventas.partials._qr')
</div>

<div class="separador"></div>

{{-- ==================== CONTACTO ==================== --}}
<div class="center" style="font-size: 6px;">
    @if($empresa->telefono)
        Tel: {{ $empresa->telefono }}
    @endif
    @if($empresa->email)
        <br>{{ $empresa->email }}
    @endif
    <br>¡Gracias por su compra!
</div>

@endsection
