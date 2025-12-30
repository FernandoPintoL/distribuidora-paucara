import { ResultadoProductosMasivos } from '@/domain/entities/productos-masivos';

interface ProgresoProductosProps {
  progreso?: number;
  resultado?: ResultadoProductosMasivos | null;
  cargando?: boolean;
  error?: string;
  onNuevamente?: () => void;
  onIrHistorial?: () => void;
}

export default function ProgresoProductos({
  progreso = 0,
  resultado = null,
  cargando = false,
  error,
  onNuevamente,
  onIrHistorial,
}: ProgresoProductosProps) {
  const mostrarResultado = !cargando && resultado;
  const exitoso = resultado?.cantidad_procesados === resultado?.cantidad_total;

  return (
    <div className="space-y-6">
      {cargando && (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900">Procesando carga masiva...</h2>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-700">Progreso</span>
              <span className="font-medium">{progreso}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
          </div>
          <p className="text-center text-gray-600 text-sm mt-4">⏳ Esto puede tomar unos momentos...</p>
        </div>
      )}

      {mostrarResultado && (
        <div className="space-y-4">
          {exitoso ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">✅</span>
                <h2 className="text-xl font-bold text-green-900">Carga completada exitosamente</h2>
              </div>
              <div className="space-y-2 text-sm text-green-800">
                <p>
                  <span className="font-medium">{resultado!.cantidad_procesados} productos</span> fueron importados
                  exitosamente
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <span className="text-3xl">⚠️</span>
                <h2 className="text-xl font-bold text-yellow-900">Carga completada con errores</h2>
              </div>
              <div className="space-y-3 text-sm text-yellow-800">
                <div className="flex justify-between">
                  <span>Procesados correctamente:</span>
                  <span className="font-bold">{resultado!.cantidad_procesados}</span>
                </div>
                <div className="flex justify-between">
                  <span>Con errores:</span>
                  <span className="font-bold text-red-600">{resultado!.cantidad_errores}</span>
                </div>
              </div>
            </div>
          )}

          {resultado!.cantidad_errores > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <h3 className="font-bold text-red-900 mb-2">Errores detectados:</h3>
              <ul className="space-y-1 text-sm text-red-800">
                {resultado!.errores.slice(0, 5).map((error, idx) => (
                  <li key={idx} className="flex gap-2">
                    <span>•</span>
                    <span>
                      Fila {error.fila}: {error.mensaje}
                    </span>
                  </li>
                ))}
              </ul>
              {resultado!.cantidad_errores > 5 && (
                <p className="text-sm text-red-700 mt-2">...y {resultado!.cantidad_errores - 5} errores más</p>
              )}
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-700">
              📌 ID de carga: <span className="font-mono font-bold">{resultado!.cargo_id}</span>
            </p>
          </div>

          {/* Botones */}
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium"
              onClick={onNuevamente}
            >
              Cargar más productos
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
              onClick={onIrHistorial}
            >
              Ver historial de cargas
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl">❌</span>
            <h2 className="text-xl font-bold text-red-900">Error en la carga</h2>
          </div>
          <p className="text-red-700 mb-4">{error}</p>
          <button
            type="button"
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium"
            onClick={onNuevamente}
          >
            Intentar nuevamente
          </button>
        </div>
      )}
    </div>
  );
}
