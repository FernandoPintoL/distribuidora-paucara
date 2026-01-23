@extends('impresion.layouts.base-ticket')

@section('titulo', 'Cierre de Caja #' . $apertura->id)

@section('contenido')
<div class="separador"></div>

{{-- Título principal --}}
<div class="documento-titulo">CIERRE DE CAJA</div>
<div class="documento-numero">#{{ $apertura->id }}</div>
<div class="center" style="font-size: 8px; margin-top: 3px;">
    {{ now()->format('d/m/Y H:i:s') }}
</div>

<div class="separador"></div>

{{-- Información de la caja --}}
<div class="documento-info">
    <p><strong>Caja:</strong> {{ $apertura->caja->nombre }}</p>
    <p><strong>Ubicación:</strong> {{ $apertura->caja->ubicacion }}</p>
    <p><strong>Responsable:</strong> {{ $usuario->name }}</p>
</div>

<div class="separador"></div>

{{-- Período de operación --}}
<div class="center" style="font-size: 8px;">
    <p><strong>Apertura:</strong> {{ $apertura->fecha->format('d/m/Y H:i') }}</p>
    @if($cierre)
    <p><strong>Cierre:</strong> {{ $cierre->created_at->format('d/m/Y H:i') }}</p>
    @endif
</div>

<div class="separador-doble"></div>

{{-- Resumen financiero detallado --}}
<div class="totales">
    <table style="width: 100%; font-size: 9px;">
        <tr>
            <td style="width: 50%;"><strong>Monto Inicial:</strong></td>
            <td class="right" style="width: 50%;"><strong>{{ number_format($apertura->monto_apertura, 2) }} Bs</strong></td>
        </tr>
        <tr style="height: 2px;"></tr>
        <tr>
            <td>Total Ingresos:</td>
            <td class="right">{{ number_format($totalIngresos, 2) }} Bs</td>
        </tr>
        <tr>
            <td>Total Egresos:</td>
            <td class="right">-{{ number_format($totalEgresos, 2) }} Bs</td>
        </tr>
        <tr style="height: 2px;"></tr>
        <tr class="total-final" style="font-size: 10px;">
            <td><strong>SALDO ESPERADO:</strong></td>
            <td class="right"><strong>{{ number_format($cierre->monto_esperado, 2) }} Bs</strong></td>
        </tr>
        <tr style="height: 1px;"></tr>
        <tr class="total-final" style="font-size: 10px;">
            <td><strong>DINERO CONTADO:</strong></td>
            <td class="right"><strong>{{ number_format($cierre->monto_real, 2) }} Bs</strong></td>
        </tr>
    </table>
</div>

<div class="separador-doble"></div>

{{-- Diferencia destacada --}}
<div class="center" style="font-size: 10px; font-weight: bold; margin: 5px 0;">
    @if($cierre->diferencia == 0)
    <div>✓ SIN DIFERENCIAS</div>
    <div style="font-size: 12px; margin-top: 2px;">0.00 Bs</div>
    @elseif($cierre->diferencia > 0)
    <div>↑ SOBRANTE</div>
    <div style="font-size: 12px; margin-top: 2px; color: #000;">+{{ number_format($cierre->diferencia, 2) }} Bs</div>
    @else
    <div>↓ FALTANTE</div>
    <div style="font-size: 12px; margin-top: 2px; color: #000;">-{{ number_format(abs($cierre->diferencia), 2) }} Bs</div>
    @endif
</div>

<div class="separador"></div>

{{-- Observaciones --}}
@if($cierre->observaciones)
<div class="observaciones">
    <strong>Observaciones:</strong>
    <div style="font-size: 8px; margin-top: 2px;">
        {{ Str::limit($cierre->observaciones, 180) }}
    </div>
</div>

<div class="separador"></div>
@endif

{{-- Información final --}}
<div class="center" style="font-size: 8px;">
    <p><strong>Moneda:</strong> BOB (Boliviano)</p>
    <p style="margin-top: 3px; font-size: 7px;">Cierre de caja procesado y registrado</p>
</div>

@endsection
