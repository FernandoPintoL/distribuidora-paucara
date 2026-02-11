@extends('impresion.layouts.base-ticket')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('contenido')
<div style="width: 100%; box-sizing: border-box;">
    {{-- Logo --}}

    <div class="documento-titulo" style="font-size: 8px; margin-bottom: 2px;">ENTREGA</div>
    <div class="documento-numero" style="font-size: 10px; font-weight: bold;">#{{ $entrega->numero_entrega }}</div>
    <div class="center" style="font-size: 5px; margin-bottom: 3px;">
        {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }} | {{ $entrega->estado }}
    </div>

    <div class="separador"></div>

    {{-- LISTA GENÉRICA COMPACTA --}}
    @php
    $impresionService = app(\App\Services\ImpresionEntregaService::class);
    $productosGenerico = $impresionService->obtenerProductosGenerico($entrega);
    $estadisticas = $impresionService->obtenerEstadisticas($entrega);
    @endphp

    <p style="font-size: 6px; font-weight: bold; text-align: center; margin: 2px 0; text-decoration: underline;">LISTA GENÉRICA</p>

    <table style="width: 100%; font-size: 5px; margin-bottom: 2px; border-collapse: collapse;">
        <tbody>
            @forelse($productosGenerico as $producto)
            <tr style="border-bottom: 1px dotted #999;">
                <td style="padding: 0.5px 0;">{{ substr($producto['producto_nombre'], 0, 20) }}</td>
                <td style="padding: 0.5px 0; text-align: center; width: 12%;">{{ number_format($producto['cantidad'], 1) }}</td>
                <td style="padding: 0.5px 0; text-align: right; width: 18%; font-weight: bold;">{{ number_format($producto['subtotal'], 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="3" style="text-align: center; padding: 2px; font-size: 4px; color: #999;">Sin productos</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div style="border-top: 1px dashed #000; padding: 1px 0; margin-bottom: 3px; font-size: 5px;">
        <div style="text-align: right; font-weight: bold;">Total: {{ number_format($estadisticas['total_subtotal'], 2) }}</div>
        <div style="font-size: 4px; color: #666;">{{ $estadisticas['total_productos'] }} items | {{ $estadisticas['total_clientes'] }} clientes</div>
    </div>

    <div class="separador"></div>

    {{-- RESUMEN PARA CHOFER --}}
    <p style="font-size: 6px; font-weight: bold; text-align: center; margin: 2px 0;">RESUMEN CHOFER</p>

    <table style="width: 100%; font-size: 5px; border-collapse: collapse;">
        <tbody>
            @php $totalGeneral = 0; @endphp
            @foreach($entrega->ventas as $venta)
            @php $subtotalVenta = $venta->detalles->sum('subtotal'); $totalGeneral += $subtotalVenta; @endphp
            <tr style="border-bottom: 1px dotted #000;">
                <td style="padding: 1px;">#{{ $venta->numero }}</td>
                <td style="padding: 1px; text-align: right; font-weight: bold;">{{ number_format($subtotalVenta, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="border-top: 2px solid #000; margin-top: 2px; padding: 1px 0; text-align: right;">
        <p style="font-size: 6px; font-weight: bold; margin: 1px 0;">TOTAL: {{ number_format($totalGeneral, 2) }}</p>
        <p style="font-size: 5px; margin: 0.5px 0;">
            {{ $entrega->chofer?->name ?? $entrega->chofer?->nombre ?? 'S/A' }}
            {{ $entrega->entregador ? '| ' . ($entrega->entregador->name ?? 'S/A') : '' }}
            | {{ $entrega->vehiculo?->placa ?? 'S/A' }}
        </p>
    </div>
</div>

@endsection
