<?php

namespace App\Events;

use App\Models\Proforma;
use App\Models\Venta;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class ProformaConvertida implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public Proforma $proforma;
    public Venta $venta;

    public function __construct(Proforma $proforma, Venta $venta)
    {
        $this->proforma = $proforma;
        $this->venta = $venta;

        $this->proforma->load(['cliente']);
        $this->venta->load(['cliente']);
    }

    public function broadcastOn(): array
    {
        return [
            new Channel('proforma.convertida'),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'event' => 'proforma.convertida',
            'proforma_id' => $this->proforma->id,
            'proforma_numero' => $this->proforma->numero,
            'venta_numero' => $this->venta->numero,
            'venta_id' => $this->venta->id,
            'cliente' => [
                'id' => $this->proforma->cliente?->id,
                'nombre' => $this->proforma->cliente?->nombre,
            ],
            'total' => $this->proforma->total,
            'fecha_conversion' => now()->toIso8601String(),
            'estado' => 'CONVERTIDA',
        ];
    }

    public function broadcastEventName(): string
    {
        return 'proforma.convertida';
    }
}
