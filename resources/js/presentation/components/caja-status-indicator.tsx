'use client';

import React from 'react';
import { useCajaStatus } from '@/application/hooks/use-caja-status';
import { AlertCircle, CheckCircle, Clock } from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/presentation/components/ui/dropdown-menu';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';

/**
 * Componente: CajaStatusIndicator
 *
 * Responsabilidades:
 * ✅ Mostrar estado de caja en tiempo real
 * ✅ Indicador visual: Verde (abierta) / Rojo (cerrada)
 * ✅ Mostrar número de caja y monto actual
 * ✅ Botones rápidos: Abrir caja, Ver cajas
 * ✅ Accesible desde cualquier página
 *
 * Ubicación: Header principal de la aplicación
 */
export function CajaStatusIndicator() {
    const { tieneCapaAbierta, cajaActual, abrirCaja, irACajas } = useCajaStatus();

    // Si no hay caja abierta
    if (!tieneCapaAbierta) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        <Badge variant="destructive">Sin Caja</Badge>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-red-500" />
                        Sin Caja Abierta
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <p className="px-2 py-2 text-xs text-muted-foreground">
                        Debes abrir una caja antes de realizar operaciones con dinero (ventas, compras, etc)
                    </p>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={abrirCaja} className="cursor-pointer">
                        <CheckCircle className="mr-2 h-4 w-4 text-green-600" />
                        <span>Abrir Caja</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={irACajas} className="cursor-pointer">
                        <Clock className="mr-2 h-4 w-4" />
                        <span>Ver todas las cajas</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        );
    }

    // Caja abierta
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <Badge variant="outline" className="bg-green-50">
                        Caja Abierta
                    </Badge>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    Caja Abierta
                </DropdownMenuLabel>
                <DropdownMenuSeparator />

                <div className="px-2 py-3 space-y-2 text-sm">
                    {cajaActual.numero && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Caja:</span>
                            <span className="font-medium">{cajaActual.numero}</span>
                        </div>
                    )}

                    {cajaActual.monto !== null && (
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Monto Actual:</span>
                            <span className="font-medium text-green-600">
                                {new Intl.NumberFormat('es-BO', {
                                    style: 'currency',
                                    currency: 'BOB',
                                }).format(cajaActual.monto)}
                            </span>
                        </div>
                    )}
                </div>

                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={irACajas} className="cursor-pointer">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>Gestionar cajas</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
