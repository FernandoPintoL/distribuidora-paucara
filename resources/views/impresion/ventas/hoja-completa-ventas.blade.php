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
            <th style="width: 5%;">#</th>
            <th style="width: 10%;">Fecha</th>
            <th style="width: 15%;">Cliente</th>
            <th style="width: 20%;">Producto</th>
            <th style="width: 8%;">Cantidad</th>
            <th style="width: 12%;">P. Unit.</th>
            <th style="width: 12%;">Subtotal</th>
            <th style="width: 10%;">Estado</th>
        </tr>
    </thead>
    <tbody>
        @forelse($ventas as $item)
        <tr>
            <td>{{ $loop->iteration }}</td>
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
                    $detallesHtml = '';
                    if (is_array($item) && isset($item['detalles'])) {
                        $detalles = $item['detalles'];
                        if (is_array($detalles)) {
                            foreach ($detalles as $detalle) {
                                $prod = is_array($detalle) ? ($detalle['producto'] ?? null) : (is_object($detalle) ? ($detalle->producto ?? null) : null);
                                if ($prod) {
                                    $nombre = is_array($prod) ? ($prod['nombre'] ?? '-') : (is_object($prod) ? ($prod->nombre ?? '-') : '-');
                                    $sku = is_array($prod) ? ($prod['sku'] ?? '') : (is_object($prod) ? ($prod->sku ?? '') : '');
                                    $detallesHtml .= '<div><strong>' . $nombre . '</strong>';
                                    if ($sku) {
                                        $detallesHtml .= '<br><span style="font-size: 8px; color: #666;">SKU: ' . $sku . '</span>';
                                    }
                                    $detallesHtml .= '</div>';
                                }
                            }
                        }
                    } elseif (is_object($item) && isset($item->detalles)) {
                        foreach ($item->detalles as $detalle) {
                            if (isset($detalle->producto)) {
                                $detallesHtml .= '<div><strong>' . ($detalle->producto->nombre ?? '-') . '</strong>';
                                if ($detalle->producto->sku ?? false) {
                                    $detallesHtml .= '<br><span style="font-size: 8px; color: #666;">SKU: ' . $detalle->producto->sku . '</span>';
                                }
                                $detallesHtml .= '</div>';
                            }
                        }
                    }
                @endphp
                {!! $detallesHtml ?: '-' !!}
            </td>
            <td>
                @php
                    $cantidadTotal = 0;
                    if (is_array($item) && isset($item['detalles'])) {
                        $detalles = $item['detalles'];
                        if (is_array($detalles)) {
                            foreach ($detalles as $detalle) {
                                $cant = is_array($detalle) ? ($detalle['cantidad'] ?? 0) : (is_object($detalle) ? ($detalle->cantidad ?? 0) : 0);
                                $cantidadTotal += (float)$cant;
                            }
                        }
                    } elseif (is_object($item) && isset($item->detalles)) {
                        foreach ($item->detalles as $detalle) {
                            $cantidadTotal += $detalle->cantidad ?? 0;
                        }
                    }
                @endphp
                <strong>{{ number_format($cantidadTotal, 2) }}</strong>
            </td>
            <td class="text-right">
                @php
                    $precioUnit = 0;
                    if (is_array($item) && isset($item['detalles'])) {
                        $detalles = $item['detalles'];
                        if (is_array($detalles) && count($detalles) > 0) {
                            $precioUnit = is_array($detalles[0]) ? ($detalles[0]['precio_unitario'] ?? 0) : (is_object($detalles[0]) ? ($detalles[0]->precio_unitario ?? 0) : 0);
                        }
                    } elseif (is_object($item) && isset($item->detalles)) {
                        if ($item->detalles->count() > 0) {
                            $precioUnit = $item->detalles->first()->precio_unitario ?? 0;
                        }
                    }
                @endphp
                {{ number_format($precioUnit, 2) }}
            </td>
            <td class="text-right">
                @php
                    $subtotal = 0;
                    if (is_array($item) && isset($item['subtotal'])) {
                        $subtotal = (float)$item['subtotal'];
                    } elseif (is_object($item) && isset($item->subtotal)) {
                        $subtotal = (float)$item->subtotal;
                    }
                @endphp
                <strong>{{ number_format($subtotal, 2) }}</strong>
            </td>
            <td>
                @php
                    $estado = '-';
                    if (is_array($item) && isset($item['estado'])) {
                        $estado = ucfirst($item['estado']);
                    } elseif (is_object($item) && isset($item->estado)) {
                        $estado = ucfirst($item->estado);
                    }
                @endphp
                <span style="font-size: 11px; padding: 2px 4px; background: #f0f0f0; border-radius: 3px;">
                    {{ $estado }}
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
    <p style="margin-top: 5px; font-size: 8px;">
        Este es un reporte de referencia de ventas.
        Generado el {{ now()->format('d/m/Y \\a \\l\\a\\s H:i') }}.
    </p>
</div>
@endsection
