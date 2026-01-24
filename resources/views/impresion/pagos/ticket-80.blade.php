@extends('impresion.layouts.base-ticket')

@section('titulo', 'Comprobante de Pago - ' . $cliente['nombre'])

@section('contenido')
<div class="separador"></div>

{{-- Título --}}
<div class="documento-titulo">
    COMPROBANTE DE PAGO
</div>
<div class="center" style="font-size: 7px; margin-top: 3px;">
    {{ $fecha_impresion->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- Información del cliente --}}
<div class="documento-info">
    <p><strong>{{ $cliente['nombre'] }}</strong></p>
    @if($cliente['nit'])
    <p style="font-size: 7px;">NIT/CI: {{ $cliente['nit'] }}</p>
    @endif
    <p style="font-size: 7px;">Cód: {{ $cliente['codigo_cliente'] }}</p>
</div>

<div class="separador"></div>

{{-- Monto destacado --}}
<div style="text-align: center; margin: 8px 0; padding: 8px 0;">
    <p style="font-size: 7px; margin: 0;">MONTO PAGADO</p>
    <p style="font-size: 20px; margin: 3px 0; font-weight: bold; color: #27ae60;">{{ $pago['moneda']['simbolo'] }} {{ number_format($pago['monto'], 2) }}</p>
</div>

<div class="separador"></div>

{{-- Tipo de pago y referencias --}}
<div style="font-size: 7px; margin: 5px 0;">
    <p style="margin: 2px 0;"><strong>Tipo de Pago:</strong> {{ $pago['tipo_pago'] }}</p>
    @if($pago['numero_recibo'])
    <p style="margin: 2px 0;"><strong>Recibo:</strong> {{ $pago['numero_recibo'] }}</p>
    @endif
    @if($pago['numero_transferencia'])
    <p style="margin: 2px 0;"><strong>Transferencia:</strong> {{ $pago['numero_transferencia'] }}</p>
    @endif
    @if($pago['numero_cheque'])
    <p style="margin: 2px 0;"><strong>Cheque:</strong> {{ $pago['numero_cheque'] }}</p>
    @endif
</div>

<div class="separador"></div>

{{-- Estado de cuenta --}}
@if($cuenta)
<div style="font-size: 7px;">
    <p style="margin: 3px 0; font-weight: bold;">ESTADO DE CUENTA</p>
    <table style="width: 100%; font-size: 7px;">
        <tr>
            <td>Saldo Anterior:</td>
            <td style="text-align: right;">{{ $pago['moneda']['simbolo'] }} {{ number_format($cuenta['saldo_anterior'], 2) }}</td>
        </tr>
        <tr style="color: #27ae60;">
            <td><strong>Pago:</strong></td>
            <td style="text-align: right;"><strong>({{ $pago['moneda']['simbolo'] }} {{ number_format($pago['monto'], 2) }})</strong></td>
        </tr>
        <tr style="border-top: 1px solid #ccc;">
            <td><strong>Nuevo Saldo:</strong></td>
            <td style="text-align: right;"><strong>{{ $pago['moneda']['simbolo'] }} {{ number_format($cuenta['saldo_pendiente'], 2) }}</strong></td>
        </tr>
        <tr>
            <td colspan="2" style="text-align: center; padding-top: 3px;">
                @if($cuenta['saldo_pendiente'] == 0)
                    <span style="font-size: 6px; background: #d4edda; color: #155724; padding: 2px 4px; border-radius: 2px;">PAGADO</span>
                @elseif($cuenta['saldo_pendiente'] < $cuenta['monto_original'])
                    <span style="font-size: 6px; background: #fff3cd; color: #856404; padding: 2px 4px; border-radius: 2px;">PARCIAL</span>
                @else
                    <span style="font-size: 6px; background: #f8d7da; color: #721c24; padding: 2px 4px; border-radius: 2px;">PENDIENTE</span>
                @endif
            </td>
        </tr>
    </table>
</div>
@endif

<div class="separador-doble"></div>

{{-- Venta información --}}
@if($venta)
<div style="font-size: 7px; margin: 5px 0;">
    <p style="margin: 2px 0;"><strong>Venta #:</strong> {{ $venta['numero'] }}</p>
    <p style="margin: 2px 0;"><strong>Fecha:</strong> {{ \Carbon\Carbon::parse($venta['fecha'])->format('d/m/Y') }}</p>
</div>
@endif

{{-- Observaciones compactadas --}}
@if($pago['observaciones'])
<div style="font-size: 6px; margin: 5px 0; padding: 3px; background: #f0f0f0; border-radius: 2px;">
    <strong>Obs:</strong> {{ substr($pago['observaciones'], 0, 50) }}{{ strlen($pago['observaciones']) > 50 ? '...' : '' }}
</div>
@endif

<div class="separador"></div>

{{-- Confirmación y footer --}}
<div class="center" style="font-size: 7px; font-weight: bold; margin: 5px 0;">
    ✓ PAGO REGISTRADO
</div>

<div style="text-align: center; font-size: 6px; color: #666; margin-top: 5px;">
    <p style="margin: 2px 0;">{{ $empresa->nombre ?? 'Distribuidora' }}</p>
    <p style="margin: 2px 0;">{{ now()->format('d/m/Y H:i:s') }}</p>
</div>

@endsection
