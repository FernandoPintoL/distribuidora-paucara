import { useState } from 'react';
import { Head, Link } from '@inertiajs/react';
import { useProductosMasivos } from '@/application/hooks/use-productos-masivos';
import { productosCSVService } from '@/infrastructure/services/productosCSV.service';
import AuthLayout from '@/presentation/layouts/AuthLayout';
import ModoImportacionProductos from './components/modo-importacion';
import VistaPreviewaProductos from './components/vista-previa';
import ConfirmacionProductos from './components/confirmacion';
import ProgresoProductos from './components/progreso';

export default function CargaMasivaProductos() {
  const {
    archivo,
    filas,
    paso,
    setPaso,
    progreso,
    erroresGlobales,
    resultadoProcesamiento,
    cargando,
    mensajeError,
    puedeValidar,
    puedeConfirmar,
    filasValidas,
    porcentajeValidez,
    resumenValidacion,
    validarArchivo,
    detectarDuplicados,
    procesarProductos,
    limpiar,
    volverAlPaso,
  } = useProductosMasivos();

  const pasos = [
    ['carga', 'Carga'],
    ['validacion', 'Validación'],
    ['confirmacion', 'Confirmación'],
    ['procesando', 'Procesamiento'],
    ['resultado', 'Resultado'],
  ];

  const handleArchivoSeleccionado = async (file: File) => {
    await validarArchivo(file);
  };

  const handleAnalizarErrores = () => {
    if (filasValidas.length > 0) {
      setPaso('confirmacion');
    }
  };

  const handleConfirmarValidacion = () => {
    setPaso('confirmacion');
  };

  const handleConfirmarProcessamiento = async () => {
    await procesarProductos();
  };

  const irAlHistorial = () => {
    window.location.href = '/productos/historial-cargas';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head title="Carga Masiva de Productos" />

      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Carga Masiva de Productos</h1>
              <p className="text-gray-600 mt-1">Importa múltiples productos desde un archivo CSV o XLSX</p>
            </div>
            <Link href="/productos" className="text-blue-600 hover:text-blue-700 font-medium">
              Volver a productos
            </Link>
          </div>
        </div>
      </div>

      {/* Indicador de pasos */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex gap-2">
            {pasos.map(([pasoId, label], idx) => (
              <div key={pasoId} className="flex items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    paso === pasoId
                      ? 'bg-blue-600 text-white'
                      : ['carga', 'validacion', 'confirmacion'].indexOf(pasoId) <
                        ['carga', 'validacion', 'confirmacion'].indexOf(paso)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {label.charAt(0)}
                </div>
                <span className="ml-2 text-sm font-medium text-gray-700">{label}</span>
                {idx < pasos.length - 1 && <div className="w-8 h-0.5 bg-gray-200 mx-2 ml-3" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Errores globales */}
        {erroresGlobales.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-red-900 mb-2">Errores:</h3>
            <ul className="space-y-1 text-sm text-red-700">
              {erroresGlobales.map((error, idx) => (
                <li key={idx} className="flex gap-2">
                  <span>•</span>
                  <span>{error}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Mensaje de error */}
        {mensajeError && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 font-medium">{mensajeError}</p>
          </div>
        )}

        {/* Paso 1: Carga */}
        {paso === 'carga' && (
          <div className="bg-white rounded-lg shadow p-6">
            <ModoImportacionProductos
              onArchivoSeleccionado={handleArchivoSeleccionado}
              onDescargarPlantilla={() => productosCSVService.descargarPlantilla()}
              cargando={cargando}
            />
          </div>
        )}

        {/* Paso 2: Validación */}
        {paso === 'validacion' && (
          <div className="bg-white rounded-lg shadow p-6">
            <VistaPreviewaProductos
              filas={filas}
              porcentajeValidez={porcentajeValidez}
              cargando={cargando}
              onAnalizarErrores={handleAnalizarErrores}
              onConfirmar={handleConfirmarValidacion}
              onCancelar={() => volverAlPaso('carga')}
            />
          </div>
        )}

        {/* Paso 3: Confirmación */}
        {paso === 'confirmacion' && (
          <div className="bg-white rounded-lg shadow p-6">
            <ConfirmacionProductos
              resumenValidacion={resumenValidacion}
              cargando={cargando}
              onConfirmar={handleConfirmarProcessamiento}
              onVolver={() => volverAlPaso('validacion')}
            />
          </div>
        )}

        {/* Paso 4 & 5: Procesamiento y Resultado */}
        {(paso === 'procesando' || paso === 'resultado') && (
          <div className="bg-white rounded-lg shadow p-6">
            <ProgresoProductos
              progreso={progreso}
              resultado={resultadoProcesamiento}
              cargando={cargando}
              error={mensajeError}
              onNuevamente={limpiar}
              onIrHistorial={irAlHistorial}
            />
          </div>
        )}
      </div>
    </div>
  );
}
