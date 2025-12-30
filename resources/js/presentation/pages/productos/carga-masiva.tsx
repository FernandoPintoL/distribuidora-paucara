import { defineComponent, h } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import { useProductosMasivos } from '@/application/hooks/use-productos-masivos';
import { productosCSVService } from '@/infrastructure/services/productosCSV.service';
import AuthLayout from '@/presentation/layouts/AuthLayout';
import ModoImportacionProductos from './components/modo-importacion';
import VistaPreview from './components/vista-previa';
import ConfirmacionProductos from './components/confirmacion';
import ProgresoProductos from './components/progreso';

export default defineComponent({
  name: 'CargaMasivaProductos',
  layout: AuthLayout,
  setup() {
    const {
      archivo,
      filas,
      paso,
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

    const handleArchivoSeleccionado = async (file: File) => {
      await validarArchivo(file);
    };

    const handleAnalizarErrores = () => {
      // Lógica para mostrar modal/drawer con análisis detallado
      // Por ahora, solo avanzamos a confirmación
      if (filasValidas.value.length > 0) {
        paso.value = 'confirmacion';
      }
    };

    const handleConfirmarValidacion = () => {
      paso.value = 'confirmacion';
    };

    const handleConfirmarProcessamiento = async () => {
      await procesarProductos();
    };

    return () =>
      h('div', { class: 'min-h-screen bg-gray-50' }, [
        h(Head, { title: 'Carga Masiva de Productos' }),

        // Header
        h('div', { class: 'bg-white shadow-sm border-b' }, [
          h('div', { class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6' }, [
            h('div', { class: 'flex justify-between items-center' }, [
              h('div', [
                h('h1', { class: 'text-2xl font-bold text-gray-900' }, 'Carga Masiva de Productos'),
                h('p', { class: 'text-gray-600 mt-1' }, 'Importa múltiples productos desde un archivo CSV o XLSX'),
              ]),
              h(Link, {
                href: '/productos',
                class: 'text-blue-600 hover:text-blue-700 font-medium',
              }, 'Volver a productos'),
            ]),
          ]),
        ]),

        // Indicador de pasos
        h('div', { class: 'bg-white border-b' }, [
          h('div', { class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4' }, [
            h('div', { class: 'flex gap-2' }, [
              ['carga', 'Carga'],
              ['validacion', 'Validación'],
              ['confirmacion', 'Confirmación'],
              ['procesando', 'Procesamiento'],
              ['resultado', 'Resultado'],
            ].map(([pasoId, label]) =>
              h('div', { class: 'flex items-center' }, [
                h('div', {
                  class: `w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                    paso.value === pasoId
                      ? 'bg-blue-600 text-white'
                      : ['carga', 'validacion', 'confirmacion'].indexOf(pasoId) <
                        ['carga', 'validacion', 'confirmacion'].indexOf(paso.value)
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-600'
                  }`,
                }, label.charAt(0)),
                h('span', { class: 'ml-2 text-sm font-medium text-gray-700' }, label),
                ['carga', 'validacion', 'confirmacion'].indexOf(pasoId) <
                  ['carga', 'validacion', 'confirmacion'].length - 1 &&
                  h('div', { class: 'w-8 h-0.5 bg-gray-200 mx-2 ml-3' }),
              ])
            ),
          ]),
        ]),

        // Contenido principal
        h('div', { class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' }, [
          // Errores globales
          erroresGlobales.value.length > 0 &&
            h('div', { class: 'bg-red-50 border border-red-200 rounded-lg p-4 mb-6' }, [
              h('h3', { class: 'font-bold text-red-900 mb-2' }, 'Errores:'),
              h('ul', { class: 'space-y-1 text-sm text-red-700' }, [
                erroresGlobales.value.map((error) => h('li', { class: 'flex gap-2' }, ['•', error])),
              ]),
            ]),

          // Mensaje de error
          mensajeError.value &&
            h('div', { class: 'bg-red-50 border border-red-200 rounded-lg p-4 mb-6' }, [
              h('p', { class: 'text-red-700 font-medium' }, mensajeError.value),
            ]),

          // Paso 1: Carga
          paso.value === 'carga' &&
            h('div', { class: 'bg-white rounded-lg shadow p-6' }, [
              h(ModoImportacionProductos, {
                onArchivoSeleccionado: handleArchivoSeleccionado,
                onDescargarPlantilla: () => productosCSVService.descargarPlantilla(),
                cargando: cargando.value,
              }),
            ]),

          // Paso 2: Validación
          paso.value === 'validacion' &&
            h('div', { class: 'bg-white rounded-lg shadow p-6' }, [
              h(VistaPreview, {
                filas: filas.value,
                porcentajeValidez: porcentajeValidez.value,
                cargando: cargando.value,
                'onAnalizar-errores': handleAnalizarErrores,
                onConfirmar: handleConfirmarValidacion,
                onCancelar: () => volverAlPaso('carga'),
              }),
            ]),

          // Paso 3: Confirmación
          paso.value === 'confirmacion' &&
            h('div', { class: 'bg-white rounded-lg shadow p-6' }, [
              h(ConfirmacionProductos, {
                resumenValidacion: resumenValidacion.value,
                cargando: cargando.value,
                onConfirmar: handleConfirmarProcessamiento,
                onVolver: () => volverAlPaso('validacion'),
              }),
            ]),

          // Paso 4 & 5: Procesamiento y Resultado
          (paso.value === 'procesando' || paso.value === 'resultado') &&
            h('div', { class: 'bg-white rounded-lg shadow p-6' }, [
              h(ProgresoProductos, {
                progreso: progreso.value,
                resultado: resultadoProcesamiento.value,
                cargando: cargando.value,
                error: mensajeError.value,
                onNuevamente: limpiar,
                onIrHistorial: () => {
                  // Navegar al historial de cargas
                  // window.location.href = '/productos/historial-cargas';
                },
              }),
            ]),
        ]),
      ]);
  },
});
