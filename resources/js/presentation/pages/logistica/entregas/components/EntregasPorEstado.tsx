import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import {
    Chart as ChartJS,
    ArcElement,
    Tooltip,
    Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import type { EntregaEstado } from '@/application/hooks/use-entregas-dashboard-stats';
import { useEstadosEntregas } from '@/application/hooks';

ChartJS.register(ArcElement, Tooltip, Legend);

interface EntregasPorEstadoProps {
    estados: EntregaEstado;
    loading: boolean;
}

export function EntregasPorEstado({
    estados,
    loading,
}: EntregasPorEstadoProps) {
    // Fase 3: Usar hook de estados centralizados para obtener datos dinámicamente
    const { estados: estadosAPI, isLoading: estadosLoading } = useEstadosEntregas();

    if (loading || estadosLoading) {
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

    // ✅ ACTUALIZADO: Fallback con todos los estados de entrega de la BD
    const estadoLabelsFallback = [
        'Programado',
        'Asignada',
        'Preparación de Carga',
        'En Carga',
        'Listo para Entrega',
        'En Camino',
        'En Tránsito',
        'Llegó a Destino',
        'Entregado',
        'Con Novedad',
        'Rechazado',
        'Cancelada',
    ];

    const estadoColorsFallback = [
        '#FFC107', // PROGRAMADO: yellow
        '#0275D8', // ASIGNADA: blue
        '#9C27B0', // PREPARACION_CARGA: purple
        '#673AB7', // EN_CARGA: dark purple
        '#3F51B5', // LISTO_PARA_ENTREGA: indigo
        '#2196F3', // EN_CAMINO: light blue
        '#03A9F4', // EN_TRANSITO: cyan
        '#00BCD4', // LLEGO: cyan
        '#28A745', // ENTREGADO: green
        '#FF9800', // NOVEDAD: orange
        '#F44336', // RECHAZADO: red
        '#6C757D', // CANCELADA: gray
    ];

    // Generar labels y colores desde el API
    const chartConfig = useMemo(() => {
        if (estadosAPI.length === 0) {
            // ✅ ACTUALIZADO: Fallback con todos los códigos de estado de entrega
            return {
                labels: estadoLabelsFallback,
                colors: estadoColorsFallback,
                estadoCodigos: [
                    'PROGRAMADO',
                    'ASIGNADA',
                    'PREPARACION_CARGA',
                    'EN_CARGA',
                    'LISTO_PARA_ENTREGA',
                    'EN_CAMINO',
                    'EN_TRANSITO',
                    'LLEGO',
                    'ENTREGADO',
                    'NOVEDAD',
                    'RECHAZADO',
                    'CANCELADA',
                ]
            };
        }

        return {
            labels: estadosAPI.map(e => e.nombre),
            colors: estadosAPI.map(e => e.color || '#6b7280'),
            estadoCodigos: estadosAPI.map(e => e.codigo)
        };
    }, [estadosAPI]);

    // Mapear datos de estados a los códigos en orden
    const chartDataValues = chartConfig.estadoCodigos.map(codigo => {
        return (estados as any)[codigo] || 0;
    });

    const chartData = {
        labels: chartConfig.labels,
        datasets: [
            {
                label: 'Cantidad de Entregas',
                data: chartDataValues,
                backgroundColor: chartConfig.colors,
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
