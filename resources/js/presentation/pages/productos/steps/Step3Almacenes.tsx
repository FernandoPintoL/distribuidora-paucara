import { Label } from '@/presentation/components/ui/label';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import SearchSelect from '@/presentation/components/ui/search-select';
import type { StockAlmacen } from '@/domain/entities/productos';

interface Option { value: number | string; label: string }

export interface Step3Props {
  data: { almacenes: StockAlmacen[] };
  almacenesOptions: Option[];
  addAlmacen: (prefill?: Partial<StockAlmacen>) => void;
  setAlmacen: (i: number, key: keyof StockAlmacen, value: number | string | undefined) => void;
  removeAlmacen: (i: number) => void | Promise<void>;
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Step3Almacenes({ data, almacenesOptions, addAlmacen, setAlmacen, removeAlmacen }: Step3Props) {
  return (
    <div className="bg-secondary border border-border rounded p-4">
      <div className="text-sm font-semibold text-foreground mb-1">Paso 3: Ajustes de almacén y stock</div>
      <div className="text-xs text-muted-foreground mb-3">Complete información por almacén: stock, número de lote y fecha de vencimiento.
        <span className="block mt-1">Tip: Si gestionas lotes y vencimientos constantemente, puedes hacerlo más a detalle desde el control de inventario.</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Almacenes</Label>
          <Button type="button" size="sm" onClick={() => addAlmacen()} variant="outline" aria-label="Agregar almacén">Añadir almacén</Button>
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
              <Input
                type="number"
                value={a.stock ?? ''}
                onChange={e => {
                  const value = e.target.value;
                  setAlmacen(i, 'stock', value === '' ? undefined : Number(value));
                }}
                min={0}
                aria-label={`Stock almacén ${i+1}`}
              />
            </div>
            <div>
              <Label className="text-xs">Lote (opcional)</Label>
              <Input value={a.lote || ''} onChange={e => setAlmacen(i, 'lote', e.target.value)} placeholder="Código de lote" aria-label={`Lote almacén ${i+1}`} />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Fecha de vencimiento</Label>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id={`has-exp-${i}`}
                    checked={!!a.fecha_vencimiento}
                    onCheckedChange={(v) => {
                      const checked = !!v;
                      if (checked) {
                        const next = a.fecha_vencimiento && a.fecha_vencimiento !== '' ? a.fecha_vencimiento : todayISO();
                        setAlmacen(i, 'fecha_vencimiento', next);
                      } else {
                        setAlmacen(i, 'fecha_vencimiento', '');
                      }
                    }}
                    aria-label={`Tiene vencimiento almacén ${i+1}`}
                  />
                  <Label htmlFor={`has-exp-${i}`} className="text-xs cursor-pointer">Tiene vencimiento</Label>
                </div>
              </div>
              <Input
                type="date"
                value={a.fecha_vencimiento || ''}
                onChange={e => setAlmacen(i, 'fecha_vencimiento', e.target.value)}
                aria-label={`Fecha de vencimiento almacén ${i+1}`}
                disabled={!a.fecha_vencimiento}
              />
            </div>
            <div className="col-span-full flex justify-between">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAlmacen({
                  almacen_id: a.almacen_id ?? '',
                  almacen_nombre: a.almacen_nombre ?? '',
                  stock: 0,
                  lote: '',
                  fecha_vencimiento: ''
                })}
                aria-label={`Añadir lote para almacén ${i+1}`}
              >
                Añadir lote
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeAlmacen(i)} aria-label={`Eliminar almacén ${i+1}`}>Eliminar</Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
