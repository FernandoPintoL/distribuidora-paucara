import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Link } from '@inertiajs/react';
import tiposPrecioService from '@/services/tipos-precio.service';
import type { Precio } from '@/domain/productos';
import type { TipoPrecio } from '@/domain/tipos-precio';

// Soporte para opciones provenientes del backend (value/label) o del modelo directo (id/nombre)
type TipoPrecioOption = Partial<TipoPrecio> & {
  value?: number | string;
  label?: string;
  icono?: string;
  configuracion?: { icono?: string } & Record<string, unknown>;
};

export interface Step2Props {
  data: { precios: Precio[]; codigos: { codigo: string; es_principal?: boolean; tipo?: string }[] };
  errors: Record<string, string>;
  tipos_precio: TipoPrecio[];
  porcentajeInteres: number;
  precioCosto: number;
  addPrecio: () => void;
  removePrecio: (i: number) => void | Promise<void>;
  setPrecio: (i: number, key: string, value: string | number) => void;
  toggleTipoPrecio: (tipoId: number, checked: boolean) => void;
  getTipoPrecioInfo: (tipoPrecioValue: number) => any;
  calcularGanancia: (precioVenta: number, precioCosto: number) => { ganancia: number; porcentaje: number };
  addCodigo: () => void;
  removeCodigo: (i: number) => void | Promise<void>;
  setCodigo: (i: number, value: string) => void;
}

