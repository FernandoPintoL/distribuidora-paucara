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
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/presentation/components/ui/dialog';
import prestamoClienteService from '@/infrastructure/services/prestamo-cliente.service';
import type { PrestamoCliente, EstadoPrestamo, DatosDevolucionCliente } from '@/domain/entities/prestamos';
import { Plus, RotateCcw, Printer, Eye, Edit, X } from 'lucide-react';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';

export default function PrestamosClientesIndex() {
    const [prestamos, setPrestamos] = useState<PrestamoCliente[]>([]);
    const [loading, setLoading] = useState(true);
    const [showDevolucionModal, setShowDevolucionModal] = useState(false);
    const [selectedPrestamo, setSelectedPrestamo] = useState<PrestamoCliente | null>(null);
    const [showOutputModal, setShowOutputModal] = useState(false);
    const [selectedPrestamoForPrint, setSelectedPrestamoForPrint] = useState<PrestamoCliente | null>(null);
    const [showDetallesModal, setShowDetallesModal] = useState(false);
    const [selectedPrestamoDetalles, setSelectedPrestamoDetalles] = useState<PrestamoCliente | null>(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [selectedPrestamoEdit, setSelectedPrestamoEdit] = useState<PrestamoCliente | null>(null);
    const [editData, setEditData] = useState({
        fecha_esperada_devolucion: '',
        monto_garantia: 0,
        observaciones: '',
    });
    const [showAnularModal, setShowAnularModal] = useState(false);
    const [selectedPrestamoAnular, setSelectedPrestamoAnular] = useState<PrestamoCliente | null>(null);
    const [anularData, setAnularData] = useState({
        razon_anulacion: '',
    });
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

    const handleEditarPrestamo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPrestamoEdit) return;

        try {
            // Realizar solicitud PATCH/PUT para actualizar el préstamo
            const response = await fetch(`/api/prestamos-cliente/${selectedPrestamoEdit.id}`, {
                method: 'PATCH',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(editData),
            });

            if (response.ok) {
                setShowEditModal(false);
                setSelectedPrestamoEdit(null);
                await fetchPrestamos();
            } else {
                console.error('Error al actualizar préstamo:', response.statusText);
            }
        } catch (error) {
            console.error('Error al editar préstamo:', error);
        }
    };

    const abrirModalEdicion = (prestamo: PrestamoCliente) => {
        setSelectedPrestamoEdit(prestamo);
        setEditData({
            fecha_esperada_devolucion: prestamo.fecha_esperada_devolucion || '',
            monto_garantia: Number(prestamo.monto_garantia) || 0,
            observaciones: prestamo.observaciones || '',
        });
        setShowEditModal(true);
    };

    const handleAnularPrestamo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedPrestamoAnular) return;

        try {
            const response = await fetch(`/api/prestamos-cliente/${selectedPrestamoAnular.id}/anular`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify(anularData),
            });

            if (response.ok) {
                setShowAnularModal(false);
                setSelectedPrestamoAnular(null);
                setAnularData({ razon_anulacion: '' });
                await fetchPrestamos();
            } else {
                console.error('Error al anular préstamo:', response.statusText);
            }
        } catch (error) {
            console.error('Error al anular préstamo:', error);
        }
    };

    const abrirModalAnular = (prestamo: PrestamoCliente) => {
        setSelectedPrestamoAnular(prestamo);
        setAnularData({ razon_anulacion: '' });
        setShowAnularModal(true);
    };

    const getEstadoBadge = (estado: EstadoPrestamo | string) => {
        const styles: Record<string, string> = {
            ACTIVO: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
            COMPLETAMENTE_DEVUELTO: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
            PARCIALMENTE_DEVUELTO: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
            CANCELADO: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
        };
        return (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${styles[estado as string] || styles.ACTIVO}`}>
                {(estado as string).replace(/_/g, ' ')}
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

                {/* Modal de Devolución Flotante */}
                {selectedPrestamo && (() => {
                    const cantidadTotal = selectedPrestamo.detalles?.reduce((sum: number, d: any) => sum + (d.cantidad_prestada || 0), 0) || 0;
                    const prestabesNombres = selectedPrestamo.detalles?.map((d: any) => d.prestable?.nombre).join(', ') || selectedPrestamo.prestable?.nombre || 'N/D';
                    return (
                    <Dialog open={showDevolucionModal} onOpenChange={setShowDevolucionModal}>
                        <DialogContent className="max-w-sm w-full">
                            <DialogHeader>
                                <DialogTitle>Registrar Devolución</DialogTitle>
                                <DialogDescription>
                                    {prestabesNombres} - {selectedPrestamo.cliente?.nombre || selectedPrestamo.cliente?.razon_social}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mb-4">
                                <p className="text-sm text-blue-900 dark:text-blue-200">
                                    <strong>Cantidad Prestada:</strong> {cantidadTotal}
                                </p>
                            </div>
                            <form onSubmit={handleRegistrarDevolucion} className="space-y-4">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Cantidad Devuelta *
                                    </label>
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        max={selectedPrestamo.detalles?.reduce((sum: number, d: any) => sum + (d.cantidad_prestada || 0), 0) || selectedPrestamo.cantidad || 0}
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
                                    <Button type="submit" className="flex-1">Registrar Devolución</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowDevolucionModal(false);
                                            setSelectedPrestamo(null);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                    );
                })()}

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
                                        <TableHead className="text-gray-900 dark:text-gray-100 w-16">Folio</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Cliente</TableHead>
                                        {/* <TableHead className="text-gray-900 dark:text-gray-100">Prestable</TableHead> */}
                                        {/* <TableHead className="text-center text-gray-900 dark:text-gray-100">Cantidad</TableHead> */}
                                        <TableHead className="text-gray-900 dark:text-gray-100">Garantía</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Fecha Préstamo</TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">Plazo</TableHead>
                                        {/* <TableHead className="text-gray-900 dark:text-gray-100">Vencido</TableHead> */}
                                        <TableHead className="text-gray-900 dark:text-gray-100">Estado</TableHead>
                                        <TableHead className="text-right text-gray-900 dark:text-gray-100">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prestamos.map((p) => {
                                        const diasVencidos = calcularDiasVencidos(p.fecha_esperada_devolucion);
                                        // Mostrar resumen de detalles para la nueva estructura
                                        const cantidadTotal = p.detalles?.reduce((sum: number, d: any) => sum + (d.cantidad_prestada || 0), 0) || 0;
                                        const prestabesNombres = p.detalles?.map((d: any) => d.prestable?.nombre).join(', ') || p.prestable?.nombre || 'N/D';

                                        return (
                                            <TableRow key={p.id} className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                                                <TableCell className="text-gray-900 dark:text-gray-100 font-semibold">#{p.id}</TableCell>
                                                <TableCell className="text-gray-900 dark:text-gray-100">{p.cliente?.nombre || p.cliente?.razon_social}</TableCell>
                                                {/* <TableCell className="text-gray-900 dark:text-gray-100 text-sm">{prestabesNombres}</TableCell> */}
                                                {/* <TableCell className="text-center text-gray-900 dark:text-gray-100">{cantidadTotal || p.cantidad || 0}</TableCell> */}
                                                <TableCell className="text-gray-900 dark:text-gray-100">Bs {p.monto_garantia}</TableCell>
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
                                                {/* <TableCell className="text-gray-900 dark:text-gray-100">
                                                    {diasVencidos !== null ? (
                                                        <span className="text-red-600 dark:text-red-400 font-semibold">
                                                            {diasVencidos}d
                                                        </span>
                                                    ) : (
                                                        '-'
                                                    )}
                                                </TableCell> */}
                                                <TableCell>{getEstadoBadge(p.estado)}</TableCell>
                                                <TableCell className="text-right">
                                                    <div className="flex justify-end gap-1">
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => abrirModalEdicion(p)}
                                                            title="Editar"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Edit size={16} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedPrestamoDetalles(p);
                                                                setShowDetallesModal(true);
                                                            }}
                                                            title="Ver detalles"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Eye size={16} />
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                setSelectedPrestamoForPrint(p);
                                                                setShowOutputModal(true);
                                                            }}
                                                            title="Imprimir"
                                                            className="h-8 w-8 p-0"
                                                        >
                                                            <Printer size={16} />
                                                        </Button>
                                                        {p.estado === 'ACTIVO' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => {
                                                                    setSelectedPrestamo(p);
                                                                    setShowDevolucionModal(true);
                                                                }}
                                                                title="Registrar devolución"
                                                                className="h-8 w-8 p-0"
                                                            >
                                                                <RotateCcw size={16} />
                                                            </Button>
                                                        )}
                                                        {p.estado !== 'CANCELADO' && (
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => abrirModalAnular(p)}
                                                                title="Anular préstamo"
                                                                className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                            >
                                                                <X size={16} />
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

                {/* Modal de Edición del Préstamo */}
                {selectedPrestamoEdit && (
                    <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                        <DialogContent className="max-w-sm w-full">
                            <DialogHeader>
                                <DialogTitle>Editar Préstamo #{selectedPrestamoEdit.id}</DialogTitle>
                                <DialogDescription>
                                    {selectedPrestamoEdit.cliente?.nombre || selectedPrestamoEdit.cliente?.razon_social}
                                </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleEditarPrestamo} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Fecha Esperada de Devolución
                                    </label>
                                    <input
                                        type="date"
                                        value={editData.fecha_esperada_devolucion}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                fecha_esperada_devolucion: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Monto Garantía
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={editData.monto_garantia}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                monto_garantia: Number(e.target.value),
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Observaciones
                                    </label>
                                    <textarea
                                        value={editData.observaciones}
                                        onChange={(e) =>
                                            setEditData({
                                                ...editData,
                                                observaciones: e.target.value,
                                            })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>
                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" className="flex-1">Guardar Cambios</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowEditModal(false);
                                            setSelectedPrestamoEdit(null);
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Modal de Detalles del Préstamo */}
                {selectedPrestamoDetalles && (
                    <Dialog open={showDetallesModal} onOpenChange={setShowDetallesModal}>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                                <DialogTitle>Detalles del Préstamo #{selectedPrestamoDetalles.id}</DialogTitle>
                                <DialogDescription>
                                    {selectedPrestamoDetalles.cliente?.nombre || selectedPrestamoDetalles.cliente?.razon_social}
                                </DialogDescription>
                            </DialogHeader>

                            <div className="space-y-6">
                                {/* Información General */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Cliente</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {selectedPrestamoDetalles.cliente?.nombre || selectedPrestamoDetalles.cliente?.razon_social}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Estado</p>
                                        <p className="font-semibold">{getEstadoBadge(selectedPrestamoDetalles.estado)}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Fecha Préstamo</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {new Date(selectedPrestamoDetalles.fecha_prestamo).toLocaleDateString('es-ES')}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Vencimiento</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {selectedPrestamoDetalles.fecha_esperada_devolucion
                                                ? new Date(selectedPrestamoDetalles.fecha_esperada_devolucion).toLocaleDateString('es-ES')
                                                : 'No especificado'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Garantía</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">Bs {selectedPrestamoDetalles.monto_garantia}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                                        <p className="font-semibold text-gray-900 dark:text-white">
                                            {selectedPrestamoDetalles.es_venta ? 'Venta' : 'Préstamo'}
                                        </p>
                                    </div>
                                </div>

                                {/* Detalles de Prestables */}
                                {selectedPrestamoDetalles.detalles && selectedPrestamoDetalles.detalles.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold text-lg text-gray-900 dark:text-white mb-3">Prestables</h3>
                                        <div className="space-y-2">
                                            {selectedPrestamoDetalles.detalles.map((detalle: any, idx: number) => (
                                                <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                                {detalle.prestable?.nombre || 'Prestable'}
                                                            </p>
                                                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                                Cantidad: <span className="font-semibold text-gray-900 dark:text-white">{detalle.cantidad_prestada}</span>
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                                                                detalle.estado === 'ACTIVO'
                                                                    ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300'
                                                                    : detalle.estado === 'COMPLETAMENTE_DEVUELTO'
                                                                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                                                                    : 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300'
                                                            }`}>
                                                                {detalle.estado.replace(/_/g, ' ')}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    {detalle.devoluciones && detalle.devoluciones.length > 0 && (
                                                        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                                                            {detalle.devoluciones.map((dev: any, devIdx: number) => (
                                                                <p key={devIdx}>
                                                                    Devolución {devIdx + 1}: {dev.cantidad_devuelta} unidades - {new Date(dev.fecha_devolucion).toLocaleDateString('es-ES')}
                                                                </p>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Observaciones */}
                                {selectedPrestamoDetalles.observaciones && (
                                    <div>
                                        <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Observaciones</h3>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                                            {selectedPrestamoDetalles.observaciones}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-2 justify-end mt-6">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowDetallesModal(false)}
                                >
                                    Cerrar
                                </Button>
                            </div>
                        </DialogContent>
                    </Dialog>
                )}

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
                            numero: selectedPrestamoForPrint.cliente?.nombre || selectedPrestamoForPrint.cliente?.razon_social,
                            fecha: new Date(selectedPrestamoForPrint.fecha_prestamo).toISOString().split('T')[0],
                            monto: Number(selectedPrestamoForPrint.monto_garantia ?? 0),
                        }}
                    />
                )}

                {/* Modal de Anulación del Préstamo */}
                {selectedPrestamoAnular && (
                    <Dialog open={showAnularModal} onOpenChange={setShowAnularModal}>
                        <DialogContent className="max-w-sm w-full">
                            <DialogHeader>
                                <DialogTitle className="text-red-600 dark:text-red-400">Anular Préstamo #{selectedPrestamoAnular.id}</DialogTitle>
                                <DialogDescription>
                                    {selectedPrestamoAnular.cliente?.nombre || selectedPrestamoAnular.cliente?.razon_social}
                                </DialogDescription>
                            </DialogHeader>
                            <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg mb-4 border border-red-200 dark:border-red-800">
                                <p className="text-sm text-red-900 dark:text-red-200">
                                    ⚠️ <strong>Advertencia:</strong> Al anular este préstamo, el stock se devolverá automáticamente al almacén.
                                </p>
                            </div>
                            <form onSubmit={handleAnularPrestamo} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Razón de Anulación (opcional)
                                    </label>
                                    <textarea
                                        value={anularData.razon_anulacion}
                                        onChange={(e) =>
                                            setAnularData({
                                                ...anularData,
                                                razon_anulacion: e.target.value,
                                            })
                                        }
                                        placeholder="Ej: Cliente cambió de proveedor, error administrativo, etc."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-red-500 focus:border-transparent"
                                        rows={3}
                                    />
                                </div>

                                <div className="flex gap-2 pt-4">
                                    <Button type="submit" className="flex-1 bg-red-600 hover:bg-red-700">Anular Préstamo</Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1"
                                        onClick={() => {
                                            setShowAnularModal(false);
                                            setSelectedPrestamoAnular(null);
                                            setAnularData({ razon_anulacion: '' });
                                        }}
                                    >
                                        Cancelar
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                )}
            </div>
        </AppLayout>
    );
}
