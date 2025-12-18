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
import { CheckCircle2, AlertCircle, MapPin, Camera, Phone } from 'lucide-react';
import logisticaService, { type Entrega } from '@/infrastructure/services/logistica.service';
import { toast } from 'react-toastify';

interface EntregaActionsModalProps {
    entrega: Entrega | null;
    isOpen: boolean;
    onClose: () => void;
    actionType: 'marcar-llegada' | 'confirmar-entrega' | 'reportar-novedad' | null;
    onSuccess?: () => void;
}

export function EntregaActionsModal({
    entrega,
    isOpen,
    onClose,
    actionType,
    onSuccess,
}: EntregaActionsModalProps) {
    const [loading, setLoading] = useState(false);
    const [motivo, setMotivo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [foto, setFoto] = useState<string | null>(null);
    const [firma, setFirma] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    if (!entrega) return null;

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = () => {
                if (typeof reader.result === 'string') {
                    callback(reader.result);
                }
            };
            reader.readAsDataURL(file);
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
            await logisticaService.confirmarEntrega(entrega.id, {
                firma_digital: firma || undefined,
                fotos: foto ? [foto] : undefined,
                observaciones: observaciones || undefined,
            });
            toast.success('Entrega confirmada correctamente');
            onClose();
            onSuccess?.();
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al confirmar entrega');
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
                foto: foto || undefined,
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
        setFoto(null);
        setFirma(null);
        onClose();
    };

    const getTitle = () => {
        switch (actionType) {
            case 'marcar-llegada':
                return 'Marcar Llegada';
            case 'confirmar-entrega':
                return 'Confirmar Entrega';
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
                return 'Completa la entrega con firma y fotos';
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
                    {/* Información de la entrega */}
                    <Card className="p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-gray-600">Entrega ID</p>
                                <p className="font-semibold">#{entrega.id}</p>
                            </div>
                            <div>
                                <p className="text-gray-600">Estado</p>
                                <Badge>{entrega.estado}</Badge>
                            </div>
                            <div className="col-span-2">
                                <p className="text-gray-600">Dirección</p>
                                <p className="font-semibold">{entrega.direccion || 'No disponible'}</p>
                            </div>
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

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    <Camera className="inline mr-2 h-4 w-4" />
                                    Foto de entrega
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

                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Firma digital (opcional)
                                </label>
                                <canvas
                                    ref={canvasRef}
                                    className="border-2 border-dashed border-gray-300 rounded w-full h-24 cursor-crosshair"
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
                                        }
                                    }}
                                    className="mt-2"
                                >
                                    Limpiar
                                </Button>
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
