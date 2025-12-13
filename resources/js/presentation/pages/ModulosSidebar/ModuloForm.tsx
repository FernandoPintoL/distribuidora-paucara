import React from 'react';
import { ModuloSidebar, ModuloFormData } from '@/domain/modulos/types';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { PermisosMultiSelect } from '@/presentation/components/forms/permisos-multi-select';

const iconosDisponibles = [
    'Package', 'Boxes', 'Users', 'Truck', 'Wallet', 'CreditCard',
    'ShoppingCart', 'TrendingUp', 'BarChart3', 'Settings',
    'FolderTree', 'Tags', 'Ruler', 'DollarSign', 'Building2',
    'ClipboardList', 'Home', 'FileText', 'Calculator'
];

interface ModuloFormProps {
    data: ModuloFormData;
    errors: Record<string, string>;
    processing: boolean;
    onSubmit: (e: React.FormEvent) => void;
    onChange: (key: keyof ModuloFormData, value: any) => void;
    onCancel?: () => void;
    submitLabel: string;
    modulosPadre: ModuloSidebar[];
}

export function ModuloForm({
    data,
    errors,
    processing,
    onSubmit,
    onChange,
    onCancel,
    submitLabel,
    modulosPadre,
}: ModuloFormProps) {
    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div>
                <Label htmlFor="titulo">Título</Label>
                <Input
                    id="titulo"
                    value={data.titulo}
                    onChange={(e) => onChange('titulo', e.target.value)}
                    required
                />
                {errors.titulo && (
                    <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>
                )}
            </div>

            <div>
                <Label htmlFor="ruta">Ruta</Label>
                <Input
                    id="ruta"
                    value={data.ruta}
                    onChange={(e) => onChange('ruta', e.target.value)}
                    placeholder="/example"
                    required
                />
                {errors.ruta && (
                    <p className="text-sm text-red-600 mt-1">{errors.ruta}</p>
                )}
            </div>

            <div>
                <Label htmlFor="icono">Ícono</Label>
                <Select value={data.icono} onValueChange={(value) => onChange('icono', value)}>
                    <SelectTrigger>
                        <SelectValue placeholder="Seleccionar ícono" />
                    </SelectTrigger>
                    <SelectContent>
                        {iconosDisponibles.map((icono) => (
                            <SelectItem key={icono} value={icono}>
                                {icono}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div>
                <Label htmlFor="categoria">Categoría</Label>
                <Input
                    id="categoria"
                    value={data.categoria}
                    onChange={(e) => onChange('categoria', e.target.value)}
                    placeholder="Inventario, Comercial, etc."
                />
            </div>

            <div>
                <Label htmlFor="permisos">Permisos Requeridos</Label>
                <PermisosMultiSelect
                    value={data.permisos}
                    onChange={(permisos) => onChange('permisos', permisos)}
                    placeholder="Selecciona los permisos que pueden acceder a este módulo"
                    error={errors.permisos}
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Si dejas esto vacío, el módulo será visible para todos los usuarios.
                </p>
            </div>

            <div>
                <Label htmlFor="orden">Orden</Label>
                <Input
                    id="orden"
                    type="number"
                    value={data.orden}
                    onChange={(e) => onChange('orden', parseInt(e.target.value) || 1)}
                    min="1"
                    required
                />
            </div>

            <div className="flex items-center space-x-2">
                <input
                    id="es_submenu"
                    type="checkbox"
                    checked={data.es_submenu}
                    onChange={(e) => onChange('es_submenu', e.target.checked)}
                    className="rounded border-gray-300"
                />
                <Label htmlFor="es_submenu">Es submódulo</Label>
            </div>

            {data.es_submenu && (
                <div>
                    <Label htmlFor="modulo_padre_id">Módulo Padre</Label>
                    <Select
                        value={data.modulo_padre_id}
                        onValueChange={(value) => onChange('modulo_padre_id', value)}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Seleccionar módulo padre" />
                        </SelectTrigger>
                        <SelectContent>
                            {modulosPadre.map((modulo) => (
                                <SelectItem key={modulo.id} value={modulo.id.toString()}>
                                    {modulo.titulo}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            )}

            <div className="flex justify-end space-x-2">
                <Button
                    type="button"
                    variant="outline"
                    onClick={onCancel}
                >
                    Cancelar
                </Button>
                <Button type="submit" disabled={processing}>
                    {processing ? `${submitLabel}...` : submitLabel}
                </Button>
            </div>
        </form>
    );
}
