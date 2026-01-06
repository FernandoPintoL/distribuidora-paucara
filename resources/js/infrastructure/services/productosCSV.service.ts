import {
  DatosProductosMasivos,
  ErroresDetectados,
  FilaProductoCSV,
  FilaProductoValidada,
  ResultadoProductosMasivos,
  ResultadoValidacion,
  ValidacionBackendRequest,
  ValidacionBackendResponse,
} from '@/domain/entities/productos-masivos';
import { router } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

/**
 * Servicio para procesar CSVs de productos
 */
export const productosCSVService = {
  /**
   * Normalizar texto para búsqueda (eliminar acentos)
   */
  normalizarTexto(texto: string): string {
    if (!texto) return '';
    return texto
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim();
  },

  /**
   * Convertir fecha en múltiples formatos a formato ISO
   */
  convertirFecha(fechaStr: string): string | null {
    if (!fechaStr) return null;

    // Limpiar espacios
    fechaStr = fechaStr.trim();

    // Formato 1: DD/MM/YYYY o DD-MM-YYYY (fecha completa)
    const formatoCompleto = /^(\d{1,2})([\/-])(\d{1,2})\2(\d{4})$/;
    const matchCompleto = fechaStr.match(formatoCompleto);
    if (matchCompleto) {
      const [, dia, , mes, año] = matchCompleto;
      return `${año}-${mes.padStart(2, '0')}-${dia.padStart(2, '0')}`;
    }

    // Formato 2: YYYY-MM-DD (ISO, retornar tal cual)
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return fechaStr;
    }

    // Formato 3: MM/YYYY o MM-YYYY (solo mes y año - farmacéutico)
    // Convertir al ÚLTIMO día del mes
    const formatoMesAño = /^(\d{1,2})([\/-])(\d{4})$/;
    const matchMesAño = fechaStr.match(formatoMesAño);
    if (matchMesAño) {
      const [, mes, , año] = matchMesAño;
      const mesNum = parseInt(mes, 10);
      const añoNum = parseInt(año, 10);

      // Calcular último día del mes
      const ultimoDia = new Date(añoNum, mesNum, 0).getDate();
      return `${año}-${mes.padStart(2, '0')}-${ultimoDia.toString().padStart(2, '0')}`;
    }

    // Formato 4: M/YYYY o M-YYYY (mes sin padding)
    const formatoMesAñoSinPadding = /^(\d{1,2})([\/-])(\d{4})$/;
    const matchMesAñoSinPadding = fechaStr.match(formatoMesAñoSinPadding);
    if (matchMesAñoSinPadding) {
      const [, mes, , año] = matchMesAñoSinPadding;
      const mesNum = parseInt(mes, 10);
      const añoNum = parseInt(año, 10);

      // Calcular último día del mes
      const ultimoDia = new Date(añoNum, mesNum, 0).getDate();
      const mesPadded = mes.padStart(2, '0');
      return `${año}-${mesPadded}-${ultimoDia.toString().padStart(2, '0')}`;
    }

    // Si no coincide con ningún formato, retornar null
    return null;
  },

  /**
   * Parsear CSV y convertir a array de FilaProductoCSV
   */
  parsearCSV(contenido: string, delimiter: string = ','): FilaProductoCSV[] {
    const lineas = contenido.split('\n').filter((l) => l.trim());
    if (lineas.length < 2) {
      throw new Error('El CSV debe tener al menos un encabezado y una fila de datos');
    }

    // Parsear encabezado
    const encabezado = lineas[0]
      .split(delimiter)
      .map((col) => col.trim().toLowerCase());

    // Mapeo de columnas
    const indiceNombre = encabezado.findIndex((col) =>
      ['nombre', 'nombre producto', 'producto'].includes(col)
    );
    const indiceCantidad = encabezado.findIndex((col) =>
      ['cantidad', 'cantidad inicial'].includes(col)
    );

    if (indiceNombre === -1 || indiceCantidad === -1) {
      throw new Error('El CSV debe tener columnas "Nombre Producto" y "Cantidad"');
    }

    const filas: FilaProductoCSV[] = [];

    // Parsear filas de datos
    for (let i = 1; i < lineas.length; i++) {
      const valores = this.parseearCSVRow(lineas[i], delimiter);

      if (valores.every((v) => !v.trim())) continue; // Skip filas vacías

      const fila: FilaProductoCSV = {
        fila: i + 1,
        nombre: valores[indiceNombre]?.trim() || '',
        cantidad: parseFloat(valores[indiceCantidad]?.trim() || '0') || 0,
      };

      // Asignar otros campos si existen
      for (let j = 0; j < encabezado.length; j++) {
        const col = encabezado[j];
        const valor = valores[j]?.trim() || '';

        if (col === 'descripción' || col === 'descripcion') fila.descripcion = valor || undefined;
        if (col === 'principio activo' || col === 'principio_activo' || col === 'principioactivo')
          fila.principio_activo = valor || undefined;
        if (col === 'uso de medicación' || col === 'uso de medicacion' || col === 'uso_de_medicacion' || col === 'usodemedicacion')
          fila.uso_de_medicacion = valor || undefined;
        if (col === 'sku') fila.sku = valor || undefined;
        if (col === 'código barras' || col === 'codigo barras' || col === 'codigo_barras')
          fila.codigo_barra = valor || undefined;
        if (col === 'proveedor') fila.proveedor_nombre = valor || undefined;
        if (col === 'unidad medida' || col === 'unidad de medida' || col === 'unidad_medida')
          fila.unidad_medida_nombre = valor || undefined;
        if (col === 'precio costo' || col === 'precio_costo')
          fila.precio_costo = parseFloat(valor) || undefined;
        if (col === 'precio venta' || col === 'precio_venta')
          fila.precio_venta = parseFloat(valor) || undefined;
        if (col === 'lote') fila.lote = valor || undefined;
        if (col === 'fecha vencimiento' || col === 'fecha_vencimiento')
          fila.fecha_vencimiento = this.convertirFecha(valor) || undefined;
        if (col === 'categoría' || col === 'categoria') fila.categoria_nombre = valor || undefined;
        if (col === 'marca') fila.marca_nombre = valor || undefined;
        if (col === 'almacén' || col === 'almacen') {
          // Intentar parsear como ID si es numérico, sino como nombre
          if (/^\d+$/.test(valor)) {
            fila.almacen_id = parseInt(valor, 10);
          } else {
            fila.almacen_nombre = valor || undefined;
          }
        }
      }

      filas.push(fila);
    }

    return filas;
  },

  /**
   * Parsear una fila CSV considerando comillas y delimitadores escapados
   */
  parseearCSVRow(fila: string, delimiter: string = ','): string[] {
    const valores: string[] = [];
    let valor = '';
    let entreComillas = false;

    for (let i = 0; i < fila.length; i++) {
      const char = fila[i];
      const charSiguiente = fila[i + 1];

      if (char === '"') {
        if (entreComillas && charSiguiente === '"') {
          // Comilla escapada
          valor += '"';
          i++;
        } else {
          // Toggle entreComillas
          entreComillas = !entreComillas;
        }
      } else if (char === delimiter && !entreComillas) {
        valores.push(valor);
        valor = '';
      } else {
        valor += char;
      }
    }

    valores.push(valor);
    return valores;
  },

  /**
   * Validar estructura del archivo CSV
   */
  validarEstructura(contenido: string): { valido: boolean; errores: string[] } {
    const errores: string[] = [];
    const lineas = contenido.split('\n').filter((l) => l.trim());

    if (lineas.length < 2) {
      errores.push('El CSV debe tener al menos un encabezado y una fila de datos');
      return { valido: false, errores };
    }

    // Verificar columnas obligatorias en el encabezado
    const encabezado = lineas[0].toLowerCase();
    const tieneNombre =
      encabezado.includes('nombre') ||
      encabezado.includes('producto') ||
      encabezado.includes('nombre producto');
    const tieneCantidad = encabezado.includes('cantidad');

    if (!tieneNombre) {
      errores.push('Falta columna obligatoria: "Nombre Producto"');
    }
    if (!tieneCantidad) {
      errores.push('Falta columna obligatoria: "Cantidad"');
    }

    return {
      valido: errores.length === 0,
      errores,
    };
  },

  /**
   * Validar filas contra reglas de negocio
   */
  async validarFilas(filas: FilaProductoCSV[]): Promise<ResultadoValidacion> {
    const filasValidadas: FilaProductoValidada[] = [];
    let cantidadValidas = 0;
    let cantidadErrores = 0;
    const mapaErrores = new Map<string, number>();

    for (const fila of filas) {
      const validacion = {
        es_valido: true,
        errores: [] as string[],
        advertencias: [] as string[],
      };

      // Validar campos obligatorios
      if (!fila.nombre || fila.nombre.trim() === '') {
        validacion.errores.push('Nombre producto es obligatorio');
      }

      if (fila.cantidad === undefined || fila.cantidad === null) {
        validacion.errores.push('Cantidad es obligatoria');
      } else if (fila.cantidad < 0) {
        validacion.errores.push('Cantidad no puede ser negativa');
      }

      // Validar precios
      if (fila.precio_costo !== undefined && fila.precio_costo < 0) {
        validacion.errores.push('Precio costo no puede ser negativo');
      }
      if (fila.precio_venta !== undefined && fila.precio_venta < 0) {
        validacion.errores.push('Precio venta no puede ser negativo');
      }

      // Advertencias
      if (
        fila.precio_costo &&
        fila.precio_venta &&
        fila.precio_venta < fila.precio_costo
      ) {
        validacion.advertencias.push(
          `Precio venta (${fila.precio_venta}) es menor que costo (${fila.precio_costo})`
        );
      }

      if (fila.fecha_vencimiento) {
        const fechaVencimiento = new Date(fila.fecha_vencimiento);
        const hoy = new Date();
        if (fechaVencimiento < hoy) {
          validacion.advertencias.push('La fecha de vencimiento ya pasó');
        }
      }

      // Si hay lote, debe haber fecha de vencimiento
      if (fila.lote && !fila.fecha_vencimiento) {
        validacion.advertencias.push('Si hay lote, se recomienda tener fecha de vencimiento');
      }

      // Actualizar validación
      validacion.es_valido = validacion.errores.length === 0;

      if (validacion.es_valido) {
        cantidadValidas++;
      } else {
        cantidadErrores++;
        validacion.errores.forEach((err) => {
          mapaErrores.set(err, (mapaErrores.get(err) || 0) + 1);
        });
      }

      filasValidadas.push({
        ...fila,
        validacion,
      });
    }

    // Construir resumen de errores
    const resumenErrores = Array.from(mapaErrores.entries())
      .map(([tipo, cantidad]) => ({
        tipo,
        cantidad,
        ejemplos: [tipo],
      }))
      .slice(0, 5);

    return {
      es_valido: cantidadErrores === 0,
      cantidad_filas: filas.length,
      cantidad_validas: cantidadValidas,
      cantidad_errores: cantidadErrores,
      filas_validadas: filasValidadas,
      resumen_errores: resumenErrores,
    };
  },

  /**
   * Procesar productos masivos en el servidor
   */
  async procesarProductosMasivos(datos: DatosProductosMasivos): Promise<ResultadoProductosMasivos> {
    try {
      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      const response = await fetch('/api/productos/importar-masivo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(datos),
      });

      const responseData = await response.json();

      if (!response.ok) {
        // Capturar el mensaje de error del backend
        const errorMessage = responseData.message || 'Error procesando carga masiva';
        const error = new Error(errorMessage);
        (error as any).status = response.status;
        (error as any).data = responseData.data;
        throw error;
      }

      return responseData as ResultadoProductosMasivos;
    } catch (error: any) {
      console.error('Error en procesarProductosMasivos:', error.message);
      throw error;
    }
  },

  /**
   * Obtener historial de cargas
   */
  async obtenerHistorialCargas(pagina = 1, estado = '') {
    const page = usePage();
    const url = `/api/productos/cargas-masivas?page=${pagina}${estado ? `&estado=${estado}` : ''}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(page.props.auth as any)?.token || ''}`,
        },
      });

      if (!response.ok) throw new Error('Error obteniendo historial');

      return await response.json();
    } catch (error) {
      console.error('Error en obtenerHistorialCargas:', error);
      throw error;
    }
  },

  /**
   * Obtener detalle de una carga
   */
  async obtenerDetalleCarga(cargoId: number) {
    const page = usePage();
    const url = `/api/productos/cargas-masivas/${cargoId}`;

    try {
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${(page.props.auth as any)?.token || ''}`,
        },
      });

      if (!response.ok) throw new Error('Error obteniendo carga');

      return await response.json();
    } catch (error) {
      console.error('Error en obtenerDetalleCarga:', error);
      throw error;
    }
  },

  /**
   * Revertir una carga masiva
   */
  async revertirCarga(cargoId: number, motivo = '') {
    const page = usePage();
    const url = `/api/productos/cargas-masivas/${cargoId}/revertir`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${(page.props.auth as any)?.token || ''}`,
        },
        body: JSON.stringify({ motivo }),
      });

      if (!response.ok) throw new Error('Error revirtiendo carga');

      return await response.json();
    } catch (error) {
      console.error('Error en revertirCarga:', error);
      throw error;
    }
  },

  /**
   * Descargar plantilla CSV
   */
  descargarPlantilla(): void {
    const headers = [
      'Nombre Producto',
      'Descripción',
      'Principio Activo',
      'Uso de Medicación',
      'SKU',
      'Código Barras',
      'Almacén',
      'Proveedor',
      'Unidad Medida',
      'Cantidad',
      'Precio Costo',
      'Precio Venta',
      'Lote',
      'Fecha Vencimiento',
      'Categoría',
      'Marca',
    ];

    const ejemplo = [
      'Paracetamol 500mg',
      'Analgésico y antipirético',
      'Paracetamol',
      'Alivio de dolor leve a moderado y reducción de fiebre',
      '',
      '7501234567890',
      'Almacén Central',
      'Laboratorios ABC',
      'TAB',
      '100',
      '8.50',
      '12.00',
      'LOTE2025A',
      '31/12/2025',
      'Medicamentos',
      'Genérico',
    ];

    const filas = [headers, ejemplo];

    // Generar CSV con BOM UTF-8
    const csv = '\uFEFF' + filas.map((fila) => fila.map((v) => `"${v}"`).join(',')).join('\n');

    // Descargar
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', 'plantilla_productos.csv');
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  },

  /**
   * Validar productos con el backend - Detectar existentes + Stock
   */
  async validarConBackend(filas: FilaProductoCSV[]): Promise<ValidacionBackendResponse> {
    try {
      const payload: ValidacionBackendRequest = {
        productos: filas.map(fila => ({
          nombre: fila.nombre,
          codigo_barra: fila.codigo_barra,
          cantidad: fila.cantidad,
          almacen_id: fila.almacen_id,
          almacen_nombre: fila.almacen_nombre,
          lote: fila.lote,
        })),
      };

      const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

      const response = await fetch('/api/productos/validar-csv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'X-CSRF-TOKEN': csrfToken,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error en validación backend');
      }

      return await response.json();
    } catch (error) {
      console.error('Error en validarConBackend:', error);
      throw error;
    }
  },
};
