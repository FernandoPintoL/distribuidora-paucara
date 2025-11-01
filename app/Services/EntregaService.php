<?php

namespace App\Services;

use App\Events\EntregaAsignada;
use App\Events\PedidoEntregado;
use App\Events\NovedadReportada;
use App\Models\Entrega;
use App\Models\Proforma;
use App\Models\Chofer;
use App\Models\Vehiculo;
use App\Models\DireccionCliente;
use Carbon\Carbon;
use Illuminate\Foundation\Auth\User;

class EntregaService
{
    /**
     * Crear una entrega desde una proforma
     */
    public function crearEntregaDesdeProforma(
        Proforma $proforma,
        ?Chofer $chofer = null,
        ?Vehiculo $vehiculo = null,
        ?DireccionCliente $direccion = null,
        ?Carbon $fechaProgramada = null
    ): Entrega {
        // Usar la dirección principal del cliente si no se especifica
        if (!$direccion && $proforma->cliente) {
            $direccion = $proforma->cliente->direcciones()->where('es_principal', true)->first();
        }

        $entrega = Entrega::create([
            'proforma_id' => $proforma->id,
            'chofer_id' => $chofer?->id,
            'vehiculo_id' => $vehiculo?->id,
            'direccion_cliente_id' => $direccion?->id,
            'estado' => Entrega::ESTADO_ASIGNADA,
            'fecha_asignacion' => now(),
        ]);

        // Si se asignó chofer y vehículo, disparar evento
        if ($chofer && $vehiculo) {
            EntregaAsignada::dispatch($entrega->fresh());
        }

        return $entrega;
    }

    /**
     * Asignar chofer y vehículo a una entrega
     */
    public function asignarChoferYCamion(
        Entrega $entrega,
        Chofer $chofer,
        Vehiculo $vehiculo
    ): void {
        // Validar que el chofer tenga licencia vigente
        if (!$chofer->licenciaVigente()) {
            throw new \Exception("La licencia del chofer {$chofer->user->nombre} ha vencido");
        }

        // Validar que el vehículo esté disponible
        if (!$vehiculo->estaDisponible()) {
            throw new \Exception("El vehículo {$vehiculo->placa} no está disponible");
        }

        $entrega->update([
            'chofer_id' => $chofer->id,
            'vehiculo_id' => $vehiculo->id,
            'fecha_asignacion' => now(),
        ]);

        // Disparar evento de asignación
        EntregaAsignada::dispatch($entrega->fresh()->load(['chofer', 'vehiculo']));
    }

    /**
     * Actualizar estado de entrega con validaciones
     */
    public function actualizarEstado(
        Entrega $entrega,
        string $nuevoEstado,
        ?string $comentario = null,
        ?User $usuario = null
    ): void {
        // Validar transición de estado
        $estadosValidos = [
            Entrega::ESTADO_ASIGNADA => [Entrega::ESTADO_EN_CAMINO, Entrega::ESTADO_CANCELADA],
            Entrega::ESTADO_EN_CAMINO => [Entrega::ESTADO_LLEGO, Entrega::ESTADO_NOVEDAD],
            Entrega::ESTADO_LLEGO => [Entrega::ESTADO_ENTREGADO, Entrega::ESTADO_NOVEDAD],
            Entrega::ESTADO_ENTREGADO => [],
            Entrega::ESTADO_NOVEDAD => [Entrega::ESTADO_EN_CAMINO],
            Entrega::ESTADO_CANCELADA => [],
        ];

        if (!isset($estadosValidos[$entrega->estado]) || !in_array($nuevoEstado, $estadosValidos[$entrega->estado])) {
            throw new \Exception("No se puede cambiar de {$entrega->estado} a {$nuevoEstado}");
        }

        // Cambiar el estado
        $entrega->cambiarEstado($nuevoEstado, $comentario, $usuario);
    }

