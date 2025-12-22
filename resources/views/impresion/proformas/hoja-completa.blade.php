@extends('impresion.layouts.base-a4')

@section('titulo', 'Proforma #' . $documento->numero)

@section('contenido')
{{-- Información del documento --}}
<div class="documento-info">
    <div class="documento-info-grid">
        <div class="documento-info-seccion">
            <h2 style="color: #2ecc71;">PROFORMA #{{ $documento->numero }}</h2>
            <p><strong>Fecha:</strong> {{ $documento->fecha->format('d/m/Y') }}</p>
            <p><strong>Válida hasta:</strong> {{ $documento->fecha_vencimiento ? $documento->fecha_vencimiento->format('d/m/Y') : 'N/A' }}</p>
            <p><strong>Cliente:</strong> {{ $documento->cliente->nombre }}</p>
            @if($documento->cliente->nit)
                <p><strong>NIT/CI:</strong> {{ $documento->cliente->nit }}</p>
            @endif
            @if($documento->cliente->direccion)
                <p><strong>Dirección:</strong> {{ $documento->cliente->direccion }}</p>
            @endif
        </div>
        <div class="documento-info-seccion" style="text-align: right;">
            <p><strong>Estado:</strong>
                <span style="padding: 3px 8px; border-radius: 3px;
                    @if($documento->estado === 'PENDIENTE') background: #fff3cd; color: #856404;
                    @elseif($documento->estado === 'APROBADA') background: #d4edda; color: #155724;
                    @elseif($documento->estado === 'RECHAZADA') background: #f8d7da; color: #721c24;
                    @elseif($documento->estado === 'CONVERTIDA') background: #d1ecf1; color: #0c5460;
                    @endif">
                    {{ $documento->estado }}
                </span>
            </p>
            <p><strong>Moneda:</strong> {{ $documento->moneda->codigo ?? 'BOB' }}</p>
            @if($documento->usuarioCreador)
                <p><strong>Creado por:</strong> {{ $documento->usuarioCreador->name }}</p>
            @endif
            @if($documento->usuarioAprobador)
                <p><strong>Aprobado por:</strong> {{ $documento->usuarioAprobador->name }}</p>
                <p><strong>Fecha aprobación:</strong> {{ $documento->fecha_aprobacion->format('d/m/Y H:i') }}</p>
            @endif
        </div>
    </div>
</div>

{{-- Tabla de productos --}}
<table class="tabla-productos">
    <thead>
        <tr>
            <th style="width: 5%;">#</th>
            <th style="width: 45%;">Producto</th>
            <th style="width: 10%;">Cant.</th>
            <th style="width: 12%;">P. Unit.</th>
            <th style="width: 10%;">Desc.</th>
            <th style="width: 18%;" class="text-right">Subtotal</th>
        </tr>
    </thead>
    <tbody>
        @foreach($documento->detalles as $index => $detalle)
        <tr>
            <td>{{ $index + 1 }}</td>
            <td>
                <strong>{{ $detalle->producto->nombre }}</strong>
                @if($detalle->producto->codigo)
                    <br><small style="color: #666;">Código: {{ $detalle->producto->codigo }}</small>
                @endif
                @if($detalle->producto->descripcion)
                    <br><small style="color: #888;">{{ Str::limit($detalle->producto->descripcion, 60) }}</small>
                @endif
            </td>
            <td>{{ number_format($detalle->cantidad, 2) }}</td>
            <td>{{ number_format($detalle->precio_unitario, 2) }}</td>
            <td>{{ number_format($detalle->descuento ?? 0, 2) }}</td>
            <td class="text-right"><strong>{{ number_format($detalle->subtotal, 2) }}</strong></td>
        </tr>
        @endforeach
    </tbody>
</table>

{{-- Totales --}}
<div class="totales">
    <table>
        <tr class="subtotal-row">
            <td><strong>Subtotal:</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->subtotal, 2) }}</td>
        </tr>
        @if($documento->descuento > 0)
        <tr>
            <td><strong>Descuento:</strong></td>
            <td class="text-right">-{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->descuento, 2) }}</td>
        </tr>
        @endif
        @if($documento->impuesto > 0)
        <tr>
            <td><strong>Impuesto ({{ $opciones['porcentaje_impuesto'] ?? '13' }}%):</strong></td>
            <td class="text-right">{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->impuesto, 2) }}</td>
        </tr>
        @endif
        <tr class="total-final">
            <td><strong>TOTAL:</strong></td>
            <td class="text-right">
                <strong>{{ $documento->moneda->simbolo ?? 'Bs' }} {{ number_format($documento->total, 2) }}</strong>
            </td>
        </tr>
    </table>
</div>

{{-- Observaciones --}}
@if($documento->observaciones)
<div class="observaciones">
    <strong>Observaciones:</strong>
    {{ $documento->observaciones }}
</div>
@endif

{{-- Nota importante de proforma --}}
<div class="observaciones" style="margin-top: 10px; border-left-color: #2ecc71; background: #f0fff4;">
    <strong>Nota Importante:</strong>
    <p style="margin-top: 5px; font-size: 8px;">
        Esta es una cotización válida hasta la fecha indicada. No constituye un documento fiscal.
        Los precios están sujetos a cambios sin previo aviso.
    </p>
</div>
@endsection
