import { defineComponent, h } from 'vue';
import { FilaProductoValidada } from '@/domain/entities/productos-masivos';

export default defineComponent({
  name: 'VistaPreviewaProductos',
  props: {
    filas: {
      type: Array as () => FilaProductoValidada[],
      required: true,
    },
    mostrarErrores: Boolean,
    porcentajeValidez: Number,
    cargando: Boolean,
  },
  emits: ['analizar-errores', 'analizarErrores', 'confirmar', 'cancelar'],
  setup(props, { emit }) {
    const filasAMostrar = props.filas.slice(0, 10);
    const filasValidas = props.filas.filter((f) => f.validacion.es_valido).length;
    const filasConErrores = props.filas.filter((f) => !f.validacion.es_valido).length;

    return () =>
      h('div', { class: 'space-y-6' }, [
        // Resumen
        h('div', { class: 'grid grid-cols-3 gap-4' }, [
          h('div', { class: 'bg-blue-50 p-4 rounded-md border border-blue-200' }, [
            h('p', { class: 'text-2xl font-bold text-blue-600' }, [props.filas.length]),
            h('p', { class: 'text-sm text-gray-600' }, 'Total de filas'),
          ]),
          h('div', { class: 'bg-green-50 p-4 rounded-md border border-green-200' }, [
            h('p', { class: 'text-2xl font-bold text-green-600' }, [filasValidas]),
            h('p', { class: 'text-sm text-gray-600' }, 'Filas válidas'),
          ]),
          h('div', { class: 'bg-red-50 p-4 rounded-md border border-red-200' }, [
            h('p', { class: 'text-2xl font-bold text-red-600' }, [filasConErrores]),
            h('p', { class: 'text-sm text-gray-600' }, 'Filas con errores'),
          ]),
        ]),

        // Barra de progreso
        h('div', { class: 'space-y-2' }, [
          h('div', { class: 'flex justify-between text-sm' }, [
            h('span', { class: 'text-gray-700' }, 'Validez'),
            h('span', { class: 'font-medium' }, `${props.porcentajeValidez || 0}%`),
          ]),
          h('div', { class: 'w-full bg-gray-200 rounded-full h-3' }, [
            h('div', {
              class:
                props.porcentajeValidez === 100
                  ? 'bg-green-600'
                  : props.porcentajeValidez! >= 50
                    ? 'bg-yellow-600'
                    : 'bg-red-600',
              style: `width: ${props.porcentajeValidez || 0}%`,
              class: 'h-3 rounded-full transition-all duration-300',
            }),
          ]),
        ]),

        // Tabla de preview
        h('div', { class: 'overflow-x-auto border rounded-md' }, [
          h('table', { class: 'w-full text-sm' }, [
            h('thead', { class: 'bg-gray-100 border-b' }, [
              h('tr', [
                h('th', { class: 'px-4 py-2 text-left font-medium text-gray-700' }, '#'),
                h('th', { class: 'px-4 py-2 text-left font-medium text-gray-700' }, 'Producto'),
                h('th', { class: 'px-4 py-2 text-left font-medium text-gray-700' }, 'Cantidad'),
                h('th', { class: 'px-4 py-2 text-left font-medium text-gray-700' }, 'Proveedor'),
                h('th', { class: 'px-4 py-2 text-left font-medium text-gray-700' }, 'Estado'),
              ]),
            ]),
            h(
              'tbody',
              filasAMostrar.map((fila) =>
                h('tr', { class: 'border-b hover:bg-gray-50' }, [
                  h('td', { class: 'px-4 py-2 text-gray-600' }, fila.fila),
                  h('td', { class: 'px-4 py-2' }, [
                    h('div', { class: 'font-medium text-gray-900' }, fila.nombre),
                    fila.codigo_barra &&
                      h('div', { class: 'text-xs text-gray-500' }, `📦 ${fila.codigo_barra}`),
                  ]),
                  h('td', { class: 'px-4 py-2 text-gray-700' }, fila.cantidad),
                  h('td', { class: 'px-4 py-2 text-gray-700' }, fila.proveedor_nombre || '-'),
                  h('td', { class: 'px-4 py-2' }, [
                    fila.validacion.es_valido
                      ? h(
                          'span',
                          { class: 'inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-medium' },
                          '✓ Válida'
                        )
                      : h(
                          'span',
                          { class: 'inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-medium' },
                          '✗ Error'
                        ),
                  ]),
                ])
              )
            ),
          ]),
        ]),

        props.filas.length > 10 &&
          h('p', { class: 'text-sm text-gray-500 text-center' }, [
            `...y ${props.filas.length - 10} filas más`,
          ]),

        // Botones de acción
        h('div', { class: 'flex gap-3 justify-end' }, [
          h(
            'button',
            {
              type: 'button',
              class:
                'px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 font-medium',
              onClick: () => emit('cancelar'),
              disabled: props.cargando,
            },
            'Cancelar'
          ),
          h(
            'button',
            {
              type: 'button',
              class:
                'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium',
              onClick: () => emit('analizar-errores'),
              disabled: props.cargando,
            },
            'Analizar Errores'
          ),
          filasValidas > 0 &&
            h(
              'button',
              {
                type: 'button',
                class:
                  'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium',
                onClick: () => emit('confirmar'),
                disabled: props.cargando || filasValidas === 0,
              },
              'Confirmar Carga'
            ),
        ]),
      ]);
  },
});
