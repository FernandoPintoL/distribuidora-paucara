@extends('impresion.layouts.base-ticket')

@section('titulo', 'Venta #' . $documento->numero)

@section('contenido')

<div class="separador"></div>

{{-- ==================== INFO DEL DOCUMENTO ==================== --}}
<div class="documento-titulo" style="font-size:12px;">{{ $documento->tipoDocumento->nombre ?? 'Folio: ' }} N°{{ $documento->id }}</div>
<div class="documento-numero" style="font-size:12px;">{{ $documento->numero }}</div>
<div class="center" style="margin-top: 3px; font-size:12px">
    <p style="margin: 2px 0;"><strong>Creado:</strong> {{ $documento->created_at->format('d/m/Y H:i') }}</p>
    <p style="margin: 2px 0;"><strong>Emisión:</strong> {{ now()->format('d/m/Y H:i') }}</p>
</div>

<div class="separador"></div>

{{-- ==================== INFO DEL CLIENTE ==================== --}}
<div class="documento-info" style="font-size:12px;">
    <p><strong>Cliente:</strong> {{ $documento->cliente->nombre }}</p>
    @if($documento->cliente->razon_social)
    <p><strong>Razon Social:</strong> {{ $documento->cliente->razon_social }}</p>
    @endif
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
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            @if($documento->usuario)
            <td style="width: 50%; padding: 2px 5px 2px 0;"><strong>Vendedor:</strong> {{ $documento->usuario->name }}</td>
            @endif
            @if($documento->movimientoCaja && $documento->movimientoCaja->caja)
            <td style="width: 50%; padding: 2px 0;"><strong>Caja:</strong> {{ $documento->movimientoCaja->caja->nombre }}</td>
            @endif
        </tr>
    </table>
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

@if($documento->movimientoCaja)
<div class="documento-info" style="font-size:13px;">
    
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

{{-- ==================== ITEMS ==================== --}}
@include('impresion.ventas.partials._items', ['formato' => 'ticket-80'])

<div class="separador-doble"></div>

{{-- ==================== TOTALES ==================== --}}
@include('impresion.ventas.partials._totales')


<div class="separador"></div>

@endsection
