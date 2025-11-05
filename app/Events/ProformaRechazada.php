<?php

namespace App\Events;

use App\Models\Proforma;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProformaRechazada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Proforma $proforma;
    public string $motivoRechazo;

    public function __construct(Proforma $proforma, string $motivoRechazo)
    {
        $this->proforma = $proforma;
        $this->motivoRechazo = $motivoRechazo;

        $this->proforma->load(['cliente']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('proforma.rechazada'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'event' => 'proforma.rechazada',
            'id' => $this->proforma->id,
            'proforma_numero' => $this->proforma->numero,
            'cliente' => [
                'id' => $this->proforma->cliente?->id,
                'nombre' => $this->proforma->cliente?->nombre,
            ],
            'cliente_id' => $this->proforma->cliente_id,
            'motivo_rechazo' => $this->motivoRechazo,
            'fecha_rechazo' => now()->toIso8601String(),
            'estado' => 'RECHAZADA',
        ];
    }

    public function broadcastEventName(): string
    {
        return 'proforma.rechazada';
    }
}
