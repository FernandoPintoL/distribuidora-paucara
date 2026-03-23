<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Entrega #{{ $entrega->numero_entrega }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body {
            font-family: Arial, sans-serif;
            background: white;
            padding: 0;
        }
        .page {
            width: 29.7cm;
            height: 21cm;
            background: white;
            page-break-after: always;
            padding: 0;
        }
        .copia {
            width: 47%;
            padding: 10px;
            box-sizing: border-box;
            border-right: 2px dashed #999;
            font-size: 10px;
            line-height: 1.2;
            overflow: hidden;
            float: left;
            margin-right: 1%;
        }
        .copia:last-child {
            border-right: none;
            float: right;
            margin-right: 0;
        }
        .header {
            text-align: center;
            margin-bottom: 5px;
            border-bottom: 1px solid #000;
            padding-bottom: 3px;
        }
        .header h3 {
            font-size: 11px;
            font-weight: bold;
            margin: 1px 0;
        }
        .header p {
            font-size: 8px;
            font-weight: bold;
            margin: 0;
        }
        .section-title {
            font-size: 8px;
            font-weight: bold;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 2px;
            margin: 2px 0;
            text-align: center;
        }
        .info-row {
            font-size: 8px;
            margin: 1px 0;
            line-height: 1.2;
        }
        .info-row strong {
            font-weight: bold;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 2px 0;
            font-size: 8px;
        }
        table thead tr {
            border-bottom: 1px solid #000;
            background: #f5f5f5;
        }
        table th {
            padding: 1px;
            text-align: left;
            font-weight: bold;
        }
        table td {
            padding: 1px;
            border-bottom: 1px solid #ccc;
        }
        .text-center {
            text-align: center;
        }
        .text-right {
            text-align: right;
        }
        .resumen-box {
            border: 1px solid #000;
            padding: 2px;
            margin: 2px 0;
            font-size: 8px;
        }
        .separador {
            border-top: 1px dashed #999;
            margin: 2px 0;
        }
        .firmas {
            margin-top: 2px;
            font-size: 8px;
        }
        .firma-linea {
            border-bottom: 1px solid #000;
            height: 30px;
            margin-bottom: 1px;
        }
    </style>
