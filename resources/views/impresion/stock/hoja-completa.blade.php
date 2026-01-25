@extends('impresion.layouts.base-a4')

@section('titulo', 'Listado de Stock')

@section('contenido')
{{-- Información del documento --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2 style="color: #3498db;">LISTADO DE STOCK</h2>
            <p><strong>Fecha de generación:</strong> {{ now()->format('d/m/Y H:i') }}</p>
            @if($almacenFiltro)
                <p><strong>Almacén:</strong> {{ $almacenFiltro }}</p>
            @endif
            @if($busquedaFiltro)
                <p><strong>Búsqueda:</strong> {{ $busquedaFiltro }}</p>
            @endif
        </div>
        <div class="documento-info-seccion" style="text-align: right;">
            <p><strong>Total de registros:</strong> {{ count($stock) }}</p>
            <p><strong>Stock total:</strong> {{ number_format($stock->sum('cantidad'), 2) }} unidades</p>
        </div>
    </div>
</div>

{{-- Tabla de stock --}}
<table class="tabla-productos">
    <thead>
        <tr>
            <th style="width: 3%;">#</th>
            <th style="width: 30%;">Producto</th>
            <th style="width: 10%;">Código</th>
            <th style="width: 10%;">SKU</th>
            <th style="width: 17%;">Almacén</th>
            <th style="width: 10%;" class="text-right">Cantidad</th>
        </tr>
    </thead>
    <tbody>
        @foreach($stock as $index => $item)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>
                <strong>{{ $item['producto_nombre'] }}</strong>
            </td>
            <td>{{ $item['producto_codigo'] }}</td>
            <td>{{ $item['producto_sku'] }}</td>
            <td>{{ $item['almacen_nombre'] }}</td>
            <td class="text-right"><strong>{{ number_format($item['cantidad'], 2) }}</strong></td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- Resumen --}}
<div class="totales">
    <table>
        <tr class="total-final">
            <td><strong>TOTAL DE REGISTROS:</strong></td>
            <td class="text-right">
                <strong>{{ count($stock) }}</strong>
            </td>
        </tr>
        <tr class="subtotal-row">
            <td><strong>STOCK TOTAL:</strong></td>
            <td class="text-right">{{ number_format($stock->sum('cantidad'), 2) }} unidades</td>
        </tr>
    </table>
</div>

{{-- Nota de documentación --}}
<div class="observaciones" style="margin-top: 10px; border-left-color: #3498db; background: #ecf0f1;">
    <strong>Nota Informativa:</strong>
    <p style="margin-top: 5px; font-size: 8px;">
        Este es un listado de referencia del inventario de stock de productos.
        Generado el {{ now()->format('d/m/Y \a \l\a\s H:i') }}.
    </p>
</div>
@endsection
