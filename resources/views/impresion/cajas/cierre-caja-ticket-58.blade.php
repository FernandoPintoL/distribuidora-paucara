@extends('impresion.layouts.base-ticket')

@section('titulo', 'Cierre de Caja #' . $apertura->id)

@section('contenido')
<div class="separador"></div>

{{-- Título --}}
<div class="center bold" style="font-size: 10px;">CIERRE DE CAJA</div>
<div class="center">#{{ $apertura->id }}</div>
<div class="center" style="margin-top: 3px; font-size: 7px;">
    {{ now()->format('d/m/Y H:i') }}
</div>

<div class="separador"></div>

{{-- Información de la caja --}}
<div style="font-size: 8px;">
    <div><strong>Caja:</strong> {{ $apertura->caja->nombre }}</div>
    <div><strong>Ubicación:</strong> {{ $apertura->caja->ubicacion }}</div>
</div>

<div class="separador"></div>

{{-- Período --}}
<div class="center" style="font-size: 7px;">
    <div><strong>Apertura:</strong> {{ $apertura->fecha->format('d/m/Y H:i') }}</div>
    @if($cierre)
    <div><strong>Cierre:</strong> {{ $cierre->created_at->format('d/m/Y H:i') }}</div>
    @endif
</div>

<div class="separador"></div>

{{-- Resumen financiero --}}
<div class="totales">
    <table style="width: 100%; font-size: 8px;">
        <tr>
            <td>Apertura:</td>
            <td class="right"><strong>{{ number_format($apertura->monto_apertura, 2) }}</strong></td>
        </tr>
        <tr>
            <td>Ingresos:</td>
            <td class="right">{{ number_format($totalIngresos, 2) }}</td>
        </tr>
        <tr>
            <td>Egresos:</td>
            <td class="right">-{{ number_format($totalEgresos, 2) }}</td>
        </tr>
        <tr class="total-final">
            <td><strong>Esperado:</strong></td>
            <td class="right"><strong>{{ number_format($cierre->monto_esperado, 2) }}</strong></td>
        </tr>
        <tr style="border-top: 1px solid #000; margin-top: 2px;">
            <td><strong>Contado:</strong></td>
            <td class="right"><strong>{{ number_format($cierre->monto_real, 2) }}</strong></td>
        </tr>
    </table>
</div>

<div class="separador"></div>

{{-- Diferencia --}}
<div class="center" style="font-size: 9px; font-weight: bold;">
    @if($cierre->diferencia == 0)
    <div style="color: #000;">✓ DIFERENCIA: 0.00</div>
    @elseif($cierre->diferencia > 0)
    <div style="color: #000;">↑ SOBRANTE: {{ number_format($cierre->diferencia, 2) }}</div>
    @else
    <div style="color: #000;">↓ FALTANTE: {{ number_format(abs($cierre->diferencia), 2) }}</div>
    @endif
</div>

@if($cierre->observaciones)
<div class="separador"></div>
<div style="font-size: 7px;">
    <strong>Obs:</strong><br>
    {{ Str::limit($cierre->observaciones, 120) }}
</div>
@endif

<div class="separador"></div>

{{-- Moneda --}}
<div class="center" style="font-size: 7px;">
    <strong>Moneda: BOB (Boliviano)</strong>
</div>

<div class="separador"></div>

<div class="center" style="font-size: 6px; margin-top: 5px;">
    <div>{{ $usuario->name }}</div>
</div>

@endsection
