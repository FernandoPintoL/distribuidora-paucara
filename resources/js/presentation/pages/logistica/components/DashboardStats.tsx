import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { RefreshCw, Clock, CheckCircle, AlertCircle, TrendingUp, Package, Truck } from 'lucide-react';

interface DashboardStatsProps {
    logisticaStats: any;
    proformaStats: any;
    stats: any;
    loadingLogisticaStats: boolean;
    logisticaLastUpdate: Date | null;
    refreshLogisticaStats: () => void;
}

export function DashboardStats({
    logisticaStats,
    proformaStats,
    stats,
    loadingLogisticaStats,
    logisticaLastUpdate,
    refreshLogisticaStats,
}: DashboardStatsProps) {
    return (
        <>
            {/* Header con refresh */}
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold">Dashboard de Logística</h1>
                <div className="flex items-center gap-2">
                    {logisticaLastUpdate && (
                        <span className="text-xs text-muted-foreground">
                            Actualizado: {logisticaLastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshLogisticaStats}
                        disabled={loadingLogisticaStats}
                    >
                        <RefreshCw className={`h-4 w-4 ${loadingLogisticaStats ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Estadísticas de proformas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proformas Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingLogisticaStats ? '...' : logisticaStats?.proformas.pendientes ?? stats.proformas_pendientes}
                        </div>
                        <p className="text-xs text-muted-foreground">Esperando aprobación</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proformas Aprobadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {loadingLogisticaStats ? '...' : logisticaStats?.proformas.aprobadas ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Listas para convertir</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Proformas Vencidas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">
                            {loadingLogisticaStats ? '...' : proformaStats?.alertas.vencidas ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Requieren atención</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Por Vencer (2 días)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600">
                            {loadingLogisticaStats ? '...' : proformaStats?.alertas.por_vencer ?? 0}
                        </div>
                        <p className="text-xs text-muted-foreground">Atención priorizada</p>
                    </CardContent>
                </Card>
            </div>

            {/* Card de Monto Total */}
            {proformaStats && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Monto Total en Proformas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">
                            Bs {proformaStats.monto_total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <p className="text-muted-foreground">Pendientes</p>
                                <p className="font-semibold">
                                    Bs {proformaStats.montos_por_estado.pendiente.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Aprobadas</p>
                                <p className="font-semibold text-green-600">
                                    Bs {proformaStats.montos_por_estado.aprobada.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Convertidas</p>
                                <p className="font-semibold text-blue-600">
                                    Bs {proformaStats.montos_por_estado.convertida.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Estadísticas de Envíos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Envíos Programados</CardTitle>
                        <Package className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingLogisticaStats ? '...' : logisticaStats?.envios.programados ?? stats.envios_programados}
                        </div>
                        <p className="text-xs text-muted-foreground">Listos para despacho</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">En Tránsito</CardTitle>
                        <Truck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingLogisticaStats ? '...' : logisticaStats?.envios.en_ruta ?? stats.envios_en_transito}
                        </div>
                        <p className="text-xs text-muted-foreground">En camino</p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entregados Hoy</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {loadingLogisticaStats ? '...' : logisticaStats?.envios.entregados_hoy ?? stats.envios_entregados_hoy}
                        </div>
                        <p className="text-xs text-muted-foreground">Completados</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
