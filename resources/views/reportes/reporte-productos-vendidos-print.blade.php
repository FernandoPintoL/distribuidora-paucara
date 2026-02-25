<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte de Productos Vendidos</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            color: #333;
            background: white;
            padding: 20px;
        }

        .container {
            max-width: 900px;
            margin: 0 auto;
            background: white;
        }

        .header {
            text-align: center;
            border-bottom: 2px solid #1f2937;
            padding-bottom: 20px;
            margin-bottom: 20px;
        }

        .header h1 {
            font-size: 24px;
            font-weight: bold;
            margin-bottom: 5px;
            color: #1f2937;
        }

        .header p {
            font-size: 12px;
            color: #6b7280;
        }

        .info-row {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            margin-bottom: 20px;
            padding: 10px;
            background: #f3f4f6;
            border-radius: 4px;
            font-size: 12px;
        }

        .info-row .item {
            display: flex;
            justify-content: space-between;
        }

        .info-row .label {
            font-weight: bold;
            color: #374151;
        }

        .info-row .value {
            color: #1f2937;
        }

        .section-title {
            font-size: 14px;
            font-weight: bold;
            color: #1f2937;
            margin-top: 25px;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e5e7eb;
        }

        .summary-cards {
            display: table;
            width: 100%;
            margin-bottom: 20px;
            page-break-inside: avoid;
            border-collapse: collapse;
        }

        .summary-card {
            display: table-cell;
            border: 1px solid #e5e7eb;
            padding: 10px;
            text-align: center;
            background: #f9fafb;
            width: 25%;
        }

        .summary-card .label {
            font-size: 11px;
            font-weight: bold;
            color: #6b7280;
            text-transform: uppercase;
            margin-bottom: 5px;
            line-height: 1.3;
            display: block;
        }

        .summary-card .value {
            font-size: 16px;
            font-weight: bold;
            color: #1f2937;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 12px;
        }

        table thead {
            background: #1f2937;
            color: white;
        }

        table th {
            padding: 10px;
            text-align: left;
            font-weight: bold;
            border: 1px solid #1f2937;
        }

        table td {
            padding: 10px;
            border: 1px solid #e5e7eb;
            text-align: left;
        }

        table tbody tr:nth-child(even) {
            background: #f9fafb;
        }

        table tbody tr:hover {
            background: #f3f4f6;
        }

        .text-right {
            text-align: right;
        }

        .text-center {
            text-align: center;
        }

        .footer {
            margin-top: 30px;
            padding-top: 15px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            font-size: 11px;
            color: #6b7280;
        }

        .footer p {
            margin: 5px 0;
        }

        @media print {
            body {
                padding: 0;
            }
            .container {
                max-width: 100%;
            }
            table {
                page-break-inside: avoid;
            }
            .section-title {
                page-break-after: avoid;
            }
        }

        .usuario-badge {
            display: inline-block;
            background: #3b82f6;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: bold;
            margin: 5px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <!-- Header -->
        <div class="header">
            <h1>📊 Reporte de Productos Vendidos</h1>
            <p>Análisis de productos vendidos en proformas convertidas a ventas aprobadas</p>
        </div>

        <!-- Info -->
        <div class="info-row">
            <div class="item">
                <span class="label">Período:</span>
                <span class="value">{{ $fechaDesde }} a {{ $fechaHasta }}</span>
            </div>
            <div class="item">
                <span class="label">Generado:</span>
                <span class="value">{{ now()->format('d/m/Y H:i:s') }}</span>
            </div>
            @if ($usuarioNombre)
                <div class="item">
                    <span class="label">Preventista:</span>
                    <span class="value usuario-badge">{{ $usuarioNombre }}</span>
                </div>
            @endif
        </div>

        <!-- Resumen -->
        <div class="section-title">Resumen</div>
        <div class="summary-cards">
            <div class="summary-card">
                <div class="label">Productos Únicos</div>
                <div class="value">{{ $totales['cantidad_productos'] }}</div>
            </div>
            <div class="summary-card">
                <div class="label">Cantidad Total Vendida</div>
                <div class="value">{{ number_format($totales['cantidad_total_vendida'], 2, '.', ',') }}</div>
            </div>
            <div class="summary-card">
                <div class="label">Total Venta General</div>
                <div class="value">Bs. {{ number_format($totales['total_venta_general'], 2, '.', ',') }}</div>
            </div>
            <div class="summary-card">
                <div class="label">Precio Promedio</div>
                <div class="value">Bs. {{ number_format($totales['precio_promedio_general'], 2, '.', ',') }}</div>
            </div>
        </div>

        <!-- Tabla de Productos -->
        <div class="section-title">Productos</div>
        @if (count($productos) > 0)
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th class="text-right">Cantidad</th>
                        <th class="text-right">Precio Promedio</th>
                        <th class="text-right">Total Venta</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($productos as $producto)
                        <tr>
                            <td>{{ $producto['nombre'] }}</td>
                            <td>{{ $producto['codigo'] }}</td>
                            <td class="text-right">{{ number_format($producto['cantidad_total'], 2, '.', ',') }}</td>
                            <td class="text-right">Bs. {{ number_format($producto['precio_promedio'], 2, '.', ',') }}</td>
                            <td class="text-right"><strong>Bs. {{ number_format($producto['total_venta'], 2, '.', ',') }}</strong></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p class="text-center">No hay productos vendidos en el período seleccionado.</p>
        @endif

        <!-- Tabla de Ventas -->
        <div class="section-title">Ventas Aprobadas</div>
        @if (count($ventas) > 0)
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th># Proforma</th>
                        <th>Fecha Proforma</th>
                        <th># Venta</th>
                        <th>Cliente</th>
                        <th>Usuario</th>
                        <th>Fecha Venta</th>
                        <th>Est. Documento</th>
                        <th>Est. Entrega</th>
                        <th class="text-right">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($ventas as $venta)
                        <tr>
                            <td>{{ $venta['id'] }}</td>
                            <td>{{ $venta['proforma_numero'] }}</td>
                            <td>{{ \Carbon\Carbon::parse($venta['proforma_fecha'])->format('d/m/Y') }}</td>
                            <td>{{ $venta['numero'] }}</td>
                            <td>{{ $venta['cliente'] }}</td>
                            <td>{{ $venta['usuario'] }}</td>
                            <td>{{ \Carbon\Carbon::parse($venta['fecha'])->format('d/m/Y') }}</td>
                            <td><strong>{{ $venta['estado'] }}</strong></td>
                            <td>
                                @if ($venta['confirmado_en'])
                                    <strong>{{ $venta['estado_entrega'] ?? 'N/A' }}</strong><br>

                                    {{-- Tipo de entrega --}}
                                    @if ($venta['tipo_entrega'])
                                        <small style="color: {{ $venta['tipo_entrega'] === 'COMPLETA' ? 'green' : 'orange' }};">
                                            📦 {{ $venta['tipo_entrega'] }}
                                        </small><br>
                                    @endif

                                    {{-- Contexto de entrega --}}
                                    @if ($venta['tienda_abierta'] !== null)
                                        <small>Tienda: {{ $venta['tienda_abierta'] ? '✓ Abierta' : '✗ Cerrada' }}</small><br>
                                    @endif
                                    @if ($venta['cliente_presente'] !== null)
                                        <small>Cliente: {{ $venta['cliente_presente'] ? '✓ Presente' : '✗ Ausente' }}</small><br>
                                    @endif

                                    {{-- Tipo de novedad si aplica --}}
                                    @if ($venta['tipo_novedad'])
                                        <small style="color: red;"><strong>⚠️ {{ str_replace('_', ' ', $venta['tipo_novedad']) }}</strong></small><br>
                                    @endif

                                    {{-- Estado de pago --}}
                                    @if ($venta['estado_pago'])
                                        <small><strong>Pago: {{ $venta['estado_pago'] }}</strong></small>
                                        @if ($venta['total_dinero_recibido'] > 0)
                                            <small>(Bs. {{ number_format($venta['total_dinero_recibido'], 2, '.', ',') }})</small>
                                            @if ($venta['monto_pendiente'] > 0)
                                                <small style="color: red;"> Pendiente: Bs. {{ number_format($venta['monto_pendiente'], 2, '.', ',') }}</small>
                                            @endif
                                            <br>
                                        @else
                                            <br>
                                        @endif
                                    @endif

                                    {{-- Observaciones de logística --}}
                                    @if ($venta['observaciones_logistica'])
                                        <small style="font-style: italic;">📝 {{ substr($venta['observaciones_logistica'], 0, 80) }}{{ strlen($venta['observaciones_logistica']) > 80 ? '...' : '' }}</small>
                                    @endif
                                @else
                                    <em>Sin confirmar</em>
                                @endif
                            </td>
                            <td class="text-right"><strong>Bs. {{ number_format($venta['total'], 2, '.', ',') }}</strong></td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @else
            <p class="text-center">No hay ventas aprobadas en el período seleccionado.</p>
        @endif

        <!-- Footer -->
        <div class="footer">
            <p>Este reporte fue generado automáticamente por el sistema.</p>
            <p>Para más información contacte con administración.</p>
        </div>
    </div>
</body>
</html>
