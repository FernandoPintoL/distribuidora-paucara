@extends('impresion.layouts.base-a4')

@section('titulo', 'Cierre Diario General')

@section('contenido')
<div class="container">
    <!-- Header -->
    <div style="border-bottom: 3px solid #000; margin-bottom: 20px; padding-bottom: 10px;">
        <h1 style="text-align: center; font-size: 24px; margin: 0;">CIERRE DIARIO GENERAL</h1>
        <p style="text-align: center; font-size: 12px; color: #666; margin: 5px 0;">Resumen consolidado de todas las cajas</p>
    </div>

    <!-- Información General -->
    <div style="margin-bottom: 20px;">
        <table style="width: 100%; font-size: 11px;">
            <tr>
                <td style="width: 50%;">
                    <strong>Fecha/Hora:</strong> {{ $cierre->fecha_ejecucion->format('d/m/Y H:i:s') }}
                </td>
                <td style="width: 50%; text-align: right;">
                    <strong>Ejecutado por:</strong> {{ $cierre->usuario->name }}
                </td>
            </tr>
            <tr style="height: 5px;"></tr>
            <tr>
                <td colspan="2">
                    <strong>ID Cierre:</strong> {{ $cierre->id }}
                </td>
            </tr>
        </table>
    </div>

    <!-- Métricas Principales -->
    <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; border-bottom: 2px solid #333; padding-bottom: 5px; margin: 0 0 10px 0;">
            RESUMEN EJECUTIVO
        </h3>
        <table style="width: 100%; font-size: 11px; border-collapse: collapse;">
            <tr style="background-color: #f0f0f0; border-bottom: 1px solid #ccc;">
                <td style="padding: 8px; width: 25%; border-right: 1px solid #ccc;"><strong>Cajas Cerradas</strong></td>
                <td style="padding: 8px; width: 25%; border-right: 1px solid #ccc; text-align: right;"><strong>{{ $cierre->total_cajas_cerradas }}</strong></td>
                <td style="padding: 8px; width: 25%; border-right: 1px solid #ccc;"><strong>Con Discrepancias</strong></td>
                <td style="padding: 8px; width: 25%; text-align: right;"><strong>{{ $cierre->total_cajas_con_discrepancia }}</strong></td>
            </tr>
            <tr style="border-bottom: 1px solid #ccc;">
                <td style="padding: 8px; border-right: 1px solid #ccc;">Total Esperado</td>
                <td style="padding: 8px; border-right: 1px solid #ccc; text-align: right;">Bs. {{ number_format($cierre->total_monto_esperado, 2) }}</td>
                <td style="padding: 8px; border-right: 1px solid #ccc;">Total Real</td>
                <td style="padding: 8px; text-align: right;">Bs. {{ number_format($cierre->total_monto_real, 2) }}</td>
            </tr>
            <tr style="background-color: #fff3cd; border-bottom: 2px solid #333;">
                <td colspan="2" style="padding: 8px; border-right: 1px solid #ccc;"><strong>Diferencia Total</strong></td>
                <td colspan="2" style="padding: 8px; text-align: right;">
                    <strong style="font-size: 13px; color: {{ $cierre->total_diferencias == 0 ? '#28a745' : ($cierre->total_diferencias > 0 ? '#007bff' : '#dc3545') }};">
                        {{ $cierre->total_diferencias == 0 ? '✓ SIN DIFERENCIAS' : ($cierre->total_diferencias > 0 ? '+' : '') }} Bs. {{ number_format($cierre->total_diferencias, 2) }}
                    </strong>
                </td>
            </tr>
        </table>
    </div>

    <!-- Detalles de Cajas Cerradas -->
    @if(!empty($cajas_procesadas) && count($cajas_procesadas) > 0)
    <div style="margin-bottom: 20px;">
        <h3 style="font-size: 14px; border-bottom: 2px solid #333; padding-bottom: 5px; margin: 0 0 10px 0;">
            DETALLE DE CAJAS CERRADAS
        </h3>
        <table style="width: 100%; font-size: 10px; border-collapse: collapse;">
            <thead>
                <tr style="background-color: #333; color: white; border-bottom: 1px solid #333;">
                    <th style="padding: 6px; text-align: left; border-right: 1px solid #ccc;">Caja</th>
                    <th style="padding: 6px; text-align: left; border-right: 1px solid #ccc;">Usuario</th>
                    <th style="padding: 6px; text-align: right; border-right: 1px solid #ccc;">Esperado</th>
                    <th style="padding: 6px; text-align: right; border-right: 1px solid #ccc;">Real</th>
                    <th style="padding: 6px; text-align: right; border-right: 1px solid #ccc;">Diferencia</th>
                    <th style="padding: 6px; text-align: center;">Estado</th>
                </tr>
            </thead>
            <tbody>
                @foreach($cajas_procesadas as $caja)
                <tr style="border-bottom: 1px solid #ddd;">
                    <td style="padding: 6px; border-right: 1px solid #ddd;">{{ $caja['caja_nombre'] }} (#{{ $caja['caja_id'] }})</td>
                    <td style="padding: 6px; border-right: 1px solid #ddd;">{{ $caja['usuario'] }}</td>
                    <td style="padding: 6px; text-align: right; border-right: 1px solid #ddd;">Bs. {{ number_format($caja['monto_esperado'], 2) }}</td>
                    <td style="padding: 6px; text-align: right; border-right: 1px solid #ddd;">Bs. {{ number_format($caja['monto_real'], 2) }}</td>
                    <td style="padding: 6px; text-align: right; border-right: 1px solid #ddd; color: {{ $caja['diferencia'] == 0 ? '#28a745' : '#dc3545' }};">
                        <strong>{{ $caja['diferencia'] == 0 ? '✓ 0.00' : number_format($caja['diferencia'], 2) }}</strong>
                    </td>
                    <td style="padding: 6px; text-align: center;">
                        <span style="background-color: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-size: 9px;">CONSOLIDADA</span>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endif

    <!-- Notas finales -->
    <div style="margin-top: 30px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666;">
        <p>
            <strong>Moneda:</strong> BOB (Boliviano) |
            <strong>Documento generado:</strong> {{ now()->format('d/m/Y H:i:s') }} |
            <strong>Tipo:</strong> Cierre Diario General Consolidado
        </p>
        <p style="margin-top: 10px;">
            Este documento constituye un registro oficial de auditoría. Todos los cierres incluidos en este resumen han sido verificados y consolidados automáticamente por el sistema.
        </p>
    </div>
</div>

<style>
    .container {
        margin: 20px;
    }
    table {
        width: 100%;
    }
</style>
@endsection
