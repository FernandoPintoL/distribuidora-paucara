// Pages: Categorias index page using generic components
import AppLayout from '@/layouts/app-layout';
import GenericContainer from '@/presentation/components/generic/generic-container';
import { categoriasConfig } from '@/config/categorias.config';
import categoriasService from '@/infrastructure/services/categorias.service';
import type { Pagination } from '@/domain/entities/shared';
import type { Categoria, CategoriaFormData } from '@/domain/entities/categorias';

interface CategoriasIndexProps {
  categorias: Pagination<Categoria>;
  filters: { q?: string };
}

export default function CategoriasIndex({ categorias, filters }: CategoriasIndexProps) {
  return (
    <AppLayout breadcrumbs={[
      { title: 'Dashboard', href: categoriasService.indexUrl() },
      { title: 'Categorías', href: categoriasService.indexUrl() }
    ]}>
      <GenericContainer<Categoria, CategoriaFormData>
        entities={categorias}
        filters={filters}
        config={categoriasConfig}
        service={categoriasService}
      />
    </AppLayout>
  );
}
