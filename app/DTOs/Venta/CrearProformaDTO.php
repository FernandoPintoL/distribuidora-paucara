<?php

namespace App\DTOs\Venta;

use App\DTOs\BaseDTO;
use Illuminate\Http\Request;

/**
 * DTO para crear una proforma
 */
class CrearProformaDTO extends BaseDTO
{
    public function __construct(
        public int $cliente_id,
        public string $fecha,
        public string $fecha_vencimiento,
        public array $detalles,
        public float $subtotal,
        public float $impuesto,
        public float $total,
        public ?int $almacen_id = 2,
        public ?string $observaciones = null,
        public ?string $canal = 'PRESENCIAL',
        public ?string $politica_pago = 'CONTRA_ENTREGA',
        public ?int $usuario_id = null,
        public ?int $preventista_id = null,
        public ?string $estado_inicial = 'BORRADOR',  // BORRADOR o PENDIENTE
    ) {}

    /**
     * Factory: Crear desde Request
     *
     * IMPORTANTE: usuario_id siempre será el usuario autenticado (Auth::id())
     * NO el user_id de la relación cliente, sino el ID del usuario logueado
     */
    public static function fromRequest(Request $request): self
    {
        $estadoInicial = $request->input('estado_inicial', 'BORRADOR');

        // ✅ Validar que estado sea BORRADOR o PENDIENTE
        if (!in_array($estadoInicial, ['BORRADOR', 'PENDIENTE'])) {
            $estadoInicial = 'BORRADOR';
        }

        return new self(
            cliente_id: (int) $request->input('cliente_id'),
            fecha: $request->input('fecha', today()->toDateString()),
            fecha_vencimiento: $request->input('fecha_vencimiento', today()->addDays(15)->toDateString()),
            detalles: $request->input('detalles', []),
            subtotal: (float) $request->input('subtotal', 0),
            impuesto: (float) $request->input('impuesto', 0),
            total: (float) $request->input('total', 0),
            almacen_id: (int) $request->input('almacen_id', 1),
            observaciones: $request->input('observaciones'),
            canal: $request->input('canal', 'PRESENCIAL'),
            politica_pago: $request->input('politica_pago', 'CONTRA_ENTREGA'),
            usuario_id: \Illuminate\Support\Facades\Auth::id(),
            preventista_id: $request->input('preventista_id') ? (int) $request->input('preventista_id') : null,
            estado_inicial: $estadoInicial,
        );
    }

    /**
     * Validar detalles
     */
    public function validarDetalles(): void
    {
        if (empty($this->detalles)) {
            throw new \InvalidArgumentException('Una proforma debe tener al menos un detalle');
        }

        foreach ($this->detalles as $detalle) {
            if (!isset($detalle['producto_id']) || !isset($detalle['cantidad'])) {
                throw new \InvalidArgumentException(
                    'Cada detalle debe tener producto_id y cantidad'
                );
            }

            if ($detalle['cantidad'] <= 0) {
                throw new \InvalidArgumentException('Cantidad debe ser mayor a 0');
            }
        }
    }
}
