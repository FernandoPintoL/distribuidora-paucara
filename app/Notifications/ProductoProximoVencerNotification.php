<?php

namespace App\Notifications;

use App\Models\Producto;
use App\Models\StockProducto;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class ProductoProximoVencerNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public function __construct(
        public Collection $productosProximosVencer,
        public int $diasAnticipacion = 30
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database', 'mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $cantidad = $this->productosProximosVencer->count();
        $diasTexto = $this->diasAnticipacion == 1 ? '1 día' : "{$this->diasAnticipacion} días";
        
        $mail = (new MailMessage)
            ->subject("📅 Productos Próximos a Vencer - {$cantidad} productos")
            ->greeting('¡Atención!')
            ->line("Tienes **{$cantidad} productos** que vencerán en los próximos {$diasTexto}:");

        // Agregar lista de productos (máximo 10)
        $productosAMostrar = $this->productosProximosVencer->take(10);
        
        foreach ($productosAMostrar as $item) {
            $fechaVencimiento = $item->fecha_vencimiento?->format('d/m/Y');
            $almacen = $item->almacen?->nombre ?? 'Sin almacén';
            $lote = $item->lote ? " (Lote: {$item->lote})" : '';
            
            $mail->line("• **{$item->producto->nombre}**{$lote} - {$almacen} - Vence: {$fechaVencimiento}");
        }

        if ($cantidad > 10) {
            $restantes = $cantidad - 10;
            $mail->line("*... y {$restantes} productos más*");
        }

        return $mail->action('Ver Productos Próximos a Vencer', route('inventario.proximos-vencer'))
            ->line('Revisa estos productos para evitar pérdidas por vencimiento.')
            ->salutation('Sistema de Inventario');
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase(object $notifiable): array
    {
        $cantidad = $this->productosProximosVencer->count();
        $diasTexto = $this->diasAnticipacion == 1 ? '1 día' : "{$this->diasAnticipacion} días";
        
        // Crear lista simple de productos para la base de datos
        $productos = $this->productosProximosVencer->take(5)->map(function ($item) {
            return [
                'nombre' => $item->producto->nombre,
                'almacen' => $item->almacen?->nombre,
                'fecha_vencimiento' => $item->fecha_vencimiento?->format('Y-m-d'),
                'cantidad' => $item->cantidad,
                'lote' => $item->lote,
            ];
        })->toArray();

        return [
            'tipo' => 'proximos_vencer',
            'cantidad_productos' => $cantidad,
            'dias_anticipacion' => $this->diasAnticipacion,
            'productos' => $productos,
            'mensaje' => "{$cantidad} productos vencerán en los próximos {$diasTexto}",
            'url' => route('inventario.proximos-vencer'),
            'prioridad' => 'alta',
        ];
    }

    /**
     * Get the array representation of the notification.
     */
    public function toArray(object $notifiable): array
    {
        return $this->toDatabase($notifiable);
    }
}
