@extends('impresion.layouts.base-a4')

@section('titulo', 'Listado de Ventas')

@section('contenido')
{{-- Información del documento --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2 style="color: #3498db;">REPORTE DE VENTAS</h2>
            <p><strong>Fecha de generación:</strong> {{ now()->format('d/m/Y H:i') }}</p>
            @if($filtros && isset($filtros['estado']) && $filtros['estado'])
                <p><strong>Estado:</strong> {{ ucfirst($filtros['estado']) }}</p>
            @endif
        </div>
        <div class="documento-info-seccion" style="text-align: right;">
            <p><strong>Total de registros:</strong> {{ count($ventas) }}</p>
            <p><strong>Monto Total:</strong> {{ number_format($ventas->sum('total'), 2) }}</p>
        </div>
    </div>
</div>

{{-- Tabla de ventas --}}
<table class="tabla-productos">
    <thead>
        <tr>
            <th style="width: 4%;">#</th>
            <th style="width: 12%;">ID / Número</th>
            <th style="width: 10%;">Fecha</th>
            <th style="width: 16%;">Cliente</th>
            <th style="width: 12%;">Total</th>
            <th style="width: 12%;">Estado</th>
            <th style="width: 14%;">Tipo de Pago</th>
        </tr>
    </thead>
    <tbody>
        @forelse($ventas as $item)
        <tr>
            <td>{{ $loop->iteration }}</td>
            <td>
                @php
                    $id = '-';
                    $numero = '-';
                    if (is_array($item)) {
                        $id = $item['id'] ?? '-';
                        $numero = $item['numero'] ?? '-';
                    } elseif (is_object($item)) {
                        $id = $item->id ?? '-';
                        $numero = $item->numero ?? '-';
                    }
                @endphp
                <strong>{{ $id }}</strong><br>
                <small style="color: #666;">{{ $numero }}</small>
            </td>
            <td>
                @php
                    $fecha = null;
                    if (is_array($item) && isset($item['fecha'])) {
                        $fecha = $item['fecha'];
                    } elseif (is_object($item) && isset($item->fecha)) {
                        $fecha = $item->fecha;
                    }
                    if ($fecha) {
                        if (is_string($fecha)) {
                            echo date('d/m/Y', strtotime($fecha));
                        } else {
                            echo $fecha->format('d/m/Y');
                        }
                    } else {
                        echo '-';
                    }
                @endphp
            </td>
            <td>
                @php
                    $cliente = '-';
                    if (is_array($item)) {
                        if (isset($item['cliente'])) {
                            $cli = $item['cliente'];
                            $cliente = is_array($cli) ? ($cli['nombre'] ?? '-') : (is_object($cli) ? ($cli->nombre ?? '-') : '-');
                        }
                    } elseif (is_object($item)) {
                        if (isset($item->cliente)) {
                            $cliente = $item->cliente->nombre ?? '-';
                        }
                    }
                @endphp
                <strong>{{ $cliente }}</strong>
            </td>
            <td>
                @php
                    $total = 0;
                    if (is_array($item) && isset($item['total'])) {
                        $total = (float)$item['total'];
                    } elseif (is_object($item) && isset($item->total)) {
                        $total = (float)$item->total;
                    }
                @endphp
                <strong>{{ number_format($total, 2) }}</strong>
            </td>
            {{-- Estado desde estado_documento --}}
            <td>
                @php
                    $estado = '-';
                    $estadoColor = '#f0f0f0';

                    // Obtener estado desde relación estado_documento (snake_case)
                    if (is_object($item) && isset($item->estadoDocumento)) {
                        $estado = $item->estadoDocumento->nombre ?? '-';
                    } elseif (is_array($item) && isset($item['estado_documento'])) {
                        // Array con estado_documento
                        $ed = $item['estado_documento'];
                        if (is_array($ed)) {
                            $estado = $ed['nombre'] ?? '-';
                        } elseif (is_object($ed)) {
                            $estado = $ed->nombre ?? '-';
                        }
                    }

                    // Colores según estado
                    if ($estado === 'APROBADO') {
                        $estadoColor = '#d4edda'; // Verde claro
                    } elseif ($estado === 'ANULADO') {
                        $estadoColor = '#f8d7da'; // Rojo claro
                    } elseif ($estado === 'PENDIENTE') {
                        $estadoColor = '#fff3cd'; // Amarillo claro
                    }
                @endphp
                <span style="padding: 3px 6px; background: {{ $estadoColor }}; border-radius: 3px; display: inline-block;">
                    <strong>{{ $estado }}</strong>
                </span>
            </td>
            {{-- Tipo de Pago desde tipo_pago --}}
            <td>
                @php
                    $tipoPago = '-';
                    $pagoColor = '#f0f0f0';

                    // Obtener tipo de pago desde relación tipo_pago (snake_case)
                    if (is_object($item) && isset($item->tipoPago)) {
                        $tipoPago = $item->tipoPago->nombre ?? '-';
                    } elseif (is_array($item) && isset($item['tipo_pago'])) {
                        // Array con tipo_pago
                        $tp = $item['tipo_pago'];
                        if (is_array($tp)) {
                            $tipoPago = $tp['nombre'] ?? '-';
                        } elseif (is_object($tp)) {
                            $tipoPago = $tp->nombre ?? '-';
                        }
                    }

                    // Colores según tipo de pago
                    if ($tipoPago === 'Efectivo') {
                        $pagoColor = '#d1ecf1'; // Cyan claro
                    } elseif ($tipoPago === 'Transferencia / QR') {
                        $pagoColor = '#d1e7dd'; // Verde claro
                    } elseif ($tipoPago === 'Cheque') {
                        $pagoColor = '#e2e3e5'; // Gris claro
                    } elseif ($tipoPago === 'Crédito') {
                        $pagoColor = '#cfe2ff'; // Azul claro
                    }
                @endphp
                <span style="padding: 3px 6px; background: {{ $pagoColor }}; border-radius: 3px; display: inline-block;">
                    {{ $tipoPago }}
                </span>
            </td>
        </tr>
        @empty
        <tr>
            <td colspan="8" style="text-align: center; padding: 20px;">
                No hay ventas para mostrar
            </td>
        </tr>
        @endforelse
    </tbody>
</table>

{{-- Resumen --}}
<div class="totales">
    <table>
        <tr class="total-final">
            <td><strong>TOTAL DE VENTAS:</strong></td>
            <td class="text-right">
                <strong>{{ count($ventas) }}</strong>
            </td>
        </tr>
        <tr class="total-final">
            <td><strong>MONTO TOTAL:</strong></td>
            <td class="text-right">
                <strong>{{ number_format($ventas->sum('total'), 2) }}</strong>
            </td>
        </tr>
    </table>
</div>

{{-- Nota de documentación --}}
<div class="observaciones" style="margin-top: 10px; border-left-color: #3498db; background: #ecf0f1;">
    <strong>Nota Informativa:</strong>
    <p style="margin-top: 5px;">
        Este es un reporte de referencia de ventas.
        Generado el {{ now()->format('d/m/Y \\a \\l\\a\\s H:i') }}.
    </p>
</div>
@endsection