</head>
<body>
    @php
        $impresionService = app(\App\Services\ImpresionEntregaService::class);
        $productosGenerico = $impresionService->obtenerProductosAgrupados($entrega);
        $estadisticas = $impresionService->obtenerEstadisticas($entrega);
    @endphp

    <div class="page">
        <!-- COPIA 1 -->
        <div class="copia">
            <!-- Header -->
            <div class="header">
                <h3>ENTREGA N° {{ $entrega->id }}</h3>
                <p>{{ $entrega->numero_entrega }} | {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }}</p>
            </div>

            <!-- Chofer y Vehículo -->
            <div class="section-title">CHOFER Y VEHÍCULO</div>
            @if($entrega->chofer)
                <div class="info-row">
                    <strong>Chofer:</strong> {{ $entrega->chofer?->name ?? $entrega->chofer?->nombre ?? 'S/N' }}
                    @if($entrega->chofer?->phone)
                        | {{ $entrega->chofer?->phone }}
                    @endif
                </div>
            @else
                <div class="info-row">Sin chofer asignado</div>
            @endif

            @if($entrega->vehiculo)
                <div class="info-row">
                    <strong>Placa:</strong> {{ $entrega->vehiculo?->placa }}
                    @if($entrega->vehiculo?->marca)
                        | {{ $entrega->vehiculo?->marca }}
                    @endif
                </div>
            @else
                <div class="info-row">Sin vehículo asignado</div>
            @endif

            @if($entrega->entregador)
                <div class="info-row">
                    <strong>Entregador:</strong> {{ $entrega->entregador?->name ?? $entrega->entregador?->nombre ?? 'S/N' }}
                </div>
            @endif

            <!-- Localidades -->
            @if($localidades && $localidades->count() > 0)
                <div class="info-row">
                    <strong>Localidades:</strong>
                    @foreach($localidades as $loc)
                        {{ $loc?->nombre }}{{ !$loop->last ? ', ' : '' }}
                    @endforeach
                </div>
            @endif

            <!-- Peso -->
            @if($entrega->peso_kg)
                <div class="info-row">
                    <strong>Peso:</strong> {{ number_format($entrega->peso_kg, 2) }} kg
                </div>
            @endif

            <!-- Lista Genérica -->
            <div class="section-title">LISTA</div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-right">Cant</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($productosGenerico as $producto)
                        <tr>
                            <td>{{ substr($producto['producto_nombre'], 0, 20) }}</td>
                            <td class="text-right">{{ number_format($producto['cantidad_total'], 1) }}</td>
                            <td class="text-right">{{ number_format($producto['subtotal_total'], 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3" class="text-center">Sin productos</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <!-- Resumen de Pagos -->
            @if($resumen_pagos)
                <div class="section-title">RESUMEN DE PAGOS</div>
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Total Esperado:</strong></td>
                            <td class="text-right">{{ number_format($resumen_pagos['total_esperado'], 2) }}</td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td><strong>Recibido:</strong></td>
                            <td class="text-right">{{ number_format($resumen_pagos['total_recibido'], 2) }}</td>
                        </tr>
                        <tr>
                            <td><strong>Falta:</strong></td>
                            <td class="text-right">{{ number_format($resumen_pagos['diferencia'], 2) }}</td>
                        </tr>
                    </tbody>
                </table>

                @if(count($resumen_pagos['sin_registrar']) > 0)
                    <div class="resumen-box" style="background-color: #fff3e0;">
                        <strong>SIN PAGO ({{ count($resumen_pagos['sin_registrar']) }})</strong>
                        @foreach($resumen_pagos['sin_registrar'] as $venta)
                            <div>{{ $venta['venta_numero'] }}: {{ number_format($venta['monto'], 2) }}</div>
                        @endforeach
                    </div>
                @endif
            @endif

            <!-- Firmas -->
            <div class="firmas">
                <div class="firma-linea"></div>
                <div class="text-center"><strong>Firma Chofer</strong></div>
            </div>
        </div>

        <!-- COPIA 2 (Idéntica) -->
        <div class="copia">
            <!-- Header -->
            <div class="header">
                <h3>ENTREGA N° {{ $entrega->id }}</h3>
                <p>{{ $entrega->numero_entrega }} | {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }}</p>
            </div>

            <!-- Chofer y Vehículo -->
            <div class="section-title">CHOFER Y VEHÍCULO</div>
            @if($entrega->chofer)
                <div class="info-row">
                    <strong>Chofer:</strong> {{ $entrega->chofer?->name ?? $entrega->chofer?->nombre ?? 'S/N' }}
                    @if($entrega->chofer?->phone)
                        | {{ $entrega->chofer?->phone }}
                    @endif
                </div>
            @else
                <div class="info-row">Sin chofer asignado</div>
            @endif

            @if($entrega->vehiculo)
                <div class="info-row">
                    <strong>Placa:</strong> {{ $entrega->vehiculo?->placa }}
                    @if($entrega->vehiculo?->marca)
                        | {{ $entrega->vehiculo?->marca }}
                    @endif
                </div>
            @else
                <div class="info-row">Sin vehículo asignado</div>
            @endif

            @if($entrega->entregador)
                <div class="info-row">
                    <strong>Entregador:</strong> {{ $entrega->entregador?->name ?? $entrega->entregador?->nombre ?? 'S/N' }}
                </div>
            @endif

            <!-- Localidades -->
            @if($localidades && $localidades->count() > 0)
                <div class="info-row">
                    <strong>Localidades:</strong>
                    @foreach($localidades as $loc)
                        {{ $loc?->nombre }}{{ !$loop->last ? ', ' : '' }}
                    @endforeach
                </div>
            @endif

            <!-- Peso -->
            @if($entrega->peso_kg)
                <div class="info-row">
                    <strong>Peso:</strong> {{ number_format($entrega->peso_kg, 2) }} kg
                </div>
            @endif

            <!-- Lista Genérica -->
            <div class="section-title">LISTA</div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th class="text-right">Cant</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @forelse($productosGenerico as $producto)
                        <tr>
                            <td>{{ substr($producto['producto_nombre'], 0, 20) }}</td>
                            <td class="text-right">{{ number_format($producto['cantidad_total'], 1) }}</td>
                            <td class="text-right">{{ number_format($producto['subtotal_total'], 2) }}</td>
                        </tr>
                    @empty
                        <tr>
                            <td colspan="3" class="text-center">Sin productos</td>
                        </tr>
                    @endforelse
                </tbody>
            </table>

            <!-- Resumen de Pagos -->
            @if($resumen_pagos)
                <div class="section-title">RESUMEN DE PAGOS</div>
                <table>
                    <tbody>
                        <tr>
                            <td><strong>Total Esperado:</strong></td>
                            <td class="text-right">{{ number_format($resumen_pagos['total_esperado'], 2) }}</td>
                        </tr>
                        <tr style="background-color: #f0f0f0;">
                            <td><strong>Recibido:</strong></td>
                            <td class="text-right">{{ number_format($resumen_pagos['total_recibido'], 2) }}</td>
                        </tr>
                        <tr>
                            <td><strong>Falta:</strong></td>
                            <td class="text-right">{{ number_format($resumen_pagos['diferencia'], 2) }}</td>
                        </tr>
                    </tbody>
                </table>

                @if(count($resumen_pagos['sin_registrar']) > 0)
                    <div class="resumen-box" style="background-color: #fff3e0;">
                        <strong>SIN PAGO ({{ count($resumen_pagos['sin_registrar']) }})</strong>
                        @foreach($resumen_pagos['sin_registrar'] as $venta)
                            <div>{{ $venta['venta_numero'] }}: {{ number_format($venta['monto'], 2) }}</div>
                        @endforeach
                    </div>
                @endif
            @endif

            <!-- Firmas -->
            <div class="firmas">
                <div class="firma-linea"></div>
                <div class="text-center"><strong>Firma Chofer</strong></div>
            </div>
        </div>
    </div>
</body>
</html>
