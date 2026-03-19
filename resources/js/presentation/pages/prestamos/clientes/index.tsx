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
import prestamoClienteService from '@/infrastructure/services/prestamo-cliente.service';
import type { PrestamoCliente, EstadoPrestamo, DatosDevolucionCliente } from '@/domain/entities/prestamos';
import { Plus, RotateCcw, Printer } from 'lucide-react';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

export default function PrestamosClientesIndex() {
    const [prestamos, setPrestamos] = useState<PrestamoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    const [selectedPrestamo, setSelectedPrestamo] = useState<PrestamoCliente | null>(null);
    const [showOutputModal, setShowOutputModal] = useState(false);
    const [selectedPrestamoForPrint, setSelectedPrestamoForPrint] = useState<PrestamoCliente | null>(null);
    const [devolucionData, setDevolucionData] = useState<DatosDevolucionCliente>({
        cantidad_devuelta: 0,
        cantidad_dañada_parcial: 0,
        cantidad_dañada_total: 0,
        fecha_devolucion: new Date().toISOString().split('T')[0],
    });

    useEffect(() => {
        fetchPrestamos();
    }, []);

    const fetchPrestamos = async () => {
        try {
            const response = await prestamoClienteService.getAll({ per_page: 50 });
            setPrestamos((response as any).data || []);
        } finally {
            setLoading(false);
        }
    };

    const handleRegistrarDevolucion = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPrestamo) return;

        try {
            await prestamoClienteService.registrarDevolucion(
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

    const calcularDiasVencidos = (fecha_esperada: string | undefined) => {
        if (!fecha_esperada) return null;
        const hoy = new Date();
        const fechaEsperada = new Date(fecha_esperada);
        const diasVencidos = Math.floor(
            (hoy.getTime() - fechaEsperada.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diasVencidos > 0 ? diasVencidos : null;
    };

    return (
        <AppLayout>
            <Head title="Préstamos a Clientes" />
            <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">👥 Préstamos a Clientes</h1>
                    <a href="/prestamos/clientes/crear">
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
                            Registrar Devolución - {selectedPrestamo.prestable?.nombre}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-300 mb-4">
                            Cliente: {selectedPrestamo.cliente?.razon_social} | Cantidad Prestada:{' '}
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
                                        Dañada Parcial
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={devolucionData.cantidad_dañada_parcial || 0}
                                        onChange={(e) =>
                                            setDevolucionData({
                                                ...devolucionData,
                                                cantidad_dañada_parcial: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Dañada Total
                                    </label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={devolucionData.cantidad_dañada_total || 0}
                                        onChange={(e) =>
                                            setDevolucionData({
                                                ...devolucionData,
                                                cantidad_dañada_total: Number(e.target.value),
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
                    ) : prestamos.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No existen préstamos registrados
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Crea tu primer préstamo haciendo clic en el botón "Nuevo Préstamo"
                                </p>
                                <a href="/prestamos/clientes/crear">
                                    <Button className="gap-2">
                                        <Plus size={20} />
                                        Crear Préstamo
                                    </Button>
                                </a>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <TableRow className="border-gray-200 dark:border-gray-700">
                                        <TableHead className="text-gray-900 dark:text-gray-100">Cliente</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Prestable</TableHead>
                                        <TableHead className="text-center text-gray-900 dark:text-gray-100">Cantidad</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Garantía</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Fecha Préstamo</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Plazo</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Vencido</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Estado</TableHead>
                                        <TableHead className="text-right text-gray-900 dark:text-gray-100">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prestamos.map((p) => {
                                        const diasVencidos = calcularDiasVencidos(p.fecha_esperada_devolucion);
                                        return (
                                            <TableRow key={p.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                <TableCell className="text-gray-900 dark:text-gray-100">{p.cliente?.razon_social}</TableCell>
                                                <TableCell className="text-gray-900 dark:text-gray-100">{p.prestable?.nombre}</TableCell>
                                                <TableCell className="text-center text-gray-900 dark:text-gray-100">{p.cantidad}</TableCell>
                                                <TableCell className="text-gray-900 dark:text-gray-100">{p.monto_garantia}</TableCell>
                                                <TableCell className="text-gray-900 dark:text-gray-100">
                                                    {new Date(p.fecha_prestamo).toLocaleDateString('es-ES')}
                                                </TableCell>
                                                <TableCell className="text-gray-900 dark:text-gray-100">
                                                    {p.fecha_esperada_devolucion
                                                        ? new Date(p.fecha_esperada_devolucion).toLocaleDateString(
                                                            'es-ES'
                                                        )
                                                        : 'S/P'}
                                                </TableCell>
                                                <TableCell className="text-gray-900 dark:text-gray-100">
                                                    {diasVencidos !== null ? (
                                                        <span className="text-red-600 dark:text-red-400 font-semibold">
                                                            {diasVencidos}d
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell>
                                                <TableCell>{getEstadoBadge(p.estado)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => {
                                                                setSelectedPrestamoForPrint(p);
                                                                setShowOutputModal(true);
                                                            }}
                                                            className="gap-1"
                                                        >
                                                            <Printer size={16} />
                                                            Imprimir
                                                        </Button>
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
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </div>
                    )}
                </Card>

                {selectedPrestamoForPrint && (
                    <OutputSelectionModal
                        isOpen={showOutputModal}
                        onClose={() => {
                            setShowOutputModal(false);
                            setSelectedPrestamoForPrint(null);
                        }}
                        documentoId={selectedPrestamoForPrint.id}
                        tipoDocumento="prestamo-cliente"
                        documentoInfo={{
                            numero: selectedPrestamoForPrint.cliente?.razon_social,
                            fecha: new Date(selectedPrestamoForPrint.fecha_prestamo).toISOString().split('T')[0],
                            monto: Number(selectedPrestamoForPrint.monto_garantia ?? 0),
                        }}
                    />
                )}
            </div>
        </AppLayout>
    );
}
