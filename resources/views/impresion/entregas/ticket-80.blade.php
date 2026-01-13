@extends('impresion.layouts.base-ticket')

@section('titulo', 'Entrega #' . $entrega->numero_entrega)

@section('contenido')
<div style="padding: 8px; width: 100%; box-sizing: border-box;">
    <div class="separador"></div>

    {{-- Logo --}}
    @if($logo_principal_base64)
    <div style="text-align: center; margin-bottom: 5px;">
        <img src="{{ $logo_principal_base64 }}" style="max-width: 50px; max-height: 30px; object-fit: contain;">
    </div>
    @endif

    <div class="documento-titulo" style="font-size: 10px; margin-bottom: 3px;">ENTREGA</div>
    <div class="documento-numero" style="font-size: 11px; font-weight: bold;">#{{ $entrega->numero_entrega }}</div>
    <div class="center" style="font-size: 6px; margin-bottom: 5px;">
        {{ $entrega->fecha_asignacion->format('d/m/Y') }}
    </div>

    <div class="separador"></div>

    {{-- Detalles por Venta --}}
    @forelse($entrega->ventas as $venta)
    <div style="font-size: 6px; margin-bottom: 5px;">
        <p style="margin: 1px 0; font-weight: bold;">Venta #{{ $venta->numero }}</p>
        <p style="margin: 1px 0;"><strong>{{ substr($venta->cliente->nombre, 0, 30) }}</strong></p>
    </div>

    <table style="padding: 2px 20px 2px 2px; width: 100%; font-size: 6px; margin-bottom: 3px; border-collapse: collapse;">
        <tbody>
            @foreach($venta->detalles as $detalle)
            <tr>
                <td style="padding: 1px 0;">{{ substr($detalle->producto->nombre, 0, 25) }}</td>
                <td style="padding: 1px 0; text-align: center; width: 15%;">{{ number_format($detalle->cantidad, 0) }}</td>
                <td style="padding: 1px 0; text-align: right; width: 20%; font-weight: bold;">{{ number_format($detalle->subtotal, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div style="border-top: 1px dashed #000; padding: 2px 20px 2px 2px; margin-bottom: 5px; font-size: 6px;">
        <div style="text-align: right; font-weight: bold;">Subtotal: {{ number_format($venta->detalles->sum('subtotal'), 2) }}</div>
    </div>

    <div class="separador"></div>

    @empty
    <div style="text-align: center; font-size: 6px; color: #999;">Sin ventas</div>
    @endforelse

    {{-- Resumen para Chofer --}}
    <div style="margin-top: 10px; padding-top: 5px; border-top: 2px solid #000;">
        <p style="font-size: 7px; font-weight: bold; text-align: center; margin: 3px 0;">RESUMEN CHOFER</p>

        <table style="width: 100%; font-size: 6px; border-collapse: collapse; padding: 0px 10px;">
            <tbody>
                @php
                $totalGeneral = 0;
                $ventasCount = 0;
                @endphp
                @foreach($entrega->ventas as $venta)
                @php
                $subtotalVenta = $venta->detalles->sum('subtotal');
                $totalGeneral += $subtotalVenta;
                $ventasCount++;
                @endphp
                <tr style="border-bottom: 1px dotted #000;">
                    <td style="padding: 2px 2px;">#{{ $venta->numero }}</td>
                    <td style="padding: 2px 2px; text-align: right; font-weight: bold;">{{ number_format($subtotalVenta, 2) }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div style="border-top: 2px solid #000; margin-top: 3px; padding: 2px 20px 2px 2px; text-align: right;">
            <p style="font-size: 7px; font-weight: bold; margin: 2px 0;">TOTAL: {{ number_format($totalGeneral, 2) }}</p>
            <p style="font-size: 6px; margin: 1px 0;">{{ $ventasCount }} Venta(s) | Chofer: {{ $entrega->chofer?->nombre ?? 'S/A' }}</p>
        </div>
    </div>

    <div class="separador"></div>

    <div class="center" style="font-size: 5px; margin-top: 3px;">
        <p style="margin: 1px 0;">{{ $fecha_generacion }}</p>
    </div>
</div>

@endsection
