<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Agregar campos de entrega comprometida a la tabla ventas
     * Estos campos se heredan de la proforma cuando se convierte
     */
    public function up(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            // Fecha comprometida para la entrega
            $table->date('fecha_entrega_comprometida')->nullable()->after('fecha');

            // Hora comprometida para la entrega
            $table->time('hora_entrega_comprometida')->nullable()->after('fecha_entrega_comprometida');

            // Ventana de entrega - inicio (ej: 08:00)
            $table->time('ventana_entrega_ini')->nullable()->after('hora_entrega_comprometida');

            // Ventana de entrega - fin (ej: 17:00)
            $table->time('ventana_entrega_fin')->nullable()->after('ventana_entrega_ini');

            // Dirección de entrega (cargada desde proforma o especificada)
            $table->text('direccion_entrega')->nullable()->after('ventana_entrega_fin');

            // Peso estimado de la entrega (cargado desde detalles)
            $table->decimal('peso_estimado', 8, 2)->nullable()->after('direccion_entrega');

            // Índices para consultas rápidas
            $table->index(['fecha_entrega_comprometida', 'estado_logistico']);
            $table->index(['ventana_entrega_ini', 'ventana_entrega_fin']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('ventas', function (Blueprint $table) {
            $table->dropIndex(['fecha_entrega_comprometida', 'estado_logistico']);
            $table->dropIndex(['ventana_entrega_ini', 'ventana_entrega_fin']);

            $table->dropColumn([
                'fecha_entrega_comprometida',
                'hora_entrega_comprometida',
                'ventana_entrega_ini',
                'ventana_entrega_fin',
                'direccion_entrega',
                'peso_estimado',
            ]);
        });
    }
};
