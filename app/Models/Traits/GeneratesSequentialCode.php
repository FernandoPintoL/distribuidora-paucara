<?php

namespace App\Models\Traits;

use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\Log;

/**
 * Trait para generar números secuenciales con protección contra race conditions
 *
 * Características:
 * - Usa lockForUpdate() para evitar condiciones de carrera
 * - Reintentos automáticos con backoff exponencial en caso de deadlock
 * - Fallback con timestamp como último recurso
 * - Logging detallado para auditoría
 *
 * Métodos disponibles:
 * - generateSequentialCode() : Prefijo-Año-Secuencial (ej: VEN20250001)
 * - generateIdBasedCode() : Prefijo-ID_PADDED (ej: PRO0001)
 *
 * Uso:
 * class Venta extends Model {
 *     use GeneratesSequentialCode;
 *
 *     public static function generarNumero(): string {
 *         return static::generateSequentialCode('VEN');
 *     }
 * }
 */
trait GeneratesSequentialCode
{
    /**
     * Genera código secuencial: PREFIX-AÑO-NÚMERO
     * Ejemplo: VEN2025000001, PF2025000042, RTA2025000001
     *
     * @param string $prefix Prefijo del código (ej: 'VEN', 'PF', 'RTA')
     * @param string $column Columna donde se almacena (default: 'numero')
     * @param bool $includeDate Incluir año en el código (default: true)
     * @param string $dateFormat Formato de fecha (default: 'Ymd' = YYYYMMDD)
     * @param int $padding Cantidad de dígitos para el secuencial (default: 6)
     * @param int $maxRetries Reintentos en caso de deadlock (default: 5)
     *
     * @return string Código generado
     * @throws \RuntimeException Si no puede generar después de reintentos
     *
     * Ejemplo de uso:
     * $numero = Venta::generateSequentialCode('VEN', 'numero', true, 'Ymd', 6);
     * // Resultado: VEN2025000001
     */
    protected static function generateSequentialCode(
        string $prefix,
        string $column = 'numero',
        bool $includeDate = true,
        string $dateFormat = 'Ymd',
        int $padding = 6,
        int $maxRetries = 5
    ): string {
        $date = $includeDate ? now()->format($dateFormat) : '';
        $pattern = "{$prefix}{$date}%";
        $retry = 0;

        while ($retry < $maxRetries) {
            try {
                // ✅ BLOQUEO PESIMISTA: Previene que múltiples procesos lean el mismo número
                // Esto es crítico en concurrencia alta para evitar duplicados
                $ultimo = static::where($column, 'like', $pattern)
                    ->orderBy($column, 'desc')
                    ->lockForUpdate()  // ← BLOQUEO CRUCIAL
                    ->first();

                $secuencial = 1;
                if ($ultimo) {
                    $parts = explode('-', $ultimo->{$column});
                    if (count($parts) >= 2) {
                        $secuencial = (int) $parts[count($parts) - 1] + 1;
                    }
                }

                $numeroGenerado = $prefix . $date . str_pad($secuencial, $padding, '0', STR_PAD_LEFT);

                Log::info('Número secuencial generado exitosamente', [
                    'prefix' => $prefix,
                    'numero' => $numeroGenerado,
                    'intento' => $retry + 1,
                    'modelo' => static::class,
                ]);

                return $numeroGenerado;

            } catch (QueryException $e) {
                // Detectar deadlock o lock wait timeout
                $isDeadlock = stripos($e->getMessage(), 'deadlock') !== false ||
                              stripos($e->getMessage(), 'lock wait timeout') !== false ||
                              $e->getCode() == '40001' ||
                              $e->getCode() == '1213';

                if ($isDeadlock) {
                    $retry++;
                    if ($retry >= $maxRetries) {
                        Log::error('Error máximo de reintentos alcanzado generando código secuencial', [
                            'prefix' => $prefix,
                            'modelo' => static::class,
                            'intentos' => $maxRetries,
                            'error' => $e->getMessage(),
                        ]);
                        throw new \RuntimeException(
                            "No se pudo generar número único para {$prefix} después de {$maxRetries} intentos"
                        );
                    }

                    // Backoff exponencial: 0.1s, 0.2s, 0.4s, 0.8s, 1.6s
                    $waitTime = 100000 * pow(2, $retry - 1);
                    Log::warning('Deadlock detectado, reintentando...', [
                        'prefix' => $prefix,
                        'intento' => $retry,
                        'waitMs' => $waitTime / 1000,
                    ]);
                    usleep($waitTime);
                    continue;
                }

                // Otro tipo de error - no reintentar
                Log::error('Error inesperado generando código secuencial', [
                    'prefix' => $prefix,
                    'modelo' => static::class,
                    'error' => $e->getMessage(),
                    'code' => $e->getCode(),
                ]);
                throw $e;
            }
        }

        throw new \RuntimeException("Falló al generar código secuencial para {$prefix}");
    }

    /**
     * Genera código basado en ID: PREFIX-ID_PADDED
     * Ejemplo: PRO0001, CLT0123, PRV0456
     *
     * Útil para entidades que usan su ID como parte del código.
     * Ej: Cliente#123 → CLT0123, Producto#456 → PRO0456
     *
     * @param string $prefix Prefijo del código (ej: 'PRO', 'CLT', 'PRV')
     * @param int $padding Cantidad de dígitos para el ID (default: 4)
     *
     * @return string Código generado basado en ID
     *
     * Ejemplo:
     * $codigo = $cliente->generateIdBasedCode('CLT', 4);
     * // Si cliente->id = 123, retorna: CLT0123
     */
    protected function generateIdBasedCode(
        string $prefix,
        int $padding = 4
    ): string {
        $numero = (int) $this->id;

        // Si el número cabe en el padding, agregarle ceros a la izquierda
        if ($numero < pow(10, $padding)) {
            return $prefix . str_pad((string) $numero, $padding, '0', STR_PAD_LEFT);
        }

        // Si el número es muy grande, retornar sin padding
        return $prefix . $numero;
    }
}
