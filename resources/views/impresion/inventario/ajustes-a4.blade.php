@extends('impresion.layouts.base-a4')

@section('titulo', 'Ajustes de Inventario')

@section('contenido')


{{-- Información del documento (resumen general) --}}
<table style="width: 100%; font-size: 12px;">
    <tr>
        <td style="width: 50%; vertical-align: top;">
            <h3>DETALLE DE MOVIMIENTOS</h3>
            <p><strong>Folio:</strong> {{ $cabecera['id'] ?? 'N/A' }} | <strong>Numero: </strong> {{ $cabecera['numero'] ?? 'N/A' }}</p>
            <p><strong>Estado:</strong>
                <span style="padding: 2px 6px; border-radius: 3px; background-color: #e3f2fd; color: #1565c0; font-size: 11px; font-weight: bold;">
                    {{ ucfirst($merma['estado'] ?? 'procesado') }}
                </span>
            </p>
            <p><strong>Almacén:</strong> {{ $cabecera['almacen_nombre'] ?? 'N/A' }} 
            </p>
            <p><strong>Creador:</strong> {{ $cabecera['usuario'] ?? 'Sistema' }}</p>
            <p><strong>Fecha Creación:</strong>
                {{ is_string($cabecera['fecha_creacion']) ? \Carbon\Carbon::parse($cabecera['fecha_creacion'])->format('d/m/Y H:i') : $cabecera['fecha_creacion']->format('d/m/Y H:i') }}
            </p>
            <p><strong>Generado:</strong> {{ now()->format('d/m/Y H:i') }}</p>
            @if($almacenFiltro && (empty($cabecera) || !isset($cabecera['numero'])))
                <p><strong>Filtro Almacén:</strong> {{ $almacenFiltro }}</p>
            @endif
        </td>
        <td style="width: 50%; vertical-align: top;">
            <h3>TOTALES</h3>
            <p><strong>Entradas:</strong> +{{ $cabecera['cantidad_entradas'] ?? 0 }} unidades</p>
            <p><strong>Salidas:</strong> -{{ $cabecera['cantidad_salidas'] ?? 0 }} unidades</p>
            <hr>
            <p><strong>Total Ajustado:</strong> {{ number_format($ajustes->sum('cantidad'), 2) }} unidades</p>
            <p><strong>Registros:</strong> {{ count($ajustes) }}</p>
        </td>
    </tr>
</table>
    @if(!empty($cabecera['observacion']))
    <div style="border-top: 1px solid #bdc3c7;">
        <p style="margin: 3px 0; font-size: 12px;"><strong>Observación:</strong></p>
        <p style="margin: 3px 0; font-size: 12px; color: #666;">{{ $cabecera['observacion'] }}</p>
    </div>
    @endif
</div>

{{-- Tabla de ajustes --}}
<table class="tabla-productos mt-2">
    <thead>
        <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 20%;">Producto</th>
            {{-- <th style="width: 12%;">Almacén</th> --}}
            <th style="width: 12%;">Tipo Ajuste</th>
            <th style="width: 8%;">Cantidad</th>
            <th style="width: 8%;">Anterior</th>
            <th style="width: 8%;">Posterior</th>
            <th style="width: 15%;">Observación</th>
        </tr>
    </thead>
    <tbody>
        @forelse($ajustes as $index => $ajuste)
        <tr>
            <td>{{ $ajuste['numero_documento'] ?? '-' }}</td>
            <td>
                <strong>{{ $ajuste['producto_nombre'] }}</strong><br>
                <small style="color: #666;">{{ $ajuste['producto_sku'] }}</small>
            </td>
            {{-- <td>{{ $ajuste['almacen_nombre'] }}</td> --}}
            <td>
                <span style="padding: 2px 6px; border-radius: 3px; font-size: 11px; font-weight: bold;
                    @if(strpos(strtoupper($ajuste['tipo_operacion']), 'ENTRADA') !== false)
                        background-color: #d4edda; color: #155724;
                    @else
                        background-color: #f8d7da; color: #721c24;
                    @endif
                ">
                    {{ $ajuste['tipo_ajuste_label'] ?? ucfirst($ajuste['tipo_operacion']) }}
                </span>
            </td>
            <td style="text-align: right;">
                @if(floatval($ajuste['cantidad']) >= 0)
                    <span style="color: green;">+{{ number_format($ajuste['cantidad'], 2) }}</span>
                @else
                    <span style="color: red;">{{ number_format($ajuste['cantidad'], 2) }}</span>
                @endif
            </td>
            <td style="text-align: right;">{{ number_format($ajuste['cantidad_anterior'], 2) }}</td>
            <td style="text-align: right;">{{ number_format($ajuste['cantidad_posterior'], 2) }}</td>
            <td style="font-size: 10px;">{{ $ajuste['observacion'] ?? '-' }}</td>
        </tr>
        @empty
        <tr>
            <td colspan="9" style="text-align: center; padding: 20px; color: #999;">
                No hay ajustes para mostrar
            </td>
        </tr>
        @endforelse
    </tbody>
</table>

{{-- Pie de página con detalles --}}
<div class="documento-pie mt-4" style="border-top: 1px solid #ddd; padding-top: 15px; font-size: 11px; color: #666;">
    <p><strong>Usuario:</strong> {{ auth()->user()->name ?? 'Sistema' }}</p>
    <p><strong>Empresa:</strong> {{ config('app.name') }}</p>
</div>
@endsection
