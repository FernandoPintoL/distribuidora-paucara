<?php

namespace App\Observers;

use App\Models\Proforma;

class ProformaObserver
{
    /**
     * Handle the Proforma "created" event.
     */
    public function created(Proforma $proforma): void
    {
        // Reservar stock automáticamente al crear proforma desde app externa
        if ($proforma->esDeAppExterna() && $proforma->estado === Proforma::PENDIENTE) {
            $proforma->reservarStock();
        }
    }

    /**
     * Handle the Proforma "updated" event.
     */
    public function updated(Proforma $proforma): void
    {
        // Si la proforma fue aprobada, extender las reservas
        if ($proforma->wasChanged('estado') && $proforma->estado === Proforma::APROBADA) {
            $proforma->extenderReservas(48); // 48 horas para convertir a venta
        }

        // Si la proforma fue rechazada o expiró, liberar reservas
        if ($proforma->wasChanged('estado') &&
            in_array($proforma->estado, [Proforma::RECHAZADA, Proforma::VENCIDA])) {
            $proforma->liberarReservas();
        }

        // Si la proforma fue convertida a venta, consumir reservas
        if ($proforma->wasChanged('estado') && $proforma->estado === Proforma::CONVERTIDA) {
            $proforma->consumirReservas();
        }
    }

    /**
     * Handle the Proforma "deleted" event.
     */
    public function deleted(Proforma $proforma): void
    {
        // Liberar todas las reservas al eliminar proforma
        $proforma->liberarReservas();
    }

    /**
     * Handle the Proforma "restored" event.
     */
    public function restored(Proforma $proforma): void
    {
        //
    }

    /**
     * Handle the Proforma "force deleted" event.
     */
    public function forceDeleted(Proforma $proforma): void
    {
        // Liberar todas las reservas al eliminar definitivamente
        $proforma->liberarReservas();
    }
}
