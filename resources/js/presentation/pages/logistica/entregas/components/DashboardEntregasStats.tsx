import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import {
    RefreshCw,
    Package,
    CheckCircle2,
    Truck,
    MapPin,
    AlertCircle,
    Clock,
} from 'lucide-react';
import type { EntregaEstado } from '@/application/hooks/use-entregas-dashboard-stats';

interface DashboardEntregasStatsProps {
    estados: EntregaEstado;
    estadosTotal: number;
    loading: boolean;
    lastUpdate: Date | null;
    onRefresh: () => void;
}

const estadoConfig = {
    PROGRAMADO: {
        label: 'Programada',
        icon: Clock,
        bgColor: 'bg-blue-50 dark:bg-blue-950',
        borderColor: 'border-blue-200 dark:border-blue-800',
        textColor: 'text-blue-600 dark:text-blue-400',
        iconColor: 'text-blue-600',
    },
    ASIGNADA: {
        label: 'Asignada',
        icon: Package,
        bgColor: 'bg-purple-50 dark:bg-purple-950',
        borderColor: 'border-purple-200 dark:border-purple-800',
        textColor: 'text-purple-600 dark:text-purple-400',
        iconColor: 'text-purple-600',
    },
    EN_CAMINO: {
        label: 'En Camino',
        icon: Truck,
        bgColor: 'bg-orange-50 dark:bg-orange-950',
        borderColor: 'border-orange-200 dark:border-orange-800',
        textColor: 'text-orange-600 dark:text-orange-400',
        iconColor: 'text-orange-600',
    },
    LLEGO: {
        label: 'Llegó',
        icon: MapPin,
        bgColor: 'bg-cyan-50 dark:bg-cyan-950',
        borderColor: 'border-cyan-200 dark:border-cyan-800',
        textColor: 'text-cyan-600 dark:text-cyan-400',
        iconColor: 'text-cyan-600',
    },
    ENTREGADO: {
        label: 'Entregada',
        icon: CheckCircle2,
        bgColor: 'bg-green-50 dark:bg-green-950',
        borderColor: 'border-green-200 dark:border-green-800',
        textColor: 'text-green-600 dark:text-green-400',
        iconColor: 'text-green-600',
    },
    NOVEDAD: {
        label: 'Novedad',
        icon: AlertCircle,
        bgColor: 'bg-yellow-50 dark:bg-yellow-950',
        borderColor: 'border-yellow-200 dark:border-yellow-800',
        textColor: 'text-yellow-600 dark:text-yellow-400',
        iconColor: 'text-yellow-600',
    },
    CANCELADA: {
        label: 'Cancelada',
        icon: AlertCircle,
        bgColor: 'bg-red-50 dark:bg-red-950',
        borderColor: 'border-red-200 dark:border-red-800',
        textColor: 'text-red-600 dark:text-red-400',
        iconColor: 'text-red-600',
    },
};

export function DashboardEntregasStats({
    estados,
    estadosTotal,
    loading,
    lastUpdate,
    onRefresh,
}: DashboardEntregasStatsProps) {
    const estadoEntries = Object.entries(estados) as Array<
        [keyof EntregaEstado, number]
    >;

    return (
        <>
            {/* Header con refresh */}
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Estadísticas de Entregas</h2>
                <div className="flex items-center gap-2">
                    {lastUpdate && (
                        <span className="text-xs text-muted-foreground">
                            Actualizado: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={onRefresh}
                        disabled={loading}
                    >
                        <RefreshCw
                            className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
                        />
                    </Button>
                </div>
            </div>

            {/* Cards de estados */}
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-7">
                {estadoEntries.map(([estado, cantidad]) => {
                    const config =
                        estadoConfig[
                            estado as keyof typeof estadoConfig
                        ];
                    const IconComponent = config.icon;

                    return (
                        <Card
                            key={estado}
                            className={`${config.bgColor} ${config.borderColor} border`}
                        >
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-xs font-medium">
                                    {config.label}
                                </CardTitle>
                                <IconComponent
                                    className={`h-4 w-4 ${config.iconColor}`}
                                />
                            </CardHeader>
                            <CardContent>
                                <div className={`text-2xl font-bold ${config.textColor}`}>
                                    {loading ? '...' : cantidad}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    {Math.round(
                                        (cantidad / (estadosTotal || 1)) * 100
                                    )}
                                    % del total
                                </p>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>

            {/* Card de total */}
            <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Total de Entregas
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
                        {loading ? '...' : estadosTotal}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                        Distribución completa de entregas por estado
                    </p>
                </CardContent>
            </Card>
        </>
    );
}
