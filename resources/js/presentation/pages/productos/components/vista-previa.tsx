import { useState } from 'react';
import { FilaProductoValidada } from '@/domain/entities/productos-masivos';

interface VistaPreviewaProductosProps {
  filas: FilaProductoValidada[];
  mostrarErrores?: boolean;
  porcentajeValidez?: number;
  cargando?: boolean;
  onAnalizarErrores?: () => void;
  onConfirmar?: () => void;
  onCancelar?: () => void;
  onEditarFila?: (filaIndex: number, campo: string, valor: any) => void;
  onEliminarFila?: (filaIndex: number) => void;
  categorias?: Array<{ id: number; nombre: string }>;
  marcas?: Array<{ id: number; nombre: string }>;
  unidades?: Array<{ id: number; codigo: string; nombre: string }>;
  almacenes?: Array<{ id: number; nombre: string }>;
}

export default function VistaPreviewaProductos({
  filas,
  mostrarErrores = false,
  porcentajeValidez = 0,
  cargando = false,
  onAnalizarErrores,
  onConfirmar,
  onCancelar,
  onEditarFila,
  onEliminarFila,
  categorias = [],
  marcas = [],
  unidades = [],
  almacenes = [],
}: VistaPreviewaProductosProps) {
  const [buscadorSelect, setBuscadorSelect] = useState<{ [key: string]: string }>({});
  const [expandida, setExpandida] = useState(false);
  const [busqueda, setBusqueda] = useState('');

  // Debug: mostrar datos recibidos en vista-previa
  console.log('📋 Datos recibidos en vista-previa:', {
    categorias: categorias.length,
    marcas: marcas.length,
    unidades: unidades.length,
    almacenes: almacenes.length,
    filas: filas.length,
    categorias_datos: categorias,
    marcas_datos: marcas,
    unidades_datos: unidades,
    almacenes_datos: almacenes,
  });

  // Filtrar filas según búsqueda
  const filasFiltradas = busqueda.trim() === ''
    ? filas
    : filas.filter((fila) => {
        const termino = busqueda.toLowerCase();
        return (
          fila.nombre?.toLowerCase().includes(termino) ||
          fila.codigo_barra?.toLowerCase().includes(termino) ||
          fila.sku?.toLowerCase().includes(termino) ||
          fila.proveedor_nombre?.toLowerCase().includes(termino) ||
          fila.categoria_nombre?.toLowerCase().includes(termino) ||
          fila.marca_nombre?.toLowerCase().includes(termino) ||
          fila.descripcion?.toLowerCase().includes(termino)
        );
      });

  const filasAMostrar = filasFiltradas.slice(0, 10);
  const filasValidas = filas.filter((f) => f.validacion.es_valido).length;
  const filasConErrores = filas.filter((f) => !f.validacion.es_valido).length;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-md border border-blue-200 dark:border-blue-800">
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{filas.length}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Total de filas</p>
        </div>
        <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-md border border-green-200 dark:border-green-800">
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">{filasValidas}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Filas válidas</p>
        </div>
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md border border-red-200 dark:border-red-800">
          <p className="text-2xl font-bold text-red-600 dark:text-red-400">{filasConErrores}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">Filas con errores</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700 dark:text-gray-300">Validez</span>
          <span className="font-medium text-gray-900 dark:text-gray-100">{porcentajeValidez || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              porcentajeValidez === 100 ? 'bg-green-600 dark:bg-green-500' : porcentajeValidez >= 50 ? 'bg-yellow-600 dark:bg-yellow-500' : 'bg-red-600 dark:bg-red-500'
            }`}
            style={{ width: `${porcentajeValidez || 0}%` }}
          />
        </div>
      </div>

      {/* Tabla de preview - Editable */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={expandida}
              onChange={(e) => setExpandida(e.target.checked)}
              className="w-4 h-4 rounded border-gray-300"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Modo edición (tabla expandida)</span>
          </label>

          {/* Buscador */}
          {expandida && (
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="🔍 Buscar producto, código, proveedor..."
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
              {busqueda && (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Mostrando {filasFiltradas.length} de {filas.length} filas
                </p>
              )}
            </div>
          )}
        </div>

        {!expandida ? (
          // Vista comprimida
          <div className="overflow-x-auto border border-gray-200 dark:border-gray-700 rounded-md">
            <table className="w-full text-sm">
              <thead className="bg-gray-100 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">#</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Producto</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Cantidad</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Proveedor</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Estado</th>
                </tr>
              </thead>
              <tbody>
                {filasAMostrar.map((fila) => (
                  <tr key={fila.fila} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-2 text-gray-600 dark:text-gray-400">{fila.fila}</td>
                    <td className="px-4 py-2">
                      <div className="font-medium text-gray-900 dark:text-gray-100">{fila.nombre}</div>
                      {fila.codigo_barra && <div className="text-xs text-gray-500 dark:text-gray-400">📦 {fila.codigo_barra}</div>}
                    </td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{fila.cantidad}</td>
                    <td className="px-4 py-2 text-gray-700 dark:text-gray-300">{fila.proveedor_nombre || '-'}</td>
                    <td className="px-4 py-2">
                      {fila.validacion.es_valido ? (
                        <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                          ✓ Válida
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                          ✗ Error
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          // Vista editable expandida
          <div className="space-y-3">
            {filasFiltradas.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6 text-center">
                <p className="text-yellow-700 dark:text-yellow-300">
                  No se encontraron productos que coincidan con "{busqueda}"
                </p>
              </div>
            ) : (
              filasFiltradas.map((fila, idx) => {
                const indiceReal = filas.findIndex(f => f.fila === fila.fila);
                return (
              <div key={idx} className="bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400">Fila {fila.fila}</span>
                    {fila.validacion.es_valido ? (
                      <span className="inline-block px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded text-xs font-medium">
                        ✓ Válida
                      </span>
                    ) : (
                      <span className="inline-block px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                        ✗ Error
                      </span>
                    )}
                  </div>
                  {onEliminarFila && (
                    <button
                      type="button"
                      onClick={() => onEliminarFila(indiceReal)}
                      className="px-2 py-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-xs font-medium transition"
                      title="Eliminar fila"
                    >
                      🗑️ Eliminar
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {/* Nombre */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Producto *</label>
                    <input
                      type="text"
                      value={fila.nombre}
                      onChange={(e) => onEditarFila?.(indiceReal, 'nombre', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Cantidad */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Cantidad *</label>
                    <input
                      type="number"
                      value={fila.cantidad}
                      onChange={(e) => onEditarFila?.(indiceReal, 'cantidad', Math.max(0, Number(e.target.value)))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Almacén */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Almacén *</label>
                    <select
                      value={
                        fila.almacen_id
                          ? fila.almacen_id
                          : fila.almacen_nombre
                          ? almacenes.find((a) => a.nombre === fila.almacen_nombre)?.id || almacenes[0]?.id || 1
                          : almacenes[0]?.id || 1
                      }
                      onChange={(e) => onEditarFila?.(indiceReal, 'almacen_id', Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    >
                      {almacenes.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.nombre}
                        </option>
                      ))}
                    </select>
                    {fila.almacen_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        📌 Desde CSV: {fila.almacen_nombre}
                      </p>
                    )}
                  </div>

                  {/* Código de barras */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de barras</label>
                    <input
                      type="text"
                      value={fila.codigo_barra || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'codigo_barra', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                      placeholder="📦"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* SKU */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">SKU</label>
                    <input
                      type="text"
                      value={fila.sku || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'sku', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Proveedor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Proveedor</label>
                    <input
                      type="text"
                      value={fila.proveedor_nombre || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'proveedor_nombre', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Unidad de medida */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Unidad medida</label>
                    <select
                      value={fila.unidad_medida_nombre || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'unidad_medida_nombre', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    >
                      <option value="">-- Seleccionar --</option>
                      {unidades.map((u) => (
                        <option key={u.id} value={u.nombre}>
                          {u.nombre} ({u.codigo})
                        </option>
                      ))}
                    </select>
                    {fila.unidad_medida_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        📌 Desde CSV: {fila.unidad_medida_nombre}
                      </p>
                    )}
                  </div>

                  {/* Precio costo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio costo</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fila.precio_costo || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'precio_costo', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Precio venta */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Precio venta</label>
                    <input
                      type="number"
                      step="0.01"
                      value={fila.precio_venta || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'precio_venta', e.target.value ? Number(e.target.value) : null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Categoría */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Categoría</label>
                    <select
                      value={fila.categoria_nombre || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'categoria_nombre', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    >
                      <option value="">-- Seleccionar --</option>
                      {categorias.map((c) => (
                        <option key={c.id} value={c.nombre}>
                          {c.nombre}
                        </option>
                      ))}
                    </select>
                    {fila.categoria_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        📌 Desde CSV: {fila.categoria_nombre}
                      </p>
                    )}
                  </div>

                  {/* Marca */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Marca</label>
                    <select
                      value={fila.marca_nombre || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'marca_nombre', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    >
                      <option value="">-- Seleccionar --</option>
                      {marcas.map((m) => (
                        <option key={m.id} value={m.nombre}>
                          {m.nombre}
                        </option>
                      ))}
                    </select>
                    {fila.marca_nombre && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        📌 Desde CSV: {fila.marca_nombre}
                      </p>
                    )}
                  </div>

                  {/* Lote */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Lote</label>
                    <input
                      type="text"
                      value={fila.lote || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'lote', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Fecha vencimiento */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Fecha vencimiento</label>
                    <input
                      type="date"
                      value={fila.fecha_vencimiento || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'fecha_vencimiento', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                    />
                  </div>

                  {/* Descripción */}
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descripción</label>
                    <textarea
                      value={fila.descripcion || ''}
                      onChange={(e) => onEditarFila?.(indiceReal, 'descripcion', e.target.value || null)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-600 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                      disabled={cargando}
                      rows={2}
                    />
                  </div>
                </div>
              </div>
                );
              })
            )}
          </div>
        )}
      </div>

      {filas.length > 10 && <p className="text-sm text-gray-500 dark:text-gray-400 text-center">...y {filas.length - 10} filas más</p>}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-md hover:bg-blue-700 dark:hover:bg-blue-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
          onClick={onAnalizarErrores}
          disabled={cargando}
        >
          Analizar Errores
        </button>
        {filasValidas > 0 && (
          <button
            type="button"
            className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            onClick={onConfirmar}
            disabled={cargando || filasValidas === 0}
          >
            Confirmar Carga
          </button>
        )}
      </div>
    </div>
  );
}
