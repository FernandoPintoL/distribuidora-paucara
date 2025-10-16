import { Label } from '@/presentation/components/ui/label';
import { Input } from '@/presentation/components/ui/input';
import SearchSelect from '@/presentation/components/ui/search-select';
import InputSearch from '@/presentation/components/ui/input-search';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import NotificationService from '@/infrastructure/services/notification.service';

interface Option { value: number | string; label: string; description?: string }

export interface Step1Props {
  data: {
    nombre: string;
    descripcion?: string | null;
    peso?: number | null;
    unidad_medida_id?: number | string;
    categoria_id?: number | string;
    marca_id?: number | string;
    proveedor_id?: number | string;
    activo?: boolean;
    stock_minimo?: number | null;
    stock_maximo?: number | null;
  };
  errors: Record<string, string>;
  categoriasOptions: Option[];
  marcasOptions: Option[];
  proveedoresOptions: Option[];
  unidadesOptions: Option[];
  setData: (key: string, value: unknown) => void; // follows useForm API used in parent
  getInputClassName: (fieldName: keyof Record<string, string>) => string;
}

export default function Step1DatosProducto({ data, errors, categoriasOptions, marcasOptions, proveedoresOptions, unidadesOptions, setData, getInputClassName }: Step1Props) {
  // Función de búsqueda para proveedores
  const searchProveedores = async (query: string) => {
    console.log('🔍 Buscando proveedores con query:', query);
    console.log('📋 Proveedores disponibles:', proveedoresOptions.length);

    if (!query || query.length < 2) {
      console.log('❌ Query muy corto, retornando vacío');
      return [];
    }

    const filtered = proveedoresOptions.filter(option =>
      option.label.toLowerCase().includes(query.toLowerCase()) ||
      (option.description && option.description.toLowerCase().includes(query.toLowerCase()))
    );

    console.log('✅ Proveedores filtrados:', filtered.length);
    console.log('📝 Resultados:', filtered);

    return filtered.map(option => ({
      value: option.value,
      label: option.label,
      description: option.description,
      codigos_barras: undefined,
      precio_base: undefined,
      stock_total: undefined
    }));
  };
  return (
    <div>
      {/* <div className="bg-secondary border border-border rounded p-3">
        <div className="text-sm font-semibold text-foreground">Paso 1: Datos del producto</div>
        <div className="text-xs text-muted-foreground">Complete la información general del producto</div>
      </div> */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="space-y-1 sm:col-span-2">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input
            id="nombre"
            value={data.nombre}
            onChange={e => setData('nombre', e.target.value)}
            required
            className={getInputClassName('nombre')}
          />
          {errors.nombre && <div className="text-red-500 text-sm mt-1">⚠️ {errors.nombre}</div>}
        </div>
        <div className="space-y-1">
          <InputSearch
            id="proveedor"
            label="Proveedor"
            value={data.proveedor_id ?? ''}
            onChange={(value) => setData('proveedor_id', value ? Number(value) : '')}
            onSearch={searchProveedores}
            placeholder="Buscar proveedor..."
            emptyText="No se encontró ningún proveedor con ese nombre"
            error={errors.proveedor_id}
            showCreateIconButton={true}
            createIconButtonTitle="Crear nuevo proveedor"
            onCreateClick={(searchQuery) => {
              console.log('🚀 onCreateClick ejecutado con query:', searchQuery);
              console.log('📋 Estado actual - proveedoresOptions:', proveedoresOptions.length);
              // Crear nuevo proveedor automáticamente con solo el nombre
              const createProveedor = async (nombre: string) => {
                console.log('🔧 Creando proveedor:', nombre);
                try {
                  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
                  console.log('🔑 CSRF Token encontrado:', !!csrfToken);
                  const response = await fetch('/api/proveedores', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      ...(csrfToken && { 'X-CSRF-TOKEN': csrfToken }),
                    },
                    body: JSON.stringify({ nombre }),
                  });

                  console.log('📡 Respuesta del servidor:', response.status);

                  if (response.ok) {
                    const result = await response.json();
                    console.log('✅ Respuesta completa:', result);
                    if (result.success) {
                      setData('proveedor_id', result.data.id);
                      console.log('💾 Proveedor ID actualizado:', result.data.id);
                      // Mostrar notificación de éxito
                      NotificationService.success(result.message || 'Proveedor creado exitosamente');
                    } else {
                      console.error('❌ Error del servidor:', result.message);

                      // Manejar errores de validación específicos
                      if (result.errors?.nombre) {
                        NotificationService.error('Ya existe un proveedor con ese nombre. Por favor, elige un nombre diferente.');
                      } else {
                        NotificationService.error(result.message || 'Error al crear el proveedor');
                      }
                    }
                  } else {
                    const errorData = await response.json().catch(() => ({ message: 'Error desconocido' }));
                    console.error('❌ Error HTTP:', response.status, errorData.message);

                    // Manejar errores de validación específicos
                    if (response.status === 422 && errorData.errors?.nombre) {
                      NotificationService.error('Ya existe un proveedor con ese nombre. Por favor, elige un nombre diferente.');
                    } else {
                      NotificationService.error(errorData.message || 'Error al crear el proveedor');
                    }
                  }
                } catch (error) {
                  console.error('❌ Error de red:', error);
                  NotificationService.error('Error de conexión al crear el proveedor');
                }
              };

              createProveedor(searchQuery);
            }}
            displayValue={proveedoresOptions.find(opt => opt.value === data.proveedor_id)?.label}
          />
          <div className="text-xs text-muted-foreground mt-1 px-1">
            💡 Si no encuentras el proveedor, puedes crearlo haciendo clic en el botón ➕. El sistema evitará crear proveedores con nombres duplicados.
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
        <div className="space-y-1">
          <SearchSelect
            id="categoria"
            label="Categoría"
            placeholder="Seleccione una categoría"
            value={data.categoria_id ?? ''}
            options={categoriasOptions}
            onChange={(value) => setData('categoria_id', value ? Number(value) : '')}
            error={errors.categoria_id}
            allowClear={true}
            emptyText="No se encontraron categorías"
            searchPlaceholder="Buscar categorías..."
          />
        </div>
        <div className="space-y-1">
          <SearchSelect
            id="marca"
            label="Marca"
            placeholder="Seleccione una marca"
            value={data.marca_id ?? ''}
            options={marcasOptions}
            onChange={(value) => setData('marca_id', value ? Number(value) : '')}
            error={errors.marca_id}
            allowClear={true}
            emptyText="No se encontraron marcas"
            searchPlaceholder="Buscar marcas..."
          />
        </div>
        <div className="space-y-1">
          <SearchSelect
            id="unidad_medida_id"
            label="Unidad de medida"
            placeholder="Seleccione una unidad"
            value={data.unidad_medida_id ?? ''}
            options={unidadesOptions}
            onChange={(value) => setData('unidad_medida_id', value ? Number(value) : '')}
            error={errors.unidad_medida_id}
            allowClear={true}
            emptyText="No se encontraron unidades"
            searchPlaceholder="Buscar unidades..."
            renderOption={(option, isSelected) => (
              <div className={`flex justify-between items-center py-2 px-3 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''}`}>
                <span className="font-medium text-sm">{option.label}</span>
                {option.description && (
                  <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded">
                    {option.description}
                  </span>
                )}
              </div>
            )}
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-4">
        <div className="space-y-1">
          <Label htmlFor="peso">Peso (Kg)</Label>
          <Input
            id="peso"
            type="number"
            step="0.001"
            value={data.peso ?? ''}
            onChange={e => setData('peso', e.target.value ? Number(e.target.value) : null)}
            className={getInputClassName('peso')}
          />
          {errors.peso && <div className="text-red-500 text-sm mt-1">⚠️ {errors.peso}</div>}
        </div>
        <div className="flex items-center gap-2 mt-6">
          <Checkbox id="activo" checked={!!data.activo} onCheckedChange={(v) => setData('activo', !!v)} />
          <Label htmlFor="activo">Activo</Label>
        </div>
        <div className="space-y-1">
          <Label htmlFor="descripcion">Descripción</Label>
          <Input
            id="descripcion"
            value={data.descripcion ?? ''}
            onChange={e => setData('descripcion', e.target.value)}
            className={getInputClassName('descripcion')}
          />
          {errors.descripcion && <div className="text-red-500 text-sm mt-1">⚠️ {errors.descripcion}</div>}
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        <div className="space-y-1">
          <Label htmlFor="stock_minimo">Stock Mínimo</Label>
          <Input
            id="stock_minimo"
            type="number"
            min="0"
            step="1"
            value={data.stock_minimo ?? ''}
            onChange={e => setData('stock_minimo', e.target.value ? Number(e.target.value) : null)}
            className={getInputClassName('stock_minimo')}
            placeholder="Cantidad mínima en stock"
          />
          {errors.stock_minimo && <div className="text-red-500 text-sm mt-1">⚠️ {errors.stock_minimo}</div>}
        </div>
        <div className="space-y-1">
          <Label htmlFor="stock_maximo">Stock Máximo</Label>
          <Input
            id="stock_maximo"
            type="number"
            min="0"
            step="1"
            value={data.stock_maximo ?? ''}
            onChange={e => setData('stock_maximo', e.target.value ? Number(e.target.value) : null)}
            className={getInputClassName('stock_maximo')}
            placeholder="Cantidad máxima en stock"
          />
          {errors.stock_maximo && <div className="text-red-500 text-sm mt-1">⚠️ {errors.stock_maximo}</div>}
        </div>
      </div>
    </div>
  );
}
