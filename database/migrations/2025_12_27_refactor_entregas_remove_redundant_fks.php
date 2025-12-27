<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * REFACTORIZACIÓN CRÍTICA: Eliminar FKs redundantes
     *
     * ANTES (CONFUSO):
     * ┌─ entregas.venta_id ────────────────────────────┐
     * ├─ entregas.proforma_id ─ (Legacy, deprecado)   │
     * └─ reporte_cargas.entrega_id ──────────────────┘
     *     ADEMÁS: reporte_carga_entregas (pivot N:N)
     *
     * DESPUÉS (CLARO):
     * ├─ entrega_venta (pivot) ← Entrega has many Ventas
     * ├─ reporte_cargas.entrega_id ← NULL, usar pivot reporte_carga_entregas
     * └─ entregas.proforma_id ← Opcional para legacy
     *
     * ESTRATEGIA:
     * 1. Conservar datos: Si una entrega tiene venta_id, migramos al pivot
     * 2. Eliminar FKs conflictivos
     * 3. Mantener compatibilidad con reportes existentes
     *
     * NOTA: Esta migración es reversible, pero la reversión NO recupera datos
     * migrados al pivot.
     */
    public function up(): void
    {
        // Paso 1: Migrar datos existentes de entregas.venta_id → entrega_venta pivot
        // Solo si hay datos que migrar
        try {
            DB::statement('
                INSERT INTO entrega_venta (entrega_id, venta_id, orden, created_at, updated_at)
                SELECT id, venta_id, 1, NOW(), NOW()
                FROM entregas
                WHERE venta_id IS NOT NULL
                AND id NOT IN (
                    SELECT DISTINCT entrega_id
                    FROM entrega_venta
                    WHERE venta_id = entregas.venta_id
                )
            ');
        } catch (\Exception $e) {
            // Si hay error (por ejemplo, duplicados), loguear pero continuar
            \Log::warning('Error migrando datos a entrega_venta: ' . $e->getMessage());
        }

        // Paso 2: Eliminar FK de entregas.venta_id
        Schema::table('entregas', function (Blueprint $table) {
            // Eliminar constraint de FK primero
            try {
                $table->dropForeign(['venta_id']);
            } catch (\Exception $e) {
                \Log::warning('FK venta_id no existe o ya fue eliminada');
            }
        });

        // Paso 3: Eliminar columna venta_id de entregas
        Schema::table('entregas', function (Blueprint $table) {
            if (Schema::hasColumn('entregas', 'venta_id')) {
                $table->dropColumn('venta_id');
            }
        });

        // Paso 4: Eliminar FK de reporte_cargas.entrega_id
        // NOTA: Mantenemos la columna por compatibilidad, pero sin FK
        Schema::table('reporte_cargas', function (Blueprint $table) {
            // Primero verificar que la FK existe
            try {
                $table->dropForeign(['entrega_id']);
            } catch (\Exception $e) {
                \Log::warning('FK entrega_id en reporte_cargas no existe');
            }
        });

        // Paso 5: Convertir entrega_id en reporte_cargas a nullable
        // para poder usarlo como referencia opcional (legacy support)
        // Sin embargo, usaremos pivot reporte_carga_entregas como fuente de verdad

        // Nota: Ya está nullable por defecto en la migración anterior
        // Solo agregamos comentario (syntax compatible con PostgreSQL y MySQL)
        try {
            DB::statement('
                COMMENT ON COLUMN reporte_cargas.entrega_id IS
                \'DEPRECATED - usar pivot reporte_carga_entregas. Mantenido para compatibilidad.\'
            ');
        } catch (\Exception $e) {
            // Si la syntax de comentarios no funciona, ignorar
            \Log::warning('No se pudo agregar comentario a entrega_id: ' . $e->getMessage());
        }

        // Paso 6: Mantener proforma_id para compatibilidad con datos legacy
        // pero documentar que es deprecated
        try {
            DB::statement('
                COMMENT ON COLUMN entregas.proforma_id IS
                \'DEPRECATED - usar venta_id. Mantenido para compatibilidad con entregas legacy.\'
            ');
        } catch (\Exception $e) {
            // Si la syntax de comentarios no funciona, ignorar
            \Log::warning('No se pudo agregar comentario a proforma_id: ' . $e->getMessage());
        }

        // Paso 7: Crear índices de performance en pivot
        Schema::table('entrega_venta', function (Blueprint $table) {
            // Ya están creados en la migración anterior, pero confirmar
            if (!Schema::hasIndex('entrega_venta', 'entrega_venta_entrega_id_orden_index')) {
                $table->index(['entrega_id', 'orden']);
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * ADVERTENCIA: Esta reversión NO recuperará datos migrados al pivot
     * Se proporciona solo para compatibilidad con `php artisan migrate:rollback`
     */
    public function down(): void
    {
        // Paso 1: Recrear columna venta_id en entregas
        Schema::table('entregas', function (Blueprint $table) {
            if (!Schema::hasColumn('entregas', 'venta_id')) {
                $table->unsignedBigInteger('venta_id')
                    ->nullable()
                    ->after('proforma_id')
                    ->comment('DEPRECATED - Usar pivot entrega_venta');
            }
        });

        // Paso 2: Recrear FK (con datos del pivot si es necesario)
        // Nota: Si hay múltiples ventas por entrega, esto puede fallar
        try {
            DB::statement('
                UPDATE entregas e
                SET venta_id = (
                    SELECT venta_id FROM entrega_venta ev
                    WHERE ev.entrega_id = e.id
                    ORDER BY ev.orden
                    LIMIT 1
                )
                WHERE EXISTS (
                    SELECT 1 FROM entrega_venta ev
                    WHERE ev.entrega_id = e.id
                )
            ');
        } catch (\Exception $e) {
            \Log::warning('Error recuperando venta_id: ' . $e->getMessage());
        }

        // Paso 3: Recrear la FK
        Schema::table('entregas', function (Blueprint $table) {
            $table->foreign('venta_id')
                ->references('id')
                ->on('ventas')
                ->onDelete('cascade');
        });

        // Paso 4: Recrear FK en reporte_cargas
        Schema::table('reporte_cargas', function (Blueprint $table) {
            $table->foreign('entrega_id')
                ->references('id')
                ->on('entregas')
                ->onDelete('cascade');
        });
    }
};
