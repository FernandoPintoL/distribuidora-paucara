<?php

namespace App\Providers;

use App\Events\EntregaAsignada;
use App\Events\EntregaCompletada;
use App\Events\EntregaConfirmada;
use App\Events\EntregaCreada;
use App\Events\EntregaEnCamino;
use App\Events\EntregaRechazada;
use App\Events\MarcarLlegadaConfirmada;
use App\Events\NovedadEntregaReportada;
use App\Events\ProformaAprobada;
use App\Events\ProformaCoordinacionActualizada;
use App\Events\ProformaConvertida;
use App\Events\ProformaCreada;
use App\Events\ProformaRechazada;
use App\Events\RutaPlanificada;
use App\Events\UbicacionActualizada;
use App\Listeners\Logistica\BroadcastEntregaAsignada;
use App\Listeners\Logistica\BroadcastEntregaConfirmada;
use App\Listeners\Logistica\BroadcastMarcarLlegada;
use App\Listeners\Logistica\BroadcastNovedadEntrega;
use App\Listeners\Logistica\BroadcastRutaPlanificada;
use App\Listeners\Logistica\BroadcastUbicacionActualizada;
use App\Listeners\SendProformaApprovedNotification;
use App\Listeners\SendProformaCoordinationNotification;
use App\Listeners\SendProformaConvertedNotification;
use App\Listeners\SendProformaCreatedNotification;
use App\Listeners\SendProformaRejectedNotification;
use App\Listeners\Venta\BroadcastProformaCreada;
use Illuminate\Foundation\Support\Providers\EventServiceProvider as ServiceProvider;

/**
 * EventServiceProvider - REFACTORIZADO para SSOT + WebSocket
 *
 * ARQUITECTURA:
 * 1. Service emite Event (después de transacción exitosa)
 * 2. EventServiceProvider registra Listeners
 * 3. Listeners escuchan Events
 * 4. Listeners hacen broadcast (sin lógica de negocio)
 * 5. WebSocket client recibe broadcast
 *
 * IMPORTANTE:
 * ✓ Un Event puede tener múltiples Listeners
 * ✓ Un Listener puede hacer broadcast a múltiples canales
 * ✓ Listeners NO pueden fallar la transacción
 * ✓ Si un Listener falla, otros continúan
 */
class EventServiceProvider extends ServiceProvider
{
    /**
     * Los Event listeners para la aplicación
     *
     * @var array
     */
    protected $listen = [
        // ══════════════════════════════════════════════════════════
        // PROFORMA EVENTS
        // ══════════════════════════════════════════════════════════

        ProformaCreada::class => [
            BroadcastProformaCreada::class,
            SendProformaCreatedNotification::class,
        ],

        ProformaAprobada::class => [
            SendProformaApprovedNotification::class,
        ],

        ProformaRechazada::class => [
            SendProformaRejectedNotification::class,
        ],

        ProformaConvertida::class => [
            SendProformaConvertedNotification::class,
        ],

        ProformaCoordinacionActualizada::class => [
            SendProformaCoordinationNotification::class,
        ],

        // ══════════════════════════════════════════════════════════
        // ENTREGA EVENTS
        // ══════════════════════════════════════════════════════════

        EntregaCreada::class => [
            // Broadcast cuando se crea una entrega
        ],

        EntregaAsignada::class => [
            BroadcastEntregaAsignada::class,
        ],

        EntregaEnCamino::class => [
            // Broadcast cuando entrega está en camino
        ],

        EntregaCompletada::class => [
            // Broadcast cuando entrega se completa
        ],

        EntregaConfirmada::class => [
            BroadcastEntregaConfirmada::class,
        ],

        EntregaRechazada::class => [
            // Broadcast cuando entrega es rechazada
        ],

        // ══════════════════════════════════════════════════════════
        // ENTREGA - DRIVER ACTIONS EVENTS
        // ══════════════════════════════════════════════════════════

        MarcarLlegadaConfirmada::class => [
            BroadcastMarcarLlegada::class,
        ],

        NovedadEntregaReportada::class => [
            BroadcastNovedadEntrega::class,
        ],

        // ══════════════════════════════════════════════════════════
        // UBICACIÓN/TRACKING EVENTS
        // ══════════════════════════════════════════════════════════

        UbicacionActualizada::class => [
            BroadcastUbicacionActualizada::class,
        ],

        // ══════════════════════════════════════════════════════════
        // RUTA EVENTS
        // ══════════════════════════════════════════════════════════

        RutaPlanificada::class => [
            BroadcastRutaPlanificada::class,
        ],
    ];

    /**
     * Register any events for your application.
     */
    public function boot(): void
    {
        //
    }

    /**
     * Determine if events and listeners should be cached.
     */
    public function shouldDiscoverEvents(): bool
    {
        return false;
    }
}
