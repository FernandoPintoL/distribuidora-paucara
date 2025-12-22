<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Elimina la tabla choferes_legacy que ya no se usa.
     *
     * El sistema ahora usa:
     * - users (con rol "Chofer")
     * - empleados (con user_id y chofer_id en otras tablas apunta a empleados.id)
     */
    public function up(): void
    {
        // 1. Eliminar foreign keys que apuntan a choferes_legacy
        if (Schema::hasTable('transferencia_inventarios')) {
            Schema::table('transferencia_inventarios', function (Blueprint $table) {
                $table->dropForeign(['chofer_id']);
            });
        }

        if (Schema::hasTable('ubicacion_trackings')) {
            Schema::table('ubicacion_trackings', function (Blueprint $table) {
                $table->dropForeign(['chofer_id']);
            });
        }

        // 2. Recrear foreign keys apuntando a empleados
        if (Schema::hasTable('transferencia_inventarios')) {
            Schema::table('transferencia_inventarios', function (Blueprint $table) {
                $table->foreign('chofer_id')
                    ->references('id')
                    ->on('empleados')
                    ->onDelete('set null');
            });
        }

        if (Schema::hasTable('ubicacion_trackings')) {
            Schema::table('ubicacion_trackings', function (Blueprint $table) {
                $table->foreign('chofer_id')
                    ->references('id')
                    ->on('empleados')
                    ->onDelete('set null');
            });
        }

        // 3. Ahora sí, eliminar tabla legacy
        Schema::dropIfExists('choferes_legacy');
    }

    /**
     * Reverse the migrations.
     *
     * NOTA: No se puede revertir esta migración automáticamente.
     * La tabla choferes_legacy estaba vacía y deprecated.
     * Si necesitas restaurarla, deberás ejecutar manualmente las migraciones antiguas.
     */
    public function down(): void
    {
        // No se puede revertir - la tabla estaba deprecated y vacía
        throw new \Exception(
            'No se puede revertir esta migración. ' .
            'La tabla choferes_legacy estaba deprecated y fue eliminada permanentemente. ' .
            'Use el sistema nuevo: users + roles + empleados.'
        );
    }
};
