// Components: AsyncSearchSelect - SearchSelect con búsqueda en servidor
import { useState } from 'react';
import SearchSelect, { type SelectOption } from '@/presentation/components/ui/search-select';

interface AsyncSearchSelectProps {
  id?: string;
  label?: string;
  placeholder?: string;
  value: string | number | '';
  onChange: (value: string | number | '') => void;
  searchEndpoint: string; // URL del endpoint de búsqueda
  initialOptions?: SelectOption[];
  minSearchLength?: number;
  debounceMs?: number;
  disabled?: boolean;
  required?: boolean;
  error?: string;
  className?: string;
  allowClear?: boolean;
  renderOption?: (option: SelectOption, isSelected: boolean) => React.ReactNode;
}

export default function AsyncSearchSelect({
  searchEndpoint,
  initialOptions = [],
  minSearchLength = 2,
  ...props
}: AsyncSearchSelectProps) {
  const [options, setOptions] = useState<SelectOption[]>(initialOptions);
  const [loading, setLoading] = useState(false);
  const [lastSearch, setLastSearch] = useState('');

  // Función para realizar búsqueda en el servidor
  const handleSearch = async (query: string) => {
    if (query.length < minSearchLength) {
      setOptions(initialOptions);
      return;
    }

    if (query === lastSearch) return;

    setLoading(true);
    try {
      const response = await fetch(`${searchEndpoint}?q=${encodeURIComponent(query)}`);
      const data = await response.json();

      // Asumir que el servidor devuelve un array de objetos con estructura: { id, nombre, descripcion? }
      const searchOptions: SelectOption[] = data.map((item: { id: string | number; nombre: string; descripcion?: string }) => ({
        value: item.id,
        label: item.nombre,
        description: item.descripcion || undefined,
      }));

      setOptions(searchOptions);
      setLastSearch(query);
    } catch (error) {
      console.error('Error en búsqueda:', error);
      setOptions([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SearchSelect
      {...props}
      options={options}
      onSearch={handleSearch}
      loading={loading}
      emptyText={loading ? "Buscando..." : "No se encontraron resultados"}
    />
  );
}
