import { defineComponent, h, ref } from 'vue';
import { CargoCSVProducto } from '@/domain/entities/productos-masivos';

export default defineComponent({
  name: 'ModalRevertir',
  props: {
    cargo: {
      type: Object as () => CargoCSVProducto,
      required: true,
    },
    cargando: Boolean,
  },
  emits: ['confirmar', 'cancelar'],
  setup(props, { emit }) {
    const motivo = ref<string>('');
    const aceptaConservacion = ref<boolean>(false);

    const handleConfirmar = () => {
      if (!aceptaConservacion.value) {
        alert('Debes aceptar que entiendes las consecuencias de la reversión');
        return;
      }
      emit('confirmar', motivo.value);
    };

    return () =>
      h('div', {
        class:
          'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4',
      }, [
        h('div', { class: 'bg-white rounded-lg max-w-md w-full shadow-xl' }, [
          // Encabezado
          h('div', { class: 'bg-red-50 border-b border-red-200 px-6 py-4' }, [
            h('h2', { class: 'text-lg font-bold text-red-900' }, '⚠️ Revertir Carga'),
            h('p', { class: 'text-sm text-red-700 mt-1' }, `ID: ${props.cargo.id}`),
          ]),

          // Contenido
          h('div', { class: 'px-6 py-4 space-y-4' }, [
            // Advertencia
            h('div', { class: 'bg-red-100 border border-red-300 rounded p-3' }, [
              h('p', { class: 'text-sm font-medium text-red-900' }, [
                '⚠️ Esta acción no se puede deshacer',
              ]),
              h('p', { class: 'text-xs text-red-700 mt-2' }, [
                'Se eliminarán los ',
                h('span', { class: 'font-bold' }, props.cargo.cantidad_validas),
                ' productos creados/actualizados.',
              ]),
            ]),

            // Detalles
            h('div', { class: 'bg-gray-50 rounded p-3' }, [
              h('h3', { class: 'text-sm font-semibold text-gray-900 mb-2' }, 'Detalles de la carga:'),
              h('ul', { class: 'text-xs text-gray-700 space-y-1' }, [
                h('li', [
                  h('span', { class: 'text-gray-600' }, 'Archivo: '),
                  h('span', { class: 'font-medium' }, props.cargo.nombre_archivo),
                ]),
                h('li', [
                  h('span', { class: 'text-gray-600' }, 'Productos: '),
                  h('span', { class: 'font-medium' }, props.cargo.cantidad_validas),
                ]),
                h('li', [
                  h('span', { class: 'text-gray-600' }, 'Errores: '),
                  h('span', { class: 'font-medium' }, props.cargo.cantidad_errores),
                ]),
              ]),
            ]),

            // Motivo
            h('div', [
              h('label', { class: 'block text-sm font-medium text-gray-700 mb-1' }, 'Motivo (opcional)'),
              h('textarea', {
                value: motivo.value,
                onInput: (e: any) => {
                  motivo.value = e.target.value;
                },
                placeholder: 'Explica por qué se revierte esta carga...',
                class:
                  'w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500',
                rows: 3,
                disabled: props.cargando,
              }),
            ]),

            // Checkbox
            h('div', { class: 'flex items-start gap-3' }, [
              h('input', {
                type: 'checkbox',
                checked: aceptaConservacion.value,
                onChange: (e: any) => {
                  aceptaConservacion.value = e.target.checked;
                },
                id: 'acepta-reversión',
                class: 'mt-1',
                disabled: props.cargando,
              }),
              h('label', { htmlFor: 'acepta-reversión', class: 'text-sm text-gray-700' }, [
                'Entiendo que se ',
                h('span', { class: 'font-bold text-red-600' }, 'eliminarán'),
                ' todos los productos importados en esta carga',
              ]),
            ]),
          ]),

          // Botones
          h('div', { class: 'bg-gray-50 border-t px-6 py-3 flex gap-3 justify-end' }, [
            h(
              'button',
              {
                type: 'button',
                class:
                  'px-4 py-2 border border-gray-300 rounded-md hover:bg-white font-medium text-gray-700',
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
                  'px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed',
                onClick: handleConfirmar,
                disabled: props.cargando || !aceptaConservacion.value,
              },
              props.cargando ? 'Revirtiendo...' : 'Confirmar reversión'
            ),
          ]),
        ]),
      ]);
  },
});
