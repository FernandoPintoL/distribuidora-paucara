import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/presentation/components/ui/dialog';
import { Button } from '@/presentation/components/ui/button';
import { Textarea } from '@/presentation/components/ui/textarea';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import { Label } from '@/presentation/components/ui/label';
import { toast } from 'react-toastify';
import { router } from '@inertiajs/react';
import { AlertCircle } from 'lucide-react';

interface CancelarEntregaModalProps {
    isOpen: boolean;
    onClose: () => void;
    entrega?: {
        id: number;
        numero_entrega: string;
        estado: string;
    } | null;
}

export function CancelarEntregaModal({ isOpen, onClose, entrega }: CancelarEntregaModalProps) {
    const [motivo, setMotivo] = useState('');
    const [reabrirVentas, setReabrirVentas] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!entrega) return null;

    const handleCancel = () => {
        setMotivo('');
        setReabrirVentas(false);
        setError(null);
        onClose();
    };

    const handleSubmit = async () => {
        // Validar motivo
        if (!motivo.trim()) {
            setError('El motivo de cancelación es requerido');
            toast.error('Por favor ingresa el motivo de cancelación');
            return;
        }

        if (motivo.trim().length < 10) {
            setError('El motivo debe tener al menos 10 caracteres');
            toast.error('El motivo debe tener al menos 10 caracteres');
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/entregas/${entrega.id}/cancelar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                },
                body: JSON.stringify({
                    motivo: motivo.trim(),
                    reabrir_ventas: reabrirVentas,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || data.message || 'Error al cancelar la entrega');
            }

            toast.success('✅ Entrega cancelada exitosamente');

            // Limpiar estado
            setMotivo('');
            setReabrirVentas(false);
            setError(null);

            // Cerrar modal
            onClose();

            // Recargar página
            router.reload();
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Error desconocido';
            setError(message);
            toast.error(`❌ ${message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-red-600" />
                        Cancelar Entrega: {entrega.numero_entrega}
                    </DialogTitle>
                    <DialogDescription>
                        Estado actual: <span className="font-semibold">{entrega.estado}</span>
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    {/* Información de la entrega */}
                    <div className="bg-red-50 dark:bg-red-950/30 p-3 rounded-lg border border-red-200 dark:border-red-800">
                        <p className="text-sm text-red-800 dark:text-red-200">
                            ⚠️ Esta acción cancelará la entrega y desvinculará todas las ventas asociadas.
                        </p>
                    </div>

                    {/* Motivo */}
                    <div>
                        <Label htmlFor="motivo" className="text-sm font-medium mb-2 block">
                            Motivo de cancelación *
                        </Label>
                        <Textarea
                            id="motivo"
                            placeholder="Describe el motivo por el cual se cancela la entrega..."
                            value={motivo}
                            onChange={(e) => {
                                setMotivo(e.target.value);
                                setError(null);
                            }}
                            className="min-h-[100px]"
                            disabled={isSubmitting}
                        />
                        {error && (
                            <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                                {error}
                            </p>
                        )}
                    </div>

                    {/* Opción de reabrir ventas */}
                    <div className="flex items-center space-x-2 p-3 bg-blue-50 dark:bg-blue-950/30 rounded-lg border border-blue-200 dark:border-blue-800">
                        <Checkbox
                            id="reabrir_ventas"
                            checked={reabrirVentas}
                            onCheckedChange={(checked) => setReabrirVentas(checked as boolean)}
                            disabled={isSubmitting}
                        />
                        <Label htmlFor="reabrir_ventas" className="cursor-pointer text-sm">
                            <span className="font-medium">Reabrir ventas para reasignación</span>
                            <p className="text-xs text-muted-foreground mt-1">
                                Si marcas esta opción, las ventas volverán a estado PENDIENTE_ENVIO y podrán asignarse a otra entrega.
                            </p>
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="button"
                        variant="destructive"
                        onClick={handleSubmit}
                        disabled={isSubmitting || !motivo.trim()}
                    >
                        {isSubmitting ? 'Cancelando...' : 'Cancelar Entrega'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
