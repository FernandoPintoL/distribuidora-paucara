import { useMemo } from 'react';
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
import { useEstadosEntregas } from '@/application/hooks';

interface DashboardEntregasStatsProps {
    estados: EntregaEstado;
    estadosTotal: number;
    loading: boolean;
    lastUpdate: Date | null;
    onRefresh: () => void;
}

// ✅ ACTUALIZADO: Mapeo de estado código a ícono para TODOS los estados de entrega
// Los códigos aquí deben coincidir con los de la tabla estados_logistica categoria='entrega'
const estadoIconMap: Record<string, any> = {
    // Legacy workflow
    PROGRAMADO: Clock,
    ASIGNADA: Package,
    EN_CAMINO: Truck,
    LLEGO: MapPin,
    ENTREGADO: CheckCircle2,
    RECHAZADO: AlertCircle,
    CANCELADA: AlertCircle,

    // New loading workflow
    PREPARACION_CARGA: Package,
    EN_CARGA: Truck,
    LISTO_PARA_ENTREGA: CheckCircle2,
    EN_TRANSITO: Truck,

    // Issues
    NOVEDAD: AlertCircle,
};

// Helper para convertir color hex a clases tailwind
const colorToTailwind = (hexColor: string | undefined): { bgColor: string; textColor: string; borderColor: string; iconColor: string } => {
    // Fallback colors si no hay color en API
    const colorMap: Record<string, { bgColor: string; textColor: string; borderColor: string; iconColor: string }> = {
        '#3b82f6': { bgColor: 'bg-blue-50 dark:bg-blue-950', textColor: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-200 dark:border-blue-800', iconColor: 'text-blue-600' },
        '#a855f7': { bgColor: 'bg-purple-50 dark:bg-purple-950', textColor: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-200 dark:border-purple-800', iconColor: 'text-purple-600' },
        '#f97316': { bgColor: 'bg-orange-50 dark:bg-orange-950', textColor: 'text-orange-600 dark:text-orange-400', borderColor: 'border-orange-200 dark:border-orange-800', iconColor: 'text-orange-600' },
        '#06b6d4': { bgColor: 'bg-cyan-50 dark:bg-cyan-950', textColor: 'text-cyan-600 dark:text-cyan-400', borderColor: 'border-cyan-200 dark:border-cyan-800', iconColor: 'text-cyan-600' },
        '#10b981': { bgColor: 'bg-green-50 dark:bg-green-950', textColor: 'text-green-600 dark:text-green-400', borderColor: 'border-green-200 dark:border-green-800', iconColor: 'text-green-600' },
        '#eab308': { bgColor: 'bg-yellow-50 dark:bg-yellow-950', textColor: 'text-yellow-600 dark:text-yellow-400', borderColor: 'border-yellow-200 dark:border-yellow-800', iconColor: 'text-yellow-600' },
        '#ef4444': { bgColor: 'bg-red-50 dark:bg-red-950', textColor: 'text-red-600 dark:text-red-400', borderColor: 'border-red-200 dark:border-red-800', iconColor: 'text-red-600' },
    };
    return colorMap[hexColor?.toLowerCase() || ''] || colorMap['#6b7280'];
};

export function DashboardEntregasStats({
    estados,
    estadosTotal,
    loading,
    lastUpdate,
    onRefresh,
}: DashboardEntregasStatsProps) {
    // Fase 3: Usar hook de estados centralizados para obtener datos dinámicamente
    const { estados: estadosAPI } = useEstadosEntregas();

    // Generar configuración dinámica desde el API
    const estadoConfig = useMemo(() => {
        const config: Record<string, any> = {};

        estadosAPI.forEach(estado => {
            const Icon = estadoIconMap[estado.codigo] || AlertCircle;
            const colors = colorToTailwind(estado.color);

            config[estado.codigo] = {
                label: estado.nombre,
                icon: Icon,
                ...colors,
            };
        });

        return config;
    }, [estadosAPI]);

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

                    // Fallback si el estado no está en la configuración
                    if (!config) {
                        return null;
                    }

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
