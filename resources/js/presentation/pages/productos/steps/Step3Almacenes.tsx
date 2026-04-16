import { Label } from '@/presentation/components/ui/label';
import { Button } from '@/presentation/components/ui/button';
import { Input } from '@/presentation/components/ui/input';
import { Checkbox } from '@/presentation/components/ui/checkbox';
import SearchSelect from '@/presentation/components/ui/search-select';
import type { StockAlmacen } from '@/domain/entities/productos';
import { useState, useEffect } from 'react';

interface Option { value: number | string; label: string }

export interface Step3Props {
  data: { almacenes: StockAlmacen[] };
  almacenesOptions: Option[];
  sectores?: Record<number | string, Option[]>; // ✨ NUEVO: Sectores pre-cargados del backend
  addAlmacen: (prefill?: Partial<StockAlmacen>) => void;
  setAlmacen: (i: number, key: keyof StockAlmacen, value: number | string | undefined) => void;
  removeAlmacen: (i: number) => void | Promise<void>;
}

function todayISO(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export default function Step3Almacenes({ data, almacenesOptions, sectores, addAlmacen, setAlmacen, removeAlmacen }: Step3Props) {
  // ✨ Inicializar con sectores pre-cargados del backend si están disponibles
  const [sectoresOptions, setSectoresOptions] = useState<Record<number | string, Option[]>>(sectores || {});
  const [loadingSectores, setLoadingSectores] = useState<Record<number | string, boolean>>({});

  // Cargar sectores cuando se selecciona un almacén
  const handleAlmacenChange = async (i: number, almacenId: number | string) => {
    setAlmacen(i, 'almacen_id', almacenId);

    if (!almacenId) {
      setAlmacen(i, 'sector_id', undefined);
      return;
    }

    // ✨ Si ya tenemos los sectores (pre-cargados o en caché), no cargar de nuevo
    if (sectoresOptions[almacenId]) {
      return;
    }

    // Cargar sectores del almacén si no están pre-cargados
    setLoadingSectores(prev => ({ ...prev, [almacenId]: true }));
    try {
      const response = await fetch(`/api/almacenes/${almacenId}/sectores`);
      if (response.ok) {
        const sectores = await response.json();
        const options = sectores.data?.map((s: any) => ({
          value: s.id,
          label: s.nombre
        })) || [];
        setSectoresOptions(prev => ({ ...prev, [almacenId]: options }));
      }
    } catch (error) {
      console.error('Error cargando sectores:', error);
    } finally {
      setLoadingSectores(prev => ({ ...prev, [almacenId]: false }));
    }
  };

  return (
    <div className="bg-secondary border border-border rounded p-4">
      <div className="text-sm font-semibold text-foreground mb-1">Paso 3: Ajustes de almacén, sector y stock</div>
      <div className="text-xs text-muted-foreground mb-3">Complete información por almacén: seleccione un sector (opcional), defina stock, número de lote y fecha de vencimiento.
        <span className="block mt-1">💡 Tip: Los sectores se cargan automáticamente al seleccionar un almacén. Si gestionas lotes constantemente, usa el control de inventario.</span>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-sm font-medium">Almacenes y Sectores</Label>
          <Button type="button" size="sm" onClick={() => addAlmacen()} variant="outline" aria-label="Agregar almacén">Añadir almacén</Button>
        </div>
        {(data.almacenes || []).length === 0 && (
          <div className="text-sm text-muted-foreground">No hay entradas. Añada al menos un almacén si desea controlar stock.</div>
        )}
        {(data.almacenes || []).map((a: StockAlmacen, i: number) => (
          <div key={i} className="border rounded bg-card p-3 space-y-3">
            {/* Fila 1: Almacén y Sector */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-semibold text-foreground">Almacén *</Label>
                <SearchSelect
                  id={`almacen-select-${i}`}
                  placeholder="Seleccione un almacén"
                  value={a.almacen_id ?? ''}
                  options={almacenesOptions}
                  onChange={(value) => handleAlmacenChange(i, value ? Number(value) : '')}
                  allowClear={true}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground">Sector (Opcional)</Label>
                <SearchSelect
                  id={`sector-select-${i}`}
                  placeholder={loadingSectores[a.almacen_id] ? "Cargando sectores..." : "Seleccione un sector"}
                  value={a.sector_id ?? ''}
                  options={sectoresOptions[a.almacen_id] || []}
                  onChange={(value) => setAlmacen(i, 'sector_id', value ? Number(value) : undefined)}
                  allowClear={true}
                  disabled={!a.almacen_id || loadingSectores[a.almacen_id]}
                />
              </div>
            </div>

            {/* Fila 2: Lote */}
            <div>
              <Label className="text-xs font-semibold text-foreground">Lote (Opcional)</Label>
              <Input
                value={a.lote || ''}
                onChange={e => setAlmacen(i, 'lote', e.target.value)}
                placeholder="Código de lote"
                aria-label={`Lote almacén ${i+1}`}
              />
            </div>

            {/* Fila 3: Información de Stock (readonly con 2 decimales) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 bg-muted/50 p-3 rounded border border-border">
              <div>
                <Label className="text-xs font-semibold text-foreground">Cantidad Total</Label>
                <Input
                  type="text"
                  value={a.stock !== undefined ? Number(a.stock).toFixed(2) : '0.00'}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                  aria-label={`Cantidad total almacén ${i+1}`}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground">Disponible</Label>
                <Input
                  type="text"
                  value={a.cantidad_disponible !== undefined ? Number(a.cantidad_disponible).toFixed(2) : '0.00'}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                  aria-label={`Cantidad disponible almacén ${i+1}`}
                />
              </div>
              <div>
                <Label className="text-xs font-semibold text-foreground">Reservada</Label>
                <Input
                  type="text"
                  value={a.cantidad_reservada !== undefined ? Number(a.cantidad_reservada).toFixed(2) : '0.00'}
                  readOnly
                  disabled
                  className="bg-muted cursor-not-allowed"
                  aria-label={`Cantidad reservada almacén ${i+1}`}
                />
              </div>
            </div>

            {/* Fila 4: Fecha de vencimiento */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-semibold text-foreground">Fecha de vencimiento</Label>
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

            {/* Botones de acciones */}
            <div className="flex gap-2 justify-between pt-2 border-t">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addAlmacen({
                  almacen_id: a.almacen_id ?? '',
                  almacen_nombre: a.almacen_nombre ?? '',
                  sector_id: a.sector_id,
                  sector_nombre: a.sector_nombre,
                  lote: '',
                  fecha_vencimiento: ''
                })}
                aria-label={`Añadir lote para almacén ${i+1}`}
              >
                ➕ Añadir lote
              </Button>
              <Button type="button" variant="destructive" size="sm" onClick={() => removeAlmacen(i)} aria-label={`Eliminar almacén ${i+1}`}>
                🗑️ Eliminar
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
