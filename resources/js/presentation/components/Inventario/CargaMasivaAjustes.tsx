import React, { useState, useRef, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import ajustesCSVService, { ResultadoValidacion, FilaAjusteValidada } from '@/infrastructure/services/ajustesCSV.service';
import TablaAjustesPreview from '@/presentation/components/Inventario/TablaAjustesPreview';
import ResumenAjustes from '@/presentation/components/Inventario/ResumenAjustes';
import InstruccionesOperaciones from '@/presentation/components/Inventario/InstruccionesOperaciones';
import axios from 'axios';

interface TipoOperacion {
  id: number;
  clave: string;
  label: string;
  direccion: 'entrada' | 'salida';
  requiere_tipo_motivo: string | null;
  requiere_proveedor: boolean;
  requiere_cliente: boolean;
  descripcion: string;
}

interface CargaMasivaAjustesProps {
  productos: any[];
  tiposAjuste: any[];
  tiposMerma: any[];
  almacenes: any[];
  proveedores?: any[];
  clientes?: any[];
  onCargaExitosa?: () => void;
}

export default function CargaMasivaAjustes({
  productos,
  tiposAjuste,
  tiposMerma,
  almacenes,
  proveedores = [],
  clientes = [],
  onCargaExitosa,
}: CargaMasivaAjustesProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [archivoSeleccionado, setArchivoSeleccionado] = useState<File | null>(null);
  const [datosCsvOriginal, setDatosCsvOriginal] = useState<any[]>([]);
  const [resultadoValidacion, setResultadoValidacion] = useState<ResultadoValidacion | null>(null);
  const [filasValidas, setFilasValidas] = useState<FilaAjusteValidada[]>([]);
  const [cargando, setCargando] = useState(false);
  const [progreso, setProgreso] = useState(0);
  const [paso, setPaso] = useState<'carga' | 'validacion' | 'edicion' | 'confirmacion' | 'procesando'>('carga');
  const [tiposOperacion, setTiposOperacion] = useState<TipoOperacion[]>([]);

  // Cargar tipos de operación desde API
  useEffect(() => {
    const cargarTiposOperacion = async () => {
      try {
        const response = await axios.get('/api/tipo-operaciones');
        setTiposOperacion(response.data);
      } catch (error) {
        console.error('Error al cargar tipos de operación:', error);
        toast.error('Error al cargar tipos de operación');
      }
    };
    cargarTiposOperacion();
  }, []);

  const handleDescargarPlantilla = () => {
    const contenido = ajustesCSVService.generarPlantillaCSV(
      tiposOperacion,
      tiposAjuste,
      tiposMerma,
      almacenes
    );
    ajustesCSVService.descargarCSV(contenido, 'plantilla-ajustes-inventario.csv');
    toast.success('Plantilla descargada correctamente');
  };

  const handleSeleccionarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const formatosSoportados = ['csv', 'xlsx', 'xls', 'ods'];

    if (!formatosSoportados.includes(extension || '')) {
      toast.error(`Formato no soportado. Usa: ${formatosSoportados.join(', ').toUpperCase()}`);
      return;
    }

    setArchivoSeleccionado(file);
  };

  const handleCargarYValidar = async () => {
    if (!archivoSeleccionado) {
      toast.error('Selecciona un archivo (CSV, XLSX, ODS)');
      return;
    }

    setCargando(true);
    const toastId = toast.loading('Leyendo y validando archivo...');

    try {
      // Parsear archivo automáticamente según su formato
      const filas = await ajustesCSVService.parsearArchivo(archivoSeleccionado);

      // Guardar los datos originales para la carga
      setDatosCsvOriginal(filas);

      // Validar filas con los nuevos tipos de operación
      const resultado = await ajustesCSVService.validarFilas(
        filas,
        productos,
        tiposOperacion,
        tiposAjuste,
        tiposMerma,
        almacenes
      );

      setResultadoValidacion(resultado);
      setFilasValidas(resultado.filasValidas);
      setPaso('edicion');

      toast.dismiss(toastId);

      if (resultado.filasConError > 0) {
        toast(
          `✓ ${resultado.filasValidas.length} filas válidas, ✗ ${resultado.filasConError} con errores`,
          {
            icon: '⚠️',
            duration: 5000,
          }
        );
      } else {
        toast.success(`¡${resultado.filasValidas.length} filas válidas! Listo para editar.`);
      }
    } catch (error: any) {
      toast.dismiss(toastId);
      toast.error(error.message || 'Error al procesar el archivo');
      console.error('Error:', error);
    } finally {
      setCargando(false);
    }
  };

  const handleFilasActualizadas = (filasActualizadas: FilaAjusteValidada[]) => {
    setFilasValidas(filasActualizadas);
  };

  const handleIrAConfirmacion = () => {
    if (filasValidas.length === 0) {
      toast.error('No hay filas válidas para procesar');
      return;
    }

    // Verificar que todas las filas sean válidas
    const filasConErrores = filasValidas.filter(f => !f.valido);
    if (filasConErrores.length > 0) {
      toast.error(`Hay ${filasConErrores.length} fila(s) con errores. Por favor corrígelas antes de continuar.`);
      return;
    }

    setPaso('confirmacion');
  };

  const handleProcesarAjustes = async () => {
    if (!filasValidas || filasValidas.length === 0) {
      toast.error('No hay filas válidas para procesar');
      return;
    }

    if (!archivoSeleccionado) {
      toast.error('No se encontró el archivo seleccionado');
      return;
    }

    setCargando(true);
    setPaso('procesando');
    const toastId = toast.loading('Procesando ajustes...');

    try {
      const datos = {
        nombre_archivo: archivoSeleccionado.name,
        datos_csv: datosCsvOriginal,
        ajustes: filasValidas.map(fila => ({
          stock_producto_id: fila.producto_id,
          tipo_operacion_id: fila.tipo_operacion_id,
          tipo_motivo_id: fila.tipo_motivo_id,
          almacen_id: fila.almacen_id,
          cantidad: parseInt(String(fila.cantidad), 10),
          observacion: fila.observacion,
          tipo_motivo_valor: fila.tipo_motivo, // Para proveedor/cliente libre
        })),
      };

      // Simular progreso
      let progresoActual = 0;
      const intervalo = setInterval(() => {
        progresoActual = Math.min(progresoActual + Math.random() * 30, 90);
        setProgreso(progresoActual);
      }, 300);

      const response = await axios.post('/api/inventario/ajustes-masivos', datos);

      clearInterval(intervalo);
      setProgreso(100);

      toast.dismiss(toastId);
      toast.success(
        `✓ Se procesaron ${response.data.procesados} ajustes correctamente`,
        { duration: 5000 }
      );

      // Resetear
      setTimeout(() => {
        setArchivoSeleccionado(null);
        setDatosCsvOriginal([]);
        setResultadoValidacion(null);
        setFilasValidas([]);
        setPaso('carga');
        setProgreso(0);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        onCargaExitosa?.();
      }, 2000);
    } catch (error: any) {
      toast.dismiss(toastId);
      const mensaje = error.response?.data?.message || error.message || 'Error al procesar ajustes';
      toast.error(mensaje);
      console.error('Error:', error);
      setPaso('confirmacion');
    } finally {
      setCargando(false);
    }
  };

  const handleRegresar = () => {
    setDatosCsvOriginal([]);
    setResultadoValidacion(null);
    setFilasValidas([]);
    setPaso('carga');
  };

  const handleVolver = () => {
    setPaso('edicion');
  };

  return (
    <div className="w-full">
      {/* INDICADOR DE PROGRESO */}
      {paso !== 'carga' && (
        <div className="mb-6">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
              Paso {paso === 'edicion' ? 2 : paso === 'confirmacion' ? 3 : 4} de 4
            </span>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {paso === 'edicion' && 'Editar datos'}
              {paso === 'confirmacion' && 'Confirmar cambios'}
              {paso === 'procesando' && `Procesando... ${Math.round(progreso)}%`}
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-300"
              style={{
                width: `${
                  paso === 'edicion' ? 33 : paso === 'confirmacion' ? 66 : paso === 'procesando' ? progreso : 33
                }%`,
              }}
            />
          </div>
        </div>
      )}

      {/* PASO 1: CARGA */}
      {paso === 'carga' && (
        <div className="space-y-6">
          {/* Instrucciones de uso expandibles - Operaciones Dinámicas */}
          {tiposOperacion.length > 0 && (
            <InstruccionesOperaciones
              tiposOperacion={tiposOperacion}
              tiposAjuste={tiposAjuste}
              tiposMerma={tiposMerma}
            />
          )}

          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="font-semibold text-blue-900 dark:text-blue-200 mb-2">
              💡 Carga masiva de ajustes de inventario
            </h3>
            <p className="text-sm text-blue-800 dark:text-blue-300 mb-4">
              Importa múltiples ajustes de inventario desde un archivo CSV, XLSX u ODS para procesarlos en lote.
            </p>

            <button
              onClick={handleDescargarPlantilla}
              disabled={cargando}
              className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              Descargar plantilla
            </button>
          </div>

          <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-12 text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20a4 4 0 004 4h24a4 4 0 004-4V20m-8-8l-4-4m0 0l-4 4m4-4v12m0 0l-4 4m4-4l4 4"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xlsx,.xls,.ods"
              onChange={handleSeleccionarArchivo}
              className="hidden"
              disabled={cargando}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={cargando}
              className="inline-flex items-center mt-4 px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Seleccionar archivo (CSV, XLSX, ODS)
            </button>

            {archivoSeleccionado && (
              <div className="mt-4 text-sm text-gray-600 dark:text-gray-400">
                <p className="font-medium">{archivoSeleccionado.name}</p>
                <p className="text-xs mt-1">
                  {(archivoSeleccionado.size / 1024).toFixed(2)} KB
                </p>
              </div>
            )}
          </div>

          {archivoSeleccionado && (
            <button
              onClick={handleCargarYValidar}
              disabled={cargando}
              className="w-full inline-flex justify-center items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Validando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Validar archivo
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* PASO 2: EDICIÓN */}
      {paso === 'edicion' && resultadoValidacion && (
        <div className="space-y-6">
          {/* ERRORES */}
          {resultadoValidacion.filasInvalidas.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
              <h4 className="font-semibold text-red-900 dark:text-red-200 mb-4 flex items-center">
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                {resultadoValidacion.filasInvalidas.length} filas con errores (no serán procesadas)
              </h4>

              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-red-300 dark:border-red-700">
                      <th className="text-left py-2 px-3 font-semibold text-red-900 dark:text-red-200">Fila</th>
                      <th className="text-left py-2 px-3 font-semibold text-red-900 dark:text-red-200">Producto</th>
                      <th className="text-left py-2 px-3 font-semibold text-red-900 dark:text-red-200">Errores</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultadoValidacion.filasInvalidas.map((fila, idx) => (
                      <tr key={idx} className="border-b border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900/30">
                        <td className="py-2 px-3 font-medium">{fila.fila}</td>
                        <td className="py-2 px-3">{fila.producto}</td>
                        <td className="py-2 px-3">
                          <div className="space-y-1">
                            {fila.errores.map((error, i) => (
                              <div key={i} className="text-red-700 dark:text-red-300 text-xs">
                                • {error}
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TABLA EDITABLE */}
          {filasValidas.length > 0 && (
            <div>
              <TablaAjustesPreview
                filas={filasValidas}
                tiposOperacion={tiposOperacion}
                tiposAjuste={tiposAjuste}
                tiposMerma={tiposMerma}
                almacenes={almacenes}
                productos={productos}
                proveedores={proveedores}
                clientes={clientes}
                onFilasActualizadas={handleFilasActualizadas}
              />
            </div>
          )}

          {/* RESUMEN */}
          {filasValidas.length > 0 && (
            <div>
              <ResumenAjustes
                filasValidas={filasValidas}
                totalProductos={resultadoValidacion.resumen.productosUnicos}
                cantidadTotal={filasValidas.reduce((sum, f) => sum + parseInt(String(f.cantidad), 10), 0)}
              />
            </div>
          )}

          {/* BOTONES */}
          <div className="flex gap-4">
            <button
              onClick={handleRegresar}
              disabled={cargando}
              className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Cancelar
            </button>

            {filasValidas.length > 0 && (
              <button
                onClick={handleIrAConfirmacion}
                disabled={cargando || filasValidas.some(f => !f.valido)}
                className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
                Siguiente: Confirmación
              </button>
            )}
          </div>
        </div>
      )}

      {/* PASO 3: CONFIRMACIÓN */}
      {paso === 'confirmacion' && filasValidas.length > 0 && (
        <div className="space-y-6">
          {/* RESUMEN FINAL */}
          <div>
            <ResumenAjustes
              filasValidas={filasValidas}
              totalProductos={new Set(filasValidas.map(f => f.producto_id)).size}
              cantidadTotal={filasValidas.reduce((sum, f) => sum + parseInt(String(f.cantidad), 10), 0)}
            />
          </div>

          {/* CONFIRMACIÓN */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-6">
            <h4 className="font-semibold text-yellow-900 dark:text-yellow-200 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Confirmar cambios
            </h4>
            <p className="text-sm text-yellow-800 dark:text-yellow-300 mb-4">
              Por favor, revisa el resumen anterior. Una vez que hagas clic en "Procesar", los cambios se aplicarán a la base de datos.
            </p>
            <ul className="space-y-2 text-sm text-yellow-800 dark:text-yellow-300">
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Se crearán {filasValidas.length} movimientos de inventario</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>El stock se actualizará automáticamente</span>
              </li>
              <li className="flex items-start">
                <svg className="w-5 h-5 mr-2 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Los cambios serán auditados en el sistema</span>
              </li>
            </ul>
          </div>

          {/* BOTONES */}
          <div className="flex gap-4">
            <button
              onClick={handleVolver}
              disabled={cargando}
              className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Volver a editar
            </button>

            <button
              onClick={handleProcesarAjustes}
              disabled={cargando}
              className="flex-1 inline-flex justify-center items-center px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cargando ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Procesar {filasValidas.length} ajustes
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: PROCESANDO */}
      {paso === 'procesando' && (
        <div className="space-y-6">
          <div className="text-center py-12">
            <svg className="animate-spin h-12 w-12 text-blue-600 dark:text-blue-400 mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <h4 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
              Procesando ajustes...
            </h4>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Por favor, espera mientras se procesan los ajustes.
            </p>

            {/* Barra de progreso */}
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 mb-4">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${progreso}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {Math.round(progreso)}% completado
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
