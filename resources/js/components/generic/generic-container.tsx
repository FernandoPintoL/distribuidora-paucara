// Application Layer: Generic container - Updated with enhanced UI
import { Head, Link } from '@inertiajs/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import GenericSearchBar from '@/components/generic/generic-search-bar';
import GenericTable from '@/components/generic/generic-table';
import GenericPagination from '@/components/generic/generic-pagination';
import { useGenericEntities } from '@/hooks/use-generic-entities';
import type { Pagination } from '@/domain/shared';
import type { BaseEntity, BaseService, ModuleConfig, BaseFormData } from '@/domain/generic';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';

const ALL_VALUE = 'all';

interface GenericContainerProps<T extends BaseEntity, F extends BaseFormData> {
  entities: Pagination<T>;
  filters: { q?: string; categoria_id?: number|string|null; marca_id?: number|string|null; order_by?: string|null; order_dir?: string|null };
  config: ModuleConfig<T, F>;
  service: BaseService<T, F>;
  extraData?: { categorias?: {id:number; nombre:string}[]; marcas?: {id:number; nombre:string}[]; [key:string]: unknown };
}

export default function GenericContainer<T extends BaseEntity, F extends BaseFormData>({
  entities,
  filters,
  config,
  service,
  extraData
}: GenericContainerProps<T, F>) {
  const {
    isLoading,
    searchQuery,
    searchEntities,
    deleteEntity,
    navigateToEdit,
    handleSearchChange,
    handleSearch,
    clearFilters,
    syncWithFilters,
  } = useGenericEntities<T, F>(service);

  const [viewMode, setViewMode] = useState<'table' | 'cards'>(config.enableCardView ? 'cards' : 'table');
  const [categoria, setCategoria] = useState<string>(filters.categoria_id ? String(filters.categoria_id) : ALL_VALUE);
  const [marca, setMarca] = useState<string>(filters.marca_id ? String(filters.marca_id) : ALL_VALUE);
  const [orderBy, setOrderBy] = useState<string>(filters.order_by || 'id');
  const [orderDir, setOrderDir] = useState<'asc'|'desc'>(filters.order_dir === 'asc' ? 'asc' : 'desc');
  const initialActivo = (filters as { activo?: string | number | boolean }).activo;
  const [estado, setEstado] = useState<string>(initialActivo !== undefined && initialActivo !== null ? String(initialActivo) : ALL_VALUE);

  // Sincronizar el estado local con los filtros del servidor una sola vez al montar
  useEffect(() => {
    syncWithFilters(filters);
  }, [filters?.q]); // Solo sincroniza cuando cambia el filtro 'q' del servidor

  const handleDelete = (entity: T) => {
    deleteEntity(entity, config.singularName);
  };

  const applyFilters = () => {
    searchEntities({
      q: searchQuery || undefined,
      categoria_id: categoria === ALL_VALUE ? undefined : categoria,
      marca_id: marca === ALL_VALUE ? undefined : marca,
      order_by: orderBy,
      order_dir: orderDir
    });
  };

  const resetAll = () => {
    setCategoria(ALL_VALUE); setMarca(ALL_VALUE); setOrderBy('id'); setOrderDir('desc'); clearFilters();
  };

  const applyProveedorFilters = () => {
    searchEntities({
      q: searchQuery || undefined,
      activo: estado === ALL_VALUE ? undefined : estado,
      order_by: orderBy,
      order_dir: orderDir
    });
  };

  const resetProveedorFilters = () => {
    setEstado(ALL_VALUE);
    setOrderBy('id');
    setOrderDir('desc');
    clearFilters();
  };

  const renderCards = () => {
    if (!config.cardRenderer) return null;
    if (!entities.data.length) {
      return (
        <div className="text-center py-12 border border-dashed border-border rounded-lg">
          <h3 className="text-lg font-semibold text-foreground mb-2">No hay {config.pluralName}</h3>
          <p className="text-muted-foreground mb-4">Agrega tu primer {config.singularName} para empezar.</p>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href={service.createUrl()}>Nuevo {config.singularName}</Link>
          </Button>
        </div>
      );
    }
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {entities.data.map(entity => (
          <div key={entity.id}>{config.cardRenderer!(entity, { onEdit: navigateToEdit, onDelete: handleDelete })}</div>
        ))}
      </div>
    );
  };

  return (
    <>
      <Head title={config.displayName} />
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-secondary to-secondary/70 dark:from-secondary/40 dark:to-secondary/20 border-b border-border p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-foreground flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  {config.displayName}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>{config.description}</span>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                      {entities.total} total
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {config.enableCardView && (
                  <div className="flex rounded-md overflow-hidden border border-border divide-x divide-border bg-card">
                    <button
                      type="button"
                      onClick={() => setViewMode('cards')}
                      className={`px-3 py-2 text-xs font-medium flex items-center gap-1 hover:bg-secondary transition-colors ${viewMode === 'cards' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
                      title="Vista de tarjetas"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h7V4H4a2 2 0 00-2 2v3h2V6zm9 0h7V4h-7v2zm0 0v3h2V8h-2zM4 13h7v-2H4v2zm9 0h7v-2h-7v2zm0 0v3h2v-1h-2zM4 20h7v-2H4v2zm9 0h7v-2h-7v2z" /></svg>
                      Tarjetas
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('table')}
                      className={`px-3 py-2 text-xs font-medium flex items-center gap-1 hover:bg-secondary transition-colors ${viewMode === 'table' ? 'bg-secondary text-foreground' : 'text-muted-foreground'}`}
                      title="Vista de tabla"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18M4 6h16a1 1 0 011 1v10a1 1 0 01-1 1H4a1 1 0 01-1-1V7a1 1 0 011-1z" /></svg>
                      Tabla
                    </button>
                  </div>
                )}
                <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200 text-white">
                  <Link href={service.createUrl()}>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Nuevo {config.singularName}
                  </Link>
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              {config.showIndexFilters && (
                config.moduleName === 'productos' ? (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoría</label>
                      <Select value={categoria} onValueChange={setCategoria}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                          {extraData?.categorias?.map(c=> <SelectItem key={c.id} value={String(c.id)}>{c.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Marca</label>
                      <Select value={marca} onValueChange={setMarca}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_VALUE}>Todas</SelectItem>
                          {extraData?.marcas?.map(m=> <SelectItem key={m.id} value={String(m.id)}>{m.nombre}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Ordenar por</label>
                      <Select value={orderBy} onValueChange={setOrderBy}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">ID</SelectItem>
                          <SelectItem value="nombre">Nombre</SelectItem>
                          <SelectItem value="precio_base">Precio</SelectItem>
                          <SelectItem value="fecha_creacion">Creación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" onClick={()=> setOrderDir(orderDir==='asc'?'desc':'asc')} variant="outline" className="h-8 w-20">{orderDir==='asc'?'Asc':'Desc'}</Button>
                      <Button size="sm" onClick={applyFilters} className="h-8">Aplicar</Button>
                      <Button size="sm" variant="ghost" onClick={resetAll} className="h-8">Limpiar</Button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Estado</label>
                      <Select value={estado} onValueChange={setEstado}>
                        <SelectTrigger className="h-8">
                          <SelectValue placeholder="Todos" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value={ALL_VALUE}>Todos</SelectItem>
                          <SelectItem value="1">Activos</SelectItem>
                          <SelectItem value="0">Inactivos</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Ordenar por</label>
                      <Select value={orderBy} onValueChange={setOrderBy}>
                        <SelectTrigger className="h-8"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="id">ID</SelectItem>
                          <SelectItem value="nombre">Nombre</SelectItem>
                          <SelectItem value="created_at">Creación</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end gap-2">
                      <Button size="sm" onClick={()=> setOrderDir(orderDir==='asc'?'desc':'asc')} variant="outline" className="h-8 w-20">{orderDir==='asc'?'Asc':'Desc'}</Button>
                      <Button size="sm" onClick={applyProveedorFilters} className="h-8">Aplicar</Button>
                      <Button size="sm" variant="ghost" onClick={resetProveedorFilters} className="h-8">Limpiar</Button>
                    </div>
                  </div>
                )
              )}

              <GenericSearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearch={handleSearch}
                onClear={clearFilters}
                placeholder={config.searchPlaceholder}
                isLoading={isLoading}
              />

              {viewMode === 'table' && (
                <GenericTable<T>
                  entities={entities.data}
                  columns={config.tableColumns}
                  onEdit={navigateToEdit}
                  onDelete={handleDelete}
                  entityName={config.singularName}
                  isLoading={isLoading}
                />
              )}

              {viewMode === 'cards' && (
                <div>{renderCards()}</div>
              )}

              {isLoading && (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {Array.from({length:8}).map((_,i)=>(
                    <div key={i} className="border border-border rounded-xl p-3 space-y-3">
                      <Skeleton className="w-full h-32 rounded-md" />
                      <Skeleton className="h-4 w-3/4" />
                      <div className="flex gap-2">
                        <Skeleton className="h-3 w-12" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <div className="flex justify-between items-center">
                        <Skeleton className="h-5 w-16" />
                        <Skeleton className="h-6 w-20" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>

          {entities.links && entities.total > 0 && (
            <CardFooter className="bg-secondary border-t border-border py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>
                    Mostrando <span className="font-semibold text-foreground">{entities.from}</span> a{' '}
                    <span className="font-semibold text-foreground">{entities.to}</span> de{' '}
                    <span className="font-semibold text-foreground">{entities.total}</span> resultados
                  </span>
                  {entities.total > 10 && (
                    <div className="h-4 w-px bg-border"></div>
                  )}
                  {entities.total > 10 && (
                    <span className="text-xs text-muted-foreground">
                      Página {entities.current_page} de {entities.last_page}
                    </span>
                  )}
                </div>
                <GenericPagination
                  links={entities.links}
                  isLoading={isLoading}
                />
              </div>
            </CardFooter>
          )}
        </Card>
      </div>
    </>
  );
}
