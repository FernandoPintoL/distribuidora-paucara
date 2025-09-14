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
        Schema::create('tipos_ajuste_inventario', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique(); // Ej: AJUSTE_FISICO, DONACION, CORRECCION
            $table->string('label');           // Nombre visible
            $table->string('descripcion')->nullable();
            $table->string('color')->nullable();
            $table->string('bg_color')->nullable();
            $table->string('text_color')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('tipos_ajuste_inventario');
    }
};
