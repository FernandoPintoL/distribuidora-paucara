import { ref, computed } from 'vue';
import {
  DatosProductosMasivos,
  FilaProductoCSV,
  FilaProductoValidada,
  ResultadoProductosMasivos,
  ResultadoValidacion,
} from '@/domain/entities/productos-masivos';
import { productosCSVService } from '@/infrastructure/services/productosCSV.service';

export function useProductosMasivos() {
  // Estado
  const archivo = ref<File | null>(null);
  const contenidoCSV = ref<string>('');
  const filas = ref<FilaProductoValidada[]>([]);
  const paso = ref<'carga' | 'validacion' | 'confirmacion' | 'procesando' | 'resultado'>(
    'carga'
  );
  const progreso = ref(0);
  const erroresGlobales = ref<string[]>([]);
  const resultadoProcesamiento = ref<ResultadoProductosMasivos | null>(null);
  const cargando = ref(false);
  const mensajeError = ref<string | null>(null);

  // Computed
  const puedeValidar = computed(() => {
    return !cargando.value && filas.value.length > 0;
  });

  const puedeConfirmar = computed(() => {
    return (
      paso.value === 'validacion' &&
      filas.value.some((f) => f.validacion.es_valido) &&
      !cargando.value
    );
  });

  const filasValidas = computed(() => {
    return filas.value.filter((f) => f.validacion.es_valido);
  });

  const filasConErrores = computed(() => {
    return filas.value.filter((f) => !f.validacion.es_valido);
  });

  const porcentajeValidez = computed(() => {
    if (filas.value.length === 0) return 0;
    return Math.round((filasValidas.value.length / filas.value.length) * 100);
  });

  const resumenValidacion = computed(() => {
    const sinProveedor = filas.value.filter((f) => !f.proveedor_nombre).length;
    const sinUnidad = filas.value.filter((f) => !f.unidad_medida_nombre).length;
    const sinPrecio = filas.value.filter((f) => !f.precio_costo && !f.precio_venta).length;
    const sinCodigoBarras = filas.value.filter((f) => !f.codigo_barra).length;

    return {
      total: filas.value.length,
      validas: filasValidas.value.length,
      conErrores: filasConErrores.value.length,
      advertencias: {
        sinProveedor,
        sinUnidad,
        sinPrecio,
        sinCodigoBarras,
      },
    };
  });

  // Métodos
  async function validarArchivo(file: File): Promise<void> {
    try {
      cargando.value = true;
      mensajeError.value = null;
      erroresGlobales.value = [];

      archivo.value = file;

      // Validar tamaño (máx 10MB)
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('El archivo no puede exceder 10MB');
      }

      // Validar extensión
      const ext = file.name.split('.').pop()?.toLowerCase();
      const extensionesValidas = ['csv', 'xlsx', 'xls', 'ods'];
      if (!ext || !extensionesValidas.includes(ext)) {
        throw new Error(`Formato no válido. Usa: ${extensionesValidas.join(', ')}`);
      }

      // Leer archivo
      const texto = await file.text();
      if (!texto.trim()) {
        throw new Error('El archivo está vacío');
      }

      contenidoCSV.value = texto;

      // Validar estructura
      const validacionEstructura = productosCSVService.validarEstructura(texto);
      if (!validacionEstructura.valido) {
        erroresGlobales.value = validacionEstructura.errores;
        throw new Error('Estructura del CSV inválida');
      }

      // Parsear CSV
      const filasRaw = productosCSVService.parsearCSV(texto);
      if (filasRaw.length === 0) {
        throw new Error('El CSV no contiene datos');
      }

      if (filasRaw.length > 5000) {
        throw new Error('El archivo contiene más de 5000 filas');
      }

      // Validar filas
      const resultadoValidacion = await productosCSVService.validarFilas(filasRaw);
      filas.value = resultadoValidacion.filas_validadas;

      // Ir al paso de validación
      paso.value = 'validacion';
    } catch (error: any) {
      mensajeError.value = error.message || 'Error procesando archivo';
      paso.value = 'carga';
    } finally {
      cargando.value = false;
    }
  }

  function detectarDuplicados(): FilaProductoValidada[] {
    const nombres = new Map<string, FilaProductoValidada[]>();
    const codigosBarras = new Map<string, FilaProductoValidada[]>();

    // Agrupar por nombre y código
    for (const fila of filas.value) {
      const nombreNorm = productosCSVService.normalizarTexto(fila.nombre);
      if (nombreNorm) {
        if (!nombres.has(nombreNorm)) {
          nombres.set(nombreNorm, []);
        }
        nombres.get(nombreNorm)!.push(fila);
      }

      if (fila.codigo_barra) {
        if (!codigosBarras.has(fila.codigo_barra)) {
          codigosBarras.set(fila.codigo_barra, []);
        }
        codigosBarras.get(fila.codigo_barra)!.push(fila);
      }
    }

    // Encontrar duplicados
    const duplicados: FilaProductoValidada[] = [];
    for (const grupo of nombres.values()) {
      if (grupo.length > 1) {
        duplicados.push(...grupo.slice(1));
      }
    }
    for (const grupo of codigosBarras.values()) {
      if (grupo.length > 1) {
        duplicados.push(...grupo.slice(1));
      }
    }

    return duplicados;
  }

  async function procesarProductos(): Promise<void> {
    try {
      cargando.value = true;
      mensajeError.value = null;
      paso.value = 'procesando';
      progreso.value = 0;

      // Preparar datos
      const productosParaProcesar = filasValidas.value.map((fila) => ({
        nombre: fila.nombre,
        descripcion: fila.descripcion,
        sku: fila.sku,
        codigo_barra: fila.codigo_barra,
        proveedor_nombre: fila.proveedor_nombre,
        unidad_medida_nombre: fila.unidad_medida_nombre,
        cantidad: fila.cantidad,
        precio_costo: fila.precio_costo,
        precio_venta: fila.precio_venta,
        lote: fila.lote,
        fecha_vencimiento: fila.fecha_vencimiento,
        categoria_nombre: fila.categoria_nombre,
        marca_nombre: fila.marca_nombre,
      }));

      const datos: DatosProductosMasivos = {
        nombre_archivo: archivo.value?.name || 'plantilla_productos.csv',
        datos_csv: contenidoCSV.value,
        productos: productosParaProcesar,
      };

      // Enviar al servidor
      progreso.value = 50;

      const resultado = await productosCSVService.procesarProductosMasivos(datos);
      resultadoProcesamiento.value = resultado;

      progreso.value = 100;
      paso.value = 'resultado';
    } catch (error: any) {
      mensajeError.value = error.message || 'Error procesando productos';
      paso.value = 'confirmacion';
    } finally {
      cargando.value = false;
    }
  }

  function limpiar(): void {
    archivo.value = null;
    contenidoCSV.value = '';
    filas.value = [];
    paso.value = 'carga';
    progreso.value = 0;
    erroresGlobales.value = [];
    resultadoProcesamiento.value = null;
    mensajeError.value = null;
  }

  function volverAlPaso(nuevoPaso: 'carga' | 'validacion' | 'confirmacion'): void {
    paso.value = nuevoPaso;
    if (nuevoPaso === 'carga') {
      limpiar();
    }
    mensajeError.value = null;
  }

  return {
    // Estado
    archivo,
    contenidoCSV,
    filas,
    paso,
    progreso,
    erroresGlobales,
    resultadoProcesamiento,
    cargando,
    mensajeError,

    // Computed
    puedeValidar,
    puedeConfirmar,
    filasValidas,
    filasConErrores,
    porcentajeValidez,
    resumenValidacion,

    // Métodos
    validarArchivo,
    detectarDuplicados,
    procesarProductos,
    limpiar,
    volverAlPaso,
  };
}
