import { Card, CardContent, CardHeader, CardTitle } from '@/presentation/components/ui/card';
import { Button } from '@/presentation/components/ui/button';
import { Label } from '@/presentation/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/presentation/components/ui/select';

interface Almacen {
  id: number;
  nombre: string;
}

interface Categoria {
  id: number;
  nombre: string;
}

interface StockFiltrosCardProps {
  formData: {
    almacen_id: string;
    categoria_id: string;
    stock_bajo: boolean;
    stock_alto: boolean;
  };
  almacenes: Almacen[];
  categorias: Categoria[];
  ALL_VALUE: string;
  onUpdateField: (key: string, value: string | boolean) => void;
  onFilter: () => void;
  onClear: () => void;
}

export function StockFiltrosCard({
  formData,
  almacenes,
  categorias,
  ALL_VALUE,
  onUpdateField,
  onFilter,
  onClear,
}: StockFiltrosCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filtros</CardTitle>
      </CardHeader>
      <CardContent>
        <form className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label>Almacén</Label>
              <Select
                value={formData.almacen_id}
                onValueChange={(value) => onUpdateField('almacen_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todos los almacenes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todos los almacenes</SelectItem>
                  {almacenes.map((almacen) => (
                    <SelectItem key={almacen.id} value={almacen.id.toString()}>
                      {almacen.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Categoría</Label>
              <Select
                value={formData.categoria_id}
                onValueChange={(value) => onUpdateField('categoria_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Todas las categorías" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_VALUE}>Todas las categorías</SelectItem>
                  {categorias.map((categoria) => (
                    <SelectItem key={categoria.id} value={categoria.id.toString()}>
                      {categoria.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Filtros Especiales</Label>
              <div className="flex items-center space-x-4 mt-2">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.stock_bajo}
                    onChange={(e) => onUpdateField('stock_bajo', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Stock Bajo</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.stock_alto}
                    onChange={(e) => onUpdateField('stock_alto', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm">Stock Alto</span>
                </label>
              </div>
            </div>

            <div className="flex items-end">
              <Button onClick={onFilter} className="w-full">
                Aplicar Filtros
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
