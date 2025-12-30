import { defineComponent, h } from 'vue';
import { ResultadoProductosMasivos } from '@/domain/entities/productos-masivos';

export default defineComponent({
  name: 'ProgresoProductos',
  props: {
    progreso: Number,
    resultado: Object as () => ResultadoProductosMasivos | null,
    cargando: Boolean,
    error: String,
  },
  emits: ['nuevamente', 'ir-historial'],
  setup(props, { emit }) {
    const mostrarResultado = !props.cargando && props.resultado;
    const exitoso = props.resultado?.cantidad_procesados === props.resultado?.cantidad_total;

    return () =>
      h('div', { class: 'space-y-6' }, [
        props.cargando &&
          h('div', { class: 'space-y-4' }, [
            h('h2', { class: 'text-xl font-bold text-gray-900' }, 'Procesando carga masiva...'),
            h('div', { class: 'space-y-2' }, [
              h('div', { class: 'flex justify-between text-sm' }, [
                h('span', { class: 'text-gray-700' }, 'Progreso'),
                h('span', { class: 'font-medium' }, `${props.progreso}%`),
              ]),
              h('div', { class: 'w-full bg-gray-200 rounded-full h-4 overflow-hidden' }, [
                h('div', {
                  class: 'bg-blue-600 h-4 rounded-full transition-all duration-300',
                  style: `width: ${props.progreso}%`,
                }),
              ]),
            ]),
            h('p', { class: 'text-center text-gray-600 text-sm mt-4' }, [
              '⏳ Esto puede tomar unos momentos...',
            ]),
          ]),

        mostrarResultado &&
          h('div', { class: 'space-y-4' }, [
            exitoso
              ? h('div', { class: 'bg-green-50 border border-green-200 rounded-lg p-6' }, [
                  h('div', { class: 'flex items-center gap-3 mb-4' }, [
                    h('span', { class: 'text-3xl' }, '✅'),
                    h('h2', { class: 'text-xl font-bold text-green-900' }, 'Carga completada exitosamente'),
                  ]),
                  h('div', { class: 'space-y-2 text-sm text-green-800' }, [
                    h('p', [
                      h('span', { class: 'font-medium' }, `${props.resultado!.cantidad_procesados} productos`),
                      ' fueron importados exitosamente',
                    ]),
                  ]),
                ])
              : h('div', { class: 'bg-yellow-50 border border-yellow-200 rounded-lg p-6' }, [
                  h('div', { class: 'flex items-center gap-3 mb-4' }, [
                    h('span', { class: 'text-3xl' }, '⚠️'),
                    h('h2', { class: 'text-xl font-bold text-yellow-900' }, 'Carga completada con errores'),
                  ]),
                  h('div', { class: 'space-y-3 text-sm text-yellow-800' }, [
                    h('div', { class: 'flex justify-between' }, [
                      h('span', {}, 'Procesados correctamente:'),
                      h('span', { class: 'font-bold' }, props.resultado!.cantidad_procesados),
                    ]),
                    h('div', { class: 'flex justify-between' }, [
                      h('span', {}, 'Con errores:'),
                      h('span', { class: 'font-bold text-red-600' }, props.resultado!.cantidad_errores),
                    ]),
                  ]),
                ]),

            props.resultado!.cantidad_errores > 0 &&
              h('div', { class: 'bg-red-50 border border-red-200 rounded-lg p-4' }, [
                h('h3', { class: 'font-bold text-red-900 mb-2' }, 'Errores detectados:'),
                h(
                  'ul',
                  { class: 'space-y-1 text-sm text-red-800' },
                  props.resultado!.errores.slice(0, 5).map((error) =>
                    h('li', { class: 'flex gap-2' }, [
                      h('span', {}, '•'),
                      h('span', {}, `Fila ${error.fila}: ${error.mensaje}`),
                    ])
                  )
                ),
                props.resultado!.cantidad_errores > 5 &&
                  h('p', { class: 'text-sm text-red-700 mt-2' }, [
                    `...y ${props.resultado!.cantidad_errores - 5} errores más`,
                  ]),
              ]),

            h('div', { class: 'bg-blue-50 border border-blue-200 rounded-lg p-4' }, [
              h('p', { class: 'text-sm text-blue-700' }, [
                '📌 ID de carga: ',
                h('span', { class: 'font-mono font-bold' }, props.resultado!.cargo_id),
              ]),
            ]),

            // Botones
            h('div', { class: 'flex gap-3 justify-end' }, [
              h(
                'button',
                {
                  type: 'button',
                  class:
                    'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium',
                  onClick: () => emit('nuevamente'),
                },
                'Cargar más productos'
              ),
              h(
                'button',
                {
                  type: 'button',
                  class:
                    'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium',
                  onClick: () => emit('ir-historial'),
                },
                'Ver historial de cargas'
              ),
            ]),
          ]),

        props.error &&
          h('div', { class: 'bg-red-50 border border-red-200 rounded-lg p-6' }, [
            h('div', { class: 'flex items-center gap-3 mb-4' }, [
              h('span', { class: 'text-3xl' }, '❌'),
              h('h2', { class: 'text-xl font-bold text-red-900' }, 'Error en la carga'),
            ]),
            h('p', { class: 'text-red-700 mb-4' }, props.error),
            h('button', {
              type: 'button',
              class: 'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium',
              onClick: () => emit('nuevamente'),
            },
            'Intentar nuevamente'),
          ]),
      ]);
  },
});
