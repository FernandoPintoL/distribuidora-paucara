import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Textarea } from '@/presentation/components/ui/textarea';
import { ArrowLeft } from 'lucide-react';

interface ModuloSidebar {
    id: number;
    titulo: string;
    ruta: string;
    icono?: string;
    descripcion?: string;
    orden: number;
    activo: boolean;
    es_submenu: boolean;
    modulo_padre_id?: number;
    categoria?: string;
    permisos?: string;
    color?: string;
    visible_dashboard: boolean;
}

interface Props {
    modulo?: ModuloSidebar;
    modulosPadre: ModuloSidebar[];
}

const iconosDisponibles = [
    'Package', 'Boxes', 'Users', 'Truck', 'Wallet', 'CreditCard',
    'ShoppingCart', 'TrendingUp', 'BarChart3', 'Settings',
    'FolderTree', 'Tags', 'Ruler', 'DollarSign', 'Building2',
    'ClipboardList', 'Home', 'FileText', 'Calculator', 'Archive',
    'Activity', 'AlertCircle', 'Bell', 'Calendar', 'Camera',
    'Check', 'Clock', 'Cloud', 'Database', 'Download'
];

export default function Form({ modulo, modulosPadre }: Props) {
    const { data, setData, post, put, processing, errors } = useForm({
        titulo: modulo?.titulo || '',
        ruta: modulo?.ruta || '',
        icono: modulo?.icono || '',
        descripcion: modulo?.descripcion || '',
        orden: modulo?.orden || 1,
        activo: modulo?.activo ?? true,
        es_submenu: modulo?.es_submenu || false,
        modulo_padre_id: modulo?.modulo_padre_id?.toString() || '',
        categoria: modulo?.categoria || '',
        permisos: modulo?.permisos || '',
        color: modulo?.color || '',
        visible_dashboard: modulo?.visible_dashboard ?? true,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (modulo) {
            put(`/modulos-sidebar/${modulo.id}`, {
                onSuccess: () => window.history.back(),
            });
        } else {
            post('/modulos-sidebar', {
                onSuccess: () => window.history.back(),
            });
        }
    };

    return (
        <AppLayout>
            <Head title={modulo ? 'Editar Módulo' : 'Crear Módulo'} />

            <div className="space-y-6">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" onClick={() => window.history.back()}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Volver
                    </Button>
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            {modulo ? 'Editar Módulo' : 'Crear Nuevo Módulo'}
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            {modulo ? 'Modifica los datos del módulo' : 'Ingresa los datos del nuevo módulo'}
                        </p>
                    </div>
                </div>

                <Card className="max-w-2xl">
                    <CardHeader>
                        <CardTitle>Información del Módulo</CardTitle>
                        <CardDescription>
                            Complete los campos requeridos para {modulo ? 'actualizar' : 'crear'} el módulo
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="titulo">Título *</Label>
                                    <Input
                                        id="titulo"
                                        value={data.titulo}
                                        onChange={(e) => setData('titulo', e.target.value)}
                                        placeholder="Nombre del módulo"
                                        required
                                    />
                                    {errors.titulo && (
                                        <p className="text-sm text-red-600 mt-1">{errors.titulo}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="ruta">Ruta *</Label>
                                    <Input
                                        id="ruta"
                                        value={data.ruta}
                                        onChange={(e) => setData('ruta', e.target.value)}
                                        placeholder="/ruta-del-modulo"
                                        required
                                    />
                                    {errors.ruta && (
                                        <p className="text-sm text-red-600 mt-1">{errors.ruta}</p>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="icono">Ícono</Label>
                                    <Select value={data.icono} onValueChange={(value) => setData('icono', value)}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar ícono" />
                                        </SelectTrigger>
                                        <SelectContent className="max-h-60">
                                            {iconosDisponibles.map((icono) => (
                                                <SelectItem key={icono} value={icono}>
                                                    {icono}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label htmlFor="orden">Orden *</Label>
                                    <Input
                                        id="orden"
                                        type="number"
                                        value={data.orden}
                                        onChange={(e) => setData('orden', parseInt(e.target.value) || 1)}
                                        min="1"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <Label htmlFor="descripcion">Descripción</Label>
                                <Textarea
                                    id="descripcion"
                                    value={data.descripcion}
                                    onChange={(e) => setData('descripcion', e.target.value)}
                                    placeholder="Descripción opcional del módulo"
                                    rows={3}
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="categoria">Categoría</Label>
                                    <Input
                                        id="categoria"
                                        value={data.categoria}
                                        onChange={(e) => setData('categoria', e.target.value)}
                                        placeholder="Inventario, Comercial, etc."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="permisos">Permisos</Label>
                                    <Input
                                        id="permisos"
                                        value={data.permisos}
                                        onChange={(e) => setData('permisos', e.target.value)}
                                        placeholder="admin.config, ventas.create, etc."
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="color">Color (opcional)</Label>
                                    <Input
                                        id="color"
                                        type="color"
                                        value={data.color}
                                        onChange={(e) => setData('color', e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <input
                                        id="activo"
                                        type="checkbox"
                                        checked={data.activo}
                                        onChange={(e) => setData('activo', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="activo">Módulo activo</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        id="es_submenu"
                                        type="checkbox"
                                        checked={data.es_submenu}
                                        onChange={(e) => setData('es_submenu', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="es_submenu">Es submódulo</Label>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <input
                                        id="visible_dashboard"
                                        type="checkbox"
                                        checked={data.visible_dashboard}
                                        onChange={(e) => setData('visible_dashboard', e.target.checked)}
                                        className="rounded border-gray-300"
                                    />
                                    <Label htmlFor="visible_dashboard">Visible en dashboard</Label>
                                </div>
                            </div>

                            {data.es_submenu && (
                                <div>
                                    <Label htmlFor="modulo_padre_id">Módulo Padre *</Label>
                                    <Select
                                        value={data.modulo_padre_id}
                                        onValueChange={(value) => setData('modulo_padre_id', value)}
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
                                    {errors.modulo_padre_id && (
                                        <p className="text-sm text-red-600 mt-1">{errors.modulo_padre_id}</p>
                                    )}
                                </div>
                            )}

                            <div className="flex justify-end space-x-2 pt-6">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => window.history.back()}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Guardando...' : (modulo ? 'Actualizar' : 'Crear')}
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
