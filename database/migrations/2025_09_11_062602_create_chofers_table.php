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
        Schema::create('chofers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users');
            $table->string('licencia')->unique();
            $table->string('telefono')->nullable();
            $table->boolean('activo')->default(true);
            $table->date('fecha_vencimiento_licencia')->nullable();
            $table->text('observaciones')->nullable();
            $table->timestamps();

            $table->index(['activo']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('chofers');
    }
};
