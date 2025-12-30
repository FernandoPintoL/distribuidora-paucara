import { defineComponent, h } from 'vue';
import { CargoCSVProducto } from '@/domain/entities/productos-masivos';

export default defineComponent({
  name: 'HistorialTabla',
  props: {
    cargas: {
      type: Array as () => CargoCSVProducto[],
      required: true,
    },
    cargando: Boolean,
  },
  emits: ['ver-detalle', 'revertir'],
  setup(props, { emit }) {
    const getBadgeEstado = (estado: string) => {
      const badges: { [key: string]: string } = {
        procesado: 'bg-green-100 text-green-800',
        pendiente: 'bg-yellow-100 text-yellow-800',
        cancelado: 'bg-red-100 text-red-800',
        revertido: 'bg-gray-100 text-gray-800',
      };
      return badges[estado] || 'bg-gray-100 text-gray-800';
    };

    const formatFecha = (fecha: string) => {
      return new Date(fecha).toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    return () =>
      h('div', { class: 'overflow-x-auto border rounded-lg' }, [
        h('table', { class: 'w-full text-sm' }, [
          h('thead', { class: 'bg-gray-100 border-b' }, [
            h('tr', [
              h('th', { class: 'px-4 py-3 text-left font-semibold text-gray-700' }, 'Archivo'),
              h('th', { class: 'px-4 py-3 text-left font-semibold text-gray-700' }, 'Fecha'),
              h('th', { class: 'px-4 py-3 text-center font-semibold text-gray-700' }, 'Filas'),
              h('th', { class: 'px-4 py-3 text-center font-semibold text-gray-700' }, 'Válidas'),
              h('th', { class: 'px-4 py-3 text-center font-semibold text-gray-700' }, 'Errores'),
              h('th', { class: 'px-4 py-3 text-left font-semibold text-gray-700' }, 'Estado'),
              h('th', { class: 'px-4 py-3 text-left font-semibold text-gray-700' }, 'Usuario'),
              h('th', { class: 'px-4 py-3 text-center font-semibold text-gray-700' }, 'Acciones'),
            ]),
          ]),
          h(
            'tbody',
            props.cargas.map((cargo) =>
              h('tr', { class: 'border-b hover:bg-gray-50' }, [
                h('td', { class: 'px-4 py-3 font-medium text-gray-900' }, [
                  h('div', { class: 'truncate max-w-xs' }, cargo.nombre_archivo),
                  h('div', { class: 'text-xs text-gray-500 font-mono' }, `ID: ${cargo.id}`),
                ]),
                h('td', { class: 'px-4 py-3 text-gray-600 text-xs' }, formatFecha(cargo.created_at)),
                h('td', { class: 'px-4 py-3 text-center font-medium text-gray-900' }, cargo.cantidad_filas),
                h('td', { class: 'px-4 py-3 text-center text-green-600 font-medium' }, cargo.cantidad_validas),
                h('td', { class: 'px-4 py-3 text-center text-red-600 font-medium' }, cargo.cantidad_errores),
                h('td', { class: 'px-4 py-3' }, [
                  h('span', {
                    class: `inline-block px-2 py-1 rounded text-xs font-medium ${getBadgeEstado(cargo.estado)}`,
                  }, cargo.estado),
                ]),
                h('td', { class: 'px-4 py-3 text-gray-600 text-xs' }, cargo.usuario?.nombre || '-'),
                h('td', { class: 'px-4 py-3 text-center space-x-2 flex justify-center gap-2' }, [
                  h(
                    'button',
                    {
                      type: 'button',
                      class: 'px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 font-medium',
                      onClick: () => emit('ver-detalle', cargo),
                    },
                    'Ver'
                  ),
                  cargo.estado === 'procesado' &&
                    h(
                      'button',
                      {
                        type: 'button',
                        class:
                          'px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 font-medium',
                        onClick: () => emit('revertir', cargo),
                      },
                      'Revertir'
                    ),
                ]),
              ])
            )
          ),
        ]),
      ]);
  },
});
