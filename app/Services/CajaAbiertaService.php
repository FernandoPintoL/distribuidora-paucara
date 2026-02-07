<?php

namespace App\Services;

use App\Models\AperturaCaja;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

/**
 * Service para obtener la caja abierta del usuario actual
 *
 * Reutilizable en cualquier controller o service que necesite
 * verificar si el usuario tiene una caja abierta
 */
class CajaAbiertaService
{
    /**
     * Obtener la apertura abierta del usuario actual
     *
     * @return AperturaCaja|null
     */
    public function obtenerAperturaAbierta(): ?AperturaCaja
    {
        $usuario = Auth::user();

        if (!$usuario) {
            Log::warning('CajaAbiertaService: Usuario no autenticado');
            return null;
        }

        $apertura = AperturaCaja::where('user_id', $usuario->id)
            ->abiertas() // Usa el scope que busca sin cierre
            ->latest()
            ->first();

        if ($apertura) {
            Log::debug('✅ CajaAbiertaService: Apertura abierta encontrada', [
                'user_id' => $usuario->id,
                'caja_id' => $apertura->caja_id,
                'apertura_id' => $apertura->id,
                'fecha' => $apertura->fecha,
            ]);
        } else {
            Log::debug('⚠️ CajaAbiertaService: No hay caja abierta para el usuario', [
                'user_id' => $usuario->id,
            ]);
        }

        return $apertura;
    }

    /**
     * Obtener el ID de la caja abierta del usuario actual
     *
     * @return int|null
     */
    public function obtenerCajaIdAbierta(): ?int
    {
        return $this->obtenerAperturaAbierta()?->caja_id;
    }

    /**
     * Verificar si el usuario tiene una caja abierta
     *
     * @return bool
     */
    public function tieneCajaAbierta(): bool
    {
        return $this->obtenerAperturaAbierta() !== null;
    }

    /**
     * Obtener la apertura abierta O lanzar excepción si no existe
     *
     * @throws \RuntimeException
     * @return AperturaCaja
     */
    public function obtenerAperturaAbertaOFail(): AperturaCaja
    {
        $apertura = $this->obtenerAperturaAbierta();

        if (!$apertura) {
            $usuario = Auth::user();
            Log::error('CajaAbiertaService: Usuario intenta crear venta sin caja abierta', [
                'user_id' => $usuario?->id,
                'usuario' => $usuario?->name,
            ]);

            throw new \RuntimeException(
                'No tienes una caja abierta. Abre una caja antes de registrar ventas.'
            );
        }

        return $apertura;
    }
}
