interface ConfirmacionProductosProps {
  resumenValidacion: any;
  cargando?: boolean;
  onConfirmar?: () => void;
  onVolver?: () => void;
}

export default function ConfirmacionProductos({
  resumenValidacion,
  cargando = false,
  onConfirmar,
  onVolver,
}: ConfirmacionProductosProps) {
  const resumen = resumenValidacion;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Resumen de Carga</h2>

      {/* Estadísticas */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 border border-gray-200 dark:border-gray-600 space-y-4">
        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
          <span className="text-gray-700 dark:text-gray-300">Total de filas</span>
          <span className="font-bold text-gray-900 dark:text-gray-100">{resumen.total}</span>
        </div>
        <div className="flex justify-between py-2 border-b border-gray-200 dark:border-gray-600">
          <span className="text-green-700 dark:text-green-400">✓ Filas válidas</span>
          <span className="font-bold text-green-600 dark:text-green-400">{resumen.validas}</span>
        </div>
        <div className="flex justify-between py-2">
          <span className="text-red-700 dark:text-red-400">✗ Filas con errores</span>
          <span className="font-bold text-red-600 dark:text-red-400">{resumen.conErrores}</span>
        </div>
      </div>

      {/* Advertencias/Info */}
      <div className="space-y-2">
        {resumen.advertencias?.sinProveedor > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ {resumen.advertencias.sinProveedor} fila(s) sin proveedor - se crearán automáticamente
            </p>
          </div>
        )}
        {resumen.advertencias?.sinUnidad > 0 && (
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded p-3">
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              ⚠️ {resumen.advertencias.sinUnidad} fila(s) sin unidad de medida - se crearán automáticamente
            </p>
          </div>
        )}
        {resumen.advertencias?.sinPrecio > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ℹ️ {resumen.advertencias.sinPrecio} fila(s) sin precio - puede ser actualizado después
            </p>
          </div>
        )}
        {resumen.advertencias?.sinCodigoBarras > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              ℹ️ {resumen.advertencias.sinCodigoBarras} fila(s) sin código de barras
            </p>
          </div>
        )}
      </div>

      {/* Acción */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-4">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          📋 Se procesarán <span className="font-bold">{resumen.validas} filas</span> de un total de{' '}
          <span className="font-bold">{resumen.total}</span>
        </p>
      </div>

      {/* Botones */}
      <div className="flex gap-3 justify-end">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 transition"
          onClick={onVolver}
          disabled={cargando}
        >
          Volver
        </button>
        <button
          type="button"
          className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-md hover:bg-green-700 dark:hover:bg-green-800 font-bold disabled:opacity-50 disabled:cursor-not-allowed transition"
          onClick={onConfirmar}
          disabled={cargando || resumen.validas === 0}
        >
          Procesar Carga
        </button>
      </div>
    </div>
  );
}
