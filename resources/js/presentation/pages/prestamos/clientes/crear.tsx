import React, { useEffect, useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card } from '@/presentation/components/ui/card';
import SearchSelect from '@/presentation/components/ui/search-select';
import AsyncSearchSelect from '@/presentation/components/ui/async-search-select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/presentation/components/ui/table';
import prestamoClienteService from '@/infrastructure/services/prestamo-cliente.service';
import { usePrestables } from '@/stores/usePrestables';
import type { NuevoPrestamoCliente, Prestable } from '@/domain/entities/prestamos';
import type { SelectOption } from '@/presentation/components/ui/search-select';
import { Plus, Trash2 } from 'lucide-react';

interface Props {
    clientes: Array<{ id: number; nombre: string; razon_social?: string }>;
    choferes: Array<{ id: number; nombre: string }>;
    ventas: Array<{ id: number; numero: string; cliente_id: number; cliente?: { id: number; nombre: string; razon_social?: string } }>;
}

interface PrestamoItem {
    prestable_id: number;
    cantidad: number;
    prestable?: Prestable;
}

export default function CrearPrestamoCliente({ clientes, choferes, ventas }: Props) {
    const { prestables, loading: loadingPrestables, fetchPrestables } = usePrestables();

    // Opciones para SearchSelect
    const clientesOptions: SelectOption[] = clientes.map((c) => ({
        value: c.id,
        label: c.nombre,
        description: c.razon_social,
    }));

    const choferesOptions: SelectOption[] = choferes.map((ch) => ({
        value: ch.id,
        label: ch.nombre,
    }));


    const prestablesOptions: SelectOption[] = prestables.map((p) => ({
        value: p.id,
        label: p.nombre,
        description: p.codigo,
    }));

    // Estado principal del préstamo
    const [formData, setFormData] = useState({
        cliente_id: undefined as number | undefined,
        chofer_id: undefined as number | undefined,
        es_venta: false,
        venta_id: undefined as number | undefined,
        es_evento: false,
        fecha_prestamo: new Date().toISOString().split('T')[0],
        fecha_esperada_devolucion: getDateAdd7Days(),
        monto_garantia: 0,
    });

    // Lista de prestables agregados
    const [prestablesAgregados, setPrestablesAgregados] = useState<PrestamoItem[]>([]);

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchPrestables();
    }, []);


    function getDateAdd7Days() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    }

    const handleFechaPrestamo = (fecha: string) => {
        const date = new Date(fecha);
        date.setDate(date.getDate() + 7);
        const nuevaFecha = date.toISOString().split('T')[0];

        setFormData({
            ...formData,
            fecha_prestamo: fecha,
            fecha_esperada_devolucion: nuevaFecha,
        });
    };

    const handleVentaSeleccionada = async (ventaId: number | undefined) => {
        if (!ventaId) {
            setFormData({ ...formData, venta_id: undefined });
            return;
        }

        try {
            // Obtener datos de la venta para extraer cliente_id
            const response = await fetch(`/api/ventas/${ventaId}`);
            const data = await response.json();
            const ventaData = data.data || data;

            setFormData({
                ...formData,
                venta_id: ventaId,
                cliente_id: ventaData.cliente_id || formData.cliente_id,
            });
        } catch (error) {
            console.error('Error obteniendo venta:', error);
            setFormData({ ...formData, venta_id: ventaId });
        }
    };

    const handleEliminarPrestable = (prestable_id: number) => {
        setPrestablesAgregados(
            prestablesAgregados.filter((p) => p.prestable_id !== prestable_id)
        );
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (!formData.cliente_id) {
            setError('Selecciona un cliente');
            return;
        }

        if (formData.es_venta && !formData.venta_id) {
            setError('Selecciona una venta');
            return;
        }

        if (prestablesAgregados.length === 0) {
            setError('Agrega al menos un prestable');
            return;
        }

        setLoading(true);

        try {
            // Enviar cada prestable como un préstamo separado
            for (const item of prestablesAgregados) {
                const payload = {
                    prestable_id: item.prestable_id,
                    cliente_id: formData.cliente_id,
                    chofer_id: formData.chofer_id,
                    cantidad: item.cantidad,
                    es_venta: formData.es_venta,
                    venta_id: formData.venta_id,
                    es_evento: formData.es_evento,
                    fecha_prestamo: formData.fecha_prestamo,
                    fecha_esperada_devolucion: formData.fecha_esperada_devolucion,
                    monto_garantia: formData.monto_garantia,
                };
                console.log('📤 Enviando préstamo:', payload);
                await prestamoClienteService.crear(payload);
            }
            window.location.href = '/prestamos/clientes';
        } catch (err) {
            setError((err as Error).message);
            setLoading(false);
        }
    };

    const totalGarantia = prestablesAgregados.reduce((sum, item) => {
        const garantia = item.prestable?.condiciones?.[0]?.monto_garantia || 0;
        return sum + Number(garantia) * item.cantidad;
    }, 0);

    return (
        <AppLayout>
            <Head title="Crear Préstamo a Cliente" />
            <div className="p-8 bg-white dark:bg-gray-950 min-h-screen">
                <h1 className="text-3xl font-bold mb-8 text-gray-900 dark:text-white">
                    👥 Nuevo Préstamo a Cliente/Evento
                </h1>

                <form onSubmit={handleSubmit} className="space-y-6">
                    {error && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300 rounded-lg border border-red-300 dark:border-red-700">
                            {error}
                        </div>
                    )}

                    {/* Sección 1: Información del Préstamo */}
                    <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                            📋 Información del Préstamo
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Venta - Primer campo */}
                            <div className="md:col-span-2">
                                <AsyncSearchSelect
                                    label="🛒 Venta (Opcional) - Buscar primero"
                                    placeholder="Buscar venta por número..."
                                    value={formData.venta_id || ''}
                                    searchEndpoint="/api/ventas/search"
                                    onChange={(id) => handleVentaSeleccionada(id ? Number(id) : undefined)}
                                    minSearchLength={1}
                                    allowClear
                                />
                                {formData.venta_id && (
                                    <p className="text-xs text-green-600 dark:text-green-400 mt-2">
                                        ✅ Venta seleccionada - Cliente cargado automáticamente
                                    </p>
                                )}
                            </div>

                            <SearchSelect
                                label="Cliente *"
                                placeholder="Buscar cliente..."
                                value={formData.cliente_id || ''}
                                options={clientesOptions}
                                onChange={(id) =>
                                    setFormData({ ...formData, cliente_id: id ? Number(id) : undefined })
                                }
                                required
                            />

                            <SearchSelect
                                label="Chofer (Opcional)"
                                placeholder="Buscar chofer..."
                                value={formData.chofer_id || ''}
                                options={choferesOptions}
                                onChange={(id) =>
                                    setFormData({
                                        ...formData,
                                        chofer_id: id ? Number(id) : undefined,
                                    })
                                }
                                allowClear
                            />

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Tipo de Operación *
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={!formData.es_venta}
                                            onChange={() => setFormData({ ...formData, es_venta: false, venta_id: undefined })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">📦 Préstamo</span>
                                    </label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="radio"
                                            checked={formData.es_venta}
                                            onChange={() => setFormData({ ...formData, es_venta: true })}
                                            className="w-4 h-4"
                                        />
                                        <span className="text-gray-700 dark:text-gray-300">🛒 Venta</span>
                                    </label>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Garantía Total (Opcional)
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    value={formData.monto_garantia === 0 ? '' : formData.monto_garantia}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        setFormData({
                                            ...formData,
                                            monto_garantia: val === '' ? 0 : Number(val),
                                        });
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    placeholder="0.00"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Escribe la garantía manualmente (Sugerencia: {totalGarantia.toFixed(2)})
                                </p>
                            </div>

                            <div className="md:col-span-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.es_evento}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                es_evento: e.target.checked,
                                            })
                                        }
                                        className="w-5 h-5 cursor-pointer"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        🎉 Este préstamo es para un evento
                                    </span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Fecha de Préstamo *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.fecha_prestamo}
                                    onChange={(e) => handleFechaPrestamo(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">
                                    Fecha Esperada de Devolución (7 días) *
                                </label>
                                <input
                                    type="date"
                                    required
                                    value={formData.fecha_esperada_devolucion}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            fecha_esperada_devolucion: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </Card>

                    {/* Sección 2: Agregar Prestables */}
                    <Card className="p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800">
                        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                            📦 Seleccionar Prestables
                        </h2>

                        {/* Tabla de Prestables Activos con Checkboxes */}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50 dark:bg-gray-800">
                                        <TableHead className="w-12 text-gray-900 dark:text-white"></TableHead>
                                        <TableHead className="text-gray-900 dark:text-white">Prestable</TableHead>
                                        <TableHead className="text-center text-gray-900 dark:text-white">
                                            Cantidad Canastillas
                                        </TableHead>
                                        {/* <TableHead className="text-right text-gray-900 dark:text-white">
                                            Garantía Unit.
                                        </TableHead>
                                        <TableHead className="text-right text-gray-900 dark:text-white">
                                            Garantía Total
                                        </TableHead> */}
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {prestables
                                        .filter((prestable) => {
                                            // Solo mostrar prestables activos
                                            if (!prestable.activo) return false;

                                            // Solo mostrar si tienen stock disponible
                                            const stockTotal = prestable.stocks?.reduce(
                                                (sum, stock) => sum + (stock.cantidad_disponible || 0),
                                                0
                                            ) || 0;
                                            return stockTotal > 0;
                                        })
                                        .map((prestable) => {
                                            const estaSeleccionado = prestablesAgregados.some(
                                                (p) => p.prestable_id === prestable.id
                                            );
                                            const item = prestablesAgregados.find(
                                                (p) => p.prestable_id === prestable.id
                                            );

                                            // Calcular stock total disponible
                                            const stockTotalCanastillas = prestable.stocks?.reduce(
                                                (sum, stock) => sum + (stock.cantidad_disponible || 0),
                                                0
                                            ) || 0;
                                            const stockTotalEmbases = stockTotalCanastillas * (prestable.capacidad || 1);

                                            return (
                                                <TableRow
                                                    key={prestable.id}
                                                    className="border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
                                                >
                                                    <TableCell className="text-center">
                                                        <input
                                                            type="checkbox"
                                                            checked={estaSeleccionado}
                                                            onChange={(e) => {
                                                                if (e.target.checked) {
                                                                    setPrestablesAgregados([
                                                                        ...prestablesAgregados,
                                                                        {
                                                                            prestable_id: prestable.id,
                                                                            cantidad: 1,
                                                                            prestable,
                                                                        },
                                                                    ]);
                                                                } else {
                                                                    setPrestablesAgregados(
                                                                        prestablesAgregados.filter(
                                                                            (p) => p.prestable_id !== prestable.id
                                                                        )
                                                                    );
                                                                }
                                                            }}
                                                            className="w-4 h-4 cursor-pointer"
                                                        />
                                                    </TableCell>
                                                    <TableCell className="text-gray-900 dark:text-white font-medium">
                                                        <p>{prestable.nombre}</p>
                                                        <p>{prestable.codigo}</p>
                                                        <p>Canastillas: {stockTotalCanastillas.toLocaleString('es-BO')}</p>
                                                        <p>Embases: {stockTotalEmbases.toLocaleString('es-BO')}</p>
                                                    </TableCell>
                                                    <TableCell>
                                                        {estaSeleccionado && item ? (
                                                            <div className="text-center">
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={item.cantidad}
                                                                    onChange={(e) => {
                                                                        const updated = prestablesAgregados.map(
                                                                            (p) =>
                                                                                p.prestable_id === prestable.id
                                                                                    ? {
                                                                                        ...p,
                                                                                        cantidad: Number(e.target.value),
                                                                                    }
                                                                                    : p
                                                                        );
                                                                        setPrestablesAgregados(updated);
                                                                    }}
                                                                    className="w-16 px-2 py-1 border border-gray-300 dark:border-gray-500 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm text-center"
                                                                />
                                                                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                                                    = {(item.cantidad * (prestable.capacidad || 1)).toLocaleString('es-BO')} embases
                                                                </p>
                                                            </div>
                                                        ) : (
                                                            <span className="text-gray-400 dark:text-gray-500">-</span>
                                                        )}
                                                    </TableCell>
                                                    {/* <TableCell className="text-right text-gray-900 dark:text-white">
                                                        Bs {(prestable.condiciones?.monto_garantia || 0).toFixed(2)}
                                                    </TableCell>
                                                    <TableCell className="text-right text-gray-900 dark:text-white font-semibold">
                                                        {estaSeleccionado && item
                                                            ? `Bs ${((prestable.condiciones?.monto_garantia || 0) * item.cantidad).toFixed(2)}`
                                                            : '-'}
                                                    </TableCell> */}                                                    
                                                </TableRow>
                                            );
                                        })}
                                </TableBody>
                            </Table>
                        </div>
                    </Card>

                    {/* Botones de Acción */}
                    <div className="flex gap-2">
                        <Button
                            type="submit"
                            disabled={loading || prestablesAgregados.length === 0}
                            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                        >
                            {loading ? 'Registrando...' : '✅ Registrar Préstamo'}
                        </Button>
                        <a href="/prestamos/clientes">
                            <Button type="button" variant="outline">
                                Cancelar
                            </Button>
                        </a>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
