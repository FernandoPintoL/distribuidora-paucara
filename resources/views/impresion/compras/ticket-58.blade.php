@extends('impresion.layouts.base-ticket')

@section('titulo', 'Compra #' . $compra->numero)

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

{{-- ==================== INFO DEL DOCUMENTO (compacta) ==================== --}}
<div class="documento-titulo">COMPRA</div>
<div class="center bold">#{{ $compra->numero }}</div>
<div class="center" style="font-size: 6px;">{{ $compra->fecha->format('d/m/Y H:i') }}</div>

<div class="separador"></div>

{{-- ==================== PROVEEDOR (muy compacto) ==================== --}}
<div style="font-size: 6px;">
    <p><strong>{{ $compra->proveedor->nombre }}</strong></p>
    @if($compra->proveedor->nit)
        <p>{{ $compra->proveedor->nit }}</p>
    @endif
</div>

<div class="separador-simple"></div>

{{-- ==================== MONTO DESTACADO (compacto) ==================== --}}
<div style="text-align: center; margin: 5px 0; padding: 5px 0; border: 1px solid #27ae60;">
    <div style="font-size: 12px; color: #27ae60; font-weight: bold;">
        {{ $compra->moneda->simbolo ?? 'Bs' }} {{ number_format($compra->total, 2) }}
    </div>
</div>

{{-- ==================== ITEMS (compactos) ==================== --}}
@include('impresion.compras.partials._items', ['formato' => 'ticket-58'])

<div class="separador-doble"></div>

{{-- ==================== INFORMACIÓN DE PAGO (compacta) ==================== --}}
<div style="font-size: 7px; text-align: center;">
    <p><strong>{{ $compra->tipoPago->nombre ?? 'PAGO' }}</strong></p>
</div>

{{-- ==================== ALMACÉN (compacto) ==================== --}}
@if($compra->almacen)
<div style="font-size: 6px; text-align: center; margin: 3px 0;">
    Almacén: {{ Str::limit($compra->almacen->nombre, 20) }}
</div>
@endif

<div class="separador-simple"></div>

{{-- ==================== CONTACTO COMPACTO ==================== --}}
<div class="center" style="font-size: 5px;">
    @if($empresa->telefono)
        T: {{ $empresa->telefono }}
    @endif
    <br>✓ Registrado
</div>

@endsection
