import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import SearchSelect from '@/presentation/components/ui/search-select';
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
    DialogFooter,
    DialogClose,
} from '@/presentation/components/ui/dialog';
import { useToastNotifications } from '@/application/hooks/use-toast-notifications';
import prestableService from '@/infrastructure/services/prestable.service';
import type { Prestable, NuevoPrestable, TipoPrestable } from '@/domain/entities/prestamos';
import { Plus, Edit2, Trash2, Eye } from 'lucide-react';

export default function PrestablesIndex() {
    console.log('🔧 COMPONENT MOUNTED: PrestablesIndex');
    const { showNotification } = useToastNotifications();
    const [prestables, setPrestables] = useState<Prestable[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [prestableToDelete, setPrestableToDelete] = useState<Prestable | null>(null);
    const [prestableToView, setPrestableToView] = useState<Prestable | null>(null);

    useEffect(() => {
        console.log('👁️ showForm cambió a:', showForm);
        if (showForm) {
            console.log('✅ MODAL DEBERÍA ESTAR VISIBLE AHORA');
        } else {
            console.log('❌ MODAL DEBERÍA ESTAR OCULTO');
        }
    }, [showForm]);
    const [productos, setProductos] = useState<Array<{ id: number; nombre: string; sku?: string }>>([]);
    const [canastillas, setCanastillas] = useState<Array<{ id: number; nombre: string; codigo: string }>>([]);
    const [formData, setFormData] = useState<Partial<NuevoPrestable & { activo?: boolean; prestable_relacionado_id?: number }>>({
        nombre: '',
        codigo: '',
        tipo: 'CANASTILLA' as TipoPrestable,
        capacidad: undefined,
        producto_id: undefined,
        prestable_relacionado_id: undefined,
        activo: true,
        precios: [
            { tipo_precio: 'PRESTAMO', valor: 0 },
            { tipo_precio: 'VENTA', valor: 0 },
        ],
        condiciones: {
            monto_garantia: 0,
            monto_daño_parcial: 0,
            monto_daño_total: 0,
        },
    });

    useEffect(() => {
        fetchPrestables();
        fetchProductos();
        fetchCanastillas();
    }, []);

    const fetchProductos = async () => {
        try {
            const response = await fetch('/api/productos?per_page=1000');
            const data = await response.json();
            setProductos(data.data?.data || data.data || []);
        } catch (error) {
            console.error('Error cargando productos:', error);
        }
    };

    const fetchCanastillas = async () => {
        try {
            const response = await fetch('/api/prestables?tipo=CANASTILLA&per_page=1000');
            const data = await response.json();
            if (data.success) {
                setCanastillas(data.data.data || []);
            }
        } catch (error) {
            console.error('Error cargando canastillas:', error);
        }
    };

    const fetchPrestables = async () => {
        try {
            console.log('⏳ Fetching prestables...');
            const data = await prestableService.getAll();
            console.log('✅ Prestables cargados:', data);
            setPrestables(data);
        } catch (error) {
            console.error('❌ Error en fetch:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('🚀 INICIANDO CREATE/UPDATE...');
        console.log('📋 FormData completo:', formData);
        console.log('📋 FormData precios:', formData.precios);
        console.log('📋 FormData condiciones:', formData.condiciones);
        try {
            if ((formData as any).id) {
                console.log('♻️ ACTUALIZANDO prestable...');
                await prestableService.update((formData as any).id, formData);
                showNotification({
                    title: '✅ Éxito',
                    description: 'Prestable actualizado correctamente',
                    type: 'success',
                });
            } else {
                console.log('✨ CREANDO prestable nuevo...');
                await prestableService.create(formData as NuevoPrestable);
                showNotification({
                    title: '✅ Éxito',
                    description: 'Prestable creado correctamente',
                    type: 'success',
                });
            }
            setShowForm(false);
            setFormData({
                nombre: '',
                codigo: '',
                tipo: 'CANASTILLA',
                producto_id: undefined,
                prestable_relacionado_id: undefined,
                activo: true,
                precios: [
                    { tipo_precio: 'PRESTAMO', valor: 0 },
                    { tipo_precio: 'VENTA', valor: 0 },
                ],
                condiciones: {
                    monto_garantia: 0,
                    monto_daño_parcial: 0,
                    monto_daño_total: 0,
                },
            });
            await fetchPrestables();
        } catch (error: any) {
            console.error('❌ ERROR COMPLETO:', error);
            console.error('❌ ERROR response:', error?.response);
            console.error('❌ ERROR data:', error?.response?.data);
            console.error('❌ ERROR message:', error?.message);
            const errorMessage = error?.response?.data?.message || error?.message || 'Error al guardar el prestable';
            showNotification({
                title: '❌ Error',
                description: errorMessage,
                type: 'error',
            });
            console.error('Error al guardar:', error);
        }
    };

    const handleEdit = async (prestable: Prestable) => {
        console.log('✏️ EDITANDO PRESTABLE:', prestable);
        console.log('📦 Precios originales:', prestable.precios);
        console.log('📦 Cantidad de precios:', prestable.precios?.length);

        const preciosMapeados =
            prestable.precios && prestable.precios.length > 0
                ? prestable.precios.map((p) => ({
                      id: p.id,
                      tipo_precio: p.tipo_precio,
                      valor: Number(p.valor),
                  }))
                : [
                      { tipo_precio: 'PRESTAMO', valor: 0 },
                      { tipo_precio: 'VENTA', valor: 0 },
                  ];

        console.log('✅ Precios mapeados:', preciosMapeados);

        const condicionesData =
            prestable.condiciones && prestable.condiciones.length > 0
                ? {
                      id: prestable.condiciones[0].id,
                      monto_garantia: Number(prestable.condiciones[0].monto_garantia || 0),
                      monto_daño_parcial: Number(prestable.condiciones[0].monto_daño_parcial || 0),
                      monto_daño_total: Number(prestable.condiciones[0].monto_daño_total || 0),
                  }
                : {
                      monto_garantia: 0,
                      monto_daño_parcial: 0,
                      monto_daño_total: 0,
                  };

        const nuevoFormData = {
            id: prestable.id,
            nombre: prestable.nombre,
            codigo: prestable.codigo,
            tipo: prestable.tipo as TipoPrestable,
            capacidad: prestable.capacidad,
            producto_id: prestable.producto_id,
            prestable_relacionado_id: (prestable as any).prestable_relacionado_id,
            activo: prestable.activo,
            descripcion: prestable.descripcion,
            precios: preciosMapeados,
            condiciones: condicionesData,
        };

        console.log('🔄 Nuevo FormData:', nuevoFormData);
        setFormData(nuevoFormData);
        setShowForm(true);
    };

    const handleView = (prestable: Prestable) => {
        console.log('👁️ VER DETALLES:', prestable);
        setPrestableToView(prestable);
        setShowViewModal(true);
    };

    const handleDeleteClick = (prestable: Prestable) => {
        console.log('🗑️ ABRIR DIÁLOGO ELIMINAR:', prestable.nombre);
        setPrestableToDelete(prestable);
        setShowDeleteDialog(true);
    };

    const handleConfirmDelete = async () => {
        if (!prestableToDelete?.id) return;

        try {
            console.log('⚠️ ELIMINANDO PRESTABLE:', prestableToDelete.id);
            await prestableService.remove(prestableToDelete.id);

            showNotification({
                title: '✅ Eliminado',
                description: `${prestableToDelete.nombre} fue eliminado correctamente`,
                type: 'success',
            });

            setShowDeleteDialog(false);
            setPrestableToDelete(null);
            await fetchPrestables();
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || 'Error al eliminar el prestable';
            showNotification({
                title: '❌ Error',
                description: errorMessage,
                type: 'error',
            });
            console.error('Error al eliminar:', error);
        }
    };

    return (
        <AppLayout>
            <Head title="Gestión de Prestables" />
            <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                        📦 Gestión de Prestables
                    </h1>
                    <Button
                        onClick={() => {
                            console.log('🔵 BOTÓN CLICKEADO: Nuevo Prestable');
                            setShowForm(true);
                            console.log('🔵 setShowForm(true) llamado');
                        }}
                        className="gap-2"
                    >
                        <Plus size={20} />
                        Nuevo Prestable
                    </Button>
                </div>

                {/* Formulario Modal */}
                <Dialog
                    open={showForm}
                    onOpenChange={(open) => {
                        setShowForm(open);
                        if (!open) {
                            // Limpiar formulario cuando se cierra
                            setFormData({
                                nombre: '',
                                codigo: '',
                                tipo: 'CANASTILLA',
                                capacidad: undefined,
                                producto_id: undefined,
                                prestable_relacionado_id: undefined,
                                activo: true,
                                precios: [
                                    { tipo_precio: 'PRESTAMO', valor: 0 },
                                    { tipo_precio: 'VENTA', valor: 0 },
                                ],
                                condiciones: {
                                    monto_garantia: 0,
                                    monto_daño_parcial: 0,
                                    monto_daño_total: 0,
                                },
                            });
                        }
                    }}
                >
                    <DialogContent
                        style={{ width: '90vw', maxWidth: '90vw' }}
                        className="max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 p-0"
                    >
                        <DialogHeader className="px-6 pt-6">
                            <DialogTitle className="text-xl font-semibold text-gray-900 dark:text-white">
                                {(formData as any).id ? 'Editar' : 'Crear'} Canastillas/Embases
                            </DialogTitle>
                        </DialogHeader>

                        <form onSubmit={handleCreateOrUpdate} className="space-y-4 px-6 pb-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Código *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.codigo || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, codigo: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                        Nombre *
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nombre || ''}
                                        onChange={(e) =>
                                            setFormData({ ...formData, nombre: e.target.value })
                                        }
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium mb-3 text-gray-700 dark:text-gray-300">
                                        Tipo de Prestable *
                                    </label>
                                    <div className="flex gap-6">
                                        {(['CANASTILLA', 'EMBASES'] as const).map((tipo) => (
                                            <div key={tipo} className="flex items-center">
                                                <input
                                                    type="radio"
                                                    id={`tipo-${tipo}`}
                                                    name="tipo"
                                                    value={tipo}
                                                    checked={formData.tipo === tipo}
                                                    onChange={(e) =>
                                                        setFormData({
                                                            ...formData,
                                                            tipo: e.target.value as TipoPrestable,
                                                        })
                                                    }
                                                    className="w-4 h-4 cursor-pointer"
                                                />
                                                <label
                                                    htmlFor={`tipo-${tipo}`}
                                                    className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none"
                                                >
                                                    {tipo === 'CANASTILLA' ? '📦 Canastilla' : '🔖 Embases'}
                                                </label>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {formData.tipo === 'CANASTILLA' && (
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                            📦 Capacidad (embases por canastilla)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.capacidad || ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    capacidad: e.target.value ? Number(e.target.value) : undefined,
                                                })
                                            }
                                            placeholder="Ej: 24"
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                )}
                                <SearchSelect
                                    label="📦 Producto Relacionado (Opcional)"
                                    placeholder="Buscar producto..."
                                    value={(formData as any).producto_id || ''}
                                    options={productos.map((p) => ({
                                        value: p.id,
                                        label: p.nombre,
                                        description: p.sku,
                                    }))}
                                    onChange={(id) =>
                                        setFormData({
                                            ...formData,
                                            producto_id: id ? Number(id) : undefined,
                                        })
                                    }
                                    allowClear
                                />
                                {formData.tipo === 'EMBASES' && (
                                    <SearchSelect
                                        label="🔗 Relacionar con Canastilla (Opcional)"
                                        placeholder="Buscar canastilla..."
                                        value={(formData as any).prestable_relacionado_id || ''}
                                        options={canastillas.map((c) => ({
                                            value: c.id,
                                            label: c.nombre,
                                            description: c.codigo,
                                        }))}
                                        onChange={(id) =>
                                            setFormData({
                                                ...formData,
                                                prestable_relacionado_id: id ? Number(id) : undefined,
                                            })
                                        }
                                        allowClear
                                    />
                                )}
                            </div>

                            {/* Estado Activo - Solo al editar */}
                            {(formData as any).id && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                                    <input
                                        type="checkbox"
                                        id="activo"
                                        checked={(formData as any).activo ?? true}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                activo: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 cursor-pointer"
                                    />
                                    <label htmlFor="activo" className="text-sm font-medium text-green-700 dark:text-green-300 cursor-pointer">
                                        ✅ Activo
                                    </label>
                                </div>
                            )}

                            {/* Precios */}
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                                    💰 Precios
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {formData.precios?.map((precio, idx) => (
                                        <div key={idx} className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                                {precio.tipo_precio === 'PRESTAMO' ? '💰 Precio Préstamo' : '🛒 Precio Venta'}
                                            </label>
                                            <input
                                                type="number"
                                                placeholder="Ingrese el precio"
                                                value={precio.valor ?? ''}
                                                onChange={(e) => {
                                                    const newPrecios = [...(formData.precios || [])];
                                                    newPrecios[idx].valor = e.target.value ? Number(e.target.value) : 0;
                                                    setFormData({ ...formData, precios: newPrecios });
                                                }}
                                                step="0.01"
                                                min="0"
                                                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Condiciones */}
                            <div className="border-t border-gray-300 dark:border-gray-600 pt-4">
                                <h3 className="font-semibold mb-3 text-gray-900 dark:text-white">
                                    Condiciones Individuales
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                            Garantía
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.condiciones?.monto_garantia ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    condiciones: {
                                                        ...formData.condiciones,
                                                        monto_garantia: e.target.value ? Number(e.target.value) : 0,
                                                    },
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                            Daño Parcial
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.condiciones?.monto_daño_parcial ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    condiciones: {
                                                        ...formData.condiciones,
                                                        monto_daño_parcial: e.target.value ? Number(e.target.value) : 0,
                                                    },
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                            Daño Total
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.condiciones?.monto_daño_total ?? ''}
                                            onChange={(e) =>
                                                setFormData({
                                                    ...formData,
                                                    condiciones: {
                                                        ...formData.condiciones,
                                                        monto_daño_total: e.target.value ? Number(e.target.value) : 0,
                                                    },
                                                })
                                            }
                                            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    </div>
                                </div>
                            </div>

                        <DialogFooter className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button type="submit">Guardar</Button>
                        </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>

                {/* Diálogo de Confirmación de Eliminación */}
                <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                    <DialogContent className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/30">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-semibold text-red-600 dark:text-red-400">
                                🗑️ Eliminar Prestable
                            </DialogTitle>
                        </DialogHeader>

                        <div className="py-4">
                            <p className="text-gray-700 dark:text-gray-300 mb-2">
                                ¿Estás seguro de que deseas eliminar?
                            </p>
                            <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-lg mt-4">
                                <p className="font-semibold text-gray-900 dark:text-white">
                                    {prestableToDelete?.nombre}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                    Código: {prestableToDelete?.codigo}
                                </p>
                            </div>
                            <p className="text-sm text-red-600 dark:text-red-400 mt-4">
                                ⚠️ Esta acción no se puede deshacer.
                            </p>
                        </div>

                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={handleConfirmDelete}
                                className="bg-red-600 hover:bg-red-700 text-white"
                            >
                                Eliminar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Modal de Vista de Detalles */}
                <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
                    <DialogContent className="max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-semibold text-gray-900 dark:text-white">
                                👁️ Detalles del Prestable
                            </DialogTitle>
                        </DialogHeader>

                        {prestableToView && (
                            <div className="space-y-6 pr-4">
                                {/* Información Básica */}
                                <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                        📋 Información Básica
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">ID</p>
                                            <p className="font-semibold text-gray-900 dark:text-white font-mono">
                                                #{prestableToView.id}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Nombre</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {prestableToView.nombre}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Código</p>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {prestableToView.codigo}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">Tipo</p>
                                            <span className="inline-flex px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                {prestableToView.tipo}
                                            </span>
                                        </div>
                                        {prestableToView.capacidad && (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Capacidad</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {prestableToView.capacidad} unidades
                                                </p>
                                            </div>
                                        )}
                                        {prestableToView.descripcion && (
                                            <div>
                                                <p className="text-sm text-gray-600 dark:text-gray-400">Descripción</p>
                                                <p className="text-gray-900 dark:text-white">
                                                    {prestableToView.descripcion}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Producto Vinculado */}
                                {prestableToView.producto && (
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                            📦 Producto Vinculado
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Nombre</p>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    {prestableToView.producto.nombre}
                                                </p>
                                            </div>
                                            {prestableToView.producto.sku && (
                                                <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">SKU</p>
                                                    <p className="font-mono text-gray-900 dark:text-white">
                                                        {prestableToView.producto.sku}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Canastilla Relacionada (si es EMBASES) */}
                                {(prestableToView as any).prestable_padre && (
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                            🔗 Canastilla Relacionada
                                        </h3>
                                        <div className="space-y-3">
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Nombre</p>
                                                <p className="font-semibold text-blue-900 dark:text-blue-100">
                                                    {(prestableToView as any).prestable_padre.nombre}
                                                </p>
                                            </div>
                                            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm text-blue-600 dark:text-blue-400 mb-1">Código</p>
                                                <p className="font-mono text-blue-900 dark:text-blue-100">
                                                    {(prestableToView as any).prestable_padre.codigo}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Precios */}
                                {prestableToView.precios && prestableToView.precios.length > 0 && (
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                            💰 Precios
                                        </h3>
                                        <div className="space-y-2">
                                            {prestableToView.precios.map((precio) => (
                                                <div
                                                    key={precio.id}
                                                    className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                                                >
                                                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                                                        {precio.tipo_precio === 'PRESTAMO' ? '💰 Precio Préstamo' : '🛒 Precio Venta'}
                                                    </span>
                                                    <span className="font-bold text-gray-900 dark:text-white">
                                                        Bs {Number(precio.valor).toFixed(2)}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Condiciones */}
                                {prestableToView.condiciones && prestableToView.condiciones.length > 0 && (
                                    <div className="border-b border-gray-200 dark:border-gray-700 pb-4">
                                        <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                            🔒 Condiciones
                                        </h3>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-gray-700 dark:text-gray-300">Garantía</span>
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    Bs {Number(prestableToView.condiciones[0].monto_garantia).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-gray-700 dark:text-gray-300">Daño Parcial</span>
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    Bs {Number(prestableToView.condiciones[0].monto_daño_parcial).toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                <span className="text-gray-700 dark:text-gray-300">Daño Total</span>
                                                <span className="font-bold text-gray-900 dark:text-white">
                                                    Bs {Number(prestableToView.condiciones[0].monto_daño_total).toFixed(2)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Estado */}
                                <div>
                                    <h3 className="font-semibold text-lg mb-3 text-gray-900 dark:text-white">
                                        ✨ Estado
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <span className="text-gray-700 dark:text-gray-300">Activo:</span>
                                        <span
                                            className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                                prestableToView.activo
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                            }`}
                                        >
                                            {prestableToView.activo ? '✅ Sí' : '❌ No'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="pt-4 border-t border-gray-200 dark:border-gray-700">
                            <DialogClose asChild>
                                <Button type="button" variant="outline">
                                    Cerrar
                                </Button>
                            </DialogClose>
                            <Button
                                onClick={() => {
                                    setShowViewModal(false);
                                    if (prestableToView) handleEdit(prestableToView);
                                }}
                                className="gap-2 bg-blue-600 hover:bg-blue-700"
                            >
                                <Edit2 size={18} />
                                Editar
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Tabla de Prestables */}
                <Card className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 overflow-hidden">
                    {loading ? (
                        <div className="p-8 text-center text-gray-600 dark:text-gray-400">
                            Cargando...
                        </div>
                    ) : prestables.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="flex flex-col items-center justify-center">
                                <div className="text-5xl mb-4">📦</div>
                                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                                    No existen productos prestables
                                </h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-6">
                                    Crea tu primer prestable haciendo clic en el botón "Nuevo Prestable"
                                </p>
                                <Button onClick={() => setShowForm(true)} className="gap-2">
                                    <Plus size={20} />
                                    Crear Prestable
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                                        <TableHead className="text-gray-900 dark:text-gray-100 font-mono text-sm">
                                            ID
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Nombre
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Código
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Tipo
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Precio Préstamo
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Precio Venta
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Garantía
                                        </TableHead>
                                        <TableHead className="text-gray-900 dark:text-gray-100">
                                            Estado
                                        </TableHead>
                                        <TableHead className="text-right text-gray-900 dark:text-gray-100">
                                            Acciones
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prestables.map((p) => (
                                        <TableRow
                                            key={p.id}
                                            className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                                        >
                                            <TableCell className="text-gray-600 dark:text-gray-400 font-mono text-sm">
                                                #{p.id}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100">
                                                {p.nombre}
                                            </TableCell>
                                            <TableCell className="text-gray-700 dark:text-gray-300">
                                                {p.codigo}
                                            </TableCell>
                                            <TableCell>
                                                <span className="inline-flex px-2 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                                                    {p.tipo}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                                                Bs {Number(p.precios?.find((pr) => pr.tipo_precio === 'PRESTAMO')?.valor || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100 font-medium">
                                                Bs {Number(p.precios?.find((pr) => pr.tipo_precio === 'VENTA')?.valor || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell className="text-gray-900 dark:text-gray-100">
                                                Bs {Number(p.condiciones?.[0]?.monto_garantia || 0).toFixed(2)}
                                            </TableCell>
                                            <TableCell>
                                                <span
                                                    className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${
                                                        p.activo
                                                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                                    }`}
                                                >
                                                    {p.activo ? '✅ Activo' : '❌ Inactivo'}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-right space-x-2">
                                                <button
                                                    onClick={() => handleView(p)}
                                                    className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded transition text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                >
                                                    <Eye size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleEdit(p)}
                                                    className="p-1 hover:bg-blue-200 dark:hover:bg-blue-900/30 rounded transition text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                                                >
                                                    <Edit2 size={18} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(p)}
                                                    className="p-1 hover:bg-red-200 dark:hover:bg-red-900/30 rounded transition text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
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
