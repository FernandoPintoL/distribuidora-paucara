import React, { useEffect, useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import prestamoProveedorService from '@/infrastructure/services/prestamo-proveedor.service';
import { usePrestables } from '@/stores/usePrestables';
import type { NuevoPrestamoProveedor } from '@/domain/entities/prestamos';

interface Props {
    proveedores: Array<{ id: number; nombre: string }>;
}

export default function CrearPrestamoProveedor({ proveedores }: Props) {
    const { prestables, fetchPrestables } = usePrestables();
    const [formData, setFormData] = useState<Partial<NuevoPrestamoProveedor>>({
        prestable_id: undefined,
        proveedor_id: undefined,
        cantidad: 0,
        es_compra: false,
        precio_unitario: undefined,
        fecha_prestamo: new Date().toISOString().split('T')[0],
        numero_documento: undefined,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPrestables();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            if (!formData.prestable_id || !formData.proveedor_id || !formData.cantidad) {
                throw new Error('Por favor completa los campos requeridos');
            }

            await prestamoProveedorService.crear(formData as NuevoPrestamoProveedor);
            window.location.href = '/prestamos/proveedores';
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <Head title="Crear Préstamo a Proveedor" />
            <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    🏭 Nuevo Préstamo a Proveedor
                </h1>

                <Card className="p-8 max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                    {error && (
                        <div className="p-4 mb-6 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-700">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Prestable */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Prestable *
                            </label>
                            <select
                                required
                                value={formData.prestable_id || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        prestable_id: Number(e.target.value) as any,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Seleccionar...</option>
                                {prestables.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.nombre} ({p.codigo})
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Proveedor */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Proveedor *
                            </label>
                            <select
                                required
                                value={formData.proveedor_id || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        proveedor_id: Number(e.target.value) as any,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">Seleccionar...</option>
                                {proveedores.map((pr) => (
                                    <option key={pr.id} value={pr.id}>
                                        {pr.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Cantidad */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Cantidad *
                            </label>
                            <input
                                type="number"
                                required
                                min="1"
                                value={formData.cantidad || ''}
                                onChange={(e) =>
                                    setFormData({ ...formData, cantidad: Number(e.target.value) })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Tipo de Operación */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Tipo de Operación
                            </label>
                            <select
                                value={formData.es_compra ? 'compra' : 'prestamo'}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        es_compra: e.target.value === 'compra',
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="prestamo">Préstamo</option>
                                <option value="compra">Compra</option>
                            </select>
                        </div>

                        {/* Precio Unitario (solo si es compra) */}
                        {formData.es_compra && (
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Precio Unitario
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.precio_unitario || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            precio_unitario: Number(e.target.value),
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Fecha Préstamo */}
                        <div>
                            <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                Fecha Préstamo *
                            </label>
                            <input
                                type="date"
                                required
                                value={formData.fecha_prestamo}
                                onChange={(e) =>
                                    setFormData({ ...formData, fecha_prestamo: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Número de Documento (solo si es compra) */}
                        {formData.es_compra && (
                            <div className="p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Número de Documento
                                </label>
                                <input
                                    type="text"
                                    value={formData.numero_documento || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            numero_documento: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        )}

                        {/* Botones */}
                        <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Guardando...' : 'Crear Préstamo'}
                            </Button>
                            <a href="/prestamos/proveedores">
                                <Button type="button" variant="outline">
                                    Cancelar
                                </Button>
                            </a>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}
