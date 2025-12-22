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
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-lg">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard de Logística</h1>
                <div className="flex items-center gap-2">
                    {logisticaLastUpdate && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                            Actualizado: {logisticaLastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={refreshLogisticaStats}
                        disabled={loadingLogisticaStats}
                        className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        <RefreshCw className={`h-4 w-4 ${loadingLogisticaStats ? 'animate-spin' : ''}`} />
                    </Button>
                </div>
            </div>

            {/* Estadísticas de proformas */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">Proformas Pendientes</CardTitle>
                        <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold dark:text-white">
                            {loadingLogisticaStats ? '...' : logisticaStats?.proformas.pendientes ?? stats.proformas_pendientes}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Esperando aprobación</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">Proformas Aprobadas</CardTitle>
                        <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                            {loadingLogisticaStats ? '...' : logisticaStats?.proformas.aprobadas ?? 0}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Listas para convertir</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">Proformas Vencidas</CardTitle>
                        <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {loadingLogisticaStats ? '...' : proformaStats?.alertas.vencidas ?? 0}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Requieren atención</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">Por Vencer (2 días)</CardTitle>
                        <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                            {loadingLogisticaStats ? '...' : proformaStats?.alertas.por_vencer ?? 0}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Atención priorizada</p>
                    </CardContent>
                </Card>
            </div>

            {/* Card de Monto Total */}
            {proformaStats && (
                <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 dark:border-blue-800">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-blue-200">Monto Total en Proformas</CardTitle>
                        <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                            Bs {proformaStats.monto_total.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Pendientes</p>
                                <p className="font-semibold dark:text-white">
                                    Bs {proformaStats.montos_por_estado.pendiente.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Aprobadas</p>
                                <p className="font-semibold text-green-600 dark:text-green-400">
                                    Bs {proformaStats.montos_por_estado.aprobada.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                            <div>
                                <p className="text-gray-600 dark:text-gray-400">Convertidas</p>
                                <p className="font-semibold text-blue-600 dark:text-blue-400">
                                    Bs {proformaStats.montos_por_estado.convertida.toLocaleString('es-BO', { maximumFractionDigits: 0 })}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Estadísticas de Envíos */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">Envíos Programados</CardTitle>
                        <Package className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold dark:text-white">
                            {loadingLogisticaStats ? '...' : logisticaStats?.envios.programados ?? stats.envios_programados}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Listos para despacho</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">En Tránsito</CardTitle>
                        <Truck className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold dark:text-white">
                            {loadingLogisticaStats ? '...' : logisticaStats?.envios.en_ruta ?? stats.envios_en_transito}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">En camino</p>
                    </CardContent>
                </Card>

                <Card className="dark:bg-slate-900 dark:border-slate-700">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium dark:text-gray-300">Entregados Hoy</CardTitle>
                        <CheckCircle className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold dark:text-white">
                            {loadingLogisticaStats ? '...' : logisticaStats?.envios.entregados_hoy ?? stats.envios_entregados_hoy}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Completados</p>
                    </CardContent>
                </Card>
            </div>
        </>
    );
}
