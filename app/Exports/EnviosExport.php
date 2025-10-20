<?php

namespace App\Exports;

use App\Models\Envio;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithColumnWidths;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class EnviosExport implements FromCollection, WithHeadings, WithMapping, WithStyles, WithColumnWidths
{
    protected Collection $envios;

    public function __construct(Collection $envios)
    {
        $this->envios = $envios;
    }

    /**
     * @return Collection
     */
    public function collection(): Collection
    {
        return $this->envios;
    }

    /**
     * Encabezados de las columnas
     */
    public function headings(): array
    {
        return [
            'N° Envío',
            'Estado',
            'Venta',
            'Cliente',
            'Vehículo',
            'Placa',
            'Chofer',
            'Fecha Programada',
            'Fecha Salida',
            'Fecha Entrega',
            'Dirección Entrega',
            'Receptor',
            'Observaciones',
        ];
    }

    /**
     * Mapear cada envío a una fila
     */
    public function map($envio): array
    {
        return [
            $envio->numero_envio,
            $this->formatearEstado($envio->estado),
            $envio->venta->numero ?? '',
            $envio->venta->cliente->nombre ?? '',
            $envio->vehiculo ? "{$envio->vehiculo->marca} {$envio->vehiculo->modelo}" : '',
            $envio->vehiculo->placa ?? '',
            $envio->chofer->name ?? '',
            $envio->fecha_programada ? $envio->fecha_programada->format('d/m/Y H:i') : '',
            $envio->fecha_salida ? $envio->fecha_salida->format('d/m/Y H:i') : '',
            $envio->fecha_entrega ? $envio->fecha_entrega->format('d/m/Y H:i') : '',
            $envio->direccion_entrega ?? '',
            $envio->receptor_nombre ?? '',
            $envio->observaciones ?? '',
        ];
    }

    /**
     * Estilos de la hoja
     */
    public function styles(Worksheet $sheet): array
    {
        return [
            // Estilo para la fila de encabezados
            1 => [
                'font' => [
                    'bold' => true,
                    'size' => 12,
                ],
                'fill' => [
                    'fillType' => \PhpOffice\PhpSpreadsheet\Style\Fill::FILL_SOLID,
                    'startColor' => ['rgb' => '4F81BD'],
                ],
                'font' => [
                    'color' => ['rgb' => 'FFFFFF'],
                    'bold' => true,
                ],
            ],
        ];
    }

    /**
     * Anchos de columna
     */
    public function columnWidths(): array
    {
        return [
            'A' => 18,  // N° Envío
            'B' => 18,  // Estado
            'C' => 15,  // Venta
            'D' => 30,  // Cliente
            'E' => 20,  // Vehículo
            'F' => 12,  // Placa
            'G' => 25,  // Chofer
            'H' => 18,  // Fecha Programada
            'I' => 18,  // Fecha Salida
            'J' => 18,  // Fecha Entrega
            'K' => 35,  // Dirección
            'L' => 25,  // Receptor
            'M' => 30,  // Observaciones
        ];
    }

    /**
     * Formatear estado con emoji
     */
    private function formatearEstado(string $estado): string
    {
        $estados = [
            Envio::PROGRAMADO => '📅 Programado',
            Envio::EN_PREPARACION => '📦 En Preparación',
            Envio::EN_RUTA => '🚚 En Ruta',
            Envio::ENTREGADO => '✅ Entregado',
            Envio::CANCELADO => '❌ Cancelado',
        ];

        return $estados[$estado] ?? $estado;
    }
}
