import { useState, useCallback, useMemo } from 'react';
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
  const [archivo, setArchivo] = useState<File | null>(null);
  const [contenidoCSV, setContenidoCSV] = useState<string>('');
  const [filas, setFilas] = useState<FilaProductoValidada[]>([]);
  const [paso, setPaso] = useState<'carga' | 'validacion' | 'confirmacion' | 'procesando' | 'resultado'>('carga');
  const [progreso, setProgreso] = useState(0);
  const [erroresGlobales, setErroresGlobales] = useState<string[]>([]);
  const [resultadoProcesamiento, setResultadoProcesamiento] = useState<ResultadoProductosMasivos | null>(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState<string | null>(null);

  // Computed values
  const puedeValidar = useMemo(() => !cargando && filas.length > 0, [cargando, filas]);

  const puedeConfirmar = useMemo(
    () => paso === 'validacion' && filas.some((f) => f.validacion.es_valido) && !cargando,
    [paso, filas, cargando]
  );

  const filasValidas = useMemo(() => filas.filter((f) => f.validacion.es_valido), [filas]);

  const filasConErrores = useMemo(() => filas.filter((f) => !f.validacion.es_valido), [filas]);

  const porcentajeValidez = useMemo(() => {
    if (filas.length === 0) return 0;
    return Math.round((filasValidas.length / filas.length) * 100);
  }, [filas, filasValidas]);

  const resumenValidacion = useMemo(() => {
    const sinProveedor = filas.filter((f) => !f.proveedor_nombre).length;
    const sinUnidad = filas.filter((f) => !f.unidad_medida_nombre).length;
    const sinPrecio = filas.filter((f) => !f.precio_costo && !f.precio_venta).length;
    const sinCodigoBarras = filas.filter((f) => !f.codigo_barra).length;

    return {
      total: filas.length,
      validas: filasValidas.length,
      conErrores: filasConErrores.length,
      advertencias: {
        sinProveedor,
        sinUnidad,
        sinPrecio,
        sinCodigoBarras,
      },
    };
  }, [filas, filasValidas, filasConErrores]);

  // Métodos
  const validarArchivo = useCallback(
    async (file: File): Promise<void> => {
      try {
        setCargando(true);
        setMensajeError(null);
        setErroresGlobales([]);

        setArchivo(file);

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

        setContenidoCSV(texto);

        // Validar estructura
        const validacionEstructura = productosCSVService.validarEstructura(texto);
        if (!validacionEstructura.valido) {
          setErroresGlobales(validacionEstructura.errores);
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
        setFilas(resultadoValidacion.filas_validadas);

        // Ir al paso de validación
        setPaso('validacion');
      } catch (error: any) {
        setMensajeError(error.message || 'Error procesando archivo');
        setPaso('carga');
      } finally {
        setCargando(false);
      }
    },
    []
  );

  const detectarDuplicados = useCallback((): FilaProductoValidada[] => {
    const nombres = new Map<string, FilaProductoValidada[]>();
    const codigosBarras = new Map<string, FilaProductoValidada[]>();

    // Agrupar por nombre y código
    for (const fila of filas) {
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
  }, [filas]);

  const procesarProductos = useCallback(
    async (): Promise<void> => {
      try {
        setCargando(true);
        setMensajeError(null);
        setPaso('procesando');
        setProgreso(0);

        // Preparar datos
        const productosParaProcesar = filasValidas.map((fila) => ({
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
          nombre_archivo: archivo?.name || 'plantilla_productos.csv',
          datos_csv: contenidoCSV,
          productos: productosParaProcesar,
        };

        // Enviar al servidor
        setProgreso(50);

        const resultado = await productosCSVService.procesarProductosMasivos(datos);
        setResultadoProcesamiento(resultado);

        setProgreso(100);
        setPaso('resultado');
      } catch (error: any) {
        setMensajeError(error.message || 'Error procesando productos');
        setPaso('confirmacion');
      } finally {
        setCargando(false);
      }
    },
    [filasValidas, archivo, contenidoCSV]
  );

  const limpiar = useCallback((): void => {
    setArchivo(null);
    setContenidoCSV('');
    setFilas([]);
    setPaso('carga');
    setProgreso(0);
    setErroresGlobales([]);
    setResultadoProcesamiento(null);
    setMensajeError(null);
  }, []);

  const volverAlPaso = useCallback((nuevoPaso: 'carga' | 'validacion' | 'confirmacion'): void => {
    setPaso(nuevoPaso);
    if (nuevoPaso === 'carga') {
      limpiar();
    }
    setMensajeError(null);
  }, [limpiar]);

  return {
    // Estado
    archivo,
    setArchivo,
    contenidoCSV,
    setContenidoCSV,
    filas,
    setFilas,
    paso,
    setPaso,
    progreso,
    setProgreso,
    erroresGlobales,
    setErroresGlobales,
    resultadoProcesamiento,
    setResultadoProcesamiento,
    cargando,
    setCargando,
    mensajeError,
    setMensajeError,

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
