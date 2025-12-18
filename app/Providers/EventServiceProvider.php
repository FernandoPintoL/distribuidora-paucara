<?php

namespace App\Providers;

use App\Events\EntregaAsignada;
use App\Events\EntregaCompletada;
use App\Events\EntregaConfirmada;
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
use App\Events\VentaAprobada;
use App\Events\VentaCreada;
use App\Events\VentaPagada;
use App\Events\VentaRechazada;
use App\Listeners\Logistica\BroadcastEntregaAsignada;
use App\Listeners\Logistica\BroadcastRutaPlanificada;
use App\Listeners\Logistica\BroadcastUbicacionActualizada;
use App\Listeners\Venta\BroadcastProformaCreada;
use App\Listeners\Venta\BroadcastVentaCreada;
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
class EventServiceProviderRefactored extends ServiceProvider
{
    /**
     * Los Event listeners para la aplicación
     *
     * @var array
     */
    protected $listen = [
        // ══════════════════════════════════════════════════════════
        // VENTA EVENTS
        // ══════════════════════════════════════════════════════════

        VentaCreada::class => [
            // Notificación: enviar email al cliente
            \App\Listeners\Venta\SendVentaCreatedNotification::class,

            // WebSocket: broadcast a clientes interesados
            BroadcastVentaCreada::class,

            // Auditoría: registrar en log
            \App\Listeners\Venta\CreateVentaAuditLog::class,

            // Queue: encolar reportes o tasks async
            \App\Listeners\Venta\EnqueueVentaReportGeneration::class,
        ],

        VentaAprobada::class => [
            // Notificación
            \App\Listeners\Venta\SendVentaApprovedNotification::class,

            // WebSocket
            \App\Listeners\Venta\BroadcastVentaAprobada::class,

            // Auditoría
            \App\Listeners\Venta\CreateVentaAuditLog::class,

            // Logística: crear entrega si aplica
            \App\Listeners\Logistica\CreateDeliveryFromVenta::class,
        ],

        VentaRechazada::class => [
            \App\Listeners\Venta\SendVentaRejectedNotification::class,
            \App\Listeners\Venta\BroadcastVentaRechazada::class,
            \App\Listeners\Venta\CreateVentaAuditLog::class,
        ],

        VentaPagada::class => [
            \App\Listeners\Venta\SendVentaPaidNotification::class,
            \App\Listeners\Venta\BroadcastVentaPagada::class,
        ],

        // ══════════════════════════════════════════════════════════
        // PROFORMA EVENTS
        // ══════════════════════════════════════════════════════════

        ProformaCreada::class => [
            \App\Listeners\Venta\SendProformaCreatedNotification::class,
            BroadcastProformaCreada::class,
            \App\Listeners\Venta\CreateProformaAuditLog::class,
        ],

        ProformaAprobada::class => [
            \App\Listeners\Venta\SendProformaApprovedNotification::class,
            \App\Listeners\Venta\BroadcastProformaAprobada::class,
        ],

        ProformaRechazada::class => [
            \App\Listeners\Venta\SendProformaRejectedNotification::class,
            \App\Listeners\Venta\BroadcastProformaRechazada::class,

            // Importante: liberar stock reservado
            \App\Listeners\Stock\ReleaseReservedStock::class,
        ],

        ProformaConvertida::class => [
            \App\Listeners\Venta\SendProformaConvertedNotification::class,
            \App\Listeners\Venta\BroadcastProformaConvertida::class,
        ],

        ProformaCoordinacionActualizada::class => [
            \App\Listeners\SendProformaCoordinationNotification::class,
        ],

        // ══════════════════════════════════════════════════════════
        // ENTREGA EVENTS
        // ══════════════════════════════════════════════════════════

        EntregaAsignada::class => [
            \App\Listeners\Logistica\SendDeliveryAssignedNotification::class,
            BroadcastEntregaAsignada::class,
            \App\Listeners\Logistica\CreateDeliveryAuditLog::class,
        ],

        EntregaCompletada::class => [
            \App\Listeners\Logistica\SendDeliveryCompletedNotification::class,
            \App\Listeners\Logistica\BroadcastEntregaCompletada::class,
            \App\Listeners\Logistica\UpdateVentaAsDelivered::class,
        ],

        EntregaRechazada::class => [
            \App\Listeners\Logistica\SendDeliveryRejectedNotification::class,
            \App\Listeners\Logistica\BroadcastEntregaRechazada::class,

            // Importante: revertir stock
            \App\Listeners\Stock\ReturnStockFromRejectedDelivery::class,
        ],

        // ══════════════════════════════════════════════════════════
        // ENTREGA - DRIVER ACTIONS EVENTS (Nuevas Acciones)
        // ══════════════════════════════════════════════════════════

        MarcarLlegadaConfirmada::class => [
            // Broadcast en tiempo real
            \App\Listeners\Logistica\BroadcastMarcarLlegada::class,

            // Notificación al cliente
            \App\Listeners\Logistica\SendDriverArrivedNotification::class,

            // Auditoría
            \App\Listeners\Logistica\CreateDeliveryAuditLog::class,
        ],

        EntregaConfirmada::class => [
            // Broadcast en tiempo real
            \App\Listeners\Logistica\BroadcastEntregaConfirmada::class,

            // Notificación al cliente
            \App\Listeners\Logistica\SendDeliveryConfirmedNotification::class,

            // Auditoría
            \App\Listeners\Logistica\CreateDeliveryAuditLog::class,

            // Actualizar estado de venta
            \App\Listeners\Logistica\UpdateVentaAsDelivered::class,
        ],

        NovedadEntregaReportada::class => [
            // Broadcast en tiempo real
            \App\Listeners\Logistica\BroadcastNovedadEntrega::class,

            // Notificación a admin/logística
            \App\Listeners\Logistica\SendDeliveryIssueNotification::class,

            // Auditoría
            \App\Listeners\Logistica\CreateDeliveryAuditLog::class,
        ],

        // ══════════════════════════════════════════════════════════
        // UBICACIÓN/TRACKING EVENTS
        // ══════════════════════════════════════════════════════════

        UbicacionActualizada::class => [
            // HIGH FREQUENCY EVENT - cuidado con el logging
            BroadcastUbicacionActualizada::class,

            // Calcular ETA
            \App\Listeners\Logistica\CalculateDeliveryETA::class,

            // Opcional: cheques de geofencing, etc
            // \App\Listeners\Logistica\CheckGeofencing::class,
        ],

        // ══════════════════════════════════════════════════════════
        // RUTA EVENTS
        // ══════════════════════════════════════════════════════════

        RutaPlanificada::class => [
            \App\Listeners\Logistica\SendRoutePlannedNotification::class,
            BroadcastRutaPlanificada::class,
            \App\Listeners\Logistica\CreateRouteAuditLog::class,
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
