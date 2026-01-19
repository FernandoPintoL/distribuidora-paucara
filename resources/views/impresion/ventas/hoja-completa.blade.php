@extends('impresion.layouts.base-a4')

@section('titulo', 'Factura #' . $documento->numero)

@section('contenido')

{{-- ==================== INFORMACIÓN DEL DOCUMENTO ==================== --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2>{{ $documento->tipoDocumento->nombre ?? 'FACTURA' }} #{{ $documento->numero }}</h2>
            <p><strong>Fecha:</strong> {{ $documento->fecha->format('d/m/Y') }}</p>
            <p><strong>Moneda:</strong> {{ $documento->moneda->codigo ?? 'BOB' }}</p>
            @if($documento->estadoDocumento)
                <p><strong>Estado:</strong> {{ $documento->estadoDocumento->nombre }}</p>
            @endif
            @if($documento->usuario)
                <p><strong>Vendedor:</strong> {{ $documento->usuario->name }}</p>
            @endif
        </div>
        <div class="documento-info-seccion" style="text-align: right;">
            {{-- Cliente --}}
            @include('impresion.ventas.partials._cliente')
        </div>
    </div>
</div>

{{-- ==================== INFORMACIÓN DE ENTREGA (si aplica) ==================== --}}
@include('impresion.ventas.partials._direccion-entrega')

{{-- ==================== TABLA DE PRODUCTOS ==================== --}}
@include('impresion.ventas.partials._items', ['formato' => 'a4'])

{{-- ==================== TOTALES ==================== --}}
@include('impresion.ventas.partials._totales')

{{-- ==================== ESTADO LOGÍSTICO (si aplica) ==================== --}}
@include('impresion.ventas.partials._estado-logistico')

{{-- ==================== INFORMACIÓN DE PAGO ==================== --}}
@include('impresion.ventas.partials._informacion-pago')

{{-- ==================== OBSERVACIONES ==================== --}}
@include('impresion.ventas.partials._observaciones')

{{-- ==================== QR CODE ==================== --}}
@include('impresion.ventas.partials._qr')

{{-- ==================== TÉRMINOS Y CONDICIONES ==================== --}}
@include('impresion.ventas.partials._terminos-condiciones')

@endsection
