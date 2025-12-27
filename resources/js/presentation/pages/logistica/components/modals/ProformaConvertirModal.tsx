import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/presentation/components/ui/alert-dialog';

interface ProformaConvertirModalProps {
    isOpen: boolean;
    onClose: () => void;
    proforma: any;
    onConvertir: () => void;
    isProcessing: boolean;
}

export function ProformaConvertirModal({
    isOpen,
    onClose,
    proforma,
    onConvertir,
    isProcessing,
}: ProformaConvertirModalProps) {
    if (!proforma) return null;

    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Convertir Proforma a Venta</AlertDialogTitle>
                    <AlertDialogDescription>
                        ¿Estás seguro de que deseas convertir la proforma {proforma.numero} a una venta?
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="space-y-3 text-sm text-foreground px-6">
                    <p>Esta acción:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                        <li>Crearán una nueva venta con los detalles de esta proforma</li>
                        <li>Consumirán el stock reservado de los productos</li>
                        <li>Generarán los números de serie correspondientes</li>
                        <li>Marcarán esta proforma como CONVERTIDA</li>
                    </ul>
                </div>
                <AlertDialogFooter>
                    <AlertDialogCancel disabled={isProcessing}>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                        onClick={onConvertir}
                        disabled={isProcessing}
                        className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                        {isProcessing ? 'Convirtiendo...' : 'Convertir a Venta'}
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
}
