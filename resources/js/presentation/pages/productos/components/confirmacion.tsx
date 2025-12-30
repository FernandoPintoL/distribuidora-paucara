import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'ConfirmacionProductos',
  props: {
    resumenValidacion: {
      type: Object as () => any,
      required: true,
    },
    cargando: Boolean,
  },
  emits: ['confirmar', 'volver'],
  setup(props, { emit }) {
    const resumen = props.resumenValidacion;

    return () =>
      h('div', { class: 'space-y-6' }, [
        h('h2', { class: 'text-xl font-bold text-gray-900' }, 'Resumen de Carga'),

        // Estadísticas
        h('div', { class: 'bg-gray-50 rounded-lg p-6 border border-gray-200 space-y-4' }, [
          h('div', { class: 'flex justify-between py-2 border-b' }, [
            h('span', { class: 'text-gray-700' }, 'Total de filas'),
            h('span', { class: 'font-bold text-gray-900' }, resumen.total),
          ]),
          h('div', { class: 'flex justify-between py-2 border-b' }, [
            h('span', { class: 'text-green-700' }, '✓ Filas válidas'),
            h('span', { class: 'font-bold text-green-600' }, resumen.validas),
          ]),
          h('div', { class: 'flex justify-between py-2' }, [
            h('span', { class: 'text-red-700' }, '✗ Filas con errores'),
            h('span', { class: 'font-bold text-red-600' }, resumen.conErrores),
          ]),
        ]),

        // Advertencias/Info
        h('div', { class: 'space-y-2' }, [
          resumen.advertencias.sinProveedor > 0 &&
            h('div', { class: 'bg-yellow-50 border border-yellow-200 rounded p-3' }, [
              h('p', { class: 'text-sm text-yellow-700' }, [
                `⚠️ ${resumen.advertencias.sinProveedor} fila(s) sin proveedor - se crearán automáticamente`,
              ]),
            ]),
          resumen.advertencias.sinUnidad > 0 &&
            h('div', { class: 'bg-yellow-50 border border-yellow-200 rounded p-3' }, [
              h('p', { class: 'text-sm text-yellow-700' }, [
                `⚠️ ${resumen.advertencias.sinUnidad} fila(s) sin unidad de medida - se crearán automáticamente`,
              ]),
            ]),
          resumen.advertencias.sinPrecio > 0 &&
            h('div', { class: 'bg-blue-50 border border-blue-200 rounded p-3' }, [
              h('p', { class: 'text-sm text-blue-700' }, [
                `ℹ️ ${resumen.advertencias.sinPrecio} fila(s) sin precio - puede ser actualizado después`,
              ]),
            ]),
          resumen.advertencias.sinCodigoBarras > 0 &&
            h('div', { class: 'bg-blue-50 border border-blue-200 rounded p-3' }, [
              h('p', { class: 'text-sm text-blue-700' }, [
                `ℹ️ ${resumen.advertencias.sinCodigoBarras} fila(s) sin código de barras`,
              ]),
            ]),
        ]),

        // Acción
        h('div', { class: 'bg-blue-50 border border-blue-200 rounded p-4' }, [
          h('p', { class: 'text-sm text-blue-900' }, [
            '📋 Se procesarán ',
            h('span', { class: 'font-bold' }, `${resumen.validas} filas`),
            ' de un total de ',
            h('span', { class: 'font-bold' }, `${resumen.total}`),
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
              onClick: () => emit('volver'),
              disabled: props.cargando,
            },
            'Volver'
          ),
          h(
            'button',
            {
              type: 'button',
              class:
                'px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-bold',
              onClick: () => emit('confirmar'),
              disabled: props.cargando || resumen.validas === 0,
            },
            'Procesar Carga'
          ),
        ]),
      ]);
  },
});
