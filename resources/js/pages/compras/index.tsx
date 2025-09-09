import { Head, Link, usePage } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';

interface Proveedor { id: number; nombre: string }
interface Moneda { id: number; codigo: string }
interface Usuario { id: number; name: string }
interface EstadoDocumento { id: number; nombre: string }
interface Producto { id: number; nombre: string }

interface DetalleCompra {
  id: number;
  producto: Producto;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
}

interface Compra {
  id: number;
  numero: string;
  fecha: string;
  numero_factura?: string | null;
  total: number;
  proveedor?: Proveedor;
  usuario?: Usuario;
  estado_documento?: EstadoDocumento;
  moneda?: Moneda;
  detalles?: DetalleCompra[];
}

interface PageProps {
  compras: Compra[];
}

export default function ComprasIndex() {
  const { props } = usePage<PageProps>();
  const compras = props.compras || [];

  return (
    <AppLayout breadcrumbs={[{ label: 'Compras', href: route('compras.index') }]}>
      <Head title="Compras" />
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Compras</h1>
        <Link href={route('compras.create')} className="btn btn-primary">Nueva compra</Link>
      </div>

      <div className="rounded-lg border bg-white dark:bg-zinc-900">
        <div className="grid grid-cols-12 p-3 text-xs font-medium text-zinc-600 dark:text-zinc-300">
          <div className="col-span-2">Número</div>
          <div className="col-span-2">Fecha</div>
          <div className="col-span-3">Proveedor</div>
          <div className="col-span-2 text-right">Total</div>
          <div className="col-span-3 text-right">Acciones</div>
        </div>
        <div className="divide-y">
          {compras.map((c) => (
            <div key={c.id} className="grid grid-cols-12 p-3 text-sm">
              <div className="col-span-2">{c.numero}</div>
              <div className="col-span-2">{new Date(c.fecha).toLocaleDateString()}</div>
              <div className="col-span-3">{c.proveedor?.nombre ?? '-'}</div>
              <div className="col-span-2 text-right">{Number(c.total).toFixed(2)}</div>
              <div className="col-span-3 text-right space-x-2">
                <Link href={route('compras.show', c.id)} className="text-blue-600 hover:underline">Ver</Link>
                <Link href={route('compras.edit', c.id)} className="text-amber-600 hover:underline">Editar</Link>
              </div>
            </div>
          ))}
          {compras.length === 0 && (
            <div className="p-6 text-center text-zinc-500">No hay compras registradas.</div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
