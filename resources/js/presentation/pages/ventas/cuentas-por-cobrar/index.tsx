import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import { PageProps as InertiaPageProps } from '@inertiajs/core';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/presentation/components/ui/dialog';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import SearchSelect from '@/presentation/components/ui/search-select'; // ✅ NUEVO
import { Eye, CreditCard, AlertTriangle, Plus, ChevronDown, ChevronUp, Trash2, Printer, Calendar, AlertCircle, CheckCircle2 } from 'lucide-react';
import RegistrarPagoModal from '@/presentation/components/clientes/RegistrarPagoModal';
import { OutputSelectionModal } from '@/presentation/components/impresion/OutputSelectionModal';
import { toast } from 'react-toastify';

// Helper functions
const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('es-BO', {
        style: 'currency',
        currency: 'BOB',
        minimumFractionDigits: 2,
    }).format(amount);
};

const formatDate = (date: string): string => {
    return new Date(date).toLocaleDateString('es-BO');
};

interface Cliente {
    id: number;
    nombre: string;
    codigo_cliente: string;
}

interface Venta {
    id: number;
    numero: string;
    cliente?: Cliente;
}

interface Pago {
    id: number;
    monto: number;
    fecha_pago: string;
    tipo_pago?: { nombre: string };
    observaciones?: string;
    estado?: string; // ✅ NUEVO: Estado del pago
}

interface CuentaPorCobrar {
    id: number;
    venta_id: number;
    cliente_id: number;
    monto_original: number;
    saldo_pendiente: number;
    fecha_vencimiento: string;
    dias_vencido: number;
    estado: string;
    observaciones?: string;
    venta?: Venta;
    cliente?: Cliente; // ✅ NUEVO: Cliente directo para créditos manuales
    pagos?: Pago[];
}

interface FiltrosCuentasPorCobrar {
    estado?: string;
    cliente_id?: number | string;
    q?: string;
    fecha_vencimiento_desde?: string;
    fecha_vencimiento_hasta?: string;
    solo_vencidas?: boolean;
}

interface TipoPago {
    id: number;
    nombre: string;
    codigo: string;
}

interface CuentasPorCobrarIndexResponse {
    cuentas_por_cobrar: {
        data: CuentaPorCobrar[];
        current_page: number;
        last_page: number;
        per_page: number;
        total: number;
    };
    filtros: FiltrosCuentasPorCobrar;
    estadisticas: {
        monto_total_pendiente: number;
        cuentas_vencidas: number;
        monto_total_vencido: number;
        total_mes: number;
        promedio_dias_pago: number;
    };
    datosParaFiltros: {
        clientes: Cliente[];
    };
    tipos_pago: TipoPago[];
}

interface Props extends InertiaPageProps {
    cuentasPorCobrar: CuentasPorCobrarIndexResponse;
}

