import { useState, useRef } from 'react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Card } from '@/presentation/components/ui/card';
import { Badge } from '@/presentation/components/ui/badge';
import { CheckCircle2, AlertCircle, MapPin, Camera, Phone, X, Image as ImageIcon } from 'lucide-react';
import logisticaService, { type Entrega } from '@/infrastructure/services/logistica.service';
import { toast } from 'react-toastify';

interface Venta {
    id: number;
    numero: string;
    cliente_id?: number;
    cliente?: {
        nombre: string;
    };
    estado_logistico_id?: number;
}

interface EntregaActionsModalProps {
    entrega: Entrega | null;
    venta?: Venta | null; // ✅ Venta específica a confirmar (opcional)
    isOpen: boolean;
    onClose: () => void;
    actionType: 'marcar-llegada' | 'confirmar-entrega' | 'reportar-novedad' | null;
    onSuccess?: () => void;
}

export function EntregaActionsModal({
    entrega,
    venta, // ✅ Venta opcional
    isOpen,
    onClose,
    actionType,
    onSuccess,
}: EntregaActionsModalProps) {
    const [loading, setLoading] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [fotos, setFotos] = useState<string[]>([]);
    const [firma, setFirma] = useState<string | null>(null);
    // ✅ Nuevos campos para contexto de entrega
    const [tiendaAbierta, setTiendaAbierta] = useState<boolean | null>(null);
    const [clientePresente, setClientePresente] = useState<boolean | null>(null);
    const [motivoRechazo, setMotivoRechazo] = useState<string | null>(null);
    // ✅ FASE 1: Campos para confirmación de pago
    const [estadoPago, setEstadoPago] = useState<string | null>(null);
    const [montoRecibido, setMontoRecibido] = useState('');
    const [tipoPagoId, setTipoPagoId] = useState<number | null>(null);
    const [motivoNoPago, setMotivoNoPago] = useState('');
    // ✅ FASE 2: Foto de comprobante
    const [fotoComprobante, setFotoComprobante] = useState<string | null>(null);
    // ✅ Tipos de pago cargados dinámicamente desde API
    const [tiposPago, setTiposPago] = useState<Array<{ id: number; codigo: string; nombre: string }>>([]);
    const [cargandoTiposPago, setCargandoTiposPago] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const fotoComprobanteInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    // ✅ Cargar tipos de pago al abrir el modal
    React.useEffect(() => {
        if (isOpen && actionType === 'confirmar-entrega') {
            cargarTiposPago();
        }
    }, [isOpen, actionType]);

    const cargarTiposPago = async () => {
        try {
            setCargandoTiposPago(true);
            const response = await fetch('/api/tipos-pago');
            const data = await response.json();
            if (data.success && data.data) {
                setTiposPago(data.data);
            }
        } catch (error) {
            console.error('Error cargando tipos de pago:', error);
        } finally {
            setCargandoTiposPago(false);
        }
    };

    // ✅ Opciones de motivos de rechazo
    const motivosRechazo = [
        { value: 'TIENDA_CERRADA', label: '🏪 Tienda Cerrada' },
        { value: 'CLIENTE_AUSENTE', label: '👤 Cliente Ausente' },
        { value: 'CLIENTE_RECHAZA', label: '🚫 Cliente Rechaza' },
        { value: 'DIRECCION_INCORRECTA', label: '📍 Dirección Incorrecta' },
        { value: 'CLIENTE_NO_IDENTIFICADO', label: '🆔 Cliente No Identificado' },
        { value: 'OTRO', label: '❓ Otro Motivo' },
    ];

    const estadosPago = [
        { value: 'PAGADO', label: '✅ Pagado Completo' },
        { value: 'PARCIAL', label: '⚠️ Pago Parcial' },
        { value: 'NO_PAGADO', label: '❌ No Pagado' },
    ];

    if (!entrega) return null;

    // ✅ Manejar múltiples fotos
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (máx 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La imagen no puede superar 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setFotos([...fotos, reader.result]);
                    toast.success(`Foto ${fotos.length + 1} cargada`);
                }
            };
            reader.readAsDataURL(file);
        }
        // Limpiar input para permitir cargar la misma foto otra vez
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    // ✅ Remover una foto del array
    const handleRemoveFoto = (index: number) => {
        setFotos(fotos.filter((_, i) => i !== index));
    };

    // ✅ FASE 2: Manejar foto de comprobante
    const handleFotoComprobanteChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Validar tamaño (máx 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error('La imagen no puede superar 5MB');
                return;
            }
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    setFotoComprobante(reader.result);
                    toast.success('Foto de comprobante cargada');
                }
            };
            reader.readAsDataURL(file);
        }
        // Limpiar input
        if (fotoComprobanteInputRef.current) {
            fotoComprobanteInputRef.current.value = '';
        }
    };

    // ✅ Manejo de firma digital (dibujo en canvas)
    const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.beginPath();
            ctx.moveTo(x, y);
        }
    };

    const handleCanvasMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (e.buttons !== 1) return; // Solo cuando el mouse está presionado

        const canvas = canvasRef.current;
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.lineWidth = 2;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.strokeStyle = '#000000';
            ctx.lineTo(x, y);
            ctx.stroke();
        }
    };

    const handleCanvasMouseUp = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.closePath();
            // Convertir canvas a base64 cuando suelte el mouse
            setFirma(canvas.toDataURL('image/png'));
        }
    };

    const handleMarcarLlegada = async () => {
        try {
            if (!navigator.geolocation) {
                toast.error('Geolocalización no disponible en este navegador');
                return;
            }

            setLoading(true);
            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    try {
                        await logisticaService.marcarLlegada(entrega.id, {
                            latitud: position.coords.latitude,
                            longitud: position.coords.longitude,
                        });
                        toast.success('Llegada marcada correctamente');
                        onClose();
                        onSuccess?.();
                    } catch (error) {
                        console.error('Error:', error);
                    } finally {
                        setLoading(false);
                    }
                },
                (error) => {
                    toast.error('No se pudo obtener la ubicación: ' + error.message);
                    setLoading(false);
                },
                { timeout: 10000 }
            );
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al marcar llegada');
            setLoading(false);
        }
    };

    const handleConfirmarEntrega = async () => {
        try {
            setLoading(true);

            // ✅ Si hay una venta específica, confirmar esa venta con nuevo contexto
            // Si no, confirmar toda la entrega (legacy)
            if (venta && venta.id) {
                await logisticaService.confirmarVentaEnEntrega(entrega.id, venta.id, {
                    firma_digital_base64: firma || undefined,
                    fotos: fotos.length > 0 ? fotos : undefined,
                    observaciones: observaciones || undefined,
                    // ✅ Nuevos campos de contexto
                    tienda_abierta: tiendaAbierta !== null ? tiendaAbierta : undefined,
                    cliente_presente: clientePresente !== null ? clientePresente : undefined,
                    motivo_rechazo: motivoRechazo || undefined,
                    // ✅ FASE 1: Campos de confirmación de pago
                    estado_pago: estadoPago || undefined,
                    monto_recibido: montoRecibido ? parseFloat(montoRecibido) : undefined,
                    tipo_pago_id: tipoPagoId || undefined,
                    motivo_no_pago: motivoNoPago || undefined,
                    // ✅ FASE 2: Foto de comprobante
                    foto_comprobante: fotoComprobante || undefined,
                });
                toast.success(`Venta #${venta.numero} entregada correctamente`);
            } else {
                await logisticaService.confirmarEntrega(entrega.id, {
                    firma_digital: firma || undefined,
                    fotos: fotos.length > 0 ? fotos : undefined,
                    observaciones: observaciones || undefined,
                });
                toast.success('Entrega confirmada correctamente');
            }

            onClose();
            onSuccess?.();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al confirmar');
        } finally {
            setLoading(false);
        }
    };

    const handleReportarNovedad = async () => {
        if (!motivo.trim()) {
            toast.error('El motivo es obligatorio');
            return;
        }

        try {
            setLoading(true);
            await logisticaService.reportarNovedad(entrega.id, {
                motivo,
                descripcion: descripcion || undefined,
                foto: fotos.length > 0 ? fotos[0] : undefined,
            });
            toast.success('Novedad reportada correctamente');
            onClose();
            onSuccess?.();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al reportar novedad');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setMotivo('');
        setDescripcion('');
        setObservaciones('');
        setFotos([]);
        setFirma(null);
        // ✅ Resetear campos de contexto
        setTiendaAbierta(null);
        setClientePresente(null);
        setMotivoRechazo(null);
        // ✅ Resetear campos de pago
        setEstadoPago(null);
        setMontoRecibido('');
        setTipoPagoId(null);
        setMotivoNoPago('');
        // ✅ FASE 2: Resetear foto de comprobante
        setFotoComprobante(null);
        onClose();
    };

    const getTitle = () => {
        switch (actionType) {
            case 'marcar-llegada':
                return 'Marcar Llegada';
            case 'confirmar-entrega':
                // ✅ Mostrar si es venta o entrega en el título
                return venta ? `Confirmar Entrega de Venta #${venta.id}` : 'Confirmar Entrega';
            case 'reportar-novedad':
                return 'Reportar Novedad';
            default:
                return '';
        }
    };

    const getDescription = () => {
        switch (actionType) {
            case 'marcar-llegada':
                return 'Confirma que has llegado al destino';
            case 'confirmar-entrega':
                // ✅ Descripción específica para venta o entrega
                return venta
                    ? `Confirma la entrega de la venta #${venta.numero} al cliente`
                    : 'Completa la entrega con firma y fotos';
            case 'reportar-novedad':
                return 'Reporta un problema con la entrega';
            default:
                return '';
        }
    };

    return (
        <AlertDialog open={isOpen} onOpenChange={handleClose}>
            <AlertDialogContent className="max-w-2xl">
                <AlertDialogHeader>
                    <AlertDialogTitle className="flex items-center gap-2">
                        {actionType === 'marcar-llegada' && <MapPin className="text-orange-500" />}
                        {actionType === 'confirmar-entrega' && <CheckCircle2 className="text-green-500" />}
                        {actionType === 'reportar-novedad' && <AlertCircle className="text-red-500" />}
                        {getTitle()}
                    </AlertDialogTitle>
                    <AlertDialogDescription>{getDescription()}</AlertDialogDescription>
                </AlertDialogHeader>

                <div className="space-y-4 py-4">
                    {/* Información de la entrega y venta */}
                    <Card className="p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Entrega ID</p>
                                <p className="font-semibold">#{entrega.id}</p>
                            </div>
                            {/* ✅ Mostrar ID de venta si está disponible */}
                            {venta && (
                                <div>
                                    <p className="text-gray-600">Venta ID</p>
                                    <p className="font-semibold">#{venta.id}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-gray-600">Estado</p>
                                <Badge>{entrega.estado}</Badge>
                            </div>
                            {/* ✅ Mostrar número de venta si está disponible */}
                            {venta && (
                                <div>
                                    <p className="text-gray-600">Venta #</p>
                                    <p className="font-semibold">{venta.numero}</p>
                                </div>
                            )}
                            <div className="col-span-2">
                                <p className="text-gray-600">Dirección</p>
                                <p className="font-semibold">{entrega.direccion || 'No disponible'}</p>
                            </div>
                            {/* ✅ Mostrar cliente si está disponible */}
                            {venta?.cliente && (
                                <div className="col-span-2">
                                    <p className="text-gray-600">Cliente</p>
                                    <p className="font-semibold">{venta.cliente.nombre || 'No disponible'}</p>
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Marcar Llegada */}
                    {actionType === 'marcar-llegada' && (
                        <div className="space-y-2">
                            <p className="text-sm text-gray-600">
                                Se enviará tu ubicación actual al servidor
                            </p>
                            <p className="text-xs text-gray-500">
                                Asegúrate de tener habilitado el GPS para mayor precisión
                            </p>
                        </div>
                    )}

                    {/* Confirmar Entrega */}
                    {actionType === 'confirmar-entrega' && (
                        <div className="space-y-4">
                            {/* ✅ Contexto de entrega */}
                            <Card className="p-4 bg-blue-50 border-blue-200">
                                <h3 className="text-sm font-semibold mb-3 text-blue-900">Contexto de Entrega</h3>

                                <div className="space-y-3">
                                    {/* Tienda abierta */}
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="tienda-abierta"
                                            checked={tiendaAbierta === true}
                                            onChange={(e) => setTiendaAbierta(e.target.checked ? true : null)}
                                            className="w-4 h-4 cursor-pointer rounded"
                                        />
                                        <label htmlFor="tienda-abierta" className="text-sm cursor-pointer">
                                            ✅ Tienda abierta
                                        </label>
                                    </div>

                                    {/* Cliente presente */}
                                    <div className="flex items-center space-x-3">
                                        <input
                                            type="checkbox"
                                            id="cliente-presente"
                                            checked={clientePresente === true}
                                            onChange={(e) => setClientePresente(e.target.checked ? true : null)}
                                            className="w-4 h-4 cursor-pointer rounded"
                                        />
                                        <label htmlFor="cliente-presente" className="text-sm cursor-pointer">
                                            ✅ Cliente presente
                                        </label>
                                    </div>

                                    {/* Motivo de rechazo (solo si alguno de los anteriores es false) */}
                                    {(tiendaAbierta === false || clientePresente === false) && (
                                        <div>
                                            <label htmlFor="motivo-rechazo" className="block text-sm font-medium mb-2">
                                                Motivo de rechazo
                                            </label>
                                            <select
                                                id="motivo-rechazo"
                                                value={motivoRechazo || ''}
                                                onChange={(e) => setMotivoRechazo(e.target.value || null)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {motivosRechazo.map((motivo) => (
                                                    <option key={motivo.value} value={motivo.value}>
                                                        {motivo.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* ✅ FASE 1: Confirmación de Pago */}
                            <Card className="p-4 bg-blue-50 border-blue-200">
                                <h3 className="text-sm font-semibold mb-3 text-blue-900">💰 Confirmación de Pago</h3>

                                <div className="space-y-3">
                                    {/* Estado de Pago */}
                                    <div>
                                        <label className="block text-sm font-medium mb-2">
                                            Estado de Pago *
                                        </label>
                                        <div className="flex gap-4">
                                            {estadosPago.map((estado) => (
                                                <label key={estado.value} className="flex items-center space-x-2 cursor-pointer">
                                                    <input
                                                        type="radio"
                                                        name="estado-pago"
                                                        value={estado.value}
                                                        checked={estadoPago === estado.value}
                                                        onChange={(e) => {
                                                            setEstadoPago(e.target.value);
                                                            // Limpiar motivo_no_pago si es PAGADO
                                                            if (e.target.value === 'PAGADO') {
                                                                setMotivoNoPago('');
                                                            }
                                                        }}
                                                        className="w-4 h-4 cursor-pointer"
                                                    />
                                                    <span className="text-sm">{estado.label}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Monto Recibido */}
                                    <div>
                                        <label htmlFor="monto-recibido" className="block text-sm font-medium mb-2">
                                            Monto Recibido (Bs.) {estadoPago === 'PAGADO' && '*'}
                                        </label>
                                        <Input
                                            id="monto-recibido"
                                            type="number"
                                            step="0.01"
                                            placeholder="0.00"
                                            value={montoRecibido}
                                            onChange={(e) => setMontoRecibido(e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    {/* Tipo de Pago (cargado dinámicamente desde API) */}
                                    <div>
                                        <label htmlFor="tipo-pago" className="block text-sm font-medium mb-2">
                                            Tipo de Pago {estadoPago === 'PAGADO' && '*'}
                                        </label>
                                        {cargandoTiposPago ? (
                                            <div className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                                                <span className="text-gray-600">Cargando tipos de pago...</span>
                                            </div>
                                        ) : (
                                            <select
                                                id="tipo-pago"
                                                value={tipoPagoId || ''}
                                                onChange={(e) => setTipoPagoId(e.target.value ? parseInt(e.target.value) : null)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="">-- Seleccionar --</option>
                                                {tiposPago.map((tipo) => (
                                                    <option key={tipo.id} value={tipo.id}>
                                                        {tipo.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                    </div>

                                    {/* Motivo No Pago (condicional) */}
                                    {(estadoPago === 'NO_PAGADO' || estadoPago === 'PARCIAL') && (
                                        <div>
                                            <label htmlFor="motivo-no-pago" className="block text-sm font-medium mb-2">
                                                Motivo {estadoPago === 'NO_PAGADO' && '(Obligatorio)'}
                                            </label>
                                            <Textarea
                                                id="motivo-no-pago"
                                                placeholder="¿Por qué no pagó o por qué pagó parcial?"
                                                value={motivoNoPago}
                                                onChange={(e) => setMotivoNoPago(e.target.value)}
                                                className="h-16"
                                            />
                                        </div>
                                    )}
                                </div>
                            </Card>

                            {/* ✅ FASE 2: Foto de Comprobante (Opcional) */}
                            <Card className="p-4 bg-green-50 border-green-200">
                                <h3 className="text-sm font-semibold mb-3 text-green-900">
                                    📸 Foto de Comprobante (Opcional)
                                </h3>
                                <p className="text-xs text-gray-600 mb-3">
                                    Captura foto del dinero o comprobante de pago (Transferencia, Cheque)
                                </p>

                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fotoComprobanteInputRef}
                                    onChange={handleFotoComprobanteChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fotoComprobanteInputRef.current?.click()}
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    {fotoComprobante ? '✓ Foto cargada' : 'Capturar foto de comprobante'}
                                </Button>

                                {fotoComprobante && (
                                    <div className="mt-3">
                                        <img
                                            src={fotoComprobante}
                                            alt="Comprobante"
                                            className="w-full h-32 object-cover rounded border"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setFotoComprobante(null)}
                                            className="mt-2 w-full"
                                        >
                                            Remover foto
                                        </Button>
                                    </div>
                                )}
                            </Card>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Observaciones
                                </label>
                                <Textarea
                                    placeholder="Notas sobre la entrega..."
                                    value={observaciones}
                                    onChange={(e) => setObservaciones(e.target.value)}
                                    className="h-20"
                                />
                            </div>

                            {/* ✅ Fotos - Soporte para múltiples */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Camera className="inline mr-2 h-4 w-4" />
                                    Fotos de entrega ({fotos.length})
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <Camera className="mr-2 h-4 w-4" />
                                    {fotos.length === 0 ? 'Añadir foto' : 'Añadir otra foto'}
                                </Button>

                                {/* Vista previa de fotos */}
                                {fotos.length > 0 && (
                                    <div className="mt-3 grid grid-cols-2 gap-2">
                                        {fotos.map((foto, index) => (
                                            <div key={index} className="relative group">
                                                <img
                                                    src={foto}
                                                    alt={`Foto ${index + 1}`}
                                                    className="w-full h-24 object-cover rounded border border-gray-300"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleRemoveFoto(index)}
                                                    className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                                                    title="Remover foto"
                                                >
                                                    <X className="h-4 w-4" />
                                                </button>
                                                <span className="absolute bottom-1 left-1 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                                    {index + 1}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Firma digital (opcional)
                                </label>
                                <canvas
                                    ref={canvasRef}
                                    className="border-2 border-dashed border-gray-300 rounded w-full h-24 cursor-crosshair bg-white"
                                    width={500}
                                    height={100}
                                    onMouseDown={handleCanvasMouseDown}
                                    onMouseMove={handleCanvasMouseMove}
                                    onMouseUp={handleCanvasMouseUp}
                                    onMouseLeave={handleCanvasMouseUp}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                        const canvas = canvasRef.current;
                                        if (canvas) {
                                            const ctx = canvas.getContext('2d');
                                            if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
                                            setFirma(null);
                                        }
                                    }}
                                    className="mt-2"
                                >
                                    Limpiar firma
                                </Button>
                                {firma && (
                                    <p className="text-xs text-green-600 mt-2">✓ Firma capturada</p>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Reportar Novedad */}
                    {actionType === 'reportar-novedad' && (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Motivo *
                                </label>
                                <Input
                                    placeholder="Ej: Cliente ausente, Dirección incorrecta"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Descripción (opcional)
                                </label>
                                <Textarea
                                    placeholder="Detalles adicionales..."
                                    value={descripcion}
                                    onChange={(e) => setDescripcion(e.target.value)}
                                    className="h-20"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Camera className="inline mr-2 h-4 w-4" />
                                    Foto de evidencia (opcional)
                                </label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    ref={fileInputRef}
                                    onChange={(e) => handleFileChange(e, setFoto)}
                                />
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {foto ? '✓ Foto cargada' : 'Seleccionar foto'}
                                </Button>
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex gap-2 justify-end">
                    <AlertDialogCancel disabled={loading}>
                        Cancelar
                    </AlertDialogCancel>
                    <AlertDialogAction
                        onClick={(e) => {
                            e.preventDefault();
                            if (actionType === 'marcar-llegada') {
                                handleMarcarLlegada();
                            } else if (actionType === 'confirmar-entrega') {
                                handleConfirmarEntrega();
                            } else if (actionType === 'reportar-novedad') {
                                handleReportarNovedad();
                            }
                        }}
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        {loading ? 'Procesando...' : 'Confirmar'}
                    </AlertDialogAction>
                </div>
            </AlertDialogContent>
        </AlertDialog>
    );
}
