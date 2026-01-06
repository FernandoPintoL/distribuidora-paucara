import React from 'react';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface BorradorItem {
    id?: number;
    producto_id: number;
    almacen_id: number;
    cantidad?: number;
    lote?: string;
    fecha_vencimiento?: string;
    precio_costo?: number;
}

interface Borrador {
    id: number;
    estado: 'borrador' | 'completado';
    items: BorradorItem[];
}

interface Props {
    borrador: Borrador;
}

export default function EstadoBorrador({ borrador }: Props) {
    // Analizar estado del borrador
    const totalItems = borrador.items.length;
    const itemsConCantidad = borrador.items.filter(item => item.cantidad && item.cantidad > 0).length;
    const itemsSinCantidad = totalItems - itemsConCantidad;
    const porcentajeComplecion = totalItems > 0 ? (itemsConCantidad / totalItems) * 100 : 0;

    // Agrupar por producto para ver cuántos están completamente registrados
    const productosUnicos = new Set(borrador.items.map(item => item.producto_id)).size;

    return (
        <Card>
            <CardContent className="pt-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Productos */}
                    <div className="text-center">
                        <div className="text-3xl font-bold text-blue-600">{productosUnicos}</div>
                        <p className="text-sm text-gray-600 mt-1">Productos en borrador</p>
                    </div>

                    {/* Items completados */}
                    <div className="text-center">
                        <div className="text-3xl font-bold text-green-600">{itemsConCantidad}</div>
                        <p className="text-sm text-gray-600 mt-1">Items completados</p>
                        <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                            <div
                                className="bg-green-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${porcentajeComplecion}%` }}
                            ></div>
                        </div>
                    </div>

                    {/* Items pendientes */}
                    <div className="text-center">
                        <div className="text-3xl font-bold text-orange-600">{itemsSinCantidad}</div>
                        <p className="text-sm text-gray-600 mt-1">Items pendientes</p>
                    </div>
                </div>

                {/* Estado del borrador */}
                <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center gap-3">
                        {borrador.estado === 'completado' ? (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-semibold text-green-700">Completado</p>
                                    <p className="text-sm text-gray-600">Inventario inicial registrado en el sistema</p>
                                </div>
                            </>
                        ) : itemsSinCantidad > 0 ? (
                            <>
                                <AlertCircle className="h-5 w-5 text-orange-500" />
                                <div>
                                    <p className="font-semibold text-orange-700">En progreso</p>
                                    <p className="text-sm text-gray-600">
                                        {itemsSinCantidad} item(s) sin cantidad. Completa todos para finalizar.
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <CheckCircle2 className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="font-semibold text-green-700">Listo para finalizar</p>
                                    <p className="text-sm text-gray-600">Todos los items tienen cantidad registrada</p>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
