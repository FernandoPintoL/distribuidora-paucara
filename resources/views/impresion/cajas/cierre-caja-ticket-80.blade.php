@extends('impresion.layouts.base-ticket')

@section('titulo', 'Cierre de Caja #' . $apertura->id)

@section('contenido')
<div class="separador mb-2"></div>

{{-- Título principal --}}
<div class="bold center">CIERRE DE CAJA</div>
<div class="center">Caja N#{{ $apertura->id }}</div>
<div class="center" style="margin-top: 1px;">
    {{ now()->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- Información de la caja --}}
<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr>
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Caja:</td>
            <td style="text-align: right; padding: 1px 0;">{{ $apertura->caja->nombre }}</td>
        </tr>
        <tr>
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Responsable:</td>
            <td style="text-align: right; padding: 1px 0;">{{ substr($usuario->name, 0, 20) }}</td>
        </tr>
        <tr>
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Apertura:</td>
            <td style="text-align: right; padding: 1px 0;">{{ $apertura->fecha->format('d/m H:i') }}</td>
        </tr>
        @if($cierre)
        <tr>
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Cierre:</td>
            <td style="text-align: right; padding: 1px 0;">{{ $cierre->created_at->format('d/m H:i') }}</td>
        </tr>
        @endif
    </tbody>
</table>

<div class="separador"></div>

{{-- Rango de Ventas por IDs --}}
@if($rangoVentasIds['minId'] && $rangoVentasIds['maxId'] && $rangoVentasIds['totalVentas'] > 0)
<div class="center" style="margin-bottom: 2px;">
    <strong>RANGO DE VENTAS:</strong>
    <p>#{{ $rangoVentasIds['minId'] }} → #{{ $rangoVentasIds['maxId'] }} ({{ $rangoVentasIds['totalVentas'] }} vtas)</p>
</div>

<div class="separador"></div>
@endif

{{-- Rango de Créditos --}}
@if($rangoCreditos['minId'] && $rangoCreditos['maxId'] && $rangoCreditos['totalCreditos'] > 0)
<div class="center" style="margin-bottom: 2px;">
    <strong>RANGO DE CRÉDITOS:</strong>
    <p>#{{ $rangoCreditos['minId'] }} → #{{ $rangoCreditos['maxId'] }} ({{ $rangoCreditos['totalCreditos'] }} créditos - Bs {{ number_format($rangoCreditos['montoCreditos'], 2) }})</p>
</div>

<div class="separador"></div>
@endif

{{-- Pagos de Créditos --}}
@if($pagosCreditos > 0)
<div class="center" style="margin-bottom: 2px;">
    <strong>PAGOS DE CRÉDITOS:</strong>
    <p>{{ $pagosCreditos }} pagos realizados - Bs {{ number_format($montoPagosCreditos, 2) }}</p>
</div>

<div class="separador"></div>
@endif

{{-- Rango de Pagos --}}
@if($rangoPagos['minId'] && $rangoPagos['maxId'] && $rangoPagos['totalPagos'] > 0)
<div class="center" style="margin-bottom: 2px;">
    <strong>RANGO DE PAGOS:</strong>
    <p>#{{ $rangoPagos['minId'] }} → #{{ $rangoPagos['maxId'] }} ({{ $rangoPagos['totalPagos'] }} pagos - Bs {{ number_format($rangoPagos['montoPagos'], 2) }})</p>
</div>

<div class="separador"></div>
@endif

{{-- Rango de Fechas --}}
{{-- <div class="center" style="margin-bottom: 3px;">
    <strong>RANGO DE FECHAS</strong>
</div>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 3px;">
    <tbody>
        <tr>
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Ventas:</td>
            <td style="text-align: right; padding: 1px 0;">
                @if($primeraVenta)
                {{ $primeraVenta->format('d/m H:i') }} - {{ $ultimaVenta->format('H:i') }}
@else
<span style="color: #999;">Sin ventas</span>
@endif
</td>
</tr>
@if($primerMovimiento)
<tr>
    <td style="text-align: left; padding: 1px 0; font-weight: bold;">Movimientos:</td>
    <td style="text-align: right; padding: 1px 0;">{{ $primerMovimiento->format('d/m H:i') }} - {{ $ultimoMovimiento->format('H:i') }}</td>
</tr>
@endif
</tbody>
</table> --}}

<div class="separador"></div>

{{-- Resumen por Tipos de Pago --}}
<div class="center" style="margin-bottom: 3px;">
    <strong>TIPOS DE PAGO</strong>
