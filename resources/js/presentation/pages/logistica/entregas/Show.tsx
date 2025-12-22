import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { ArrowLeft, MapPin, Package, Calendar, User } from 'lucide-react';
import { router } from '@inertiajs/react';
import { Entrega } from '@/domain/entities/entregas';

interface ShowProps {
    entrega: Entrega;
}

const estadoBadgeColor: Record<string, string> = {
    PROGRAMADO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    ASIGNADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    EN_CAMINO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    LLEGO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
    NOVEDAD: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    CANCELADA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
};

export default function EntregaShow({ entrega }: ShowProps) {
    console.log('Entrega data:', entrega);
    const cliente = entrega.venta?.cliente || entrega.proforma?.cliente;
    const numero = entrega.proforma?.numero || entrega.venta?.numero || entrega.numero || `#${entrega.id}`;

    return (
        <AppLayout>
            <Head title={`Entrega ${numero}`} />

            <div className="space-y-6 p-6 max-w-4xl mx-auto bg-white dark:bg-slate-950 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entrega {numero.toString()}</h1>
                            <p className="text-gray-500 dark:text-gray-400">Detalles de la entrega</p>
                        </div>
                    </div>
                    <Badge className={estadoBadgeColor[entrega.estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'}>
                        {entrega.estado}
                    </Badge>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Información del Cliente
                        </h2>
                        <div className="space-y-3">
                            {cliente && (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                                        <p className="font-medium text-gray-900 dark:text-white">{cliente.nombre}</p>
                                    </div>
                                </>
                            )}
                            {entrega.venta && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Venta</p>
                                    <p className="font-medium text-gray-900 dark:text-white">#{entrega.venta.numero}</p>
                                </div>
                            )}
                            {entrega.proforma && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Proforma</p>
                                    <p className="font-medium text-gray-900 dark:text-white">#{entrega.proforma.numero}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates Information */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Fechas
                        </h2>
                        <div className="space-y-3">
                            {entrega.fecha_programada && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Programada</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(entrega.fecha_programada).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            )}
                            {entrega.fecha_entrega && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Entrega</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {new Date(entrega.fecha_entrega).toLocaleDateString('es-ES', {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chofer Information */}
                    {entrega.chofer && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                Conductor
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{entrega.chofer.nombre}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicle Information */}
                    {entrega.vehiculo && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                Vehículo
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Placa</p>
                                    <p className="font-medium text-lg text-gray-900 dark:text-white">{entrega.vehiculo.placa}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Modelo</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {entrega.vehiculo.marca} {entrega.vehiculo.modelo}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                        className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
