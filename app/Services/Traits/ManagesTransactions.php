<?php

namespace App\Services\Traits;

use Illuminate\Support\Facades\DB;
use Throwable;

/**
 * Trait para manejar transacciones de base de datos de forma segura
 *
 * Proporciona métodos para ejecutar código dentro de transacciones
 * con manejo automático de rollback en caso de error.
 */
trait ManagesTransactions
{
    /**
     * Ejecutar una operación dentro de una transacción
     *
     * @param callable $callback Función que contiene la lógica
     * @param int $maxAttempts Número máximo de intentos (para deadlocks)
     * @return mixed Valor retornado por el callback
     *
     * @throws Throwable Si el callback falla después de maxAttempts
     */
    protected function transaction(
        callable $callback,
        int $maxAttempts = 1
    ): mixed {
        for ($attempt = 1; $attempt <= $maxAttempts; $attempt++) {
            try {
                return DB::transaction($callback);
            } catch (Throwable $e) {
                // Si es el último intento, lanzar el error
                if ($attempt === $maxAttempts) {
                    throw $e;
                }

                // Esperar un poco antes de reintentar
                usleep(random_int(1000, 10000));
            }
        }
    }

    /**
     * Ejecutar operación sin transacción (para queries de solo lectura)
     *
     * @param callable $callback
     * @return mixed
     */
    protected function read(callable $callback): mixed
    {
        return $callback();
    }
}