</div>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr style="border-bottom: 1px solid #000;">
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Tipo</td>
            <td style="text-align: center; padding: 1px 0; font-weight: bold;">Cant.</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">Monto</td>
        </tr>
    </thead>
    <tbody>
        @php
        $totalPagos = 0;
        $totalCantidadPagos = 0;
        @endphp
        @foreach($ventasPorTipoPago as $tipoPago => $resumen)
        @php
        $totalPagos += $resumen['total'];
        $totalCantidadPagos += $resumen['cantidad'];
        @endphp
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">{{ substr($tipoPago, 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0;">{{ $resumen['cantidad'] }}</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format($resumen['total'], 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold;">
            <td style="text-align: left; padding: 2px 0;">TOTAL</td>
            <td style="text-align: center; padding: 2px 0;">{{ $totalCantidadPagos }}</td>
            <td style="text-align: right; padding: 2px 0;">{{ number_format($totalPagos, 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>

{{-- Resumen por Tipos de Operación --}}
@if($movimientosAgrupados->count() > 0)
<div class="center" style="margin-bottom: 3px;">
    <strong>TIPOS DE OPERACIÓN</strong>
</div>
<table style="width: 100%; border-collapse: collapse;">
    <thead>
        <tr style="border-bottom: 1px solid #000;">
            <td style="text-align: left; padding: 1px 0; font-weight: bold;">Operación</td>
            <td style="text-align: center; padding: 1px 0; font-weight: bold;">Cant.</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">Monto</td>
        </tr>
    </thead>
    <tbody>
        @php
        $totalMovimientos = 0;
        $totalCantidadMovs = 0;
        @endphp
        @foreach($movimientosAgrupados as $tipoOp => $movs)
        @php
        $total = $movs->sum('monto');
        $cantidad = $movs->count();
        $totalMovimientos += $total;
        $totalCantidadMovs += $cantidad;
        @endphp
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">{{ substr($tipoOp, 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0;">{{ $cantidad }}</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format(abs($total), 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold;">
            <td style="text-align: left; padding: 2px 0;">TOTAL</td>
            <td style="text-align: center; padding: 2px 0;">{{ $totalCantidadMovs }}</td>
            <td style="text-align: right; padding: 2px 0;">{{ number_format(abs($totalMovimientos), 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- Resumen financiero --}}
<div class="center" style="margin-bottom: 3px;">
    <strong>RESUMEN FINANCIERO</strong>
</div>
<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 2px 0;">Apertura:</td>
            <td style="text-align: right; padding: 2px 0; font-weight: bold;">{{ number_format($apertura->monto_apertura, 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 2px 0;">Ingresos:</td>
            <td style="text-align: right; padding: 2px 0;">{{ number_format($totalIngresos, 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 2px 0;">Egresos:</td>
            <td style="text-align: right; padding: 2px 0;">-{{ number_format($totalEgresos, 2) }}</td>
        </tr>
        <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000;">
            <td style="text-align: left; padding: 2px 0; font-weight: bold;">Esperado:</td>
            <td style="text-align: right; padding: 2px 0; font-weight: bold;">{{ number_format($cierre->monto_esperado, 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
            <td style="text-align: left; padding: 2px 0; font-weight: bold;">Contado:</td>
            <td style="text-align: right; padding: 2px 0; font-weight: bold;">{{ number_format($cierre->monto_real, 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>

{{-- Diferencia --}}
<div class="center" style="font-weight: bold;">
    @if($cierre->diferencia == 0)
    <div style="color: #000;">✓ DIFERENCIA: 0.00</div>
    @elseif($cierre->diferencia > 0)
    <div style="color: #000;">↑ SOBRANTE: {{ number_format($cierre->diferencia, 2) }}</div>
    @else
    <div style="color: #000;">↓ FALTANTE: {{ number_format(abs($cierre->diferencia), 2) }}</div>
    @endif
</div>

<div class="separador"></div>

{{-- Observaciones --}}
@if($cierre->observaciones)
<div>
    <strong>Obs:</strong><br>
    {{ Str::limit($cierre->observaciones, 120) }}
</div>

<div class="separador"></div>
@endif

{{-- Moneda --}}
<div class="center">
    <strong>Moneda: BOB (Boliviano)</strong>
</div>

<div class="separador"></div>

<div class="center" style="margin-top: 2px;">
    <div>{{ is_string($usuario) ? $usuario : $usuario->name }}</div>
</div>

@endsection
