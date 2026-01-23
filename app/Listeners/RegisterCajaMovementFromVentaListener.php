<?php

namespace App\Listeners;

use App\Events\VentaCreada;
use App\Models\AuditoriaCaja;
use App\Models\AperturaCaja;
use App\Models\MovimientoCaja;
use App\Models\TipoOperacionCaja;
use Illuminate\Support\Facades\Log;

/**
 * Listener que registra el movimiento de caja cuando se crea una venta directa
 *
 * RESPONSABILIDADES:
 * ✓ Escucha evento VentaCreada
 * ✓ Obtiene caja abierta del usuario
 * ✓ Registra movimiento si hay pago inicial y política lo requiere
 * ✓ Registra auditoría de la operación
 *
 * DIFERENCIA CON PROFORMA:
 * - Proforma: registra solo si politica es ANTICIPADO_100 o MEDIO_MEDIO
 * - Venta directa: TAMBIÉN registra CONTRA_ENTREGA con pago inicial
 *
 * POLÍTICAS QUE REGISTRAN MOVIMIENTO:
 * - ANTICIPADO_100: 100% pago anticipado
 * - MEDIO_MEDIO: 50% anticipo, 50% contra entrega
 * - CONTRA_ENTREGA: si hay pago inicial (ej: abono)
 */
