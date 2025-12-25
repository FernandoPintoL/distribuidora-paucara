import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { ArrowLeft, MapPin, Package, Calendar, User, FileText, Printer, Download, Eye } from 'lucide-react';
import { router } from '@inertiajs/react';
import type { Entrega, VehiculoCompleto, ClienteEntrega } from '@/domain/entities/entregas';
import EntregaFlujoCarga from './components/EntregaFlujoCarga';
import { getEstadoLabel, estadoColorMap } from '@/domain/utils/estado-entrega';
import { FormatoSelector } from '@/presentation/components/impresion/FormatoSelector';
import { useState } from 'react';

interface ShowProps {
    entrega: Entrega;
    vehiculos?: VehiculoCompleto[];
}

const estadoBadgeColor: Record<string, string> = {
    PROGRAMADO: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
    ASIGNADA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
    EN_CAMINO: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200',
    ENTREGADO: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
    RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    LLEGO: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-200',
    NOVEDAD: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200',
    CANCELADA: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100',
};

export default function EntregaShow({ entrega: initialEntrega, vehiculos = [] }: ShowProps) {
    const [entrega, setEntrega] = useState<Entrega>(initialEntrega);
    const [loadingPdf, setLoadingPdf] = useState<number | null>(null);
    const [loadingPdfDetallado, setLoadingPdfDetallado] = useState<number | null>(null);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    const [reportError, setReportError] = useState<string | null>(null);

    console.log('Entrega data:', entrega);
    const cliente: ClienteEntrega | undefined = entrega.venta?.cliente || entrega.proforma?.cliente;
    const numero: string = String(entrega.proforma?.numero || entrega.venta?.numero || entrega.numero || `#${entrega.id}`);

    const handleGenerarReporte = async () => {
        setIsGeneratingReport(true);
        setReportError(null);

        try {
            const response = await fetch('/api/reportes-carga', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    entrega_id: entrega.id,
                    vehiculo_id: entrega.vehiculo_id,
                    peso_total_kg: entrega.peso_kg,
                    descripcion: `Reporte de carga para entrega #${entrega.id}`,
                }),
            });

            if (!response.ok) {
                let errorMsg = 'Error generando reporte';
                try {
                    const errorData = await response.json();
                    errorMsg = errorData.message || errorMsg;
                } catch {
                    errorMsg = `Error del servidor (${response.status})`;
                }
                setReportError(errorMsg);
                throw new Error(errorMsg);
            }

            const result = await response.json();

            // Actualizar el estado de la entrega
            setEntrega((prev) => ({
                ...prev,
                reporte_carga_id: result.data?.id,
                estado: 'PREPARACION_CARGA',
            }));
        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Error desconocido';
            console.error('Error generando reporte:', msg);
            setReportError(msg);
        } finally {
            setIsGeneratingReport(false);
        }
    };

    /**
     * Descargar PDF del reporte
     */
    const handleDescargarPdf = async (reporteId: number, detallado: boolean = false) => {
        try {
            const pdfLoadingState = detallado ? setLoadingPdfDetallado : setLoadingPdf;
            pdfLoadingState(reporteId);

            const endpoint = detallado
                ? `/api/reportes-carga/${reporteId}/pdf-detallado`
                : `/api/reportes-carga/${reporteId}/pdf`;

            const response = await fetch(endpoint);

            if (!response.ok) {
                throw new Error(`Error descargando PDF (${response.status})`);
            }

            // Crear blob y descargar
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-${entrega.reportes?.[0]?.numero_reporte || 'carga'}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error descargando PDF:', error);
            alert('Error descargando PDF. Intenta de nuevo.');
        } finally {
            detallado ? setLoadingPdfDetallado(null) : setLoadingPdf(null);
        }
    };

    /**
     * Ver vista previa del PDF en navegador
     */
    const handleVerPdfPreview = async (reporteId: number) => {
        try {
            window.open(
                `/api/reportes-carga/${reporteId}/pdf-preview`,
                '_blank',
                'width=1000,height=700'
            );
        } catch (error) {
            console.error('Error abriendo vista previa:', error);
            alert('Error abriendo vista previa. Intenta de nuevo.');
        }
    };

    /**
     * Imprimir reporte (abre diálogo de impresión del navegador)
     */
    const handleImprimirReporte = async (reporteId: number) => {
        try {
            setLoadingPdf(reporteId);
            // Abre la vista previa y permite imprimir desde ahí
            const popup = window.open(
                `/api/reportes-carga/${reporteId}/pdf-preview`,
                'printWindow',
                'width=1000,height=700'
            );

            if (popup) {
                // Espera a que cargue el PDF
                setTimeout(() => {
                    popup.print();
                }, 1500);
            }
        } catch (error) {
            console.error('Error imprimiendo reporte:', error);
            alert('Error imprimiendo reporte. Intenta de nuevo.');
        } finally {
            setLoadingPdf(null);
        }
    };

    // Estados del nuevo flujo de carga
    const cargoFlowStates = [
        'PREPARACION_CARGA',
        'EN_CARGA',
        'LISTO_PARA_ENTREGA',
        'EN_TRANSITO',
        'ENTREGADO',
    ];

    const isInCargoFlow = cargoFlowStates.includes(entrega.estado);
    const estadoColors: Record<string, string> = {
        ...estadoBadgeColor,
        PREPARACION_CARGA: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200',
        EN_CARGA: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200',
        LISTO_PARA_ENTREGA: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200',
        RECHAZADO: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200',
    };

    return (
        <AppLayout>
            <Head title={`Entrega ${numero}`} />

            <div className="space-y-6 p-6 max-w-4xl mx-auto bg-white dark:bg-slate-950 min-h-screen">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit('/logistica/entregas')}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition"
                        >
                            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
                        </button>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Entrega {numero}</h1>
                            <p className="text-gray-500 dark:text-gray-400">Detalles de la entrega</p>
                        </div>
                    </div>
                    <Badge className={(estadoColorMap[entrega.estado as string] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100') as string}>
                        {getEstadoLabel(entrega.estado)}
                    </Badge>
                    {/* Selector de Formato de Impresión */}
                    <FormatoSelector
                        documentoId={entrega.reporte_carga_id}
                        tipoDocumento="reportes-carga"
                        className="w-full sm:w-auto"
                    />
                </div>

                {/* Main Content */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                    {/* Client Information */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Package className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Información del Cliente
                        </h2>
                        <div className="space-y-3">
                            {cliente ? (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Cliente</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{cliente.nombre ?? 'N/A'}</p>
                                </div>
                            ) : null}
                            {entrega.venta ? (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Venta</p>
                                    <p className="font-medium text-gray-900 dark:text-white">#{entrega.venta.numero}</p>
                                </div>
                            ) : null}
                            {entrega.proforma ? (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Proforma</p>
                                    <p className="font-medium text-gray-900 dark:text-white">#{entrega.proforma.numero}</p>
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {/* Dates Information */}
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <Calendar className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Fechas
                        </h2>
                        <div className="space-y-3">
                            {entrega.fecha_programada && (
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha Programada</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
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
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Fecha de Entrega</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
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
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                Conductor
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Nombre</p>
                                    <p className="font-medium text-gray-900 dark:text-white">{entrega.chofer.nombre}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Vehicle Information */}
                    {entrega.vehiculo && (
                        <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                                <MapPin className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                                Vehículo
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Placa</p>
                                    <p className="font-medium text-lg text-gray-900 dark:text-white">{entrega.vehiculo.placa}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">Modelo</p>
                                    <p className="font-medium text-gray-900 dark:text-white">
                                        {entrega.vehiculo.marca} {entrega.vehiculo.modelo}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Reportes Asociados (Many-to-Many) */}
                {entrega.reportes && entrega.reportes.length > 0 && (
                    <div className="bg-white dark:bg-slate-900 rounded-lg border border-gray-200 dark:border-slate-700 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
                            <FileText className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                            Reportes Asociados
                        </h2>
                        <div className="space-y-4">
                            {entrega.reportes.map((reporte) => {
                                const pivot = entrega.reporteEntregas?.find(
                                    r => r.created_at === reporte.created_at
                                );
                                const otrasEntregas = reporte.entregas?.filter(e => e.id !== entrega.id) ?? [];

                                return (
                                    <div
                                        key={reporte.id}
                                        className="border border-gray-300 dark:border-slate-600 rounded-lg p-4 space-y-3"
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="font-semibold text-gray-900 dark:text-white">
                                                    Reporte #{reporte.numero_reporte}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                    {reporte.descripcion}
                                                </p>
                                            </div>
                                            <Badge
                                                className={
                                                    reporte.estado === 'PENDIENTE'
                                                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                                        : reporte.estado === 'CONFIRMADO'
                                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                                        : reporte.estado === 'ENTREGADO'
                                                        ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                                        : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-100'
                                                }
                                            >
                                                {reporte.estado}
                                            </Badge>
                                        </div>

                                        {/* Información de Pivot */}
                                        <div className="grid grid-cols-3 gap-4 text-sm">
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Orden en Reporte</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {pivot?.orden ?? 'N/A'}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Incluida en Carga</p>
                                                <p className="font-medium">
                                                    {pivot?.incluida_en_carga ? (
                                                        <span className="text-green-600 dark:text-green-400">✅ Sí</span>
                                                    ) : (
                                                        <span className="text-yellow-600 dark:text-yellow-400">⏳ Pendiente</span>
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-gray-500 dark:text-gray-400">Total Entregas</p>
                                                <p className="font-medium text-gray-900 dark:text-white">
                                                    {reporte.entregas?.length ?? 0}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Notas si existen */}
                                        {pivot?.notas && (
                                            <div className="bg-gray-50 dark:bg-slate-800 rounded p-3">
                                                <p className="text-sm text-gray-500 dark:text-gray-400">Notas</p>
                                                <p className="text-sm text-gray-900 dark:text-white">{pivot.notas}</p>
                                            </div>
                                        )}

                                        {/* Botones de Acciones - Imprimir y Descargar */}
                                        <div className="flex gap-2 flex-wrap pt-3 border-t border-gray-200 dark:border-slate-600">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleImprimirReporte(reporte.id)}
                                                disabled={loadingPdf === reporte.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Printer className="w-4 h-4" />
                                                {loadingPdf === reporte.id ? 'Abriendo...' : 'Imprimir'}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDescargarPdf(reporte.id, false)}
                                                disabled={loadingPdf === reporte.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                {loadingPdf === reporte.id ? 'Descargando...' : 'PDF'}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleDescargarPdf(reporte.id, true)}
                                                disabled={loadingPdfDetallado === reporte.id}
                                                className="flex items-center gap-2"
                                            >
                                                <Download className="w-4 h-4" />
                                                {loadingPdfDetallado === reporte.id ? 'Descargando...' : 'PDF Detallado'}
                                            </Button>

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleVerPdfPreview(reporte.id)}
                                                className="flex items-center gap-2 ml-auto"
                                            >
                                                <Eye className="w-4 h-4" />
                                                Ver
                                            </Button>
                                        </div>

                                        {/* Otras entregas en el reporte */}
                                        {otrasEntregas.length > 0 && (
                                            <div className="bg-blue-50 dark:bg-blue-900/20 rounded p-3 border border-blue-200 dark:border-blue-800">
                                                <p className="text-sm font-semibold text-blue-900 dark:text-blue-200 mb-2">
                                                    Otras entregas en este reporte:
                                                </p>
                                                <div className="space-y-2">
                                                    {otrasEntregas.map((otraEntrega, idx) => {
                                                        const ordenOtra = reporte.entregas?.findIndex(
                                                            e => e.id === otraEntrega.id
                                                        ) ?? -1;
                                                        return (
                                                            <div
                                                                key={otraEntrega.id}
                                                                className="text-sm text-blue-800 dark:text-blue-300 flex justify-between"
                                                            >
                                                                <span>
                                                                    #{ordenOtra + 1} - Entrega #{otraEntrega.numero_entrega}{' '}
                                                                    ({otraEntrega.venta?.cliente?.nombre})
                                                                </span>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}



                {/* Información del Lote - Entregas con mismo chofer y vehículo */}
                {entrega.chofer && entrega.vehiculo && (
                    <div className="bg-gradient-to-br from-purple-50 to-purple-50/50 dark:from-purple-900/20 dark:to-purple-900/10 rounded-lg border border-purple-200 dark:border-purple-800 p-6">
                        <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-purple-900 dark:text-purple-200">
                            <Package className="w-5 h-5" />
                            Contexto del Lote
                        </h2>
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Chofer Asignado</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">{entrega.chofer.nombre}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Vehículo</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        {entrega.vehiculo.placa}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Fecha Programada</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        {new Date(entrega.fecha_programada).toLocaleDateString('es-ES', {
                                            weekday: 'short',
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-purple-700 dark:text-purple-300">Peso Entrega</p>
                                    <p className="font-medium text-purple-900 dark:text-purple-100">
                                        {entrega.peso_kg ? `${entrega.peso_kg} kg` : 'N/A'}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white dark:bg-slate-800/50 rounded-lg p-4 mt-4">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
                                    ℹ️ Esta entrega es parte de un lote. Va en el mismo viaje que otros pedidos.
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    El reporte asociado contiene todas las entregas que viajan juntas. Ver sección de
                                    "Reportes Asociados" para más detalles.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Flujo de Carga - Mostrar si está en ese estado */}
                {isInCargoFlow && (
                    <div className="pt-4">
                        <EntregaFlujoCarga
                            entrega={entrega}
                            onStateChange={(newState) => {
                                setEntrega((prev) => ({
                                    ...prev,
                                    estado: newState as any,
                                }));
                            }}
                        />
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 justify-end pt-4">
                    <Button
                        variant="outline"
                        onClick={() => router.visit('/logistica/entregas')}
                        className="dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                    >
                        Volver
                    </Button>
                </div>
            </div>
        </AppLayout>
    );
}
