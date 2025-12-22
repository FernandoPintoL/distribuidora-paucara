@extends('impresion.layouts.base-a4')

@section('titulo', 'Factura #' . $documento->numero)

@section('contenido')
{{-- Información del documento --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2>
                {{ $documento->tipoDocumento->nombre ?? 'FACTURA' }} #{{ $documento->numero }}
            </h2>
            <p><strong>Fecha:</strong> {{ $documento->fecha->format('d/m/Y') }}</p>
            <p><strong>Cliente:</strong> {{ $documento->cliente->nombre }}</p>
            @if($documento->cliente->nit)
                <p><strong>NIT/CI:</strong> {{ $documento->cliente->nit }}</p>
            @endif
            @if($documento->cliente->direccion)
                <p><strong>Dirección:</strong> {{ $documento->cliente->direccion }}</p>
            @endif
            @if($documento->cliente->telefono)
                <p><strong>Teléfono:</strong> {{ $documento->cliente->telefono }}</p>
            @endif
        </div>
        <div class="documento-info-seccion" style="text-align: right;">
            <p><strong>Tipo de Pago:</strong> {{ $documento->tipoPago->nombre ?? 'Contado' }}</p>
            <p><strong>Moneda:</strong> {{ $documento->moneda->codigo ?? 'BOB' }}</p>
            @if($documento->estadoDocumento)
                <p><strong>Estado:</strong> {{ $documento->estadoDocumento->nombre }}</p>
            @endif
            @if($documento->usuario)
                <p><strong>Vendedor:</strong> {{ $documento->usuario->name }}</p>
            @endif
        </div>
    </div>
</div>

{{-- Tabla de productos --}}
<table class="tabla-productos">
    <thead>
        <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 45%;">Producto</th>
            <th style="width: 10%;">Cant.</th>
            <th style="width: 12%;">P. Unit.</th>
            <th style="width: 10%;">Desc.</th>
            <th style="width: 18%;" class="text-right">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @foreach($documento->detalles as $index => $detalle)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>
                <strong>{{ $detalle->producto->nombre }}</strong>
                @if($detalle->producto->codigo)
                    <br><small style="color: #666;">Código: {{ $detalle->producto->codigo }}</small>
                @endif
            </td>
            <td>{{ number_format($detalle->cantidad, 2) }}</td>
            <td>{{ number_format($detalle->precio_unitario, 2) }}</td>
            <td>{{ number_format($detalle->descuento ?? 0, 2) }}</td>
            <td class="text-right"><strong>{{ number_format($detalle->subtotal, 2) }}</strong></td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- Totales --}}
<div class="totales">
    <table>
        <tr class="subtotal-row">
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->subtotal, 2) }}</td>
        </tr>
        @if($documento->descuento > 0)
        <tr>
            <td><strong>Descuento:</strong></td>
            <td class="text-right">-{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->descuento, 2) }}</td>
        </tr>
        @endif
        @if($documento->impuesto > 0)
        <tr>
            <td><strong>Impuesto ({{ $opciones['porcentaje_impuesto'] ?? '13' }}%):</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->impuesto, 2) }}</td>
        </tr>
        @endif
        <tr class="total-final">
            <td><strong>TOTAL:</strong></td>
            <td class="text-right">
                <strong>{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->total, 2) }}</strong>
            </td>
        </tr>
    </table>
</div>

{{-- Observaciones --}}
@if($documento->observaciones)
<div class="observaciones">
    <strong>Observaciones:</strong>
    {{ $documento->observaciones }}
</div>
@endif

{{-- Información de pago si es al crédito --}}
@if($documento->tipoPago && $documento->tipoPago->codigo !== 'CONTADO')
<div class="observaciones" style="margin-top: 10px; border-left-color: #f39c12;">
    <strong>Información de Pago:</strong>
    <p style="margin-top: 5px;">
        Monto Pagado: {{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->monto_pagado ?? 0, 2) }}<br>
        Monto Pendiente: {{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->monto_pendiente ?? $documento->total, 2) }}
    </p>
</div>
@endif
@endsection
