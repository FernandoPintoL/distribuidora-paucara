<?php

namespace App\DTOs\Venta;

use App\DTOs\BaseDTO;
use Illuminate\Http\Request;

/**
 * DTO para crear una venta
 *
 * Representa los datos necesarios para crear una venta desde cualquier cliente
 * (Web, API Mobile, etc)
 */
class CrearVentaDTO extends BaseDTO
{
    public function __construct(
        public int $cliente_id,
        public string $fecha,
        public array $detalles, // Array de { producto_id, cantidad, precio_unitario }
        public float $subtotal,
        public float $impuesto,
        public float $total,
        public int $almacen_id = 2,
        public ?string $observaciones = null,
        public ?int $usuario_id = null,
        public ?int $proforma_id = null,
        // Campos de dirección y logística
        public ?int $direccion_cliente_id = null,
        public ?bool $requiere_envio = null,
        public ?string $canal_origen = 'WEB',
        public ?string $estado_logistico = null,
        // Campos de política de pago
        public ?string $politica_pago = 'CONTRA_ENTREGA',
        public ?string $estado_pago = 'PENDIENTE',
        // Campos de SLA y compromisos de entrega
        public ?string $fecha_entrega_comprometida = null,
        public ?string $hora_entrega_comprometida = null,
        public ?string $ventana_entrega_ini = null,
        public ?string $ventana_entrega_fin = null,
        public ?string $idempotency_key = null,
    ) {}

    /**
     * Factory: Crear desde Request
     */
    public static function fromRequest(Request $request): self
    {
        $user = auth()->user();

        return new self(
            cliente_id: (int) $request->input('cliente_id'),
            fecha: $request->input('fecha', today()->toDateString()),
            detalles: $request->input('detalles', []),
            subtotal: (float) $request->input('subtotal', 0),
            impuesto: (float) $request->input('impuesto', 0),
            total: (float) $request->input('total', 0),
            almacen_id: (int) $request->input('almacen_id', 1),
            observaciones: $request->input('observaciones'),
            usuario_id: $user ? $user->id : null,
        );
    }

    /**
     * Validar que los detalles sean válidos
     *
     * @throws \InvalidArgumentException
     */
    public function validarDetalles(): void
    {
        if (empty($this->detalles)) {
            throw new \InvalidArgumentException('Una venta debe tener al menos un detalle');
        }

        foreach ($this->detalles as $detalle) {
            if (!isset($detalle['producto_id']) || !isset($detalle['cantidad'])) {
                throw new \InvalidArgumentException(
                    'Cada detalle debe tener producto_id y cantidad'
                );
            }

            if ($detalle['cantidad'] <= 0) {
                throw new \InvalidArgumentException(
                    "Cantidad debe ser mayor a 0 para producto {$detalle['producto_id']}"
                );
            }
        }
    }
}
