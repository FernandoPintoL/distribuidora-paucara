import { defineComponent, h } from 'vue';

export default defineComponent({
  name: 'ModoImportacionProductos',
  props: {
    onArchivoSeleccionado: {
      type: Function,
      required: true,
    },
    onDescargarPlantilla: {
      type: Function,
      required: true,
    },
    cargando: Boolean,
  },
  emits: ['archivo-seleccionado', 'descargar-plantilla'],
  setup(props, { emit }) {
    let inputFile: HTMLInputElement | null = null;

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) {
        e.dataTransfer.dropEffect = 'copy';
      }
    };

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();

      if (e.dataTransfer?.files) {
        const file = e.dataTransfer.files[0];
        if (file) {
          props.onArchivoSeleccionado(file);
        }
      }
    };

    const handleFileInput = (e: Event) => {
      const target = e.target as HTMLInputElement;
      if (target.files?.[0]) {
        props.onArchivoSeleccionado(target.files[0]);
      }
    };

    const handleClick = () => {
      inputFile?.click();
    };

    return () =>
      h('div', { class: 'space-y-6' }, [
        // Zona de drop/click
        h(
          'div',
          {
            class:
              'border-2 border-dashed border-blue-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition',
            onDragover: handleDragOver,
            onDrop: handleDrop,
            onClick: handleClick,
          },
          [
            h('svg', {
              class: 'w-12 h-12 mx-auto text-gray-400 mb-4',
              fill: 'none',
              stroke: 'currentColor',
              viewBox: '0 0 24 24',
              innerHTML:
                '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>',
            }),
            h('p', { class: 'text-lg font-medium text-gray-700 mb-2' }, [
              'Arrastra el archivo CSV o XLSX aquí',
            ]),
            h('p', { class: 'text-sm text-gray-500' }, [
              'O haz clic para seleccionar un archivo',
            ]),
            h('input', {
              ref: (el: any) => {
                inputFile = el;
              },
              type: 'file',
              accept: '.csv,.xlsx,.xls,.ods',
              style: { display: 'none' },
              onChange: handleFileInput,
              disabled: props.cargando,
            }),
          ]
        ),

        // Botón descargar plantilla
        h(
          'button',
          {
            type: 'button',
            class:
              'w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 font-medium',
            onClick: () => props.onDescargarPlantilla(),
            disabled: props.cargando,
          },
          'Descargar Plantilla CSV'
        ),

        // Info
        h('div', { class: 'bg-blue-50 border border-blue-200 rounded-md p-4' }, [
          h('p', { class: 'text-sm text-blue-700' }, [
            '📝 Usa la plantilla descargada para asegurar el formato correcto.',
          ]),
          h('p', { class: 'text-sm text-blue-700 mt-2' }, [
            '⚠️ Máximo 5000 filas y 10MB de tamaño.',
          ]),
        ]),
      ]);
  },
});
