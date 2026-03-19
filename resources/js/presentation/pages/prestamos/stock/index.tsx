import React, { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Card } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/presentation/components/ui/dialog';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import { Input } from '@/presentation/components/ui/input';
import { Plus, Edit2, Trash2 } from 'lucide-react';

interface Prestable {
    id: number;
    nombre: string;
    codigo: string;
    tipo: string;
    capacidad?: number;
    producto?: {
        id: number;
        nombre: string;
        sku?: string;
    };
}

interface Almacen {
    id: number;
    nombre: string;
}

interface PrestableStockItem {
    id: number;
    almacen_id: number;
    almacen: Almacen;
    cantidad_disponible: number;
    cantidad_en_prestamo_cliente: number;
    cantidad_en_prestamo_proveedor: number;
    cantidad_vendida: number;
    total_unidades: number;
    total_en_prestamo_cliente: number;
    total_en_prestamo_proveedor: number;
    total_vendida: number;
    total_general: number;
}

interface StockDetail {
    prestable: Prestable;
    capacidad?: number;
    stocks: PrestableStockItem[];
}

export default function GestionStockPrestables() {
    const [prestables, setPrestables] = useState<Prestable[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedPrestable, setSelectedPrestable] = useState<Prestable | null>(null);
    const [stockDetail, setStockDetail] = useState<StockDetail | null>(null);
    const [showStockModal, setShowStockModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingStock, setEditingStock] = useState<PrestableStockItem | null>(null);
    const [almacenes, setAlmacenes] = useState<Almacen[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [newStock, setNewStock] = useState({
        almacen_id: '',
        cantidad_total: 0,
    });

    // Cargar prestables
    useEffect(() => {
        fetchPrestables();
        fetchAlmacenes();
    }, []);

    const fetchPrestables = async () => {
        try {
            const response = await fetch('/api/prestables?per_page=1000');
            const result = await response.json();
            if (result.success) {
                setPrestables(result.data.data);
            }
        } catch (error) {
            console.error('Error cargando prestables:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchAlmacenes = async () => {
        try {
            const response = await fetch('/api/almacenes');
            const result = await response.json();
            if (result.success) {
                setAlmacenes(result.data);
            }
        } catch (error) {
            console.error('Error cargando almacenes:', error);
        }
    };

    const handleViewStock = async (prestable: Prestable) => {
        setSelectedPrestable(prestable);
        try {
            const response = await fetch(`/api/prestables/${prestable.id}/stock/detalle`);
            const result = await response.json();
            if (result.success) {
                setStockDetail(result.data);
                setShowStockModal(true);
            }
        } catch (error) {
            console.error('Error cargando stock:', error);
        }
    };

    const handleEditStock = (stock: PrestableStockItem) => {
        setEditingStock(stock);
        setShowEditModal(true);
    };

    const handleSaveStock = async () => {
        if (!editingStock) return;

        try {
            const response = await fetch(`/api/prestables-stock/${editingStock.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    cantidad_disponible: editingStock.cantidad_disponible,
                    cantidad_en_prestamo_cliente: editingStock.cantidad_en_prestamo_cliente,
                    cantidad_en_prestamo_proveedor: editingStock.cantidad_en_prestamo_proveedor,
                    cantidad_vendida: editingStock.cantidad_vendida,
                }),
            });

            const result = await response.json();
            if (result.success) {
                setShowEditModal(false);
                if (selectedPrestable) {
                    handleViewStock(selectedPrestable);
                }
            }
        } catch (error) {
            console.error('Error guardando stock:', error);
        }
    };

    const handleDeleteStock = async (stock: PrestableStockItem) => {
        if (!confirm('¿Eliminar este registro de stock?')) return;

        try {
            const response = await fetch(`/api/prestables-stock/${stock.id}`, {
                method: 'DELETE',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
            });

            const result = await response.json();
            if (result.success) {
                if (selectedPrestable) {
                    handleViewStock(selectedPrestable);
                }
            }
        } catch (error) {
            console.error('Error eliminando stock:', error);
        }
    };

    const handleCreateStock = async () => {
        if (!selectedPrestable || !newStock.almacen_id) {
            alert('Por favor selecciona un almacén');
            return;
        }

        if (newStock.cantidad_total <= 0) {
            alert('La cantidad debe ser mayor a 0');
            return;
        }

        try {
            const response = await fetch(
                `/api/prestables/${selectedPrestable.id}/stock/agregar-almacen`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        almacen_id: parseInt(newStock.almacen_id),
                        cantidad_disponible: newStock.cantidad_total,
                    }),
                }
            );

            const result = await response.json();
            if (result.success) {
                setShowCreateModal(false);
                setNewStock({
                    almacen_id: '',
                    cantidad_total: 0,
                });
                if (selectedPrestable) {
                    handleViewStock(selectedPrestable);
                }
            }
        } catch (error) {
            console.error('Error creando stock:', error);
            alert('Error al crear el stock');
        }
    };

    const filteredPrestables = prestables.filter(p =>
        p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.codigo.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <AppLayout>
            <Head title="Gestión de Stock - Prestables" />
            <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
                <div className="space-y-6">
                    {/* Header */}
                    <div className="flex justify-between items-center">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                                📊 Gestión de Stock - Prestables
                            </h1>
                            <p className="text-gray-600 dark:text-gray-400 mt-1">
                                Administra el inventario de canastillas y embases por almacén
                            </p>
                        </div>
                    </div>

            {/* Search */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 p-4">
                <Input
                    placeholder="Buscar por nombre o código..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="dark:bg-gray-800 dark:border-gray-700"
                />
            </Card>

            {/* Tabla de Prestables */}
            <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                {loading ? (
                    <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                        Cargando...
                    </div>
                ) : filteredPrestables.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="text-5xl mb-4">📦</div>
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                            No hay prestables disponibles
                        </h3>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                    <TableHead className="text-gray-900 dark:text-gray-100">ID</TableHead>
                                    <TableHead className="text-gray-900 dark:text-gray-100">Nombre</TableHead>
                                    <TableHead className="text-gray-900 dark:text-gray-100">Código</TableHead>
                                    <TableHead className="text-gray-900 dark:text-gray-100">Tipo</TableHead>
                                    <TableHead className="text-gray-900 dark:text-gray-100">Capacidad</TableHead>
                                    <TableHead className="text-gray-900 dark:text-gray-100">Producto</TableHead>
                                    <TableHead className="text-right text-gray-900 dark:text-gray-100">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredPrestables.map((prestable) => (
                                    <TableRow
                                        key={prestable.id}
                                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                                    >
                                        <TableCell className="font-mono text-sm text-gray-600 dark:text-gray-400">
                                            #{prestable.id}
                                        </TableCell>
                                        <TableCell className="font-semibold text-gray-900 dark:text-white">
                                            {prestable.nombre}
                                        </TableCell>
                                        <TableCell className="font-mono text-gray-600 dark:text-gray-400">
                                            {prestable.codigo}
                                        </TableCell>
                                        <TableCell>
                                            <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {prestable.tipo}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-900 dark:text-white">
                                            {prestable.capacidad ? `${prestable.capacidad} unidades` : '-'}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-400">
                                            {prestable.producto ? (
                                                <div className="text-sm">
                                                    <p className="font-medium">{prestable.producto.nombre}</p>
                                                    {prestable.producto.sku && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-500">
                                                            {prestable.producto.sku}
                                                        </p>
                                                    )}
                                                </div>
                                            ) : (
                                                '-'
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                onClick={() => handleViewStock(prestable)}
                                                variant="outline"
                                                size="sm"
                                                className="gap-2"
                                            >
                                                <Edit2 size={16} />
                                                Ver Stock
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </Card>

            {/* Modal: Ver/Editar Stock */}
            <Dialog open={showStockModal} onOpenChange={setShowStockModal}>
                <DialogContent
                    style={{ width: '90vw', maxWidth: '90vw' }}
                    className="max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800 p-0"
                >
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="text-xl dark:text-white">
                            📊 Stock: {selectedPrestable?.nombre}
                        </DialogTitle>
                    </DialogHeader>

                    {stockDetail && (
                        <div className="space-y-6 px-6 pb-6">
                            {/* Información del Prestable */}
                            <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                    📋 Información
                                </h3>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
                                        <p className="font-mono font-semibold text-gray-900 dark:text-white">
                                            {selectedPrestable?.codigo}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                                        <span className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                            {selectedPrestable?.tipo}
                                        </span>
                                    </div>
                                    {selectedPrestable?.capacidad && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Capacidad</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedPrestable.capacidad} unidades
                                            </p>
                                        </div>
                                    )}
                                    {selectedPrestable?.producto && (
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Producto</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {selectedPrestable.producto.nombre}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Stock por Almacén */}
                            <div>
                                <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                    🏭 Stock por Almacén
                                </h3>
                                <div className="space-y-4">
                                    {stockDetail.stocks.length === 0 ? (
                                        <p className="text-gray-600 dark:text-gray-400">No hay registros de stock</p>
                                    ) : (
                                        stockDetail.stocks.map((stock) => (
                                            <div
                                                key={stock.id}
                                                className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-800"
                                            >
                                                {/* Almacén */}
                                                <div className="flex justify-between items-start mb-3">
                                                    <div>
                                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                                            Almacén
                                                        </p>
                                                        <p className="font-semibold text-lg text-gray-900 dark:text-white">
                                                            {stock.almacen.nombre}
                                                        </p>
                                                    </div>
                                                    <Button
                                                        onClick={() => handleEditStock(stock)}
                                                        variant="outline"
                                                        size="sm"
                                                        className="gap-2"
                                                    >
                                                        <Edit2 size={16} />
                                                        Editar
                                                    </Button>
                                                </div>

                                                {/* Resumen de Cantidades */}
                                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                                                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                                                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                                                            🟢 Disponible
                                                        </p>
                                                        <p className="font-bold text-green-700 dark:text-green-400 text-lg">
                                                            {stock.cantidad_disponible}
                                                        </p>
                                                        {selectedPrestable?.capacidad && (
                                                            <p className="text-xs text-green-600 dark:text-green-500 mt-1">
                                                                = {stock.total_unidades?.toLocaleString('es-BO')} embases
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                                                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                                                            🔵 En Préstamo (Cliente)
                                                        </p>
                                                        <p className="font-bold text-blue-700 dark:text-blue-400 text-lg">
                                                            {stock.cantidad_en_prestamo_cliente}
                                                        </p>
                                                        {selectedPrestable?.capacidad && (
                                                            <p className="text-xs text-blue-600 dark:text-blue-500 mt-1">
                                                                = {stock.total_en_prestamo_cliente?.toLocaleString('es-BO')} embases
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                                                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                                                            🟠 En Préstamo (Proveedor)
                                                        </p>
                                                        <p className="font-bold text-orange-700 dark:text-orange-400 text-lg">
                                                            {stock.cantidad_en_prestamo_proveedor}
                                                        </p>
                                                        {selectedPrestable?.capacidad && (
                                                            <p className="text-xs text-orange-600 dark:text-orange-500 mt-1">
                                                                = {stock.total_en_prestamo_proveedor?.toLocaleString('es-BO')} embases
                                                            </p>
                                                        )}
                                                    </div>

                                                    <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
                                                        <p className="text-gray-600 dark:text-gray-400 text-xs mb-1">
                                                            🔴 Vendida
                                                        </p>
                                                        <p className="font-bold text-red-700 dark:text-red-400 text-lg">
                                                            {stock.cantidad_vendida}
                                                        </p>
                                                        {selectedPrestable?.capacidad && (
                                                            <p className="text-xs text-red-600 dark:text-red-500 mt-1">
                                                                = {stock.total_vendida?.toLocaleString('es-BO')} embases
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Total General */}
                                                <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                                                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-4 rounded-lg">
                                                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                                            📊 Total General
                                                        </p>
                                                        <div className="flex justify-between items-center">
                                                            <p className="font-bold text-2xl text-purple-700 dark:text-purple-300">
                                                                {stock.cantidad_disponible + stock.cantidad_en_prestamo_cliente + stock.cantidad_en_prestamo_proveedor + stock.cantidad_vendida}
                                                                <span className="text-xs ml-2">canastillas</span>
                                                            </p>
                                                            {selectedPrestable?.capacidad && (
                                                                <p className="font-bold text-2xl text-pink-700 dark:text-pink-300">
                                                                    {stock.total_general?.toLocaleString('es-BO')}
                                                                    <span className="text-xs ml-2">embases</span>
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Botón Eliminar */}
                                                <div className="mt-3">
                                                    <Button
                                                        onClick={() => handleDeleteStock(stock)}
                                                        variant="destructive"
                                                        size="sm"
                                                        className="gap-2 w-full"
                                                    >
                                                        <Trash2 size={16} />
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowStockModal(false)}
                        >
                            Cerrar
                        </Button>
                        <Button
                            onClick={() => setShowCreateModal(true)}
                            className="gap-2 bg-green-600 hover:bg-green-700"
                        >
                            <Plus size={18} />
                            Agregar Stock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Editar Stock */}
            <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
                <DialogContent
                    style={{ width: '90vw', maxWidth: '90vw' }}
                    className="max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800 p-0"
                >
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="dark:text-white">
                            ✏️ Editar Stock - {selectedPrestable?.nombre}
                        </DialogTitle>
                    </DialogHeader>

                    {editingStock && (
                        <div className="space-y-4 px-6 pb-6">
                            {/* Info Box */}
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-lg">
                                <p className="text-sm text-amber-700 dark:text-amber-300">
                                    <strong>⚠️ Nota:</strong> Edita solo si necesitas corregir discrepancias. Los cambios por préstamos/devoluciones/ventas deben registrarse en sus respectivas operaciones.
                                </p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Almacén
                                </label>
                                <p className="text-gray-900 dark:text-white font-semibold">
                                    {editingStock.almacen.nombre}
                                </p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    🟢 Cantidad Disponible
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingStock.cantidad_disponible}
                                    onChange={(e) =>
                                        setEditingStock({
                                            ...editingStock,
                                            cantidad_disponible: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="dark:bg-gray-800 dark:border-gray-700"
                                />
                                {selectedPrestable?.capacidad && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        = {editingStock.cantidad_disponible * selectedPrestable.capacidad} unidades
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    🔵 Cantidad en Préstamo (Cliente)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingStock.cantidad_en_prestamo_cliente}
                                    onChange={(e) =>
                                        setEditingStock({
                                            ...editingStock,
                                            cantidad_en_prestamo_cliente: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="dark:bg-gray-800 dark:border-gray-700"
                                />
                                {selectedPrestable?.capacidad && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        = {editingStock.cantidad_en_prestamo_cliente * selectedPrestable.capacidad} unidades
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    🟠 Cantidad en Préstamo (Proveedor)
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingStock.cantidad_en_prestamo_proveedor}
                                    onChange={(e) =>
                                        setEditingStock({
                                            ...editingStock,
                                            cantidad_en_prestamo_proveedor: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="dark:bg-gray-800 dark:border-gray-700"
                                />
                                {selectedPrestable?.capacidad && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        = {editingStock.cantidad_en_prestamo_proveedor * selectedPrestable.capacidad} unidades
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    🔴 Cantidad Vendida
                                </label>
                                <Input
                                    type="number"
                                    min="0"
                                    value={editingStock.cantidad_vendida}
                                    onChange={(e) =>
                                        setEditingStock({
                                            ...editingStock,
                                            cantidad_vendida: parseInt(e.target.value) || 0,
                                        })
                                    }
                                    className="dark:bg-gray-800 dark:border-gray-700"
                                />
                                {selectedPrestable?.capacidad && (
                                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                        = {editingStock.cantidad_vendida * selectedPrestable.capacidad} unidades
                                    </p>
                                )}
                            </div>
                        </div>
                    )}

                    <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowEditModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveStock} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            💾 Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal: Crear Stock */}
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
                <DialogContent
                    style={{ width: '90vw', maxWidth: '90vw' }}
                    className="max-h-[90vh] overflow-y-auto dark:bg-gray-900 dark:border-gray-800 p-0"
                >
                    <DialogHeader className="px-6 pt-6">
                        <DialogTitle className="dark:text-white">
                            ➕ Agregar Stock - {selectedPrestable?.nombre}
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 px-6 pb-6">
                        {/* Info Box */}
                        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
                            <p className="text-sm text-blue-700 dark:text-blue-300">
                                <strong>ℹ️ Nota:</strong> Solo ingresa la cantidad total. Los movimientos de préstamos, devoluciones y ventas se registrarán automáticamente.
                            </p>
                        </div>

                        {/* Almacén */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                🏭 Almacén
                            </label>
                            <select
                                value={newStock.almacen_id}
                                onChange={(e) =>
                                    setNewStock({
                                        ...newStock,
                                        almacen_id: e.target.value,
                                    })
                                }
                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">-- Selecciona almacén --</option>
                                {almacenes.map((almacen) => (
                                    <option key={almacen.id} value={almacen.id}>
                                        {almacen.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cantidad Total */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                📦 Cantidad Total a Registrar
                            </label>
                            <Input
                                type="number"
                                min="1"
                                value={newStock.cantidad_total}
                                onChange={(e) =>
                                    setNewStock({
                                        ...newStock,
                                        cantidad_total: parseInt(e.target.value) || 0,
                                    })
                                }
                                placeholder="Ej: 50"
                                className="dark:bg-gray-800 dark:border-gray-700 text-lg font-semibold"
                            />
                            {selectedPrestable?.capacidad && newStock.cantidad_total > 0 && (
                                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 font-semibold">
                                    = {newStock.cantidad_total * selectedPrestable.capacidad} unidades
                                </p>
                            )}
                        </div>

                        {/* Explicación */}
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg space-y-2">
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">
                                📊 Disponibilidad Automática:
                            </p>
                            <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                                <li>✅ <strong>Disponible:</strong> Todo lo que ingreses aquí</li>
                                <li>📍 <strong>En Préstamo (Cliente):</strong> Se actualiza con préstamos</li>
                                <li>📍 <strong>En Préstamo (Proveedor):</strong> Se actualiza con préstamos</li>
                                <li>🛒 <strong>Vendida:</strong> Se actualiza con ventas registradas</li>
                            </ul>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleCreateStock} className="gap-2 bg-green-600 hover:bg-green-700">
                            ➕ Crear Stock
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
                </div>
            </div>
        </AppLayout>
    );
}
