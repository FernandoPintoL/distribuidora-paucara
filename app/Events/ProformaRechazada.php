<?php

namespace App\Events;

use App\Models\Proforma;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProformaRechazada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Proforma $proforma;
    public string $motivo;

    /**
     * Create a new event instance.
     */
    public function __construct(Proforma $proforma, string $motivo = '')
    {
        $this->proforma = $proforma;
        $this->motivo = $motivo;
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
            'motivo' => $this->motivo,
            'mensaje' => "Proforma {$this->proforma->numero} ha sido rechazada",
            'timestamp' => now(),
        ];
    }

    /**
     * The event's broadcast name.
     */
    public function broadcastAs(): string
    {
        return 'proforma.rechazada';
    }
}
