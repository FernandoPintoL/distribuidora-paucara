import React, { useState, useEffect } from 'react';
import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/presentation/components/ui/select';
import { Banknote, Send, CreditCard, Truck, Split, CheckCircle2 } from 'lucide-react';
import type { Proforma, PaymentData } from '@/domain/entities/proformas';
import type { CoordinacionData } from '@/application/hooks/use-proforma-actions';

interface TipoPago {
    id: number;
    codigo: string;
    nombre: string;
    activo: boolean;
}

interface ApprovalPaymentFormProps {
    proforma: Proforma;
    coordinacion: CoordinacionData;
    onCoordinacionChange: (data: CoordinacionData) => void;
    onSubmit: () => void;
    onCancel: () => void;
    isSubmitting: boolean;
}

export function ApprovalPaymentForm({
    proforma,
    coordinacion,
    onCoordinacionChange,
    onSubmit,
    onCancel,
    isSubmitting
}: ApprovalPaymentFormProps) {
    const [tiposPago, setTiposPago] = useState<TipoPago[]>([]);
    const [loadingTiposPago, setLoadingTiposPago] = useState(true);
    const [payment, setPayment] = useState<PaymentData>({
        con_pago: false,
        politica_pago: 'CONTRA_ENTREGA',
        monto_pagado: 0,
    });

    // Cargar tipos de pago al montar el componente
    useEffect(() => {
        fetch('/api/tipos-pago')
            .then(res => res.json())
            .then(data => {
                setTiposPago(data.data || []);
                // Establecer tipo de pago por defecto al primero activo
                const defaultTipo = data.data?.find((t: TipoPago) => t.activo);
                if (defaultTipo) {
                    setPayment(prev => ({ ...prev, tipo_pago_id: defaultTipo.id }));
                }
            })
            .catch(error => {
                console.error('Error al cargar tipos de pago:', error);
                // Fallback a opciones básicas si el endpoint falla
                setTiposPago([
                    { id: 1, codigo: 'EFECTIVO', nombre: 'Efectivo', activo: true },
                    { id: 2, codigo: 'TRANSFERENCIA', nombre: 'Transferencia', activo: true },
                ]);
            })
            .finally(() => setLoadingTiposPago(false));
    }, []);

    // Actualizar estado de coordinación cuando cambie el pago
    useEffect(() => {
        // 🔍 DEBUG
        console.log('%c🔄 ApprovalPaymentForm - Actualizando coordinacion con payment:', 'color: blue;');
        console.log('payment state:', payment);
        console.log('con_pago:', payment.con_pago);

        onCoordinacionChange({
            ...coordinacion,
            payment
        });
    }, [payment, onCoordinacionChange]);

    // Calcular monto mínimo requerido según política
    const getMinimumPayment = (): number => {
        if (payment.politica_pago === 'ANTICIPADO_100') return proforma.total;
        if (payment.politica_pago === 'MEDIO_MEDIO') return proforma.total / 2;
        return 0;
    };

    // Manejo de cambio de política
    const handlePolicyChange = (policy: string) => {
        setPayment(prev => ({
            ...prev,
            politica_pago: policy as any,
            // Resetear monto si es contra entrega
            monto_pagado: policy === 'CONTRA_ENTREGA' ? 0 : prev.monto_pagado
        }));
    };

    // Validar si el formulario de pago es válido
    const isPaymentValid = (): boolean => {
        // Si no hay pago, es válido
        if (!payment.con_pago) return true;

        // Si hay pago, debe haber tipo_pago_id
        if (!payment.tipo_pago_id) return false;

        // Validar monto según política
        const minPayment = getMinimumPayment();
        if (payment.monto_pagado === undefined || payment.monto_pagado < minPayment) {
            return false;
        }

        // No puede exceder el total
        if (payment.monto_pagado > proforma.total) {
            return false;
        }

        return true;
    };

    // Formatear moneda
    const formatCurrency = (value: number): string => {
        return new Intl.NumberFormat('es-BO', {
            style: 'currency',
            currency: 'BOB',
            minimumFractionDigits: 2
        }).format(value);
    };

    // Mapear código de pago a ícono
    const getPaymentIcon = (codigo: string) => {
        const iconProps = { className: 'w-4 h-4' };
        switch (codigo) {
            case 'EFECTIVO':
                return <Banknote {...iconProps} />;
            case 'TRANSFERENCIA':
                return <Send {...iconProps} />;
            case 'CREDITO':
                return <CreditCard {...iconProps} />;
            case 'TARJETA':
                return <CreditCard {...iconProps} />;
            default:
                return null;
        }
    };

    // Mapear política de pago a ícono
    const getPolicyIcon = (policy: string) => {
        const iconProps = { className: 'w-4 h-4' };
        switch (policy) {
            case 'CONTRA_ENTREGA':
                return <Truck {...iconProps} />;
            case 'MEDIO_MEDIO':
                return <Split {...iconProps} />;
            case 'ANTICIPADO_100':
                return <CheckCircle2 {...iconProps} />;
            default:
                return null;
        }
    };

    return (
        <div className="space-y-6 py-4">
            {/* Resumen de Coordinación de Entrega */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Resumen de Coordinación de Entrega</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Fecha confirmada:</span>
                        <span className="font-medium">{coordinacion.fecha_entrega_confirmada}</span>
                    </div>
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Hora confirmada:</span>
                        <span className="font-medium">
                            {coordinacion.hora_entrega_confirmada}
                            {coordinacion.hora_entrega_confirmada_fin && (
                                <> - {coordinacion.hora_entrega_confirmada_fin}</>
                            )}
                        </span>
                    </div>
                    {coordinacion.comentario_coordinacion && (
                        <div>
                            <span className="text-muted-foreground">Comentario:</span>
                            <p className="mt-1 text-foreground">{coordinacion.comentario_coordinacion}</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Sección de Verificación de Pago */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-sm font-medium">Verificación de Pago</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Checkbox: El cliente realizó un pago */}
                    <div className="flex items-center space-x-2">
                        <input
                            type="checkbox"
                            id="con_pago"
                            checked={payment.con_pago}
                            onChange={(e) => setPayment(prev => ({ ...prev, con_pago: e.target.checked }))}
                            disabled={isSubmitting}
                            className="h-4 w-4 rounded border-gray-300 cursor-pointer"
                        />
                        <Label
                            htmlFor="con_pago"
                            className="text-sm font-medium cursor-pointer"
                        >
                            El cliente realizó un pago (aprobar y convertir a venta automáticamente)
                        </Label>
                    </div>

                    {payment.con_pago && (
                        <>
                            {/* Método de Pago */}
                            <div className="space-y-2">
                                <Label htmlFor="tipo_pago" className="text-sm font-medium">
                                    Método de Pago *
                                </Label>
                                <Select
                                    value={payment.tipo_pago_id?.toString() || ''}
                                    onValueChange={(value) => setPayment(prev => ({
                                        ...prev,
                                        tipo_pago_id: parseInt(value) || undefined
                                    }))}
                                    disabled={isSubmitting || loadingTiposPago}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Seleccione método de pago" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover dark:bg-popover text-popover-foreground dark:text-popover-foreground border-input dark:border-input">
                                        {tiposPago.filter(t => t.activo).map(tipo => (
                                            <SelectItem
                                                key={tipo.id}
                                                value={tipo.id.toString()}
                                                className="cursor-pointer focus:bg-accent dark:focus:bg-accent focus:text-accent-foreground dark:focus:text-accent-foreground"
                                            >
                                                <div className="flex items-center gap-2">
                                                    {getPaymentIcon(tipo.codigo)}
                                                    <span>{tipo.nombre}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Política de Pago */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium">Política de Pago *</Label>
                                <div className="space-y-2">
                                    {/* Contra Entrega */}
                                    <label
                                        htmlFor="contra_entrega"
                                        className="flex items-center p-3 rounded-lg border-2 border-input cursor-pointer transition-all hover:bg-accent/5 dark:hover:bg-accent/10"
                                        style={{
                                            borderColor: payment.politica_pago === 'CONTRA_ENTREGA' ? 'var(--accent)' : undefined,
                                            backgroundColor: payment.politica_pago === 'CONTRA_ENTREGA' ? 'var(--accent)' : undefined
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            id="contra_entrega"
                                            name="politica_pago"
                                            value="CONTRA_ENTREGA"
                                            checked={payment.politica_pago === 'CONTRA_ENTREGA'}
                                            onChange={(e) => handlePolicyChange(e.target.value)}
                                            disabled={isSubmitting}
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                {getPolicyIcon('CONTRA_ENTREGA')}
                                                <span>Contra Entrega</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Pago al momento de recibir la mercadería
                                            </p>
                                        </div>
                                    </label>

                                    {/* 50% Anticipo */}
                                    <label
                                        htmlFor="medio_medio"
                                        className="flex items-center p-3 rounded-lg border-2 border-input cursor-pointer transition-all hover:bg-accent/5 dark:hover:bg-accent/10"
                                        style={{
                                            borderColor: payment.politica_pago === 'MEDIO_MEDIO' ? 'var(--accent)' : undefined,
                                            backgroundColor: payment.politica_pago === 'MEDIO_MEDIO' ? 'var(--accent)' : undefined
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            id="medio_medio"
                                            name="politica_pago"
                                            value="MEDIO_MEDIO"
                                            checked={payment.politica_pago === 'MEDIO_MEDIO'}
                                            onChange={(e) => handlePolicyChange(e.target.value)}
                                            disabled={isSubmitting}
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                {getPolicyIcon('MEDIO_MEDIO')}
                                                <span>50% Anticipo + 50% Contra Entrega</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Mitad ahora, mitad al recibir
                                            </p>
                                        </div>
                                    </label>

                                    {/* 100% Anticipado */}
                                    <label
                                        htmlFor="anticipado_100"
                                        className="flex items-center p-3 rounded-lg border-2 border-input cursor-pointer transition-all hover:bg-accent/5 dark:hover:bg-accent/10"
                                        style={{
                                            borderColor: payment.politica_pago === 'ANTICIPADO_100' ? 'var(--accent)' : undefined,
                                            backgroundColor: payment.politica_pago === 'ANTICIPADO_100' ? 'var(--accent)' : undefined
                                        }}
                                    >
                                        <input
                                            type="radio"
                                            id="anticipado_100"
                                            name="politica_pago"
                                            value="ANTICIPADO_100"
                                            checked={payment.politica_pago === 'ANTICIPADO_100'}
                                            onChange={(e) => handlePolicyChange(e.target.value)}
                                            disabled={isSubmitting}
                                            className="h-4 w-4 cursor-pointer"
                                        />
                                        <div className="ml-3 flex-1">
                                            <div className="flex items-center gap-2 font-medium text-sm">
                                                {getPolicyIcon('ANTICIPADO_100')}
                                                <span>100% Anticipado</span>
                                            </div>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                Pago completo por adelantado
                                            </p>
                                        </div>
                                    </label>
                                </div>
                            </div>

                            {/* Monto Pagado (condicional) */}
                            {payment.politica_pago !== 'CONTRA_ENTREGA' && (
                                <>
                                    <Alert>
                                        <AlertDescription>
                                            {payment.politica_pago === 'ANTICIPADO_100'
                                                ? `Se requiere pago completo: ${formatCurrency(proforma.total)}`
                                                : `Se requiere mínimo 50% de anticipo: ${formatCurrency(proforma.total / 2)}`
                                            }
                                        </AlertDescription>
                                    </Alert>

                                    <div className="space-y-2">
                                        <Label htmlFor="monto_pagado" className="text-sm font-medium">
                                            Monto Pagado (Bs.) *
                                        </Label>
                                        <Input
                                            type="number"
                                            id="monto_pagado"
                                            step="0.01"
                                            min="0"
                                            max={proforma.total}
                                            value={payment.monto_pagado || 0}
                                            onChange={(e) => setPayment(prev => ({
                                                ...prev,
                                                monto_pagado: parseFloat(e.target.value) || 0
                                            }))}
                                            disabled={isSubmitting}
                                            className={
                                                (payment.monto_pagado < getMinimumPayment() ||
                                                payment.monto_pagado > proforma.total) && payment.monto_pagado > 0
                                                    ? 'border-red-500'
                                                    : ''
                                            }
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            Total de la proforma: {formatCurrency(proforma.total)}
                                        </p>
                                    </div>

                                    {/* Fecha de Pago */}
                                    <div className="space-y-2">
                                        <Label htmlFor="fecha_pago" className="text-sm font-medium">
                                            Fecha de Pago
                                        </Label>
                                        <Input
                                            type="date"
                                            id="fecha_pago"
                                            value={payment.fecha_pago || new Date().toISOString().split('T')[0]}
                                            onChange={(e) => setPayment(prev => ({ ...prev, fecha_pago: e.target.value }))}
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {/* Referencias de Pago */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="numero_recibo" className="text-sm font-medium">
                                                Número de Recibo
                                            </Label>
                                            <Input
                                                type="text"
                                                id="numero_recibo"
                                                placeholder="Ej: REC-001"
                                                value={payment.numero_recibo || ''}
                                                onChange={(e) => setPayment(prev => ({ ...prev, numero_recibo: e.target.value }))}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor="numero_transferencia" className="text-sm font-medium">
                                                Número de Transferencia
                                            </Label>
                                            <Input
                                                type="text"
                                                id="numero_transferencia"
                                                placeholder="Ej: TRANS-12345"
                                                value={payment.numero_transferencia || ''}
                                                onChange={(e) => setPayment(prev => ({ ...prev, numero_transferencia: e.target.value }))}
                                                disabled={isSubmitting}
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Mensajes de Validación */}
                            {payment.monto_pagado < getMinimumPayment() && payment.monto_pagado > 0 && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        El monto pagado es menor al mínimo requerido para la política seleccionada
                                    </AlertDescription>
                                </Alert>
                            )}

                            {payment.monto_pagado > proforma.total && (
                                <Alert variant="destructive">
                                    <AlertDescription>
                                        El monto pagado no puede exceder el total de la proforma
                                    </AlertDescription>
                                </Alert>
                            )}
                        </>
                    )}
                </CardContent>
            </Card>

            {/* Botones de Acción */}
            <div className="flex justify-end gap-2 pt-4">
                <Button
                    variant="outline"
                    onClick={onCancel}
                    disabled={isSubmitting}
                >
                    Cancelar
                </Button>
                <Button
                    onClick={onSubmit}
                    disabled={isSubmitting || !isPaymentValid()}
                    className="bg-green-600 hover:bg-green-700 text-white"
                >
                    {isSubmitting
                        ? (payment.con_pago ? 'Aprobando y Convirtiendo...' : 'Aprobando...')
                        : (payment.con_pago ? 'Aprobar y Convertir a Venta' : 'Aprobar')
                    }
                </Button>
            </div>
        </div>
    );
}