    /**
     * Confirmar entrega con firma y fotos
     */
    public function confirmarEntrega(
        Entrega $entrega,
        string $firmaBase64,
        array $fotosBase64 = [],
        ?string $observaciones = null,
        ?User $usuario = null
    ): void {
        // Validar que esté en estado correcto
        if (!in_array($entrega->estado, [Entrega::ESTADO_LLEGO, Entrega::ESTADO_EN_CAMINO])) {
            throw new \Exception("La entrega debe estar en tránsito para ser entregada");
        }

        // Guardar firma y fotos (aquí se guardarían en storage)
        $firmaUrl = $this->guardarArchivoBase64($firmaBase64, 'firmas');
        $fotoUrl = null;
        if (!empty($fotosBase64)) {
            $fotoUrl = $this->guardarArchivoBase64($fotosBase64[0], 'entregas');
        }

        // Actualizar entrega
        $entrega->update([
            'estado' => Entrega::ESTADO_ENTREGADO,
            'fecha_entrega' => now(),
            'fecha_firma_entrega' => now(),
            'firma_digital_url' => $firmaUrl,
            'foto_entrega_url' => $fotoUrl,
            'observaciones' => $observaciones,
        ]);

        $entrega->cambiarEstado(
            Entrega::ESTADO_ENTREGADO,
            'Entrega confirmada con firma y fotos',
            $usuario
        );

        // Disparar evento de entrega completada
        PedidoEntregado::dispatch($entrega->fresh());
    }

    /**
     * Reportar novedad en entrega
     */
    public function reportarNovedad(
        Entrega $entrega,
        string $motivo,
        ?string $descripcion = null,
        ?string $fotoBase64 = null,
        ?User $usuario = null
    ): void {
        // Validar estado
        if ($entrega->estado === Entrega::ESTADO_ENTREGADO || $entrega->estado === Entrega::ESTADO_CANCELADA) {
            throw new \Exception('No se puede reportar novedad en entregas finalizadas');
        }

        // Guardar foto si se proporciona
        $fotoUrl = null;
        if ($fotoBase64) {
            $fotoUrl = $this->guardarArchivoBase64($fotoBase64, 'novedades');
        }

        // Actualizar entrega
        $entrega->update([
            'estado' => Entrega::ESTADO_NOVEDAD,
            'motivo_novedad' => $motivo,
            'observaciones' => $descripcion,
            'foto_entrega_url' => $fotoUrl,
        ]);

        $entrega->cambiarEstado(
            Entrega::ESTADO_NOVEDAD,
            "Novedad reportada: {$motivo}",
            $usuario
        );

        // Disparar evento
        NovedadReportada::dispatch($entrega->fresh(), $motivo);
    }

    /**
     * Cancelar entrega
     */
    public function cancelarEntrega(
        Entrega $entrega,
        string $motivo,
        ?User $usuario = null
    ): void {
        // Validar que no esté entregada o cancelada
        if ($entrega->estado === Entrega::ESTADO_ENTREGADO || $entrega->estado === Entrega::ESTADO_CANCELADA) {
            throw new \Exception('La entrega ya está finalizada');
        }

        $entrega->update([
            'estado' => Entrega::ESTADO_CANCELADA,
            'observaciones' => $motivo,
        ]);

        $entrega->cambiarEstado(
            Entrega::ESTADO_CANCELADA,
            "Cancelada: {$motivo}",
            $usuario
        );
    }

    /**
     * Obtener entregas pendientes de asignar
     */
    public function obtenerEntregasPendientes()
    {
        return Entrega::where('estado', Entrega::ESTADO_ASIGNADA)
            ->whereNull('chofer_id')
            ->orWhere('estado', Entrega::ESTADO_ASIGNADA)
            ->whereNull('vehiculo_id')
            ->with(['proforma', 'proforma.cliente', 'proforma.detalles'])
            ->get();
    }

    /**
     * Obtener entregas activas (en tránsito)
     */
    public function obtenerEntregasActivas()
    {
        return Entrega::whereIn('estado', [
            Entrega::ESTADO_EN_CAMINO,
            Entrega::ESTADO_LLEGO,
        ])
            ->with(['proforma', 'chofer', 'vehiculo', 'ubicaciones'])
            ->latest('fecha_inicio')
            ->get();
    }

    /**
     * Guardar archivo desde base64 (placeholder)
     * En producción, esto guardaría en S3 o storage local
     */
    private function guardarArchivoBase64(string $base64, string $carpeta): string
    {
        // Placeholder implementation
        // En producción:
        // $data = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $base64));
        // $filename = uniqid() . '.jpg';
        // Storage::disk('s3')->put("$carpeta/$filename", $data);
        // return "s3://$carpeta/$filename";

        return "placeholder://{$carpeta}/" . uniqid() . '.jpg';
    }
}
