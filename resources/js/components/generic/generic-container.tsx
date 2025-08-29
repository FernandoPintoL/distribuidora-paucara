// Application Layer: Generic container - Updated with enhanced UI
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import GenericSearchBar from '@/components/generic/generic-search-bar';
import GenericTable from '@/components/generic/generic-table';
import GenericPagination from '@/components/generic/generic-pagination';
import { useGenericEntities } from '@/hooks/use-generic-entities';
import type { Pagination } from '@/domain/shared';
import type { BaseEntity, BaseService, ModuleConfig, BaseFormData } from '@/domain/generic';

interface GenericContainerProps<T extends BaseEntity, F extends BaseFormData> {
  entities: Pagination<T>;
  filters: { q?: string };
  config: ModuleConfig<T, F>;
  service: BaseService<T, F>;
}

export default function GenericContainer<T extends BaseEntity, F extends BaseFormData>({
  entities,
  filters,
  config,
  service
}: GenericContainerProps<T, F>) {
  const {
    isLoading,
    searchQuery,
    deleteEntity,
    navigateToEdit,
    handleSearchChange,
    handleSearch,
    clearFilters,
    syncWithFilters,
  } = useGenericEntities<T, F>(service);

  // Sincronizar el estado local con los filtros del servidor una sola vez al montar
  useEffect(() => {
    syncWithFilters(filters);
  }, [filters?.q]); // Solo sincroniza cuando cambia el filtro 'q' del servidor

  const handleDelete = (entity: T) => {
    deleteEntity(entity, config.singularName);
  };

  return (
    <>
      <Head title={config.displayName} />
      <div className="space-y-6">
        <Card className="shadow-sm">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-gray-200 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <div className="p-2 bg-blue-600 rounded-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  {config.displayName}
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{config.description}</span>
                  <div className="flex items-center gap-1">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                      {entities.total} total
                    </span>
                  </div>
                </div>
              </div>
              <Button asChild className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200">
                <Link href={service.createUrl()}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Nuevo {config.singularName}
                </Link>
              </Button>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-6">
              <GenericSearchBar
                searchQuery={searchQuery}
                onSearchChange={handleSearchChange}
                onSearch={handleSearch}
                onClear={clearFilters}
                placeholder={config.searchPlaceholder}
                isLoading={isLoading}
              />

              <GenericTable<T>
                entities={entities.data}
                columns={config.tableColumns}
                onEdit={navigateToEdit}
                onDelete={handleDelete}
                entityName={config.singularName}
                isLoading={isLoading}
              />
            </div>
          </CardContent>

          {entities.links && entities.total > 0 && (
            <CardFooter className="bg-gray-50 border-t border-gray-200 py-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 w-full">
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>
                    Mostrando <span className="font-semibold text-gray-900">{entities.from}</span> a{' '}
                    <span className="font-semibold text-gray-900">{entities.to}</span> de{' '}
                    <span className="font-semibold text-gray-900">{entities.total}</span> resultados
                  </span>
                  {entities.total > 10 && (
                    <div className="h-4 w-px bg-gray-300"></div>
                  )}
                  {entities.total > 10 && (
                    <span className="text-xs text-gray-500">
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
