import { defineComponent, h, ref, onMounted } from 'vue';
import { Head, Link } from '@inertiajs/vue3';
import AuthLayout from '@/presentation/layouts/AuthLayout';
import HistorialTabla from './components/historial-tabla';
import DetalleCarga from './components/detalle-carga';
import ModalRevertir from './components/modal-revertir';
import { productosCSVService } from '@/infrastructure/services/productosCSV.service';
import { CargoCSVProducto } from '@/domain/entities/productos-masivos';

export default defineComponent({
  name: 'HistorialCargas',
  layout: AuthLayout,
  setup() {
    // Estado
    const cargas = ref<CargoCSVProducto[]>([]);
    const cargaSeleccionada = ref<CargoCSVProducto | null>(null);
    const cargaParaRevertir = ref<CargoCSVProducto | null>(null);
    const cargando = ref(false);
    const paginaActual = ref(1);
    const filtroEstado = ref<string>('');
    const mensaje = ref<string>('');
    const tipo = ref<'success' | 'error'>('success');

    // Métodos
    const obtenerCargas = async () => {
      try {
        cargando.value = true;
        const resultado = await productosCSVService.obtenerHistorialCargas(
          paginaActual.value,
          filtroEstado.value
        );
        cargas.value = resultado.data;
      } catch (error: any) {
        tipo.value = 'error';
        mensaje.value = error.message || 'Error obteniendo cargas';
      } finally {
        cargando.value = false;
      }
    };

    const verDetalle = async (cargo: CargoCSVProducto) => {
      try {
        cargando.value = true;
        const detalles = await productosCSVService.obtenerDetalleCarga(cargo.id);
        cargaSeleccionada.value = detalles.data;
      } catch (error: any) {
        tipo.value = 'error';
        mensaje.value = error.message || 'Error obteniendo detalles';
      } finally {
        cargando.value = false;
      }
    };

    const abrirModalRevertir = (cargo: CargoCSVProducto) => {
      cargaParaRevertir.value = cargo;
    };

    const confirmarRevertir = async (motivo: string) => {
      if (!cargaParaRevertir.value) return;

      try {
        cargando.value = true;
        const resultado = await productosCSVService.revertirCarga(
          cargaParaRevertir.value.id,
          motivo
        );
        tipo.value = 'success';
        mensaje.value = 'Carga revertida exitosamente';
        cargaParaRevertir.value = null;
        cargaSeleccionada.value = null;
        await obtenerCargas();
      } catch (error: any) {
        tipo.value = 'error';
        mensaje.value = error.message || 'Error revirtiendo carga';
      } finally {
        cargando.value = false;
      }
    };

    const cambiarFiltro = (nuevoFiltro: string) => {
      filtroEstado.value = nuevoFiltro;
      paginaActual.value = 1;
      obtenerCargas();
    };

    // Montar
    onMounted(() => {
      obtenerCargas();
    });

    return () =>
      h('div', { class: 'min-h-screen bg-gray-50' }, [
        h(Head, { title: 'Historial de Cargas de Productos' }),

        // Header
        h('div', { class: 'bg-white shadow-sm border-b' }, [
          h('div', { class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6' }, [
            h('div', { class: 'flex justify-between items-center' }, [
              h('div', [
                h('h1', { class: 'text-2xl font-bold text-gray-900' }, 'Historial de Cargas'),
                h('p', { class: 'text-gray-600 mt-1' }, 'Consulta todas las importaciones de productos'),
              ]),
              h(Link, {
                href: '/productos/carga-masiva',
                class:
                  'inline-block px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium',
              }, '+ Nueva carga'),
            ]),
          ]),
        ]),

        // Contenido
        h('div', { class: 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8' }, [
          // Mensaje
          mensaje.value &&
            h('div', {
              class: `mb-4 p-4 rounded-lg border ${
                tipo.value === 'success'
                  ? 'bg-green-50 border-green-200 text-green-700'
                  : 'bg-red-50 border-red-200 text-red-700'
              }`,
            }, [
              h('p', { class: 'font-medium' }, mensaje.value),
            ]),

          // Filtros
          h('div', { class: 'bg-white rounded-lg shadow p-4 mb-6' }, [
            h('h3', { class: 'font-semibold text-gray-900 mb-3' }, 'Filtrar por estado:'),
            h('div', { class: 'flex gap-2 flex-wrap' }, [
              h(
                'button',
                {
                  type: 'button',
                  class: `px-4 py-2 rounded-md font-medium transition-colors ${
                    filtroEstado.value === ''
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`,
                  onClick: () => cambiarFiltro(''),
                },
                'Todos'
              ),
              ...['procesado', 'pendiente', 'cancelado', 'revertido'].map((estado) =>
                h(
                  'button',
                  {
                    type: 'button',
                    class: `px-4 py-2 rounded-md font-medium transition-colors ${
                      filtroEstado.value === estado
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`,
                    onClick: () => cambiarFiltro(estado),
                  },
                  estado.charAt(0).toUpperCase() + estado.slice(1)
                )
              ),
            ]),
          ]),

          // Tabla
          h('div', { class: 'bg-white rounded-lg shadow' }, [
            cargas.value.length > 0
              ? h(HistorialTabla, {
                  cargas: cargas.value,
                  cargando: cargando.value,
                  onVerDetalle: verDetalle,
                  onRevertir: abrirModalRevertir,
                })
              : h('div', { class: 'p-8 text-center text-gray-500' }, [
                  h('p', { class: 'text-lg font-medium' }, 'No hay cargas registradas'),
                  h('p', { class: 'text-sm mt-1' }, 'Comienza cargando tu primer archivo de productos'),
                ]),
          ]),
        ]),

        // Modal de detalle
        cargaSeleccionada.value &&
          h('div', {
            class: 'fixed inset-0 bg-black bg-opacity-50 z-40 flex items-center justify-center p-4',
            onClick: () => {
              cargaSeleccionada.value = null;
            },
          }, [
            h(
              'div',
              {
                class: 'bg-white rounded-lg max-h-[90vh] overflow-y-auto w-full max-w-2xl',
                onClick: (e: Event) => {
                  e.stopPropagation();
                },
              },
              [
                h('div', { class: 'p-6' }, [
                  h(DetalleCarga, {
                    cargo: cargaSeleccionada.value,
                    onCerrar: () => {
                      cargaSeleccionada.value = null;
                    },
                    onRevertir: abrirModalRevertir,
                  }),
                ]),
              ]
            ),
          ]),

        // Modal de revertir
        cargaParaRevertir.value &&
          h(ModalRevertir, {
            cargo: cargaParaRevertir.value,
            cargando: cargando.value,
            onConfirmar: confirmarRevertir,
            onCancelar: () => {
              cargaParaRevertir.value = null;
            },
          }),
      ]);
  },
});
