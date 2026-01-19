@extends('impresion.layouts.base-ticket')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('contenido')
<div style="width: 100%; box-sizing: border-box;">

    <div class="documento-titulo" style="font-size: 10px; margin-bottom: 3px;">ENTREGA</div>
    <div class="documento-numero" style="font-size: 11px; font-weight: bold;">#{{ $entrega->numero_entrega }}</div>
    <div class="center" style="font-size: 6px; margin-bottom: 5px;">
        {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }} | {{ $entrega->estado }}
    </div>

    <div class="separador"></div>

    {{-- LISTA GENÉRICA --}}
    @php
    $impresionService = app(\App\Services\ImpresionEntregaService::class);
    $productosGenerico = $impresionService->obtenerProductosGenerico($entrega);
    $estadisticas = $impresionService->obtenerEstadisticas($entrega);
    @endphp

    <p style="font-size: 7px; font-weight: bold; text-align: center; margin: 3px 0; text-decoration: underline;">LISTA GENÉRICA</p>

    <table style="width: 100%; font-size: 6px; margin-bottom: 3px; border-collapse: collapse;">
        <tbody>
            @forelse($productosGenerico as $producto)
            <tr style="border-bottom: 1px dotted #999;">
                <td style="padding: 1px 0;">{{ substr($producto['producto_nombre'], 0, 25) }}</td>
                <td style="padding: 1px 0; text-align: center; width: 15%;">{{ number_format($producto['cantidad'], 1) }}</td>
                <td style="padding: 1px 0; text-align: right; width: 20%; font-weight: bold;">{{ number_format($producto['subtotal'], 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="3" style="text-align: center; padding: 4px; font-size: 5px; color: #999;">Sin productos</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div style="border-top: 1px dashed #000; padding: 2px 0; margin-bottom: 5px; font-size: 6px;">
        <div style="text-align: right; font-weight: bold;">Total: {{ number_format($estadisticas['total_subtotal'], 2) }}</div>
        <div style="font-size: 5px; color: #666;">{{ $estadisticas['total_productos'] }} items | {{ $estadisticas['total_clientes'] }} clientes</div>
    </div>

    <div class="separador"></div>

    {{-- RESUMEN PARA CHOFER --}}
    <p style="font-size: 7px; font-weight: bold; text-align: center; margin: 3px 0;">RESUMEN CHOFER</p>

    <table style="width: 100%; font-size: 6px; border-collapse: collapse;">
        <tbody>
            @php $totalGeneral = 0; @endphp
            @foreach($entrega->ventas as $venta)
            @php $subtotalVenta = $venta->detalles->sum('subtotal'); $totalGeneral += $subtotalVenta; @endphp
            <tr style="border-bottom: 1px dotted #000;">
                <td style="padding: 2px 2px;">#{{ $venta->numero }}</td>
                <td style="padding: 2px 2px; text-align: right; font-weight: bold;">{{ number_format($subtotalVenta, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="border-top: 2px solid #000; margin-top: 3px; padding: 2px 0; text-align: right;">
        <p style="font-size: 7px; font-weight: bold; margin: 2px 0;">TOTAL: {{ number_format($totalGeneral, 2) }}</p>
        <p style="font-size: 6px; margin: 1px 0;">Chofer: {{ $entrega->chofer?->nombre ?? 'S/A' }} | Placa: {{ $entrega->vehiculo?->placa ?? 'S/A' }}</p>
    </div>
</div>

@endsection
