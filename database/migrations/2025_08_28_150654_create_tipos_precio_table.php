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
        Schema::create('tipos_precio', function (Blueprint $table) {
            $table->id();
            $table->string('codigo', 20)->unique(); // Código identificador (ej: COSTO, VENTA, etc.)
            $table->string('nombre', 100); // Nombre descriptivo
            $table->string('descripcion', 255)->nullable(); // Descripción detallada
            $table->decimal('porcentaje_ganancia', 8, 2)->nullable();
            $table->string('color', 20)->default('gray'); // Color para la UI
            $table->boolean('es_ganancia')->default(true); // Si es precio de ganancia o costo base
            $table->boolean('es_precio_base')->default(false); // Si es el precio base para cálculos
            $table->integer('orden')->default(0); // Orden de visualización
            $table->boolean('activo')->default(true); // Estado activo/inactivo
            $table->boolean('es_sistema')->default(false); // Si es un tipo del sistema (no editable)
            $table->json('configuracion')->nullable(); // Configuraciones adicionales
            $table->timestamps();

            // Índices
            $table->index(['activo', 'orden']);
            $table->index('es_ganancia');
            $table->index('es_precio_base');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_precio');
    }
};
