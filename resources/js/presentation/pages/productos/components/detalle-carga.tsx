import { defineComponent, h } from 'vue';
import { CargoCSVProducto } from '@/domain/entities/productos-masivos';

export default defineComponent({
  name: 'DetalleCarga',
  props: {
    cargo: {
      type: Object as () => CargoCSVProducto,
      required: true,
    },
  },
  emits: ['cerrar', 'revertir'],
  setup(props, { emit }) {
    const porcentajeValidez = () => {
      if (props.cargo.cantidad_filas === 0) return 0;
      return Math.round((props.cargo.cantidad_validas / props.cargo.cantidad_filas) * 100);
    };

    const formatFecha = (fecha: string) => {
      return new Date(fecha).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return () =>
      h('div', { class: 'space-y-6' }, [
        // Encabezado
        h('div', { class: 'flex justify-between items-start' }, [
          h('div', [
            h('h2', { class: 'text-2xl font-bold text-gray-900' }, props.cargo.nombre_archivo),
            h('p', { class: 'text-gray-600 mt-1' }, [
              'ID: ',
              h('span', { class: 'font-mono font-bold' }, props.cargo.id),
              ' • ',
              formatFecha(props.cargo.created_at),
            ]),
          ]),
          h(
            'button',
            {
              type: 'button',
              class: 'text-gray-400 hover:text-gray-600',
              onClick: () => emit('cerrar'),
            },
            '✕'
          ),
        ]),

        // Estadísticas
        h('div', { class: 'grid grid-cols-4 gap-4' }, [
          h('div', { class: 'bg-blue-50 rounded-lg p-4 border border-blue-200' }, [
            h('p', { class: 'text-2xl font-bold text-blue-600' }, props.cargo.cantidad_filas),
            h('p', { class: 'text-sm text-gray-600' }, 'Total filas'),
          ]),
          h('div', { class: 'bg-green-50 rounded-lg p-4 border border-green-200' }, [
            h('p', { class: 'text-2xl font-bold text-green-600' }, props.cargo.cantidad_validas),
            h('p', { class: 'text-sm text-gray-600' }, 'Válidas'),
          ]),
          h('div', { class: 'bg-red-50 rounded-lg p-4 border border-red-200' }, [
            h('p', { class: 'text-2xl font-bold text-red-600' }, props.cargo.cantidad_errores),
            h('p', { class: 'text-sm text-gray-600' }, 'Errores'),
          ]),
          h('div', { class: 'bg-purple-50 rounded-lg p-4 border border-purple-200' }, [
            h('p', { class: 'text-2xl font-bold text-purple-600' }, `${porcentajeValidez()}%`),
            h('p', { class: 'text-sm text-gray-600' }, 'Validez'),
          ]),
        ]),

        // Barra de progreso
        h('div', { class: 'space-y-2' }, [
          h('div', { class: 'flex justify-between text-sm' }, [
            h('span', { class: 'text-gray-700 font-medium' }, 'Distribución'),
            h('span', { class: 'text-gray-600' }, `${porcentajeValidez()}% válido`),
          ]),
          h('div', { class: 'w-full bg-gray-200 rounded-full h-3 overflow-hidden flex' }, [
            h('div', {
              class: 'bg-green-600',
              style: `width: ${porcentajeValidez()}%`,
            }),
            h('div', {
              class: 'bg-red-600',
              style: `width: ${100 - porcentajeValidez()}%`,
            }),
          ]),
        ]),

        // Información del usuario
        h('div', { class: 'bg-gray-50 rounded-lg p-4 border border-gray-200' }, [
          h('h3', { class: 'font-semibold text-gray-900 mb-2' }, 'Información de carga'),
          h('div', { class: 'grid grid-cols-2 gap-4 text-sm' }, [
            h('div', [
              h('p', { class: 'text-gray-600' }, 'Cargado por:'),
              h('p', { class: 'font-medium text-gray-900' }, props.cargo.usuario?.nombre || '-'),
            ]),
            h('div', [
              h('p', { class: 'text-gray-600' }, 'Email:'),
              h('p', { class: 'font-medium text-gray-900' }, props.cargo.usuario?.email || '-'),
            ]),
            h('div', [
              h('p', { class: 'text-gray-600' }, 'Estado:'),
              h('span', {
                class: `inline-block px-2 py-1 rounded text-xs font-medium ${
                  props.cargo.estado === 'procesado'
                    ? 'bg-green-100 text-green-800'
                    : props.cargo.estado === 'revertido'
                      ? 'bg-gray-100 text-gray-800'
                      : 'bg-yellow-100 text-yellow-800'
                }`,
              }, props.cargo.estado),
            ]),
            props.cargo.estado === 'revertido' &&
              h('div', [
                h('p', { class: 'text-gray-600' }, 'Revertido por:'),
                h('p', { class: 'font-medium text-gray-900' }, props.cargo.usuarioReversion?.nombre || '-'),
              ]),
          ]),
        ]),

        // Errores si los hay
        props.cargo.errores_json && props.cargo.errores_json.length > 0 &&
          h('div', { class: 'bg-red-50 rounded-lg p-4 border border-red-200' }, [
            h('h3', { class: 'font-semibold text-red-900 mb-2' }, 'Errores detectados:'),
            h(
              'ul',
              { class: 'space-y-1 text-sm text-red-700' },
              props.cargo.errores_json.slice(0, 10).map((error: any) =>
                h('li', { class: 'flex gap-2' }, [
                  h('span', {}, '•'),
                  h('span', {}, `Fila ${error.fila}: ${error.mensaje}`),
                ])
              )
            ),
            props.cargo.errores_json.length > 10 &&
              h('p', { class: 'text-sm text-red-700 mt-2 font-medium' }, [
                `...y ${props.cargo.errores_json.length - 10} errores más`,
              ]),
          ]),

        // Cambios realizados
        props.cargo.cambios_json && props.cargo.cambios_json.length > 0 &&
          h('div', { class: 'bg-blue-50 rounded-lg p-4 border border-blue-200' }, [
            h('h3', { class: 'font-semibold text-blue-900 mb-3' }, 'Productos afectados:'),
            h(
              'div',
              { class: 'space-y-2' },
              props.cargo.cambios_json.slice(0, 10).map((cambio: any) =>
                h('div', { class: 'bg-white rounded p-2 text-sm' }, [
                  h('div', { class: 'flex justify-between items-start' }, [
                    h('div', [
                      h('p', { class: 'font-medium text-gray-900' }, cambio.producto_nombre),
                      h('p', { class: 'text-xs text-gray-500' }, `Fila ${cambio.fila}`),
                    ]),
                    h('span', {
                      class: `inline-block px-2 py-1 rounded text-xs font-medium ${
                        cambio.accion === 'creado'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-blue-100 text-blue-800'
                      }`,
                    }, cambio.accion),
                  ]),
                  h('div', { class: 'mt-2 text-xs text-gray-600' }, [
                    h('p', {}, [
                      'Stock anterior: ',
                      h('span', { class: 'font-medium' }, cambio.stock_anterior),
                      ' → Nuevo: ',
                      h('span', { class: 'font-medium' }, cambio.stock_nuevo),
                    ]),
                  ]),
                ])
              )
            ),
            props.cargo.cambios_json.length > 10 &&
              h('p', { class: 'text-sm text-blue-700 mt-2 font-medium' }, [
                `...y ${props.cargo.cambios_json.length - 10} productos más`,
              ]),
          ]),

        // Información de reversión
        props.cargo.estado === 'revertido' &&
          h('div', { class: 'bg-gray-100 rounded-lg p-4 border border-gray-300' }, [
            h('h3', { class: 'font-semibold text-gray-900 mb-2' }, 'Reversión'),
            h('div', { class: 'text-sm space-y-2' }, [
              h('p', [
                h('span', { class: 'text-gray-600' }, 'Fecha: '),
                h('span', { class: 'font-medium' }, formatFecha(props.cargo.fecha_reversion!)),
              ]),
              props.cargo.motivo_reversion &&
                h('p', [
                  h('span', { class: 'text-gray-600' }, 'Motivo: '),
                  h('span', { class: 'font-medium' }, props.cargo.motivo_reversion),
                ]),
            ]),
          ]),

        // Botones
        h('div', { class: 'flex gap-3 justify-end' }, [
          h(
            'button',
            {
              type: 'button',
              class: 'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium',
              onClick: () => emit('cerrar'),
            },
            'Cerrar'
          ),
          props.cargo.estado === 'procesado' &&
            h(
              'button',
              {
                type: 'button',
                class: 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium',
                onClick: () => emit('revertir', props.cargo),
              },
              'Revertir carga'
            ),
        ]),
      ]);
  },
});
