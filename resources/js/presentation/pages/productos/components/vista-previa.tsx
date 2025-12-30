import { FilaProductoValidada } from '@/domain/entities/productos-masivos';

interface VistaPreviewaProductosProps {
  filas: FilaProductoValidada[];
  mostrarErrores?: boolean;
  porcentajeValidez?: number;
  cargando?: boolean;
  onAnalizarErrores?: () => void;
  onConfirmar?: () => void;
  onCancelar?: () => void;
}

export default function VistaPreviewaProductos({
  filas,
  mostrarErrores = false,
  porcentajeValidez = 0,
  cargando = false,
  onAnalizarErrores,
  onConfirmar,
  onCancelar,
}: VistaPreviewaProductosProps) {
  const filasAMostrar = filas.slice(0, 10);
  const filasValidas = filas.filter((f) => f.validacion.es_valido).length;
  const filasConErrores = filas.filter((f) => !f.validacion.es_valido).length;

  return (
    <div className="space-y-6">
      {/* Resumen */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-blue-50 p-4 rounded-md border border-blue-200">
          <p className="text-2xl font-bold text-blue-600">{filas.length}</p>
          <p className="text-sm text-gray-600">Total de filas</p>
        </div>
        <div className="bg-green-50 p-4 rounded-md border border-green-200">
          <p className="text-2xl font-bold text-green-600">{filasValidas}</p>
          <p className="text-sm text-gray-600">Filas válidas</p>
        </div>
        <div className="bg-red-50 p-4 rounded-md border border-red-200">
          <p className="text-2xl font-bold text-red-600">{filasConErrores}</p>
          <p className="text-sm text-gray-600">Filas con errores</p>
        </div>
      </div>

      {/* Barra de progreso */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-gray-700">Validez</span>
          <span className="font-medium">{porcentajeValidez || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-300 ${
              porcentajeValidez === 100 ? 'bg-green-600' : porcentajeValidez >= 50 ? 'bg-yellow-600' : 'bg-red-600'
            }`}
            style={{ width: `${porcentajeValidez || 0}%` }}
          />
        </div>
      </div>

      {/* Tabla de preview */}
      <div className="overflow-x-auto border rounded-md">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-4 py-2 text-left font-medium text-gray-700">#</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Producto</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Cantidad</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Proveedor</th>
              <th className="px-4 py-2 text-left font-medium text-gray-700">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filasAMostrar.map((fila) => (
              <tr key={fila.fila} className="border-b hover:bg-gray-50">
                <td className="px-4 py-2 text-gray-600">{fila.fila}</td>
                <td className="px-4 py-2">
                  <div className="font-medium text-gray-900">{fila.nombre}</div>
                  {fila.codigo_barra && <div className="text-xs text-gray-500">📦 {fila.codigo_barra}</div>}
                </td>
                <td className="px-4 py-2 text-gray-700">{fila.cantidad}</td>
                <td className="px-4 py-2 text-gray-700">{fila.proveedor_nombre || '-'}</td>
                <td className="px-4 py-2">
                  {fila.validacion.es_valido ? (
                    <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                      ✓ Válida
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                      ✗ Error
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filas.length > 10 && <p className="text-sm text-gray-500 text-center">...y {filas.length - 10} filas más</p>}

      {/* Botones de acción */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onCancelar}
          disabled={cargando}
        >
          Cancelar
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          onClick={onAnalizarErrores}
          disabled={cargando}
        >
          Analizar Errores
        </button>
        {filasValidas > 0 && (
          <button
            type="button"
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
