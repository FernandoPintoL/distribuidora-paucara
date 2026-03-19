@extends('impresion.layouts.base-ticket')

@section('contenido')
    <div class="ticket">
        <h1 class="text-center text-sm font-bold mb-1">PRÉSTAMO DE CANASTILLAS / EMBASES</h1>

        <p class="text-center text-xs mb-1">
            {{ $empresa->razon_social ?? $empresa->nombre ?? 'La Empresa' }}
        </p>

        <p class="text-xs mb-1">
            <strong>Fecha:</strong> {{ optional($documento->created_at)->format('d/m/Y H:i') }}
            <br>
            <strong>ID préstamo:</strong> #{{ $documento->id }}
        </p>

        <p class="text-xs mb-1">
            <strong>Cliente:</strong>
            {{ $documento->cliente->razon_social ?? $documento->cliente->nombre ?? 'Sin nombre' }}
            <br>
            <strong>Doc.:</strong> {{ $documento->cliente->numero_documento ?? 'N/D' }}
        </p>

        @if($documento->chofer)
            <p class="text-xs mb-1">
                <strong>Chofer:</strong>
                {{ $documento->chofer->name ?? $documento->chofer->nombre ?? 'N/D' }}
            </p>
        @endif

        <hr>

        <p class="text-xs mb-1"><strong>DETALLE DEL PRÉSTAMO</strong></p>

        <p class="text-xs">
            {{ $documento->prestable->nombre ?? 'Prestable' }}
            <br>
            Prestado: {{ number_format($documento->cantidad_prestada ?? $documento->cantidad ?? 0, 0) }}
            <br>
            Devuelto: {{ number_format($documento->cantidad_devuelta ?? ($documento->devoluciones->sum('cantidad') ?? 0), 0) }}
            <br>
            Pendiente: {{ number_format(($documento->cantidad_prestada ?? $documento->cantidad ?? 0) - ($documento->cantidad_devuelta ?? ($documento->devoluciones->sum('cantidad') ?? 0)), 0) }}
        </p>

        <hr>

        <p class="text-xs mb-1">
            <strong>Fecha límite devolución:</strong>
            {{ optional($documento->fecha_limite_devolucion ?? $documento->fecha_devolucion_estimada ?? null)->format('d/m/Y') ?? 'No registrada' }}
        </p>

        @if(!empty($documento->observaciones))
            <p class="text-xs mb-1">
                <strong>Obs.:</strong> {{ $documento->observaciones }}
            </p>
        @endif

        <p class="text-[10px] mt-2">
            El cliente se compromete a devolver las canastillas/embases en buen estado dentro del plazo acordado.
        </p>
    </div>
@endsection
