<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\EstadoDocumento;

class EstadoDocumentoSeeder extends Seeder
{
    public function run(): void
    {
        /* $estados = [
            ['nombre' => 'Borrador', 'codigo' => 'BORRADOR', 'descripcion' => 'Documento en edición', 'activo' => true],
            ['nombre' => 'Pendiente', 'codigo' => 'PENDIENTE', 'descripcion' => 'Pendiente de aprobación', 'activo' => true],
            ['nombre' => 'Aprobado', 'codigo' => 'APROBADO', 'descripcion' => 'Aprobado para su uso', 'activo' => true],
            ['nombre' => 'Rechazado', 'codigo' => 'RECHAZADO', 'descripcion' => 'Rechazado', 'activo' => true],
            ['nombre' => 'Cancelado', 'codigo' => 'CANCELADO', 'descripcion' => 'Cancelado', 'activo' => true],
            ['nombre' => 'Facturado', 'codigo' => 'FACTURADO', 'descripcion' => 'Documento facturado', 'activo' => true],
        ];
        foreach ($estados as $estado) {
            EstadoDocumento::firstOrCreate(['codigo' => $estado['codigo']], $estado);
        } */
    }
}
