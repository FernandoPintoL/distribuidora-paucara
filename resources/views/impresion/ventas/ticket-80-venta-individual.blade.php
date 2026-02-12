@extends('impresion.layouts.base-a4')

@section('titulo', 'Venta Ticket')

@section('contenido')

@php
    $venta = $ventas->first();

    if (!$venta) {
        echo '<p style="text-align: center; color: #e74c3c;">No hay datos de venta para mostrar</p>';
        return;
    }

    // Funciones helper para extraer datos
    function obtenerCliente($venta) {
        if (is_array($venta) && isset($venta['cliente'])) {
            $cli = $venta['cliente'];
            return is_array($cli) ? ($cli['nombre'] ?? '-') : (is_object($cli) ? ($cli->nombre ?? '-') : '-');
        }
        return is_object($venta) && isset($venta->cliente) ? ($venta->cliente->nombre ?? '-') : '-';
    }

    function obtenerFecha($venta) {
        $fecha = is_array($venta) && isset($venta['fecha'])
            ? $venta['fecha']
            : (is_object($venta) && isset($venta->fecha) ? $venta->fecha : null);
        if (!$fecha) return '-';
        return is_string($fecha) ? date('d/m/Y', strtotime($fecha)) : $fecha->format('d/m/Y');
    }

    function obtenerEstado($venta) {
        if (is_array($venta) && isset($venta['estado_documento'])) {
            $est = $venta['estado_documento'];
            return is_array($est) ? ($est['nombre'] ?? '-') : (is_object($est) ? ($est->nombre ?? '-') : '-');
        }
        return is_object($venta) && isset($venta->estadoDocumento) ? ($venta->estadoDocumento->nombre ?? '-') : '-';
    }

    function obtenerSubtotal($venta) {
        if (is_array($venta) && isset($venta['subtotal'])) {
            return (float)$venta['subtotal'];
        }
        return is_object($venta) && isset($venta->subtotal) ? (float)$venta->subtotal : 0;
    }

    function obtenerTotal($venta) {
        if (is_array($venta) && isset($venta['total'])) {
            return (float)$venta['total'];
        }
        return is_object($venta) && isset($venta->total) ? (float)$venta->total : 0;
    }

    function obtenerDescuento($venta) {
        if (is_array($venta) && isset($venta['descuento'])) {
            return (float)$venta['descuento'];
        }
        return is_object($venta) && isset($venta->descuento) ? (float)$venta->descuento : 0;
    }

    $cliente = obtenerCliente($venta);
    $fecha = obtenerFecha($venta);
    $estado = obtenerEstado($venta);
    $subtotal = obtenerSubtotal($venta);
    $total = obtenerTotal($venta);
    $descuento = obtenerDescuento($venta);
@endphp

{{-- Información del documento --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2 style="color: #27ae60; font-size: 14px;">VENTA TICKET</h2>
            <p style="font-size: 8px;"><strong>Cliente:</strong> {{ $cliente }}</p>
            <p style="font-size: 8px;"><strong>Fecha:</strong> {{ $fecha }}</p>
            <p style="font-size: 8px;"><strong>Estado:</strong> {{ $estado }}</p>
        </div>
    </div>
</div>

{{-- Tabla de productos (compacta para ticket) --}}
<table class="tabla-productos" style="font-size: 8px;">
    <thead>
        <tr>
            <th style="width: 40%;">Producto</th>
            <th style="width: 20%;" class="text-right">Cant</th>
            <th style="width: 20%;" class="text-right">P.U.</th>
            <th style="width: 20%;" class="text-right">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @php
            $detalles = is_array($venta) && isset($venta['detalles'])
                ? $venta['detalles']
                : (is_object($venta) && isset($venta->detalles) ? $venta->detalles->toArray() : []);
        @endphp

        @forelse($detalles as $index => $detalle)
            @php
                $prod = is_array($detalle) ? ($detalle['producto'] ?? null) : (is_object($detalle) ? ($detalle->producto ?? null) : null);
                $nombre = '-';
                $sku = '-';

                if ($prod) {
                    $nombre = is_array($prod) ? ($prod['nombre'] ?? '-') : (is_object($prod) ? ($prod->nombre ?? '-') : '-');
                    $sku = is_array($prod) ? ($prod['sku'] ?? '') : (is_object($prod) ? ($prod->sku ?? '') : '');
                }

                $cantidad = is_array($detalle) ? ($detalle['cantidad'] ?? 0) : (is_object($detalle) ? ($detalle->cantidad ?? 0) : 0);
                $precioUnitario = is_array($detalle) ? ($detalle['precio_unitario'] ?? 0) : (is_object($detalle) ? ($detalle->precio_unitario ?? 0) : 0);
                $subtotalDetalle = $cantidad * $precioUnitario;
            @endphp
            <tr style="font-size: 7px;">
                <td>
                    <strong>{{ $nombre }}</strong>
                    @if($sku)
                        <br><span style="font-size: 6px; color: #7f8c8d;">SKU: {{ $sku }}</span>
                    @endif
                </td>
                <td class="text-right">{{ number_format($cantidad, 0) }}</td>
                <td class="text-right">Bs{{ number_format($precioUnitario, 2) }}</td>
                <td class="text-right"><strong>Bs{{ number_format($subtotalDetalle, 2) }}</strong></td>
            </tr>
        @empty
            <tr>
                <td colspan="4" style="text-align: center; padding: 10px; color: #7f8c8d; font-size: 7px;">
                    Sin productos
                </td>
            </tr>
        @endforelse
    </tbody>
</table>

{{-- Resumen de totales (con borde) --}}
<div style="margin-top: 10px; border: 1px solid #333; padding: 8px; text-align: right;">
    @if($descuento > 0)
    <p style="font-size: 8px; margin: 2px 0;">
        <strong>Desc:</strong> -Bs{{ number_format($descuento, 2) }}
    </p>
    @endif
    <p style="font-size: 10px; margin: 4px 0; font-weight: bold; color: #27ae60; border-top: 1px solid #333; padding-top: 4px;">
        TOTAL: Bs{{ number_format($total, 2) }}
    </p>
</div>

{{-- Nota de documentación --}}
<div class="observaciones" style="margin-top: 8px; border-left-color: #27ae60; background: #f9f9f9; font-size: 7px; padding: 5px;">
    <p style="margin: 0; font-size: 7px;">
        Venta generada {{ now()->format('d/m/Y H:i') }}
    </p>
</div>

@endsection
