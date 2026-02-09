@extends('impresion.layouts.base-ticket')

@section('titulo', 'Venta #' . $documento->numero)

@section('contenido')

<div class="separador"></div>

{{-- ==================== INFO DEL DOCUMENTO ==================== --}}
<div class="documento-titulo">{{ $documento->tipoDocumento->nombre ?? 'Folio: ' }} N°{{ $documento->id }}</div>
<div class="documento-numero">{{ $documento->numero }}</div>
<div class="center" style="margin-top: 3px;">
    <p style="margin: 2px 0;"><strong>Creado:</strong> {{ $documento->created_at->format('d/m/Y H:i') }}</p>
    <p style="margin: 2px 0;"><strong>Emisión:</strong> {{ now()->format('d/m/Y H:i') }}</p>
</div>

<div class="separador"></div>

{{-- ==================== INFO DEL CLIENTE ==================== --}}
<div class="documento-info">
    <p><strong>Cliente:</strong> {{ $documento->cliente->nombre }}</p>
    <p><strong>Cód. Cliente:</strong> #{{ $documento->cliente->id }} | {{ $documento->cliente->codigo_cliente }}</p>
    @if($documento->cliente->nit)
    <p><strong>NIT/CI:</strong> {{ $documento->cliente->nit }}</p>
    @endif
    {{-- ✅ NUEVO: Mostrar localidad del cliente --}}
    @if($documento->cliente->localidad)
    <p><strong>Localidad:</strong> {{ $documento->cliente->localidad->nombre ?? 'Sin localidad' }}</p>
    @endif
    {{-- ✅ NUEVO: Mostrar dirección registrada en la venta --}}
    {{-- @if($documento->direccionCliente)
    <p><strong>Dirección:</strong> {{ $documento->direccionCliente->direccion ?? 'Sin dirección' }}</p>
    @endif --}}
    @if($documento->direccionCliente)
    <p style="center"><strong>Dir:</strong> {{ $documento->direccionCliente->observaciones ?? 'Sin direccion' }}</p>
    @endif
    @if($documento->usuario)
    <p><strong>Vendedor:</strong> {{ $documento->usuario->name }}</p>
    @endif
    {{-- ✅ NUEVO: Mostrar usuario creador de la proforma si existe --}}
    @php
        $usuarioCreadorProforma = null;
        if ($documento->proforma_id && $documento->proforma) {
            $usuarioCreadorProforma = $documento->proforma->usuarioCreador;
        }
    @endphp
    @if($usuarioCreadorProforma)
    <p><strong>Preventista:</strong> {{ $usuarioCreadorProforma->name }}</p>
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
<div class="center bold" style="font-size: 12px;">
    Politica Pago: {{ $documento->politica_pago ?? 'CONTRA_ENTREGA' }}
</div>

<div class="center" style="margin-top: 5px; font-weight: bold;">
    @if($documento->estado_pago === 'PAGADA')
    <span>PAGADA</span>
    @elseif($documento->estado_pago === 'PARCIAL')
    <span>PAGO PARCIAL</span><br>
    <span>Pendiente: {{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->monto_pendiente ?? 0, 2) }}</span>
    @elseif($documento->estado_pago === 'PENDIENTE')
    <span>PENDIENTE PAGO</span><br>
    <span>Pendiente: {{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->monto_pendiente ?? $documento->subtotal, 2) }}</span>
    @else
    <span>{{ $documento->estado_pago ?? 'SIN ESTADO' }}</span>
    @endif
</div>

{{-- ==================== OBSERVACIONES ==================== --}}
@if($documento->observaciones)
<div class="observaciones">
    <strong>Obs:</strong>
    {{ Str::limit($documento->observaciones, 100) }}
</div>
@endif

<div class="separador"></div>

{{-- ==================== INFORMACIÓN DE CAJA Y ALMACÉN ==================== --}}
@if($documento->movimientoCaja)
<div class="documento-info">
    @if($documento->movimientoCaja->caja)
    <p><strong>Caja:</strong> {{ $documento->movimientoCaja->caja->nombre }}</p>
    @endif
    @if($documento->detalles && $documento->detalles->first())
    @php
    $primeraLinea = $documento->detalles->first();
    $almacen = null;
    if($primeraLinea && $primeraLinea->producto && $primeraLinea->producto->stock) {
    $stock = $primeraLinea->producto->stock->first();
    if($stock && $stock->almacen) {
    $almacen = $stock->almacen;
    }
    }
    @endphp
    @if($almacen)
    <p><strong>Almacén:</strong> {{ $almacen->nombre }}</p>
    @endif
    @endif
</div>
@endif

<div class="separador"></div>

{{-- ==================== QR CODE ==================== --}}
<div class="center">
    @include('impresion.ventas.partials._qr')
</div>

<div class="separador"></div>

@endsection
