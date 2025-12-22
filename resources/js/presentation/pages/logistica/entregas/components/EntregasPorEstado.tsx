import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { EntregaEstado } from '@/application/hooks/use-entregas-dashboard-stats';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EntregasPorEstadoProps {
    estados: EntregaEstado;
    loading: boolean;
}

export function EntregasPorEstado({
    estados,
    loading,
}: EntregasPorEstadoProps) {
    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Entregas por Estado
                    </CardTitle>
                </CardHeader>
                <CardContent className="h-80 flex items-center justify-center">
                    <div className="text-muted-foreground">Cargando...</div>
                </CardContent>
            </Card>
        );
    }

    const estadoLabels = [
        'Programada',
        'Asignada',
        'En Camino',
        'Llegó',
        'Entregada',
        'Novedad',
        'Cancelada',
    ];

    const estadoColors = [
        '#3b82f6', // blue
        '#a855f7', // purple
        '#f97316', // orange
        '#06b6d4', // cyan
        '#10b981', // green
        '#eab308', // yellow
        '#ef4444', // red
    ];

    const chartData = {
        labels: estadoLabels,
        datasets: [
            {
                label: 'Cantidad de Entregas',
                data: [
                    estados.PROGRAMADO,
                    estados.ASIGNADA,
                    estados.EN_CAMINO,
                    estados.LLEGO,
                    estados.ENTREGADO,
                    estados.NOVEDAD,
                    estados.CANCELADA,
                ],
                backgroundColor: estadoColors,
                borderColor: '#fff',
                borderWidth: 2,
            },
        ],
    };

    const options = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                display: true,
                position: 'right' as const,
                labels: {
                    padding: 15,
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    label: function(context: any) {
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = ((context.parsed / total) * 100).toFixed(1);
                        return `${context.label}: ${context.parsed} (${percentage}%)`;
                    },
                },
            },
        },
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Entregas por Estado
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-80">
                    <Doughnut
                        data={chartData}
                        options={options}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
