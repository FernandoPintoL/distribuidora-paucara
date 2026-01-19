{{-- Información general de la entrega --}}
<div class="documento-info" style="width: 100%; box-sizing: border-box;">
    <h2 style="color: #4F81BD; margin: 0 0 8px 0; width: 100%; box-sizing: border-box;">ENTREGA #{{ $entrega->numero_entrega }}</h2>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 10px; width: 100%; box-sizing: border-box; overflow: visible;">
        <!-- Columna izquierda -->
        <div style="font-size: 9px; box-sizing: border-box; width: 100%;">
            <p style="margin: 3px 0; box-sizing: border-box;"><strong>Fecha Asignación:</strong> {{ $entrega->fecha_asignacion->format('d/m/Y H:i') }}</p>
            @if($entrega->fecha_entrega)
                <p style="margin: 3px 0; box-sizing: border-box;"><strong>Fecha Entregado:</strong> {{ $entrega->fecha_entrega->format('d/m/Y H:i') }}</p>
            @endif
            <p style="margin: 3px 0; box-sizing: border-box;">
                <strong>Estado:</strong>
                <span style="display: inline-block; padding: 2px 6px; border-radius: 2px; font-size: 8px; font-weight: bold; box-sizing: border-box;
                    @if($entrega->estado === 'PENDIENTE' || $entrega->estado === 'PROGRAMADO') background: #fff3cd; color: #856404;
                    @elseif($entrega->estado === 'EN_CAMINO' || $entrega->estado === 'EN_TRANSITO') background: #cfe2ff; color: #084298;
                    @elseif($entrega->estado === 'ENTREGADO') background: #d4edda; color: #155724;
                    @elseif($entrega->estado === 'NOVEDAD' || $entrega->estado === 'RECHAZADO') background: #f8d7da; color: #721c24;
                    @elseif($entrega->estado === 'CANCELADA') background: #e2e3e5; color: #383d41;
                    @endif">
                    {{ $entrega->estado }}
                </span>
            </p>
        </div>

        <!-- Columna derecha -->
        <div style="font-size: 9px; box-sizing: border-box; width: 100%;">
            <p style="margin: 3px 0; box-sizing: border-box;"><strong>Chofer:</strong> {{ $entrega->chofer?->nombre ?? 'Sin asignar' }}</p>
            @if($entrega->vehiculo)
                <p style="margin: 3px 0; box-sizing: border-box;"><strong>Vehículo:</strong> {{ $entrega->vehiculo->placa }}</p>
            @endif
            @if($entrega->peso_kg)
                <p style="margin: 3px 0; box-sizing: border-box;"><strong>Peso Total:</strong> {{ number_format($entrega->peso_kg, 2) }} kg</p>
            @endif
        </div>
    </div>

    @if($entrega->observaciones)
        <div style="margin-top: 8px; padding: 6px; background: #f0f0f0; border-left: 3px solid #4F81BD; font-size: 8px; width: 100%; box-sizing: border-box;">
            <strong>Observaciones:</strong> {{ $entrega->observaciones }}
        </div>
    @endif
</div>