export default function Step2PreciosCodigos(props: Step2Props) {
  const { data, errors, tipos_precio, porcentajeInteres, precioCosto, addPrecio, removePrecio, setPrecio, toggleTipoPrecio, getTipoPrecioInfo, calcularGanancia, addCodigo, removeCodigo, setCodigo } = props;

  // Normalizadores locales para admitir tanto {id,nombre} como {value,label}
  const tpId = (tp: TipoPrecioOption) => Number((tp?.id ?? tp?.value) ?? 0);
  const tpNombre = (tp: TipoPrecioOption) => String(tp?.nombre ?? tp?.label ?? '');
  const tpIcono = (tp: TipoPrecioOption) => (tp?.configuracion?.icono ?? tp?.icono ?? '');

  return (
    <div>
      <div className="sm:col-span-2 -mb-2">
        <div className="bg-secondary border border-border rounded p-3">
          <div className="text-sm font-semibold text-foreground">Paso 2: Precios y códigos</div>
          <div className="text-xs text-muted-foreground">Seleccione tipos de precio, defina montos y agregue códigos de barra</div>
        </div>
      </div>
      <div className="space-y-4">
        <div className="space-y-6">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <div className="text-sm text-yellow-800 dark:text-yellow-200">
              <span className="font-medium mr-1">Porcentaje de interés (global):</span>
              <span>{porcentajeInteres.toFixed ? porcentajeInteres.toFixed(2) : Number(porcentajeInteres || 0).toFixed(2)}%</span>
            </div>
          </div>

          <div className="bg-secondary border border-border rounded p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-medium text-foreground">Elegir tipos de precio a usar</div>
              <Button asChild size="sm" variant="outline">
                <Link href={tiposPrecioService.createUrl()}>
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                    Nuevo tipo de precio
                  </span>
                </Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-2">
              {tipos_precio.map((tp: TipoPrecioOption) => {
                const currId = tpId(tp);
                const checked = (data.precios || []).some((p: Precio) => p.tipo_precio_id === currId);
                return (
                  <label
                    key={currId}
                    className={
                      [
                        "flex items-center gap-2 text-sm",
                        "bg-card border border-border rounded px-2 py-1 cursor-pointer",
                        "hover:bg-accent hover:border-accent text-foreground",
                        // Adaptabilidad para modo oscuro y claro
                        "transition-colors duration-150",
                        checked
                          ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30 dark:border-blue-400"
                          : "bg-card border-border dark:bg-neutral-900 dark:border-neutral-700"
                      ].join(" ")
                    }
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={(v) => toggleTipoPrecio(currId, !!v)}
                    />
                    <span className="flex items-center gap-1">
                      <span>{tpIcono(tp)}</span>
                      <span>{tpNombre(tp)}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Precios *</Label>
              <Button type="button" size="sm" onClick={addPrecio} variant="outline">
                <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Añadir precio
              </Button>
            </div>
            <div className="space-y-3">
              {data.precios.map((p: Precio, i: number) => {
                const tipoPrecioInfo = getTipoPrecioInfo(p.tipo_precio_id || 2);
                const esGanancia = tipoPrecioInfo?.es_ganancia ?? false;
                const gananciaInfo = esGanancia && precioCosto > 0 ? calcularGanancia(p.monto, precioCosto) : null;

                return (
                  <div key={i} className={`rounded-lg p-4 border-2 ${
                    errors[`precios.${i}.nombre`] || errors[`precios.${i}.monto`]
                      ? 'border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800'
                      : tipoPrecioInfo?.color === 'blue'
                        ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800'
                        : tipoPrecioInfo?.color === 'green'
                          ? 'border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800'
                          : 'border-border bg-secondary'
                  }`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Label className="text-sm font-medium">{tipoPrecioInfo?.nombre || 'Precio'}</Label>
                          {tipoPrecioInfo && (
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              tipoPrecioInfo.color === 'blue' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200' :
                              tipoPrecioInfo.color === 'green' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' :
                              tipoPrecioInfo.color === 'purple' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200' :
                              tipoPrecioInfo.color === 'orange' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-200' :
                              tipoPrecioInfo.color === 'red' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' :
                              'bg-secondary text-foreground'
                            }`}>
                              {tipoPrecioInfo.es_ganancia ? '💰 Ganancia' : '📦 Costo Base'}
                            </span>
                          )}
                        </div>
                        <Button type="button" size="sm" variant="outline" onClick={() => removePrecio(i)} className="text-red-600 hover:text-red-700 hover:bg-red-50">🗑️</Button>
                      </div>

                        {/*<div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Tipo de precio *</Label>
                          <SearchSelect
                            id={`tipo-precio-${i}`}
                            placeholder="Seleccione tipo"
                            value={p.tipo_precio_id ?? ''}
                            onChange={(val) => setPrecio(i, 'tipo_precio_id', val ? Number(val) : (undefined as unknown as number))}
                            options={tipos_precio.map((tipo) => ({
                              value: Number(tipo.id),
                              label: `${(tipo as any)?.configuracion?.icono ?? (tipo as any)?.icono ?? ''} ${tipo.nombre}`.trim(),
                            }))}
                            allowClear={false}
                            renderOption={(option, isSelected) => (
                              <div className={`flex items-center gap-2 py-2 px-3 ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20 border-l-2 border-blue-500' : ''}`}>
                                <span className="text-sm text-foreground">{option.label}</span>
                              </div>
                            )}
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Nombre personalizado</Label>
                          <Input
                            value={p.nombre || ''}
                            onChange={(e) => setPrecio(i, 'nombre', e.target.value)}
                            placeholder={tipoPrecioInfo?.nombre || 'Nombre opcional'}
                            className="text-sm"
                          />
                        </div>
                      </div>*/}

                      <div className="grid grid-cols-3 gap-3 items-end">
                        <div className="col-span-2">
                          <Label className="text-sm font-medium mb-1 block">Monto *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            min="0"
                            value={p.monto === 0 ? '' : p.monto}
                            onChange={(e) => setPrecio(i, 'monto', e.target.value)}
                            onFocus={(e) => e.target.select()}
                            onBlur={(e) => { if (e.target.value === '') { setPrecio(i, 'monto', 0); } }}
                            className={`text-sm ${errors[`precios.${i}.monto`] ? 'border-red-500' : ''}`}
                            placeholder="0.00"
                            inputMode="decimal"
                            pattern="\d+(\.\d{1,2})?"
                          />
                          {errors[`precios.${i}.monto`] && (
                            <div className="text-red-500 text-xs mt-1">⚠️ {errors[`precios.${i}.monto`]}</div>
                          )}
                        </div>
                        <div>
                          <Label className="text-sm font-medium mb-1 block">Moneda</Label>
                          <select
                            className="w-full border border-input rounded-md h-9 px-2 bg-background text-foreground text-sm"
                            value={p.moneda || 'BOB'}
                            onChange={(e) => setPrecio(i, 'moneda', e.target.value)}
                          >
                            <option value="BOB">BOB</option>
                            <option value="USD">USD</option>
                          </select>
                        </div>
                      </div>

                      {gananciaInfo && (
                        <div className="bg-green-50 border border-green-200 rounded p-3 mt-3">
                          <div className="text-sm text-green-800">
                            <div className="font-medium mb-1">💹 Análisis de Ganancia:</div>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                              <div>
                                <span className="font-medium">Ganancia:</span>
                                <span className={`ml-1 ${gananciaInfo.ganancia >= 0 ? 'text-green-600' : 'text-red-600'}`}>{gananciaInfo.ganancia.toFixed(2)} BOB</span>
                              </div>
                              <div>
                                <span className="font-medium">Porcentaje:</span>
                                <span className={`ml-1 ${gananciaInfo.porcentaje >= 0 ? 'text-green-600' : 'text-red-600'}`}>{gananciaInfo.porcentaje.toFixed(1)}%</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Códigos de barra</Label>
            <Button type="button" size="sm" onClick={addCodigo} variant="outline">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Añadir código
            </Button>
          </div>
          <div className="space-y-3">
            {data.codigos.map((c: { codigo: string; es_principal?: boolean; tipo?: string }, i: number) => (
              <div key={i} className={`rounded-lg p-4 border-2 ${c.es_principal ? 'border-blue-200 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-800' : 'border-border bg-secondary'}`}>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm font-medium">Código de barras</Label>
                      {c.es_principal && (
                        <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">Principal</span>
                      )}
                      {c.tipo && (<span className="bg-secondary text-foreground text-xs px-2 py-1 rounded">{c.tipo}</span>)}
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={() => removeCodigo(i)} className="text-red-600 hover:text-red-700 hover:bg-red-50">🗑️</Button>
                  </div>
                  <Input value={c.codigo} onChange={(e) => setCodigo(i, e.target.value)} placeholder="Ingresa código EAN, UPC, etc. (opcional)" className="text-sm font-mono" />
                  {!c.codigo && i === 0 && (
                    <p className="text-xs text-muted-foreground">💡 Si no ingresa un código, se usará automáticamente el ID del producto</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="text-xs text-muted-foreground bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <p className="font-medium text-blue-800 dark:text-blue-200">ℹ️ Información sobre códigos de barra:</p>
            <ul className="mt-1 space-y-1 text-blue-700 dark:text-blue-200">
              <li>• Los códigos de barra son opcionales al crear un producto</li>
              <li>• Si no se proporciona ningún código, se usará el ID del producto automáticamente</li>
              <li>• El primer código ingresado será marcado como principal</li>
              <li>• Puedes agregar múltiples códigos por producto si es necesario</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
