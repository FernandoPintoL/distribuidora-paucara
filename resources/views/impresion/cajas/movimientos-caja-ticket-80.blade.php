@extends('impresion.layouts.base-ticket')

@section('titulo', 'Movimientos de Caja')

@section('contenido')

<div class="center" style="margin-bottom: 8px;">
    <h2 style="margin: 0; font-size: 12px; font-weight: bold;">MOVIMIENTOS DE CAJA</h2>
    <p style="margin: 2px 0; font-size: 8px;">{{ $fecha_impresion->format('d/m/Y H:i') }}</p>
</div>

<div class="separador-doble"></div>

<!-- Información de la apertura -->
<div style="font-size: 7px; margin-bottom: 5px;">
    <table style="width: 100%; border-collapse: collapse;">
        <tr>
            <td style="width: 50%; padding: 1px;"><strong>Caja:</strong> {{ $apertura->caja->nombre }}</td>
            <td style="width: 50%; padding: 1px;"><strong>Usuario:</strong> {{ $usuario->name }}</td>
        </tr>
        <tr>
            <td style="width: 50%; padding: 1px;"><strong>Apertura:</strong> {{ $apertura->fecha->format('d/m H:i') }}</td>
            <td style="width: 50%; padding: 1px;"><strong>Monto Inicial:</strong> {{ number_format($apertura->monto_apertura, 2) }}</td>
        </tr>
    </table>
</div>

<div class="separador"></div>

<!-- Tabla de movimientos -->
<table style="width: 100%; font-size: 7px; border-collapse: collapse; margin-bottom: 5px;">
    <thead>
        <tr style="border-bottom: 1px dashed #000;">
            <th style="padding: 1px; text-align: left; width: 20%;">Hora</th>
            <th style="padding: 1px; text-align: left; width: 20%;">Tipo</th>
            <th style="padding: 1px; text-align: left; width: 35%;">Descripción</th>
            <th style="padding: 1px; text-align: right; width: 25%;">Monto</th>
        </tr>
    </thead>
    <tbody>
        @forelse($movimientos as $movimiento)
        <tr style="border-bottom: 1px solid #eee;">
            <td style="padding: 1px; font-size: 6px;">{{ $movimiento->fecha->format('H:i') }}</td>
            <td style="padding: 1px; font-size: 6px;">{{ Str::limit($movimiento->tipoOperacion->nombre, 10) }}</td>
            <td style="padding: 1px; font-size: 6px;">{{ Str::limit($movimiento->observaciones) }}</td>
            <td style="padding: 1px; text-align: right; font-size: 6px; @if($movimiento->monto > 0) color: #27ae60; font-weight: bold; @else color: #e74c3c; @endif">
                @if($movimiento->monto > 0) + @endif
                {{ number_format(abs($movimiento->monto), 2) }}
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="4" style="padding: 5px; text-align: center; font-size: 8px; color: #999;">Sin movimientos</td>
        </tr>
        @endforelse
    </tbody>
</table>

<div class="separador-doble"></div>

<!-- Resumen de totales -->
<table style="width: 100%; font-size: 8px; border-collapse: collapse; text-align: right;">
    <tr>
        <td style="padding: 1px; text-align: left;"><strong>M. Inicial:</strong></td>
        <td style="padding: 1px; width: 40%; font-weight: bold;">{{ number_format($apertura->monto_apertura, 2) }} Bs</td>
    </tr>
    <tr>
        <td style="padding: 1px; text-align: left;"><strong>Ingresos:</strong></td>
        <td style="padding: 1px; width: 40%; color: #27ae60; font-weight: bold;">+{{ number_format($totalIngresos, 2) }}</td>
    </tr>
    <tr>
        <td style="padding: 1px; text-align: left;"><strong>Egresos:</strong></td>
        <td style="padding: 1px; width: 40%; color: #e74c3c; font-weight: bold;">-{{ number_format($totalEgresos, 2) }}</td>
    </tr>
    <tr style="border-top: 1px solid #000; border-bottom: 1px solid #000;">
        <td style="padding: 2px; text-align: left;"><strong>Total Día:</strong></td>
        <td style="padding: 2px; width: 40%; font-weight: bold; font-size: 9px;">{{ number_format($totalDia, 2) }} Bs</td>
    </tr>
    <tr>
        <td style="padding: 1px; text-align: left; font-size: 7px;">Transacciones:</td>
        <td style="padding: 1px; width: 40%; font-size: 7px;">{{ $movimientos->count() }}</td>
    </tr>
</table>

<div class="separador-doble"></div>

<div style="font-size: 7px; text-align: center; color: #666;">
    <p style="margin: 2px 0;">{{ $empresa->nombre_comercial ?? 'Distribuidora Paucara' }}</p>
    <p style="margin: 2px 0; font-size: 6px;">{{ $fecha_impresion->format('d/m/Y H:i:s') }}</p>
</div>

@endsection
