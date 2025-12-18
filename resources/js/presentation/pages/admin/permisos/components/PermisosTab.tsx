import { useState, type FormEvent } from 'react';
import { router } from '@inertiajs/react';
import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/presentation/components/ui/dialog';
import { Badge } from '@/presentation/components/ui/badge';
import { Pencil, Trash2, Plus, Search, Shield } from 'lucide-react';
import { NotificationService } from '@/infrastructure/services/notification.service';
import type { Permission } from '@/domain/entities/admin-permisos';

interface PermisosTabProps {
    permisos: Permission[];
    cargando: boolean;
    modulos: string[];
    onLoadData: (search: string, modulo: string) => void;
}

export function PermisosTab({ permisos, cargando, modulos, onLoadData }: PermisosTabProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedModule, setSelectedModule] = useState('');
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

    const handleSearch = (e: FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        onLoadData(searchTerm, selectedModule);
    };

    const handleModuleChange = (module: string) => {
        setSelectedModule(module);
        onLoadData(searchTerm, module === 'all' ? '' : module);
    };

    const clearFilters = () => {
        setSearchTerm('');
        setSelectedModule('');
        onLoadData('', '');
    };

    const handleDelete = (permission: Permission) => {
        if (permission.roles_count && permission.roles_count > 0) {
            NotificationService.error(`No se puede eliminar "${permission.name}" porque está asignado a ${permission.roles_count} rol(es)`);
            return;
        }

        if (confirm(`¿Estás seguro de que quieres eliminar el permiso "${permission.name}"?`)) {
            router.delete(`/admin/permisos/permisos/${permission.id}`, {
                onSuccess: () => {
                    NotificationService.success('Permiso eliminado exitosamente');
                    onLoadData(searchTerm, selectedModule);
                },
                onError: () => {
                    NotificationService.error('Error al eliminar el permiso');
                }
            });
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        Gestión de Permisos
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                        Total: {permisos.length} permisos
                    </p>
                </div>

                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="flex items-center gap-2">
                            <Plus className="w-4 h-4" />
                            Nuevo Permiso
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-md">
                        <DialogHeader>
                            <DialogTitle>Crear Nuevo Permiso</DialogTitle>
                            <DialogDescription>
                                Redirigiendo a la página de creación
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                Se abrirá una nueva página para crear el permiso.
                            </p>
                            <div className="flex justify-end gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setIsCreateDialogOpen(false)}
                                >
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => {
                                        setIsCreateDialogOpen(false);
                                        router.visit('/admin/permisos/permisos/crear');
                                    }}
                                >
                                    Ir a Crear
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Filtros */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Search className="w-5 h-5" />
                        Filtros de Búsqueda
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSearch} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <Label htmlFor="search">Buscar por nombre</Label>
                                <Input
                                    id="search"
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="Nombre del permiso..."
                                    className="w-full"
                                />
                            </div>

                            <div>
                                <Label htmlFor="module">Módulo</Label>
                                <Select
                                    value={selectedModule || 'all'}
                                    onValueChange={handleModuleChange}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Todos los módulos" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">Todos los módulos</SelectItem>
                                        {modulos?.map((module) => (
                                            <SelectItem key={module} value={module}>
                                                {module.charAt(0).toUpperCase() + module.slice(1)}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="flex items-end gap-2">
                                <Button type="submit" className="flex-1">
                                    <Search className="w-4 h-4 mr-2" />
                                    Buscar
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={clearFilters}
                                    className="flex-1"
                                >
                                    Limpiar
                                </Button>
                            </div>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Lista de Permisos */}
            {cargando ? (
                <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                        <div className="text-gray-400 mb-2">Cargando permisos...</div>
                    </div>
                </div>
            ) : permisos && permisos.length > 0 ? (
                <div className="space-y-3">
                    {permisos.map((permission, idx) => (
                        <Card key={permission.id || `permission-${idx}`} className="hover:shadow-md transition-shadow bg-white dark:bg-slate-800 border-gray-200 dark:border-slate-700">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Shield className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                                    {permission.name}
                                                </p>
                                                {permission.id && (
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        ID: {permission.id}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        {permission.description && (
                                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
                                                {permission.description}
                                            </p>
                                        )}
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                                            <span>
                                                Roles: <span className="font-semibold">{permission.roles_count || 0}</span>
                                            </span>
                                            <span>
                                                Usuarios: <span className="font-semibold">{permission.users_count || 0}</span>
                                            </span>
                                            {permission.created_at && (
                                                <span className="text-xs text-gray-500 dark:text-gray-500">
                                                    {new Date(permission.created_at).toLocaleDateString()}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 flex-shrink-0">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => router.visit(`/admin/permisos/permisos/${permission.id}/editar`)}
                                            title="Editar permiso"
                                        >
                                            <Pencil className="w-4 h-4" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDelete(permission)}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10"
                                            title="Eliminar permiso"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <Shield className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                            No se encontraron permisos
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            No hay permisos que coincidan con los filtros aplicados.
                        </p>
                        <Button variant="outline" onClick={clearFilters}>
                            Limpiar filtros
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
