<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reporte Stock Actual - A4</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        @page {
            size: A4;
            margin: 10mm 10mm 15mm 10mm;
        }

        body {
            font-family: 'Segoe UI', Arial, sans-serif;
            font-size: 10px;
            line-height: 1.3;
            color: #333;
        }

        /* Header profesional */
        .header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 12px;
            padding-bottom: 10px;
            border-bottom: 3px solid #1976d2;
        }

        .header-left h1 {
            font-size: 16px;
            color: #1976d2;
            margin: 0;
            font-weight: bold;
        }

        .header-left p {
            font-size: 10px;
            color: #666;
            margin: 2px 0 0 0;
        }

        .header-right {
            text-align: right;
            font-size: 9px;
            color: #999;
        }

        .header-right .empresa {
            font-weight: bold;
            color: #333;
            font-size: 10px;
        }

        /* Información de filtros */
        .filtros-info {
            background: #f0f4f8;
            padding: 8px;
            margin-bottom: 10px;
            border-left: 3px solid #1976d2;
            font-size: 9px;
            border-radius: 2px;
        }

        .filtros-info strong {
            color: #1976d2;
        }

        /* Tabla */
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 10px;
            font-size: 9px;
        }

        table thead {
            background: linear-gradient(to bottom, #1976d2, #1565c0);
            color: white;
        }

        table th {
            padding: 6px 5px;
            text-align: left;
            font-weight: 600;
            border-bottom: 2px solid #1565c0;
        }

        table th.numero {
            text-align: right;
        }

        table td {
            padding: 5px 5px;
            border-bottom: 1px solid #ddd;
        }

        table tbody tr:nth-child(even) {
            background-color: #f9f9f9;
        }

        table tbody tr:hover {
            background-color: #f0f4f8;
        }

        /* Alineación de números */
        td.numero, th.numero {
            text-align: right;
            font-family: 'Courier New', monospace;
        }

        /* Estilos de valores */
        .cantidad {
            font-weight: 500;
        }

        .precio {
            color: #1976d2;
            font-weight: 500;
        }

        /* Resumen */
        .resumen {
            margin-top: 15px;
            padding: 10px;
            background: #f0f4f8;
            border-left: 3px solid #1976d2;
            font-size: 9px;
        }

        .resumen-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 4px;
        }

        .resumen-label {
            font-weight: 600;
        }

        .resumen-valor {
            text-align: right;
            color: #1976d2;
        }

        /* Footer */
        .footer {
            margin-top: 15px;
            padding-top: 8px;
            border-top: 1px solid #ddd;
            text-align: center;
            font-size: 8px;
            color: #999;
            display: flex;
            justify-content: space-between;
        }

        .footer-left {
            text-align: left;
        }

        .footer-center {
            text-align: center;
        }

        .footer-right {
            text-align: right;
        }

        /* Mensaje vacío */
        .empty-state {
            text-align: center;
            padding: 30px;
            color: #999;
        }

        /* Page break */
        .page-break {
            page-break-after: always;
        }

        /* Estilos de datos */
        .sku {
            color: #666;
            font-size: 8px;
        }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div class="header-left">
            <h1>📦 Reporte de Stock Actual</h1>
            <p>Inventario disponible por producto y almacén</p>
        </div>
        <div class="header-right">
            <div class="empresa">{{ $empresa }}</div>
            <div>Generado: {{ $fecha_generacion }}</div>
            <div>{{ now()->format('Y-m-d H:i:s') }}</div>
        </div>
    </div>

    <!-- Contenido -->
    @if(!empty($datos) && count($datos) > 0)
        <!-- Info de filtros -->
        <div class="filtros-info">
            <strong>📊 Total de productos:</strong> {{ count($datos) }} |
            <strong>Stock total:</strong> {{ number_format(collect($datos)->sum('cantidad'), 0) }} unidades |
            <strong>Valor total:</strong> Bs. {{ number_format(collect($datos)->sum('subtotal'), 2) }}
        </div>

        <!-- Tabla de Stock -->
        <table>
            <thead>
                <tr>
                    <th style="width: 28%">Producto</th>
                    <th style="width: 14%">Categoría</th>
                    <th style="width: 14%">Almacén</th>
                    <th class="numero" style="width: 12%">Cantidad</th>
                    <th class="numero" style="width: 13%">P. Unitario</th>
                    <th class="numero" style="width: 19%">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                @foreach($datos as $item)
                    <tr>
                        <td>
                            <strong>{{ substr($item['nombre'], 0, 35) }}</strong>
                            @if(!empty($item['sku']))
                                <br><span class="sku">SKU: {{ $item['sku'] }}</span>
                            @endif
                        </td>
                        <td>{{ substr($item['categoria'] ?? 'N/A', 0, 15) }}</td>
                        <td>{{ substr($item['almacen'] ?? 'N/A', 0, 15) }}</td>
                        <td class="numero cantidad">{{ number_format($item['cantidad'] ?? 0, 0) }}</td>
                        <td class="numero precio">Bs. {{ number_format($item['precio_unitario'] ?? 0, 2) }}</td>
                        <td class="numero precio"><strong>Bs. {{ number_format($item['subtotal'] ?? 0, 2) }}</strong></td>
                    </tr>
                @endforeach
            </tbody>
        </table>

        <!-- Resumen -->
        <div class="resumen">
            <div class="resumen-row">
                <span class="resumen-label">Total de productos:</span>
                <span class="resumen-valor">{{ count($datos) }}</span>
            </div>
            <div class="resumen-row">
                <span class="resumen-label">Stock total:</span>
                <span class="resumen-valor">{{ number_format(collect($datos)->sum('cantidad'), 0) }} unidades</span>
            </div>
            <div class="resumen-row">
                <span class="resumen-label">Valor total del inventario:</span>
                <span class="resumen-valor">Bs. {{ number_format(collect($datos)->sum('subtotal'), 2) }}</span>
            </div>
        </div>

    @else
        <!-- Estado vacío -->
        <div class="empty-state">
            <p style="font-size: 14px; margin-bottom: 10px;">📭</p>
            <p>No hay datos disponibles para este reporte</p>
            <p style="font-size: 8px; color: #ccc; margin-top: 5px;">Intenta ajustar los filtros de búsqueda</p>
        </div>
    @endif

    <!-- Footer -->
    <div class="footer">
        <div class="footer-left">
            <strong>Distribuidora</strong> - Sistema de Inventario
        </div>
        <div class="footer-center">
            Página <span style="float: right;">{{ now()->format('d/m/Y H:i') }}</span>
        </div>
        <div class="footer-right">
            Confidencial
        </div>
    </div>
</body>
</html>
