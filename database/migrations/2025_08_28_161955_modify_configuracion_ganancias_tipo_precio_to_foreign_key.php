<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Primero, agregar la nueva columna tipo_precio_id
        Schema::table('configuracion_ganancias', function (Blueprint $table) {
            $table->unsignedBigInteger('tipo_precio_id')->nullable()->after('producto_id');
        });

        // Actualizar los valores existentes para que coincidan con los IDs de tipos_precio
        DB::statement("
            UPDATE configuracion_ganancias
            SET tipo_precio_id = (
                CASE
                    WHEN tipo_precio = 'costo' THEN (SELECT id FROM tipos_precio WHERE codigo = 'COSTO' LIMIT 1)
                    WHEN tipo_precio = 'venta' THEN (SELECT id FROM tipos_precio WHERE codigo = 'VENTA' LIMIT 1)
                    WHEN tipo_precio = 'por_mayor' THEN (SELECT id FROM tipos_precio WHERE codigo = 'POR_MAYOR' LIMIT 1)
                    WHEN tipo_precio = 'facturado' THEN (SELECT id FROM tipos_precio WHERE codigo = 'FACTURADO' LIMIT 1)
                    WHEN tipo_precio = 'distribuidor' THEN (SELECT id FROM tipos_precio WHERE codigo = 'DISTRIBUIDOR' LIMIT 1)
                    WHEN tipo_precio = 'promocional' THEN (SELECT id FROM tipos_precio WHERE codigo = 'PROMOCIONAL' LIMIT 1)
                    ELSE (SELECT id FROM tipos_precio WHERE codigo = 'VENTA' LIMIT 1)
                END
            )
            WHERE tipo_precio IS NOT NULL
        ");

        // Eliminar la columna antigua y agregar constraints
        Schema::table('configuracion_ganancias', function (Blueprint $table) {
            // Eliminar índice que usa la columna antigua
            $table->dropIndex(['tipo_precio', 'activo']);

            // Eliminar unique constraint que usa la columna antigua
            $table->dropUnique(['producto_id', 'tipo_precio']);

            // Eliminar la columna antigua
            $table->dropColumn('tipo_precio');

            // Agregar foreign key constraint
            $table->foreign('tipo_precio_id')->references('id')->on('tipos_precio')->onDelete('restrict');

            // Recrear índices y constraints con la nueva columna
            $table->unique(['producto_id', 'tipo_precio_id']);
            $table->index(['tipo_precio_id', 'activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('configuracion_ganancias', function (Blueprint $table) {
            // Eliminar foreign key e índices
            $table->dropForeign(['tipo_precio_id']);
            $table->dropIndex(['tipo_precio_id', 'activo']);
            $table->dropUnique(['producto_id', 'tipo_precio_id']);

            // Agregar columna string de vuelta
            $table->string('tipo_precio', 20)->nullable()->after('producto_id');
        });

        // Convertir de vuelta a códigos string
        DB::statement("
            UPDATE configuracion_ganancias
            SET tipo_precio = (
                SELECT LOWER(codigo) FROM tipos_precio WHERE id = configuracion_ganancias.tipo_precio_id
            )
            WHERE tipo_precio_id IS NOT NULL
        ");

        Schema::table('configuracion_ganancias', function (Blueprint $table) {
            // Eliminar columna de foreign key
            $table->dropColumn('tipo_precio_id');

            // Restaurar índices y constraints originales
            $table->unique(['producto_id', 'tipo_precio']);
            $table->index(['tipo_precio', 'activo']);
        });
    }
};
