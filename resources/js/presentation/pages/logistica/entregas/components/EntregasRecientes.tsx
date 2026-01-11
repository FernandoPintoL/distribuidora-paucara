import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Eye } from 'lucide-react';
import { useEffect } from 'react';
import type { EntregaReciente } from '@/application/hooks/use-entregas-dashboard-stats';
import { EntregaEstadoBadge } from '@/presentation/components/entrega/EntregaEstadoBadge';
import { LoadingState } from '@/presentation/components/entrega/LoadingState';

interface EntregasRecientesProps {
    entregas: EntregaReciente[];
    loading: boolean;
    onVerEntrega?: (entregaId: number) => void;
}

export function EntregasRecientes({
    entregas,
    loading,
    onVerEntrega,
}: EntregasRecientesProps) {
    // ✅ DEBUG: Verificar datos de entregas recientes
    useEffect(() => {
        if (entregas && entregas.length > 0) {
            console.log('📋 [EntregasRecientes] Entregas recibidas:', {
                cantidad: entregas.length,
                entregas: entregas.map(e => ({
                    id: e.id,
                    estado: e.estado,
                    cliente_nombre: e.cliente_nombre,
                    chofer_nombre: e.chofer_nombre,
                })),
            });
        }
    }, [entregas]);

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Entregas Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <LoadingState variant="card" count={5} />
                </CardContent>
            </Card>
        );
    }

    if (!entregas || entregas.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">
                        Entregas Recientes
                    </CardTitle>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-8">
                    No hay entregas recientes
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-sm font-medium">
                    Entregas Recientes (Últimas 10)
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-2">
                    {entregas.map((entrega) => (
                            <div
                                key={entrega.id}
                                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-medium text-sm">
                                            #{entrega.id}
                                        </span>
                                        <EntregaEstadoBadge estado={entrega.estado} />
                                    </div>
                                    <p className="text-xs text-muted-foreground truncate">
                                        {entrega.cliente_nombre}
                                    </p>
                                    <div className="flex gap-4 text-xs text-muted-foreground mt-1">
                                        <span>Chofer: {entrega.chofer_nombre}</span>
                                        <span>Vehículo: {entrega.vehiculo_placa}</span>
                                        <span>Peso: {entrega.peso_kg} kg</span>
                                    </div>
                                    {entrega.fecha_entrega && (
                                        <div className="text-xs text-muted-foreground mt-1">
                                            Entregado: {entrega.fecha_entrega}
                                        </div>
                                    )}
                                </div>
                                {onVerEntrega && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onVerEntrega(entrega.id)}
                                        className="ml-2 flex-shrink-0"
                                    >
                                        <Eye className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        )
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
