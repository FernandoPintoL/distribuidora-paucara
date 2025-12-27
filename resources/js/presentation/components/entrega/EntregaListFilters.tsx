import { Button } from '@/presentation/components/ui/button';
import { Card, CardContent } from '@/presentation/components/ui/card';
import { Input } from '@/presentation/components/ui/input';
import SearchSelect from '@/presentation/components/ui/search-select';
import { Filter, X } from 'lucide-react';
import type { FiltrosEntregas } from '@/infrastructure/services/logistica.service';

interface EntregaListFiltersProps {
  filtros: FiltrosEntregas;
  onFiltroChange: (key: keyof FiltrosEntregas, value: string) => void;
  onLimpiar: () => void;
  showFilters: boolean;
  onToggleFilters: () => void;
  estadoOptions?: Array<{ value: string; label: string }>;
  className?: string;
}

export function EntregaListFilters({
  filtros,
  onFiltroChange,
  onLimpiar,
  showFilters,
  onToggleFilters,
  estadoOptions = [
    { value: '', label: 'Todos' },
    { value: 'PROGRAMADO', label: 'Programado' },
    { value: 'ASIGNADA', label: 'Asignada' },
    { value: 'EN_CAMINO', label: 'En Camino' },
    { value: 'LLEGO', label: 'Llegó' },
    { value: 'ENTREGADO', label: 'Entregado' },
    { value: 'NOVEDAD', label: 'Novedad' },
    { value: 'CANCELADA', label: 'Cancelada' },
  ],
  className = ''
}: EntregaListFiltersProps) {
  const hasFilters = Object.keys(filtros).length > 0;

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex gap-2">
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={onToggleFilters}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filtros
        </Button>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onLimpiar}
            className="gap-2"
          >
            <X className="h-4 w-4" />
            Limpiar
          </Button>
        )}
      </div>

      {showFilters && (
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <SearchSelect
                  label="Estado"
                  placeholder="Todos los estados"
                  value={filtros.estado || ''}
                  options={estadoOptions}
                  onChange={(value) =>
                    onFiltroChange('estado', value as string)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Fecha Desde
                </label>
                <Input
                  type="date"
                  value={filtros.fecha_desde || ''}
                  onChange={(e) =>
                    onFiltroChange('fecha_desde', e.target.value)
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Fecha Hasta
                </label>
                <Input
                  type="date"
                  value={filtros.fecha_hasta || ''}
                  onChange={(e) =>
                    onFiltroChange('fecha_hasta', e.target.value)
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
