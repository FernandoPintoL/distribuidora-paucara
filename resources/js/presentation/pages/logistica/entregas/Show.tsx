import { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { ArrowLeft, MapPin, Package, Calendar, User } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Entrega {
    id: number;
    numero?: string;
    estado: string;
    fecha_programada?: string;
    fecha_entrega?: string;
    proforma?: {
        id: number;
        numero: string;
        cliente?: {
            id: number;
            nombre: string;
        };
    };
    venta?: {
        id: number;
        numero: string;
        cliente?: {
            id: number;
            nombre: string;
        };
    };
    chofer?: {
        id: number;
        nombre: string;
    };
    vehiculo?: {
        id: number;
        placa: string;
        marca: string;
        modelo: string;
    };
}

interface ShowProps {
    entrega: Entrega;
}

const estadoBadgeColor: Record<string, string> = {
    PROGRAMADO: 'bg-yellow-100 text-yellow-800',
    ASIGNADA: 'bg-blue-100 text-blue-800',
    EN_CAMINO: 'bg-purple-100 text-purple-800',
    ENTREGADO: 'bg-green-100 text-green-800',
    RECHAZADO: 'bg-red-100 text-red-800',
};

export default function EntregaShow({ entrega }: ShowProps) {
    const cliente = entrega.venta?.cliente || entrega.proforma?.cliente;
    const numero = entrega.proforma?.numero || entrega.venta?.numero || entrega.numero || `#${entrega.id}`;

    return (
        <AppLayout>
            <Head title={`Entrega ${numero}`} />

            <div className="space-y-6 p-6 max-w-4xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold">Entrega {numero}</h1>
                            <p className="text-gray-500">Detalles de la entrega</p>
                        </div>
                    </div>
                    <Badge className={estadoBadgeColor[entrega.estado] || 'bg-gray-100 text-gray-800'}>
                        {entrega.estado}
                    </Badge>
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Client Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5" />
                            Información del Cliente
                        </h2>
                        <div className="space-y-3">
                            {cliente && (
                                <>
                                    <div>
                                        <p className="text-sm text-gray-500">Cliente</p>
                                        <p className="font-medium">{cliente.nombre}</p>
                                    </div>
                                </>
                            )}
                            {entrega.venta && (
                                <div>
                                    <p className="text-sm text-gray-500">Venta</p>
                                    <p className="font-medium">#{entrega.venta.numero}</p>
                                </div>
                            )}
                            {entrega.proforma && (
                                <div>
                                    <p className="text-sm text-gray-500">Proforma</p>
                                    <p className="font-medium">#{entrega.proforma.numero}</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Dates Information */}
                    <div className="bg-white rounded-lg border border-gray-200 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5" />
                            Fechas
                        </h2>
                        <div className="space-y-3">
                            {entrega.fecha_programada && (
                                <div>
                                    <p className="text-sm text-gray-500">Fecha Programada</p>
                                    <p className="font-medium">
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
                                    <p className="text-sm text-gray-500">Fecha de Entrega</p>
                                    <p className="font-medium">
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
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <User className="w-5 h-5" />
                                Conductor
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Nombre</p>
                                    <p className="font-medium">{entrega.chofer.nombre}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicle Information */}
                    {entrega.vehiculo && (
                        <div className="bg-white rounded-lg border border-gray-200 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Vehículo
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500">Placa</p>
                                    <p className="font-medium text-lg">{entrega.vehiculo.placa}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">Modelo</p>
                                    <p className="font-medium">
                                        {entrega.vehiculo.marca} {entrega.vehiculo.modelo}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => router.back()}
                    >
                        Volver
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
