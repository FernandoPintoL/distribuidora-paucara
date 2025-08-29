// Application Layer: Contenedor principal de categorías
import { Head, Link } from '@inertiajs/react';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import CategoriasSearchBar from '@/components/categorias/categorias-search-bar';
import CategoriasTable from '@/components/categorias/categorias-table';
import CategoriasPagination from '@/components/categorias/categorias-pagination';
import { useCategorias } from '@/hooks/use-categorias';
import categoriasService from '@/services/categorias.service';
import type { Pagination } from '@/domain/shared';
import type { Categoria } from '@/domain/categorias';

interface CategoriasContainerProps {
  categorias: Pagination<Categoria>;
  filters: { q?: string };
}

export default function CategoriasContainer({ categorias, filters }: CategoriasContainerProps) {
  const {
    isLoading,
    searchQuery,
    deleteCategoria,
    navigateToEdit,
    handleSearchChange,
    handleSearch,
    clearFilters,
  } = useCategorias();

  // Sincronizar el estado local con los filtros del servidor
  useEffect(() => {
    if (filters?.q && filters.q !== searchQuery) {
      handleSearchChange(filters.q);
    }
  }, [filters?.q, searchQuery, handleSearchChange]);

  return (
    <>
      <Head title="Categorías" />
      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <div>
            <CardTitle className="text-xl">Categorías</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Gestiona las categorías de productos ({categorias.total} total)
            </p>
          </div>
          <Button asChild>
            <Link href={categoriasService.createUrl()}>
              Nueva Categoría
            </Link>
          </Button>
        </CardHeader>

        <CardContent>
          <CategoriasSearchBar
            searchQuery={searchQuery}
            onSearchChange={handleSearchChange}
            onSearch={handleSearch}
            onClear={clearFilters}
            isLoading={isLoading}
          />

          <CategoriasTable
            categorias={categorias.data}
            onEdit={navigateToEdit}
            onDelete={deleteCategoria}
            isLoading={isLoading}
          />
        </CardContent>

        {categorias.links && (
          <CardFooter className="justify-between">
            <div className="text-sm text-muted-foreground">
              Mostrando {categorias.from} a {categorias.to} de {categorias.total} resultados
            </div>
            <CategoriasPagination
              links={categorias.links}
              isLoading={isLoading}
            />
          </CardFooter>
        )}
      </Card>
    </>
  );
}
