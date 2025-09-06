import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import SearchSelect from '@/components/ui/search-select';
import type { StockAlmacen } from '@/domain/productos';

interface Option { value: number | string; label: string }

export interface Step3Props {
  data: { almacenes: StockAlmacen[] };
  almacenesOptions: Option[];
  addAlmacen: () => void;
  setAlmacen: (i: number, key: keyof StockAlmacen, value: number | string | undefined) => void;
  removeAlmacen: (i: number) => void | Promise<void>;
}

export default function Step3Almacenes({ data, almacenesOptions, addAlmacen, setAlmacen, removeAlmacen }: Step3Props) {
  return (
    <div className="bg-secondary border border-border rounded p-4">
      <div className="text-sm font-semibold text-foreground mb-1">Paso 3: Ajustes de almacén y stock</div>
      <div className="text-xs text-muted-foreground mb-3">Complete información por almacén: stock, número de lote y fecha de vencimiento.</div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Almacenes</Label>
          <Button type="button" size="sm" onClick={addAlmacen} variant="outline" aria-label="Agregar almacén">Añadir almacén</Button>
        </div>
        {(data.almacenes || []).length === 0 && (
          <div className="text-sm text-muted-foreground">No hay entradas. Añada al menos un almacén si desea controlar stock.</div>
        )}
        {(data.almacenes || []).map((a: StockAlmacen, i: number) => (
          <div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-2 items-end p-3 border rounded bg-card">
            <div>
              <Label className="text-xs">Almacén</Label>
              <SearchSelect
                id={`almacen-select-${i}`}
                placeholder="Seleccione un almacén"
                value={a.almacen_id ?? ''}
                options={almacenesOptions}
                onChange={(value) => setAlmacen(i, 'almacen_id', value ? Number(value) : '')}
                allowClear={true}
              />
            </div>
            <div>
              <Label className="text-xs">Stock</Label>
              <Input type="number" value={a.stock ?? 0} onChange={e => setAlmacen(i, 'stock', Number(e.target.value || 0))} min={0} aria-label={`Stock almacén ${i+1}`} />
            </div>
            <div>
              <Label className="text-xs">Lote (opcional)</Label>
              <Input value={a.lote || ''} onChange={e => setAlmacen(i, 'lote', e.target.value)} placeholder="Código de lote" aria-label={`Lote almacén ${i+1}`} />
            </div>
            <div>
              <Label className="text-xs">Fecha de vencimiento</Label>
              <Input type="date" value={a.fecha_vencimiento || ''} onChange={e => setAlmacen(i, 'fecha_vencimiento', e.target.value)} aria-label={`Fecha de vencimiento almacén ${i+1}`} />
            </div>
            <div className="col-span-full flex justify-end">
              <Button type="button" variant="destructive" size="sm" onClick={() => removeAlmacen(i)} aria-label={`Eliminar almacén ${i+1}`}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
