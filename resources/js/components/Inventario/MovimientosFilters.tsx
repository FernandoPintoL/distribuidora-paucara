// Presentation Layer: MovimientosFilters Component
// Componente de filtros para movimientos de inventario

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Search, Filter, X, Download } from 'lucide-react';
import type { MovimientoInventarioFilters, MovimientoTipo } from '@/domain/movimientos-inventario';
import { TIPOS_MOVIMIENTO, CATEGORIAS_MOVIMIENTO } from '@/domain/movimientos-inventario';
import { MovimientosInventarioService } from '@/services/movimientos-inventario.service';

interface MovimientosFiltersProps {
    filters: MovimientoInventarioFilters;
    almacenes?: Array<{ id: number; nombre: string }>;
    productos?: Array<{ id: number; nombre: string }>;
    usuarios?: Array<{ id: number; name: string }>;
}

export const MovimientosFilters: React.FC<MovimientosFiltersProps> = ({
    filters,
    almacenes = [],
    productos = [],
    usuarios = []
}) => {
    const [localFilters, setLocalFilters] = useState<MovimientoInventarioFilters>(filters);
    const [showAdvanced, setShowAdvanced] = useState(false);
    const service = new MovimientosInventarioService();

    const handleFilterChange = (key: keyof MovimientoInventarioFilters, value: string | number | undefined) => {
        setLocalFilters(prev => ({ ...prev, [key]: value }));
    };

    const applyFilters = () => {
        service.searchMovimientos(localFilters);
    };

    const clearFilters = () => {
        const clearedFilters = {};
        setLocalFilters(clearedFilters);
        service.clearFilters();
    };

    const exportData = () => {
        service.export(localFilters);
    };

    const hasActiveFilters = Object.values(localFilters).some(value =>
        value !== undefined && value !== '' && value !== null
    );

    return (
        <Card>
            <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Filter className="w-5 h-5" />
                        Filtros de Movimientos
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowAdvanced(!showAdvanced)}
                        >
                            {showAdvanced ? 'Ocultar' : 'Mostrar'} filtros avanzados
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={exportData}
                            disabled={!hasActiveFilters}
                        >
                            <Download className="w-4 h-4 mr-1" />
                            Exportar
                        </Button>
                    </div>
                </CardTitle>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* Filtros básicos */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Búsqueda por documento */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Documento</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                            <Input
                                placeholder="Buscar por documento..."
                                value={localFilters.numero_documento || ''}
                                onChange={(e) => handleFilterChange('numero_documento', e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>

                    {/* Tipo de movimiento */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Tipo de Movimiento</label>
                        <Select
                            value={localFilters.tipo || ''}
                            onValueChange={(value) => handleFilterChange('tipo', value as MovimientoTipo)}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los tipos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todos los tipos</SelectItem>
                                {Object.entries(CATEGORIAS_MOVIMIENTO).map(([categoria, info]) => (
                                    <div key={categoria}>
                                        <div className="px-2 py-1 text-xs font-semibold text-gray-500 uppercase">
                                            {info.icon} {info.label}
                                        </div>
                                        {Object.entries(TIPOS_MOVIMIENTO)
                                            .filter(([, tipoInfo]) => tipoInfo.categoria === categoria)
                                            .map(([tipo, tipoInfo]) => (
                                                <SelectItem key={tipo} value={tipo}>
                                                    <div className="flex items-center gap-2">
                                                        <span>{tipoInfo.icon}</span>
                                                        <span>{tipoInfo.label}</span>
                                                    </div>
                                                </SelectItem>
                                            ))
                                        }
                                    </div>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Almacén */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Almacén</label>
                        <Select
                            value={localFilters.almacen_id?.toString() || ''}
                            onValueChange={(value) => handleFilterChange('almacen_id', value ? Number(value) : '')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los almacenes" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todos los almacenes</SelectItem>
                                {almacenes.map((almacen) => (
                                    <SelectItem key={almacen.id} value={almacen.id.toString()}>
                                        {almacen.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Producto */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Producto</label>
                        <Select
                            value={localFilters.producto_id?.toString() || ''}
                            onValueChange={(value) => handleFilterChange('producto_id', value ? Number(value) : '')}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Todos los productos" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="">Todos los productos</SelectItem>
                                {productos.map((producto) => (
                                    <SelectItem key={producto.id} value={producto.id.toString()}>
                                        {producto.nombre}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                {/* Filtros avanzados */}
                {showAdvanced && (
                    <div className="border-t pt-4 space-y-4">
                        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filtros Avanzados</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Rango de fechas */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha Inicio</label>
                                <Input
                                    type="date"
                                    value={localFilters.fecha_inicio || ''}
                                    onChange={(e) => handleFilterChange('fecha_inicio', e.target.value)}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium">Fecha Fin</label>
                                <Input
                                    type="date"
                                    value={localFilters.fecha_fin || ''}
                                    onChange={(e) => handleFilterChange('fecha_fin', e.target.value)}
                                />
                            </div>

                            {/* Usuario */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Usuario</label>
                                <Select
                                    value={localFilters.usuario_id?.toString() || ''}
                                    onValueChange={(value) => handleFilterChange('usuario_id', value ? Number(value) : '')}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los usuarios" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="">Todos los usuarios</SelectItem>
                                        {usuarios.map((usuario) => (
                                            <SelectItem key={usuario.id} value={usuario.id.toString()}>
                                                {usuario.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Botones de acción */}
                <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center gap-2">
                        <Button onClick={applyFilters}>
                            <Search className="w-4 h-4 mr-1" />
                            Buscar
                        </Button>

                        {hasActiveFilters && (
                            <Button variant="outline" onClick={clearFilters}>
                                <X className="w-4 h-4 mr-1" />
                                Limpiar
                            </Button>
                        )}
                    </div>

                    {hasActiveFilters && (
                        <div className="text-sm text-gray-500">
                            {Object.keys(localFilters).filter(key =>
                                localFilters[key as keyof MovimientoInventarioFilters] !== undefined &&
                                localFilters[key as keyof MovimientoInventarioFilters] !== '' &&
                                localFilters[key as keyof MovimientoInventarioFilters] !== null
                            ).length} filtros activos
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
};

export default MovimientosFilters;
