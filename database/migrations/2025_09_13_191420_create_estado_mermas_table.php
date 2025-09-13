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
        Schema::create('estado_mermas', function (Blueprint $table) {
            $table->id();
            $table->string('clave')->unique(); // Ej: PENDIENTE, APROBADO
            $table->string('label');
            $table->string('color')->nullable();
            $table->string('bg_color')->nullable();
            $table->string('text_color')->nullable();
            $table->json('actions')->nullable();
            $table->boolean('activo')->default(true);
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('estado_mermas');
    }
};
