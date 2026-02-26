<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     * ✅ Actualizar enum tipo_entrega para usar CON_NOVEDAD en lugar de NOVEDAD
     * ✅ Agregar NO_CONTACTADO a tipo_novedad
     */
    public function up(): void
    {
        // ✅ PASO 1: Convertir valores NOVEDAD a CON_NOVEDAD PRIMERO
        DB::statement("UPDATE entregas_venta_confirmaciones SET tipo_entrega = 'CON_NOVEDAD' WHERE tipo_entrega = 'NOVEDAD'");

        // ✅ PASO 2: Remover la restricción CHECK antigua
        DB::statement("ALTER TABLE entregas_venta_confirmaciones DROP CONSTRAINT IF EXISTS entregas_venta_confirmaciones_tipo_entrega_check");

        // ✅ PASO 3: Agregar nueva restricción con CON_NOVEDAD
        DB::statement("ALTER TABLE entregas_venta_confirmaciones ADD CONSTRAINT entregas_venta_confirmaciones_tipo_entrega_check CHECK (tipo_entrega IN ('COMPLETA', 'CON_NOVEDAD'))");

        // ✅ PASO 4: Actualizar constraint para tipo_novedad - agregar NO_CONTACTADO
        DB::statement("ALTER TABLE entregas_venta_confirmaciones DROP CONSTRAINT IF EXISTS entregas_venta_confirmaciones_tipo_novedad_check");

        DB::statement("ALTER TABLE entregas_venta_confirmaciones ADD CONSTRAINT entregas_venta_confirmaciones_tipo_novedad_check CHECK (tipo_novedad IN ('CLIENTE_CERRADO', 'DEVOLUCION_PARCIAL', 'RECHAZADO', 'NO_CONTACTADO'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // ✅ Revertir los cambios (volver a NOVEDAD y remover NO_CONTACTADO)
        DB::statement("UPDATE entregas_venta_confirmaciones SET tipo_entrega = 'NOVEDAD' WHERE tipo_entrega = 'CON_NOVEDAD'");

        DB::statement("ALTER TABLE entregas_venta_confirmaciones DROP CONSTRAINT IF EXISTS entregas_venta_confirmaciones_tipo_entrega_check");
        DB::statement("ALTER TABLE entregas_venta_confirmaciones ADD CONSTRAINT entregas_venta_confirmaciones_tipo_entrega_check CHECK (tipo_entrega IN ('COMPLETA', 'NOVEDAD'))");

        DB::statement("ALTER TABLE entregas_venta_confirmaciones DROP CONSTRAINT IF EXISTS entregas_venta_confirmaciones_tipo_novedad_check");
        DB::statement("ALTER TABLE entregas_venta_confirmaciones ADD CONSTRAINT entregas_venta_confirmaciones_tipo_novedad_check CHECK (tipo_novedad IN ('CLIENTE_CERRADO', 'DEVOLUCION_PARCIAL', 'RECHAZADO'))");
    }
};
