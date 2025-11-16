<?php

namespace App\Events;

use App\Models\Proforma;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProformaAprobada implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Proforma $proforma;
    public ?int $usuarioAprobadorId;

    public function __construct(Proforma $proforma, ?int $usuarioAprobadorId = null)
    {
        $this->proforma = $proforma;
        $this->usuarioAprobadorId = $usuarioAprobadorId ?? auth()->id();

        $this->proforma->load(['cliente', 'usuarioAprobador', 'usuarioCreador']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('proforma.aprobada'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'event' => 'proforma.aprobada',
            'id' => $this->proforma->id,
            'proforma_numero' => $this->proforma->numero,
            'cliente' => [
                'id' => $this->proforma->cliente?->id,
                'nombre' => $this->proforma->cliente?->nombre,
            ],
            'cliente_id' => $this->proforma->cliente_id,
            'usuario_aprobador' => [
                'id' => $this->usuarioAprobadorId,
                'name' => auth()->user()->name ?? 'Sistema',
            ],
            'total' => $this->proforma->total,
            'fecha_aprobacion' => now()->toIso8601String(),
            'estado' => 'APROBADA',
        ];
    }

    public function broadcastEventName(): string
    {
        return 'proforma.aprobada';
    }
}
