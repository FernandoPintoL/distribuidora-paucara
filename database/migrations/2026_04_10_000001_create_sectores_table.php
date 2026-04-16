<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Crear tabla sectores para clasificar productos dentro de almacenes
     *
     * Un sector pertenece a un almacén y contiene múltiples stock_productos.
     * Cada almacén tendrá automáticamente un sector "General" con es_generico=true
     * para productos sin clasificación específica.
     */
    public function up(): void
    {
        Schema::create('sectores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('almacen_id')
                ->constrained('almacenes')
                ->cascadeOnDelete()
                ->comment('Almacén al que pertenece este sector');

            $table->string('nombre', 100)
                ->comment('Nombre del sector (ej: "General", "Refrigeración", "Bebidas")');

            $table->boolean('es_generico')
                ->default(false)
                ->index()
                ->comment('True si es el sector "General" automático del almacén');

            $table->text('descripcion')
                ->nullable()
                ->comment('Descripción opcional del sector');

            $table->timestamps();

            // Un solo sector genérico por almacén
            $table->unique(['almacen_id', 'es_generico'], 'uq_almacen_sector_generico');

            // Nombre único dentro del almacén
            $table->unique(['almacen_id', 'nombre'], 'uq_almacen_sector_nombre');

            // Índices para búsquedas comunes
            // Nota: es_generico ya tiene index() en la definición del campo (línea 30)
            $table->index('almacen_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sectores');
    }
};
