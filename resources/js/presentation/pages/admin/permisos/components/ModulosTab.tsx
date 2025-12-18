import { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Button } from '@/presentation/components/ui/button';
import { Badge } from '@/presentation/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/presentation/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/presentation/components/ui/table';
import { Input } from '@/presentation/components/ui/input';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';
import { Alert, AlertDescription } from '@/presentation/components/ui/alert';
import { Eye, EyeOff, Search, Edit, Trash2, Plus, Info } from 'lucide-react';
import toast from 'react-hot-toast';
import { ModuloSidebar } from '@/domain/modulos/types';
import { modulosService } from '@/domain/modulos/services';
import { MatrizAccesoRol } from '@/presentation/components/matriz-acceso-rol';
import { SidebarPreview } from '@/presentation/components/sidebar-preview';
import { ModulosBulkEditModal } from './ModulosBulkEditModal';
import { ModulosAnalytics } from './ModulosAnalytics';
import { ExportadorConfiguracion } from './ExportadorConfiguracion';
import { HistorialCambios } from './HistorialCambios';

interface ModulosTabProps {
  modulos: ModuloSidebar[];
  cargando: boolean;
  onLoadData: () => Promise<void>;
}

export function ModulosTab({ modulos, cargando, onLoadData }: ModulosTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState<'todos' | 'activo' | 'inactivo'>('todos');
  const [modulosList, setModulosList] = useState<ModuloSidebar[]>(modulos);
  const [loading, setLoading] = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [todosSeleccionados, setTodosSeleccionados] = useState(false);
  const [mostrarBulkMenu, setMostrarBulkMenu] = useState(false);

  // Sincronizar modulosList con props.modulos cuando cambien
  useEffect(() => {
    setModulosList(modulos);
  }, [modulos]);

  // Funciones para selección múltiple
  const toggleSeleccion = (id: number) => {
    const nuevo = new Set(seleccionados);
    if (nuevo.has(id)) {
      nuevo.delete(id);
    } else {
      nuevo.add(id);
    }
    setSeleccionados(nuevo);
    // Desmarcar "todos" si se deselecciona alguno manualmente
    if (nuevo.size !== modulosFiltrados.length) {
      setTodosSeleccionados(false);
    }
  };

  const toggleTodos = () => {
    if (todosSeleccionados) {
      setSeleccionados(new Set());
      setTodosSeleccionados(false);
    } else {
      const nuevos = new Set(modulosFiltrados.map(m => m.id));
      setSeleccionados(nuevos);
      setTodosSeleccionados(true);
    }
  };

  // Filtrar módulos por búsqueda y estado
  const modulosFiltrados = modulosList.filter((modulo) => {
    const matchSearch =
      (modulo.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (modulo.ruta?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false) ||
      (modulo.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);

    const matchEstado =
      estadoFiltro === 'todos' ||
      (estadoFiltro === 'activo' && modulo.activo) ||
      (estadoFiltro === 'inactivo' && !modulo.activo);

    return matchSearch && matchEstado;
  });

  // Toggle activo/inactivo
  const handleToggleActivo = async (modulo: ModuloSidebar) => {
    setLoading(true);
    try {
      await modulosService.alternarEstadoModulo(modulo);
      // Actualizar la lista local
      setModulosList(
        modulosList.map((m) =>
          m.id === modulo.id ? { ...m, activo: !m.activo } : m
        )
      );
      toast.success(`Módulo ${modulo.titulo} ${!modulo.activo ? 'activado' : 'desactivado'}`);
      // Recargar datos del servidor
      await onLoadData();
    } catch (error) {
      toast.error('Error al cambiar el estado del módulo');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Bulk edit handler
  const handleBulkEdit = async (selectedIds: Set<number>, operacion: any) => {
    setLoading(true);
    try {
      // Llamar a la API para bulk update
      const response = await fetch('/modulos-sidebar/bulk-update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        body: JSON.stringify({
          ids: Array.from(selectedIds),
          operacion,
        }),
      });

      if (!response.ok) {
        throw new Error('Error al aplicar cambios en lote');
      }

      const data = await response.json();
      toast.success(`Cambios aplicados a ${selectedIds.size} módulos`);

      // Limpiar selección y recargar datos
      setSeleccionados(new Set());
      setTodosSeleccionados(false);
      setMostrarBulkMenu(false);
      await onLoadData();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al aplicar cambios en lote');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = (modulo: ModuloSidebar) => {
    if (confirm(`¿Está seguro de eliminar el módulo "${modulo.titulo}"?`)) {
      window.location.href = `/modulos-sidebar/${modulo.id}?_method=DELETE`;
    }
  };

  // Determinar el tipo de módulo para mostrar
  const getTipoModulo = (modulo: ModuloSidebar): string => {
    if (modulo.es_submenu) {
      return 'Submódulo';
    }
    return 'Principal';
  };

  return (
    <>
      {/* Filtros y búsqueda */}
      <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm p-4 mb-6 border border-gray-200 dark:border-slate-700">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Búsqueda */}
          <div className="md:col-span-2 space-y-2">
            <Label htmlFor="modulos-search" className="text-gray-700 dark:text-gray-300">Buscar módulo</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="modulos-search"
                type="text"
                placeholder="Buscar por título, ruta o categoría..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
              />
            </div>
          </div>

          {/* Filtro por estado */}
          <div className="space-y-2">
            <Label htmlFor="estado-filtro" className="text-gray-700 dark:text-gray-300">Estado</Label>
            <Select
              value={estadoFiltro}
              onValueChange={(value) => setEstadoFiltro(value as 'todos' | 'activo' | 'inactivo')}
            >
              <SelectTrigger id="estado-filtro" className="bg-white dark:bg-slate-700 border-gray-300 dark:border-slate-600 text-gray-900 dark:text-gray-100">
                <SelectValue placeholder="Seleccionar estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos</SelectItem>
                <SelectItem value="activo">Activos</SelectItem>
                <SelectItem value="inactivo">Inactivos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="mt-4 flex justify-between">
          {seleccionados.size > 0 && (
            <Button
              onClick={() => setMostrarBulkMenu(true)}
              variant="default"
              className="bg-blue-600 hover:bg-blue-700"
            >
              ✏️ Editar {seleccionados.size} seleccionado{seleccionados.size !== 1 ? 's' : ''}
            </Button>
          )}
          <div className="flex-1" />
          <Link href="/modulos-sidebar/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Crear Módulo
            </Button>
          </Link>
        </div>
      </div>

      {/* Tabla de módulos */}
      {cargando ? (
        <div className="text-center py-8 bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-gray-200 dark:border-slate-700">
          <div className="inline-block animate-spin text-blue-600 dark:text-blue-400">
            <div className="text-3xl">⏳</div>
          </div>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Cargando módulos...</p>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm overflow-hidden border border-gray-200 dark:border-slate-700">
          <div className="overflow-x-auto">
            <Table className="bg-white dark:bg-slate-800">
              <TableHeader className="bg-gray-50 dark:bg-slate-700">
                <TableRow className="border-gray-200 dark:border-slate-700">
                  <TableHead className="w-12 text-gray-900 dark:text-gray-100">
                    <input
                      type="checkbox"
                      checked={todosSeleccionados}
                      onChange={toggleTodos}
                      title={todosSeleccionados ? 'Desseleccionar todos' : 'Seleccionar todos'}
                      className="cursor-pointer"
                    />
                  </TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Módulo</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Ruta</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Tipo</TableHead>
                  <TableHead className="text-gray-900 dark:text-gray-100">Categoría</TableHead>
                  <TableHead className="text-center text-gray-900 dark:text-gray-100">Estado</TableHead>
                  <TableHead className="text-center text-gray-900 dark:text-gray-100">Orden</TableHead>
                  <TableHead className="text-right text-gray-900 dark:text-gray-100">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-slate-700">
                {modulosFiltrados.length === 0 ? (
                  <TableRow className="border-gray-200 dark:border-slate-700">
                    <TableCell colSpan={8} className="py-8 text-center text-gray-500 dark:text-gray-400">
                      {modulosList.length === 0
                        ? 'No hay módulos registrados'
                        : 'No se encontraron módulos que coincidan con los filtros'}
                    </TableCell>
                  </TableRow>
                ) : (
                  modulosFiltrados.map((modulo) => (
                    <TableRow key={modulo.id} className="hover:bg-gray-50 dark:hover:bg-slate-700 border-gray-200 dark:border-slate-700">
                      {/* Checkbox */}
                      <TableCell className="w-12">
                        <input
                          type="checkbox"
                          checked={seleccionados.has(modulo.id)}
                          onChange={() => toggleSeleccion(modulo.id)}
                          className="cursor-pointer"
                        />
                      </TableCell>

                      {/* Módulo */}
                      <TableCell className="font-medium text-gray-900 dark:text-gray-100">
                        <div className="flex items-center gap-2">
                          {modulo.es_submenu && (
                            <span className="text-gray-400 dark:text-gray-500">└</span>
                          )}
                          <span>{modulo.titulo}</span>
                          {modulo.icono && (
                            <Badge variant="outline" className="text-xs">
                              {modulo.icono}
                            </Badge>
                          )}
                        </div>
                      </TableCell>

                      {/* Ruta */}
                      <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                        <code className="bg-gray-100 dark:bg-slate-700 px-2 py-1 rounded text-xs text-gray-900 dark:text-gray-100">
                          {modulo.ruta}
                        </code>
                      </TableCell>

                      {/* Tipo */}
                      <TableCell>
                        <Badge variant={modulo.es_submenu ? 'secondary' : 'default'}>
                          {getTipoModulo(modulo)}
                        </Badge>
                      </TableCell>

                      {/* Categoría */}
                      <TableCell>
                        {modulo.categoria ? (
                          <Badge variant="outline">{modulo.categoria}</Badge>
                        ) : (
                          <span className="text-gray-400 dark:text-gray-500 text-xs">Sin categoría</span>
                        )}
                      </TableCell>

                      {/* Estado */}
                      <TableCell className="text-center">
                        <Badge
                          variant={modulo.activo ? 'default' : 'secondary'}
                          className={modulo.activo ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}
                        >
                          {modulo.activo ? (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Activo
                            </>
                          ) : (
                            <>
                              <EyeOff className="h-3 w-3 mr-1" />
                              Inactivo
                            </>
                          )}
                        </Badge>
                      </TableCell>

                      {/* Orden */}
                      <TableCell className="text-sm text-center font-medium">
                        {modulo.orden}
                      </TableCell>

                      {/* Acciones */}
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleToggleActivo(modulo)}
                            disabled={loading}
                            className="text-xs"
                            title={modulo.activo ? 'Desactivar módulo' : 'Activar módulo'}
                          >
                            {modulo.activo ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </Button>
                          <Link href={`/modulos-sidebar/${modulo.id}/edit`}>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs"
                              title="Editar módulo"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(modulo)}
                            className="text-red-600 hover:text-red-700 text-xs"
                            title="Eliminar módulo"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Contador de resultados */}
          {modulosFiltrados.length > 0 && (
            <div className="px-6 py-3 bg-gray-50 dark:bg-slate-700 border-t border-gray-200 dark:border-slate-700">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Mostrando {modulosFiltrados.length} de {modulosList.length} módulos
              </p>
            </div>
          )}
        </div>
      )}

      {/* Sección: Matriz de Acceso Roles × Módulos */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Matriz de Acceso: Roles × Módulos</CardTitle>
            <CardDescription>
              Visualiza qué roles tienen acceso a cada módulo del sidebar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <MatrizAccesoRol />
          </CardContent>
        </Card>
      </div>

      {/* Sección: Vista Previa del Sidebar por Rol */}
      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Vista Previa del Sidebar</CardTitle>
            <CardDescription>
              Previsualiza cómo se verá el sidebar para un rol específico
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SidebarPreview modulosTotales={modulos.length} />
          </CardContent>
        </Card>
      </div>

      {/* Sección: Estadísticas y Analytics */}
      <ModulosAnalytics modulos={modulosList} />

      {/* Sección: Exportador de Configuración */}
      <ExportadorConfiguracion modulos={modulosList} />

      {/* Sección: Historial de Cambios */}
      <HistorialCambios />

      {/* Info Box */}
      <Alert className="mt-8 border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-slate-700">
        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
        <AlertDescription className="text-blue-900 dark:text-blue-200">
          <strong>Centro de Permisos - Gestión de Módulos</strong>
          <br />
          <strong>Fases implementadas:</strong>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li><strong>Fase 1:</strong> Listado de módulos con búsqueda y filtros</li>
            <li><strong>Fase 2:</strong> Crear y editar módulos</li>
            <li><strong>Fase 3:</strong> Matriz de acceso y vista previa del sidebar</li>
            <li><strong>Fase 4B:</strong> Selección múltiple y operaciones en lote</li>
            <li><strong>Fase 4C (Parcial):</strong> Analytics y estadísticas de módulos</li>
          </ul>
          <p className="mt-3 text-sm">
            <strong>Características disponibles:</strong> Búsqueda por título/ruta/categoría, filtrado por estado,
            crear/editar/eliminar módulos, cambio de estado en tiempo real, visualización de matriz de permisos,
            previsualización del sidebar por rol, selección múltiple, edición en lote de módulos,
            y estadísticas detalladas de módulos por categoría y tipo.
          </p>
        </AlertDescription>
      </Alert>

      {/* Modal de Bulk Edit */}
      {mostrarBulkMenu && (
        <ModulosBulkEditModal
          cantidad={seleccionados.size}
          selectedIds={seleccionados}
          onClose={() => setMostrarBulkMenu(false)}
          onSubmit={handleBulkEdit}
          cargando={loading}
        />
      )}
    </>
  );
}
