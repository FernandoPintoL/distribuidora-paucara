import { Head, Link, useForm, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

interface Proveedor { id: number; nombre: string }
interface Moneda { id: number; codigo: string; nombre?: string }
interface EstadoDocumento { id: number; nombre: string }
interface Producto { id: number; nombre: string }

// Form types
interface DetalleForm {
  producto_id: number | '';
  cantidad: number;
  precio_unitario: number;
  descuento: number;
  subtotal: number;
  lote: string;
  fecha_vencimiento: string;
}

interface FormData {
  numero: string;
  fecha: string;
  numero_factura: string;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observaciones: string;
  proveedor_id: number | '';
  usuario_id: number | '';
  estado_documento_id: number | '';
  moneda_id: number | '';
  detalles: DetalleForm[];
}

interface PageProps {
  proveedores: Proveedor[];
  monedas: Moneda[];
  estados: EstadoDocumento[];
  productos: Producto[];
}

export default function ComprasCreate() {
  const { props } = usePage<PageProps>();
  const { user, can } = useAuth();
  const { data, setData, post, processing, errors } = useForm<FormData>({
    numero: '',
    fecha: new Date().toISOString().slice(0,10),
    numero_factura: '',
    subtotal: 0,
    descuento: 0,
    impuesto: 0,
    total: 0,
    observaciones: '',
    proveedor_id: '',
    usuario_id: user?.id ?? '',
    estado_documento_id: props.estados?.[0]?.id ?? '',
    moneda_id: props.monedas?.[0]?.id ?? '',
    detalles: [
      { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0, lote: '', fecha_vencimiento: '' },
    ],
  });

  const fieldError = (path: string) => (errors as unknown as Record<string, string | undefined>)[path];

  const canCreate = can('compras.create');

  // Recalcular totales cuando cambian detalles
  useEffect(() => {
    const subtotal = data.detalles.reduce((acc, d: DetalleForm) => acc + Number(d.cantidad || 0) * Number(d.precio_unitario || 0) - Number(d.descuento || 0), 0);
    const impuesto = 0; // Por ahora manual
    const total = subtotal + impuesto;
    setData(prev => ({ ...prev, subtotal, impuesto, total }));
  }, [data.detalles]);

  const addRow = () => {
    setData('detalles', [...data.detalles, { producto_id: '', cantidad: 1, precio_unitario: 0, descuento: 0, subtotal: 0, lote: '', fecha_vencimiento: '' }]);
  };

  const removeRow = (idx: number) => {
    setData('detalles', data.detalles.filter((_: DetalleForm, i: number) => i !== idx));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    post(route('compras.store'));
  };

  return (
    <AppLayout breadcrumbs={[{ label: 'Compras', href: route('compras.index') }, { label: 'Nueva compra' }]}>
      <Head title="Nueva Compra" />

      <form onSubmit={submit} className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Nueva compra</h1>
          <div className="space-x-2">
            <Link href={route('compras.index')} className="btn">Cancelar</Link>
            <button type="submit" disabled={!canCreate || processing} title={!canCreate ? 'No tiene permiso para crear compras' : undefined} className="btn btn-primary">{processing ? 'Guardando...' : 'Guardar'}</button>
          </div>
        </div>

        {!canCreate && (
          <Alert className="border-amber-300 bg-amber-50 text-amber-900">
            <AlertTitle>Permiso requerido</AlertTitle>
            <AlertDescription>No tiene permiso para crear compras. Puede revisar la información pero no podrá guardar cambios.</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm mb-1">Número</label>
            <input className="input" value={data.numero} onChange={e => setData('numero', e.target.value)} />
            {errors.numero && <p className="text-red-600 text-xs mt-1">{errors.numero}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Fecha</label>
            <input type="date" className="input" value={data.fecha} onChange={e => setData('fecha', e.target.value)} />
            {errors.fecha && <p className="text-red-600 text-xs mt-1">{errors.fecha}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Proveedor</label>
            <select className="input" value={data.proveedor_id} onChange={e => setData('proveedor_id', e.target.value)}>
              <option value="">Seleccione</option>
              {props.proveedores?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
            {errors.proveedor_id && <p className="text-red-600 text-xs mt-1">{errors.proveedor_id}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Moneda</label>
            <select className="input" value={data.moneda_id} onChange={e => setData('moneda_id', e.target.value)}>
              {props.monedas?.map(m => <option key={m.id} value={m.id}>{m.codigo}</option>)}
            </select>
            {errors.moneda_id && <p className="text-red-600 text-xs mt-1">{errors.moneda_id}</p>}
          </div>
        </div>

        <div className="rounded-lg border overflow-hidden">
          <div className="grid grid-cols-12 p-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800">
            <div className="col-span-5">Producto</div>
            <div className="col-span-2 text-right">Cantidad</div>
            <div className="col-span-2 text-right">Precio</div>
            <div className="col-span-2 text-right">Subtotal</div>
            <div className="col-span-1"></div>
          </div>
          <div className="divide-y">
            {data.detalles.map((d: DetalleForm, idx: number) => (
              <div key={idx} className="grid grid-cols-12 gap-2 p-2 items-center">
                <div className="col-span-5">
                  <select className="input w-full" value={d.producto_id} onChange={e => {
                    const v = e.target.value; const next = [...data.detalles]; next[idx].producto_id = v; setData('detalles', next);
                  }}>
                    <option value="">Seleccione producto</option>
                    {props.productos?.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                  </select>
                  {fieldError(`detalles.${idx}.producto_id`) && (
                    <p className="text-red-600 text-xs mt-1">{fieldError(`detalles.${idx}.producto_id`)}</p>
                  )}
                </div>
                <div className="col-span-2">
                  <input type="number" min={1} className="input text-right" value={d.cantidad}
                    onChange={e => { const v = Number(e.target.value); const next = [...data.detalles]; next[idx].cantidad = v; setData('detalles', next); }} />
                </div>
                <div className="col-span-2">
                  <input type="number" step="0.01" className="input text-right" value={d.precio_unitario}
                    onChange={e => { const v = Number(e.target.value); const next = [...data.detalles]; next[idx].precio_unitario = v; setData('detalles', next); }} />
                </div>
                <div className="col-span-2 text-right">
                  {(Number(d.cantidad || 0) * Number(d.precio_unitario || 0)).toFixed(2)}
                </div>
                <div className="col-span-1 text-right">
                  <button type="button" className="text-red-600" onClick={() => removeRow(idx)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
          <div className="p-3">
            <button type="button" className="btn" onClick={addRow}>Agregar producto</button>
          </div>
        </div>

        <div className="flex justify-end gap-6 text-sm">
          <div><span className="text-zinc-500">Subtotal:</span> <span className="font-medium">{Number(data.subtotal).toFixed(2)}</span></div>
          <div><span className="text-zinc-500">Impuesto:</span> <span className="font-medium">{Number(data.impuesto).toFixed(2)}</span></div>
          <div><span className="text-zinc-500">Total:</span> <span className="font-semibold">{Number(data.total).toFixed(2)}</span></div>
        </div>
      </form>
    </AppLayout>
  );
}
