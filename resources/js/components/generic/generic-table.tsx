// Presentation Layer: Generic table component - Enhanced UI
import { Button } from '@/components/ui/button';
import type { BaseEntity, TableColumn } from '@/domain/generic';
import { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import productosService from '@/services/productos.service';
import NotificationService from '@/services/notification.service';
import { Trash2, Pencil, DollarSign, Image } from 'lucide-react';

interface ProductoLike extends BaseEntity {
  nombre?: string;
  precios?: { nombre: string; monto: number; tipo_precio_id?: number }[];
  codigos?: { codigo: string; es_principal?: boolean; tipo?: string }[];
  perfil?: { url?: string; file?: File | null } | null;
  galeria?: { id?: number; url?: string; file?: File | null; _delete?: boolean }[];
  historial_precios?: { id?: number; tipo_precio_nombre?: string; fecha_cambio?: string; valor_anterior?: number; valor_nuevo?: number; porcentaje_cambio?: number; motivo?: string; usuario?: string }[];
}

interface FiltersState { [k: string]: string | number | undefined | null; }

interface GenericTableProps<T extends BaseEntity> {
  entities: T[];
  columns: TableColumn<T>[];
  onEdit: (entity: T) => void;
  onDelete: (entity: T) => void;
  entityName: string;
  isLoading?: boolean;
}

export default function GenericTable<T extends BaseEntity>({
  entities,
  columns,
  onEdit,
  onDelete,
  entityName,
  isLoading = false
}: GenericTableProps<T>) {
  const [historialModal, setHistorialModal] = useState<{ entity: ProductoLike } | null>(null);
  const [quickPrecioModal, setQuickPrecioModal] = useState<{ entity: ProductoLike } | null>(null);
  const [quickImagenModal, setQuickImagenModal] = useState<{ entity: ProductoLike } | null>(null);

  const openHistorialModal = (entity: ProductoLike) => setHistorialModal({ entity });
  const closeHistorialModal = () => setHistorialModal(null);
  const closeQuickPrecioModal = () => setQuickPrecioModal(null);
  const closeQuickImagenModal = () => setQuickImagenModal(null);

  const openQuickPrecioModal = (entity: T | ProductoLike) => {
    const prod = entity as ProductoLike;
    if (prod.precios || prod.codigos) {
      const clone: ProductoLike = JSON.parse(JSON.stringify({
        precios: prod.precios || [],
        codigos: prod.codigos || [],
        id: prod.id,
        nombre: prod.nombre
      }));
      setQuickPrecioModal({ entity: clone });
    }
  };
  const openQuickImagenModal = (entity: T | ProductoLike) => {
    const prod = entity as ProductoLike;
    if (prod.perfil || prod.galeria) {
      setQuickImagenModal({ entity: { id: prod.id, nombre: prod.nombre, perfil: prod.perfil || null, galeria: prod.galeria || [] } });
    }
  };

  const saveQuickPreciosCodigos = () => {
    if (!quickPrecioModal?.entity?.id) return;
    const { entity } = quickPrecioModal;
    const formData = new FormData();
    formData.append('_method', 'PUT');
    (entity.precios || []).forEach((p, i) => {
      if (!p.nombre?.trim()) return;
      formData.append(`precios[${i}][nombre]`, p.nombre);
      formData.append(`precios[${i}][monto]`, String(p.monto ?? 0));
      if (p.tipo_precio_id != null) formData.append(`precios[${i}][tipo_precio_id]`, String(p.tipo_precio_id));
    });
    (entity.codigos || []).forEach((c, i) => {
      if (!c.codigo?.trim()) return;
      formData.append(`codigos[${i}][codigo]`, c.codigo.trim());
      if (c.es_principal) formData.append(`codigos[${i}][es_principal]`, '1');
      if (c.tipo) formData.append(`codigos[${i}][tipo]`, c.tipo);
    });
    const toastId = NotificationService.loading('Guardando cambios de precios y códigos...');
    router.post(productosService.updateUrl(entity.id), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => { NotificationService.dismiss(toastId); NotificationService.success('Precios y códigos actualizados'); closeQuickPrecioModal(); router.reload({ only: ['productos'] }); },
      onError: () => { NotificationService.dismiss(toastId); NotificationService.error('Error al actualizar precios/códigos'); }
    });
  };

  const saveQuickImagenes = () => {
    if (!quickImagenModal?.entity?.id) return;
    const { entity } = quickImagenModal;
    const formData = new FormData();
    formData.append('_method', 'PUT');
    if (entity.perfil?.file instanceof File) formData.append('perfil', entity.perfil.file);
    (entity.galeria || []).forEach((img, i) => {
      if (img._delete && img.id) { formData.append(`galeria_eliminar[${i}]`, String(img.id)); }
      else if (img.file instanceof File) { formData.append(`galeria[${i}]`, img.file); }
    });
    const toastId = NotificationService.loading('Guardando imágenes...');
    router.post(productosService.updateUrl(entity.id), formData, {
      forceFormData: true,
      preserveScroll: true,
      onSuccess: () => { NotificationService.dismiss(toastId); NotificationService.success('Imágenes actualizadas'); closeQuickImagenModal(); router.reload({ only: ['productos'] }); },
      onError: () => { NotificationService.dismiss(toastId); NotificationService.error('Error al actualizar imágenes'); }
    });
  };

  const { props } = usePage<{ props?: { filters?: FiltersState } }>() as unknown as { props: { filters?: FiltersState } };
  const currentFilters: FiltersState = props?.filters || {};
  const orderBy = currentFilters.order_by || (currentFilters as Record<string, unknown>).orderBy || undefined;
  const orderDir = (currentFilters.order_dir || (currentFilters as Record<string, unknown>).orderDir || 'desc') as 'asc' | 'desc';

  const toggleSort = (col: TableColumn<T>) => {
    if (!col.sortable) return;
    const newDir: 'asc' | 'desc' = orderBy === col.key ? (orderDir === 'asc' ? 'desc' : 'asc') : 'asc';
    const raw: Record<string, unknown> = { ...currentFilters, order_by: String(col.key), order_dir: newDir };
    const query: Record<string, string | number> = {};
    Object.entries(raw).forEach(([k, v]) => { if (v != null) query[k] = typeof v === 'number' ? v : String(v); });
    router.get(window.location.pathname, query, { preserveState: true, preserveScroll: true });
  };

  if (!entities.length) {
    return (
      <div className="text-center py-12">
        <div className="mx-auto w-24 h-24 mb-4 text-gray-300">
          <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
        </div>
        <h3 className="text-lg font-semibold text-foreground mb-2">No hay {entityName}s registrados</h3>
        <p className="text-muted-foreground mb-4">Comienza agregando tu primer {entityName}.</p>
      </div>
    );
  }

  const renderCellValue = (column: TableColumn<T>, entity: T) => {
    const value = (entity as Record<string, unknown>)[column.key as string];
    if (column.render) {
      if (column.key === 'historial_precios') return column.render(value as never, entity, openHistorialModal as unknown as (e: T) => void);
      return column.render(value as never, entity);
    }
    switch (column.type) {
      case 'boolean':
        return (
          <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${value
              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-900/40 dark:text-emerald-200 dark:border-emerald-800'
              : 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-900/40 dark:text-red-200 dark:border-red-800'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${value ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            {value ? 'Activo' : 'Inactivo'}
          </span>
        );
      case 'date':
        return value ? (
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {new Date(String(value)).toLocaleDateString('es-ES')}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic text-sm">Sin fecha</span>
        );
      case 'number':
        return typeof value === 'number' ? (
          <span className="font-mono text-gray-700 dark:text-gray-300 font-medium">
            {value.toLocaleString('es-ES')}
          </span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500">-</span>
        );
      default:
        if (value && typeof value === 'object' && 'nombre' in (value as Record<string, unknown>)) {
          return <span className="text-gray-700 dark:text-gray-300">{(value as { nombre: string }).nombre || '-'}</span>;
        }
        if (value && typeof value === 'object' && 'codigo' in (value as Record<string, unknown>) && 'nombre' in (value as Record<string, unknown>)) {
          const v = value as { codigo: string; nombre: string };
          return (
            <span className="text-gray-700 dark:text-gray-300">
              <span className="font-mono text-xs bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded mr-2">
                {v.codigo}
              </span>
              {v.nombre}
            </span>
          );
        }
        return value ? (
          <span className="text-gray-700 dark:text-gray-300">{String(value)}</span>
        ) : (
          <span className="text-gray-400 dark:text-gray-500 italic">-</span>
        );
    }
  };

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              {columns.map(column => (
                <th
                  key={String(column.key)}
                  onClick={() => toggleSort(column)}
                  className={`py-3 text-left font-medium text-gray-900 dark:text-gray-100 ${column.sortable ? 'cursor-pointer hover:text-blue-600 dark:hover:text-blue-400' : ''}`}
                >
                  <span className="inline-flex items-center gap-1">
                    {column.label}
                    {column.sortable && (
                      <span className="text-xs opacity-60 hover:opacity-100 transition-opacity">
                        {orderBy === column.key ? (orderDir === 'asc' ? '▲' : '▼') : '⇅'}
                      </span>
                    )}
                  </span>
                </th>
              ))}
              <th className="py-3 text-right font-medium text-gray-900 dark:text-gray-100">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            {entities.map((entity) => (
              <tr
                key={entity.id}
                className="border-b border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800/50"
              >
                {columns.map(column => (
                  <td key={String(column.key)} className="py-4">
                    {column.key === 'id' ? (
                      <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800">
                        #{entity.id}
                      </span>
                    ) : (
                      <div className={`${column.key === columns[1]?.key ? 'font-medium text-gray-900 dark:text-gray-100' : 'text-gray-600 dark:text-gray-300'}`}>
                        {renderCellValue(column, entity)}
                      </div>
                    )}
                  </td>
                ))}
                <td className="py-4">
                  <div className="flex justify-end space-x-2">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onEdit(entity)}
                      disabled={isLoading}
                      title={`Editar ${entityName}`}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {'precios' in (entity as unknown as Record<string, unknown>) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openQuickPrecioModal(entity)}
                        title="Editar precios y códigos"
                        className="text-amber-600 hover:text-amber-700 dark:text-amber-400 dark:hover:text-amber-300"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                    {'perfil' in (entity as unknown as Record<string, unknown>) && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openQuickImagenModal(entity)}
                        title="Editar imágenes"
                        className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
                      >
                        <Image className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDelete(entity)}
                      disabled={isLoading}
                      title={`Eliminar ${entityName}`}
                      className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {historialModal?.entity?.historial_precios && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-card rounded-lg shadow-lg max-w-lg w-full p-6 relative">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={closeHistorialModal} aria-label="Cerrar">✕</button>
            <h2 className="text-lg font-bold mb-4">Historial de precios de {historialModal.entity.nombre}</h2>
            {historialModal.entity.historial_precios.length === 0 ? <div className="text-muted-foreground italic">Sin historial de precios.</div> : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {historialModal.entity.historial_precios.map((h, i) => (
                  <div key={h.id || i} className="border-b pb-2 mb-2 last:border-b-0 last:pb-0 last:mb-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="font-semibold text-blue-700 dark:text-blue-300">{h.tipo_precio_nombre}</span>
                      <span className="text-xs text-muted-foreground">{h.fecha_cambio}</span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-xs mt-1">
                      <span className="bg-gray-100 dark:bg-secondary px-2 py-0.5 rounded">Anterior: <b>{h.valor_anterior}</b></span>
                      <span className="bg-gray-100 dark:bg-secondary px-2 py-0.5 rounded">Nuevo: <b>{h.valor_nuevo}</b></span>
                      <span className="bg-gray-100 dark:bg-secondary px-2 py-0.5 rounded">% Cambio: <b>{h.porcentaje_cambio}</b></span>
                      <span className="bg-gray-100 dark:bg-secondary px-2 py-0.5 rounded">Motivo: <b>{h.motivo}</b></span>
                      <span className="bg-gray-100 dark:bg-secondary px-2 py-0.5 rounded">Usuario: <b>{h.usuario}</b></span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {quickPrecioModal?.entity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-card rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={closeQuickPrecioModal} aria-label="Cerrar">✕</button>
            <h2 className="text-lg font-bold mb-4">Precios y Códigos - {quickPrecioModal.entity.nombre}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Precios</h3>
                <div className="space-y-2">
                  {(quickPrecioModal.entity.precios || []).map((p, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="flex-1 border rounded px-2 py-1 text-sm bg-background" value={p.nombre} placeholder="Nombre" onChange={e => { const next = [...(quickPrecioModal.entity.precios || [])]; next[i].nombre = e.target.value; setQuickPrecioModal(m => m ? { entity: { ...m.entity, precios: next } } : m); }} />
                      <input type="number" step="0.01" className="w-32 border rounded px-2 py-1 text-sm text-right font-mono" value={p.monto} onChange={e => { const next = [...(quickPrecioModal.entity.precios || [])]; next[i].monto = parseFloat(e.target.value || '0'); setQuickPrecioModal(m => m ? { entity: { ...m.entity, precios: next } } : m); }} />
                      <button className="text-red-600 text-xs hover:underline" onClick={() => { const next = [...(quickPrecioModal.entity.precios || [])]; next.splice(i, 1); setQuickPrecioModal(m => m ? { entity: { ...m.entity, precios: next } } : m); }}>Quitar</button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-xs hover:underline" onClick={() => setQuickPrecioModal(m => m ? { entity: { ...m.entity, precios: [...(m.entity.precios || []), { nombre: '', monto: 0 }] } } : m)}>+ Agregar precio</button>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Códigos de Barra</h3>
                <div className="space-y-2">
                  {(quickPrecioModal.entity.codigos || []).map((c, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <input className="flex-1 border rounded px-2 py-1 text-sm font-mono" value={c.codigo} placeholder="Código de barras" onChange={e => { const next = [...(quickPrecioModal.entity.codigos || [])]; next[i].codigo = e.target.value; setQuickPrecioModal(m => m ? { entity: { ...m.entity, codigos: next } } : m); }} />
                      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={!!c.es_principal} onChange={e => { const next = [...(quickPrecioModal.entity.codigos || [])].map((x, idx) => ({ ...x, es_principal: idx === i ? e.target.checked : false })); setQuickPrecioModal(m => m ? { entity: { ...m.entity, codigos: next } } : m); }} /> Principal</label>
                      <button className="text-red-600 text-xs hover:underline" onClick={() => { const next = [...(quickPrecioModal.entity.codigos || [])]; next.splice(i, 1); setQuickPrecioModal(m => m ? { entity: { ...m.entity, codigos: next } } : m); }}>Quitar</button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-xs hover:underline" onClick={() => setQuickPrecioModal(m => m ? { entity: { ...m.entity, codigos: [...(m.entity.codigos || []), { codigo: '', es_principal: false }] } } : m)}>+ Agregar código</button>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={closeQuickPrecioModal}>Cancelar</Button>
                <Button size="sm" onClick={saveQuickPreciosCodigos} className="bg-amber-600 hover:bg-amber-700 text-white">Guardar</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {quickImagenModal?.entity && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white dark:bg-card rounded-lg shadow-lg w-full max-w-2xl p-6 relative max-h-[90vh] overflow-y-auto">
            <button className="absolute top-2 right-2 text-gray-400 hover:text-gray-700 dark:hover:text-white" onClick={closeQuickImagenModal} aria-label="Cerrar">✕</button>
            <h2 className="text-lg font-bold mb-4">Imágenes - {quickImagenModal.entity.nombre}</h2>
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold mb-2">Imagen principal</h3>
                <div className="flex items-start gap-4">
                  {quickImagenModal.entity.perfil?.url ? <img src={quickImagenModal.entity.perfil.url} alt="Perfil" className="w-24 h-24 object-cover rounded border" /> : <div className="w-24 h-24 flex items-center justify-center border rounded text-xs text-muted-foreground">Sin imagen</div>}
                  <div className="space-y-2 text-xs">
                    <input type="file" accept="image/*" onChange={e => { const file = e.target.files?.[0]; if (file) { setQuickImagenModal(m => m ? { entity: { ...m.entity, perfil: { ...(m.entity.perfil || {}), file, url: URL.createObjectURL(file) } } } : m); } }} />
                    {quickImagenModal.entity.perfil?.url && <button type="button" className="text-red-600 hover:underline" onClick={() => setQuickImagenModal(m => m ? { entity: { ...m.entity, perfil: null } } : m)}>Quitar</button>}
                  </div>
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold mb-2">Galería</h3>
                <div className="grid grid-cols-5 gap-2 mb-2">
                  {(quickImagenModal.entity.galeria || []).map((img, i) => (
                    <div key={i} className="relative group border rounded overflow-hidden">
                      {img.url ? <img src={img.url} alt={`Img ${i + 1}`} className="object-cover w-full h-24" /> : img.file ? <img src={URL.createObjectURL(img.file)} alt={`New ${i + 1}`} className="object-cover w-full h-24" /> : <div className="w-full h-24 flex items-center justify-center text-[10px] text-muted-foreground">Nueva</div>}
                      <button type="button" onClick={() => { const next = [...(quickImagenModal.entity.galeria || [])]; if (next[i].id) { next[i]._delete = !next[i]._delete; } else { next.splice(i, 1); } setQuickImagenModal(m => m ? { entity: { ...m.entity, galeria: next } } : m); }} className={`absolute top-1 right-1 text-white text-xs px-1 rounded bg-red-600/80 hover:bg-red-700 ${img._delete ? 'line-through' : ''}`}>X</button>
                    </div>
                  ))}
                </div>
                <input type="file" accept="image/*" multiple className="text-xs" onChange={e => { const files = Array.from(e.target.files || []); if (files.length) { const next = [...(quickImagenModal.entity.galeria || []), ...files.map(f => ({ file: f }))]; setQuickImagenModal(m => m ? { entity: { ...m.entity, galeria: next } } : m); } }} />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={closeQuickImagenModal}>Cancelar</Button>
                <Button size="sm" onClick={saveQuickImagenes} className="bg-purple-600 hover:bg-purple-700 text-white">Guardar</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
