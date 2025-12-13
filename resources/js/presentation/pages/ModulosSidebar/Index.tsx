import React, { useState, useMemo } from 'react';
import { Head, useForm } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/presentation/components/ui/dialog';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { PermisosMultiSelect } from '@/presentation/components/forms/permisos-multi-select';
import { MatrizAccesoRol } from '@/presentation/components/matriz-acceso-rol';
import { ModulosFiltros, type FiltrosModulo } from '@/presentation/components/modulos-filtros';
import { ModulosVistaAgrupada } from '@/presentation/components/modulos-vista-agrupada';
import { LayoutList, Grid3x3 } from 'lucide-react';

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
    submodulos_count: number;
    padre?: {
        id: number;
        titulo: string;
    };
}

interface Props {
    modulos: ModuloSidebar[];
}

const iconosDisponibles = [
    'Package', 'Boxes', 'Users', 'Truck', 'Wallet', 'CreditCard',
    'ShoppingCart', 'TrendingUp', 'BarChart3', 'Settings',
    'FolderTree', 'Tags', 'Ruler', 'DollarSign', 'Building2',
    'ClipboardList', 'Home', 'FileText', 'Calculator'
];

export default function Index({ modulos }: Props) {
    const [selectedModulo, setSelectedModulo] = useState<ModuloSidebar | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [filtros, setFiltros] = useState<FiltrosModulo>({
        busqueda: '',
        tipo: 'todos',
        estado: 'todos',
        categoria: '',
        rolRequerido: '',
    });
    const [vistaActual, setVistaActual] = useState<'tabla' | 'agrupada'>('tabla');

    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm({
        titulo: '',
        ruta: '',
        icono: '',
        descripcion: '',
        orden: 1,
        activo: true,
        es_submenu: false,
        modulo_padre_id: '',
        categoria: '',
        visible_dashboard: true,
        permisos: [] as string[],
    });

    const handleCreate = (e: React.FormEvent) => {
        e.preventDefault();
        post('/modulos-sidebar', {
            onSuccess: () => {
                setIsCreateModalOpen(false);
                reset();
            },
        });
    };

    const handleEdit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedModulo) return;

        put(`/modulos-sidebar/${selectedModulo.id}`, {
            onSuccess: () => {
                setIsEditModalOpen(false);
                setSelectedModulo(null);
                reset();
            },
        });
    };

    const handleDelete = (modulo: ModuloSidebar) => {
        if (confirm(`¿Está seguro de eliminar el módulo "${modulo.titulo}"?`)) {
            destroy(`/modulos-sidebar/${modulo.id}`, {
                onSuccess: () => {
                    // Módulo eliminado
                },
            });
        }
    };

    const toggleActivo = (modulo: ModuloSidebar) => {
        fetch(`/modulos-sidebar/${modulo.id}/toggle-activo`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            },
        })
            .then(() => {
                window.location.reload();
            })
            .catch(() => {
                alert('Error al cambiar el estado del módulo');
            });
    };

    const openEditModal = (modulo: ModuloSidebar) => {
        setSelectedModulo(modulo);
        setData({
            titulo: modulo.titulo,
            ruta: modulo.ruta,
            icono: modulo.icono || '',
            descripcion: modulo.descripcion || '',
            orden: modulo.orden,
            activo: modulo.activo,
            es_submenu: modulo.es_submenu,
            modulo_padre_id: modulo.modulo_padre_id?.toString() || '',
            categoria: modulo.categoria || '',
            visible_dashboard: true,
            permisos: Array.isArray(modulo.permisos) ? modulo.permisos : [],
        });
        setIsEditModalOpen(true);
    };

    const modulosPadre = modulos.filter(m => !m.es_submenu);

    // Obtener categorías únicas
    const categorias = Array.from(
        new Set(modulos.filter(m => m.categoria).map(m => m.categoria))
    ).sort();

    // Obtener roles únicos de los permisos de módulos
    const rolesDisponibles = Array.from(
        new Set(
            modulos
                .flatMap(m => m.permisos || [])
                .filter(p => typeof p === 'string')
        )
    ).sort();

    // Lógica de filtrado
    const modulosFiltrados = useMemo(() => {
        return modulos.filter(modulo => {
            // Filtro por búsqueda (título o ruta)
            if (filtros.busqueda) {
                const busquedaLower = filtros.busqueda.toLowerCase();
                if (
                    !modulo.titulo.toLowerCase().includes(busquedaLower) &&
                    !modulo.ruta.toLowerCase().includes(busquedaLower)
                ) {
                    return false;
                }
            }

            // Filtro por tipo
            if (filtros.tipo !== 'todos') {
                if (filtros.tipo === 'principal' && modulo.es_submenu) {
                    return false;
                }
                if (filtros.tipo === 'submenu' && !modulo.es_submenu) {
                    return false;
                }
            }

            // Filtro por estado
            if (filtros.estado !== 'todos') {
                if (filtros.estado === 'activo' && !modulo.activo) {
                    return false;
                }
                if (filtros.estado === 'inactivo' && modulo.activo) {
                    return false;
                }
            }

            // Filtro por categoría
            if (filtros.categoria) {
                if (modulo.categoria !== filtros.categoria) {
                    return false;
                }
            }

            // Filtro por rol requerido
            if (filtros.rolRequerido) {
                const permisos = Array.isArray(modulo.permisos) ? modulo.permisos : [];
                if (!permisos.includes(filtros.rolRequerido)) {
                    return false;
                }
            }

            return true;
        });
    }, [modulos, filtros]);

    return (
        <AppLayout>
            <Head title="Gestión de Módulos del Sidebar" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
                            Gestión de Módulos del Sidebar
                        </h1>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                            Administra los módulos y submódulos del sidebar de la aplicación
                        </p>
                    </div>

                    <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Nuevo Módulo
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Crear Nuevo Módulo</DialogTitle>
                                <DialogDescription>
                                    Ingresa los datos del nuevo módulo del sidebar
                                </DialogDescription>
                            </DialogHeader>

                            <form onSubmit={handleCreate} className="space-y-4">
                                <div>
                                    <Label htmlFor="titulo">Título</Label>
                                    <Input
                                        id="titulo"
                                        value={data.titulo}
                                        onChange={(e) => setData('titulo', e.target.value)}
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
                                        onChange={(e) => setData('ruta', e.target.value)}
                                        placeholder="/example"
                                        required
                                    />
                                    {errors.ruta && (
                                        <p className="text-sm text-red-600 mt-1">{errors.ruta}</p>
                                    )}
                                </div>

                                <div>
                                    <Label htmlFor="icono">Ícono</Label>
                                    <Select onValueChange={(value) => setData('icono', value)}>
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
                                        onChange={(e) => setData('categoria', e.target.value)}
                                        placeholder="Inventario, Comercial, etc."
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="permisos">Permisos Requeridos</Label>
                                    <PermisosMultiSelect
                                        value={data.permisos}
                                        onChange={(permisos) => setData('permisos', permisos)}
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
                                        onChange={(e) => setData('orden', parseInt(e.target.value) || 1)}
                                        min="1"
                                        required
                                    />
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

                                {data.es_submenu && (
                                    <div>
                                        <Label htmlFor="modulo_padre_id">Módulo Padre</Label>
                                        <Select onValueChange={(value) => setData('modulo_padre_id', value)}>
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
                                        onClick={() => setIsCreateModalOpen(false)}
                                    >
                                        Cancelar
                                    </Button>
                                    <Button type="submit" disabled={processing}>
                                        {processing ? 'Creando...' : 'Crear'}
                                    </Button>
                                </div>
                            </form>
                        </DialogContent>
                    </Dialog>
                </div>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Módulos Registrados</CardTitle>
                            <CardDescription>
                                Total de módulos: {modulos.length}
                            </CardDescription>
                        </div>
                        <div className="flex gap-2">
                            <Button
                                variant={vistaActual === 'tabla' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setVistaActual('tabla')}
                                title="Vista de tabla"
                            >
                                <LayoutList className="h-4 w-4" />
                            </Button>
                            <Button
                                variant={vistaActual === 'agrupada' ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setVistaActual('agrupada')}
                                title="Vista agrupada por categoría"
                            >
                                <Grid3x3 className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <ModulosFiltros
                            categorias={categorias}
                            rolesDisponibles={rolesDisponibles}
                            filtros={filtros}
                            onChange={setFiltros}
                            totalResultados={modulosFiltrados.length}
                            totalModulos={modulos.length}
                        />

                        {/* Vista Tabla */}
                        {vistaActual === 'tabla' && (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Título</TableHead>
                                        <TableHead>Ruta</TableHead>
                                        <TableHead>Tipo</TableHead>
                                        <TableHead>Estado</TableHead>
                                        <TableHead>Orden</TableHead>
                                        <TableHead>Categoría</TableHead>
                                        <TableHead>Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {modulosFiltrados.map((modulo) => (
                                    <TableRow key={modulo.id}>
                                        <TableCell className="font-medium">
                                            {modulo.es_submenu && modulo.padre && (
                                                <span className="text-gray-500 mr-2">
                                                    └
                                                </span>
                                            )}
                                            {modulo.titulo}
                                        </TableCell>
                                        <TableCell className="text-sm text-gray-600">
                                            {modulo.ruta}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={modulo.es_submenu ? "secondary" : "default"}>
                                                {modulo.es_submenu ? 'Submódulo' : 'Principal'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleActivo(modulo)}
                                            >
                                                {modulo.activo ? (
                                                    <>
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        <Badge className="bg-green-100 text-green-800">Activo</Badge>
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-1" />
                                                        <Badge variant="secondary">Inactivo</Badge>
                                                    </>
                                                )}
                                            </Button>
                                        </TableCell>
                                        <TableCell>{modulo.orden}</TableCell>
                                        <TableCell>
                                            {modulo.categoria && (
                                                <Badge variant="outline">{modulo.categoria}</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => openEditModal(modulo)}
                                                >
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleDelete(modulo)}
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}

                        {/* Vista Agrupada por Categoría */}
                        {vistaActual === 'agrupada' && (
                            <ModulosVistaAgrupada
                                modulos={modulosFiltrados}
                                categorias={categorias}
                                onEdit={openEditModal}
                                onDelete={handleDelete}
                                onToggleActivo={toggleActivo}
                                procesando={processing}
                            />
                        )}

                        {/* Mensaje cuando no hay resultados */}
                        {modulosFiltrados.length === 0 && (
                            <div className="py-8 text-center">
                                <p className="text-gray-500 dark:text-gray-400 mb-2">
                                    {modulos.length === 0
                                        ? 'No hay módulos registrados'
                                        : 'No se encontraron módulos que coincidan con los filtros'}
                                </p>
                                {modulos.length > 0 && (
                                    <button
                                        onClick={() =>
                                            setFiltros({
                                                busqueda: '',
                                                tipo: 'todos',
                                                estado: 'todos',
                                                categoria: '',
                                                rolRequerido: '',
                                            })
                                        }
                                        className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
                                    >
                                        Limpiar todos los filtros
                                    </button>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Matriz de Acceso */}
                <MatrizAccesoRol />

                {/* Modal de Edición */}
                <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Editar Módulo</DialogTitle>
                            <DialogDescription>
                                Modifica los datos del módulo seleccionado
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleEdit} className="space-y-4">
                            <div>
                                <Label htmlFor="edit_titulo">Título</Label>
                                <Input
                                    id="edit_titulo"
                                    value={data.titulo}
                                    onChange={(e) => setData('titulo', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_ruta">Ruta</Label>
                                <Input
                                    id="edit_ruta"
                                    value={data.ruta}
                                    onChange={(e) => setData('ruta', e.target.value)}
                                    required
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_icono">Ícono</Label>
                                <Select value={data.icono} onValueChange={(value) => setData('icono', value)}>
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
                                <Label htmlFor="edit_categoria">Categoría</Label>
                                <Input
                                    id="edit_categoria"
                                    value={data.categoria}
                                    onChange={(e) => setData('categoria', e.target.value)}
                                />
                            </div>

                            <div>
                                <Label htmlFor="edit_permisos">Permisos Requeridos</Label>
                                <PermisosMultiSelect
                                    value={data.permisos}
                                    onChange={(permisos) => setData('permisos', permisos)}
                                    placeholder="Selecciona los permisos que pueden acceder a este módulo"
                                    error={errors.permisos}
                                />
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    Si dejas esto vacío, el módulo será visible para todos los usuarios.
                                </p>
                            </div>

                            <div>
                                <Label htmlFor="edit_orden">Orden</Label>
                                <Input
                                    id="edit_orden"
                                    type="number"
                                    value={data.orden}
                                    onChange={(e) => setData('orden', parseInt(e.target.value) || 1)}
                                    min="1"
                                    required
                                />
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setIsEditModalOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button type="submit" disabled={processing}>
                                    {processing ? 'Actualizando...' : 'Actualizar'}
                                </Button>
                            </div>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
