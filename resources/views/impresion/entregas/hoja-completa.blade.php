@extends('impresion.layouts.base-a4')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('estilos-adicionales')
<style>
    .entrega-header {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 15px;
        margin-bottom: 10px;
    }

    .entrega-header-item {
        font-size: 8px;
    }

    .entrega-header-item p {
        margin: 2px 0;
        line-height: 1.3;
    }

    .entrega-header-item strong {
        min-width: 80px;
        display: inline-block;
    }

    .estado-badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 2px;
        font-size: 8px;
        font-weight: bold;
    }

    .documento-info {
        margin-bottom: 8px;
        padding: 0;
        background: transparent;
        border: none;
    }

    .documento-info-grid {
        gap: 10px;
    }

    table.tabla-productos {
        margin: 8px 0;
    }

    table.tabla-productos tbody td {
        padding: 4px 3px;
        font-size: 8px;
    }

    table.tabla-productos thead th {
        padding: 5px 3px;
        font-size: 8px;
    }

    .totales {
        margin-top: 10px;
        margin-bottom: 30px;
    }

    .totales table {
        width: 250px;
    }

    .totales td {
        padding: 3px 8px;
        font-size: 9px;
    }

    .observaciones {
        margin-top: 8px;
        padding: 6px;
        font-size: 8px;
    }

    .observaciones strong {
        font-size: 8px;
        margin-bottom: 2px;
    }

    h2 {
        font-size: 14px;
        margin-bottom: 8px;
        margin-top: 0;
    }
</style>
@endsection

@section('contenido')

{{-- Header compacto de entrega --}}
<div class="documento-info">
    <h2 style="color: #4F81BD; margin: 0 0 8px 0;">ENTREGA #{{ $entrega->numero_entrega }}</h2>

    <div class="entrega-header">
        <div class="entrega-header-item">
            <p><strong>Fecha:</strong> {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }}</p>
            @if($entrega->fecha_entrega)
            <p><strong>Entregado:</strong> {{ $entrega->fecha_entrega->format('d/m/Y H:i') }}</p>
            @endif
            <p><strong>Estado:</strong>
                <span class="estado-badge"
                    @if($entrega->estado === 'PENDIENTE' || $entrega->estado === 'PROGRAMADO') style="background: #fff3cd; color: #856404;"
                    @elseif($entrega->estado === 'EN_CAMINO' || $entrega->estado === 'EN_TRANSITO') style="background: #cfe2ff; color: #084298;"
                    @elseif($entrega->estado === 'ENTREGADO') style="background: #d4edda; color: #155724;"
                    @elseif($entrega->estado === 'NOVEDAD' || $entrega->estado === 'RECHAZADO') style="background: #f8d7da; color: #721c24;"
                    @elseif($entrega->estado === 'CANCELADA') style="background: #e2e3e5; color: #383d41;"
                    @endif">
                    {{ $entrega->estado }}
                </span>
            </p>
        </div>
        <div class="entrega-header-item">
            <p><strong>Chofer:</strong> {{ $entrega->chofer?->nombre ?? 'Sin asignar' }}</p>
            @if($entrega->vehiculo)
            <p><strong>Vehículo:</strong> {{ $entrega->vehiculo->placa }}</p>
            @endif
            @if($entrega->peso_kg)
            <p><strong>Peso:</strong> {{ number_format($entrega->peso_kg, 2) }} kg</p>
            @endif
        </div>
    </div>
</div>

{{-- Tabla compacta de productos --}}
<table class="tabla-productos">
    <thead>
        <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 20%;">Cliente</th>
            <th style="width: 40%;">Producto</th>
            <th style="width: 8%;">Cant.</th>
            <th style="width: 10%;">P.Unit.</th>
            <th style="width: 18%; text-align: right;">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @php $itemNum = 1; @endphp
        @forelse($entrega->ventas as $venta)
            @foreach($venta->detalles as $index => $detalle)
            <tr>
                <td>{{ $itemNum }}</td>
                <td>{{ $index === 0 ? substr($venta->cliente->nombre, 0, 25) : '' }}</td>
                <td style="font-size: 8px;">
                    {{ substr($detalle->producto->nombre, 0, 40) }}
                    @if($detalle->producto->codigo)<br><span style="color: #999; font-size: 7px;">{{ $detalle->producto->codigo }}</span>@endif
                </td>
                <td style="text-align: center;">{{ number_format($detalle->cantidad, 2) }}</td>
                <td style="text-align: right;">{{ number_format($detalle->precio_unitario, 2) }}</td>
                <td style="text-align: right; font-weight: bold;">{{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            @php $itemNum++; @endphp
            @endforeach
        @empty
        <tr>
            <td colspan="6" style="text-align: center; color: #999; padding: 10px;">Sin ventas asignadas</td>
        </tr>
        @endforelse
    </tbody>
</table>

{{-- Totales --}}
<div class="totales">
    <table>
        @php
            $subtotal = 0;
            foreach($entrega->ventas as $venta) {
                $subtotal += $venta->detalles->sum('subtotal');
            }
        @endphp
        <tr>
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">{{ number_format($subtotal, 2) }}</td>
        </tr>
        <tr class="total-final">
            <td><strong>TOTAL:</strong></td>
            <td class="text-right"><strong>{{ number_format($subtotal, 2) }}</strong></td>
        </tr>
    </table>
</div>

{{-- Observaciones si existen --}}
@if($entrega->observaciones)
<div class="observaciones">
    <strong>Observaciones:</strong> {{ substr($entrega->observaciones, 0, 100) }}{{ strlen($entrega->observaciones) > 100 ? '...' : '' }}
</div>
@endif

@endsection
