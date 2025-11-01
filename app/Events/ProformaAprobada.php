<?php

namespace App\Events;

use App\Models\Proforma;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProformaAprobada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Proforma $proforma;
    public string $mensaje;

    /**
     * Create a new event instance.
     */
    public function __construct(Proforma $proforma)
    {
        $this->proforma = $proforma;
        $this->mensaje = "Proforma {$proforma->numero} ha sido aprobada";
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('pedido.' . $this->proforma->id),
            new PrivateChannel('admin.pedidos'),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'proforma_id' => $this->proforma->id,
            'numero' => $this->proforma->numero,
            'estado' => $this->proforma->estado,
            'fecha_aprobacion' => $this->proforma->fecha_aprobacion,
            'mensaje' => $this->mensaje,
            'timestamp' => now(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'proforma.aprobada';
    }
}
