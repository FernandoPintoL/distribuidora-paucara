<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('precios_producto', function (Blueprint $table) {
            $table->string('tipo_precio', 20)->default('venta')->after('tipo_cliente');
            $table->decimal('margen_ganancia', 8, 2)->nullable()->after('precio');
            $table->decimal('porcentaje_ganancia', 5, 2)->nullable()->after('margen_ganancia');
            $table->boolean('es_precio_base')->default(false)->after('porcentaje_ganancia');
            $table->timestamp('fecha_ultima_actualizacion')->nullable()->after('activo');
            $table->string('motivo_cambio')->nullable()->after('fecha_ultima_actualizacion');

            // Índices para mejor rendimiento
            $table->index(['producto_id', 'tipo_precio', 'activo']);
            $table->index('tipo_precio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('precios_producto', function (Blueprint $table) {
            // Verificar y eliminar índices solo si existen
            if (Schema::hasIndex('precios_producto', 'precios_producto_producto_id_tipo_precio_activo_index')) {
                $table->dropIndex(['producto_id', 'tipo_precio', 'activo']);
            }

            if (Schema::hasIndex('precios_producto', 'precios_producto_tipo_precio_index')) {
                $table->dropIndex(['tipo_precio']);
            }

            $table->dropColumn([
                'tipo_precio',
                'margen_ganancia',
                'porcentaje_ganancia',
                'es_precio_base',
                'fecha_ultima_actualizacion',
                'motivo_cambio'
            ]);
        });
    }
};
