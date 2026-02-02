@extends('impresion.layouts.base-ticket')

@section('titulo', 'Cierre de Caja #' . $apertura->id)

@section('contenido')
<div class="separador mb-2"></div>

{{-- ✅ TÍTULO PRINCIPAL --}}
<div class="bold center">CIERRE DE CAJA</div>
<div class="center">Caja #{{ $apertura->id }}</div>
<div class="center" style="margin-top: 1px;">
    {{ now()->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- ✅ INFORMACIÓN DE LA CAJA --}}
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

{{-- ✅ RANGO DE VENTAS --}}
@if($rangoVentasIds['minId'] && $rangoVentasIds['maxId'] && $rangoVentasIds['totalVentas'] > 0)
<div style="margin-bottom: 2px;">
    <small>Ventas: {{ $rangoVentasIds['minId'] }} - {{ $rangoVentasIds['maxId'] }}</small>
</div>
<div class="separador"></div>
@endif

{{-- ✅ EFECTIVO ESPERADO EN CAJA --}}
@if($efectivoEsperado)
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    💰 EFECTIVO ESPERADO
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tbody>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">Apertura</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format($efectivoEsperado['apertura'], 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;"><small>+ Ventas Aprobadas</small></td>

            <td style="text-align: right; padding: 1px 0; font-weight: bold;">+{{ number_format($efectivoEsperado['ventas_efectivo'], 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">+ Ventas Efectivo</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">+{{ number_format($efectivoEsperado['ventas_efectivo'], 2) }}</td>
        </tr>

        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">+ Pagos Crédito</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">+{{ number_format($efectivoEsperado['pagos_credito'], 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000;">
            <td style="text-align: left; padding: 1px 0;">- Gastos</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">-{{ number_format($efectivoEsperado['gastos'], 2) }}</td>
        </tr>
        <tr style="border-top: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0;">= Total Esperado</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format($efectivoEsperado['total'], 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- ✅ VENTAS POR ESTADO --}}
@if($ventasPorEstado && count($ventasPorEstado) > 0)
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    📄 VENTAS POR ESTADO
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tbody>
        @php
        $totalVentasEstado = 0;
        $totalCantidadEstado = 0;
        @endphp
        @foreach($ventasPorEstado as $estado)
        @php
        $totalVentasEstado += $estado['total'];
        $totalCantidadEstado += $estado['count'];
        @endphp
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">{{ substr($estado['estado'], 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0;">{{ $estado['count'] }}</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">{{ number_format($estado['total'], 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0;">TOTAL</td>
            <td style="text-align: center; padding: 1px 0;">{{ $totalCantidadEstado }}</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format($totalVentasEstado, 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- ✅ VENTAS POR TIPO DE PAGO --}}
@if($ventasPorTipoPago && count($ventasPorTipoPago) > 0)
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    💵 VENTAS POR TIPO PAGO
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tbody>
        @php
        $totalVentasPago = 0;
        $totalCantidadVentasPago = 0;
        @endphp
        @foreach($ventasPorTipoPago as $tipo => $resumen)
        @php
        $totalVentasPago += $resumen['total'];
        $totalCantidadVentasPago += $resumen['cantidad'];
        @endphp
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">{{ substr($tipo, 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0;">{{ $resumen['cantidad'] }}</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">{{ number_format($resumen['total'], 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0;">TOTAL VENTAS</td>
            <td style="text-align: center; padding: 1px 0;">{{ $totalCantidadVentasPago }}</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format($totalVentasPago, 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- ✅ PAGOS DE CRÉDITO POR TIPO DE PAGO --}}
@if($pagosCreditoPorTipoPago && count($pagosCreditoPorTipoPago) > 0)
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    💚 PAGOS CRÉDITO
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tbody>
        @php
        $totalPagosCredito = 0;
        $totalCantidadPagosCredito = 0;
        @endphp
        @foreach($pagosCreditoPorTipoPago as $pago)
        @php
        $totalPagosCredito += $pago['total'];
        $totalCantidadPagosCredito += $pago['cantidad'];
        @endphp
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">{{ substr($pago['tipo'], 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0;">{{ $pago['cantidad'] }}</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">{{ number_format($pago['total'], 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0;">TOTAL</td>
            <td style="text-align: center; padding: 1px 0;">{{ $totalCantidadPagosCredito }}</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format($totalPagosCredito, 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- ✅ GASTOS POR TIPO DE PAGO --}}
@if($gastosPorTipoPago && count($gastosPorTipoPago) > 0)
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    🔴 GASTOS
</div>

<table style="width: 100%; border-collapse: collapse; margin-bottom: 2px;">
    <tbody>
        @php
        $totalGastos = 0;
        $totalCantidadGastos = 0;
        @endphp
        @foreach($gastosPorTipoPago as $gasto)
        @php
        $totalGastos += $gasto['total'];
        $totalCantidadGastos += $gasto['cantidad'];
        @endphp
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0;">{{ substr($gasto['tipo'], 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0;">{{ $gasto['cantidad'] }}</td>
            <td style="text-align: right; padding: 1px 0; font-weight: bold;">{{ number_format(abs($gasto['total']), 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0;">TOTAL</td>
            <td style="text-align: center; padding: 1px 0;">{{ $totalCantidadGastos }}</td>
            <td style="text-align: right; padding: 1px 0;">{{ number_format(abs($totalGastos), 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- ✅ TIPOS DE OPERACIÓN --}}
@if($movimientosAgrupados && $movimientosAgrupados->count() > 0)
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    ⚙️ OPERACIONES
</div>

<table style="width: 100%; border-collapse: collapse;">
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
            <td style="text-align: left; padding: 1px 0; ">{{ substr($tipoOp, 0, 12) }}</td>
            <td style="text-align: center; padding: 1px 0; ">{{ $cantidad }}</td>
            <td style="text-align: right; padding: 1px 0; ">{{ number_format(abs($total), 2) }}</td>
        </tr>
        @endforeach
        <tr style="border-top: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0; ">TOTAL</td>
            <td style="text-align: center; padding: 1px 0; ">{{ $totalCantidadMovs }}</td>
            <td style="text-align: right; padding: 1px 0; ">{{ number_format(abs($totalMovimientos), 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>
@endif

{{-- ✅ RESUMEN FINANCIERO --}}
<div class="center" style="margin-bottom: 2px; font-weight: bold;">
    💰 RESUMEN FINANCIERO
</div>

<table style="width: 100%; border-collapse: collapse;">
    <tbody>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0; ">Apertura:</td>
            <td style="text-align: right; padding: 1px 0;  font-weight: bold;">{{ number_format($apertura->monto_apertura, 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0; ">Ingresos:</td>
            <td style="text-align: right; padding: 1px 0; ">{{ number_format($totalIngresos, 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px dotted #ccc;">
            <td style="text-align: left; padding: 1px 0; ">Egresos:</td>
            <td style="text-align: right; padding: 1px 0; ">-{{ number_format($totalEgresos, 2) }}</td>
        </tr>
        <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0; ">Esperado:</td>
            <td style="text-align: right; padding: 1px 0; ">{{ number_format($cierre->monto_esperado, 2) }}</td>
        </tr>
        <tr style="border-bottom: 1px solid #000; font-weight: bold; background: #f0f0f0;">
            <td style="text-align: left; padding: 1px 0; ">Contado:</td>
            <td style="text-align: right; padding: 1px 0; ">{{ number_format($cierre->monto_real, 2) }}</td>
        </tr>
    </tbody>
</table>

<div class="separador"></div>

{{-- ✅ DIFERENCIA --}}
<div class="center" style="font-weight: bold;">
    @if($cierre->diferencia == 0)
    <div>✓ DIFERENCIA: 0.00</div>
    @elseif($cierre->diferencia > 0)
    <div>↑ SOBRANTE: {{ number_format($cierre->diferencia, 2) }}</div>
    @else
    <div>↓ FALTANTE: {{ number_format(abs($cierre->diferencia), 2) }}</div>
    @endif
</div>

<div class="separador"></div>

{{-- ✅ OBSERVACIONES --}}
@if($cierre->observaciones)
<div style="">
    <strong>Obs:</strong><br>
    {{ Str::limit($cierre->observaciones, 120) }}
</div>

<div class="separador"></div>
@endif

{{-- ✅ MONEDA Y USUARIO --}}
<div class="center" style="">
    <strong>Moneda: BOB</strong>
</div>

<div class="separador"></div>

<div class="center" style="margin-top: 2px; ">
    <div>{{ is_string($usuario) ? $usuario : $usuario->name }}</div>
</div>

@endsection