class RegisterCajaMovementFromVentaListener
{
    /**
     * Handle the event.
     */
    public function handle(VentaCreada $event): void
    {
        try {
            $venta = $event->venta;

            Log::info('🔔 RegisterCajaMovementFromVentaListener - Procesando venta creada', [
                'venta_id' => $venta->id,
                'venta_numero' => $venta->numero,
                'politica_pago' => $venta->politica_pago,
                'monto_pagado' => $venta->monto_pagado,
            ]);

            // ✅ 1. Obtener caja_id del atributo especial de la venta
            $cajaId = $venta->getAttribute('_caja_id');

            // Si no hay caja_id, significa que fue una creación sin middleware de caja
            // (ej: desde API sin validación de caja, o desde otro contexto)
            if (!$cajaId) {
                Log::info('⏭️ RegisterCajaMovementFromVentaListener - Sin caja_id, probablemente creada sin validación de caja', [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                ]);
                return;
            }

            // ✅ 2. Validar que hay monto a registrar
            if ($venta->monto_pagado <= 0) {
                Log::info('⏭️ RegisterCajaMovementFromVentaListener - Sin monto a pagar, no registra movimiento', [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'monto_pagado' => $venta->monto_pagado,
                    'politica_pago' => $venta->politica_pago,
                ]);
                return;
            }

            // ✅ 3. Validar que la política requiere pago inmediato
            $politicasConPagoInmediato = ['ANTICIPADO_100', 'MEDIO_MEDIO', 'CONTRA_ENTREGA'];
            if (!in_array($venta->politica_pago, $politicasConPagoInmediato)) {
                Log::info('⏭️ RegisterCajaMovementFromVentaListener - Política no requiere pago inmediato', [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'politica' => $venta->politica_pago,
                ]);
                return;
            }

            // ✅ 4. Obtener usuario
            $usuario = $venta->usuario;
            if (!$usuario) {
                Log::warning('⚠️ RegisterCajaMovementFromVentaListener - Usuario no encontrado', [
                    'venta_id' => $venta->id,
                    'usuario_id' => $venta->usuario_id,
                ]);
                return;
            }

            // ✅ 5. Obtener caja abierta del usuario
            $cajaAbierta = AperturaCaja::where('caja_id', $cajaId)
                ->where('user_id', $usuario->id)
                ->whereDate('fecha', today())
                ->whereDoesntHave('cierre')
                ->with('caja')
                ->first();

            if (!$cajaAbierta) {
                Log::warning('⚠️ RegisterCajaMovementFromVentaListener - Caja no abierta HOY por este usuario', [
                    'usuario_id' => $usuario->id,
                    'usuario_nombre' => $usuario->name,
                    'caja_id' => $cajaId,
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'politica' => $venta->politica_pago,
                    'monto' => $venta->monto_pagado,
                ]);

                // ✅ REGISTRAR EN AUDITORÍA: Intento fallido
                AuditoriaCaja::create([
                    'user_id' => $usuario->id,
                    'caja_id' => $cajaId,
                    'apertura_caja_id' => null,
                    'accion' => 'INTENTO_PAGO_SIN_CAJA',
                    'operacion_intentada' => 'POST /ventas',
                    'operacion_tipo' => 'VENTA',
                    'exitosa' => false,
                    'detalle_operacion' => [
                        'venta_id' => $venta->id,
                        'venta_numero' => $venta->numero,
                        'politica' => $venta->politica_pago,
                        'monto_pagado' => $venta->monto_pagado,
                        'motivo' => 'Usuario no tiene caja abierta HOY',
                    ],
                    'codigo_http' => 422,
                    'mensaje_error' => 'Usuario no tiene caja abierta para registrar pago',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);

                return;
            }

            // ✅ 6. Obtener tipo de operación VENTA
            $tipoOperacion = TipoOperacionCaja::where('codigo', 'VENTA')->first();

            if (!$tipoOperacion) {
                Log::error('❌ RegisterCajaMovementFromVentaListener - Tipo operación VENTA no existe', [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                ]);

                // ✅ REGISTRAR EN AUDITORÍA: Error de configuración
                AuditoriaCaja::create([
                    'user_id' => $usuario->id,
                    'caja_id' => $cajaAbierta->caja_id,
                    'apertura_caja_id' => $cajaAbierta->id,
                    'accion' => 'ERROR_OPERACION_NO_EXISTE',
                    'operacion_intentada' => 'POST /ventas',
                    'operacion_tipo' => 'VENTA',
                    'exitosa' => false,
                    'detalle_operacion' => [
                        'venta_id' => $venta->id,
                        'venta_numero' => $venta->numero,
                        'motivo' => 'TipoOperacionCaja VENTA no existe en la BD',
                    ],
                    'codigo_http' => 500,
                    'mensaje_error' => 'Tipo operación VENTA no encontrado',
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                ]);

                return;
            }

            // ✅ 7. Determinar descripción según la política
            $descripcionPolitica = match($venta->politica_pago) {
                'ANTICIPADO_100' => '100% ANTICIPADO',
                'MEDIO_MEDIO' => '50% ANTICIPO',
                'CONTRA_ENTREGA' => 'ABONO CONTRA ENTREGA',
                default => 'ANTICIPO'
            };

            // ✅ 8. Crear movimiento de caja
            $movimiento = MovimientoCaja::create([
                'caja_id' => $cajaAbierta->caja_id,
                'user_id' => $usuario->id,
                'tipo_operacion_id' => $tipoOperacion->id,
                'numero_documento' => $venta->numero,
                'monto' => $venta->monto_pagado,
                'fecha' => now(),
                'observaciones' => "Venta #{$venta->numero} ({$descripcionPolitica}) - Creada directamente",
            ]);

            // ✅ 9. REGISTRAR EN AUDITORÍA: Éxito
            AuditoriaCaja::create([
                'user_id' => $usuario->id,
                'caja_id' => $cajaAbierta->caja_id,
                'apertura_caja_id' => $cajaAbierta->id,
                'accion' => 'PAGO_REGISTRADO',
                'operacion_intentada' => 'POST /ventas',
                'operacion_tipo' => 'VENTA',
                'exitosa' => true,
                'detalle_operacion' => [
                    'venta_id' => $venta->id,
                    'venta_numero' => $venta->numero,
                    'movimiento_caja_id' => $movimiento->id,
                    'caja_numero' => $cajaAbierta->caja?->nombre,
                    'politica' => $venta->politica_pago,
                    'monto_pagado' => $venta->monto_pagado,
                    'descripcion_politica' => $descripcionPolitica,
                    'fuente' => 'Venta creada directamente (POST /ventas)',
                ],
                'codigo_http' => 201,
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
            ]);

            Log::info('✅ RegisterCajaMovementFromVentaListener - Movimiento de caja registrado exitosamente', [
                'venta_id' => $venta->id,
                'venta_numero' => $venta->numero,
                'caja_id' => $cajaAbierta->caja_id,
                'caja_nombre' => $cajaAbierta->caja?->nombre,
                'usuario_id' => $usuario->id,
                'usuario_nombre' => $usuario->name,
                'monto' => $venta->monto_pagado,
                'politica' => $venta->politica_pago,
                'tipo_pago' => $descripcionPolitica,
                'movimiento_id' => $movimiento->id,
            ]);

        } catch (\Exception $e) {
            // No bloquear la creación de venta si falla el registro en cajas
            Log::error('❌ RegisterCajaMovementFromVentaListener - Error al registrar movimiento de caja', [
                'venta_id' => $event->venta->id ?? null,
                'venta_numero' => $event->venta->numero ?? null,
                'usuario_id' => $event->venta->usuario_id ?? null,
                'monto' => $event->venta->monto_pagado ?? null,
                'politica' => $event->venta->politica_pago ?? null,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            // ✅ REGISTRAR EN AUDITORÍA: Error al registrar
            try {
                if ($event->venta) {
                    AuditoriaCaja::create([
                        'user_id' => $event->venta->usuario_id,
                        'caja_id' => null,
                        'apertura_caja_id' => null,
                        'accion' => 'ERROR_REGISTRO_PAGO',
                        'operacion_intentada' => 'POST /ventas',
                        'operacion_tipo' => 'VENTA',
                        'exitosa' => false,
                        'detalle_operacion' => [
                            'venta_id' => $event->venta->id,
                            'venta_numero' => $event->venta->numero,
                            'politica' => $event->venta->politica_pago,
                            'monto_pagado' => $event->venta->monto_pagado,
                        ],
                        'codigo_http' => 500,
                        'mensaje_error' => $e->getMessage(),
                        'ip_address' => request()->ip(),
                        'user_agent' => request()->userAgent(),
                    ]);
                }
            } catch (\Exception $auditError) {
                Log::error('❌ RegisterCajaMovementFromVentaListener - Error al registrar auditoría', [
                    'error_audit' => $auditError->getMessage(),
                ]);
            }

            // ⚠️ Importante: No relanzamos la excepción para no bloquear la creación de venta
            // El movimiento de caja es importante pero la venta ya está creada
        }
    }
}
