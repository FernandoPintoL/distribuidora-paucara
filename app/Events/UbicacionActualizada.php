<?php

namespace App\Events;

use App\Models\UbicacionTracking;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class UbicacionActualizada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public UbicacionTracking $ubicacion;

    public function __construct(UbicacionTracking $ubicacion)
    {
        $this->ubicacion = $ubicacion;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('entrega.' . $this->ubicacion->entrega_id),
            new PrivateChannel('pedido.' . $this->ubicacion->entrega->proforma_id),
            new PrivateChannel('admin.pedidos'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'ubicacion_id' => $this->ubicacion->id,
            'entrega_id' => $this->ubicacion->entrega_id,
            'latitud' => (float) $this->ubicacion->latitud,
            'longitud' => (float) $this->ubicacion->longitud,
            'velocidad' => $this->ubicacion->velocidad,
            'rumbo' => $this->ubicacion->rumbo,
            'altitud' => $this->ubicacion->altitud,
            'precision' => $this->ubicacion->precision,
            'timestamp' => $this->ubicacion->timestamp,
            'evento' => $this->ubicacion->evento,
            'mensaje' => 'Ubicación actualizada',
        ];
    }

    public function broadcastAs(): string
    {
        return 'ubicacion.actualizada';
    }
}
