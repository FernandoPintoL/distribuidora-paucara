import {
  DatosProductosMasivos,
  ErroresDetectados,
  FilaProductoCSV,
  FilaProductoValidada,
  ResultadoProductosMasivos,
  ResultadoValidacion,
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

    // Formatos soportados: DD/MM/YYYY, DD-MM-YYYY, YYYY-MM-DD
    const formatos = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{2})-(\d{2})-(\d{4})$/, // DD-MM-YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/, // YYYY-MM-DD (retornar tal cual)
    ];

    for (const formato of formatos) {
      const match = fechaStr.match(formato);
      if (match) {
        if (formato === formatos[2]) {
          return fechaStr; // Ya está en formato ISO
        }
        const [, dia, mes, año] = match;
        return `${año}-${mes}-${dia}`;
      }
    }

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
      const response = await router.post('/api/productos/importar-masivo', datos, {
        // No usar reload automático
        replace: false,
      } as any);

      return response as ResultadoProductosMasivos;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error(
          `Este archivo ya fue procesado (Carga ID: ${error.response.data.cargo_id})`
        );
      }
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
      'SKU',
      'Código Barras',
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
      'Coca Cola 2L',
      'Gaseosa sabor cola',
      '',
      '7501234567890',
      'Embotelladora Coca Cola',
      'UN',
      '100',
      '8.50',
      '12.00',
      'LOTE2025A',
      '31/12/2025',
      'Bebidas',
      'Coca Cola',
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
};