const CuentasPorCobrarIndex: React.FC<Props> = ({ cuentasPorCobrar }) => {
    console.log('CuentasPorCobrarIndex props:', cuentasPorCobrar);
    // Inicializar hooks con valores por defecto seguros
    const filtrosDefault: FiltrosCuentasPorCobrar = {};
    const [filtros, setFiltros] = useState<FiltrosCuentasPorCobrar>(cuentasPorCobrar?.filtros || filtrosDefault);
    const [modalDetalle, setModalDetalle] = useState<{ isOpen: boolean; cuenta?: CuentaPorCobrar }>({ isOpen: false });

    // Estados para el modal de pago
    const [mostrarModalPago, setMostrarModalPago] = useState(false);
    const [cuentaSeleccionadaPago, setCuentaSeleccionadaPago] = useState<CuentaPorCobrar | null>(null);
    const [cuentasDelCliente, setCuentasDelCliente] = useState<any[]>([]);

    // Estados para expandir/contraer filas de pagos
    const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

    const toggleRowExpanded = (cuentaId: number) => {
        const newExpandedRows = new Set(expandedRows);
        if (newExpandedRows.has(cuentaId)) {
            newExpandedRows.delete(cuentaId);
        } else {
            newExpandedRows.add(cuentaId);
        }
        setExpandedRows(newExpandedRows);
    };

    // Estados para anular pagos
    const [pagoAAnular, setPagoAAnular] = useState<{ id: number; monto: number; cuenta_id: number } | null>(null);
    const [motivoAnulacion, setMotivoAnulacion] = useState('');
    const [anulandoPago, setAnulandoPago] = useState(false);

    // Estados para modal de impresión
    const [modalImpresionOpen, setModalImpresionOpen] = useState(false);
    const [cuentaAImprimir, setCuentaAImprimir] = useState<CuentaPorCobrar | null>(null);

    // Estados para modal de impresión de pago individual
    const [modalImpresionPagoOpen, setModalImpresionPagoOpen] = useState(false);
    const [pagoAImprimir, setPagoAImprimir] = useState<Pago | null>(null);

    // Estados para modal de editar fecha de vencimiento
    const [modalEditarFechaOpen, setModalEditarFechaOpen] = useState(false);
    const [cuentaEditarFecha, setCuentaEditarFecha] = useState<CuentaPorCobrar | null>(null);
    const [nuevaFechaVencimiento, setNuevaFechaVencimiento] = useState('');
    const [editandoFecha, setEditandoFecha] = useState(false);

    // Validación defensiva para evitar errores si cuentasPorCobrar es undefined
    if (!cuentasPorCobrar || !cuentasPorCobrar.filtros) {
        return (
            <AppLayout>
                <div className="flex items-center justify-center min-h-screen">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Cargando...</h2>
                        <p className="text-gray-600 dark:text-gray-400">Por favor espere mientras se cargan los datos.</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    const handleFiltroChange = (field: keyof FiltrosCuentasPorCobrar, value: string | boolean) => {
        const nuevosFiltros = { ...filtros, [field]: value };
        setFiltros(nuevosFiltros);

        // Aplicar filtros inmediatamente
        router.get('/ventas/cuentas-por-cobrar', nuevosFiltros as Record<string, string | boolean | undefined>, {
            preserveState: true,
            preserveScroll: true,
        });
    };

    const limpiarFiltros = () => {
        const filtrosVacios: FiltrosCuentasPorCobrar = {};
        setFiltros(filtrosVacios);
        router.get('/ventas/cuentas-por-cobrar');
    };

    const handleAbrirModalPago = (cuenta: CuentaPorCobrar) => {
        // Cargar cuentas del cliente ANTES de abrir el modal
        cargarCuentasDelCliente(cuenta.cliente_id);

        // Esperar un tick para asegurar que cuentasDelCliente se actualice antes de abrir
        setTimeout(() => {
            setCuentaSeleccionadaPago(cuenta);
            setMostrarModalPago(true);
            console.log('✅ Modal abierto con cuenta preseleccionada:', {
                cuenta_id: cuenta.id,
                cliente_id: cuenta.cliente_id,
                saldo: cuenta.saldo_pendiente
            });
        }, 50);
    };

    const cargarCuentasDelCliente = async (clienteId?: number) => {
        if (!clienteId) return;
        try {
            // Filtrar cuentas pendientes del cliente actual de los datos que ya tenemos
            // Incluir todas las cuentas del cliente, no solo las pendientes
            const cuentasPendientes = cuentasPorCobrar.cuentas_por_cobrar.data.filter(
                (c) => c.cliente_id === clienteId
            );
            const cuentasFormateadas = cuentasPendientes.map((c) => ({
                id: c.id,
                venta_id: c.venta_id,
                numero_venta: c.venta?.numero || `#${c.venta_id}`,
                referencia_documento: (c as any).referencia_documento || '',
                fecha_venta: c.venta?.numero || '',
                monto_original: c.monto_original,
                saldo_pendiente: c.saldo_pendiente,
                fecha_vencimiento: c.fecha_vencimiento,
                dias_vencido: c.dias_vencido,
                estado: c.estado,
            }));
            setCuentasDelCliente(cuentasFormateadas);
            console.log('✅ Cuentas cargadas para cliente:', { clienteId, cantidad: cuentasFormateadas.length, cuentas: cuentasFormateadas });
        } catch (error) {
            console.error('Error cargando cuentas del cliente:', error);
        }
    };

    const handlePagoRegistrado = () => {
        // Recargar la página para actualizar los datos
        router.get('/ventas/cuentas-por-cobrar');
    };

    const handleAnularPago = async () => {
        if (!pagoAAnular) return;

        try {
            setAnulandoPago(true);
            const response = await fetch(`/ventas/cuentas-por-cobrar/${pagoAAnular.cuenta_id}/anular-pago/${pagoAAnular.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    motivo: motivoAnulacion,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`✅ Pago de ${formatCurrency(pagoAAnular.monto)} anulado exitosamente`);
                setPagoAAnular(null);
                setMotivoAnulacion('');
                router.get('/ventas/cuentas-por-cobrar');
            } else {
                toast.error(data.message || 'Error al anular el pago');
            }
        } catch (error) {
            console.error('Error anulando pago:', error);
            toast.error('Error al anular el pago');
        } finally {
            setAnulandoPago(false);
        }
    };

    // ✅ NUEVO: Guardar nueva fecha de vencimiento
    const handleGuardarFechaVencimiento = async () => {
        if (!cuentaEditarFecha || !nuevaFechaVencimiento) return;

        try {
            setEditandoFecha(true);
            const response = await fetch(`/ventas/cuentas-por-cobrar/${cuentaEditarFecha.id}/actualizar-fecha-vencimiento`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    fecha_vencimiento: nuevaFechaVencimiento,
                }),
            });

            const data = await response.json();

            if (data.success) {
                toast.success(`✅ Fecha de vencimiento actualizada a ${new Date(nuevaFechaVencimiento).toLocaleDateString('es-BO')}`);
                setModalEditarFechaOpen(false);
                setCuentaEditarFecha(null);
                setNuevaFechaVencimiento('');
                router.get('/ventas/cuentas-por-cobrar');
            } else {
                toast.error(data.message || 'Error al actualizar la fecha');
            }
        } catch (error) {
            console.error('Error actualizando fecha:', error);
            toast.error('Error al actualizar la fecha de vencimiento');
        } finally {
            setEditandoFecha(false);
        }
    };

    const getEstadoBadge = (estado: string) => {
        const colores = {
            'PENDIENTE': 'default',
            'PAGADO': 'secondary',
            'VENCIDO': 'destructive',
            'PARCIAL': 'outline'
        };
        return colores[estado as keyof typeof colores] || 'default';
    };

    const getUrgenciaBadge = (diasVencido: number) => {
        if (diasVencido > 30) return 'destructive';
        if (diasVencido > 15) return 'secondary';
        if (diasVencido > 0) return 'default';
        return 'outline';
    };

    // ✅ NUEVO: Función para mostrar el estado del pago
    const getEstadoPagoBadge = (estado?: string) => {
        if (!estado) return 'default';
        const colores = {
            'CONFIRMADO': 'secondary',
            'PENDIENTE': 'default',
            'ANULADO': 'destructive',
            'RECHAZADO': 'destructive',
            'PROCESANDO': 'outline'
        };
        return colores[estado as keyof typeof colores] || 'default';
    };

    // ✅ NUEVO: Función para obtener color de fila según días vencido
    const getRowColorClass = (diasVencido: number, estado: string) => {
        // Si está pagado, color normal
        if (estado === 'PAGADO') {
            return 'bg-green-50 dark:bg-green-950/10 border-l-4 border-l-green-500 hover:bg-green-100 dark:hover:bg-green-950/20';
        }

        // Si está vencido por más de 30 días - CRÍTICO
        if (diasVencido > 30) {
            return 'bg-red-50 dark:bg-red-950/20 border-l-4 border-l-red-600 hover:bg-red-100 dark:hover:bg-red-950/30 shadow-md';
        }

        // Si está vencido por 15-30 días - ALTO
        if (diasVencido > 15) {
            return 'bg-orange-50 dark:bg-orange-950/20 border-l-4 border-l-orange-500 hover:bg-orange-100 dark:hover:bg-orange-950/30';
        }

        // Si está vencido por 1-15 días - MEDIO
        if (diasVencido > 0) {
            return 'bg-yellow-50 dark:bg-yellow-950/20 border-l-4 border-l-yellow-500 hover:bg-yellow-100 dark:hover:bg-yellow-950/30';
        }

        // Si está al día - NORMAL
        return 'bg-blue-50 dark:bg-blue-950/10 border-l-4 border-l-blue-400 hover:bg-blue-100 dark:hover:bg-blue-950/20';
    };

    return (
        <AppLayout breadcrumbs={[
            { title: 'Ventas', href: '/ventas' },
            { title: 'Cuentas por Cobrar', href: '/ventas/cuentas-por-cobrar' }
        ]}>
            <Head title="Cuentas por Cobrar" />

            <div className="space-y-6 p-6">
                {/* Header */}
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Cuentas por Cobrar</h1>
                        <p className="text-gray-600 dark:text-gray-400">Gestión de deudas de clientes</p>
                    </div>
                    <Button
                        onClick={() => router.visit('/admin/creditos/crear')}
                        className="flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Crear Crédito Manual
                    </Button>
                </div>

                {/* Estadísticas Rápidas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Pendiente</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {formatCurrency(cuentasPorCobrar.estadisticas.monto_total_pendiente)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-red-100 dark:bg-red-900/20 rounded-lg">
                                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Vencidas</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatCurrency(cuentasPorCobrar.estadisticas.monto_total_vencido)}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Cuentas Vencidas</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {cuentasPorCobrar.estadisticas.cuentas_vencidas}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardContent className="p-6">
                            <div className="flex items-center">
                                <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
                                    <CreditCard className="w-6 h-6 text-green-600 dark:text-green-400" />
                                </div>
                                <div className="ml-4">
                                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Promedio Días</p>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                        {cuentasPorCobrar.estadisticas.promedio_dias_pago}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Filtros */}
                <Card>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                            {/* ✅ ACTUALIZADO: SearchSelect para cliente */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                                <SearchSelect
                                    id="cliente"
                                    label="Cliente"
                                    placeholder="Seleccione un cliente"
                                    value={filtros.cliente_id || ''}
                                    options={cuentasPorCobrar.datosParaFiltros.clientes.map((cliente) => ({
                                        value: cliente.id,
                                        label: cliente.nombre,
                                        description: cliente.codigo_cliente
                                    }))}
                                    onChange={(value) => handleFiltroChange('cliente_id', value)}
                                    allowClear={true}
                                    emptyText="No se encontraron clientes"
                                    searchPlaceholder="Buscar clientes..."
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Buscar</label>
                                <Input
                                    value={filtros.q || ''}
                                    onChange={(e) => handleFiltroChange('q', e.target.value)}
                                    placeholder="ID cuenta, ID venta, referencia, número, cliente..."
                                    className="dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    ID cuenta, ID venta, referencia documento, número de venta o nombre cliente
                                </p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                <select
                                    className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-800 dark:text-white dark:placeholder-gray-400"
                                    value={filtros.estado || ''}
                                    onChange={(e) => handleFiltroChange('estado', e.target.value)}
                                >
                                    <option value="">Todos los estados</option>
                                    <option value="PENDIENTE">Pendiente</option>
                                    <option value="PAGADO">Pagado</option>
                                    <option value="VENCIDO">Vencido</option>
                                    <option value="PARCIAL">Parcial</option>
                                </select>
                            </div>
                        </div>

                        {/* Rango de Fechas de Vencimiento */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                                <label className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                    Rango de Fecha de Vencimiento
                                </label>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/30">
                                {/* Fecha Desde */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-blue-500"></span>
                                        Desde
                                    </label>
                                    <Input
                                        type="date"
                                        value={filtros.fecha_vencimiento_desde || ''}
                                        onChange={(e) => handleFiltroChange('fecha_vencimiento_desde', e.target.value)}
                                        placeholder="Selecciona fecha inicial"
                                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white border-blue-300 dark:border-blue-900 focus:ring-blue-500"
                                    />
                                    {filtros.fecha_vencimiento_desde && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            A partir de {new Date(filtros.fecha_vencimiento_desde).toLocaleDateString('es-BO')}
                                        </p>
                                    )}
                                </div>

                                {/* Fecha Hasta */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                                        <span className="inline-block w-2 h-2 rounded-full bg-green-500"></span>
                                        Hasta
                                    </label>
                                    <Input
                                        type="date"
                                        value={filtros.fecha_vencimiento_hasta || ''}
                                        onChange={(e) => handleFiltroChange('fecha_vencimiento_hasta', e.target.value)}
                                        placeholder="Selecciona fecha final"
                                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white border-green-300 dark:border-green-900 focus:ring-green-500"
                                    />
                                    {filtros.fecha_vencimiento_hasta && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Hasta {new Date(filtros.fecha_vencimiento_hasta).toLocaleDateString('es-BO')}
                                        </p>
                                    )}
                                </div>
                            </div>
                            {/* Filtro: Solo Vencidas - Card Interactivo */}
                            <div
                                onClick={() => handleFiltroChange('solo_vencidas', !filtros.solo_vencidas)}
                                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${filtros.solo_vencidas
                                    ? 'border-red-500 bg-red-50 dark:bg-red-950/20'
                                    : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50 hover:border-red-300'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${filtros.solo_vencidas
                                            ? 'bg-red-500 border-red-500'
                                            : 'border-gray-300 dark:border-gray-600'
                                            }`}
                                    >
                                        {filtros.solo_vencidas && (
                                            <CheckCircle2 className="w-4 h-4 text-white" />
                                        )}
                                    </div>
                                    <div>
                                        <p className="font-semibold text-sm text-gray-900 dark:text-white">
                                            🚨 Mostrar solo vencidas
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Filtra cuentas con fecha vencimiento anterior a hoy
                                        </p>
                                    </div>
                                </div>
                            </div>
                            {/* Indicador de rango activo */}
                            {filtros.fecha_vencimiento_desde && filtros.fecha_vencimiento_hasta && (
                                <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900/30 rounded-lg">
                                    <CheckCircle2 className="w-4 h-4 text-green-600 dark:text-green-400" />
                                    <span className="text-sm text-green-700 dark:text-green-300">
                                        Filtrando: {new Date(filtros.fecha_vencimiento_desde).toLocaleDateString('es-BO')} → {new Date(filtros.fecha_vencimiento_hasta).toLocaleDateString('es-BO')}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end mt-4">
                            <Button
                                onClick={limpiarFiltros}
                                variant="outline"
                            >
                                Limpiar Filtros
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Tabla de Cuentas por Cobrar */}
                <Card>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                            <thead className="bg-gray-50 dark:bg-gray-800">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Venta
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Cliente
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Monto Original
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Vencimiento
                                    </th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                        Acciones
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
                                {cuentasPorCobrar.cuentas_por_cobrar.data.map((cuenta) => (
                                    <React.Fragment key={cuenta.id}>
                                        <tr className={`${getRowColorClass(cuenta.dias_vencido, cuenta.estado)} transition-colors duration-200`}>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    <p>Folio Cuenta por Cobrar:  #{cuenta.id}</p>
                                                    {cuenta.venta && (
                                                        <p>Folio Venta: {cuenta.venta?.id}</p>
                                                    )}
                                                    <p>{cuenta.venta?.numero || `${cuenta.referencia_documento}`}</p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm text-gray-900 dark:text-white">
                                                    {/* ✅ CORREGIDO: Mostrar cliente directo o cliente de venta */}
                                                    {cuenta.cliente?.nombre || cuenta.venta?.cliente?.nombre || 'Sin cliente'}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Mont. Org.: {formatCurrency(cuenta.monto_original)}
                                                </p>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                    Saldo: {formatCurrency(cuenta.saldo_pendiente)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm text-gray-900 dark:text-white">
                                                    {formatDate(cuenta.fecha_vencimiento)}
                                                </p>
                                                <p>
                                                    <Badge variant={getEstadoBadge(cuenta.estado) as "default" | "secondary" | "destructive" | "outline"}>
                                                        {cuenta.estado}
                                                    </Badge>
                                                </p>
                                                <p>
                                                    <Badge variant={getUrgenciaBadge(cuenta.dias_vencido) as "default" | "secondary" | "destructive" | "outline"}>
                                                        {cuenta.dias_vencido > 0 ? `${cuenta.dias_vencido} días` : 'Al día'}
                                                    </Badge>
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                <div className="flex justify-end space-x-2">
                                                    {cuenta.pagos && cuenta.pagos.length > 0 && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => toggleRowExpanded(cuenta.id)}
                                                            title={expandedRows.has(cuenta.id) ? 'Ocultar pagos' : 'Mostrar pagos'}
                                                        >
                                                            {expandedRows.has(cuenta.id) ? (
                                                                <ChevronUp className="w-4 h-4" />
                                                            ) : (
                                                                <ChevronDown className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                    )}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => setModalDetalle({ isOpen: true, cuenta })}
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setCuentaAImprimir(cuenta);
                                                            setModalImpresionOpen(true);
                                                        }}
                                                        title="Imprimir"
                                                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                    >
                                                        <Printer className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => {
                                                            setCuentaEditarFecha(cuenta);
                                                            setNuevaFechaVencimiento(cuenta.fecha_vencimiento);
                                                            setModalEditarFechaOpen(true);
                                                        }}
                                                        title="Editar fecha de vencimiento"
                                                        className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                    >
                                                        <Calendar className="w-4 h-4" />
                                                    </Button>
                                                    {cuenta.estado !== 'PAGADO' && (
                                                        <Button
                                                            size="sm"
                                                            onClick={() => handleAbrirModalPago(cuenta)}
                                                            className="bg-green-600 hover:bg-green-700"
                                                        >
                                                            Cobrar
                                                        </Button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedRows.has(cuenta.id) && cuenta.pagos && cuenta.pagos.length > 0 && (
                                            <tr className="bg-gray-50 dark:bg-gray-800/50">
                                                <td colSpan={8} className="px-6 py-4">
                                                    <div className="space-y-2">
                                                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Historial de Cobros</h4>
                                                        <div className="space-y-2">
                                                            {cuenta.pagos.map((pago) => (
                                                                <div
                                                                    key={pago.id}
                                                                    className="flex justify-between items-center p-3 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                                                                >
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2 mb-1">
                                                                            <p>Folio: {pago.id} | </p>
                                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                                {formatCurrency(pago.monto)}
                                                                            </p>
                                                                            {/* ✅ NUEVO: Mostrar estado del pago */}
                                                                            {pago.estado && (
                                                                                <Badge variant={getEstadoPagoBadge(pago.estado) as "default" | "secondary" | "destructive" | "outline"}>
                                                                                    {pago.estado}
                                                                                </Badge>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                            {formatDate(pago.fecha_pago)} - {pago.tipo_pago?.nombre || 'Sin tipo'}
                                                                        </p>
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        {pago.observaciones && (
                                                                            <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                                                {pago.observaciones}
                                                                            </p>
                                                                        )}
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                setPagoAImprimir(pago);
                                                                                setModalImpresionPagoOpen(true);
                                                                            }}
                                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                                                                            title="Imprimir pago"
                                                                        >
                                                                            <Printer className="w-4 h-4" />
                                                                        </Button>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => setPagoAAnular({ id: pago.id, monto: pago.monto, cuenta_id: cuenta.id })}
                                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                            title="Anular pago"
                                                                        >
                                                                            <Trash2 className="w-4 h-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {cuentasPorCobrar.cuentas_por_cobrar.data.length === 0 && (
                        <div className="text-center py-12">
                            <CreditCard className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-600" />
                            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">No hay cuentas por cobrar</h3>
                            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">No se encontraron cuentas con los filtros aplicados.</p>
                        </div>
                    )}
                </Card>

                {/* Modal de Detalle */}
                <Dialog
                    open={modalDetalle.isOpen}
                    onOpenChange={() => setModalDetalle({ isOpen: false })}
                >
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Detalle de Cuenta por Cobrar</DialogTitle>
                        </DialogHeader>
                        {modalDetalle.cuenta && (
                            <div className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Venta</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.venta?.numero || `#${modalDetalle.cuenta.venta_id}`}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cliente</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {/* ✅ CORREGIDO: Mostrar cliente directo o cliente de venta */}
                                            {modalDetalle.cuenta.cliente?.nombre || modalDetalle.cuenta.venta?.cliente?.nombre || 'Sin cliente'}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Monto Original</label>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(modalDetalle.cuenta.monto_original)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Saldo Pendiente</label>
                                        <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                                            {formatCurrency(modalDetalle.cuenta.saldo_pendiente)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Fecha Vencimiento</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {formatDate(modalDetalle.cuenta.fecha_vencimiento)}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Estado</label>
                                        <Badge variant={getEstadoBadge(modalDetalle.cuenta.estado) as "default" | "secondary" | "destructive" | "outline"}>
                                            {modalDetalle.cuenta.estado}
                                        </Badge>
                                    </div>
                                </div>

                                {modalDetalle.cuenta.observaciones && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Observaciones</label>
                                        <p className="mt-1 text-sm text-gray-900 dark:text-white">
                                            {modalDetalle.cuenta.observaciones}
                                        </p>
                                    </div>
                                )}

                                {modalDetalle.cuenta.pagos && modalDetalle.cuenta.pagos.length > 0 && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Historial de Cobros</label>
                                        <div className="space-y-2">
                                            {modalDetalle.cuenta.pagos.map((pago) => (
                                                <div key={pago.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                                                                {formatCurrency(pago.monto)}
                                                            </p>
                                                            {/* ✅ NUEVO: Mostrar estado del pago */}
                                                            {pago.estado && (
                                                                <Badge variant={getEstadoPagoBadge(pago.estado) as "default" | "secondary" | "destructive" | "outline"}>
                                                                    {pago.estado}
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {formatDate(pago.fecha_pago)} - {pago.tipo_pago?.nombre}
                                                        </p>
                                                    </div>
                                                    {pago.observaciones && (
                                                        <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs truncate">
                                                            {pago.observaciones}
                                                        </p>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setModalDetalle({ isOpen: false })}
                                    >
                                        Cerrar
                                    </Button>
                                    {modalDetalle.cuenta.estado !== 'PAGADO' && (
                                        <Button
                                            onClick={() => {
                                                setModalDetalle({ isOpen: false });
                                                handleAbrirModalPago(modalDetalle.cuenta!);
                                            }}
                                            className="bg-green-600 hover:bg-green-700"
                                        >
                                            Registrar Cobro
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )}
                    </DialogContent>
                </Dialog>

                {/* Modal para Registrar Pago */}
                <RegistrarPagoModal
                    show={mostrarModalPago}
                    onHide={() => {
                        setMostrarModalPago(false);
                        setCuentaSeleccionadaPago(null);
                    }}
                    clienteId={cuentaSeleccionadaPago?.cliente_id || 0}
                    cuentasPendientes={cuentasDelCliente}
                    onPagoRegistrado={handlePagoRegistrado}
                    cuentaIdPreseleccionada={cuentaSeleccionadaPago?.id}
                    tipo="ventas"
                    tipos_pago={cuentasPorCobrar?.tipos_pago || []}
                />

                {/* Modal de confirmación para anular pago */}
                {pagoAAnular && (
                    <Dialog open={!!pagoAAnular} onOpenChange={() => {
                        setPagoAAnular(null);
                        setMotivoAnulacion('');
                    }}>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle className="flex items-center gap-2 text-red-600">
                                    ⚠️ Anular Pago
                                </DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                                <Alert variant="destructive" className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/50">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="text-red-800 dark:text-red-200">
                                        ¿Está seguro de que desea anular este pago de <strong>{formatCurrency(pagoAAnular.monto)}</strong>?
                                        <p className="text-xs mt-2">
                                            Esta acción no puede deshacerse. Se revertirán todos los movimientos asociados.
                                        </p>
                                    </AlertDescription>
                                </Alert>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-gray-900 dark:text-white">
                                        Motivo de anulación (opcional)
                                    </label>
                                    <textarea
                                        value={motivoAnulacion}
                                        onChange={(e) => setMotivoAnulacion(e.target.value)}
                                        placeholder="Ej: Pago registrado erróneamente, cliente no confirma..."
                                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm resize-none"
                                        rows={3}
                                        disabled={anulandoPago}
                                    />
                                </div>
                            </div>
                            <DialogFooter className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setPagoAAnular(null);
                                        setMotivoAnulacion('');
                                    }}
                                    disabled={anulandoPago}
                                    className="flex-1"
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    variant="destructive"
                                    onClick={handleAnularPago}
                                    disabled={anulandoPago}
                                    className="flex-1"
                                >
                                    {anulandoPago ? '⏳ Anulando...' : '❌ Anular Pago'}
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                )}

                {/* Modal de Impresión - Cuenta por Cobrar */}
                {cuentaAImprimir && (
                    <OutputSelectionModal
                        isOpen={modalImpresionOpen}
                        onClose={() => {
                            setModalImpresionOpen(false);
                            setCuentaAImprimir(null);
                        }}
                        documentoId={cuentaAImprimir.id}
                        tipoDocumento="cuenta-por-cobrar"
                        documentoInfo={{
                            numero: `Cuenta #${cuentaAImprimir.id}`,
                            fecha: formatDate(cuentaAImprimir.fecha_vencimiento),
                            monto: cuentaAImprimir.saldo_pendiente,
                        }}
                    />
                )}

                {/* Modal de Impresión - Pago Individual */}
                {pagoAImprimir && (
                    <OutputSelectionModal
                        isOpen={modalImpresionPagoOpen}
                        onClose={() => {
                            setModalImpresionPagoOpen(false);
                            setPagoAImprimir(null);
                        }}
                        documentoId={pagoAImprimir.id}
                        tipoDocumento="pago"
                        documentoInfo={{
                            numero: `Pago #${pagoAImprimir.id}`,
                            fecha: formatDate(pagoAImprimir.fecha_pago),
                            monto: pagoAImprimir.monto,
                        }}
                    />
                )}

                {/* Modal para Editar Fecha de Vencimiento */}
                <Dialog open={modalEditarFechaOpen} onOpenChange={setModalEditarFechaOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">
                                📅 Editar Fecha de Vencimiento
                            </DialogTitle>
                        </DialogHeader>

                        {cuentaEditarFecha && (
                            <div className="space-y-6 py-4">
                                {/* Info de la cuenta */}
                                <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg border border-blue-200 dark:border-blue-900/30">
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Cuenta por Cobrar</p>
                                    <p className="text-lg font-bold text-gray-900 dark:text-white">
                                        #{cuentaEditarFecha.id}
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                                        Cliente: <span className="font-semibold">{cuentaEditarFecha.cliente?.nombre || cuentaEditarFecha.venta?.cliente?.nombre || 'Sin cliente'}</span>
                                    </p>
                                    <p className="text-sm text-gray-700 dark:text-gray-300">
                                        Saldo: <span className="font-semibold text-amber-600">{formatCurrency(cuentaEditarFecha.saldo_pendiente)}</span>
                                    </p>
                                </div>

                                {/* Fecha actual */}
                                <div className="space-y-2">
                                    <label className="text-xs font-medium text-gray-700 dark:text-gray-400">
                                        Fecha Vencimiento Actual
                                    </label>
                                    <div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-lg">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                                            {new Date(cuentaEditarFecha.fecha_vencimiento).toLocaleDateString('es-BO')}
                                        </p>
                                    </div>
                                </div>

                                {/* Nueva fecha */}
                                <div className="space-y-2">
                                    <label className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                                        Nueva Fecha de Vencimiento
                                    </label>
                                    <Input
                                        type="date"
                                        value={nuevaFechaVencimiento}
                                        onChange={(e) => setNuevaFechaVencimiento(e.target.value)}
                                        className="bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white"
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                    {nuevaFechaVencimiento && (
                                        <p className="text-xs text-gray-600 dark:text-gray-400">
                                            Nueva fecha: {new Date(nuevaFechaVencimiento).toLocaleDateString('es-BO')}
                                        </p>
                                    )}
                                </div>

                                {/* Alerta */}
                                <div className="flex gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
                                    <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-xs text-amber-700 dark:text-amber-300">
                                        Al cambiar la fecha, se recalcularán automáticamente los días vencidos.
                                    </p>
                                </div>
                            </div>
                        )}

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setModalEditarFechaOpen(false);
                                    setCuentaEditarFecha(null);
                                    setNuevaFechaVencimiento('');
                                }}
                                disabled={editandoFecha}
                            >
                                Cancelar
                            </Button>
                            <Button
                                onClick={handleGuardarFechaVencimiento}
                                disabled={!nuevaFechaVencimiento || editandoFecha}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {editandoFecha ? 'Guardando...' : 'Guardar Cambios'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
};

export default CuentasPorCobrarIndex;
