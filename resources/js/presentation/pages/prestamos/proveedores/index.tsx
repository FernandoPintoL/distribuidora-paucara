import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import prestamoProveedorService from '@/infrastructure/services/prestamo-proveedor.service';
import type { PrestamoProveedor, EstadoPrestamo, DatosDevolucionProveedor } from '@/domain/entities/prestamos';
import { Plus, RotateCcw } from 'lucide-react';

export default function PrestamosProveedoresIndex() {
    const [prestamos, setPrestamos] = useState<PrestamoProveedor[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    const [selectedPrestamo, setSelectedPrestamo] = useState<PrestamoProveedor | null>(null);
    const [devolucionData, setDevolucionData] = useState<DatosDevolucionProveedor>({
        cantidad_devuelta: 0,
        fecha_devolucion: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchPrestamos();
    }, []);

    const fetchPrestamos = async () => {
        try {
            const response = await prestamoProveedorService.getAll({ per_page: 50 });
            setPrestamos((response as any).data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarDevolucion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPrestamo) return;

        try {
            await prestamoProveedorService.registrarDevolucion(
                selectedPrestamo.id,
                devolucionData
            );
            setShowDevolucionModal(false);
            setSelectedPrestamo(null);
            await fetchPrestamos();
        } catch (error) {
            console.error('Error al registrar devolución:', error);
        }
    };

    const getEstadoBadge = (estado: EstadoPrestamo) => {
        const styles: Record<EstadoPrestamo, string> = {
            ACTIVO: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            COMPLETAMENTE_DEVUELTO: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
            PARCIALMENTE_DEVUELTO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[estado]}`}>
                {estado.replace(/_/g, ' ')}
            </span>
        );
    };

    return (
        <AppLayout>
            <Head title="Préstamos a Proveedores" />
            <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏭 Préstamos a Proveedores</h1>
                    <a href="/prestamos/proveedores/crear">
                        <Button className="gap-2">
                            <Plus size={20} />
                            Nuevo Préstamo
                        </Button>
                    </a>
                </div>

                {/* Modal de Devolución */}
                {showDevolucionModal && selectedPrestamo && (
                    <Card className="p-6 mb-8 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                            Devolver al Proveedor - {selectedPrestamo.prestable?.nombre}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Proveedor: {selectedPrestamo.proveedor?.nombre} | Cantidad Prestada:{' '}
                            {selectedPrestamo.cantidad}
                        </p>
                        <form onSubmit={handleRegistrarDevolucion} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Cantidad Devuelta *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max={selectedPrestamo.cantidad}
                                        value={devolucionData.cantidad_devuelta}
                                        onChange={(e) =>
                                            setDevolucionData({
                                                ...devolucionData,
                                                cantidad_devuelta: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Fecha Devolución *
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={devolucionData.fecha_devolucion}
                                        onChange={(e) =>
                                            setDevolucionData({
                                                ...devolucionData,
                                                fecha_devolucion: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Observaciones
                                    </label>
                                    <textarea
                                        value={devolucionData.observaciones || ''}
                                        onChange={(e) =>
                                            setDevolucionData({
                                                ...devolucionData,
                                                observaciones: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 pt-4">
                                <Button type="submit">Registrar Devolución</Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setShowDevolucionModal(false);
                                        setSelectedPrestamo(null);
                                    }}
                                >
                                    Cancelar
                                </Button>
                            </div>
                        </form>
                    </Card>
                )}

                {/* Tabla de Préstamos */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-400">Cargando...</div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <TableRow className="border-gray-200 dark:border-gray-700">
                                        <TableHead className="text-gray-900 dark:text-gray-100">Proveedor</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Prestable</TableHead>
                                        <TableHead className="text-center text-gray-900 dark:text-gray-100">Cantidad</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Tipo</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">P. Unitario</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Fecha Préstamo</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Estado</TableHead>
                                        <TableHead className="text-right text-gray-900 dark:text-gray-100">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prestamos.map((p) => (
                                        <TableRow key={p.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                            <TableCell className="text-gray-900 dark:text-gray-100">{p.proveedor?.nombre}</TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100">{p.prestable?.nombre}</TableCell>
                                            <TableCell className="text-center text-gray-900 dark:text-gray-100">{p.cantidad}</TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100">{p.es_compra ? 'Compra' : 'Préstamo'}</TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100">{p.precio_unitario || 'N/A'}</TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100">
                                                {new Date(p.fecha_prestamo).toLocaleDateString('es-ES')}
                                            </TableCell>
                                            <TableCell>{getEstadoBadge(p.estado)}</TableCell>
                                            <TableCell className="text-right">
                                                {p.estado === 'ACTIVO' && (
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setSelectedPrestamo(p);
                                                            setShowDevolucionModal(true);
                                                        }}
                                                        className="gap-1"
                                                    >
                                                        <RotateCcw size={16} />
                                                        Devolver
                                                    </Button>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>
            </div>
        </AppLayout>
    );
}
