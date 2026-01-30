@extends('impresion.layouts.base-ticket')

@section('titulo', 'Compra #' . $compra->numero)

@section('contenido')

<div class="separador"></div>

{{-- ==================== INFO DEL DOCUMENTO ==================== --}}
<div class="documento-titulo">COMPRA</div>
<div class="documento-numero"># {{ $compra->id }} | {{ $compra->numero }}</div>
<div class="center" style="margin-top: 3px; font-size: 12px;">
    {{ $compra->fecha->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- ==================== INFO DEL PROVEEDOR ==================== --}}
<div class="documento-info">
    <p><strong>Proveedor:</strong> {{ $compra->proveedor->nombre }}</p>
    @if($compra->proveedor->nit)
    <p><strong>NIT:</strong> {{ $compra->proveedor->nit }}</p>
    @endif
    @if($compra->usuario)
    <p><strong>Recibido:</strong> {{ $compra->usuario->name }}</p>
    @endif
</div>

<div class="separador"></div>

{{-- ==================== ITEMS ==================== --}}
@include('impresion.compras.partials._items', ['formato' => 'ticket-80'])

<div class="separador-doble"></div>

{{-- ==================== MONTO DESTACADO ==================== --}}
<div style="text-align: center; margin: 10px 0; padding: 10px 0; border: 2px solid #282B29;">
    <div style="font-size: 14px; color: #080808; font-weight: bold;">
        TOTAL: {{ $compra->moneda->simbolo ?? 'Bs' }} {{ number_format($compra->total, 2) }}
    </div>
</div>

{{-- ==================== INFORMACIÓN DE PAGO ==================== --}}
<div style="font-size: 12px;">
    <p><strong>Tipo Pago:</strong> {{ $compra->tipoPago->nombre ?? 'N/A' }}</p>
    @if($compra->numero_factura)
    <p><strong>Factura:</strong> {{ $compra->numero_factura }}</p>
    @endif
</div>

{{-- ==================== ALMACÉN ==================== --}}
@if($compra->almacen)
<div style="font-size: 12px; margin-top: 8px; padding: 8px 0; border-top: 1px solid #ddd;">
    <p><strong>Almacén:</strong> {{ $compra->almacen->nombre }}</p>
</div>
@endif

<div class="separador"></div>

{{-- ==================== OBSERVACIONES ==================== --}}
@if($compra->observaciones)
<div class="observaciones" style="font-size: 12px;">
    <strong>Obs:</strong> {{ Str::limit($compra->observaciones, 100) }}
</div>
<div class="separador"></div>
@endif

@endsection
