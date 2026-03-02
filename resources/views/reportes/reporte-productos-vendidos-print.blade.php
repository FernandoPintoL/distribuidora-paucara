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
            font-size: 11px;
            line-height: 1.4;
            color: #333;
        }
        .container {
            max-width: 100%;
            margin: 0;
            padding: 20px;
        }
        .header {
            text-align: center;
            margin-bottom: 20px;
            border-bottom: 2px solid #333;
            padding-bottom: 10px;
        }
        .header h1 {
            font-size: 18px;
            margin-bottom: 5px;
        }
        .header p {
            font-size: 10px;
            color: #666;
        }
        .info-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 10px;
            font-size: 10px;
        }
        .info-row span {
            margin-right: 20px;
        }
        .section-title {
            font-size: 13px;
            font-weight: bold;
            margin-top: 20px;
            margin-bottom: 10px;
            background-color: #f0f0f0;
            padding: 5px;
            border-left: 3px solid #333;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            font-size: 10px;
        }
        table thead {
            background-color: #f0f0f0;
        }
        table th {
            border: 1px solid #999;
            padding: 5px;
            text-align: left;
            font-weight: bold;
        }
        table td {
            border: 1px solid #ddd;
            padding: 5px;
        }
        table tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        .number {
            text-align: right;
        }
        .totales {
            display: flex;
            gap: 20px;
            margin-top: 15px;
            font-size: 11px;
            font-weight: bold;
        }
        .total-box {
            flex: 1;
            background-color: #f0f0f0;
            padding: 10px;
            border: 1px solid #999;
            border-radius: 4px;
        }
        .total-label {
            color: #666;
            font-size: 9px;
            margin-bottom: 3px;
        }
        .total-value {
            font-size: 14px;
            color: #333;
        }
        .footer {
            margin-top: 30px;
            text-align: center;
            font-size: 9px;
            color: #999;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📊 Reporte de Productos Vendidos</h1>
            <p>Distribuidora Paucara</p>
        </div>

        <div class="info-row">
            <span><strong>Período:</strong> {{ $fechaDesde }} al {{ $fechaHasta }}</span>
            @if ($usuarioNombre)
                <span><strong>Preventista:</strong> {{ $usuarioNombre }}</span>
            @endif
            <span><strong>Generado:</strong> {{ now()->format('d/m/Y H:i') }}</span>
        </div>

        <div class="totales">
            <div class="total-box">
                <div class="total-label">Cantidad de Productos</div>
                <div class="total-value">{{ $totales['cantidad_productos'] ?? 0 }}</div>
            </div>
            <div class="total-box">
                <div class="total-label">Cantidad Total Vendida</div>
                <div class="total-value">{{ number_format($totales['cantidad_total_vendida'] ?? 0, 2, ',', '.') }}</div>
            </div>
            <div class="total-box">
                <div class="total-label">Total Venta General</div>
                <div class="total-value">Bs. {{ number_format($totales['total_venta_general'] ?? 0, 2, ',', '.') }}</div>
            </div>
            <div class="total-box">
                <div class="total-label">Precio Promedio</div>
                <div class="total-value">Bs. {{ number_format($totales['precio_promedio_general'] ?? 0, 2, ',', '.') }}</div>
            </div>
        </div>

        @if (count($productos) > 0)
            <div class="section-title">📦 Productos Vendidos</div>
            <table>
                <thead>
                    <tr>
                        <th>Producto</th>
                        <th>Código</th>
                        <th class="number">Cantidad</th>
                        <th class="number">Precio Promedio</th>
                        <th class="number">Total Venta</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($productos as $producto)
                        <tr>
                            <td>{{ $producto['nombre'] ?? 'N/A' }}</td>
                            <td>{{ $producto['codigo'] ?? 'N/A' }}</td>
                            <td class="number">{{ number_format($producto['cantidad_total'] ?? 0, 2, ',', '.') }}</td>
                            <td class="number">Bs. {{ number_format($producto['precio_promedio'] ?? 0, 2, ',', '.') }}</td>
                            <td class="number">Bs. {{ number_format($producto['total_venta'] ?? 0, 2, ',', '.') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        @if (count($ventas) > 0)
            <div class="section-title">📋 Ventas Aprobadas</div>
            <table>
                <thead>
                    <tr>
                        <th>Venta #</th>
                        <th>Cliente</th>
                        <th>Usuario</th>
                        <th>Fecha</th>
                        <th>Estado</th>
                        <th class="number">Total</th>
                    </tr>
                </thead>
                <tbody>
                    @foreach ($ventas as $venta)
                        <tr>
                            <td>{{ $venta['numero'] ?? 'N/A' }}</td>
                            <td>{{ $venta['cliente'] ?? 'N/A' }}</td>
                            <td>{{ $venta['usuario'] ?? 'N/A' }}</td>
                            <td>
                                @if ($venta['fecha'] ?? null)
                                    {{ \Carbon\Carbon::parse($venta['fecha'])->format('d/m/Y') }}
                                @else
                                    N/A
                                @endif
                            </td>
                            <td>{{ $venta['estado'] ?? 'N/A' }}</td>
                            <td class="number">Bs. {{ number_format($venta['total'] ?? 0, 2, ',', '.') }}</td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        @endif

        <div class="footer">
            <p>Este reporte fue generado automáticamente por el sistema Distribuidora Paucara</p>
        </div>
    </div>
</body>
</html>
