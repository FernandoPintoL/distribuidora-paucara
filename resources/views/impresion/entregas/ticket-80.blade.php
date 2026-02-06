@extends('impresion.layouts.base-ticket-simple')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('contenido')
<div style="width: 100%;">

    <div class="documento-titulo" style="margin-bottom: 3px;">ENTREGA N° {{ $entrega->id }}</div>
    <div class="documento-numero" style="font-weight: bold;">{{ $entrega->numero_entrega }}</div>
    <div class="center" style="margin-bottom: 5px;">
        {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }} | {{ $entrega->estado }}
    </div>

    <div class="separador mt-2 mb-2"></div>

    {{-- LISTA GENÉRICA AGRUPADA --}}
    @php
    $impresionService = app(\App\Services\ImpresionEntregaService::class);
    $productosGenerico = $impresionService->obtenerProductosAgrupados($entrega);
    $estadisticas = $impresionService->obtenerEstadisticas($entrega);
    @endphp

    {{-- INFORMACIÓN DEL CHOFER Y VEHÍCULO --}}
    <p style="font-weight: bold; text-align: center; margin: 3px 0;">CHOFER Y VEHÍCULO</p>

    @if($entrega->chofer)
    <div style="margin: 2px 0;">
        <p style="margin: 2px 0;"><strong>Chofer:</strong> {{ $entrega->chofer->name ?? $entrega->chofer->nombre ?? 'S/N' }}</p>
        @if($entrega->chofer->phone ?? false)
        <p style="margin: 2px 0;"><strong>Teléfono:</strong> {{ $entrega->chofer->phone }}</p>
        @endif
    </div>
    @else
    <p style="margin: 2px 0; color: #999;">Sin chofer asignado</p>
    @endif

    @if($entrega->vehiculo)
    <div style="margin: 2px 0;">
        <p style="margin: 2px 0;"><strong>Placa:</strong> {{ $entrega->vehiculo->placa }}</p>
        @if($entrega->vehiculo->marca)
        <p style="margin: 2px 0;"><strong>Marca:</strong> {{ $entrega->vehiculo->marca }}</p>
        @endif
        @if($entrega->vehiculo->modelo)
        <p style="margin: 2px 0;"><strong>Modelo:</strong> {{ $entrega->vehiculo->modelo }}</p>
        @endif
    </div>
    @else
    <p style="margin: 2px 0; color: #999;">Sin vehículo asignado</p>
    @endif

    {{-- INFORMACIÓN DE PESO --}}
    <div style="margin: 3px 0; padding: 3px; border: 1px solid #999; border-radius: 3px;">
        <p style="margin: 2px 0; text-align: center; font-weight: bold;">PESO DE LA ENTREGA</p>
        <p style="margin: 2px 0;"><strong>Peso Total:</strong> {{ number_format($entrega->peso_kg ?? 0, 2) }} kg</p>
        @if($entrega->vehiculo && $entrega->vehiculo->capacidad_kg)
        <p style="margin: 2px 0;"><strong>Capacidad Vehículo:</strong> {{ number_format($entrega->vehiculo->capacidad_kg, 1) }} kg</p>
        @php
        $pesoTotal = $entrega->peso_kg ?? 0;
        $capacidad = $entrega->vehiculo->capacidad_kg ?? 0;
        $porcentajeUso = $capacidad > 0 ? ($pesoTotal / $capacidad) * 100 : 0;
        $colorEstado = $porcentajeUso > 100 ? '#0E0D0D' : ($porcentajeUso > 80 ? '#070707' : '#0B0C0B');
        @endphp
        <p style="margin: 2px 0; color: {{ $colorEstado }}; font-weight: bold;">
            Uso: {{ number_format($porcentajeUso, 1) }}%
            @if($porcentajeUso > 100)
            ⚠ EXCESO
            @elseif($porcentajeUso > 80)
            ⚡ ALTO
            @else
            ✓ OK
            @endif
        </p>
        @endif
    </div>

    <div class="separador"></div>

    {{-- LISTA GENÉRICA --}}

    <p style="font-weight: bold; text-align: center; margin: 3px 0; text-decoration: underline;">LISTA GENÉRICA</p>

    <table style="width: 100%; margin-bottom: 3px; border-collapse: collapse;">
        <tbody>
            @forelse($productosGenerico as $producto)
            <tr style="border-bottom: 1px dotted #999;">
                <td style="padding: 1px 0;">{{ substr($producto['producto_nombre'], 0, 25) }}</td>
                <td style="padding: 1px 0; text-align: center; width: 15%;"> {{ number_format($producto['cantidad_total'], 1) }}</td>
                <td style="padding: 1px 0; text-align: right; width: 20%; font-weight: bold;">{{ number_format($producto['subtotal_total'], 2) }}</td>
            </tr>
            @empty
            <tr>
                <td colspan="3" style="text-align: center; padding: 4px; color: #999;">Sin productos</td>
            </tr>
            @endforelse
        </tbody>
    </table>

    <div style="border-top: 1px dashed #000; padding: 2px 0; margin-bottom: 5px;">
        <div style="text-align: right;">Total: {{ number_format($estadisticas['total_subtotal'], 2) }}</div>
        <div>{{ $estadisticas['total_productos'] }} items | {{ $estadisticas['total_clientes'] }} clientes</div>
    </div>

    <div class="separador"></div>

    {{-- RESUMEN PARA CHOFER --}}
    <p style="font-weight: bold; text-align: center; margin: 3px 0;">RESUMEN CHOFER</p>

    <table style="width: 100%; border-collapse: collapse;">
        <tbody>
            @php $totalGeneral = 0; @endphp
            @foreach($entrega->ventas as $venta)
            @php $subtotalVenta = $venta->detalles->sum('subtotal'); $totalGeneral += $subtotalVenta; @endphp
            <tr style="border-bottom: 1px dotted #000;">
                <td style="padding: 2px 2px;">#{{ $venta->id }} {{ $venta->numero }}</td>
                <td style="padding: 2px 2px; text-align: right; font-weight: bold;">{{ number_format($subtotalVenta, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="border-top: 2px solid #000; margin-top: 3px; padding: 2px 0; text-align: right;">
        <p style="font-weight: bold; margin: 2px 0;">TOTAL: {{ number_format($totalGeneral, 2) }}</p>
    </div>

    <div class="separador"></div>


</div>

@endsection
